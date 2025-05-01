document.addEventListener('DOMContentLoaded', () => {
    // 滚动效果
    const header = document.querySelector('header');
    const heroSection = document.querySelector('.hero');
    const avatarSection = document.querySelector('.avatar-section');
    
    // 获取头像部分的初始位置和大小
    let heroSectionTop;
    let avatarSectionTop;
    
    // 检测深色模式
    checkDarkMode();
    
    // 监听系统深色模式变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', checkDarkMode);
    
    // 页面加载后更新位置信息
    function updatePositions() {
        heroSectionTop = heroSection.offsetTop;
        avatarSectionTop = avatarSection.offsetTop;
        
        // 页面加载时也检查滚动位置
        const scrollPosition = window.scrollY;
        if (scrollPosition > 100) {
            header.classList.add('scrolled');
        }
    }
    
    // 检测系统深色模式并适配
    function checkDarkMode() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
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

    // 项目轮播功能
    initProjectsCarousel();
});

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
    
    // 创建位置信息
    const locationInfo = document.createElement('div');
    locationInfo.className = 'location-info';
    locationInfo.innerHTML = '<i class="fas fa-map-marker-alt"></i>Shanghai';
    locationInfo.style.display = 'flex';
    locationInfo.style.alignItems = 'center';
    
    // 重组结构
    heroInfo.appendChild(nameElement.cloneNode(true));
    heroInfo.appendChild(locationInfo);
    heroInfo.appendChild(contactInfo.cloneNode(true));
    
    // 将头像和信息容器添加到hero内容容器
    heroContent.appendChild(avatarContainer);
    heroContent.appendChild(heroInfo);
    
    // 清空原容器并添加新结构
    heroContainer.innerHTML = '';
    heroContainer.appendChild(heroContent);
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
        if(experienceItems.length >= 4) {
            // 宜家
            const ikea = experienceItems[0];
            ikea.querySelector('h3').textContent = translations[currentLang]['exp_ikea_title'];
            ikea.querySelector('.experience-meta').textContent = translations[currentLang]['exp_ikea_meta'];
            ikea.querySelector('.experience-time').textContent = translations[currentLang]['exp_ikea_time'];
            
            // Smart Site360
            const smartSite = experienceItems[1];
            smartSite.querySelector('h3').textContent = translations[currentLang]['exp_smartsite_title'];
            smartSite.querySelector('.experience-meta').textContent = translations[currentLang]['exp_smartsite_meta'];
            smartSite.querySelector('.experience-time').textContent = translations[currentLang]['exp_smartsite_time'];
            
            // Matconstruct
            const matConstruct = experienceItems[2];
            matConstruct.querySelector('h3').textContent = translations[currentLang]['exp_matconstruct_title'];
            matConstruct.querySelector('.experience-meta').textContent = translations[currentLang]['exp_matconstruct_meta'];
            matConstruct.querySelector('.experience-time').textContent = translations[currentLang]['exp_matconstruct_time'];
            
            // Google
            const google = experienceItems[3];
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
        document.querySelector('footer p').textContent = translations[currentLang]['footer_copyright'];
        
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
    // 设置地图尺寸
    const width = document.getElementById('map-container').offsetWidth;
    const height = 600;
    
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
    const footprints = [
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
        { name: "哈尔滨", location: [126.6420, 45.7560], intensity: 3, image: "https://lw.news.cn/1310652188_16603609094661n.jpg" },
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
        .style('background-color', 'white')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 15px rgba(0, 0, 0, 0.2)')
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
                    
                    // 显示缩略图和位置名称
                    const imageWidth = 280;
                    const imageHeight = 180;
                    
                    tooltip.html(`
                        <div style="width: ${imageWidth}px; height: ${imageHeight}px; overflow: hidden; position: relative;">
                            <img src="${d.image}" alt="${d.name}" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1); transition: transform 0.5s ease;">
                        </div>
                    `)
                    .style('left', `${event.pageX + 15}px`)
                    .style('top', `${event.pageY - 100}px`)
                    .style('visibility', 'visible')
                    .style('opacity', '1')
                    .style('transform', 'translateY(0) scale(1)');
                    
                    // 添加图片加载缩放动画
                    setTimeout(() => {
                        const img = tooltip.select('img').node();
                        if (img && img.complete) {
                            img.style.transform = 'scale(1.05)';
                        }
                    }, 300);
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
    const projects = document.querySelectorAll('.project-item');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    
    // 检查元素是否存在
    if (!projectsCarousel || !projectsWrapper || projects.length === 0) {
        return; // 如果元素不存在，则退出函数
    }
    
    let currentIndex = 0;
    let projectWidth = projects[0].offsetWidth + 20; // 项目宽度 + margin
    let projectsPerView = getProjectsPerView();
    let autoSlideInterval;
    let isHovered = false;
    let maxVisibleIndex = Math.max(0, projects.length - projectsPerView);
    let activeDotsPage = 0;
    
    // 根据屏幕宽度确定一次显示几个项目
    function getProjectsPerView() {
        if (window.innerWidth > 992) {
            return 3; // 桌面设备显示3个
        } else if (window.innerWidth > 768) {
            return 2; // 平板设备显示2个
        } else {
            return 1; // 手机设备显示1个
        }
    }
    
    // 更新轮播位置
    function updateCarousel() {
        projectWidth = projects[0].offsetWidth + 20; // 重新计算项目宽度
        projectsPerView = getProjectsPerView();
        maxVisibleIndex = Math.max(0, projects.length - projectsPerView);
        
        // 检查是否需要调整当前索引
        if (currentIndex > maxVisibleIndex) {
            currentIndex = maxVisibleIndex;
        }
        
        // 更新轮播位置
        projectsWrapper.style.transform = `translateX(-${currentIndex * projectWidth}px)`;
        
        // 计算当前页面（为了导航点）
        activeDotsPage = Math.floor(currentIndex / projectsPerView);
        
        // 更新导航点状态
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === activeDotsPage);
        });
        
        // 检查是否需要禁用前进/后退按钮
        prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
        nextBtn.style.opacity = currentIndex >= maxVisibleIndex ? '0.5' : '1';
    }
    
    // 跳转到指定项目
    function goToProject(index) {
        currentIndex = Math.max(0, Math.min(index, maxVisibleIndex));
        updateCarousel();
    }
    
    // 下一个项目
    function nextProject() {
        goToProject(currentIndex + 1);
    }
    
    // 上一个项目
    function prevProject() {
        goToProject(currentIndex - 1);
    }
    
    // 跳转到指定的导航点
    function goToDot(dotIndex) {
        goToProject(dotIndex * projectsPerView);
    }
    
    // 自动轮播
    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(() => {
            if (!isHovered) {
                if (currentIndex >= maxVisibleIndex) {
                    goToProject(0); // 如果到达最后，回到第一个
                } else {
                    nextProject(); // 否则前进到下一个
                }
            }
        }, 5000);
    }
    
    // 停止自动轮播
    function stopAutoSlide() {
        clearInterval(autoSlideInterval);
    }
    
    // 更新轮播初始状态
    updateCarousel();
    
    // 添加按钮点击事件
    prevBtn.addEventListener('click', prevProject);
    nextBtn.addEventListener('click', nextProject);
    
    // 添加导航点点击事件
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => goToDot(index));
    });
    
    // 鼠标悬停暂停自动轮播
    projectsCarousel.addEventListener('mouseenter', () => {
        isHovered = true;
    });
    
    projectsCarousel.addEventListener('mouseleave', () => {
        isHovered = false;
    });
    
    // 监听窗口大小变化，更新轮播布局
    window.addEventListener('resize', () => {
        projectWidth = projects[0].offsetWidth + 20;
        projectsPerView = getProjectsPerView();
        maxVisibleIndex = Math.max(0, projects.length - projectsPerView);
        updateCarousel();
    });
    
    // 添加鼠标滚轮事件
    projectsCarousel.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (e.deltaY > 0) {
            nextProject();
        } else {
            prevProject();
        }
    }, { passive: false });
    
    // 添加触摸滑动支持
    let touchStartX = 0;
    let touchEndX = 0;
    
    projectsCarousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    projectsCarousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchEndX < touchStartX - swipeThreshold) {
            nextProject();
        } else if (touchEndX > touchStartX + swipeThreshold) {
            prevProject();
        }
    }
    
    // 启动自动轮播
    startAutoSlide();
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
            <div class="ai-message-content">
                <p>${message}</p>
            </div>
        `;
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
    
    // 调用DeepSeek API获取回复
    async function fetchAIResponse(message) {
        try {
            // DeepSeek API调用
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer DEEPSEEK_API_KEY' // 实际使用时需替换为真实的API密钥
                },
                body: JSON.stringify({
                    model: 'deepseek-chat', // 根据DeepSeek的实际模型名称调整
                    messages: [
                        {
                            role: 'system',
                            content: 'You are Travis\'s AI assistant, helping website visitors answer questions about Travis\'s education, experience, skills, etc. Please respond in English in a friendly and professional tone.'
                        },
                        {
                            role: 'user',
                            content: message
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 512
                })
            });
            
            // 解析API响应
            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const aiResponse = data.choices[0].message.content;
                addAIMessage(aiResponse);
            } else {
                // 如果没有得到有效响应，显示错误消息
                addAIMessage("I'm sorry, I couldn't generate a response at this time. Please try again later.");
            }
            
        } catch (error) {
            console.error('Error fetching AI response:', error);
            removeTypingIndicator();
            
            // 在API调用失败时提供备用响应
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

// 初始化工作经历折叠/展开功能
document.addEventListener('DOMContentLoaded', function() {
    // 获取所有折叠/展开按钮
    const toggleButtons = document.querySelectorAll('.experience-toggle');
    // 获取可点击的标题区域和logo
    const clickableHeaders = document.querySelectorAll('.experience-header[data-controls]');
    const clickableLogos = document.querySelectorAll('.experience-logo[data-controls]');
    
    // 保存当前展开的项目
    let currentExpanded = null;
    
    // 折叠/展开功能
    function toggleDetails(detailsId) {
        const detailsElement = document.getElementById(detailsId);
        const wrapperElement = document.getElementById(detailsId.replace('details', 'wrapper'));
        const button = document.querySelector(`[aria-controls="${detailsId}"]`);
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            // 折叠当前项
            button.setAttribute('aria-expanded', 'false');
            
            // 先设置高度为当前实际高度，然后动画过渡到0
            const currentHeight = wrapperElement.scrollHeight;
            wrapperElement.style.height = `${currentHeight}px`;
            
            // 强制回流
            wrapperElement.offsetHeight;
            
            // 开始高度过渡到0
            requestAnimationFrame(() => {
                wrapperElement.style.height = '0';
                
                // 过渡完成后移除expanded类
                setTimeout(() => {
                    detailsElement.classList.remove('expanded');
                }, 300);
            });
            
            currentExpanded = null;
        } else {
            // 如果有其他已展开的项目，先折叠它
            if (currentExpanded) {
                const currentButton = document.querySelector(`[aria-controls="${currentExpanded}"]`);
                const currentDetails = document.getElementById(currentExpanded);
                const currentWrapper = document.getElementById(currentExpanded.replace('details', 'wrapper'));
                
                currentButton.setAttribute('aria-expanded', 'false');
                
                // 获取当前高度并设置，然后过渡到0
                const currentHeight = currentWrapper.scrollHeight;
                currentWrapper.style.height = `${currentHeight}px`;
                
                // 强制回流
                currentWrapper.offsetHeight;
                
                // 开始高度过渡到0
                requestAnimationFrame(() => {
                    currentWrapper.style.height = '0';
                    
                    // 过渡完成后移除expanded类
                    setTimeout(() => {
                        currentDetails.classList.remove('expanded');
                    }, 300);
                });
            }
            
            // 展开当前点击的项目
            button.setAttribute('aria-expanded', 'true');
            detailsElement.classList.add('expanded');
            
            // 计算内容实际高度并设置
            requestAnimationFrame(() => {
                const targetHeight = detailsElement.offsetHeight;
                wrapperElement.style.height = `${targetHeight}px`;
            });
            
            currentExpanded = detailsId;
            
            // 保存滚动位置而不是自动滚动，避免在内容展开/折叠时页面移动
            // 如果绝对必要，可以使用下面的代码来滚动到展开内容的位置
            /*
            const yOffset = -100; // 上方预留的空间
            const headerElement = document.querySelector(`.experience-header[data-controls="${detailsId}"]`);
            const y = headerElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            
            window.scrollTo({
                top: y,
                behavior: 'smooth'
            });
            */
        }
    }
    
    // 为展开/折叠按钮添加点击事件
    toggleButtons.forEach(button => {
        // 默认情况下，所有详情都是折叠的
        const detailsId = button.getAttribute('aria-controls');
        const detailsElement = document.getElementById(detailsId);
        const wrapperElement = document.getElementById(detailsId.replace('details', 'wrapper'));
        
        // 初始化时设置为折叠状态
        button.setAttribute('aria-expanded', 'false');
        detailsElement.classList.remove('expanded');
        wrapperElement.style.height = '0';
        
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡
            toggleDetails(detailsId);
        });
    });
    
    // 为标题区域添加点击事件
    clickableHeaders.forEach(header => {
        const detailsId = header.getAttribute('data-controls');
        
        header.addEventListener('click', function(e) {
            // 确保点击不是在按钮上
            if (!e.target.closest('.experience-toggle')) {
                toggleDetails(detailsId);
            }
        });
    });
    
    // 为Logo添加点击事件
    clickableLogos.forEach(logo => {
        const detailsId = logo.getAttribute('data-controls');
        
        logo.addEventListener('click', function() {
            toggleDetails(detailsId);
        });
    });
    
    // 窗口大小变化时重新计算高度
    window.addEventListener('resize', function() {
        if (currentExpanded) {
            const detailsElement = document.getElementById(currentExpanded);
            const wrapperElement = document.getElementById(currentExpanded.replace('details', 'wrapper'));
            
            if (detailsElement.classList.contains('expanded')) {
                requestAnimationFrame(() => {
                    const targetHeight = detailsElement.offsetHeight;
                    wrapperElement.style.height = `${targetHeight}px`;
                });
            }
        }
    });
}); 