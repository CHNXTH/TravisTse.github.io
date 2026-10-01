import * as THREE from './assets/vendor/three/three.module.min.js';
import { OrbitControls } from './assets/vendor/three/OrbitControls.js';

const MARKER_LONGITUDE_OFFSET_DEG = 90;
const PREVIEW_PLACEHOLDER_MESSAGE = 'Your anonymous message preview will appear here before curation.';

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function createMarkerTexture({ coreColor = '#2367FB', ringColor = '#ffffff' } = {}) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  ctx.clearRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, Math.PI * 2);
  ctx.fillStyle = ringColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 26, 0, Math.PI * 2);
  ctx.fillStyle = coreColor;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createGlowTexture({
  innerColor = 'rgba(35,103,251,0.32)',
  midColor = 'rgba(191,230,255,0.34)',
  outerColor = 'rgba(191,230,255,0)'
} = {}) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;

  const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, 48);
  gradient.addColorStop(0, innerColor);
  gradient.addColorStop(0.45, midColor);
  gradient.addColorStop(1, outerColor);

  ctx.clearRect(0, 0, size, size);
  ctx.beginPath();
  ctx.arc(cx, cy, 48, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

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

function normalizeWebsiteDataForGlobe(data) {
  const normalized = data && typeof data === 'object' ? data : {};
  normalized.footprints = Array.isArray(normalized.footprints) ? normalized.footprints : [];
  normalized.anonymousMessages = Array.isArray(normalized.anonymousMessages) ? normalized.anonymousMessages : [];
  normalized.settings = normalized.settings || {};
  return normalized;
}

function readWebsiteDataFromStorage() {
  try {
    const raw = localStorage.getItem('websiteData');
    if (!raw) return normalizeWebsiteDataForGlobe({});
    return normalizeWebsiteDataForGlobe(JSON.parse(raw));
  } catch (e) {
    console.warn('Footprints globe: failed to parse websiteData', e);
    return normalizeWebsiteDataForGlobe({});
  }
}

function getNormalizedFootprintsFromStorage() {
  const data = readWebsiteDataFromStorage();
  return data.footprints.map(fp => {
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
      kind: 'footprint',
      name: displayName || 'Unknown',
      displayName: displayName || 'Unknown',
      city: city || '',
      country: country || '',
      lat,
      lng,
      intensity: fp.intensity || 1,
      image: imageUrl,
      date: fp.visitedAt || fp.year || '',
      description: fp.description || ''
    };
  }).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
}

function getNormalizedAnonymousMessagesFromStorage({ publicOnly = true } = {}) {
  const data = readWebsiteDataFromStorage();
  return data.anonymousMessages.map((entry) => {
    const place = entry && entry.place && typeof entry.place === 'object' ? entry.place : null;
    const city = place && place.city ? String(place.city) : String(entry.city || '');
    const country = place && place.country ? String(place.country) : String(entry.country || '');
    const rawLat = place && Number.isFinite(place.lat) ? Number(place.lat) : parseFloat(entry.lat);
    const rawLng = place && Number.isFinite(place.lng) ? Number(place.lng) : parseFloat(entry.lng);
    const unlocated = !Number.isFinite(rawLat) || !Number.isFinite(rawLng);
    const lat = unlocated ? -90 : rawLat;
    const lng = unlocated ? 0 : rawLng;
    const displayName = place && place.displayName
      ? String(place.displayName)
      : `${city}${country ? ', ' + country : ''}`;
    return {
      id: entry.id || '',
      kind: 'message',
      name: unlocated ? 'No location · South Pole' : (displayName || 'Unknown'),
      city: unlocated ? 'No location · South Pole' : (city || displayName || 'Unknown'),
      country: unlocated ? '' : (country || ''),
      lat,
      lng,
      intensity: 1,
      message: String(entry.message || entry.content || '').trim().slice(0, 100),
      createdAt: entry.createdAt || '',
      isVisible: Boolean(entry.isVisible),
      isFeatured: Boolean(entry.isFeatured),
      source: entry.source || 'frontend',
      privacyAccepted: entry.privacyAccepted !== false
    };
  }).filter((entry) => {
    if (!Number.isFinite(entry.lat) || !Number.isFinite(entry.lng) || !entry.message) return false;
    if (!publicOnly) return true;
    return entry.isVisible && entry.isFeatured;
  });
}

function alignLocationWithExistingFootprint(location) {
  const city = String(location && location.city || '').trim().toLowerCase();
  const country = String(location && location.country || '').trim().toLowerCase();
  if (!city) return location;

  const match = getNormalizedFootprintsFromStorage().find((footprint) => {
    const fpCity = String(footprint.city || '').trim().toLowerCase();
    const fpCountry = String(footprint.country || '').trim().toLowerCase();
    if (!fpCity) return false;
    if (fpCity !== city) return false;
    if (country && fpCountry && fpCountry !== country) return false;
    return Number.isFinite(footprint.lat) && Number.isFinite(footprint.lng);
  });

  if (!match) return location;

  return {
    ...location,
    displayName: String(match.displayName || match.name || location.displayName || '').trim() || location.displayName,
    city: String(match.city || location.city || '').trim() || location.city,
    country: String(match.country || location.country || '').trim() || location.country,
    lat: Number(match.lat),
    lng: Number(match.lng)
  };
}

function getMarkerPriority(marker) {
  if (!marker || !marker.userData) return 0;
  if (marker.userData._isPreview) return 4;
  if (marker.userData.kind === 'message') return 3;
  return 1;
}

function getAnonymousMessageClustersFromStorage() {
  const messages = getNormalizedAnonymousMessagesFromStorage({ publicOnly: true });
  const grouped = new Map();

  for (const message of messages) {
    const cityKey = `${String(message.city || message.name || 'unknown').trim().toLowerCase()}__${String(message.country || '').trim().toLowerCase()}`;
    const key = cityKey || `${message.name}__fallback`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        id: `msg_cluster_${key}`,
        kind: 'message',
        name: message.name,
        city: message.city || message.name,
        country: message.country || '',
        lat: message.lat,
        lng: message.lng,
        intensity: 1,
        count: 0,
        messages: []
      });
    }
    const cluster = grouped.get(key);
    cluster.messages.push(message);
    cluster.count += 1;
  }

  return Array.from(grouped.values());
}

function getCombinedGlobeItemsFromStorage() {
  const items = [
    ...getNormalizedFootprintsFromStorage(),
    ...getAnonymousMessageClustersFromStorage()
  ];
  const preview = getAnonymousMessagePreviewItem();
  if (preview) items.push(preview);
  return items;
}

let anonymousMessagePreviewState = null;

function getAnonymousMessagePreviewItem() {
  if (!anonymousMessagePreviewState || !anonymousMessagePreviewState.place) return null;
  const place = anonymousMessagePreviewState.place;
  if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return null;

  const previewText = String(anonymousMessagePreviewState.message || '').trim() || PREVIEW_PLACEHOLDER_MESSAGE;
  return {
    id: anonymousMessagePreviewState.id || 'msg_preview_current_user',
    kind: 'message',
    name: place.displayName || [place.city, place.country].filter(Boolean).join(', ') || 'Your City',
    city: place.city || place.displayName || 'Your City',
    country: place.country || '',
    lat: Number(place.lat),
    lng: Number(place.lng),
    intensity: 1,
    count: 1,
    isPreview: true,
    pulse: true,
    messages: [
      {
        id: 'preview_message',
        message: previewText,
        createdAt: anonymousMessagePreviewState.submittedAt || 'Awaiting curation',
        isPreview: true
      }
    ]
  };
}

function hasActiveAnonymousMessagePreview() {
  return Boolean(anonymousMessagePreviewState && anonymousMessagePreviewState.place);
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

// The story owns the camera only outside the free interaction window.
// OrbitControls receives gestures on a projected sphere disk, never on the sky.
class FootprintsStory {
  constructor(globe) {
    this.globe = globe;
    this.root = document.getElementById('footprints-story');
    this.section = document.getElementById('footprints');
    this.awards = document.getElementById('awards');
    this.planetOpacity = { value: 0 };
    this.social = document.getElementById('social');
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.phase = -1;
    this.progress = null;
    this.active = false;
    this.ui = [...globe.container.querySelectorAll('.globe-overlay-controls, .globe-message-entry')];
    this.ui.forEach(el => el.classList.add('globe-story-ui'));
    this.onAnchor = event => {
      const link = event.target.closest('a[href="#awards"], a[href="#footprints"], a[href="#social"]');
      if (!link) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      document.querySelectorAll('.hamburger-menu, .mobile-menu').forEach(el => el.classList.remove('active'));
      this.goTo(link.getAttribute('href'), true);
    };
    this.onHash = () => this.goTo(location.hash, false);
    document.addEventListener('click', this.onAnchor, true);
    window.addEventListener('hashchange', this.onHash);
    this.onVisibility = () => {
      if (this.active && !document.hidden) globe.start();
      else globe.stop();
    };
    document.addEventListener('visibilitychange', this.onVisibility);
    this.observer = new IntersectionObserver(([entry]) => {
      this.active = entry.isIntersecting;
      this.onVisibility();
    });
    this.observer.observe(this.root);
    requestAnimationFrame(() => this.onHash());
  }

  goTo(hash, smooth) {
    if (hash === '#awards') {
      window.scrollTo({ top: this.awards.getBoundingClientRect().top + scrollY,
        behavior: smooth && !this.motion.matches ? 'smooth' : 'instant' });
      return;
    }
    if (hash !== '#footprints' && hash !== '#social') return;
    const lead = this.motion.matches ? 0 : innerHeight * .45;
    const range = this.section.offsetHeight - innerHeight + lead;
    const top = this.section.getBoundingClientRect().top + scrollY;
    window.scrollTo({ top: top - lead + range * (hash === '#social' ? 1 : (this.motion.matches ? 0 : .62)),
      behavior: smooth && !this.motion.matches ? 'smooth' : 'instant' });
  }

  preparePlanetFade() {
    // One shared alpha uniform fades only Earth and its markers, never the stars.
    this.globe.globeGroup.traverse(object => {
      const material = object.material;
      if (!material || material.userData.storyFade) return;
      material.userData.storyFade = true;
      material.transparent = true;
      const inject = source => 'uniform float uStoryOpacity;\n' + source.replace(/}\s*$/, 'gl_FragColor.a *= uStoryOpacity;\n}');
      if (material.isShaderMaterial) {
        material.uniforms.uStoryOpacity = this.planetOpacity;
        material.fragmentShader = inject(material.fragmentShader);
      } else {
        material.onBeforeCompile = shader => {
          shader.uniforms.uStoryOpacity = this.planetOpacity;
          shader.fragmentShader = inject(shader.fragmentShader);
        };
        material.customProgramCacheKey = () => 'footprints-story-alpha';
      }
      material.needsUpdate = true;
    });
  }

  radiusFor(fraction) {
    const camera = this.globe.camera;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const extent = fraction * Math.tan(halfFov) * Math.min(1, camera.aspect);
    return Math.sqrt(1 + 1 / (extent * extent));
  }

  poseEntrance(t) {
    const g = this.globe;
    // Longitude offset is shared with the existing marker coordinate system.
    const longitude = THREE.MathUtils.lerp(20, 105, t);
    g.globeGroup.rotation.y = THREE.MathUtils.degToRad(-longitude - MARKER_LONGITUDE_OFFSET_DEG) - getEarthUtcRotation();
    const latitude = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(5, 32, t));
    const radius = THREE.MathUtils.lerp(this.radiusFor(.34), this.radiusFor(.70), t);
    g.camera.position.set(0, Math.sin(latitude) * radius, Math.cos(latitude) * radius);
    g.camera.lookAt(0, 0, 0);
    g.globeGroup.scale.setScalar(1);
  }

  update(dt) {
    const g = this.globe;
    const reduced = this.motion.matches;
    const sectionTop = this.section.getBoundingClientRect().top;
    const lead = reduced ? 0 : innerHeight * .45;
    const raw = clamp((lead - sectionTop) / Math.max(1, this.section.offsetHeight - innerHeight + lead), 0, 1);
    const awardsVisible = sectionTop > lead + 1;
    const awardsOpacity = reduced ? 1 : clamp((sectionTop / innerHeight - .15) / .60, 0, 1);
    this.root.style.setProperty('--awards-opacity', awardsOpacity);
    this.awards.inert = awardsOpacity === 0;
    if (this.progress === null || reduced) this.progress = raw;
    else this.progress += (raw - this.progress) * (1 - Math.exp(-Math.min(dt, .1) * 22));
    if (Math.abs(raw - this.progress) < .0001) this.progress = raw;
    const p = this.progress;
    const phase = awardsVisible ? 0 : reduced ? 2 : p < .55 ? 1 : p <= .72 ? 2 : 3;
    if (phase !== this.phase || reduced !== this.reduced) {
      if (phase < 2 && this.phase >= 2) {
        this.reversePose = { position: g.camera.position.clone(), rotation: g.globeGroup.rotation.y };
      }
      // Drain OrbitControls' damping deltas before transferring camera ownership.
      g.controls.autoRotate = false;
      g.controls.enableDamping = false;
      g.controls.update();
      g.controls.enableDamping = true;
      if (phase >= 2 && (this.phase < 2 || (reduced && !this.reduced))) {
        if (this.reversePose && !reduced) {
          g.camera.position.copy(this.reversePose.position);
          g.globeGroup.rotation.y = this.reversePose.rotation;
        } else this.poseEntrance(1);
      }
      if (phase !== 2) {
        g.clearPinnedTooltip();
        g.hovered = null;
        g.hideTooltip();
      }
      this.ui.forEach(el => {
        el.classList.toggle('section-revealed', phase === 2);
        el.inert = phase !== 2;
      });
      this.reduced = reduced;
      this.phase = phase;
      this.root.dataset.phase = String(phase);
    }
    const exit = reduced ? 0 : clamp((p - .72) / .28, 0, 1);
    if (phase < 2) {
      this.poseEntrance(clamp(p / .55, 0, 1));
      if (this.reversePose) {
        const blend = clamp((.55 - p) / .12, 0, 1);
        g.camera.position.lerp(this.reversePose.position, 1 - blend);
        const delta = Math.atan2(Math.sin(g.globeGroup.rotation.y - this.reversePose.rotation),
          Math.cos(g.globeGroup.rotation.y - this.reversePose.rotation));
        g.globeGroup.rotation.y = this.reversePose.rotation + delta * blend;
        g.camera.lookAt(0, 0, 0);
        if (blend === 1) this.reversePose = null;
      }
    } else {
      // Shrink first, then hold that diameter while lifting the globe toward Connect.
      const extent = (g.camera.aspect < 1 ? .58 : .43) * Math.tan(THREE.MathUtils.degToRad(g.camera.fov / 2)) * Math.min(1, g.camera.aspect);
      const targetScale = Math.min(.90, g.camera.position.length() * extent / Math.sqrt(1 + extent * extent));
      const shrink = THREE.MathUtils.smoothstep(exit, 0, .35);
      g.globeGroup.scale.setScalar(THREE.MathUtils.lerp(1, targetScale, shrink));
    }
    const lift = THREE.MathUtils.smoothstep(exit, .35, 1);
    const width = g.container.clientWidth, height = g.container.clientHeight;
    const offset = height * (g.camera.aspect < 1 ? .13 : .11) * lift;
    if (this.viewOffset !== offset || this.viewWidth !== width || this.viewHeight !== height) {
      g.camera.setViewOffset(width, height, 0, offset, width, height);
      this.viewOffset = offset; this.viewWidth = width; this.viewHeight = height;
    }
    g.controls.enabled = phase === 2;
    g.controls.autoRotate = phase === 2 && !reduced && g.autoRotate;
    g.controls.minDistance = this.radiusFor(.82);
    g.controls.maxDistance = this.radiusFor(.24);
    if (phase === 2) {
      g.camera.position.clampLength(g.controls.minDistance, g.controls.maxDistance);
      g.controls.update();
    }
    this.planetOpacity.value = awardsVisible ? 0 : reduced ? 1 : clamp(p / .12, 0, 1);
    g.globeGroup.visible = this.planetOpacity.value > 0;
    this.root.style.setProperty('--connect-opacity', reduced ? 1 : clamp((exit - .25) / .65, 0, 1));
    this.social.inert = !reduced && exit < .3;
    const connectVisible = reduced
      ? this.social.getBoundingClientRect().top < innerHeight * .75
      : exit > .25;
    this.root.dataset.connectVisible = String(connectVisible);
    this.root.style.setProperty('--globe-exit', exit);
    this.ui.forEach(el => { el.inert = phase !== 2 || connectVisible; });
    const bounds = this.root.getBoundingClientRect();
    if (bounds.top <= innerHeight * .2 && bounds.bottom > innerHeight * .3) {
      const id = sectionTop > innerHeight * .2 ? '#awards' : raw > .86 ? '#social' : '#footprints';
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === id);
      });
    }
    // Exact perspective silhouette of a unit sphere plus a stable 2px edge tolerance.
    const r = g.camera.position.length();
    const diameter = g.container.clientHeight / (Math.tan(THREE.MathUtils.degToRad(g.camera.fov / 2)) * Math.sqrt(r * r - 1)) + 4;
    g.gestureSurface.style.width = `${diameter}px`;
    g.gestureSurface.style.height = `${diameter}px`;
    g.gestureSurface.style.pointerEvents = phase === 2 ? 'auto' : 'none';
  }

  destroy() {
    this.observer.disconnect();
    document.removeEventListener('click', this.onAnchor, true);
    window.removeEventListener('hashchange', this.onHash);
    document.removeEventListener('visibilitychange', this.onVisibility);
  }
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
    this.isReducedPerfMode = this.isCoarsePointer;
    this.pointerDownInfo = null;

    this.globeGroup = new THREE.Group();
    this.scene.add(this.globeGroup);
    this.planetGroup = new THREE.Group();
    this.globeGroup.add(this.planetGroup);

    this.earth = null;
    this.nightLights = null;
    this.clouds = null;
    this.atmosphere = null;
    this.starfieldGroup = null;
    this.meteorPool = [];
    this.nextMeteorAt = this.isReducedPerfMode
      ? Number.POSITIVE_INFINITY
      : performance.now() + THREE.MathUtils.randFloat(3000, 7000);
    this.sunDir = new THREE.Vector3(1, 0, 0);
    this.sunLight = null;
    this.layerVisibility = { footprint: true, message: true };
    this.markerTextures = {
      footprint: createMarkerTexture(),
      message: createMarkerTexture({ coreColor: '#FB6423', ringColor: '#ffffff' })
    };
    this.markerGlowTextures = {
      footprint: createGlowTexture(),
      message: createGlowTexture({
        innerColor: 'rgba(251,100,35,0.26)',
        midColor: 'rgba(255,183,140,0.30)',
        outerColor: 'rgba(255,183,140,0)'
      })
    };

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.isReducedPerfMode ? 1.25 : 2));
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

    this.gestureSurface = document.createElement('div');
    this.gestureSurface.className = 'globe-gesture-surface';
    this.gestureSurface.setAttribute('aria-label', 'Rotate and zoom the globe');
    this.container.appendChild(this.gestureSurface);
    this.canvas.style.touchAction = 'pan-y';
    this.controls = new OrbitControls(this.camera, this.gestureSurface);
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
    this.gestureSurface.addEventListener('pointermove', this._onPointerMove, { passive: true });
    this.gestureSurface.addEventListener('pointerenter', this._onPointerEnter, { passive: true });
    this.gestureSurface.addEventListener('pointerleave', this._onCanvasLeave, { passive: true });
    this.gestureSurface.addEventListener('pointerdown', this._onPointerDownCanvas, { passive: true });
    this.gestureSurface.addEventListener('pointerup', this._onPointerUpCanvas, { passive: true });
    this.gestureSurface.addEventListener('click', this._onClick, { passive: true });
    this.ensureTooltipHost();

    this.resize();
    this.story = new FootprintsStory(this);
  }

  async loadEarth() {
    const loader = new THREE.TextureLoader();
    const [dayTex, nightTex, cloudsTex, specularTex] = await Promise.all([
      loader.loadAsync('assets/earth/earth_day.jpg'),
      loader.loadAsync('assets/earth/earth_night.jpg'),
      loader.loadAsync('assets/earth/earth_clouds.jpg'),
      loader.loadAsync('assets/earth/earth_specular.png')
    ]);
    dayTex.colorSpace = THREE.SRGBColorSpace;
    nightTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    const anisotropy = Math.min(
      this.renderer.capabilities.getMaxAnisotropy(),
      this.isReducedPerfMode ? 4 : this.renderer.capabilities.getMaxAnisotropy()
    );
    [dayTex, nightTex, cloudsTex, specularTex].forEach((tex) => {
      tex.anisotropy = anisotropy;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
    });
    specularTex.colorSpace = THREE.NoColorSpace;

    const radius = 1.0;
    this.createStarfield();
    const sphereSegments = this.isReducedPerfMode ? 64 : 96;
    const geom = new THREE.SphereGeometry(radius, sphereSegments, sphereSegments);

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
          color = mix(color, vec3(1.0), cloudsMix * 0.42);

          float fresnel = dot(-viewDir, normal) + 1.0;
          fresnel = pow(fresnel, 2.4);
          vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, twilightMix);
          color += atmosphereColor * fresnel * 0.008;

          float luminance = dot(color, vec3(0.299, 0.587, 0.114));
          color = mix(vec3(luminance), color, 0.86);

          gl_FragColor = vec4(color, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
    });
    this.earth = new THREE.Mesh(geom, mat);
    this.planetGroup.add(this.earth);

    this.nightLights = null;

    const cloudGeom = new THREE.SphereGeometry(radius * 1.01, sphereSegments, sphereSegments);
    const cloudMat = new THREE.ShaderMaterial({
      uniforms: {
        uClouds: { value: cloudsTex },
        uSunDir: { value: this.sunDir.clone() },
        uOpacity: { value: this.isReducedPerfMode ? 0.12 : (getIsDarkMode() ? 0.26 : 0.16) }
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
    const atmGeom = new THREE.SphereGeometry(radius * 1.048, sphereSegments, sphereSegments);
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

  createStarfield() {
    if (this.starfieldGroup) {
      this.scene.remove(this.starfieldGroup);
    }

    const starfieldGroup = new THREE.Group();
    const starCount = this.isReducedPerfMode ? 950 : 1800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
      const i3 = i * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      const radius = THREE.MathUtils.randFloat(35, 45);
      const sinPhi = Math.sin(phi);

      positions[i3] = radius * sinPhi * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * sinPhi * Math.sin(theta);

      const tint = THREE.MathUtils.randFloat(0.84, 1);
      colors[i3] = tint;
      colors[i3 + 1] = THREE.MathUtils.randFloat(0.9, 1);
      colors[i3 + 2] = 1;
    }

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.16,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: getIsDarkMode() ? 0.95 : 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    starfieldGroup.add(stars);
    if (!this.isReducedPerfMode) {
      this.createMeteorPool(starfieldGroup);
    } else {
      this.meteorPool = [];
    }
    starfieldGroup.rotation.y = THREE.MathUtils.degToRad(-120);

    this.starfieldGroup = starfieldGroup;
    this.scene.add(this.starfieldGroup);
  }

  createMeteorPool(parentGroup) {
    this.meteorPool = [];

    for (let i = 0; i < 4; i += 1) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(6);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const material = new THREE.LineBasicMaterial({
        color: 0xdff1ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const line = new THREE.Line(geometry, material);
      line.visible = false;
      parentGroup.add(line);

      this.meteorPool.push({
        line,
        active: false,
        head: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        trailLength: 0,
        age: 0,
        lifetime: 0
      });
    }
  }

  spawnMeteorBurst() {
    const burstCount = Math.random() < 0.45 ? 2 : 1;
    let spawned = 0;

    for (const meteor of this.meteorPool) {
      if (meteor.active) continue;

      const startX = THREE.MathUtils.randFloat(-6.8, 6.8);
      const startY = THREE.MathUtils.randFloat(2.8, 5.8);
      const startZ = THREE.MathUtils.randFloat(-9.4, -7.6);
      meteor.head.set(startX, startY, startZ);

      const drift = new THREE.Vector3(
        THREE.MathUtils.randFloat(2.8, 5.4),
        THREE.MathUtils.randFloat(-2.8, -1.5),
        THREE.MathUtils.randFloat(0.25, 1.15)
      );
      meteor.velocity.copy(drift);
      meteor.trailLength = THREE.MathUtils.randFloat(0.9, 1.45);
      meteor.age = 0;
      meteor.lifetime = THREE.MathUtils.randFloat(0.8, 1.35);
      meteor.active = true;
      meteor.line.visible = true;
      meteor.line.material.opacity = 0;
      this.updateMeteorLine(meteor);

      spawned += 1;
      if (spawned >= burstCount) break;
    }

    this.nextMeteorAt = performance.now() + THREE.MathUtils.randFloat(4500, 10000);
  }

  updateMeteorLine(meteor) {
    const direction = meteor.velocity.clone().normalize();
    const tail = meteor.head.clone().sub(direction.multiplyScalar(meteor.trailLength));
    const positions = meteor.line.geometry.attributes.position.array;

    positions[0] = tail.x;
    positions[1] = tail.y;
    positions[2] = tail.z;
    positions[3] = meteor.head.x;
    positions[4] = meteor.head.y;
    positions[5] = meteor.head.z;
    meteor.line.geometry.attributes.position.needsUpdate = true;
    meteor.line.geometry.computeBoundingSphere();
  }

  updateMeteors(dt, nowMs) {
    if (!this.meteorPool.length) return;

    if (nowMs >= this.nextMeteorAt) {
      this.spawnMeteorBurst();
    }

    for (const meteor of this.meteorPool) {
      if (!meteor.active) continue;

      meteor.age += dt;
      if (meteor.age >= meteor.lifetime) {
        meteor.active = false;
        meteor.line.visible = false;
        meteor.line.material.opacity = 0;
        continue;
      }

      meteor.head.addScaledVector(meteor.velocity, dt);
      this.updateMeteorLine(meteor);

      const t = meteor.age / meteor.lifetime;
      const fadeIn = Math.min(1, t / 0.18);
      const fadeOut = Math.min(1, (1 - t) / 0.28);
      meteor.line.material.opacity = 0.72 * Math.min(fadeIn, fadeOut);
    }
  }

  setData(items) {
    // Clear old
    this.pointsGroup.clear();
    this.points = [];
    this.interactivePoints = [];
    this.hovered = null;

    const radius = 1.0;
    const visibleBasePixels = this.isCoarsePointer ? 14 : 11;
    const glowBasePixels = this.isCoarsePointer ? 22 : 18;
    const hitBasePixels = this.isCoarsePointer ? 38 : 28;

    for (const it of items || []) {
      const pos = latLngToVector3(it.lat, it.lng, radius * 1.01);
      const marker = new THREE.Group();
      marker.position.copy(pos);
      marker.userData = it;
      const markerType = it.kind === 'message' ? 'message' : 'footprint';
      const markerTexture = this.markerTextures[markerType] || this.markerTextures.footprint;
      const glowTexture = this.markerGlowTextures[markerType] || this.markerGlowTextures.footprint;
      const isPreview = Boolean(it.isPreview);
      const markerRenderOrder = isPreview ? 28 : (markerType === 'message' ? 24 : 20);
      const visiblePixelSize = visibleBasePixels * (isPreview ? 1.22 : 1);
      const glowPixelSize = glowBasePixels * (isPreview ? 1.42 : 1);
      const hitPixelSize = hitBasePixels * (isPreview ? 1.08 : 1);

      const mat = new THREE.SpriteMaterial({
        map: markerTexture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      const visibleDot = new THREE.Sprite(mat);
      visibleDot.position.set(0, 0, 0);
      visibleDot.renderOrder = markerRenderOrder;
      visibleDot.userData = it;
      visibleDot.userData._pixelSize = visiblePixelSize;
      visibleDot.userData._markerGroup = marker;
      visibleDot.userData._isPreview = isPreview;
      marker.add(visibleDot);

      const glowMat = new THREE.SpriteMaterial({
        map: glowTexture,
        transparent: true,
        opacity: 0.46,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false
      });
      const glowDot = new THREE.Sprite(glowMat);
      glowDot.position.set(0, 0, 0);
      glowDot.renderOrder = markerRenderOrder - 1;
      glowDot.userData._pixelSize = glowPixelSize;
      glowDot.userData._isPreview = isPreview;
      marker.add(glowDot);

      const hitMat = new THREE.SpriteMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false
      });
      const hitDot = new THREE.Sprite(hitMat);
      hitDot.position.set(0, 0, 0);
      hitDot.renderOrder = markerRenderOrder + 1;
      hitDot.userData = it;
      hitDot.userData._markerGroup = marker;
      hitDot.userData._visibleDot = visibleDot;
      hitDot.userData._glowDot = glowDot;
      hitDot.userData._pixelSize = hitPixelSize;
      hitDot.userData._isPreview = isPreview;
      marker.add(hitDot);

      this.pointsGroup.add(marker);
      this.points.push(visibleDot);
      this.interactivePoints.push(hitDot);
    }
  }

  refreshTheme() {
    if (!this.earth) return;
    if (this.clouds) {
      this.clouds.material.uniforms.uOpacity.value = this.isReducedPerfMode ? 0.12 : (getIsDarkMode() ? 0.26 : 0.16);
    }
  }

  setLayerVisibility(nextVisibility = {}) {
    this.layerVisibility = {
      ...this.layerVisibility,
      ...nextVisibility
    };
    this.updateMarkerVisibility();
  }

  isLayerVisible(kind) {
    if (kind === 'message_preview') return true;
    if (kind === 'message') return this.layerVisibility.message !== false;
    return this.layerVisibility.footprint !== false;
  }

  setAutoRotate(enabled) {
    this.autoRotate = !!enabled;
  }

  zoomByStep(direction = 1) {
    if (!this.camera || !this.controls) return;
    const startRadius = this.camera.position.length();
    const factor = direction > 0 ? 0.86 : 1.16;
    const targetRadius = clamp(startRadius * factor, this.controls.minDistance + 0.02, this.controls.maxDistance - 0.02);
    const startDir = this.camera.position.clone().normalize();
    const start = performance.now();
    const duration = 280;

    const animate = (now) => {
      if (this.story && this.story.phase !== 2) return;
      const t = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const radius = THREE.MathUtils.lerp(startRadius, targetRadius, eased);
      this.camera.position.copy(startDir.clone().multiplyScalar(radius));
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  stop() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this.clock.getDelta();
  }

  start() {
    if (this._raf) return;
    this.clock.getDelta();
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
      if (this.starfieldGroup && !this.story.motion.matches) {
        this.starfieldGroup.rotation.y += dt * 0.016;
        this.starfieldGroup.rotation.x = Math.sin(now.getTime() * 0.00005) * 0.03;
      }
      if (!this.story.motion.matches) this.updateMeteors(dt, performance.now());
      // Spin the globe itself so markers stay locked to geography while the planet rotates.
      this.controls.autoRotate = this.autoRotate;

      // Resume auto-rotate if user hasn't interacted for a while and we're not hovering a marker.
      if (Date.now() > this.userInteractingUntil && !this.hovered && !this.isTooltipPinned() && !hasActiveAnonymousMessagePreview()) {
        if (!this.autoRotate) this.setAutoRotate(true);
      }

      if (!this.isTooltipPinned() && !this.hovered && this.tooltip.style.visibility === 'visible') {
        this.hideTooltip();
      }

      this.story.update(dt);
      this.updateMarkerVisibility();
      this.updateMarkerScreenScale();
      if (this.story.phase === 2) this.updateHover();
      this.story.preparePlanetFade();
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
    this.tooltipPinnedUntil = Number.POSITIVE_INFINITY;
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
    if (!this.camera || !this.pointsGroup || !this.renderer) return;
    const pulseTime = performance.now() * 0.0032;

    for (const marker of this.points) {
      if (!marker || !marker.userData) continue;
      const markerGroup = marker.userData._markerGroup;
      if (!markerGroup) continue;
      const worldPosition = markerGroup.getWorldPosition(new THREE.Vector3());
      const basePixels = marker.userData._pixelSize || 10;
      const isHovered = this.hovered === marker;
      const isPinned = this.pinnedMarker === marker && this.isTooltipPinned();
      if (marker.userData._isPreview) marker.material.opacity = this.story.motion.matches ? 1 : .6 + .4 * ((Math.sin(pulseTime) + 1) / 2);
      const pulse = marker.userData._isPreview ? (1 + Math.sin(pulseTime) * 0.12) : 1;
      const emphasis = (isHovered || isPinned ? 1.12 : 1.0) * pulse;

      marker.scale.setScalar(this.getWorldUnitsForPixels(worldPosition, basePixels * emphasis));

      const glow = markerGroup.children.find((child) => child !== marker && child.material && child.material.blending === THREE.AdditiveBlending);
      if (glow) {
        const glowPixels = glow.userData && glow.userData._pixelSize ? glow.userData._pixelSize : 16;
        const glowPulse = glow.userData && glow.userData._isPreview ? (1.24 + Math.sin(pulseTime) * 0.28) : (isHovered || isPinned ? 1.12 : 1.02);
        glow.scale.setScalar(this.getWorldUnitsForPixels(worldPosition, glowPixels * glowPulse));
        if (glow.material) {
          glow.material.opacity = glow.userData && glow.userData._isPreview
            ? 0.6 + ((Math.sin(pulseTime) + 1) * 0.14)
            : 0.46;
        }
      }

      const hit = markerGroup.children.find((child) => child.userData && child.userData._visibleDot === marker);
      if (hit) {
        const hitPixels = hit.userData && hit.userData._pixelSize ? hit.userData._pixelSize : 24;
        hit.scale.setScalar(this.getWorldUnitsForPixels(worldPosition, hitPixels * (this.isCoarsePointer ? 1.08 : 1)));
      }
    }
  }

  getWorldUnitsForPixels(worldPosition, pixels) {
    const viewportHeight = this.renderer.domElement.clientHeight || this.container.clientHeight || 600;
    const distance = this.camera.position.distanceTo(worldPosition);
    const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
    const visibleHeight = 2 * Math.tan(fovRad / 2) * distance;
    return (visibleHeight * pixels) / viewportHeight;
  }

  updateMarkerVisibility() {
    if (!this.camera) return;
    const cameraDir = this.camera.position.clone().normalize();

    for (const marker of this.points) {
      if (!marker || !marker.userData) continue;
      const markerGroup = marker.userData._markerGroup;
      if (!markerGroup) continue;

      const worldPosition = markerGroup.getWorldPosition(new THREE.Vector3()).normalize();
      const isPreview = Boolean(marker.userData.isPreview);
      const layerEnabled = isPreview ? true : this.isLayerVisible(marker.userData.kind);
      const isVisible = layerEnabled && (isPreview ? worldPosition.dot(cameraDir) > -0.12 : worldPosition.dot(cameraDir) > 0.08);

      marker.visible = isVisible;

      const glow = markerGroup.children.find((child) => child !== marker && child.material && child.material.blending === THREE.AdditiveBlending);
      if (glow) glow.visible = isVisible;

      const hit = markerGroup.children.find((child) => child.userData && child.userData._visibleDot === marker);
      if (hit) hit.visible = isVisible;

      if (!isVisible) {
        if (this.hovered === marker) {
          this.hovered = null;
          this.canvas.style.cursor = 'grab';
          if (!this.isTooltipPinned()) this.hideTooltip();
        }
        if (this.pinnedMarker === marker && this.isTooltipPinned()) {
          this.clearPinnedTooltip();
        }
      }
    }
  }

  updateHover() {
    if (!this.points || this.points.length === 0) return;
    if (this.isCoarsePointer) {
      this.hovered = null;
      return;
    }
    this.raycaster.setFromCamera(this.mouseNdc, this.camera);
    const earthHits = this.earth ? this.raycaster.intersectObject(this.earth, false) : [];
    if (!earthHits || earthHits.length === 0) {
      if (this.hovered) {
        this.hovered = null;
        this.canvas.style.cursor = 'grab';
        if (!this.isTooltipPinned()) this.hideTooltip();
      }
      return;
    }
    const marker = this.findMarkerNearScreenPoint(this._lastClientX, this._lastClientY, {
      thresholdPx: 10,
      requireVisible: true
    });

    if (marker !== this.hovered) {
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
    const earthHits = this.earth ? this.raycaster.intersectObject(this.earth, false) : [];
    if (!earthHits || earthHits.length === 0) return null;
    return this.findMarkerNearScreenPoint(clientX, clientY, {
      thresholdPx: this.isCoarsePointer ? 22 : 12,
      requireVisible: true
    });
  }

  findMarkerNearScreenPoint(clientX, clientY, { thresholdPx = 10, requireVisible = true } = {}) {
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY) || !this.camera) return null;

    let bestMarker = null;
    let bestDistance = Infinity;
    let bestPriority = -Infinity;

    for (const marker of this.points) {
      if (!marker || !marker.userData) continue;
      if (requireVisible && !marker.visible) continue;

      const point = this.getMarkerScreenPoint(marker);
      const distance = Math.hypot(point.x - clientX, point.y - clientY);
      const basePixels = marker.userData._pixelSize || 10;
      const effectiveThreshold = Math.max(thresholdPx, basePixels * 0.48);
      const priority = getMarkerPriority(marker);

      if (
        distance <= effectiveThreshold &&
        (
          priority > bestPriority ||
          (priority === bestPriority && distance < bestDistance)
        )
      ) {
        bestPriority = priority;
        bestDistance = distance;
        bestMarker = marker;
      }
    }

    return bestMarker;
  }

  focusOnMarker(marker, { zoomFactor = 0.84, duration = 1100 } = {}) {
    if (!marker) return;
    const markerWorld = marker.parent.getWorldPosition(new THREE.Vector3()).normalize();
    this.focusCameraTowardsVector(markerWorld, { zoomFactor, duration });
  }

  getWorldDirectionForLatLng(lat, lng) {
    const local = latLngToVector3(lat, lng, 1);
    const world = local.clone();
    if (this.pointsGroup) {
      this.pointsGroup.updateWorldMatrix(true, false);
      world.applyMatrix4(this.pointsGroup.matrixWorld);
    }
    return world.normalize();
  }

  getMarkerByDataId(id) {
    if (!id) return null;
    return this.points.find((marker) => marker && marker.userData && marker.userData.id === id) || null;
  }

  focusOnLatLng(lat, lng, { zoomFactor = 0.84, duration = 1100 } = {}) {
    const target = this.getWorldDirectionForLatLng(lat, lng);
    this.focusCameraTowardsVector(target, { zoomFactor, duration });
  }

  focusCameraTowardsVector(targetDir, { zoomFactor = 1, duration = 1100 } = {}) {
    if (!this.camera || !this.controls || !targetDir) return;
    const radius = this.camera.position.length();
    const nextRadius = clamp(radius * zoomFactor, this.controls.minDistance + 0.02, this.controls.maxDistance - 0.02);
    const startDir = this.camera.position.clone().normalize();
    const endDir = targetDir.clone().normalize();
    const rotQuat = new THREE.Quaternion().setFromUnitVectors(startDir, endDir);
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const animate = (now) => {
      if (this.story && this.story.phase !== 2) return;
      const t = clamp((now - start) / duration, 0, 1);
      const k = ease(t);
      const stepQuat = new THREE.Quaternion().slerpQuaternions(
        new THREE.Quaternion(),
        rotQuat,
        k
      );
      const currentDir = startDir.clone().applyQuaternion(stepQuat);
      const currentRadius = THREE.MathUtils.lerp(radius, nextRadius, k);
      this.camera.position.copy(currentDir.multiplyScalar(currentRadius));
      this.camera.lookAt(0, 0, 0);
      this.controls.update();
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  showTooltip(data, { pinned, marker } = {}) {
    this.ensureTooltipHost();
    const isMessage = data.kind === 'message';
    const isPreview = Boolean(data.isPreview);
    const title = data.name ? String(data.name) : 'Unknown';

    if (isMessage) {
      const messages = Array.isArray(data.messages) ? data.messages : [];
      const count = messages.length || Number(data.count) || 0;
      if ((pinned || isPreview) && count > 0) {
        const currentIndex = clamp(Number(data._activeMessageIndex) || 0, 0, count - 1);
        data._activeMessageIndex = currentIndex;
        const currentMessage = messages[currentIndex];
        const canPrev = currentIndex > 0;
        const canNext = currentIndex < count - 1;
        this.tooltip.innerHTML = `
          <div class="lt-body lt-message-body">
            <button class="lt-close" type="button" aria-label="Close details" title="Close details">&times;</button>
            <div class="lt-pill lt-message-pill">${isPreview ? 'Anonymous Message Preview' : 'Anonymous Message'}</div>
            <div class="lt-title">${escapeHtml(title)}</div>
            <div class="lt-date">${isPreview ? 'Pending curation before public display' : `${count} message${count > 1 ? 's' : ''} in this city`}</div>
            <div class="lt-message-text">${escapeHtml(currentMessage.message || '')}</div>
            <div class="lt-message-footer">
              <div class="lt-message-meta">${escapeHtml(currentMessage.createdAt ? currentMessage.createdAt.slice(0, 10) : 'Anonymous')}</div>
              <div class="lt-message-nav" ${count <= 1 ? 'style="visibility:hidden"' : ''}>
                <button class="lt-nav-btn" type="button" data-dir="-1" ${canPrev ? '' : 'disabled'} aria-label="Previous message">
                  <i class="fas fa-chevron-left"></i>
                </button>
                <span class="lt-nav-status">${currentIndex + 1} / ${count}</span>
                <button class="lt-nav-btn" type="button" data-dir="1" ${canNext ? '' : 'disabled'} aria-label="Next message">
                  <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      } else {
        this.tooltip.innerHTML = `
          <div class="lt-body lt-message-body">
            <button class="lt-close" type="button" aria-label="Close details" title="Close details">&times;</button>
            <div class="lt-pill lt-message-pill">Anonymous Message</div>
            <div class="lt-title">${escapeHtml(title)}</div>
            <div class="lt-date">${count} anonymous message${count > 1 ? 's' : ''} from this city</div>
            <div class="lt-desc">Click to read the curated anonymous message${count > 1 ? 's' : ''}.</div>
          </div>
        `;
      }
    } else {
      const safeImg = data.image ? String(data.image) : '';
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
    }

    const closeBtn = this.tooltip.querySelector('.lt-close');
    if (closeBtn) {
      closeBtn.style.display = pinned ? 'inline-flex' : 'none';
      closeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (isPreview) {
          this.tooltipPinnedUntil = 0;
          this.pinnedData = null;
          this.pinnedMarker = null;
          this.hideTooltip();
          this.hovered = null;
          this.canvas.style.cursor = 'grab';
          return;
        }
        this.clearPinnedTooltip();
      }, { once: true });
    }

    if (isMessage && (pinned || isPreview)) {
      Array.from(this.tooltip.querySelectorAll('.lt-nav-btn')).forEach((btn) => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          const delta = Number(btn.getAttribute('data-dir') || '0');
          const total = Array.isArray(data.messages) ? data.messages.length : 0;
          data._activeMessageIndex = clamp((Number(data._activeMessageIndex) || 0) + delta, 0, Math.max(0, total - 1));
          this.showTooltip(data, { pinned: pinned || isPreview, marker });
        });
      });
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
    const tooltipWidth = this.tooltip.offsetWidth || 320;
    const tooltipHeight = this.tooltip.offsetHeight || 260;
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
    const desiredHost = document.body;
    const desiredPosition = desiredHost === document.body ? 'fixed' : 'absolute';
    if (this.tooltipHost !== desiredHost || this.tooltip.parentElement !== desiredHost) {
      desiredHost.appendChild(this.tooltip);
      this.tooltipHost = desiredHost;
    }
    this.tooltip.style.position = desiredPosition;
  }

  destroy() {
    this.stop();
    this.story?.destroy();
    this.controls?.dispose();
    this.gestureSurface?.remove();
    window.removeEventListener('resize', this._onResize);
    this.gestureSurface.removeEventListener('pointermove', this._onPointerMove);
    this.gestureSurface.removeEventListener('pointerenter', this._onPointerEnter);
    this.gestureSurface.removeEventListener('pointerleave', this._onCanvasLeave);
    this.gestureSurface.removeEventListener('pointerdown', this._onPointerDownCanvas);
    this.gestureSurface.removeEventListener('pointerup', this._onPointerUpCanvas);
    this.gestureSurface.removeEventListener('click', this._onClick);
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

function writeWebsiteDataToStorage(data) {
  const normalized = normalizeWebsiteDataForGlobe(data);
  localStorage.setItem('websiteData', JSON.stringify(normalized));
  localStorage.setItem('websiteDataSync', String(Date.now()));
  localStorage.setItem('websiteDataSyncSource', `anonymous_message_${Math.random().toString(36).slice(2)}`);
  return normalized;
}

function getMapUiElements() {
  return {
    layerToggle: document.getElementById('globe-layer-toggle'),
    layerPanel: document.getElementById('globe-layer-panel'),
    toggleFootprints: document.getElementById('globe-toggle-footprints'),
    toggleMessages: document.getElementById('globe-toggle-messages'),
    locateBtn: document.getElementById('globe-locate-btn'),
    zoomInBtn: document.getElementById('globe-zoom-in'),
    zoomOutBtn: document.getElementById('globe-zoom-out'),
    launcher: document.getElementById('globe-message-launcher'),
    composer: document.getElementById('globe-message-composer'),
    text: document.getElementById('globe-message-text'),
    counter: document.getElementById('globe-message-counter'),
    entry: document.getElementById('globe-message-entry'),
    label: document.getElementById('globe-message-label'),
    announcement: document.getElementById('globe-message-announcement'),
    feedback: document.getElementById('globe-message-feedback'),
    send: document.getElementById('globe-message-send'),
    privacyLink: document.getElementById('globe-privacy-link'),
    privacyModal: document.getElementById('globe-privacy-modal'),
    privacyClose: document.getElementById('globe-privacy-close'),
    privacyAck: document.getElementById('globe-privacy-ack')
  };
}

let globeUiInitialized = false;
let approxLocationCache = null;
let messageRequest = 0;
let messageSending = false;
let messageResetTimer = 0;

function setComposerFeedback(message = '', type = '') {
  const { feedback } = getMapUiElements();
  feedback.textContent = type === 'error' ? message : '';
  feedback.dataset.state = type;
}

function setMessageState(state) {
  const ui = getMapUiElements();
  ui.entry.dataset.state = state;
  const expanded = state === 'editing' || state === 'locating' || state === 'sending';
  ui.composer.inert = !expanded;
  ui.composer.setAttribute('aria-hidden', String(!expanded));
  ui.launcher.inert = expanded;
  ui.launcher.setAttribute('aria-expanded', String(expanded));
  ui.launcher.disabled = state === 'sent';
  ui.label.textContent = state === 'sent' ? 'Sent successfully ！' : 'Leave a message';
  ui.send.disabled = state !== 'editing' || !ui.text.value.trim();
  ui.entry.setAttribute('aria-busy', String(state === 'locating' || state === 'sending'));
}

function closeMessageComposer(globeInstance) {
  if (messageSending || getMapUiElements().entry.dataset.state === 'sent') return;
  messageRequest += 1;
  setMessageState('closed');
  setComposerFeedback('');
  if (!anonymousMessagePreviewState?.isSubmitted) clearAnonymousMessagePreview(globeInstance);
}

function togglePrivacyModal(open) {
  const { privacyModal, privacyClose, privacyLink } = getMapUiElements();
  privacyModal.hidden = !open;
  if (open) privacyClose.focus();
  else privacyLink.focus({ preventScroll: true });
}

function refreshAnonymousMessagePreview(globeInstance, { keepVisible = true } = {}) {
  if (!anonymousMessagePreviewState?.place || anonymousMessagePreviewState.isSubmitted) return;
  anonymousMessagePreviewState.message = getMapUiElements().text.value.trim().slice(0, 100);
  if (globeInstance && keepVisible) globeInstance.setData(getCombinedGlobeItemsFromStorage());
}

function clearAnonymousMessagePreview(globeInstance) {
  anonymousMessagePreviewState = null;
  if (globeInstance) globeInstance.setData(getCombinedGlobeItemsFromStorage());
}

async function prepareAnonymousMessagePreview(globeInstance, rawLocation) {
  const location = rawLocation || await fetchApproximateLocation();
  anonymousMessagePreviewState = {
    id: 'msg_preview_current_user',
    place: { ...location, source: 'browser_geolocation' },
    message: getMapUiElements().text.value.trim(),
    submittedAt: '',
    isSubmitted: false
  };
  globeInstance.setData(getCombinedGlobeItemsFromStorage());
  globeInstance.setAutoRotate(false);
  globeInstance.userInteractingUntil = Date.now() + 12000;
  globeInstance.focusOnLatLng(location.lat, location.lng, { zoomFactor: .84, duration: 860 });
  return location;
}

async function fetchApproximateLocation() {
  let permission = 'prompt';
  try { permission = (await navigator.permissions.query({ name: 'geolocation' })).state; } catch (_) {}
  // The browser owns permission persistence. Never cache a refusal as consent.
  if (permission === 'granted' && approxLocationCache && Date.now() - approxLocationCache.resolvedAt < 300000) return approxLocationCache;
  if (!window.isSecureContext || !navigator.geolocation) throw new Error('Location is unavailable in this browser.');
  let position;
  try {
    position = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }));
  } catch (error) {
    approxLocationCache = null;
    throw new Error(error.code === 1
      ? 'Location is blocked. Allow it in your browser and try again.'
      : 'Could not find your location. Please try again.');
  }
  const { latitude: lat, longitude: lng, accuracy } = position.coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(accuracy) || accuracy > 10000) throw new Error('Could not find your city. Please try again.');
  const place = await window.cloudflareApi?.reversePlace(lat, lng);
  if (!place?.displayName) throw new Error('Could not find your city. Please try again.');
  // Keep only the resolved city coordinates when the geocoder supplies them.
  approxLocationCache = { ...place, lat: Number.isFinite(place.lat) ? place.lat : lat,
    lng: Number.isFinite(place.lng) ? place.lng : lng, source: 'browser_geolocation', resolvedAt: Date.now() };
  return approxLocationCache;
}

async function locateCurrentCity(globeInstance) {
  const location = await fetchApproximateLocation();
  globeInstance.setAutoRotate(false);
  globeInstance.userInteractingUntil = Date.now() + 12000;
  globeInstance.focusOnLatLng(location.lat, location.lng, { zoomFactor: .84, duration: 820 });
  return location;
}

async function submitAnonymousMessage(globeInstance) {
  const ui = getMapUiElements();
  const rawText = ui.text.value.trim();
  if (messageSending) return;
  if (!rawText || rawText.length > 100) {
    setComposerFeedback('Enter a message of up to 100 characters.', 'error');
    return;
  }
  const location = anonymousMessagePreviewState?.place;
  messageSending = true;
  setComposerFeedback('');
  setMessageState('sending');
  try {
    const response = await window.cloudflareApi.submitAnonymousMessage({
      message: rawText, ...(location ? { lat: location.lat, lng: location.lng, place: location } : {}), source: 'frontend'
    });
    if (!response?.success || (!response.content && !response.entry)) throw new Error('Please try sending again.');
    const websiteData = response.content ? normalizeWebsiteDataForGlobe(response.content) : readWebsiteDataFromStorage();
    if (!response.content && response.entry) websiteData.anonymousMessages.push(response.entry);
    writeWebsiteDataToStorage(websiteData);
    if (anonymousMessagePreviewState) {
      anonymousMessagePreviewState.message = rawText;
      anonymousMessagePreviewState.isSubmitted = true;
      anonymousMessagePreviewState.submittedAt = new Date().toISOString().slice(0, 10);
      globeInstance.setData(getCombinedGlobeItemsFromStorage());
      const marker = globeInstance.getMarkerByDataId(anonymousMessagePreviewState.id);
      if (marker && globeInstance.story.phase === 2) {
        globeInstance.tooltipPinnedUntil = Number.POSITIVE_INFINITY;
        globeInstance.pinnedData = marker.userData;
        globeInstance.pinnedMarker = marker;
        globeInstance.focusOnMarker(marker, { zoomFactor: 1, duration: 600 });
        globeInstance.showTooltip(marker.userData, { pinned: true, marker });
      }
    }
    ui.text.value = '';
    ui.counter.textContent = '0/100';
    setMessageState('sent');
    ui.announcement.textContent = 'Sent successfully!';
    clearTimeout(messageResetTimer);
    messageResetTimer = setTimeout(() => {
      setMessageState('closed');
      ui.announcement.textContent = '';
    }, 3000);
  } catch (error) {
    setMessageState('editing');
    setComposerFeedback('Could not send. Please try again.', 'error');
  } finally {
    messageSending = false;
  }
}

function initFootprintsOverlay(globeInstance) {
  if (globeUiInitialized) return;
  const ui = getMapUiElements();
  if (!ui.layerToggle || !ui.layerPanel || !ui.launcher) return;
  globeUiInitialized = true;
  ui.layerToggle.addEventListener('click', () => { ui.layerPanel.hidden = !ui.layerPanel.hidden; });
  ui.toggleFootprints.addEventListener('change', () => globeInstance.setLayerVisibility({ footprint: ui.toggleFootprints.checked }));
  ui.toggleMessages.addEventListener('change', () => globeInstance.setLayerVisibility({ message: ui.toggleMessages.checked }));
  ui.locateBtn.addEventListener('click', async () => {
    try { setComposerFeedback(''); await locateCurrentCity(globeInstance); }
    catch (error) { setComposerFeedback(error.message, 'error'); }
  });
  ui.zoomInBtn.addEventListener('click', () => globeInstance.zoomByStep(1));
  ui.zoomOutBtn.addEventListener('click', () => globeInstance.zoomByStep(-1));
  ui.launcher.addEventListener('click', async () => {
    const request = ++messageRequest;
    clearTimeout(messageResetTimer);
    setComposerFeedback('');
    setMessageState('locating');
    globeInstance.clearPinnedTooltip();
    try {
      const location = await fetchApproximateLocation();
      if (request !== messageRequest) return;
      await prepareAnonymousMessagePreview(globeInstance, location);
      setMessageState('editing');
      if (globeInstance.story.phase === 2) ui.text.focus({ preventScroll: true });
    } catch (error) {
      if (request !== messageRequest) return;
      clearAnonymousMessagePreview(globeInstance);
      setMessageState('editing');
      setComposerFeedback('You can send without a location.');
      if (globeInstance.story.phase === 2) ui.text.focus({ preventScroll: true });
    }
  });
  ui.text.addEventListener('input', () => {
    ui.counter.textContent = `${ui.text.value.length}/100`;
    setComposerFeedback('');
    refreshAnonymousMessagePreview(globeInstance);
    if (!messageSending && ui.entry.dataset.state === 'editing') setMessageState('editing');
  });
  ui.send.addEventListener('click', () => submitAnonymousMessage(globeInstance));
  ui.text.addEventListener('keydown', event => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !ui.send.disabled) {
      event.preventDefault(); submitAnonymousMessage(globeInstance);
    }
  });
  ui.privacyLink.addEventListener('click', () => togglePrivacyModal(true));
  ui.privacyClose.addEventListener('click', () => togglePrivacyModal(false));
  ui.privacyAck.addEventListener('click', () => togglePrivacyModal(false));
  ui.privacyModal.addEventListener('click', event => { if (event.target === ui.privacyModal) togglePrivacyModal(false); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!ui.privacyModal.hidden) togglePrivacyModal(false);
    else closeMessageComposer(globeInstance);
  });
  document.addEventListener('pointerdown', event => {
    if (!ui.entry.contains(event.target) && ui.privacyModal.hidden) closeMessageComposer(globeInstance);
    if (!ui.layerPanel.contains(event.target) && !ui.layerToggle.contains(event.target)) ui.layerPanel.hidden = true;
  });
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
    globe.setData(getCombinedGlobeItemsFromStorage());
    initFootprintsOverlay(globe);
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
    if (Array.isArray(items)) {
      const normalizedFootprints = items.map(it => ({
        ...it,
        kind: 'footprint',
        lat: Array.isArray(it.location) ? Number(it.location[1]) : Number(it.lat),
        lng: Array.isArray(it.location) ? Number(it.location[0]) : Number(it.lng)
      })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      g.setData([
        ...normalizedFootprints,
        ...getAnonymousMessageClustersFromStorage()
      ]);
    } else {
      g.setData(getCombinedGlobeItemsFromStorage());
    }
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
