document.addEventListener('DOMContentLoaded', () => {
    // 滚动效果
    const header = document.querySelector('header');
    const heroSection = document.querySelector('.hero');
    const avatarSection = document.querySelector('.avatar-section');
    
    // 获取头像部分的初始位置和大小
    let heroSectionTop;
    let avatarSectionTop;
    
    // 从websiteData.settings读取“强制深浅色”配置
    function getThemeModeFromStorage() {
        try {
            const raw = localStorage.getItem('websiteData');
            if (!raw) return 'system';
            const data = JSON.parse(raw);
            const settings = data && data.settings && typeof data.settings === 'object' ? data.settings : null;
            const mode = settings && typeof settings.themeMode === 'string' ? settings.themeMode : 'system';
            return ['system', 'light', 'dark'].includes(mode) ? mode : 'system';
        } catch (_) {
            return 'system';
        }
    }

    // 供后台/同步脚本在数据更新后主动触发
    window.applyThemePreferenceFromStorage = function () {
        checkDarkMode();
    };

    function ensureForcedThemeStyles() {
        if (document.getElementById('forced-theme-overrides')) return;

        const style = document.createElement('style');
        style.id = 'forced-theme-overrides';
        style.textContent = `
/* Injected by script.js to allow overriding prefers-color-scheme via admin setting. */
:root.force-light {
  --primary-color: #000;
  --secondary-color: #86868b;
  --accent-color: #0071e3;
  --background-color: #fff;
  --background-color-rgb: 255, 255, 255;
  --light-gray: #f5f5f7;
  --divider-color: #d2d2d7;
  --header-bg-color: rgba(255, 255, 255, 0.65);
  --header-bg-color-rgb: 255, 255, 255;
  --header-bg-scrolled: rgba(255, 255, 255, 0.75);
  --header-bg-scrolled-rgb: 255, 255, 255;
  --hero-content-bg: rgba(255, 255, 255, 0.8);
  --card-bg: white;
  --card-shadow: rgba(0, 0, 0, 0.1);
  --hero-bg-filter: brightness(0.7);
  --section-bg-overlay: rgba(255, 255, 255, 0.05);
  --timeline-color: #d2d2d7;
  --timeline-dot-color: #0033A0;
  --search-bg: rgba(0, 0, 0, 0.8);
  --search-box-bg: white;
  --search-result-border: var(--light-gray);
  --search-close-color: white;
  --country-fill: #d1d1d1;
  --country-stroke: #F4F4F4;
  --footprint-color: #0066ff;
  --footer-bg: var(--light-gray);
  --connect-wave-bg: #ffffff;
  --connect-wave-dot: rgba(38, 79, 140, 0.11);
  --connect-wave-dot-strong: rgba(38, 79, 140, 0.18);
  --connect-wave-glow: rgba(0, 113, 227, 0.06);
  --hero-code-bg: rgba(6, 24, 44, 0.06);
  --hero-code-border: rgba(15, 23, 42, 0.10);
  --hero-code-text: rgba(15, 23, 42, 0.86);
  --hero-code-accent: rgba(0, 113, 227, 0.95);
  --hero-glow-blue: rgba(0, 123, 255, 0.18);
  --hero-glow-orange: rgba(255, 140, 0, 0.12);
  --hero-sheen-start: rgba(255, 255, 255, 0.18);
  --hero-sheen-end: rgba(255, 255, 255, 0.03);
  --stack-surface: rgba(255, 255, 255, 0.52);
  --stack-border: rgba(255, 255, 255, 0.26);
  --stack-shadow: 0 -18px 60px rgba(15, 23, 42, 0.12);
  --stack-blur: 26px;
  --code-tok-kw: #AF00DB;
  --code-tok-type: #267F99;
  --code-tok-fn: #795E26;
  --code-tok-var: #001080;
  --code-tok-str: #A31515;
  --code-tok-num: #098658;
  --code-tok-op: #000000;
}

:root.force-light .contact-info {
  color: rgba(15, 23, 42, 0.72) !important;
}

:root.force-light .contact-info a {
  color: rgba(0, 113, 227, 0.95) !important;
}

:root.force-light .experience-logo img[data-invert-on-dark="true"],
:root.force-light .custom-icon,
:root.force-light .custom-project-icon {
  filter: none !important;
}

:root.force-dark {
  --primary-color: #f5f5f7;
  --secondary-color: #a1a1a6;
  --background-color: #1a1a1a;
  --background-color-rgb: 26, 26, 26;
  --light-gray: #2a2a2a;
  --divider-color: #38383c;
  --header-bg-color: rgba(26, 26, 26, 0.65);
  --header-bg-color-rgb: 26, 26, 26;
  --header-bg-scrolled: rgba(26, 26, 26, 0.75);
  --header-bg-scrolled-rgb: 26, 26, 26;
  --hero-content-bg: rgba(26, 26, 26, 0.8);
  --card-bg: #252525;
  --card-shadow: rgba(0, 0, 0, 0.3);
  --hero-bg-filter: brightness(0.4);
  --section-bg-overlay: rgba(0, 0, 0, 0.2);
  --timeline-color: #38383c;
  --timeline-dot-color: #0071e3;
  --search-bg: rgba(0, 0, 0, 0.9);
  --search-box-bg: #2a2a2a;
  --search-result-border: #38383c;
  --search-close-color: #f5f5f7;
  --country-fill: #333333;
  --country-stroke: #444444;
  --footprint-color: #0082fc;
  --footer-bg: #252525;
  --connect-wave-bg: #1a1a1a;
  --connect-wave-dot: rgba(170, 210, 255, 0.11);
  --connect-wave-dot-strong: rgba(190, 225, 255, 0.18);
  --connect-wave-glow: rgba(0, 130, 252, 0.10);
  --hero-code-bg: rgba(7, 12, 20, 0.62);
  --hero-code-border: rgba(148, 206, 255, 0.14);
  --hero-code-text: rgba(210, 230, 255, 0.88);
  --hero-code-accent: rgba(138, 180, 255, 0.95);
  --hero-glow-blue: rgba(0, 130, 252, 0.22);
  --hero-glow-orange: rgba(255, 164, 57, 0.14);
  --hero-sheen-start: rgba(26, 26, 26, 0.18);
  --hero-sheen-end: rgba(26, 26, 26, 0.04);
  --stack-surface: rgba(22, 22, 24, 0.42);
  --stack-border: rgba(255, 255, 255, 0.1);
  --stack-shadow: 0 -24px 72px rgba(0, 0, 0, 0.34);
  --stack-blur: 30px;
  --code-tok-kw: #C586C0;
  --code-tok-type: #4EC9B0;
  --code-tok-fn: #DCDCAA;
  --code-tok-var: #9CDCFE;
  --code-tok-str: #CE9178;
  --code-tok-num: #B5CEA8;
  --code-tok-op: rgba(210, 230, 255, 0.88);
}

:root.force-dark .experience-logo img[data-invert-on-dark="true"],
:root.force-dark .custom-icon,
:root.force-dark .custom-project-icon {
  filter: brightness(0) invert(1) !important;
}

:root.force-dark .hero-btn-ghost {
  background: rgba(0, 0, 0, 0.22) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
}

:root.force-dark .hero-btn-ghost:hover {
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.35) !important;
}

:root.force-dark .ai-chat-container {
  background-color: rgba(30, 30, 30, 0.6) !important;
  color: white !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

:root.force-dark .ai-chat-header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: rgba(0, 0, 0, 0.2) !important;
}

:root.force-dark .ai-chat-close {
  color: #aaa !important;
}

:root.force-dark .ai-chat-close:hover {
  background-color: rgba(255, 255, 255, 0.08) !important;
}

:root.force-dark .ai-chat-input-container {
  border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
  background-color: rgba(0, 0, 0, 0.2) !important;
}

:root.force-dark .ai-chat-input {
  background-color: rgba(50, 50, 50, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

:root.force-dark .ai-message-content {
  background-color: rgba(60, 60, 60, 0.8) !important;
  color: white !important;
}
`;
        document.head.appendChild(style);
    }

    function setMetaColorScheme(mode) {
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (!meta) return;
        if (mode === 'dark') meta.setAttribute('content', 'dark');
        else if (mode === 'light') meta.setAttribute('content', 'light');
        else meta.setAttribute('content', 'light dark');
    }

    // 检测深色模式（支持强制配置）
    checkDarkMode();
    
    // 监听系统深色模式变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    
    // 页面加载后更新位置信息
    function updatePositions() {
        heroSectionTop = heroSection.offsetTop;
        avatarSectionTop = avatarSection.offsetTop;
        
        // 页面加载时也检查滚动位置和设备类型
        const scrollPosition = window.scrollY;
        const heroHeight = heroSection.offsetHeight;
        const isMobile = window.innerWidth <= 768;
        
        // 根据设备类型决定是否显示header中的头像
        if (isMobile) {
            // 移动端：只有在hero区域滚出视图后才显示头像
            if (scrollPosition > heroSectionTop + heroHeight - 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
                
                // 确保在移动端初始加载时不显示头像
                if (scrollPosition === 0) {
                    header.classList.remove('scrolled');
                }
            }
        } else {
            // 桌面端：在轻微滚动后即显示头像
            if (scrollPosition > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    }
    
    // 检测系统深色模式并适配
    function checkDarkMode() {
        const forcedMode = getThemeModeFromStorage();
        ensureForcedThemeStyles();

        if (forcedMode === 'light') {
            document.documentElement.classList.add('force-light');
            document.documentElement.classList.remove('force-dark');
            setMetaColorScheme('light');
        } else if (forcedMode === 'dark') {
            document.documentElement.classList.add('force-dark');
            document.documentElement.classList.remove('force-light');
            setMetaColorScheme('dark');
        } else {
            document.documentElement.classList.remove('force-light');
            document.documentElement.classList.remove('force-dark');
            setMetaColorScheme('system');
        }

        const isDarkMode =
            forcedMode === 'dark'
                ? true
                : forcedMode === 'light'
                    ? false
                    : window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDarkMode) {
            document.documentElement.classList.add('dark-mode');
            // 调整地图颜色和组件（如果需要）
            updateMapForDarkMode(true);
        } else {
            document.documentElement.classList.remove('dark-mode');
            updateMapForDarkMode(false);
        }
    }
    
    // 更新地图深色模式（如果地图已初始化）
    function updateMapForDarkMode(isDark) {
        // 如果地图已经初始化，则更新其颜色
        const worldMap = d3.select('#world-map svg');
        if (!worldMap.empty()) {
            if (isDark) {
                worldMap.selectAll('path.country')
                    .attr('fill', getComputedStyle(document.documentElement).getPropertyValue('--country-fill').trim())
                    .attr('stroke', getComputedStyle(document.documentElement).getPropertyValue('--country-stroke').trim());
                
                worldMap.selectAll('.footprint')
                    .attr('fill', getComputedStyle(document.documentElement).getPropertyValue('--footprint-color').trim());
            } else {
                worldMap.selectAll('path.country')
                    .attr('fill', getComputedStyle(document.documentElement).getPropertyValue('--country-fill').trim())
                    .attr('stroke', getComputedStyle(document.documentElement).getPropertyValue('--country-stroke').trim());
                
                worldMap.selectAll('.footprint')
                    .attr('fill', getComputedStyle(document.documentElement).getPropertyValue('--footprint-color').trim());
            }
        }
    }
    
    // 页面加载和窗口调整时更新位置
    window.addEventListener('load', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        const heroHeight = document.querySelector('.hero').offsetHeight;
        const heroTop = document.querySelector('.hero').offsetTop;
        const isMobile = window.innerWidth <= 768;
        
        // 根据不同设备类型确定显示导航栏头像的滚动位置
        if (isMobile) {
            // 移动端：只有在hero区域完全滚出视图后才显示头像
            if (scrollPosition > heroTop + heroHeight - 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        } else {
            // 桌面端：在轻微滚动后即显示头像
            if (scrollPosition > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        
        // 为了性能优化，使用requestAnimationFrame
        if (!window.requestAnimationFrame) return;
        
        // 如果已经有等待执行的动画帧，则取消
        if (window.scrollAnimationFrame) {
            window.cancelAnimationFrame(window.scrollAnimationFrame);
        }
        
        // 请求新的动画帧
        window.scrollAnimationFrame = window.requestAnimationFrame(() => {
            // 在这里添加可能的额外动画效果
        });
    });
    
    // 初始化各个功能
    initLanguageToggle();
    initScrollAnimation();
    initNavHighlight();
    initWorldMap();
    initSearchFeature();
    initMobileScrollSelector();
    addLanguageIcon();
    
    // 为hero部分添加背景图
    const heroBg = document.createElement('div');
    heroBg.className = 'hero-bg';
    heroBg.style.backgroundImage = "url('assets/images/background.jpg')";
    document.querySelector('.hero').prepend(heroBg);
    
	    // 重组hero区域布局
	    reorganizeHeroLayout();
	    initAvatarFlip();
	    initHeroSummaryTypingOnce();
	    updateDynamicAgeDisplays();
	    initHeroPointerDispersion();
        initHeroOverlayFade();

	    // 项目轮播功能
	    initProjectsCarousel();
    
    // 立即检查是否是移动设备，并强制更新header状态
    if (window.innerWidth <= 768) {
        // 移动设备上，初始状态应该移除scrolled类（除非已经滚动了）
        if (window.scrollY === 0) {
            header.classList.remove('scrolled');
        }
    }
	});

	function initAvatarFlip() {
	    const inner = document.querySelector('.avatar-inner-circle');
	    const flip = inner ? inner.querySelector('.avatar-flip') : null;
	    if (!inner || !flip) return;

	    const canHover =
	        window.matchMedia &&
	        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	    const reduceMotion =
	        window.matchMedia &&
	        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

	    let hovering = false;
	    let autoPending = false;
	    let autoIntervalId = 0;

	    let currentRx = 0;
	    let currentRy = 0;
	    let targetRx = 0;
	    let targetRy = 0;
	    let rafId = 0;

	    const writeVars = () => {
	        // Use a gentle ease so motion feels "soft" rather than robotic.
	        const ease = 0.12;
	        currentRx += (targetRx - currentRx) * ease;
	        currentRy += (targetRy - currentRy) * ease;

	        inner.style.setProperty('--avatar-hover-rx', `${currentRx.toFixed(2)}deg`);
	        inner.style.setProperty('--avatar-hover-ry', `${currentRy.toFixed(2)}deg`);

	        if (Math.abs(targetRx - currentRx) < 0.05 && Math.abs(targetRy - currentRy) < 0.05) {
	            rafId = 0;
	            return;
	        }
	        rafId = window.requestAnimationFrame(writeVars);
	    };

	    const ensureRaf = () => {
	        if (!rafId) rafId = window.requestAnimationFrame(writeVars);
	    };

	    const toggleFlip = (fromAuto = false) => {
	        if (fromAuto && hovering) {
	            autoPending = true;
	            return;
	        }
	        inner.classList.toggle('is-flipped');
	    };

	    const restartAuto = () => {
	        if (reduceMotion) return;
	        if (autoIntervalId) window.clearInterval(autoIntervalId);
	        autoIntervalId = window.setInterval(() => toggleFlip(true), 10000);
	    };

	    // Click or keyboard activates a full flip.
	    const onActivate = (e) => {
	        if (e) e.preventDefault();
	        toggleFlip(false);
	        restartAuto();
	    };
	    flip.addEventListener('click', onActivate);
	    flip.addEventListener('keydown', (e) => {
	        if (e.key === 'Enter' || e.key === ' ') onActivate(e);
	    });

	    if (canHover && !reduceMotion) {
	        flip.addEventListener('pointerenter', () => {
	            hovering = true;
	        });

	        flip.addEventListener('pointerleave', () => {
	            hovering = false;
	            // Return to neutral, softly.
	            targetRx = 0;
	            targetRy = 0;
	            ensureRaf();
	            if (autoPending) {
	                autoPending = false;
	                toggleFlip(true);
	            }
	        });

	        flip.addEventListener('pointermove', (e) => {
	            const rect = inner.getBoundingClientRect();
	            const x = (e.clientX - rect.left) / rect.width; // 0..1
	            const y = (e.clientY - rect.top) / rect.height; // 0..1

	            // 1/3 flip feel: keep Y-rotation within +/-60deg.
	            const maxY = inner.classList.contains('is-flipped') ? 15 : 60;
	            const maxX = 18;

	            targetRy = clamp((x - 0.5) * 2 * maxY, -maxY, maxY);
	            targetRx = clamp(-(y - 0.5) * 2 * maxX, -maxX, maxX);
	            ensureRaf();
	        });
	    }

	    // Start the 10s auto flip.
	    restartAuto();
	}

function initHeroPointerDispersion() {
    const heroContainer = document.querySelector('.hero .container');
    if (!heroContainer) {
        return;
    }

    // Only enable the effect on devices where it feels right (desktop hover + fine pointer).
    const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!canHover || reduceMotion) {
        return;
    }

    // Start position matches the CSS fallback. The glow field drifts on its own,
    // and pointer movement only gently biases that drift.
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    let posX = 80;
    let posY = 30;
    let pointerX = posX;
    let pointerY = posY;
    let pointerInfluence = 0;
    let pointerActive = false;

    const write = () => {
        heroContainer.style.setProperty('--hero-glow-x', `${posX.toFixed(2)}%`);
        heroContainer.style.setProperty('--hero-glow-y', `${posY.toFixed(2)}%`);
    };

    write();

    const tick = (now = performance.now()) => {
        const t = now * 0.000075;
        const ambientX =
            80 +
            Math.sin(t * 0.95) * 4.2 +
            Math.cos(t * 0.33) * 2.1;
        const ambientY =
            30 +
            Math.cos(t * 0.74) * 3.6 +
            Math.sin(t * 0.41) * 1.5;

        const influenceTarget = pointerActive ? 0.28 : 0;
        pointerInfluence += (influenceTarget - pointerInfluence) * 0.02;

        const targetX = ambientX * (1 - pointerInfluence) + pointerX * pointerInfluence;
        const targetY = ambientY * (1 - pointerInfluence) + pointerY * pointerInfluence;

        // Pure easing, no spring, no bounce.
        posX += (targetX - posX) * 0.018;
        posY += (targetY - posY) * 0.018;
        posX = clamp(posX, 0, 100);
        posY = clamp(posY, 0, 100);
        write();
        window.requestAnimationFrame(tick);
    };

    const onMove = (event) => {
        const rect = heroContainer.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
        pointerX = x;
        pointerY = y;
        pointerActive = true;
    };

    const onLeave = () => {
        pointerActive = false;
    };

    heroContainer.addEventListener('pointermove', onMove, { passive: true });
    heroContainer.addEventListener('pointerleave', onLeave, { passive: true });
    window.requestAnimationFrame(tick);
}

function calculateAgeFromBirthdate(birthdateString) {
    const birthdate = new Date(birthdateString);
    const today = new Date();

    let age = today.getFullYear() - birthdate.getFullYear();
    const hasHadBirthdayThisYear =
        today.getMonth() > birthdate.getMonth() ||
        (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate());

    if (!hasHadBirthdayThisYear) {
        age -= 1;
    }

    return age;
}

function updateDynamicAgeDisplays() {
    document.querySelectorAll('.dynamic-age').forEach((element) => {
        const birthdate = element.getAttribute('data-birthdate');
        if (!birthdate) {
            return;
        }

        element.textContent = String(calculateAgeFromBirthdate(birthdate));
    });
}

window.updateDynamicAgeDisplays = updateDynamicAgeDisplays;

// 重组hero区域布局
function reorganizeHeroLayout() {
    const heroContainer = document.querySelector('.hero .container');
    const avatarContainer = document.querySelector('.avatar-container');
    const nameElement = document.querySelector('.name');
    const contactInfo = document.querySelector('.contact-info');
    
    // 创建新的hero内容容器
    const heroContent = document.createElement('div');
    heroContent.className = 'hero-content';
    
    // 创建个人信息容器
    const heroInfo = document.createElement('div');
    heroInfo.className = 'hero-info';

    const kicker = document.createElement('div');
    kicker.className = 'hero-kicker';
    kicker.setAttribute('data-en', "HELLO, I'M");
    kicker.setAttribute('data-zh', '你好，我是');
    kicker.innerHTML = `<span class="hero-kicker-dot" aria-hidden="true"></span><span class="hero-kicker-text">HELLO, I'M</span>`;

    const summary = document.createElement('p');
    summary.className = 'hero-summary';
    summary.setAttribute(
        'data-en',
        'AI product + interaction design, with an architecture background. I care about clarity, craft, and shipping things people actually use.'
    );
    summary.setAttribute(
        'data-zh',
        'AI 产品与交互设计方向，建筑背景出身。我关注清晰表达、体验细节，以及把真正能用的东西做出来。'
    );
    setHeroSummaryHighlighted(summary, 'en');

    const cta = document.createElement('div');
    cta.className = 'hero-cta';
    cta.innerHTML = `
        <a class="hero-btn hero-btn-primary" href="#experience">Explore Experience</a>
        <a class="hero-btn hero-btn-ghost" href="#recent-projects">View Projects</a>
    `;
    
    // 创建位置信息
    const locationInfo = document.createElement('div');
    locationInfo.className = 'location-info';
    locationInfo.innerHTML = '<i class="fas fa-map-marker-alt"></i>Shanghai';
    locationInfo.style.display = 'flex';
    locationInfo.style.alignItems = 'center';
    
    // 重组结构
    heroInfo.appendChild(kicker);
    heroInfo.appendChild(nameElement.cloneNode(true));
    heroInfo.appendChild(locationInfo);
    heroInfo.appendChild(contactInfo.cloneNode(true));
    heroInfo.appendChild(summary);
    heroInfo.appendChild(cta);
    
    // 将头像和信息容器添加到hero内容容器
    heroContent.appendChild(avatarContainer);
    heroContent.appendChild(heroInfo);
    
    // 清空原容器并添加新结构
    heroContainer.innerHTML = '';
    heroContainer.appendChild(heroContent);
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildHighlightedHtml(text, rules) {
    const source = String(text || '');
    if (!source) return '';

    const matches = [];
    for (const rule of rules) {
        const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : `${rule.re.flags}g`);
        let m;
        while ((m = re.exec(source))) {
            matches.push({
                start: m.index,
                end: m.index + m[0].length,
                cls: rule.cls,
                len: m[0].length
            });
            // Avoid zero-length infinite loops.
            if (m[0].length === 0) re.lastIndex += 1;
        }
    }

    if (!matches.length) return escapeHtml(source);

    matches.sort((a, b) => (a.start - b.start) || (b.len - a.len));
    const picked = [];
    let cursor = 0;
    for (const m of matches) {
        if (m.start < cursor) continue;
        picked.push(m);
        cursor = m.end;
    }

    let out = '';
    let i = 0;
    for (const m of picked) {
        out += escapeHtml(source.slice(i, m.start));
        out += `<span class="${m.cls}">${escapeHtml(source.slice(m.start, m.end))}</span>`;
        i = m.end;
    }
    out += escapeHtml(source.slice(i));
    return out;
}

function parseManualHighlightMarkup(raw) {
    // Format: [[type:AI]] [[kw:architecture]] [[fn:shipping]] [[var:interaction design]]
    // Unknown tokens fall back to plain text (escaped).
    const src = String(raw || '');
    if (!src.includes('[[')) return null;

    const tokenToClass = {
        kw: 'code-tok-kw',
        type: 'code-tok-type',
        fn: 'code-tok-fn',
        var: 'code-tok-var',
        str: 'code-tok-str',
        num: 'code-tok-num',
        op: 'code-tok-op'
    };

    let out = '';
    let i = 0;
    const re = /\[\[\s*([a-zA-Z]+)\s*:\s*([\s\S]*?)\s*\]\]/g;
    let m;
    while ((m = re.exec(src))) {
        out += escapeHtml(src.slice(i, m.index));
        const key = String(m[1] || '').toLowerCase();
        const text = String(m[2] || '');
        const cls = tokenToClass[key];
        if (cls) out += `<span class="${cls}">${escapeHtml(text)}</span>`;
        else out += escapeHtml(m[0]);
        i = m.index + m[0].length;
    }
    out += escapeHtml(src.slice(i));
    return out;
}

function setHeroSummaryHighlighted(summaryEl, lang) {
    if (!summaryEl) return;
    // During typing, do not let other flows overwrite the content (prevents duplication).
    if (heroSummaryTypingLock) return;
    const raw =
        summaryEl.getAttribute(`data-${lang}`) ||
        summaryEl.getAttribute('data-en') ||
        summaryEl.textContent ||
        '';

    // 1) Manual markup wins (lets admin assign colors precisely).
    const manual = parseManualHighlightMarkup(raw);
    if (manual != null) {
        summaryEl.innerHTML = manual;
        return;
    }

    const enRules = [
        { re: /\bAI\b/i, cls: 'code-tok-type' },
        { re: /\b(product|interaction|design)\b/gi, cls: 'code-tok-var' },
        { re: /\barchitecture\b/gi, cls: 'code-tok-kw' },
        { re: /\bclarity\b/gi, cls: 'code-tok-fn' },
        { re: /\bcraft\b/gi, cls: 'code-tok-fn' },
        { re: /\bshipping\b/gi, cls: 'code-tok-fn' },
        { re: /[+.,]/g, cls: 'code-tok-op' }
    ];

    const zhRules = [
        { re: /\bAI\b/g, cls: 'code-tok-type' },
        { re: /产品|交互设计|交互|设计/g, cls: 'code-tok-var' },
        { re: /建筑|建筑背景/g, cls: 'code-tok-kw' },
        { re: /清晰表达|体验细节|做出来/g, cls: 'code-tok-fn' },
        { re: /[+，。、]/g, cls: 'code-tok-op' }
    ];

    const rules = lang && String(lang).toLowerCase().startsWith('zh') ? zhRules : enRules;
    summaryEl.innerHTML = buildHighlightedHtml(raw, rules);
}

// Expose for admin-sync updates.
window.setHeroSummaryHighlighted = setHeroSummaryHighlighted;

function buildHeroSummarySegments(rootEl) {
    // Flatten highlighted DOM into segments: { classes: string[], text: string }
    const segments = [];
    const walk = (node, classes) => {
        if (node.nodeType === Node.TEXT_NODE) {
            // Only keep code token classes. Never propagate container/layout classes like "hero-summary".
            const safeClasses = (classes || []).filter((c) => String(c || '').startsWith('code-tok-'));
            segments.push({ classes: safeClasses, text: node.nodeValue || '' });
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node;
        const own = el.classList && el.classList.length ? Array.from(el.classList) : [];
        const nextClasses = own.length
            ? Array.from(new Set([...(classes || []), ...own]))
            : (classes || []);
        for (const child of Array.from(el.childNodes)) walk(child, nextClasses);
    };
    walk(rootEl, []);
    return segments.filter(s => s.text);
}

function renderHeroSummaryTyping(summaryEl, lang) {
    if (!summaryEl) return;

    // Build the final highlighted content first.
    const prevLock = heroSummaryTypingLock;
    heroSummaryTypingLock = false;
    setHeroSummaryHighlighted(summaryEl, lang);
    heroSummaryTypingLock = prevLock;
    const segments = buildHeroSummarySegments(summaryEl);

    // ChatGPT-like: type characters into the existing layout (natural wrapping),
    // while preserving highlight spans.
    summaryEl.innerHTML = '';

    const totalChars = segments.reduce((n, s) => n + s.text.length, 0);
    const totalMs = 5000;
    const msPerChar = totalChars ? Math.max(12, Math.min(40, Math.floor(totalMs / totalChars))) : 20;

    let segIndex = 0;
    let charIndex = 0;
    let currentSpan = null;
    let currentSpanClassesKey = '';

    const ensureSpan = (classes) => {
        const key = (classes || []).join(' ');
        if (!currentSpan || key !== currentSpanClassesKey) {
            currentSpanClassesKey = key;
            if (key) {
                currentSpan = document.createElement('span');
                currentSpan.className = key;
                summaryEl.appendChild(currentSpan);
            } else {
                currentSpan = null;
            }
        }
    };

    const appendChar = (cls, ch) => {
        ensureSpan(cls);
        if (currentSpan) currentSpan.appendChild(document.createTextNode(ch));
        else summaryEl.appendChild(document.createTextNode(ch));
    };

    const tick = () => {
        if (!heroSummaryTypingActive) return;
        if (segIndex >= segments.length) {
            // Typing done: allow language/sync flows to rewrite normally.
            heroSummaryTypingLock = false;
            return;
        }

        const seg = segments[segIndex];
        const ch = seg.text[charIndex];
        appendChar(seg.classes, ch);
        charIndex += 1;

        if (charIndex >= seg.text.length) {
            segIndex += 1;
            charIndex = 0;
        }

        heroSummaryTypingTimerId = window.setTimeout(tick, msPerChar);
    };

    tick();
}

let heroSummaryTypingActive = false;
let heroSummaryTypingTimerId = 0;
let heroSummaryTypingLock = false;
function stopHeroSummaryTyping() {
    heroSummaryTypingActive = false;
    heroSummaryTypingLock = false;
    if (heroSummaryTypingTimerId) {
        window.clearTimeout(heroSummaryTypingTimerId);
        heroSummaryTypingTimerId = 0;
    }
}
window.stopHeroSummaryTyping = stopHeroSummaryTyping;

function initHeroSummaryTypingOnce() {
    const summaryEl = document.querySelector('.hero-summary');
    if (!summaryEl) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    // Run on each page load (open or refresh). If the admin sync updates the text right after
    // DOMContentLoaded, we delay slightly so we type the latest content.
    heroSummaryTypingActive = true;
    heroSummaryTypingLock = true;
    const lang = document.documentElement.getAttribute('lang') === 'zh' ? 'zh' : 'en';

    // Delay to let initial sync (if any) apply profile.summary first.
    heroSummaryTypingTimerId = window.setTimeout(() => {
        heroSummaryTypingTimerId = 0;
        if (!heroSummaryTypingActive) return;
        // Start from empty box and type once.
        summaryEl.textContent = '';
        renderHeroSummaryTyping(summaryEl, lang);
    }, 650);
}

// 语言切换功能
function initLanguageToggle() {
    const languageToggle = document.getElementById('language-toggle');
    const langText = languageToggle.querySelector('.lang-text');
    const nameElement = document.querySelector('.name');
    
    // 定义英文, 简体中文和繁体中文的内容映射
    const translations = {
        'en': {
            // 导航
            'nav_education': 'Education',
            'nav_experience': 'Experience',
            'nav_papers': 'Papers',
            'nav_awards': 'Awards',
            'nav_footprints': 'Footprints',
            'lang_toggle': '简体中文',
            
            // 章节标题
            'section_education': 'Education',
            'section_experience': 'Work Experience',
            'section_papers': 'Papers & Patents',
            'section_awards': 'Awards',
            'section_footprints': 'My Footprints',
            'section_social': 'Connect With Me',
            
            // 教育经历
            'education_cityu': 'City University of Hong Kong',
            'education_cityu_meta': 'QS Ranking: 62',
            'education_cityu_details': 'College of Innovation | MSc in Venture Creation (Offer Received)',
            
            'education_ecust': 'East China University of Science and Technology',
            'education_ecust_meta': 'Top 211 (Cross-Major Admission)',
            'education_ecust_details': 'School of Design | Design (Intelligent Product Interaction Design)',
            'education_ecust_time': '2025.09 - 2028.06',
            'education_ecust_research': 'Research Focus: Intelligent Product Design, Industrial Design Engineering, AIGC Design, Large Model Training, Service Design',
            
            'education_sju': 'Shandong Jianzhu University',
            'education_sju_meta': 'National First-Class Undergraduate Program / SoftScience Evaluation A',
            'education_sju_details': 'School of Architecture and Urban Planning | Architecture (Green Building Design Direction)',
            'education_sju_time': '2021.09 - 2025.06',
            'education_sju_stats': 'GPA: 3.91/5 | Rank: 2/159',
            'education_sju_awards': 'Awards: National Scholarship (1‰), First-Class Outstanding Student Scholarship (1%), Outstanding Student Pacesetter (1%), etc. Total of 12 national awards, 25 provincial awards, 6 university-level awards',
            
            // 工作经历
            'exp_nio_title': 'NIO Headquarters (Shanghai) - Intelligent Cockpit - Media & Entertainment Ecosystem',
            'exp_nio_meta': 'AI Product Manager for Intelligent Cockpit',
            'exp_nio_time': '2025.10 - 2026.02',

            'exp_ikea_title': 'IKEA China - Digital Innovation Center (IKEA Digital Hub)',
            'exp_ikea_meta': 'Shanghai | Global Product Collage (GPC) Team | Product Manager, Interaction Designer',
            'exp_ikea_time': '2024.07 - 2024.12',
            
            'exp_smartsite_title': 'Smart Site360 Mini Program',
            'exp_smartsite_meta': 'Project Lead, Product Manager, UX Designer',
            'exp_smartsite_time': '2024.05 - 2025.05',
            
            'exp_matconstruct_title': 'Matconstruct Mini Program',
            'exp_matconstruct_meta': 'Project Lead, Product Manager, UX Designer',
            'exp_matconstruct_time': '2023.05 - 2023.09',
            
            'exp_google_title': 'Google China Developer Conference',
            'exp_google_meta': 'Shanghai | Gemini AI',
            'exp_google_time': '2025.04',
            
            // 技能
            'skill_prototype': 'Prototype Design',
            'skill_ai_programming': 'AI Programming',
            'skill_ai_drawing': 'AI Drawing',
            'skill_3d': '3D Modeling',
            
            // 页脚
            'footer_copyright': '© 2024 Travis Tse. All Rights Reserved.',
            
            // 论文
            'paper_title_1': 'Research on Interactive Service System Design for Traditional Village Cultural Heritage under the Background of "Cultural Innovation"',
            'paper_authors_1': 'Travis Tse, Jiang Wang. 2024 Computational Design Academic Forum Annual Conference Proceedings [C]. Tongji University Press',
            
            // 位置
            'location': 'Shanghai'
        },
        'zh-CN': {
            // 导航
            'nav_education': '教育经历',
            'nav_experience': '工作经历',
            'nav_papers': '论文',
            'nav_awards': '奖项',
            'nav_footprints': '足迹',
            'lang_toggle': '繁體中文',
            
            // 章节标题
            'section_education': '教育背景',
            'section_experience': '工作与实习经历',
            'section_papers': '论文与专利',
            'section_awards': '获奖经历',
            'section_footprints': '我的足迹',
            'section_social': '社交媒体',
            
            // 教育经历
            'education_cityu': '香港城市大学',
            'education_cityu_meta': 'QS排名: 62',
            'education_cityu_details': '创新学院 | 创新创业理学硕士 (MSc Venture Creation) (已获录取)',
            
            'education_ecust': '华东理工大学',
            'education_ecust_meta': '211高校 (跨专业保送)',
            'education_ecust_details': '设计学院 | 设计学（智能产品交互设计）',
            'education_ecust_time': '2025.09 - 2028.06',
            'education_ecust_research': '重点研究方向: 智能产品设计、工业设计工程、AIGC设计、大模型训练、服务设计',
            
            'education_sju': '山东建筑大学',
            'education_sju_meta': '国家一流本科专业/软科评估A',
            'education_sju_details': '建筑城规学院 | 建筑学(绿色建筑设计方向)',
            'education_sju_time': '2021.09 - 2025.06',
            'education_sju_stats': 'GPA: 3.91/5 | 专业排名: 2/159',
            'education_sju_awards': '获奖经历: 国家奖学金(1‰)、优秀学生一等奖学金(1%)、优秀学生标兵(1%) 等共计12项国家级奖项，25项省级奖项，6项校级奖项',
            
            // 工作经历
            'exp_nio_title': '蔚来汽车总部(上海) - 座舱智能化 - 媒体娱乐生态业务',
            'exp_nio_meta': '智能座舱AI产品经理',
            'exp_nio_time': '2025.10 - 2026.02',

            'exp_ikea_title': '宜家中国 - 数字创新中心(IKEA Digital Hub)',
            'exp_ikea_meta': '上海 | Global Product Collage(GPC)组 | 产品经理、交互设计师',
            'exp_ikea_time': '2024.07 - 2024.12',
            
            'exp_smartsite_title': 'Smart Site360 小程序',
            'exp_smartsite_meta': '项目负责人、产品经理、UX设计师',
            'exp_smartsite_time': '2024.05 - 2025.05',
            
            'exp_matconstruct_title': 'Matconstruct 小程序',
            'exp_matconstruct_meta': '项目负责人、产品经理、UX设计师',
            'exp_matconstruct_time': '2023.05 - 2023.09',
            
            'exp_google_title': '谷歌中国开发者大会',
            'exp_google_meta': '上海 | Gemini AI',
            'exp_google_time': '2025.04',
            
            // 技能
            'skill_prototype': '原型设计',
            'skill_ai_programming': 'AI 编程',
            'skill_ai_drawing': 'AI 绘画',
            'skill_3d': '3D建模',
            
            // 页脚
            'footer_copyright': '© 2024 谢堂华 Travis Tse. 版权所有。',
            
            // 论文
            'paper_title_1': '"文化双创"背景下传统村落文化遗产交互服务系统设计研究',
            'paper_authors_1': '谢堂华, 王江. 2024计算性设计学术论坛年会论文集[C]. 同济大学出版社',
            
            // 位置
            'location': '上海'
        },
        'zh-TW': {
            // 導航
            'nav_education': '教育經歷',
            'nav_experience': '工作經歷',
            'nav_papers': '論文',
            'nav_awards': '獎項',
            'nav_footprints': '足跡',
            'lang_toggle': 'English',
            
            // 章節標題
            'section_education': '教育背景',
            'section_experience': '工作與實習經歷',
            'section_papers': '論文與專利',
            'section_awards': '獲獎經歷',
            'section_footprints': '我的足跡',
            'section_social': '社交媒體',
            
            // 教育經歷
            'education_cityu': '香港城市大學',
            'education_cityu_meta': 'QS排名: 62',
            'education_cityu_details': '創新學院 | 創新創業理學碩士 (MSc Venture Creation) (已獲錄取)',
            
            'education_ecust': '華東理工大學',
            'education_ecust_meta': '211高校 (跨專業保送)',
            'education_ecust_details': '設計學院 | 設計學（智能產品交互設計）',
            'education_ecust_time': '2025.09 - 2028.06',
            'education_ecust_research': '重點研究方向: 智能產品設計、工業設計工程、AIGC設計、大模型訓練、服務設計',
            
            'education_sju': '山東建築大學',
            'education_sju_meta': '國家一流本科專業/軟科評估A',
            'education_sju_details': '建築城規學院 | 建築學(綠色建築設計方向)',
            'education_sju_time': '2021.09 - 2025.06',
            'education_sju_stats': 'GPA: 3.91/5 | 專業排名: 2/159',
            'education_sju_awards': '獲獎經歷: 國家獎學金(1‰)、優秀學生一等獎學金(1%)、優秀學生標兵(1%) 等共計12項國家級獎項，25項省級獎項，6項校級獎項',
            
            // 工作經歷
            'exp_nio_title': '蔚來汽車總部(上海) - 座艙智能化 - 媒體娛樂生態業務',
            'exp_nio_meta': '智能座艙AI產品經理',
            'exp_nio_time': '2025.10 - 2026.02',

            'exp_ikea_title': '宜家中國 - 數字創新中心(IKEA Digital Hub)',
            'exp_ikea_meta': '上海 | Global Product Collage(GPC)組 | 產品經理、交互設計師',
            'exp_ikea_time': '2024.07 - 2024.12',
            
            'exp_smartsite_title': 'Smart Site360 小程序',
            'exp_smartsite_meta': '項目負責人、產品經理、UX設計師',
            'exp_smartsite_time': '2024.05 - 2025.05',
            
            'exp_matconstruct_title': 'Matconstruct 小程序',
            'exp_matconstruct_meta': '項目負責人、產品經理、UX設計師',
            'exp_matconstruct_time': '2023.05 - 2023.09',
            
            'exp_google_title': '谷歌中國開發者大會',
            'exp_google_meta': '上海 | Gemini AI',
            'exp_google_time': '2025.04',
            
            // 技能
            'skill_prototype': '原型設計',
            'skill_ai_programming': 'AI 編程',
            'skill_ai_drawing': 'AI 繪畫',
            'skill_3d': '3D建模',
            
            // 頁腳
            'footer_copyright': '© 2024 謝堂華 Travis Tse. 版權所有。',
            
            // 論文
            'paper_title_1': '"文化雙創"背景下傳統村落文化遺產交互服務系統設計研究',
            'paper_authors_1': '謝堂華, 王江. 2024計算性設計學術論壇年會論文集[C]. 同濟大學出版社',
            
            // 位置
            'location': '上海'
        }
    };
    
    // 当前语言，默认为英文
    let currentLang = 'en';
    
    // 切换语言函数
    function toggleLanguage() {
        // 循环切换语言: 英文 -> 简体中文 -> 繁体中文 -> 英文
        if (currentLang === 'en') {
            currentLang = 'zh-CN';
        } else if (currentLang === 'zh-CN') {
            currentLang = 'zh-TW';
        } else {
            currentLang = 'en';
        }
        
        // 更新页面语言
        updatePageLanguage();
    }
    
    // 更新页面语言
		    function updatePageLanguage() {
	        // 更新导航链接
	        document.querySelectorAll('.nav-link').forEach(link => {
	            const key = link.getAttribute('href').substring(1);
	            link.textContent = translations[currentLang][`nav_${key}`];
	        });
        
        // 更新侧边栏链接
        document.querySelectorAll('.sidebar-link').forEach(link => {
            const key = link.getAttribute('href').substring(1);
            link.textContent = translations[currentLang][`nav_${key}`];
        });
        
        // 更新各部分标题
        document.querySelectorAll('.section-title').forEach(title => {
            const section = title.closest('section').id;
            if (translations[currentLang][`section_${section}`]) {
                title.textContent = translations[currentLang][`section_${section}`];
            }
        });
        
	        // 更新姓名显示
	        if (nameElement) {
	            nameElement.textContent = nameElement.getAttribute(`data-${currentLang}`);
	        }

	        // 更新Hero文案（桌面端展示）
	        const heroKicker = document.querySelector('.hero-kicker');
	        if (heroKicker) {
	            const kickerText = heroKicker.getAttribute(`data-${currentLang}`) || heroKicker.getAttribute('data-en') || '';
	            const kickerSpan = heroKicker.querySelector('.hero-kicker-text');
	            if (kickerSpan) kickerSpan.textContent = kickerText;
	        }

		        const heroSummary = document.querySelector('.hero-summary');
		        if (heroSummary) {
		            setHeroSummaryHighlighted(heroSummary, currentLang);
		        }

	        const heroCta = document.querySelector('.hero-cta');
	        if (heroCta) {
	            const ctaMap = {
	                'en': ['Explore Experience', 'View Projects'],
	                'zh-CN': ['查看经历', '查看项目'],
	                'zh-TW': ['查看經歷', '查看項目']
	            };
	            const [t1, t2] = ctaMap[currentLang] || ctaMap.en;
	            const links = heroCta.querySelectorAll('a');
	            if (links[0]) links[0].textContent = t1;
	            if (links[1]) links[1].textContent = t2;
	        }

	        // 更新Hero位置
	        const locationEl = document.querySelector('.location-info');
	        if (locationEl && translations[currentLang]['location']) {
	            locationEl.innerHTML = `<i class="fas fa-map-marker-alt"></i>${translations[currentLang]['location']}`;
	        }
	        
	        // 更新教育经历
	        const educationItems = document.querySelectorAll('.education-item');
	        if(educationItems.length >= 3) {
	            // 香港城市大学
            const cityU = educationItems[0];
            cityU.querySelector('h3').textContent = translations[currentLang]['education_cityu'];
            cityU.querySelector('.education-meta').textContent = translations[currentLang]['education_cityu_meta'];
            cityU.querySelector('.education-details').textContent = translations[currentLang]['education_cityu_details'];
            
            // 华东理工大学
            const ecust = educationItems[1];
            ecust.querySelector('h3').textContent = translations[currentLang]['education_ecust'];
            ecust.querySelector('.education-meta').textContent = translations[currentLang]['education_ecust_meta'];
            ecust.querySelector('.education-details').textContent = translations[currentLang]['education_ecust_details'];
            ecust.querySelector('.education-time').textContent = translations[currentLang]['education_ecust_time'];
            ecust.querySelector('.education-research').textContent = translations[currentLang]['education_ecust_research'];
            
            // 山东建筑大学
            const sju = educationItems[2];
            sju.querySelector('h3').textContent = translations[currentLang]['education_sju'];
            sju.querySelector('.education-meta').textContent = translations[currentLang]['education_sju_meta'];
            sju.querySelector('.education-details').textContent = translations[currentLang]['education_sju_details'];
            sju.querySelector('.education-time').textContent = translations[currentLang]['education_sju_time'];
            sju.querySelector('.education-stats').textContent = translations[currentLang]['education_sju_stats'];
            sju.querySelector('.education-awards').textContent = translations[currentLang]['education_sju_awards'];
        }
        
        // 更新工作经历
        const experienceItems = document.querySelectorAll('.experience-item');
        if(experienceItems.length >= 5) {
            // 蔚来
            const nio = experienceItems[0];
            nio.querySelector('h3').textContent = translations[currentLang]['exp_nio_title'];
            nio.querySelector('.experience-meta').textContent = translations[currentLang]['exp_nio_meta'];
            nio.querySelector('.experience-time').textContent = translations[currentLang]['exp_nio_time'];

            // 宜家
            const ikea = experienceItems[1];
            ikea.querySelector('h3').textContent = translations[currentLang]['exp_ikea_title'];
            ikea.querySelector('.experience-meta').textContent = translations[currentLang]['exp_ikea_meta'];
            ikea.querySelector('.experience-time').textContent = translations[currentLang]['exp_ikea_time'];

            // Smart Site360
            const smartSite = experienceItems[2];
            smartSite.querySelector('h3').textContent = translations[currentLang]['exp_smartsite_title'];
            smartSite.querySelector('.experience-meta').textContent = translations[currentLang]['exp_smartsite_meta'];
            smartSite.querySelector('.experience-time').textContent = translations[currentLang]['exp_smartsite_time'];

            // Matconstruct
            const matConstruct = experienceItems[3];
            matConstruct.querySelector('h3').textContent = translations[currentLang]['exp_matconstruct_title'];
            matConstruct.querySelector('.experience-meta').textContent = translations[currentLang]['exp_matconstruct_meta'];
            matConstruct.querySelector('.experience-time').textContent = translations[currentLang]['exp_matconstruct_time'];

            // Google
            const google = experienceItems[4];
            google.querySelector('h3').textContent = translations[currentLang]['exp_google_title'];
            google.querySelector('.experience-meta').textContent = translations[currentLang]['exp_google_meta'];
            google.querySelector('.experience-time').textContent = translations[currentLang]['exp_google_time'];
        }
        
        // 更新技能
        const skillCategories = document.querySelectorAll('.skill-category');
        if(skillCategories.length >= 4) {
            skillCategories[0].querySelector('h3').textContent = translations[currentLang]['skill_prototype'];
            skillCategories[1].querySelector('h3').textContent = translations[currentLang]['skill_ai_programming'];
            skillCategories[2].querySelector('h3').textContent = translations[currentLang]['skill_ai_drawing'];
            skillCategories[3].querySelector('h3').textContent = translations[currentLang]['skill_3d'];
        }
        
        // 更新页脚版权信息
        const copyrightEl = document.getElementById('copyright-text') || document.querySelector('footer p');
        if (copyrightEl) {
            copyrightEl.textContent = translations[currentLang]['footer_copyright'];
        }
        
        // 更新语言切换按钮文本
        langText.textContent = translations[currentLang]['lang_toggle'];
        
        // 更新论文
        const paperLinks = document.querySelectorAll('.paper-link');
        if (paperLinks.length > 0) {
            paperLinks[0].textContent = translations[currentLang]['paper_title_1'];
            const paperAuthors = paperLinks[0].closest('.timeline-content').querySelector('p');
            if (paperAuthors) {
                paperAuthors.textContent = translations[currentLang]['paper_authors_1'];
            }
        }
    }
    
    // 注册语言切换事件
    languageToggle.addEventListener('click', toggleLanguage);
}

// 滚动动画功能
function initScrollAnimation() {
    // 获取所有部分
    const sections = document.querySelectorAll('.section');
    
    // 设置观察者选项
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    // 创建观察者
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, options);
    
    // 观察每个部分
    sections.forEach(section => {
        observer.observe(section);
    });
}

function initHeroOverlayFade() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroKicker = document.querySelector('.hero-kicker');
    const education = document.getElementById('education');
    const experience = document.getElementById('experience');
    if (!hero || !heroContent || !heroKicker || !education || !experience) return;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function updateHeroFade() {
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const educationRect = education.getBoundingClientRect();
        const experienceRect = experience.getBoundingClientRect();
        const kickerRect = heroKicker.getBoundingClientRect();

        const fadeStartLine = kickerRect.top;
        const fadeDistance = Math.max(220, experienceRect.top - fadeStartLine - viewportHeight * 0.08);
        const progress = clamp((fadeStartLine - educationRect.top) / fadeDistance, 0, 1);
        const opacity = 1 - progress;
        heroContent.style.setProperty('--hero-content-opacity', opacity.toFixed(3));

        if (progress >= 0.999) {
            heroContent.setAttribute('aria-hidden', 'true');
        } else {
            heroContent.removeAttribute('aria-hidden');
        }
    }

    window.addEventListener('scroll', updateHeroFade, { passive: true });
    window.addEventListener('resize', updateHeroFade);
    window.addEventListener('load', updateHeroFade);
    updateHeroFade();
}

// 侧边栏高亮功能
function initSidebarHighlight() {
    // 获取所有部分和侧边栏链接
    const sections = document.querySelectorAll('.section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // 设置观察者选项
    const options = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    // 创建观察者
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 获取当前部分的ID
                const id = entry.target.getAttribute('id');
                
                // 移除所有链接的active类
                sidebarLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // 为当前部分的侧边栏链接添加active类
                const sidebarLink = document.querySelector(`.sidebar-link[href="#${id}"]`);
                if (sidebarLink) {
                    sidebarLink.classList.add('active');
                }
                
                // 移除所有导航链接的active类
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // 为当前部分的导航链接添加active类
                const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }, options);
    
    // 观察每个部分
    sections.forEach(section => {
        observer.observe(section);
    });
    
    // 初始化侧边栏切换按钮
    initSidebarToggle();
}

// 侧边栏切换功能
function initSidebarToggle() {
    const sidebar = document.querySelector('.sidebar');
    
    // 创建侧边栏切换按钮
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sidebar-toggle';
    toggleButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    document.body.appendChild(toggleButton);
    
    // 添加切换事件
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        toggleButton.classList.toggle('active');
    });
}

// 初始化汉堡菜单功能
function initMobileMenu() {
    const hamburgerMenu = document.createElement('div');
    hamburgerMenu.className = 'hamburger-menu';
    hamburgerMenu.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    const nav = document.querySelector('nav');
    const navLinks = document.querySelector('.nav-links').cloneNode(true);
    
    // 创建移动端菜单
    const mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    mobileMenu.appendChild(navLinks);
    
    // 将汉堡菜单和移动端菜单添加到DOM
    nav.insertBefore(hamburgerMenu, nav.firstChild);
    document.body.appendChild(mobileMenu);
    
    // 添加汉堡菜单点击事件
    hamburgerMenu.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // 添加移动端菜单链接点击事件（点击后关闭菜单）
    const mobileMenuLinks = mobileMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
}

// 添加地球图标到语言切换按钮
function addLanguageIcon() {
    const langToggle = document.getElementById('language-toggle');
    const langText = langToggle.querySelector('.lang-text');
    
    // 创建图标元素
    const icon = document.createElement('i');
    icon.className = 'fas fa-globe language-icon';
    
    // 将图标插入到按钮的开头
    langToggle.insertBefore(icon, langText);
}

// 世界地图足迹功能
function initWorldMap() {
    // Switched to 3D Earth globe (see footprints-globe.js).
    // Keep initWorldMap() as an entry point, but bail out before legacy D3 code runs.
    initMapFullscreenControls();
    if (typeof window.refreshFootprintsGlobe === 'function') {
        // Remove any legacy SVG if it exists (cached DOM).
        try {
            const wm = document.getElementById('world-map');
            const oldSvg = wm ? wm.querySelector('svg') : null;
            if (oldSvg) oldSvg.remove();
        } catch (e) {}
        window.refreshFootprintsGlobe();
        return;
    }

    // 检查是否有从localStorage加载的自定义足迹数据
    let customFootprintsData = null;
    let websiteData = {};
    
    try {
        // 优先从localStorage获取数据
        const savedData = localStorage.getItem('websiteData');
        if (savedData) {
            websiteData = JSON.parse(savedData);
            
            // 确保footprints字段存在
            if (!websiteData.footprints) {
                websiteData.footprints = [];
            }
            if (!websiteData.anonymousMessages) {
                websiteData.anonymousMessages = [];
            }
            
            // 如果从localStorage读取到的足迹数据不为空，使用它
            if (websiteData.footprints && Array.isArray(websiteData.footprints) && websiteData.footprints.length > 0) {
                console.log(`从localStorage读取到${websiteData.footprints.length}条足迹数据`);
                
                // 转换格式为地图使用的格式（支持新版结构：fp.place / fp.image）
                customFootprintsData = websiteData.footprints.map(fp => {
                    const place = fp && fp.place && typeof fp.place === 'object' ? fp.place : null;
                    const city = place && place.city ? String(place.city) : String(fp.city || '');
                    const country = place && place.country ? String(place.country) : String(fp.country || '');
                    const lat = place && isFinite(place.lat) ? Number(place.lat) : parseFloat(fp.lat);
                    const lng = place && isFinite(place.lng) ? Number(place.lng) : parseFloat(fp.lng);
                    const displayName = place && place.displayName
                        ? String(place.displayName)
                        : `${city}${country ? ', ' + country : ''}`;

                    const imageUrl =
                        (fp.image && typeof fp.image === 'object' ? (fp.image.url || '') : fp.image) ||
                        fp.imageUrl ||
                        'https://via.placeholder.com/400x300?text=' + encodeURIComponent(city || 'Footprint');

                    return {
                        // Geography text is displayed in English. New admin flow stores English displayName.
                        // Legacy entries (Chinese) will still show as-is until re-saved.
                        name: displayName,
                        location: [lng, lat],
                        intensity: fp.intensity || 1,
                        image: imageUrl,
                        date: fp.visitedAt || fp.year || '',
                        description: fp.description || ''
                    };
                }).filter(d => isFinite(d.location[0]) && isFinite(d.location[1]));
            } else {
                console.log('localStorage中没有足迹数据，将使用默认数据');
            }
        }
    } catch (e) {
        console.error('读取自定义足迹数据失败:', e);
    }
    
    // 设置地图尺寸
    const width = document.getElementById('map-container').offsetWidth;
    const height = 600;

    // Fullscreen controls (button in index.html)
    initMapFullscreenControls();
    
    // 判断当前是否为深色模式
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    
    // 创建SVG元素
    const svg = d3.select('#world-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('style', `background-color: ${getComputedStyle(document.documentElement).getPropertyValue('--light-gray')}`);
    
    // 创建地图组
    const g = svg.append('g');
    
    // 创建投影
    const projection = d3.geoMercator()
        .scale(width / 2 / Math.PI)
        .translate([width / 2, height / 1.5]);
    
    // 创建路径生成器
    const path = d3.geoPath()
        .projection(projection);
    
    // 定义足迹数据
    // 1-10 表示访问的频率/强度，10最高
    const defaultFootprints = [
        { name: "上海", location: [121.4737, 31.2304], intensity: 10, image: "https://www.shhk.gov.cn/shhk/202cdc49-f400-4d16-b86c-6bdef99be486/78891cbb-74d1-4d76-85e7-9d47734693a2/20221128075539086984.png" },
        { name: "广东", location: [113.2644, 23.1291], intensity: 9, image: "https://images.mepai.me/app/works/1912307/2025-01-28/w_67985458671e6/46798545867354.jpg!720wp" },
        { name: "山东", location: [117.0000, 36.6510], intensity: 9, image: "https://upload.wikimedia.org/wikipedia/commons/b/b2/Baotu_Spring%2C_Jinan_in_Oct_2013.jpg" },
        { name: "成都", location: [104.0668, 30.5728], intensity: 6, image: "https://www.swireproperties.com/-/media/images/swireproperties/portfolio/current-developments/taikoo-li-chengdu/taikoo-li-chengdu/content/abastract-list/at-a-glance-sino-ocean-taikoo-li-chengdu-retail-1.ashx?bc=white&as=0&db=web&iar=0&mh=936&mw=1464&vs=1&hash=7916AF0F95589E2FAA2C9AF8B97F6C83" },
        { name: "北京", location: [116.4074, 39.9042], intensity: 6, image: "https://www.cp-center.cn/uploads/images/2024/0209/V2miUmXJwXhKjiCUCChOWGuw5n5Vr6esxUhHzs8u.png" },
        { name: "海南", location: [110.3290, 19.8330], intensity: 5, image: "https://p5.itc.cn/images01/20220428/fc4383222e3c4110a1723fc9b6eb24dd.jpeg" },
        { name: "安徽", location: [117.2900, 31.8600], intensity: 5, image: "https://www.huangshan.gov.cn/group1/M00/19/84/wKiM92eRk_aAHOB1AANmLmPp7aI453.jpg" },
        { name: "江苏", location: [118.7727, 32.0476], intensity: 5, image: "https://media-cdn.tripadvisor.com/media/attractions-splice-spp-674x446/07/2b/9d/8f.jpg" },
        { name: "江西", location: [115.8580, 28.6832], intensity: 4, image: "https://file.dahe.cn/image/jpeg/20211022/1634861139760274.jpg?imageMogr2/thumbnail/600%3E/format/jpg" },
        { name: "湖南", location: [112.9834, 28.1145], intensity: 4, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8twbLHVeFuOTuBmHZnynCUXT8V1jlsDsW2w&s" },
        { name: "湖北", location: [114.3416, 30.5470], intensity: 4, image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjY3uYCpTOp46Ah5CetxSIr4r_hoGUizjFng&s" },
        { name: "广西", location: [108.3280, 22.8150], intensity: 4, image: "https://static.wixstatic.com/media/135d1f_b24ab7e6d3a4420e9f66d1b4b8f20f7d~mv2.jpg/v1/fill/w_630,h_434,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/135d1f_b24ab7e6d3a4420e9f66d1b4b8f20f7d~mv2.jpg" },
        { name: "哈尔滨", location: [126.6420, 45.7560], intensity: 3, image: "https://imgcdn.yicai.com/uppics/images/2024/01/e934b43fa374759105fbb9265a5b6a96.jpg" },
        { name: "福建", location: [119.2960, 26.0991], intensity: 3, image: "https://www.newamazing.com.tw/eWeb_newamazing/IMGDB/000128/000295/00007412.JPG" },
        { name: "浙江", location: [120.1536, 30.2650], intensity: 5, image: "https://wgly.hangzhou.gov.cn/picture/0/2311201439582605992.jpg" },
        { name: "陕西", location: [108.9540, 34.2650], intensity: 3, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/%E8%A5%BF%E5%AE%89%E9%92%9F%E6%A5%BC2020_%281%29.jpg/1200px-%E8%A5%BF%E5%AE%89%E9%92%9F%E6%A5%BC2020_%281%29.jpg" },
        { name: "重庆", location: [106.5550, 29.5630], intensity: 4, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Chongqing_Nightscape.jpg/960px-Chongqing_Nightscape.jpg" },
        { name: "香港", location: [114.1694, 22.3193], intensity: 6, image: "https://cdn.bella.tw/index_image/bGYuDsMVp06wqkrU7KF8KXQ1xNqqa52sZnx6uqiw.jpeg" },
        { name: "澳门", location: [113.5439, 22.1987], intensity: 6, image: "https://www.agoda.com/wp-content/uploads/2024/04/Macau-Las-Vegas-of-Asia.jpg" },
        { name: "云南", location: [102.7100, 25.0500], intensity: 3, image: "https://ialive.bwnet.com.tw/AC_Gallery/2024/04/9403e81c-6245-1cb0-66ea-ca96d30e449e.jpg" },
        { name: "河南", location: [113.7500, 34.7700], intensity: 3, image: "https://p2.itc.cn/images01/20210430/37d50f6e03194e249ca9c9b55bf4939a.jpeg" },
        { name: "日本", location: [139.6917, 35.6895], intensity: 5, image: "https://img.bigfang.tw/2020/02/1580740308-2bd34f9e43e132ffc7cc879dda74af36.jpg" },
        { name: "新加坡", location: [103.8198, 1.3521], intensity: 4, image: "https://nusgs.nus.edu.sg/wp-content/uploads/nusgs-assets/images/home-events/yfp/Education_Resource_Centre_02.jpg" },
        { name: "加拿大温哥华", location: [-123.1207, 49.2827], intensity: 5, image: "https://ischool.cms.arts.ubc.ca/wp-content/uploads/sites/46/2022/07/About-Featured-Image-UBC-iSchool.jpg" },
        { name: "欧洲", location: [9.1900, 48.7775], intensity: 4, image: "https://resource02.ulifestyle.com.hk/ulcms/content/article/thumbnail/1280x720/2023/05/20230519142934_2b469c311096d6d54882ec8d2ed3acf963e735b9.jpg" },
        // 新增足迹点
        { name: "西藏拉萨", location: [91.1200, 29.6500], intensity: 4, image: "https://www.settour.com.tw/act/gfg/china/tibet/images/topBanner2_m.jpg" },
        { name: "美国纽约", location: [-74.0060, 40.7128], intensity: 6, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Lower_Manhattan_skyline_-_June_2017.jpg/1280px-Lower_Manhattan_skyline_-_June_2017.jpg" },
        { name: "美国拉斯维加斯", location: [-115.1391, 36.1699], intensity: 5, image: "https://image.kkday.com/v2/image/get/w_1900%2Cc_fit%2Cq_55/s1.kkday.com/product_182181/20240612085428_pHGtW/jpg" },
        { name: "美国洛杉矶", location: [-118.2437, 34.0522], intensity: 5, image: "https://upload.wikimedia.org/wikipedia/commons/0/0a/Golden_Gate_Bridge_2021.jpg" },
        { name: "荷兰代尔夫特", location: [4.3571, 52.0116], intensity: 4, image: "https://filelist.tudelft.nl/_processed_/5/1/csm_20140611_tudelft_campus_R9B0532_d52c5440e6.jpg" }
    ];
    
    // 使用自定义数据或默认数据
    const footprints = customFootprintsData || defaultFootprints;
    
    // 如果使用的是默认数据，并且localStorage中没有足迹数据，保存默认数据到localStorage
    if (!customFootprintsData && websiteData) {
        try {
            // 转换默认足迹数据为localStorage存储格式（新版结构）
            const defaultFootprintsForStorage = defaultFootprints.map(fp => {
                const city = fp.name.split(',')[0] || fp.name;
                const country = fp.name.includes(',') ? fp.name.split(',')[1].trim() : 'China';
                const displayName = fp.name.includes(',') ? fp.name : `${city}, ${country}`;
                return {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                    place: {
                        id: '',
                        displayName,
                        city,
                        country,
                        countryCode: '',
                        lat: fp.location[1],
                        lng: fp.location[0],
                        source: 'default'
                    },
                    visitedAt: '',
                    description: '',
                    intensity: fp.intensity || 1,
                    image: { url: fp.image || '', mode: 'url' }
                };
            });
            
            // 更新websiteData并保存
            websiteData.footprints = defaultFootprintsForStorage;
            websiteData.anonymousMessages = Array.isArray(websiteData.anonymousMessages) ? websiteData.anonymousMessages : [];
            localStorage.setItem('websiteData', JSON.stringify(websiteData));
            console.log('已将默认足迹数据保存到localStorage');
        } catch (e) {
            console.error('保存默认足迹数据失败:', e);
        }
    }
    
    // 获取CSS变量的值
    const countryFill = getComputedStyle(document.documentElement).getPropertyValue('--country-fill').trim();
    const countryStroke = getComputedStyle(document.documentElement).getPropertyValue('--country-stroke').trim();
    const footprintColor = getComputedStyle(document.documentElement).getPropertyValue('--footprint-color').trim();
    
    // 创建缩略图预览容器，用于鼠标悬停时显示 - 改为文档正文追加
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'location-thumbnail')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('overflow', 'hidden')
        .style('z-index', '1000')
        .style('pointer-events', 'none')
        .style('opacity', '0')
        .style('transform', 'translateY(10px) scale(0.95)')
        .style('transition', 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)');

    // 加载世界地图数据
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
        .then(data => {
            // 转换TopoJSON到GeoJSON
            const countries = topojson.feature(data, data.objects.countries);
            
            // 添加国家
            g.selectAll('path')
                .data(countries.features)
                .enter()
                .append('path')
                .attr('d', path)
                .attr('class', 'country')
                .attr('fill', countryFill)
                .attr('stroke', countryStroke)
                .attr('stroke-width', 0.5);
            
            // 添加足迹点 - 使用简单的蓝色圆点并加入律动动画
            const footprintPoints = g.selectAll('.footprint')
                .data(footprints)
                .enter()
                .append('circle')
                .attr('cx', d => projection(d.location)[0])
                .attr('cy', d => projection(d.location)[1])
                .attr('r', d => Math.sqrt(d.intensity) * 2) // 初始半径
                .attr('fill', footprintColor)
                .attr('fill-opacity', 0.8)
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.5)
                .attr('class', 'footprint');
                
            // 添加律动动画效果
            footprintPoints.each(function(d, i) {
                // 为每个点添加不同的动画延迟，使得律动感更强
                const delay = i % 5 * 300;  // 将点分成5组，每组延迟300ms
                
                d3.select(this)
                    .style('transform-origin', 'center center')
                    .style('transform-box', 'fill-box')
                    .transition()
                    .duration(1500)  // 动画持续时间
                    .delay(delay)    // 错开动画开始时间
                    .attr('r', d => Math.sqrt(d.intensity) * 2.2)  // 轻微放大
                    .attr('fill-opacity', 0.9)
                    .transition()
                    .duration(1500)
                    .attr('r', d => Math.sqrt(d.intensity) * 1.8)  // 轻微缩小
                    .attr('fill-opacity', 0.7)
                    .on('end', function repeat() {  // 动画完成后循环
                        d3.select(this)
                            .transition()
                            .duration(1500)
                            .attr('r', d => Math.sqrt(d.intensity) * 2.2)
                            .attr('fill-opacity', 0.9)
                            .transition()
                            .duration(1500)
                            .attr('r', d => Math.sqrt(d.intensity) * 1.8)
                            .attr('fill-opacity', 0.7)
                            .on('end', repeat);  // 循环动画
                    });
            });
            
            // 为足迹点添加交互事件
            footprintPoints
                .on('mouseover', function(event, d) {
                    // 鼠标悬停时放大圆点
                    d3.select(this)
                        .interrupt() // 中断现有动画
                        .transition()
                        .duration(300)
                        .attr('r', Math.sqrt(d.intensity) * 3)
                        .attr('fill-opacity', 1);
                    
                    const title = d.name || '';
                    const date = d.date || '';
                    const desc = d.description || '';
                    const safeImg = d.image || '';

                    tooltip.html(`
                        <div class="lt-image">
                            ${safeImg ? `<img src="${safeImg}" alt="${escapeHtml(title)}">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.55);font-size:12px;">No image</div>`}
                        </div>
                        <div class="lt-body">
                            <div class="lt-title">${escapeHtml(title)}</div>
                            ${date ? `<div class="lt-date">${escapeHtml(date)}</div>` : ``}
                            ${desc ? `<div class="lt-desc">${escapeHtml(desc)}</div>` : ``}
                        </div>
                    `)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 100}px`)
                    .style('visibility', 'visible')
                    .style('opacity', '1')
                    .style('transform', 'translateY(0) scale(1)');
                })
                .on('mousemove', function(event) {
                    // 跟随鼠标移动
                    tooltip
                        .style('left', `${event.pageX + 15}px`)
                        .style('top', `${event.pageY - 100}px`);
                })
                .on('mouseout', function(event, d) {
                    // 鼠标移出时恢复律动动画
                    const thisPoint = d3.select(this);
                    thisPoint.interrupt(); // 中断现有动画
                    
                    // 计算当前点在数组中的索引
                    const index = footprints.findIndex(fp => fp.name === d.name);
                    const delay = index % 5 * 300;
                    
                    // 恢复律动动画
                    thisPoint
                        .transition()
                        .duration(1500)
                        .delay(delay)
                        .attr('r', d => Math.sqrt(d.intensity) * 2.2)
                        .attr('fill-opacity', 0.9)
                        .transition()
                        .duration(1500)
                        .attr('r', d => Math.sqrt(d.intensity) * 1.8)
                        .attr('fill-opacity', 0.7)
                        .on('end', function repeat() {
                            d3.select(this)
                                .transition()
                                .duration(1500)
                                .attr('r', d => Math.sqrt(d.intensity) * 2.2)
                                .attr('fill-opacity', 0.9)
                                .transition()
                                .duration(1500)
                                .attr('r', d => Math.sqrt(d.intensity) * 1.8)
                                .attr('fill-opacity', 0.7)
                                .on('end', repeat);
                        });
                    
                    // 隐藏缩略图
                    tooltip
                        .style('opacity', '0')
                        .style('transform', 'translateY(10px) scale(0.95)')
                        .style('visibility', 'hidden');
                })
                .style('cursor', 'pointer'); // 添加指针样式，提示可交互
            
            // 添加缩放功能
            const zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                });
                
            svg.call(zoom);
        })
        .catch(error => console.error('加载世界地图数据时出错:', error));
}

function initMapFullscreenControls() {
    const container = document.getElementById('map-container');
    const btnEnter = document.getElementById('map-fullscreen-btn');
    const btnExit = document.getElementById('map-fullscreen-exit-btn');
    if (!container || !btnEnter || !btnExit) return;

    const enter = async () => {
        try {
            if (container.requestFullscreen) await container.requestFullscreen();
            else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
        } catch (_) {}
    };

    const exit = async () => {
        try {
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch (_) {}
    };

    btnEnter.addEventListener('click', enter);
    btnExit.addEventListener('click', exit);
}

// 添加平滑滚动功能
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 添加搜索功能
function initSearchFeature() {
    // 创建搜索按钮
    const searchButton = document.createElement('button');
    searchButton.id = 'search-button';
    searchButton.innerHTML = '<i class="fas fa-search"></i>';
    
    // 将搜索按钮添加到导航栏右侧
    const navRight = document.querySelector('.nav-right');
    navRight.insertBefore(searchButton, navRight.firstChild);
    
    // 创建搜索容器
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';
    searchContainer.innerHTML = `
        <div class="search-close"><i class="fas fa-times"></i></div>
        <div class="search-box">
            <input type="text" class="search-input" placeholder="搜索...">
            <div class="search-results"></div>
        </div>
    `;
    document.body.appendChild(searchContainer);
    
    // 搜索按钮点击事件
    searchButton.addEventListener('click', () => {
        searchContainer.classList.add('active');
        document.querySelector('.search-input').focus();
    });
    
    // 关闭搜索框事件
    document.querySelector('.search-close').addEventListener('click', () => {
        searchContainer.classList.remove('active');
    });
    
    // ESC键关闭搜索框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchContainer.classList.contains('active')) {
            searchContainer.classList.remove('active');
        }
    });
    
    // 搜索功能实现
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        
        // 清空搜索结果
        searchResults.innerHTML = '';
        
        if (query.length < 2) return;
        
        // 收集页面上的所有可搜索文本
        const searchableElements = document.querySelectorAll('h1, h2, h3, p, li');
        const results = [];
        
        searchableElements.forEach(el => {
            const text = el.textContent;
            if (text.toLowerCase().includes(query)) {
                const sectionId = el.closest('section')?.id || '';
                if (!results.some(r => r.text === text)) {
                    results.push({
                        text: text,
                        element: el,
                        sectionId: sectionId
                    });
                }
            }
        });
        
        // 显示搜索结果
        if (results.length > 0) {
            results.slice(0, 10).forEach(result => {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.textContent = result.text;
                
                resultItem.addEventListener('click', () => {
                    searchContainer.classList.remove('active');
                    
                    if (result.sectionId) {
                        document.getElementById(result.sectionId).scrollIntoView({
                            behavior: 'smooth'
                        });
                    } else {
                        result.element.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                    
                    // 高亮显示找到的内容
                    result.element.classList.add('search-highlight');
                    setTimeout(() => {
                        result.element.classList.remove('search-highlight');
                    }, 2000);
                });
                
                searchResults.appendChild(resultItem);
            });
        } else {
            const noResult = document.createElement('div');
            noResult.className = 'search-result-item';
            noResult.textContent = '没有找到相关内容';
            searchResults.appendChild(noResult);
        }
    });
}

// 移动端水平滚动选择器
function initMobileScrollSelector() {
    const navLinks = document.querySelector('.nav-links');
    
    // 创建水平滚动选择器
    const scrollSelector = document.createElement('div');
    scrollSelector.className = 'scroll-selector';
    scrollSelector.appendChild(navLinks.cloneNode(true));
    
    // 添加到页面
    const header = document.querySelector('header');
    header.appendChild(scrollSelector);
    
    // 添加滚动事件监听
    const selectorLinks = scrollSelector.querySelectorAll('.nav-link');
    selectorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
}

// 导航高亮功能
function initNavHighlight() {
    // 获取所有部分和导航链接
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // 设置观察者选项
    const options = {
        root: null,
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0
    };
    
    // 创建观察者
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 获取当前部分的ID
                const id = entry.target.getAttribute('id');
                
                // 移除所有导航链接的active类
                navLinks.forEach(link => {
                    link.classList.remove('active');
                });
                
                // 为当前部分的导航链接添加active类
                const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
                if (navLink) {
                    navLink.classList.add('active');
                }
                
                // 如果是移动端，滚动水平选择器到对应位置
                const scrollSelector = document.querySelector('.scroll-selector');
                if (scrollSelector && window.innerWidth <= 1024) {
                    const activeLink = scrollSelector.querySelector(`.nav-link[href="#${id}"]`);
                    if (activeLink) {
                        activeLink.classList.add('active');
                        scrollSelector.scrollTo({
                            left: activeLink.offsetLeft - scrollSelector.offsetWidth / 2 + activeLink.offsetWidth / 2,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    }, options);
    
    // 观察每个部分
    sections.forEach(section => {
        observer.observe(section);
    });
}

// 项目轮播功能
function initProjectsCarousel() {
    const projectsCarousel = document.querySelector('.projects-carousel');
    const projectsWrapper = document.querySelector('.projects-wrapper');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const dotsContainer = document.querySelector('.carousel-dots');

    if (!projectsCarousel || !projectsWrapper) {
        return;
    }

    // Prevent double-binding when the section is re-rendered by sync.
    if (projectsCarousel._carouselAbortController) {
        projectsCarousel._carouselAbortController.abort();
    }
    const controller = new AbortController();
    const { signal } = controller;
    projectsCarousel._carouselAbortController = controller;

    // We animate ONLY the wrapper transform. Do NOT scroll the carousel container,
    // otherwise the controls will move with the content.
    projectsCarousel.scrollLeft = 0;
    projectsCarousel.style.overflow = 'hidden';

    // Remove old clones (if any), then snapshot originals.
    projectsWrapper.querySelectorAll('[data-project-clone="true"]').forEach((el) => el.remove());
    const originals = Array.from(projectsWrapper.querySelectorAll('.project-item'));
    if (!originals.length) return;
    const originalCount = originals.length;

    // Clone once to make an endless loop.
    originals.forEach((item) => {
        const clone = item.cloneNode(true);
        clone.setAttribute('data-project-clone', 'true');
        clone.setAttribute('aria-hidden', 'true');
        projectsWrapper.appendChild(clone);
    });

    const prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

    const getProjectsPerView = () => {
        if (window.innerWidth > 992) return 3;
        if (window.innerWidth > 768) return 2;
        return 1;
    };

    const getStride = () => {
        const first = projectsWrapper.querySelector('.project-item');
        if (!first) return 0;
        const style = window.getComputedStyle(first);
        const marginLeft = parseFloat(style.marginLeft) || 0;
        const marginRight = parseFloat(style.marginRight) || 0;
        return first.getBoundingClientRect().width + marginLeft + marginRight;
    };

    // Wrapper should feel smooth.
    projectsWrapper.style.willChange = 'transform';
    projectsWrapper.style.transition = 'none';

    // Auto marquee (slower, constant)
    const speedPxPerSec = 12;
    let isHovered = false;
    let pausedUntil = 0; // resume after 10s idle
    let rafId = 0;
    let lastTs = 0;
    let manualAnim = null; // { from, to, start, duration }
    let stride = 0;
    let resetPoint = 0;
    let offsetPx = 0; // how far we've moved to the left
    let needsMeasure = true;
    let measureRaf = 0;

    const nowMs = () => performance.now();

    const measure = () => {
        const oldStride = stride || 0;
        const newStride = getStride();
        if (!newStride) return;
        stride = newStride;
        resetPoint = stride * originalCount;
        if (oldStride > 0 && Math.abs(oldStride - stride) > 0.5) {
            // Keep the same fractional index when resizing.
            const idx = offsetPx / oldStride;
            offsetPx = idx * stride;
        }
        offsetPx = ((offsetPx % resetPoint) + resetPoint) % resetPoint;
    };

    const applyTransform = () => {
        // translate3d for GPU acceleration
        projectsWrapper.style.transform = `translate3d(${-offsetPx}px, 0, 0)`;
    };

    const normalizedBaseOffset = () => {
        if (!resetPoint) return 0;
        return ((offsetPx % resetPoint) + resetPoint) % resetPoint;
    };

    const markInteraction = () => {
        pausedUntil = nowMs() + 10_000;
    };

    const ensureDots = () => {
        if (!dotsContainer) return;
        const perView = getProjectsPerView();
        const pages = Math.max(1, Math.ceil(originalCount / perView));
        const existing = Array.from(dotsContainer.querySelectorAll('.dot'));
        if (existing.length !== pages) {
            dotsContainer.innerHTML = '';
            for (let i = 0; i < pages; i += 1) {
                const dot = document.createElement('span');
                dot.className = 'dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('data-index', String(i));
                dotsContainer.appendChild(dot);
            }
        }
    };

    const setActiveDots = () => {
        if (!dotsContainer || !stride) return;
        const dots = Array.from(dotsContainer.querySelectorAll('.dot'));
        if (!dots.length) return;
        const perView = getProjectsPerView();
        const base = normalizedBaseOffset();
        const index = Math.round(base / stride) % originalCount;
        const page = Math.floor(index / perView);
        dots.forEach((dot, i) => dot.classList.toggle('active', i === page));
    };

    const requestMeasure = () => {
        needsMeasure = true;
        if (measureRaf) return;
        measureRaf = window.requestAnimationFrame(() => {
            measureRaf = 0;
            if (!needsMeasure) return;
            needsMeasure = false;
            measure();
            applyTransform();
            ensureDots();
            setActiveDots();
        });
    };

    const schedule = () => {
        if (!rafId) rafId = window.requestAnimationFrame(tick);
    };

    const animateTo = (toOffset, duration = 420) => {
        manualAnim = { from: offsetPx, to: toOffset, start: nowMs(), duration };
        schedule();
    };

    const stepByOneCard = (dir) => {
        if (prefersReduce) return;
        requestMeasure();
        if (!stride || !resetPoint) return;
        markInteraction();
        // Seamless wrap:
        // - Next from the last card should slide into the cloned set, then normalize back.
        // - Prev from the first card should jump to the cloned set (equivalent position) before animating.
        if (dir < 0) {
            const base = normalizedBaseOffset();
            if (base < stride * 0.5) {
                offsetPx += resetPoint;
                applyTransform();
            }
        }

        let to = offsetPx + dir * stride;
        // keep to within a reasonable range (we allow [0, 2*resetPoint) for seamless wrap)
        const maxRange = resetPoint * 2;
        if (to < 0) to += resetPoint;
        if (to >= maxRange) to -= resetPoint;
        animateTo(to, 420);
    };

    const onPrev = () => stepByOneCard(-1);
    const onNext = () => stepByOneCard(1);

    if (prevBtn) prevBtn.addEventListener('click', onPrev, { signal });
    if (nextBtn) nextBtn.addEventListener('click', onNext, { signal });

    // Dots click: jump to page (pause auto)
    if (dotsContainer) {
        dotsContainer.addEventListener('click', (e) => {
            const dot = e.target.closest('.dot');
            if (!dot) return;
            const pageIndex = parseInt(dot.getAttribute('data-index') || '0', 10) || 0;
            measure();
            const perView = getProjectsPerView();
            const targetIndex = clamp(pageIndex * perView, 0, Math.max(0, originalCount - 1));
            markInteraction();
            animateTo(targetIndex * stride, 420);
        }, { signal });
    }

    // Hover pauses marquee immediately (use multiple events for robustness).
    const onEnter = () => { isHovered = true; };
    const onLeave = () => { isHovered = false; };
    projectsCarousel.addEventListener('pointerenter', onEnter, { signal });
    projectsCarousel.addEventListener('pointerleave', onLeave, { signal });
    projectsCarousel.addEventListener('mouseenter', onEnter, { signal });
    projectsCarousel.addEventListener('mouseleave', onLeave, { signal });
    projectsWrapper.addEventListener('mouseenter', onEnter, { signal });
    projectsWrapper.addEventListener('mouseleave', onLeave, { signal });

    // Wheel / touch: treat as user interaction (pause for 10s)
    projectsCarousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0) onNext();
        else onPrev();
    }, { passive: false, signal });

    let touchStartX = 0;
    let touchEndX = 0;
    projectsCarousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true, signal });
	    projectsCarousel.addEventListener('touchend', (e) => {
	        touchEndX = e.changedTouches[0].screenX;
	        const swipeThreshold = 50;
	        if (touchEndX < touchStartX - swipeThreshold) onNext();
	        else if (touchEndX > touchStartX + swipeThreshold) onPrev();
	    }, { passive: true, signal });

	    const ro = new ResizeObserver(() => {
	        requestMeasure();
	    });
    ro.observe(projectsCarousel);
    ro.observe(projectsWrapper);
    signal.addEventListener('abort', () => ro.disconnect());

    window.addEventListener('resize', () => {
        requestMeasure();
    }, { signal });

    const tick = (ts) => {
        rafId = 0;
        if (!lastTs) lastTs = ts;
        const dt = Math.min(0.05, (ts - lastTs) / 1000);
        lastTs = ts;

        if (!stride || !resetPoint) {
            requestMeasure();
        }

        // Manual animation (linear for predictable "one card" motion)
        if (manualAnim) {
            const t = (nowMs() - manualAnim.start) / manualAnim.duration;
            if (t >= 1) {
                offsetPx = manualAnim.to;
                manualAnim = null;
                // Normalize back into the base range when we end up in the cloned segment.
                if (resetPoint) {
                    const base = normalizedBaseOffset();
                    offsetPx = base;
                }
            } else {
                const p = clamp(t, 0, 1);
                offsetPx = manualAnim.from + (manualAnim.to - manualAnim.from) * p;
            }
        } else {
            const idleOk = nowMs() >= pausedUntil;
            if (!prefersReduce && !isHovered && idleOk && stride && resetPoint) {
                offsetPx += speedPxPerSec * dt;
                // Avoid stutter: wrap immediately without huge while-loops
                if (offsetPx >= resetPoint) offsetPx -= resetPoint;
            }
        }

        applyTransform();
        setActiveDots();
        schedule();
    };

    requestMeasure();
    ensureDots();
    applyTransform();
    setActiveDots();
    schedule();
}

// AI聊天相关功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取元素
    const floatingButton = document.getElementById('floating-chat-button');
    const chatContainer = document.getElementById('ai-chat-container');
    const closeButton = document.getElementById('ai-chat-close');
    const sendButton = document.getElementById('ai-chat-send');
    const chatInput = document.getElementById('ai-chat-input');
    const messagesContainer = document.getElementById('ai-chat-messages');
    const chatOverlay = document.getElementById('chat-overlay');
    
    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768;
    
    // 打开聊天窗口
    floatingButton.addEventListener('click', function() {
        // 添加隐藏类并稍微延迟以创建弹性效果
        floatingButton.classList.add('hidden');
        
        setTimeout(() => {
            if (isMobile) {
                chatOverlay.classList.add('active');
            }
            
            chatContainer.style.display = 'flex';
            
            // 添加动画类以触发过渡效果
            setTimeout(() => {
                chatContainer.classList.add('active');
            }, 10);
        }, 200); // 等待按钮缩小效果完成
    });
    
    // 关闭聊天窗口
    function closeChat() {
        chatContainer.classList.remove('active');
        
        if (isMobile) {
            chatOverlay.classList.remove('active');
        }
        
        // 等待动画完成后隐藏对话框
        setTimeout(() => {
            chatContainer.style.display = 'none';
            
            // 显示悬浮球并添加弹性动画
            floatingButton.style.display = 'flex';
            floatingButton.classList.remove('hidden');
            floatingButton.classList.add('show');
            
            // 移除show类以确保下次点击时动画正常
            setTimeout(() => {
                floatingButton.classList.remove('show');
                
                // 确保律动动画恢复
                void floatingButton.offsetWidth; // 强制重绘
            }, 500);
        }, 400);
    }
    
    // 关闭按钮点击事件
    closeButton.addEventListener('click', closeChat);
    
    // 移动端点击遮罩层关闭对话框
    chatOverlay.addEventListener('click', function(e) {
        if (isMobile) {
            closeChat();
        }
    });
    
    // 发送消息事件处理
    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // 添加用户消息到聊天界面
            addUserMessage(message);
            chatInput.value = '';
            
            // 显示思考中的状态
            showTypingIndicator();
            
            // 调用DeepSeek API获取回复
            fetchAIResponse(message);
        }
    }
    
    // 发送按钮点击事件
    sendButton.addEventListener('click', sendMessage);
    
    // 输入框回车事件
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // 添加用户消息到聊天界面
    function addUserMessage(message) {
        const userMessageElement = document.createElement('div');
        userMessageElement.className = 'user-message';
        userMessageElement.innerHTML = `
            <div class="user-message-content">
                <p>${escapeHtml(message)}</p>
            </div>
        `;
        messagesContainer.appendChild(userMessageElement);
        scrollToBottom();
    }
    
    // 添加AI消息到聊天界面
    function addAIMessage(message) {
        // 移除正在输入指示器
        removeTypingIndicator();
        
        const aiMessageElement = document.createElement('div');
        aiMessageElement.className = 'ai-message';
        aiMessageElement.innerHTML = `
            <div class="ai-avatar">
                <img src="assets/images/avatar-round.png" alt="AI Avatar">
            </div>
            <div class="ai-message-content"></div>
        `;

        const contentElement = aiMessageElement.querySelector('.ai-message-content');
        contentElement.appendChild(formatAIMessage(message));

        messagesContainer.appendChild(aiMessageElement);
        scrollToBottom();
    }
    
    // 显示AI正在输入的指示器
    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'ai-message typing-indicator';
        typingIndicator.innerHTML = `
            <div class="ai-avatar">
                <img src="assets/images/avatar-round.png" alt="AI Avatar">
            </div>
            <div class="ai-message-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingIndicator);
        scrollToBottom();
    }
    
    // 移除正在输入指示器
    function removeTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    // 滚动到底部
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // HTML转义函数，防止XSS攻击
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

	    function formatAIMessage(message) {
        const container = document.createElement('div');
        container.className = 'ai-message-text';

        const cleanedMessage = (message || '')
            .replace(/\r\n/g, '\n')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/^---+$/gm, '')
            .trim();

        if (!cleanedMessage) {
            const paragraph = document.createElement('p');
            paragraph.textContent = '';
            container.appendChild(paragraph);
            return container;
        }

        const blocks = cleanedMessage.split(/\n\s*\n/).filter(Boolean);

	        function appendWithLinks(parent, text) {
	            const src = String(text || '');
	            const urlRe = /https?:\/\/[^\s<>()]+/g;
	            let last = 0;
	            let m;
	            while ((m = urlRe.exec(src))) {
	                const start = m.index;
	                const end = start + m[0].length;
	                if (start > last) parent.appendChild(document.createTextNode(src.slice(last, start)));
	                const a = document.createElement('a');
	                a.href = m[0];
	                a.target = '_blank';
	                a.rel = 'noopener noreferrer';
	                a.textContent = m[0];
	                parent.appendChild(a);
	                last = end;
	            }
	            if (last < src.length) parent.appendChild(document.createTextNode(src.slice(last)));
	        }

	        blocks.forEach((block) => {
	            const lines = block
	                .split('\n')
	                .map((line) => line.trim())
	                .filter(Boolean);

            if (lines.length === 0) {
                return;
            }

            const isBulletList = lines.every((line) => /^[-*•]\s+/.test(line));
            const isOrderedList = lines.every((line) => /^\d+[.)]\s+/.test(line));

	            if (isBulletList || isOrderedList) {
	                const list = document.createElement(isOrderedList ? 'ol' : 'ul');
	                list.className = 'ai-message-list';

	                lines.forEach((line) => {
	                    const item = document.createElement('li');
	                    appendWithLinks(item, line.replace(/^([-*•]|\d+[.)])\s+/, ''));
	                    list.appendChild(item);
	                });

	                container.appendChild(list);
	                return;
	            }

	            const paragraph = document.createElement('p');
	            appendWithLinks(paragraph, lines.join('\n'));
	            container.appendChild(paragraph);
	        });

        return container;
    }
    
    function getChatApiUrl() {
        const configuredBase = window.TRAVIS_AI_API_URL || '';
        const normalizedBase = configuredBase.replace(/\/+$/, '');
        return normalizedBase ? `${normalizedBase}/api/chat` : '/api/chat';
    }

    // 通过Cloudflare Worker代理调用AI接口，避免在前端暴露密钥
    async function fetchAIResponse(message) {
        try {
            const response = await fetch(getChatApiUrl(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data && data.error ? data.error : 'Unknown API error';
                throw new Error(errorMessage);
            }

            if (data.reply) {
                const aiResponse = data.reply;
                addAIMessage(aiResponse);
            } else {
                addAIMessage("I'm sorry, I couldn't generate a response at this time. Please try again later.");
            }
        } catch (error) {
            console.error('Error fetching AI response:', error);
            removeTypingIndicator();

            addAIMessage('Thank you for your message! I\'m Travis\'s AI assistant. I\'m currently in development and having trouble connecting to my backend. Please try again later or contact Travis directly through the social media links at the bottom of the page.');
        }
    }

    // 不再需要在JS中控制工具提示，因为现在已经通过CSS动画来控制
    
    // 窗口大小变化时更新移动设备检测
    window.addEventListener('resize', function() {
        isMobile = window.innerWidth <= 768;
    });
});

// 添加正在输入指示器的样式
const style = document.createElement('style');
style.textContent = `
.typing-dots {
    display: flex;
    align-items: center;
    gap: 4px;
}

.typing-dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #C686FF;
    display: inline-block;
    animation: typing 1.4s infinite ease-in-out both;
}

.typing-dots span:nth-child(1) {
    animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
    animation-delay: -0.16s;
}

@keyframes typing {
    0%, 80%, 100% { 
        transform: scale(0);
    } 
    40% { 
        transform: scale(1);
    }
}

@media (prefers-color-scheme: dark) {
    .typing-dots span {
        background-color: #F5B9EA;
    }
}
`
document.head.appendChild(style);

function initExperienceExpandCollapse(options = {}) {
    // Event delegation: stable even when experience DOM is re-rendered by sync scripts.
    const { reset = false } = options;
    const root = document.getElementById('experience');
    if (!root) return false;

    if (!window.__experienceDelegatedHandlersInitialized) {
        root.addEventListener('click', function (e) {
            const toggleButton = e.target.closest('.experience-toggle');
            if (toggleButton) {
                e.stopPropagation();
                const detailsId = toggleButton.getAttribute('aria-controls');
                if (detailsId) toggleExperienceDetails(detailsId);
                return;
            }

            const header = e.target.closest('.experience-header[data-controls]');
            if (header) {
                if (!e.target.closest('.experience-toggle')) {
                    const detailsId = header.getAttribute('data-controls');
                    if (detailsId) toggleExperienceDetails(detailsId);
                }
                return;
            }

            const logo = e.target.closest('.experience-logo[data-controls]');
            if (logo) {
                const detailsId = logo.getAttribute('data-controls');
                if (detailsId) toggleExperienceDetails(detailsId);
            }
        });

        window.addEventListener('resize', function () {
            document.querySelectorAll('.experience-details-wrapper').forEach(wrapper => {
                const detailsId = wrapper.id.replace('wrapper', 'details');
                const detailsElement = document.getElementById(detailsId);
                const button = document.querySelector(`[aria-controls="${detailsId}"]`);

                if (button && button.getAttribute('aria-expanded') === 'true' && detailsElement) {
                    wrapper.style.maxHeight = detailsElement.scrollHeight + 40 + 'px';
                }
            });
        });

        window.__experienceDelegatedHandlersInitialized = true;
    }

    if (reset) {
        document.querySelectorAll('.experience-toggle').forEach(button => {
            const detailsId = button.getAttribute('aria-controls');
            const detailsElement = detailsId ? document.getElementById(detailsId) : null;
            const wrapperElement = detailsId ? document.getElementById(detailsId.replace('details', 'wrapper')) : null;

            button.setAttribute('aria-expanded', 'false');
            if (detailsElement) detailsElement.classList.remove('expanded');
            if (wrapperElement) wrapperElement.style.maxHeight = '0';
        });
    }

    function toggleExperienceDetails(detailsId) {
        const detailsElement = document.getElementById(detailsId);
        const wrapperElement = document.getElementById(detailsId.replace('details', 'wrapper'));
        const button = document.querySelector(`[aria-controls="${detailsId}"]`);
        if (!detailsElement || !wrapperElement || !button) return;

        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
            button.setAttribute('aria-expanded', 'false');
            wrapperElement.style.maxHeight = '0';
            wrapperElement.addEventListener('transitionend', function removeExpandedClass() {
                detailsElement.classList.remove('expanded');
                wrapperElement.removeEventListener('transitionend', removeExpandedClass);
            }, { once: true });
        } else {
            button.setAttribute('aria-expanded', 'true');
            detailsElement.classList.add('expanded');
            wrapperElement.style.maxHeight = detailsElement.scrollHeight + 40 + 'px';
        }
    }

    return true;
}

window.initExperienceExpandCollapse = initExperienceExpandCollapse;

function initConnectWaveFooter() {
    const canvas = document.getElementById('connect-wave-canvas');
    if (!canvas) return false;

    // Respect reduced motion preferences.
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return false;

    const section = canvas.closest('.connect-footer-section') || canvas.parentElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx || !section) return false;

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let w = 0;
    let h = 0;

    // Pointer state (desktop) + inertia on leave.
    const pointerFine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const pointer = {
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        targetX: 0,
        targetY: 0,
        lastX: 0,
        lastY: 0,
        lastT: 0,
    };

    function getVar(name, fallback) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        return v || fallback;
    }

    function resize() {
        const rect = section.getBoundingClientRect();
        w = Math.max(1, Math.floor(rect.width));
        h = Math.max(1, Math.floor(rect.height));
        dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();

    const state = {
        t: 0,
        grid: [],
        cols: 0,
        rows: 0,
        tmp: null,
    };

    function buildGrid() {
        // 3D "space wave" point field: a regular grid in X-Z with perspective projection.
        const cols = Math.max(72, Math.min(150, Math.floor(w / 9)));
        const rows = Math.max(30, Math.min(66, Math.floor(h / 13)));
        state.cols = cols;
        state.rows = rows;
        state.grid = new Array(cols * rows);

        // Depth distribution: far (large z) is denser, near is sparser.
        // t: 0..1 from near->far. Use ease-out curve so samples pack towards far end.
        // Stronger depth non-linearity so far field packs tighter (more "distance" feel).
        const zGamma = 3.25;
        for (let zi = 0; zi < rows; zi++) {
            const t = zi / (rows - 1);
            const v = 1 - Math.pow(1 - t, zGamma);
            for (let xi = 0; xi < cols; xi++) {
                const u = xi / (cols - 1);
                const s = 0.92 + 0.32 * (0.5 + 0.5 * Math.sin(xi * 0.28 + zi * 0.18));
                state.grid[zi * cols + xi] = { u, v, size: s };
            }
        }

        state.tmp = null;
    }

    buildGrid();

    function onPointerMove(e) {
        const rect = section.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const now = performance.now();

        if (!pointer.active) {
            pointer.active = true;
            pointer.lastT = now;
            pointer.lastX = x;
            pointer.lastY = y;
        }

        const dt = Math.max(8, now - pointer.lastT);
        pointer.vx = (x - pointer.lastX) / dt;
        pointer.vy = (y - pointer.lastY) / dt;
        pointer.lastT = now;
        pointer.lastX = x;
        pointer.lastY = y;

        pointer.targetX = x;
        pointer.targetY = y;
    }

    function onPointerEnter(e) {
        if (!pointerFine) return;
        onPointerMove(e);
    }

    function onPointerLeave() {
        if (!pointerFine) return;
        // Keep the last position (no snap-back) and add a tiny inertial drift.
        pointer.active = false;
        pointer.targetX = pointer.lastX + pointer.vx * 220;
        pointer.targetY = pointer.lastY + pointer.vy * 220;
    }

    if (pointerFine) {
        section.addEventListener('pointerenter', onPointerEnter, { passive: true });
        section.addEventListener('pointermove', onPointerMove, { passive: true });
        section.addEventListener('pointerleave', onPointerLeave, { passive: true });
    }

    let rafId = 0;
    let lastFrameT = performance.now();

    function tick() {
        const nowT = performance.now();
        const dtMs = Math.min(48, Math.max(8, nowT - lastFrameT));
        lastFrameT = nowT;
        // Slower, more "gentle" motion.
        state.t += (dtMs / 1000) * 0.55;

        // Smoothly follow target; when not active, ease towards inertial target.
        const follow = pointer.active ? 0.12 : 0.06;
        pointer.x += (pointer.targetX - pointer.x) * follow;
        pointer.y += (pointer.targetY - pointer.y) * follow;

        // Gentle decay of inertial target so it doesn't drift forever.
        if (!pointer.active) {
            pointer.targetX += (w * 0.5 - pointer.targetX) * 0.003;
            pointer.targetY += (h * 0.60 - pointer.targetY) * 0.003;
        }

        ctx.clearRect(0, 0, w, h);

        const dot = getVar('--connect-wave-dot', 'rgba(0,0,0,0.10)');
        const dotStrong = getVar('--connect-wave-dot-strong', 'rgba(0,0,0,0.16)');

        // Keep the footer clean: no "random dust" layer (it reads as noisy/chaotic).

        const mx = pointerFine ? pointer.x : w * 0.5;
        const my = pointerFine ? pointer.y : h * 0.55;

        const pu = Math.max(0, Math.min(1, mx / w));
        const pv = Math.max(0, Math.min(1, my / h));

        const worldW = w * 1.35;
        const depth = Math.max(650, Math.min(1100, w * 0.95));
        const baseY = h * 0.52;

        // Camera controls (subtle): yaw responds to pointer X; pitch responds to pointer Y.
        const yaw = (pu - 0.5) * 0.38;
        const pitch = -0.62 + (pv - 0.5) * 0.22;
        const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        const cosP = Math.cos(pitch), sinP = Math.sin(pitch);

        // Perspective
        const f = Math.max(720, Math.min(1200, w * 1.05));

        const t = state.t;
        // Make near field more dynamic and far field calmer (near "deep", far "shallow").
        const ampNear = Math.min(48, h * 0.14);
        const ampFar = Math.min(7, h * 0.022);

        // Pointer ripple center in world space
        const rippleX = (pu - 0.5) * worldW;
        const rippleZ = (0.15 + pv * 0.75) * depth;
        const rippleR2 = Math.max((worldW * 0.20) ** 2, 260 ** 2);

        // Project all points once, then draw faint neighbor links + points.
        const cols = state.cols || 0;
        const rows = state.rows || 0;
        const n = state.grid.length;
        if (!state.tmp || state.tmp.n !== n) {
            state.tmp = {
                n,
                sx: new Float32Array(n),
                sy: new Float32Array(n),
                depthK: new Float32Array(n),
                alpha: new Float32Array(n),
                size: new Float32Array(n),
                fall: new Float32Array(n),
                on: new Uint8Array(n),
            };
        }

        const tmp = state.tmp;
        for (let i = 0; i < n; i++) {
            const p = state.grid[i];
            const x = (p.u - 0.5) * worldW;
            const z = p.v * depth;
            const depthK = z / depth;
            const nearK = 1 - depthK;
            const amp = ampNear * (1 - depthK) + ampFar * depthK;

            const nx = (p.u - 0.5);
            const nz = depthK;
            const wave =
                Math.sin((nx * 1.85 + t * 0.55) * Math.PI * 2) * amp * 0.56 +
                Math.sin((nz * 2.45 + t * 0.44) * Math.PI * 2) * amp * 0.52 +
                Math.sin(((nx * 1.10 + nz * 0.98) * 1.75 + t * 0.35) * Math.PI * 2) * amp * 0.32;

            const dx = x - rippleX;
            const dz = z - rippleZ;
            const dist2 = dx * dx + dz * dz;
            const fall = Math.exp(-dist2 / rippleR2);
            const ripple = Math.sin(t * 1.35 - Math.sqrt(dist2) / 54) * (amp * 0.85) * fall;
            const y = wave + ripple;

            let xr = x * cosY + z * sinY;
            let zr = -x * sinY + z * cosY;
            let yr = y;

            const yr2 = yr * cosP - zr * sinP;
            const zr2 = yr * sinP + zr * cosP;
            yr = yr2;
            zr = zr2;

            zr += f * 0.55;
            const scale = f / (f + zr);

            const sx = w * 0.5 + xr * scale;
            const sy = baseY + yr * scale;
            const on = !(sx < -30 || sx > w + 30 || sy < -30 || sy > h + 30);

            tmp.sx[i] = sx;
            tmp.sy[i] = sy;
            tmp.depthK[i] = depthK;
            tmp.fall[i] = fall;
            tmp.size[i] = (0.88 + nearK * 2.05) * p.size * scale;
            // Stronger depth contrast: far fades quickly, near stays visible.
            const alphaDepth = Math.pow(Math.max(0, nearK), 1.25);
            tmp.alpha[i] = (0.010 + alphaDepth * 0.24) * (0.76 + 0.24 * fall);
            tmp.on[i] = on ? 1 : 0;
        }

        // Very subtle neighbor links: draw from far->near so overlap feels "3D".
        // Only connect right + down neighbors (near-neighbor graph).
        const linkBase = 0.040;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.strokeStyle = dot;

        for (let pass = 0; pass < 2; pass++) {
            for (let zi = 0; zi < rows; zi++) {
                for (let xi = 0; xi < cols; xi++) {
                    const i = zi * cols + xi;
                    if (!tmp.on[i]) continue;

                    const d = tmp.depthK[i];
                    if (pass === 0 && d < 0.5) continue;
                    if (pass === 1 && d >= 0.5) continue;

                    // Depth fade: far links are fainter, near links a bit stronger.
                    const nearK = 1 - d;
                    const aDepth = Math.pow(Math.max(0, nearK), 1.15);
                    const a = Math.min(0.16, linkBase + aDepth * 0.11) * (0.62 + 0.38 * tmp.fall[i]);
                    if (a <= 0.01) continue;

                    const x0 = tmp.sx[i], y0 = tmp.sy[i];
                    ctx.globalAlpha = a;

                    // Right neighbor
                    if (xi + 1 < cols) {
                        const j = i + 1;
                        if (tmp.on[j]) {
                            ctx.beginPath();
                            ctx.moveTo(x0, y0);
                            ctx.lineTo(tmp.sx[j], tmp.sy[j]);
                            ctx.stroke();
                        }
                    }
                    // Down neighbor
                    if (zi + 1 < rows) {
                        const j = i + cols;
                        if (tmp.on[j]) {
                            ctx.beginPath();
                            ctx.moveTo(x0, y0);
                            ctx.lineTo(tmp.sx[j], tmp.sy[j]);
                            ctx.stroke();
                        }
                    }
                }
            }
        }

        // Points (far->near) so "near" sits on top.
        for (let pass = 0; pass < 2; pass++) {
            for (let i = 0; i < n; i++) {
                if (!tmp.on[i]) continue;
                const d = tmp.depthK[i];
                if (pass === 0 && d < 0.5) continue;
                if (pass === 1 && d >= 0.5) continue;

                ctx.globalAlpha = tmp.alpha[i];
                ctx.fillStyle = tmp.fall[i] > 0.25 ? dotStrong : dot;
                ctx.beginPath();
                ctx.arc(tmp.sx[i], tmp.sy[i], tmp.size[i], 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1;
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => {
        resize();
        buildGrid();
    });
    ro.observe(section);

    // Expose a tiny handle for debugging if needed.
    canvas.__waveCleanup = () => {
        cancelAnimationFrame(rafId);
        ro.disconnect();
        if (pointerFine) {
            section.removeEventListener('pointerenter', onPointerEnter);
            section.removeEventListener('pointermove', onPointerMove);
            section.removeEventListener('pointerleave', onPointerLeave);
        }
    };

    return true;
}

document.addEventListener('DOMContentLoaded', function () {
    initExperienceExpandCollapse({ reset: true });
    initConnectWaveFooter();
});
