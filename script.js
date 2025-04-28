document.addEventListener('DOMContentLoaded', () => {
    // 滚动效果
    const header = document.querySelector('header');
    const heroSection = document.querySelector('.hero');
    const avatarSection = document.querySelector('.avatar-section');
    
    // 获取头像部分的初始位置和大小
    let heroSectionTop;
    let avatarSectionTop;
    
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
    
    // 页面加载和窗口调整时更新位置
    window.addEventListener('load', updatePositions);
    window.addEventListener('resize', updatePositions);
    
    // 监听滚动事件
    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY;
        
        // 当滚动超过头像部分时，显示导航栏头像
        if (scrollPosition > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
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
    initSidebarHighlight();
    initWorldMap();
});

// 语言切换功能
function initLanguageToggle() {
    const languageToggle = document.getElementById('language-toggle');
    const langText = languageToggle.querySelector('.lang-text');
    const nameElement = document.querySelector('.name');
    
    // 定义英文和中文的内容映射
    const translations = {
        'en': {
            // 导航
            'nav_education': 'Education',
            'nav_experience': 'Experience',
            'nav_papers': 'Papers',
            'nav_awards': 'Awards',
            'nav_footprints': 'Footprints',
            'lang_toggle': '中文',
            
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
            'paper_authors_1': 'Travis Tse, Jiang Wang. 2024 Computational Design Academic Forum Annual Conference Proceedings [C]. Tongji University Press'
        },
        'zh': {
            // 导航
            'nav_education': '教育经历',
            'nav_experience': '工作经历',
            'nav_papers': '论文',
            'nav_awards': '奖项',
            'nav_footprints': '足迹',
            'lang_toggle': 'English',
            
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
            'paper_authors_1': '谢堂华, 王江. 2024计算性设计学术论坛年会论文集[C]. 同济大学出版社'
        }
    };
    
    // 当前语言，默认为英文
    let currentLang = 'en';
    
    // 切换语言函数
    function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
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
                
                // 为当前部分的链接添加active类
                document.querySelector(`.sidebar-link[href="#${id}"]`).classList.add('active');
            }
        });
    }, options);
    
    // 观察每个部分
    sections.forEach(section => {
        observer.observe(section);
    });
}

// 世界地图足迹功能
function initWorldMap() {
    // 设置地图尺寸
    const width = document.getElementById('map-container').offsetWidth;
    const height = 600;
    
    // 创建SVG元素
    const svg = d3.select('#world-map')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
    
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
        { name: "上海", location: [121.4737, 31.2304], intensity: 10 },
        { name: "广东", location: [113.2644, 23.1291], intensity: 9 },
        { name: "山东", location: [117.0000, 36.6510], intensity: 9 },
        { name: "成都", location: [104.0668, 30.5728], intensity: 6 },
        { name: "北京", location: [116.4074, 39.9042], intensity: 6 },
        { name: "海南", location: [110.3290, 19.8330], intensity: 5 },
        { name: "安徽", location: [117.2900, 31.8600], intensity: 5 },
        { name: "江苏", location: [118.7727, 32.0476], intensity: 5 },
        { name: "江西", location: [115.8580, 28.6832], intensity: 4 },
        { name: "湖南", location: [112.9834, 28.1145], intensity: 4 },
        { name: "湖北", location: [114.3416, 30.5470], intensity: 4 },
        { name: "广西", location: [108.3280, 22.8150], intensity: 4 },
        { name: "哈尔滨", location: [126.6420, 45.7560], intensity: 3 },
        { name: "福建", location: [119.2960, 26.0991], intensity: 3 },
        { name: "浙江", location: [120.1536, 30.2650], intensity: 5 },
        { name: "陕西", location: [108.9540, 34.2650], intensity: 3 },
        { name: "重庆", location: [106.5550, 29.5630], intensity: 4 },
        { name: "香港", location: [114.1694, 22.3193], intensity: 6 },
        { name: "澳门", location: [113.5439, 22.1987], intensity: 6 },
        { name: "云南", location: [102.7100, 25.0500], intensity: 3 },
        { name: "河南", location: [113.7500, 34.7700], intensity: 3 },
        { name: "日本", location: [139.6917, 35.6895], intensity: 5 },
        { name: "新加坡", location: [103.8198, 1.3521], intensity: 4 },
        { name: "加拿大温哥华", location: [-123.1207, 49.2827], intensity: 5 },
        { name: "欧洲", location: [9.1900, 48.7775], intensity: 4 }
    ];
    
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
                .attr('fill', '#d1d1d1')
                .attr('stroke', '#ffffff')
                .attr('stroke-width', 0.5);
            
            // 计算热力图的颜色比例尺
            const colorScale = d3.scaleSequential(d3.interpolateInferno)
                .domain([1, 10]);
            
            // 添加足迹点
            g.selectAll('circle')
                .data(footprints)
                .enter()
                .append('circle')
                .attr('cx', d => projection(d.location)[0])
                .attr('cy', d => projection(d.location)[1])
                .attr('r', d => Math.sqrt(d.intensity) * 4)
                .attr('fill', d => colorScale(d.intensity))
                .attr('fill-opacity', 0.7)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5)
                .attr('class', 'footprint')
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .attr('r', Math.sqrt(d.intensity) * 6)
                        .attr('fill-opacity', 0.9);
                })
                .on('mouseout', function(event, d) {
                    d3.select(this)
                        .attr('r', Math.sqrt(d.intensity) * 4)
                        .attr('fill-opacity', 0.7);
                });
            
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