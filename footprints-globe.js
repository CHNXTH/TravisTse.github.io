import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';

const MARKER_LONGITUDE_OFFSET_DEG = 86;

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

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
    this.planetGroup = new THREE.Group();
    this.globeGroup.add(this.planetGroup);

    this.earth = null;
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

    this._raf = 0;
    this._onResize = () => this.resize();
    this._onPointerMove = (e) => this.onPointerMove(e);
    this._onPointerLeave = () => this.hideTooltip();
    this._onPointerEnter = () => { this.userInteractingUntil = Date.now() + 1500; this.setAutoRotate(false); };
    this._onCanvasLeave = () => { this.hideTooltip(); this.userInteractingUntil = Date.now() + 1500; };
    this._onClick = () => this.onClick();
    this._onPointerDown = () => { this.userInteractingUntil = Date.now() + 12000; this.setAutoRotate(false); };
    this._onPointerUp = () => { this.userInteractingUntil = Date.now() + 12000; };
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
    this.renderer.toneMappingExposure = 3.2;
    this.canvas.style.cursor = 'grab';

    this.camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);
    this.scene.add(this.camera);

    const ambient = new THREE.AmbientLight(0xffffff, 2.45);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0xa7d5ff, 0x13213b, 1.45);
    this.scene.add(hemi);

    const dir = new THREE.DirectionalLight(0xffffff, 2.4);
    dir.position.set(5, 2, 5);
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x8db8ff, 1.3);
    fill.position.set(-4, 2, -1.5);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0x2d95ff, 1.95);
    rim.position.set(-2, 3, 6);
    this.scene.add(rim);

    this.sunLight = new THREE.DirectionalLight(0xffffff, 3.55);
    this.sunLight.position.set(5, 2, 5);
    this.scene.add(this.sunLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.1;
    this.controls.maxDistance = 6.0;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.85;
    this.controls.minPolarAngle = Math.PI * 0.34;
    this.controls.maxPolarAngle = Math.PI * 0.66;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.45;
    this.controls.addEventListener('start', this._onPointerDown);
    this.controls.addEventListener('end', this._onPointerUp);

    await this.loadEarth();

    window.addEventListener('resize', this._onResize);
    this.canvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.canvas.addEventListener('pointerenter', this._onPointerEnter, { passive: true });
    this.canvas.addEventListener('pointerleave', this._onCanvasLeave, { passive: true });
    this.canvas.addEventListener('click', this._onClick, { passive: true });

    this.resize();
    this.start();
  }

  async loadEarth() {
    const loader = new THREE.TextureLoader();
    const [dayTex, nightTex, cloudsTex] = await Promise.all([
      loader.loadAsync('assets/earth/earth_day.jpg'),
      loader.loadAsync('assets/earth/earth_night.png'),
      loader.loadAsync('assets/earth/earth_clouds.png')
    ]);
    dayTex.colorSpace = THREE.SRGBColorSpace;
    nightTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    [dayTex, nightTex, cloudsTex].forEach((tex) => {
      tex.anisotropy = anisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });

    const radius = 1.0;
    const geom = new THREE.SphereGeometry(radius, 96, 96);

    // Day/night blend shader material
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uDay: { value: dayTex },
        uNight: { value: nightTex },
        uSunDir: { value: this.sunDir.clone() },
        uDark: { value: getIsDarkMode() ? 1.0 : 0.0 },
        uBlueBoost: { value: 2.45 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main(){
          vUv = uv;
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vWorldPos = worldPos.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform sampler2D uDay;
        uniform sampler2D uNight;
        uniform vec3 uSunDir;
        uniform float uDark;
        uniform float uBlueBoost;
        varying vec2 vUv;
        varying vec3 vNormalW;
        varying vec3 vWorldPos;
        void main(){
          vec3 normal = normalize(vNormalW);
          vec3 lightDir = normalize(uSunDir);
          vec3 viewDir = normalize(cameraPosition - vWorldPos);
          float ndl = dot(normal, lightDir);
          vec3 day = texture2D(uDay, vUv).rgb;
          vec3 night = texture2D(uNight, vUv).rgb;
          float daySide = smoothstep(-0.05, 0.22, ndl);
          float twilight = smoothstep(-0.42, 0.02, ndl) * (1.0 - daySide);
          float deepNight = smoothstep(0.04, 0.58, -ndl);

          vec3 ambientDay = day * vec3(0.36, 0.42, 0.55);
          vec3 twilightDay = day * vec3(0.68, 0.77, 0.96);
          vec3 litDay = day * (0.72 + max(ndl, 0.0) * 1.05) * vec3(1.03, 1.05, 1.10);

          vec3 col = ambientDay;
          col = mix(col, twilightDay, twilight);
          col = mix(col, litDay, daySide);

          float oceanMask = smoothstep(0.015, 0.12, day.b - max(day.r * 0.90, day.g * 0.96));
          float greenMask = smoothstep(0.012, 0.09, day.g - max(day.r * 0.92, day.b * 0.97));
          float warmMask = smoothstep(0.04, 0.17, day.r - max(day.g, day.b * 0.85));

          vec3 nightGlow = night * mix(0.95, 1.34, uDark) * deepNight;
          col += nightGlow;

          col += oceanMask * vec3(0.05, 0.20, 0.54) * (0.64 + 1.05 * daySide + 0.42 * twilight) * uBlueBoost;
          col = mix(col, col * vec3(0.94, 1.08, 1.62), oceanMask * (0.60 + 0.60 * daySide + 0.20 * twilight));
          col = mix(col, col * vec3(0.98, 1.28, 1.06), greenMask * (0.40 + 0.54 * daySide + 0.18 * twilight));

          col = max(col, oceanMask * vec3(0.06, 0.14, 0.28));
          col = max(col, greenMask * vec3(0.05, 0.12, 0.05));

          vec3 cooledWarm = vec3(col.r * 0.92, col.g * 1.02, col.b * 1.05);
          col = mix(col, cooledWarm, warmMask * (0.26 + 0.18 * daySide));

          vec3 reflectDir = reflect(-lightDir, normal);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), 44.0);
          float specMask = oceanMask * smoothstep(-0.01, 0.28, ndl);
          col += vec3(1.15, 1.18, 1.25) * spec * specMask * 1.65;

          col = max(col, day * vec3(0.20, 0.24, 0.34) + vec3(0.03, 0.05, 0.10));
          col = mix(col, day * vec3(1.04, 1.08, 1.16), (1.0 - uDark) * 0.62 * daySide);
          gl_FragColor = vec4(col, 1.0);
        }
      `
    });

    this.earth = new THREE.Mesh(geom, mat);
    this.planetGroup.add(this.earth);

    // Clouds
    const cloudGeom = new THREE.SphereGeometry(radius * 1.012, 96, 96);
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        uClouds: { value: cloudsTex },
        uSunDir: { value: this.sunDir.clone() },
        uOpacity: { value: getIsDarkMode() ? 0.34 : 0.2 }
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
          float daylight = smoothstep(-0.02, 0.18, dot(normalize(vNormalW), normalize(uSunDir)));
          float cloudMask = max(tex.a, ((tex.r + tex.g + tex.b) / 3.0) * 0.15);
          cloudMask = smoothstep(0.22, 0.82, cloudMask);
          float alpha = cloudMask * uOpacity * daylight;
          gl_FragColor = vec4(vec3(1.0), alpha);
        }
      `,
      transparent: true,
      depthWrite: false
    });
    this.clouds = new THREE.Mesh(cloudGeom, cloudMat);
    this.planetGroup.add(this.clouds);

    // Atmosphere glow (back-side)
    const atmGeom = new THREE.SphereGeometry(radius * 1.06, 96, 96);
    const atmMat = new THREE.ShaderMaterial({
      uniforms: { uStrength: { value: 0.75 } },
      vertexShader: `
        varying vec3 vNormal;
        void main(){
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uStrength;
        varying vec3 vNormal;
        void main(){
          float i = pow(0.70 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 col = vec3(0.25, 0.55, 1.0) * i * uStrength;
          gl_FragColor = vec4(col, i);
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
    const dotGeom = new THREE.SphereGeometry(0.013, 16, 16);
    const glowGeom = new THREE.SphereGeometry(0.026, 18, 18);
    const hitGeom = new THREE.SphereGeometry(0.065, 18, 18);
    const baseColor = new THREE.Color('#5bb6ff');

    for (const it of items || []) {
      const pos = latLngToVector3(it.lat, it.lng, radius * 1.01);
      const scale = clamp(Math.sqrt(it.intensity || 5) / 3.2, 0.55, 1.8);
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
      marker.add(glowDot);

      const hitMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });
      const hitDot = new THREE.Mesh(hitGeom, hitMat);
      hitDot.position.set(0, 0, 0);
      hitDot.userData = it;
      hitDot.userData._markerGroup = marker;
      hitDot.userData._visibleDot = visibleDot;
      hitDot.userData._glowDot = glowDot;
      marker.add(hitDot);

      this.pointsGroup.add(marker);
      this.points.push(visibleDot);
      this.interactivePoints.push(hitDot);
    }
  }

  refreshTheme() {
    if (!this.earth) return;
    this.earth.material.uniforms.uDark.value = getIsDarkMode() ? 1.0 : 0.0;
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
      if (this.earth) this.earth.material.uniforms.uSunDir.value.copy(this.sunDir);
      if (this.clouds) this.clouds.material.uniforms.uSunDir.value.copy(this.sunDir);
      if (this.sunLight) this.sunLight.position.copy(this.sunDir.clone().multiplyScalar(6));

      const dt = this.clock.getDelta();
      // Spin the globe itself so markers stay locked to geography while the planet rotates.
      this.controls.autoRotate = this.autoRotate;

      // Resume auto-rotate if user hasn't interacted for a while and we're not hovering a marker.
      if (Date.now() > this.userInteractingUntil && !this.hovered) {
        if (!this.autoRotate) this.setAutoRotate(true);
      }

      this.controls.update();
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
    }
  }

  onClick() {
    if (this.hovered && this.hovered.userData) {
      this.setAutoRotate(false);
      this.userInteractingUntil = Date.now() + 12000;
      this.focusOnMarker(this.hovered);
      this.showTooltip(this.hovered.userData, { pinned: true });
    }
  }

  updateHover() {
    if (!this.interactivePoints || this.interactivePoints.length === 0) return;
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactivePoints, false);
    const hit = hits && hits[0] ? hits[0].object : null;
    const marker = hit && hit.userData ? hit.userData._visibleDot : null;

    if (marker !== this.hovered) {
      if (this.hovered && this.hovered.userData) {
        const defaultScale = this.hovered.userData._defaultScale || 1;
        this.hovered.scale.setScalar(defaultScale);
        const oldGlow = this.hovered.parent.children.find((child) => child !== this.hovered && child.material && child.material.blending === THREE.AdditiveBlending);
        if (oldGlow) oldGlow.scale.setScalar(defaultScale);
      }

      this.hovered = marker;
      if (marker && marker.userData) {
        this.canvas.style.cursor = 'pointer';
        const defaultScale = marker.userData._defaultScale || 1;
        marker.scale.setScalar(defaultScale * 1.7);
        const glow = marker.parent.children.find((child) => child !== marker && child.material && child.material.blending === THREE.AdditiveBlending);
        if (glow) glow.scale.setScalar(defaultScale * 2.0);
        this.setAutoRotate(false); // pause while hovering a marker
        this.showTooltip(marker.userData);
      }
      else {
        this.canvas.style.cursor = 'grab';
        this.hideTooltip();
      }
    }
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

  showTooltip(data, { pinned } = {}) {
    const safeImg = data.image ? String(data.image) : '';
    const title = data.name ? String(data.name) : 'Unknown';
    const date = data.date ? String(data.date) : '';
    const desc = data.description ? String(data.description) : '';

    this.tooltip.innerHTML = `
      <div class="lt-body" style="padding:14px 14px 12px;">
        <div class="lt-title">${escapeHtml(title)}</div>
        ${date ? `<div class="lt-date" style="margin-top:6px;">${escapeHtml(date)}</div>` : ``}
        ${desc ? `<div class="lt-desc" style="margin-top:10px;">${escapeHtml(desc)}</div>` : ``}
        ${safeImg ? `<div class="lt-image" style="margin-top:12px;border-radius:14px;overflow:hidden;"><img src="${safeImg}" alt=""></div>` : ``}
      </div>
    `;

    const rect = this.canvas.getBoundingClientRect();
    // place near top-right of the cursor within the map area
    const x = rect.left + ((this.mouseNdc.x + 1) / 2) * rect.width;
    const y = rect.top + ((1 - (this.mouseNdc.y + 1) / 2)) * rect.height;
    const left = x + 18;
    const top = y - 120;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.visibility = 'visible';
    this.tooltip.style.opacity = '1';
    this.tooltip.style.transform = 'translateY(0) scale(1)';
    this.tooltip.style.pointerEvents = 'none';

    this.positionTooltip();
  }

  positionTooltip() {
    const rect = this.canvas.getBoundingClientRect();
    const cx = Number.isFinite(this._lastClientX) ? this._lastClientX : (rect.left + rect.width / 2);
    const cy = Number.isFinite(this._lastClientY) ? this._lastClientY : (rect.top + rect.height / 2);
    const tooltipWidth = 320;
    const tooltipHeight = 260;
    const left = clamp(cx + 18, 12, window.innerWidth - tooltipWidth - 12);
    const top = clamp(cy - 120, 12, window.innerHeight - tooltipHeight - 12);
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }

  hideTooltip() {
    this.tooltip.style.opacity = '0';
    this.tooltip.style.transform = 'translateY(10px) scale(0.98)';
    this.tooltip.style.visibility = 'hidden';
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerenter', this._onPointerEnter);
    this.canvas.removeEventListener('pointerleave', this._onCanvasLeave);
    this.canvas.removeEventListener('click', this._onClick);
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
