import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';

const MARKER_LONGITUDE_OFFSET_DEG = 90;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function ensureTooltipEl() {
  let el = document.querySelector('.location-thumbnail');
  if (el) return el;
  el = document.createElement('div');
  el.className = 'location-thumbnail';
  el.style.position = 'fixed';
  el.style.zIndex = '9999';
  el.style.visibility = 'hidden';
  el.style.opacity = '0';
  document.body.appendChild(el);
  return el;
}

function getIsDarkMode() {
  return document.documentElement.classList.contains('dark-mode');
}

function getNormalizedFootprintsFromStorage() {
  try {
    const raw = localStorage.getItem('websiteData');
    if (!raw) return [];
    const data = JSON.parse(raw);
    const fps = Array.isArray(data.footprints) ? data.footprints : [];
    return fps.map(fp => {
      const place = fp && fp.place && typeof fp.place === 'object' ? fp.place : null;
      const city = place && place.city ? String(place.city) : String(fp.city || '');
      const country = place && place.country ? String(place.country) : String(fp.country || '');
      const lat = place && Number.isFinite(place.lat) ? Number(place.lat) : parseFloat(fp.lat);
      const lng = place && Number.isFinite(place.lng) ? Number(place.lng) : parseFloat(fp.lng);
      const displayName = place && place.displayName
        ? String(place.displayName)
        : `${city}${country ? ', ' + country : ''}`;
      const imageUrl =
        (fp.image && typeof fp.image === 'object' ? (fp.image.url || '') : fp.image) ||
        fp.imageUrl ||
        '';
      return {
        id: fp.id || '',
        name: displayName || 'Unknown',
        lat,
        lng,
        intensity: fp.intensity || 5,
        image: imageUrl,
        date: fp.visitedAt || fp.year || '',
        description: fp.description || ''
      };
    }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  } catch (e) {
    console.warn('Footprints globe: failed to parse websiteData', e);
    return [];
  }
}

function latLngToVector3(lat, lng, radius) {
  const latRad = THREE.MathUtils.degToRad(lat);
  const lngRad = THREE.MathUtils.degToRad(lng);
  const cosLat = Math.cos(latRad);
  const x = radius * cosLat * Math.sin(lngRad);
  const y = radius * Math.sin(latRad);
  const z = radius * cosLat * Math.cos(lngRad);
  return new THREE.Vector3(x, y, z);
}

function getSunDirection() {
  // Keep the sunlight direction stable in world space; the Earth rotates beneath it.
  return new THREE.Vector3(0, 0, 1).normalize();
}

function getEarthUtcRotation(date = new Date()) {
  const utcHours =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;
  const subsolarLongitudeDeg = (12 - utcHours) * 15;
  return -THREE.MathUtils.degToRad(subsolarLongitudeDeg);
}

class FootprintsGlobe {
  constructor({ canvas, container }) {
    this.canvas = canvas;
    this.container = container;
    this.renderer = null;
    this.scene = new THREE.Scene();
    this.camera = null;
    this.controls = null;
    this.clock = new THREE.Clock();
    this.autoRotate = true;
    this.autoRotateSpeed = 0.075; // slower and softer
    this.userInteractingUntil = 0;
    this.isCoarsePointer = !!(
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0)
    );
    this.pointerDownInfo = null;

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
    this.planetGroup = new THREE.Group();
    this.globeGroup.add(this.planetGroup);

    this.earth = null;
    this.nightLights = null;
    this.clouds = null;
    this.atmosphere = null;
    this.sunDir = new THREE.Vector3(1, 0, 0);
    this.sunLight = null;

    this.pointsGroup = new THREE.Group();
    this.planetGroup.add(this.pointsGroup);
    this.points = [];
    this.interactivePoints = [];

    this.raycaster = new THREE.Raycaster();
    this.mouseNdc = new THREE.Vector2(10, 10);
    this.hovered = null;
    this.tooltip = ensureTooltipEl();
    this.tooltipPinnedUntil = 0;
    this.pinnedData = null;
    this.pinnedMarker = null;
    this.tooltipHost = document.body;
    this._tooltipCloseHandler = null;

    this._raf = 0;
    this._onResize = () => this.resize();
    this._onPointerMove = (e) => this.onPointerMove(e);
    this._onPointerLeave = () => this.hideTooltip();
    this._onPointerEnter = () => { this.userInteractingUntil = Date.now() + 1500; this.setAutoRotate(false); };
    this._onCanvasLeave = () => { this.hideTooltip(); this.userInteractingUntil = Date.now() + 1500; };
    this._onClick = () => this.onClick();
    this._onPointerDownCanvas = (e) => this.onPointerDownCanvas(e);
    this._onPointerUpCanvas = (e) => this.onPointerUpCanvas(e);
    this._onPointerDown = () => { this.userInteractingUntil = Date.now() + 12000; this.setAutoRotate(false); };
    this._onPointerUp = () => { this.userInteractingUntil = Date.now() + 12000; };
    this._onFullscreenChange = () => this.handleFullscreenChange();
    this._markerScaleBaselineDistance = 3.2;
  }

  async init() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.canvas.style.cursor = 'grab';

    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);
    this.scene.add(this.camera);

    const ambient = new THREE.AmbientLight(0xffffff, 0.28);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x9fc7ff, 0x060b14, 0.32);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 0.55);
    dir.position.set(5, 2, 5);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x8db8ff, 0.18);
    fill.position.set(-4, 2, -1.5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x2d95ff, 0.24);
    rim.position.set(-2, 3, 6);
    this.scene.add(rim);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 0.01);
    this.sunLight.position.set(5, 2, 5);
    this.scene.add(this.sunLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 1.45;
    this.controls.maxDistance = 6.8;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.85;
    this.controls.minPolarAngle = Math.PI * 0.14;
    this.controls.maxPolarAngle = Math.PI * 0.86;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.addEventListener('start', this._onPointerDown);
    this.controls.addEventListener('end', this._onPointerUp);

    await this.loadEarth();

    window.addEventListener('resize', this._onResize);
    this.canvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerenter', this._onPointerEnter, { passive: true });
    this.canvas.addEventListener('pointerleave', this._onCanvasLeave, { passive: true });
    this.canvas.addEventListener('pointerdown', this._onPointerDownCanvas, { passive: true });
    this.canvas.addEventListener('pointerup', this._onPointerUpCanvas, { passive: true });
    this.canvas.addEventListener('click', this._onClick, { passive: true });
    document.addEventListener('fullscreenchange', this._onFullscreenChange);
    this.handleFullscreenChange();

    this.resize();
    this.start();
  }

  async loadEarth() {
    const loader = new THREE.TextureLoader();
    const [dayTex, nightTex, cloudsTex, _normalTex, specularTex] = await Promise.all([
      loader.loadAsync('assets/earth/earth_day.jpg'),
      loader.loadAsync('assets/earth/earth_night.jpg'),
      loader.loadAsync('assets/earth/earth_clouds.jpg'),
      loader.loadAsync('assets/earth/earth_normal.png'),
      loader.loadAsync('assets/earth/earth_specular.png')
    ]);
    dayTex.colorSpace = THREE.SRGBColorSpace;
    nightTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    [dayTex, nightTex, cloudsTex, specularTex].forEach((tex) => {
      tex.anisotropy = anisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });
    specularTex.colorSpace = THREE.NoColorSpace;

    const radius = 1.0;
    const geom = new THREE.SphereGeometry(radius, 96, 96);

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDayTexture: { value: dayTex },
        uNightTexture: { value: nightTex },
        uSpecularTexture: { value: specularTex },
        uCloudsTexture: { value: cloudsTex },
        uAtmosphereDayColor: { value: new THREE.Color('#00aaff') },
        uAtmosphereTwilightColor: { value: new THREE.Color('#000000') },
        uSunDirection: { value: this.sunDir.clone() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uDayTexture;
        uniform sampler2D uNightTexture;
        uniform sampler2D uSpecularTexture;
        uniform sampler2D uCloudsTexture;
        uniform vec3 uAtmosphereDayColor;
        uniform vec3 uAtmosphereTwilightColor;
        uniform vec3 uSunDirection;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;

        void main() {
          vec3 dayColor = texture2D(uDayTexture, vUv).rgb;
          vec3 nightColor = texture2D(uNightTexture, vUv).rgb;
          float specularStrength = texture2D(uSpecularTexture, vUv).r;
          float cloudsMask = texture2D(uCloudsTexture, vUv).g;

          vec3 normal = normalize(vNormalW);
          vec3 sunDir = normalize(uSunDirection);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);

          float sunOrientation = dot(normal, sunDir);
          float dayMix = smoothstep(-0.25, 0.5, sunOrientation);
          float twilightMix = smoothstep(-0.5, 1.0, sunOrientation);

          vec3 color = mix(nightColor + dayColor * 0.06, dayColor, dayMix);

          vec3 reflection = reflect(-sunDir, normal);
          float specular = pow(max(dot(reflection, viewDir), 0.0), 80.0);
          specular *= specularStrength;
          specular *= smoothstep(0.0, 0.35, sunOrientation);
          color += vec3(1.0) * specular * 0.85;

          float cloudsMix = smoothstep(0.5, 1.0, cloudsMask);
          cloudsMix *= dayMix;
          color = mix(color, vec3(1.0), cloudsMix * 0.75);

          float fresnel = dot(-viewDir, normal) + 1.0;
          fresnel = pow(fresnel, 2.4);
          vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, twilightMix);
          color += atmosphereColor * fresnel * 0.008;

          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    this.earth = new THREE.Mesh(geom, mat);
    this.planetGroup.add(this.earth);

    this.nightLights = null;

    // Clouds
    const cloudGeom = new THREE.SphereGeometry(radius * 1.012, 96, 96);
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        uClouds: { value: cloudsTex },
        uSunDir: { value: this.sunDir.clone() },
        uOpacity: { value: getIsDarkMode() ? 0.34 : 0.16 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        void main() {
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uClouds;
        uniform vec3 uSunDir;
        uniform float uOpacity;
        varying vec2 vUv;
        varying vec3 vNormalW;
        void main() {
          vec4 tex = texture2D(uClouds, vUv);
          float daylight = clamp(dot(normalize(vNormalW), normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
          float cloudMask = max(tex.a, ((tex.r + tex.g + tex.b) / 3.0) * 0.15);
          cloudMask = smoothstep(0.22, 0.82, cloudMask);
          float alpha = cloudMask * uOpacity * daylight;
          gl_FragColor = vec4(vec3(1.0), alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.clouds = new THREE.Mesh(cloudGeom, cloudMat);
    this.planetGroup.add(this.clouds);

    // Atmosphere glow (back-side)
    const atmGeom = new THREE.SphereGeometry(radius * 1.048, 96, 96);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: {
        uStrength: { value: 0.12 },
        uSunDirection: { value: this.sunDir.clone() },
        uAtmosphereDayColor: { value: new THREE.Color('#00aaff') },
        uAtmosphereTwilightColor: { value: new THREE.Color('#000000') }
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main(){
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uStrength;
        uniform vec3 uSunDirection;
        uniform vec3 uAtmosphereDayColor;
        uniform vec3 uAtmosphereTwilightColor;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main(){
          vec3 normal = normalize(vNormalW);
          vec3 viewDirection = normalize(vWorldPos - cameraPosition);
          float sunOrientation = dot(uSunDirection, normal);
          float atmosphereDayMix = smoothstep(-0.2, 0.55, sunOrientation);
          vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);
          float fresnel = dot(viewDirection, normal) + 1.0;
          fresnel = pow(fresnel, 4.8);
          vec3 col = atmosphereColor * fresnel * uStrength;
          gl_FragColor = vec4(col, fresnel * uStrength * 0.7);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false
    });
    this.atmosphere = new THREE.Mesh(atmGeom, atmMat);
    this.planetGroup.add(this.atmosphere);

    // Default hero angle: show Asia-Pacific first.
    this.globeGroup.rotation.y = THREE.MathUtils.degToRad(-120);
    this.pointsGroup.rotation.y = THREE.MathUtils.degToRad(MARKER_LONGITUDE_OFFSET_DEG);
  }

  setData(items) {
    // Clear old
    this.pointsGroup.clear();
    this.points = [];
    this.interactivePoints = [];
    this.hovered = null;

    const radius = 1.0;
    const dotGeom = new THREE.SphereGeometry(this.isCoarsePointer ? 0.018 : 0.013, 16, 16);
    const glowGeom = new THREE.SphereGeometry(this.isCoarsePointer ? 0.034 : 0.026, 18, 18);
    const hitGeom = new THREE.SphereGeometry(this.isCoarsePointer ? 0.12 : 0.065, 18, 18);
    const baseColor = new THREE.Color('#5bb6ff');

    for (const it of items || []) {
      const pos = latLngToVector3(it.lat, it.lng, radius * 1.01);
      const scale = clamp(Math.sqrt(it.intensity || 5) / 3.2, this.isCoarsePointer ? 0.85 : 0.55, this.isCoarsePointer ? 2.2 : 1.8);
      const marker = new THREE.Group();
      marker.position.copy(pos);
      marker.lookAt(new THREE.Vector3(0, 0, 0));
      marker.userData = it;

      const mat = new THREE.MeshStandardMaterial({
        color: baseColor,
        emissive: baseColor,
        emissiveIntensity: 1.2,
        roughness: 0.25,
        metalness: 0.2
      });
      const visibleDot = new THREE.Mesh(dotGeom, mat);
      visibleDot.position.set(0, 0, 0);
      visibleDot.scale.setScalar(scale);
      visibleDot.userData = it;
      visibleDot.userData._defaultScale = scale;
      visibleDot.userData._markerGroup = marker;
      marker.add(visibleDot);

      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xbfe8ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const glowDot = new THREE.Mesh(glowGeom, glowMat);
      glowDot.position.set(0, 0, 0);
      glowDot.scale.setScalar(scale);
      glowDot.userData._defaultScale = scale;
      marker.add(glowDot);

      const hitMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const hitDot = new THREE.Mesh(hitGeom, hitMat);
      hitDot.position.set(0, 0, 0);
      hitDot.scale.setScalar(scale);
      hitDot.userData = it;
      hitDot.userData._markerGroup = marker;
      hitDot.userData._visibleDot = visibleDot;
      hitDot.userData._glowDot = glowDot;
      hitDot.userData._defaultScale = scale;
      marker.add(hitDot);

      this.pointsGroup.add(marker);
      this.points.push(visibleDot);
      this.interactivePoints.push(hitDot);
    }
  }

  refreshTheme() {
    if (!this.earth) return;
    if (this.clouds) this.clouds.material.uniforms.uOpacity.value = getIsDarkMode() ? 0.34 : 0.2;
  }

  setAutoRotate(enabled) {
    this.autoRotate = !!enabled;
  }

  start() {
    const loop = () => {
      this._raf = requestAnimationFrame(loop);

      // Update sun direction (slow)
      const now = new Date();
      this.sunDir.copy(getSunDirection(now));
      this.planetGroup.rotation.y = getEarthUtcRotation(now);
      if (this.earth && this.earth.material && this.earth.material.uniforms && this.earth.material.uniforms.uSunDirection) {
        this.earth.material.uniforms.uSunDirection.value.copy(this.sunDir);
      }
      if (this.clouds) this.clouds.material.uniforms.uSunDir.value.copy(this.sunDir);
      if (this.atmosphere) this.atmosphere.material.uniforms.uSunDirection.value.copy(this.sunDir);
      if (this.sunLight) this.sunLight.position.copy(this.sunDir.clone().multiplyScalar(6));

      const dt = this.clock.getDelta();
      // Spin the globe itself so markers stay locked to geography while the planet rotates.
      this.controls.autoRotate = this.autoRotate;

      // Resume auto-rotate if user hasn't interacted for a while and we're not hovering a marker.
      if (Date.now() > this.userInteractingUntil && !this.hovered && !this.isTooltipPinned()) {
        if (!this.autoRotate) this.setAutoRotate(true);
      }

      if (!this.isTooltipPinned() && !this.hovered && this.tooltip.style.visibility === 'visible') {
        this.hideTooltip();
      }

      this.controls.update();
      this.updateMarkerScreenScale();
      this.updateHover();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  resize() {
    if (!this.renderer || !this.camera) return;
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  onPointerMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    this.mouseNdc.set(x * 2 - 1, -(y * 2 - 1));
    this._lastClientX = e.clientX;
    this._lastClientY = e.clientY;

    // Keep tooltip following the cursor while hovering the same marker
    if (this.hovered && this.hovered.userData) {
      this.positionTooltip();
    } else if (this.isTooltipPinned()) {
      this.positionTooltip();
    }
  }

  onPointerDownCanvas(e) {
    this.pointerDownInfo = {
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      pointerType: e.pointerType || ''
    };
  }

  onPointerUpCanvas(e) {
    if (!this.isCoarsePointer || !this.pointerDownInfo) return;
    const dx = e.clientX - this.pointerDownInfo.x;
    const dy = e.clientY - this.pointerDownInfo.y;
    const dt = performance.now() - this.pointerDownInfo.t;
    this.pointerDownInfo = null;

    // Treat a short, nearly-stationary touch as a tap on a footprint.
    if ((e.pointerType === 'touch' || e.pointerType === 'pen' || e.pointerType === '') &&
        dt < 360 &&
        Math.hypot(dx, dy) < 16) {
      const marker = this.pickMarkerFromClientPoint(e.clientX, e.clientY);
      if (marker && marker.userData) {
        this.activateMarker(marker);
      }
    }
  }

  onClick() {
    if (this.hovered && this.hovered.userData) {
      this.activateMarker(this.hovered);
    }
  }

  activateMarker(marker) {
    if (!marker || !marker.userData) return;
    this.setAutoRotate(false);
    this.userInteractingUntil = Date.now() + 12000;
    this.tooltipPinnedUntil = Date.now() + 10000;
    this.pinnedData = marker.userData;
    this.pinnedMarker = marker;
    this.focusOnMarker(marker);
    this.showTooltip(marker.userData, { pinned: true, marker });

    // On touch devices, selection should not behave like hover.
    if (this.isCoarsePointer) {
      this.hovered = null;
    }
  }

  updateMarkerScreenScale() {
    if (!this.camera || !this.pointsGroup) return;
    const zoomFactor = clamp(
      this.camera.position.length() / this._markerScaleBaselineDistance,
      this.isCoarsePointer ? 0.72 : 0.68,
      this.isCoarsePointer ? 1.18 : 1.12
    );
    const hitFactor = clamp(
      Math.pow(this.camera.position.length() / this._markerScaleBaselineDistance, 0.75),
      this.isCoarsePointer ? 0.76 : 0.72,
      this.isCoarsePointer ? 1.16 : 1.08
    );

    for (const marker of this.points) {
      if (!marker || !marker.userData) continue;
      const markerGroup = marker.userData._markerGroup;
      if (!markerGroup) continue;
      const baseScale = marker.userData._defaultScale || 1;
      const isHovered = this.hovered === marker;
      const isPinned = this.pinnedMarker === marker && this.isTooltipPinned();
      const emphasis = isHovered || isPinned ? 1.18 : 1.0;

      marker.scale.setScalar(baseScale * zoomFactor * emphasis);

      const glow = markerGroup.children.find((child) => child !== marker && child.material && child.material.blending === THREE.AdditiveBlending);
      if (glow) {
        const glowBase = glow.userData && glow.userData._defaultScale ? glow.userData._defaultScale : baseScale;
        glow.scale.setScalar(glowBase * zoomFactor * (isHovered || isPinned ? 1.34 : 1.08));
      }

      const hit = markerGroup.children.find((child) => child.userData && child.userData._visibleDot === marker);
      if (hit) {
        const hitBase = hit.userData && hit.userData._defaultScale ? hit.userData._defaultScale : baseScale;
        hit.scale.setScalar(hitBase * hitFactor * (this.isCoarsePointer ? 1.26 : 1.08));
      }
    }
  }

  updateHover() {
    if (!this.interactivePoints || this.interactivePoints.length === 0) return;
    if (this.isCoarsePointer) {
      if (this.hovered) {
        const oldBase = this.hovered.userData && this.hovered.userData._defaultScale ? this.hovered.userData._defaultScale : 1;
        this.hovered.scale.setScalar(oldBase);
      }
      this.hovered = null;
      return;
    }
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactivePoints, false);
    const hit = hits && hits[0] ? hits[0].object : null;
    const marker = hit && hit.userData ? hit.userData._visibleDot : null;

    if (marker !== this.hovered) {
      if (this.hovered && this.hovered.userData) {
        const oldGlow = this.hovered.parent.children.find((child) => child !== this.hovered && child.material && child.material.blending === THREE.AdditiveBlending);
        if (oldGlow) {
          const oldBase = oldGlow.userData && oldGlow.userData._defaultScale ? oldGlow.userData._defaultScale : (this.hovered.userData._defaultScale || 1);
          oldGlow.scale.setScalar(oldBase);
        }
      }

      this.hovered = marker;
      if (marker && marker.userData) {
        this.canvas.style.cursor = 'pointer';
        this.setAutoRotate(false); // pause while hovering a marker
        if (!this.isTooltipPinned()) {
          this.showTooltip(marker.userData);
        }
      }
      else {
        this.canvas.style.cursor = 'grab';
        if (!this.isTooltipPinned()) {
          this.hideTooltip();
        }
      }
    }
  }

  pickMarkerFromClientPoint(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    const ndc = new THREE.Vector2(x * 2 - 1, -(y * 2 - 1));
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactivePoints, false);
    const hit = hits && hits[0] ? hits[0].object : null;
    return hit && hit.userData ? hit.userData._visibleDot : null;
  }

  focusOnMarker(marker) {
    if (!marker) return;
    const markerWorld = marker.parent.getWorldPosition(new THREE.Vector3()).normalize();
    const radius = this.camera.position.length();
    const startDir = this.camera.position.clone().normalize();
    const endDir = markerWorld.clone();
    const rotQuat = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
    const start = performance.now();
    const duration = 1100;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      const t = clamp((now - start) / duration, 0, 1);
      const k = ease(t);
      const stepQuat = new THREE.Quaternion().slerpQuaternions(
        new THREE.Quaternion(),
        rotQuat,
        k
      );
      const currentDir = startDir.clone().applyQuaternion(stepQuat);
      this.camera.position.copy(currentDir.multiplyScalar(radius));
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  showTooltip(data, { pinned, marker } = {}) {
    this.ensureTooltipHost();
    const safeImg = data.image ? String(data.image) : '';
    const title = data.name ? String(data.name) : 'Unknown';
    const date = data.date ? String(data.date) : '';
    const desc = data.description ? String(data.description) : '';

    this.tooltip.innerHTML = `
      <div class="lt-body" style="padding:14px 14px 12px;">
        <button class="lt-close" type="button" aria-label="Close details" title="Close details">&times;</button>
        <div class="lt-title">${escapeHtml(title)}</div>
        ${date ? `<div class="lt-date" style="margin-top:6px;">${escapeHtml(date)}</div>` : ``}
        ${desc ? `<div class="lt-desc" style="margin-top:10px;">${escapeHtml(desc)}</div>` : ``}
        ${safeImg ? `<div class="lt-image" style="margin-top:12px;border-radius:14px;overflow:hidden;"><img src="${safeImg}" alt=""></div>` : ``}
      </div>
    `;

    const closeBtn = this.tooltip.querySelector('.lt-close');
    if (closeBtn) {
      closeBtn.style.display = pinned ? 'inline-flex' : 'none';
      closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.clearPinnedTooltip();
      }, { once: true });
    }

    const point = pinned && marker
      ? this.getMarkerScreenPoint(marker)
      : this.getCursorScreenPoint();
    const left = point.x + 18;
    const top = point.y - 120;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.visibility = 'visible';
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'translateY(0) scale(1)';
    this.tooltip.style.pointerEvents = pinned ? 'auto' : 'none';

    this.positionTooltip();
  }

  positionTooltip() {
    this.ensureTooltipHost();
    const hostRect = this.tooltipHost === document.body
      ? { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight }
      : this.tooltipHost.getBoundingClientRect();
    const point = this.isTooltipPinned() && this.pinnedMarker
      ? this.getMarkerScreenPoint(this.pinnedMarker)
      : this.getCursorScreenPoint();
    const cx = point.x;
    const cy = point.y;
    const tooltipWidth = 320;
    const tooltipHeight = 260;
    const left = clamp(cx - hostRect.left + 18, 12, hostRect.width - tooltipWidth - 12);
    const top = clamp(cy - hostRect.top - 120, 12, hostRect.height - tooltipHeight - 12);
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hideTooltip() {
    if (this.isTooltipPinned()) return;
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(10px) scale(0.98)';
    this.tooltip.style.visibility = 'hidden';
  }

  clearPinnedTooltip() {
    this.tooltipPinnedUntil = 0;
    this.pinnedData = null;
    this.pinnedMarker = null;
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(10px) scale(0.98)';
    this.tooltip.style.visibility = 'hidden';
    if (this.hovered && this.hovered.userData) {
      this.showTooltip(this.hovered.userData);
    }
  }

  isTooltipPinned() {
    if (Date.now() <= this.tooltipPinnedUntil) return true;
    if (this.tooltipPinnedUntil !== 0) {
      this.tooltipPinnedUntil = 0;
      this.pinnedData = null;
      this.pinnedMarker = null;
    }
    return false;
  }

  getCursorScreenPoint() {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Number.isFinite(this._lastClientX) ? this._lastClientX : (rect.left + rect.width / 2),
      y: Number.isFinite(this._lastClientY) ? this._lastClientY : (rect.top + rect.height / 2)
    };
  }

  getMarkerScreenPoint(marker) {
    const world = marker.parent.getWorldPosition(new THREE.Vector3());
    const projected = world.project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + ((projected.x + 1) / 2) * rect.width,
      y: rect.top + ((-projected.y + 1) / 2) * rect.height
    };
  }

  ensureTooltipHost() {
    const desiredHost = document.fullscreenElement === this.container ? this.container : document.body;
    const desiredPosition = desiredHost === document.body ? 'fixed' : 'absolute';
    if (this.tooltipHost !== desiredHost || this.tooltip.parentElement !== desiredHost) {
      desiredHost.appendChild(this.tooltip);
      this.tooltipHost = desiredHost;
    }
    this.tooltip.style.position = desiredPosition;
  }

  handleFullscreenChange() {
    this.ensureTooltipHost();
    if (this.tooltip.style.visibility === 'visible') {
      this.positionTooltip();
    }
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerenter', this._onPointerEnter);
    this.canvas.removeEventListener('pointerleave', this._onCanvasLeave);
    this.canvas.removeEventListener('pointerdown', this._onPointerDownCanvas);
    this.canvas.removeEventListener('pointerup', this._onPointerUpCanvas);
    this.canvas.removeEventListener('click', this._onClick);
    document.removeEventListener('fullscreenchange', this._onFullscreenChange);
    this.hideTooltip();
    if (this.renderer) this.renderer.dispose();
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}

let globe = null;

async function ensureGlobe() {
  const container = document.getElementById('map-container');
  const canvas = document.getElementById('footprints-globe-canvas');
  if (!container || !canvas) return null;
  if (globe) return globe;
  globe = new FootprintsGlobe({ canvas, container });
  try {
    await globe.init();
    globe.setData(getNormalizedFootprintsFromStorage());
  } catch (e) {
    console.error('Footprints globe init failed:', e);
    // Show a visible fallback message inside the map container (helps when module fails under file://).
    try {
      const wm = document.getElementById('world-map');
      if (wm && !wm.querySelector('.globe-fallback')) {
        const box = document.createElement('div');
        box.className = 'globe-fallback';
        box.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.85);font:600 14px/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial;pointer-events:none;background:radial-gradient(circle at 50% 40%, rgba(20,40,80,0.35), rgba(0,0,0,0.55));';
        box.textContent = '3D globe failed to load. Please refresh (and check Console).';
        wm.appendChild(box);
      }
    } catch (_) {}
  }
  return globe;
}

// Expose a refresh hook for sync-bridge / admin-sync to call
window.refreshFootprintsGlobe = (items) => {
  ensureGlobe().then((g) => {
    if (!g) return;
    g.refreshTheme();
    if (Array.isArray(items)) g.setData(items.map(it => ({
      ...it,
      lat: Array.isArray(it.location) ? Number(it.location[1]) : Number(it.lat),
      lng: Array.isArray(it.location) ? Number(it.location[0]) : Number(it.lng)
    })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)));
    else g.setData(getNormalizedFootprintsFromStorage());
  }).catch(() => {});
};

// Initial boot (after DOM is ready)
document.addEventListener('DOMContentLoaded', () => {
  ensureGlobe().catch(() => {});
});

// Theme changes: re-tint night lights/cloud opacity
const themeObserver = new MutationObserver(() => {
  if (globe) globe.refreshTheme();
});
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
