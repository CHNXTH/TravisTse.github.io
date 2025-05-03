/**
 * admin-sync.js
 * 负责实现后台管理系统与前端页面的数据同步
 */

// 标记是否已经从前端提取数据
window.frontendDataExtracted = false;

// 生成唯一ID函数 - 确保在admin-sync.js中也能使用
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 在页面加载时立即执行数据提取（不等待DOMContentLoaded）
(function() {
    console.debug('admin-sync.js 初始化中...');
    
    // 如果在iframe中，不执行提取
    if (window.self !== window.top) {
        console.debug('检测到在iframe中，跳过数据提取');
        return;
    }
    
    // 检查是否是管理页面
    const isAdminPage = window.location.pathname.includes('admin');
    if (isAdminPage) {
        console.debug('检测到在管理页面，跳过初始数据提取');
        window.frontendDataExtracted = true;
        return;
    }
    
    // 先检查localStorage中是否已有数据
    try {
        const existingData = localStorage.getItem('websiteData');
        if (existingData) {
            try {
                // 解析数据并验证完整性
                const data = JSON.parse(existingData);
                
                // 检查是否包含关键字段
                if (data && data.profile && data.experience !== undefined) {
                    console.debug('检测到localStorage中存在有效数据，设置提取标志为true');
                    window.frontendDataExtracted = true;
                    
                    // 检查数据版本和完整性
                    if (data.meta && data.meta.version) {
                        console.debug(`数据版本: ${data.meta.version}, 最后修改: ${data.meta.lastModified || '未知'}`);
                    } else {
                        console.debug('数据缺少版本信息，可能需要升级');
                    }
                    
                    return; // 如果已有数据，直接返回，不执行提取
                } else {
                    console.debug('localStorage数据存在但不完整，将执行初始提取');
                }
            } catch (parseError) {
                console.error('解析localStorage数据失败:', parseError);
                console.debug('将执行初始提取以修复数据');
            }
        } else {
            console.debug('未检测到localStorage中的数据，将执行初始提取');
        }
        
        window.frontendDataExtracted = false;
    } catch (e) {
        console.error('检查localStorage数据失败:', e);
    }
    
    // 延迟执行，确保DOM已完全加载
    setTimeout(function() {
        // 再次检查是否已经执行过
        if (window.frontendDataExtracted) {
            console.debug('前端数据已提取过，跳过重复提取');
            return;
        }
        
        try {
            // 尝试提取前端数据
            console.log('开始从前端提取数据...');
            extractFrontendData();
        } catch (e) {
            console.error('提取前端数据失败:', e);
        }
    }, 500); // 减少延迟到500ms，提高加载速度
})();

// 提取前端数据并保存到localStorage
function extractFrontendData() {
    // 如果在iframe中，不执行提取
    if (window.self !== window.top) return;
    
    // 如果已经提取过，不再重复提取
    if (window.frontendDataExtracted) {
        console.log('数据已提取过，跳过重复提取');
        return;
    }
    
    console.log('提取前端数据到localStorage...');
    
    try {
        // 获取当前websiteData（如果存在）
        let websiteData = {};
        try {
            const existingData = localStorage.getItem('websiteData');
            if (existingData) {
                websiteData = JSON.parse(existingData);
            }
        } catch (e) {
            console.error('读取现有数据失败，将创建新数据:', e);
        }
        
        // 确保所有数据结构都存在
        websiteData.profile = websiteData.profile || {};
        websiteData.education = websiteData.education || [];
        websiteData.experience = websiteData.experience || [];
        websiteData.projects = websiteData.projects || [];
        websiteData.papers = websiteData.papers || [];
        websiteData.awards = websiteData.awards || [];
        websiteData.social = websiteData.social || [];
        websiteData.footprints = websiteData.footprints || [];
        websiteData.settings = websiteData.settings || { password: '725500@20020303' };
        
        // 只有当字段为空时才提取数据（避免覆盖已有数据）
        if (Object.keys(websiteData.profile).length === 0) {
            extractProfileData(websiteData);
        } else {
            console.log('个人资料数据已存在，跳过提取');
        }
        
        if (websiteData.education.length === 0) {
            extractEducationData(websiteData);
        } else {
            console.log('教育经历数据已存在，跳过提取');
        }
        
        if (websiteData.experience.length === 0) {
            extractExperienceData(websiteData);
        } else {
            console.log('工作经历数据已存在，跳过提取');
        }
        
        if (websiteData.projects.length === 0) {
            extractProjectsData(websiteData);
        } else {
            console.log('项目数据已存在，跳过提取');
        }
        
        if (websiteData.papers.length === 0) {
            extractPapersData(websiteData);
        } else {
            console.log('论文数据已存在，跳过提取');
        }
        
        if (websiteData.awards.length === 0) {
            extractAwardsData(websiteData);
        } else {
            console.log('奖项数据已存在，跳过提取');
        }
        
        if (websiteData.social.length === 0) {
            extractSocialData(websiteData);
        } else {
            console.log('社交媒体数据已存在，跳过提取');
        }
        
        // 添加元数据
        if (!websiteData.meta) {
            websiteData.meta = {
                version: '1.0',
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                source: 'frontend_extract'
            };
        }
        
        // 标记前端数据已提取
        window.frontendDataExtracted = true;
        
        // 将提取的数据保存到localStorage
        localStorage.setItem('websiteData', JSON.stringify(websiteData));
        
        console.log('前端数据提取完成，已保存到localStorage');
        
        // 触发同步事件通知其他页面
        try {
            localStorage.setItem('websiteDataSync', Date.now().toString());
            localStorage.setItem('websiteDataSyncSource', 'frontend_extract_' + Math.random().toString(36).substring(2));
        } catch (e) {
            console.error('触发同步事件失败:', e);
        }
        
        return websiteData;
    } catch (error) {
        console.error('提取前端数据失败:', error);
        
        // 即使失败也标记为已提取，防止反复尝试
        window.frontendDataExtracted = true;
        
        throw error;
    }
}

// 提取个人资料数据
function extractProfileData(dataObj) {
    try {
        // 从前端获取个人资料
        const nameElement = document.querySelector('.name');
        if (nameElement) {
            const nameEn = nameElement.getAttribute('data-en') || nameElement.textContent;
            const nameZh = nameElement.getAttribute('data-zh') || '';
            
            dataObj.profile = dataObj.profile || {};
            dataObj.profile.nameEn = nameEn;
            dataObj.profile.nameZh = nameZh;
        }
        
        // 提取联系信息
        const contactInfo = document.querySelector('.contact-info');
        if (contactInfo) {
            const contactText = contactInfo.textContent;
            // 提取年龄、电话和电子邮件
            const ageMatch = contactText.match(/(\d+)\s*Years\s*Old/i);
            if (ageMatch) {
                dataObj.profile.age = ageMatch[1];
            }
            
            // 提取电话
            const phoneLink = contactInfo.querySelector('a[href^="tel:"]');
            if (phoneLink) {
                dataObj.profile.phone = phoneLink.textContent;
            }
            
            // 提取邮箱
            const emailLink = contactInfo.querySelector('a[href^="mailto:"]');
            if (emailLink) {
                dataObj.profile.email = emailLink.textContent;
            }
        }
        
        // 提取头像
        const avatarImg = document.querySelector('.avatar-img');
        if (avatarImg) {
            dataObj.profile.avatar = avatarImg.src;
        }
        
        // 提取地点
        const locationInfo = document.querySelector('.location-info');
        if (locationInfo) {
            const locationText = locationInfo.textContent.replace(/^\s*\S+\s*/, ''); // 移除图标文本
            dataObj.profile.location = locationText;
        }
    } catch (error) {
        console.error('提取个人资料失败:', error);
    }
}

// 提取教育经历数据
function extractEducationData(dataObj) {
    try {
        const educationItems = document.querySelectorAll('#education .education-item');
        const educations = [];
        
        educationItems.forEach((item, index) => {
            const education = {
                id: generateId(),
                school: item.querySelector('h3')?.textContent || '',
                meta: item.querySelector('.education-meta')?.textContent || '',
                details: item.querySelector('.education-details')?.textContent || '',
                time: item.querySelector('.education-time')?.textContent || '',
                research: item.querySelector('.education-research')?.textContent || '',
                stats: item.querySelector('.education-stats')?.textContent || '',
                awards: item.querySelector('.education-awards')?.textContent || ''
            };
            
            educations.push(education);
        });
        
        dataObj.education = educations;
    } catch (error) {
        console.error('提取教育经历失败:', error);
    }
}

// 提取工作经历数据
function extractExperienceData(dataObj) {
    try {
        console.log('开始提取工作经历数据...');
        const experienceItems = document.querySelectorAll('#experience .experience-item');
        console.log('找到工作经历项数量:', experienceItems.length);
        
        // 记录每个工作经历项的HTML，便于调试
        experienceItems.forEach((item, i) => {
            console.log(`工作经历项 ${i+1} HTML:`, item.innerHTML.substring(0, 100) + '...');
        });
        
        const experiences = [];
        
        experienceItems.forEach((item, index) => {
            // 获取logo
            const logoElement = item.querySelector('.experience-logo img');
            const logoPath = logoElement ? logoElement.src : '';
            console.log(`工作经历 ${index+1} logo:`, logoPath);
            
            // 获取公司名称
            const company = item.querySelector('h3')?.textContent || '';
            console.log(`工作经历 ${index+1} 公司:`, company);
            
            // 获取职位/角色和时间
            const meta = item.querySelector('.experience-meta')?.textContent || '';
            const time = item.querySelector('.experience-time')?.textContent || '';
            console.log(`工作经历 ${index+1} 职位: ${meta}, 时间: ${time}`);
            
            // 获取工作详情
            const detailsList = item.querySelectorAll('.experience-details li');
            if (detailsList.length === 0) {
                console.log(`工作经历 ${index+1} 详情列表未找到`);
            } else {
                console.log(`工作经历 ${index+1} 详情项数量:`, detailsList.length);
            }
            
            const details = Array.from(detailsList)
                .map(li => li.textContent)
                .join('\n');
            
            // 确保每个工作经历都有唯一ID
            const experience = {
                id: generateId(),
                company,
                meta,
                time,
                details,
                logoPath
            };
            
            experiences.push(experience);
            console.log(`工作经历 ${index+1} (${company}) 提取完成, 详情长度:`, details.length);
        });
        
        // 打印每个工作经历的对象
        console.log('提取的工作经历数据:', experiences);
        
        // 查看原有数据是否存在
        let existingData = [];
        try {
            const websiteData = JSON.parse(localStorage.getItem('websiteData')) || {};
            if (websiteData.experience && Array.isArray(websiteData.experience) && websiteData.experience.length > 0) {
                existingData = websiteData.experience;
                console.log('localStorage中已存在工作经历数据:', existingData.length);
            }
        } catch (e) {
            console.log('读取已有工作经历数据失败:', e);
        }
        
        // 如果新提取的数据为空，但原有数据存在，则保留原有数据
        if (experiences.length === 0 && existingData.length > 0) {
            console.log('未提取到新数据，保留原有工作经历数据:', existingData.length);
            dataObj.experience = existingData;
        } else if (experiences.length > 0) {
            // 否则使用新提取的数据
            dataObj.experience = experiences;
            console.log('工作经历提取完成，共', experiences.length, '条');
        } else {
            // 都为空的情况
            dataObj.experience = [];
            console.log('未找到工作经历数据');
        }
    } catch (error) {
        console.error('提取工作经历失败:', error);
    }
}

// 提取项目展示数据
function extractProjectsData(dataObj) {
    try {
        const projectItems = document.querySelectorAll('.project-item');
        const projects = [];
        
        projectItems.forEach((item, index) => {
            const projectLink = item.querySelector('.project-link');
            const projectTitle = item.querySelector('.project-info h3')?.textContent || '';
            const projectImage = item.querySelector('.project-image');
            const imagePath = projectImage ? projectImage.src : '';
            const link = projectLink ? projectLink.href : '';
            
            const project = {
                id: generateId(),
                title: projectTitle,
                link: link,
                imagePath: imagePath
            };
            
            projects.push(project);
        });
        
        dataObj.projects = projects;
    } catch (error) {
        console.error('提取项目展示失败:', error);
    }
}

// 提取论文与专利数据
function extractPapersData(dataObj) {
    try {
        const paperItems = document.querySelectorAll('#papers .timeline-item');
        const papers = [];
        
        paperItems.forEach((item, index) => {
            const time = item.querySelector('.timeline-date')?.textContent || '';
            const title = item.querySelector('h3')?.textContent || 
                         item.querySelector('h3 a')?.textContent || '';
            const link = item.querySelector('h3 a')?.href || '';
            const authors = item.querySelector('p')?.textContent || '';
            
            const paper = {
                id: generateId(),
                time,
                title,
                link,
                authors
            };
            
            papers.push(paper);
        });
        
        dataObj.papers = papers;
    } catch (error) {
        console.error('提取论文与专利失败:', error);
    }
}

// 提取奖项荣誉数据
function extractAwardsData(dataObj) {
    try {
        const awardItems = document.querySelectorAll('#awards .timeline-item');
        const awards = [];
        
        awardItems.forEach((item, index) => {
            const time = item.querySelector('.timeline-date')?.textContent || '';
            const title = item.querySelector('h3')?.textContent || '';
            
            const award = {
                id: generateId(),
                time,
                title,
                details: ''
            };
            
            awards.push(award);
        });
        
        dataObj.awards = awards;
    } catch (error) {
        console.error('提取奖项荣誉失败:', error);
    }
}

// 提取足迹数据
function extractFootprintsData(dataObj) {
    try {
        // 从script.js中提取足迹数据
        const scriptElements = document.querySelectorAll('script');
        let footprintData = [];
        
        for (const script of scriptElements) {
            if (script.textContent.includes('const footprints = [')) {
                const footprintsMatch = script.textContent.match(/const\s+footprints\s*=\s*\[([\s\S]*?)\];/);
                if (footprintsMatch && footprintsMatch[1]) {
                    // 使用Function构造函数安全地解析数据
                    try {
                        const dataString = `return [${footprintsMatch[1]}];`;
                        const parseFunction = new Function(dataString);
                        const parsedData = parseFunction();
                        
                        if (Array.isArray(parsedData)) {
                            footprintData = parsedData;
                        }
                    } catch (e) {
                        console.error('解析足迹数据失败:', e);
                    }
                }
                break;
            }
        }
        
        // 转换为我们需要的格式
        const footprints = footprintData.map(item => {
            return {
                id: generateId(),
                city: item.name.split(',')[0] || item.name,
                country: item.name.includes(',') ? item.name.split(',')[1].trim() : '中国',
                lat: item.location[1],
                lng: item.location[0],
                year: '',
                description: '',
                intensity: item.intensity || 5,
                image: item.image || ''
            };
        });
        
        dataObj.footprints = footprints;
    } catch (error) {
        console.error('提取足迹数据失败:', error);
    }
}

// 提取社交媒体数据
function extractSocialData(dataObj) {
    try {
        const socialItems = document.querySelectorAll('#social .social-icon');
        const socials = [];
        
        socialItems.forEach((item, index) => {
            const link = item.href || '';
            const icon = item.querySelector('i');
            const customIcon = item.querySelector('img');
            let name = '';
            let type = 'custom';
            let iconPath = '';
            
            // 判断社交媒体类型
            if (icon) {
                if (icon.classList.contains('fa-instagram')) {
                    type = 'instagram';
                    name = 'Instagram';
                } else if (icon.classList.contains('fa-behance')) {
                    type = 'behance';
                    name = 'Behance';
                } else if (icon.classList.contains('fa-github')) {
                    type = 'github';
                    name = 'GitHub';
                } else if (icon.classList.contains('fa-pinterest')) {
                    type = 'pinterest';
                    name = 'Pinterest';
                } else if (icon.classList.contains('fa-youtube')) {
                    type = 'youtube';
                    name = 'YouTube';
                } else if (icon.classList.contains('fa-tiktok')) {
                    type = 'tiktok';
                    name = '抖音';
                }
            } else if (customIcon) {
                const altText = customIcon.alt || '';
                name = altText;
                iconPath = customIcon.src || '';
                
                if (altText.includes('小红书')) {
                    type = 'rednote';
                    name = '小红书';
                } else if (altText.includes('网易云')) {
                    type = 'netease';
                    name = '网易云音乐';
                }
            }
            
            const social = {
                id: generateId(),
                type,
                name,
                link,
                iconPath
            };
            
            socials.push(social);
        });
        
        dataObj.social = socials;
    } catch (error) {
        console.error('提取社交媒体数据失败:', error);
    }
}

// 监听管理面板的变化
function listenForAdminChanges() {
    // 当管理面板做出更改时，触发前端更新
    const originalSaveWebsiteData = window.saveWebsiteData;
    
    window.saveWebsiteData = function() {
        // 先调用原来的保存函数
        originalSaveWebsiteData();
        
        // 然后更新前端
        updateFrontend();
    };
}

// 初始化自动保存功能
function initAutoSave() {
    // 添加自动保存定时器
    setInterval(function() {
        saveWebsiteData();
    }, 60000); // 每分钟自动保存一次
}

// 更新前端显示
function updateFrontend() {
    // 通过DOM操作更新前端视图
    try {
        // 1. 更新个人资料
        updateProfileFrontend();
        
        // 2. 更新教育经历
        updateEducationFrontend();
        
        // 3. 更新工作经历
        updateExperienceFrontend();
        
        // 4. 更新项目展示
        updateProjectsFrontend();
        
        // 5. 更新论文与专利
        updatePapersFrontend();
        
        // 6. 更新奖项荣誉
        updateAwardsFrontend();
        
        // 7. 更新足迹
        updateFootprintsFrontend();
        
        // 8. 更新社交媒体
        updateSocialFrontend();
        
        console.log('前端更新完成');
    } catch (error) {
        console.error('更新前端失败:', error);
    }
}

// 更新个人资料前端
function updateProfileFrontend() {
    const profile = websiteData.profile || {};
    
    // 更新姓名
    const nameElements = document.querySelectorAll('.name');
    nameElements.forEach(element => {
        element.textContent = profile.nameEn || 'Travis Tse';
        element.setAttribute('data-en', profile.nameEn || 'Travis Tse');
        element.setAttribute('data-zh', profile.nameZh || '谢堂华 Travis Tse');
    });
    
    // 更新头像
    const avatarImgs = document.querySelectorAll('.avatar-img');
    avatarImgs.forEach(img => {
        if (profile.avatar) img.src = profile.avatar;
    });
    
    // 更新小头像
    const smallAvatars = document.querySelectorAll('.nav-avatar-img, .admin-avatar-small');
    smallAvatars.forEach(img => {
        if (profile.avatar) img.src = profile.avatar;
    });
    
    // 更新联系信息
    const contactInfo = document.querySelector('.contact-info');
    if (contactInfo) {
        contactInfo.innerHTML = `${profile.age || '23'} Years Old | <a href="tel:${profile.phone || '15698010160'}">${profile.phone || '15698010160'}</a> | <a href="mailto:${profile.email || 'chnxth@gmail.com'}">${profile.email || 'chnxth@gmail.com'}</a>`;
    }
    
    // 更新位置信息
    const locationInfo = document.querySelector('.location-info');
    if (locationInfo) {
        locationInfo.innerHTML = `<i class="fas fa-map-marker-alt"></i>${profile.location || 'Shanghai'}`;
    }
}

// 更新教育经历前端
function updateEducationFrontend() {
    const educations = websiteData.education || [];
    const container = document.querySelector('#education .container');
    if (!container) return;
    
    // 清空现有内容，保留标题
    const sectionTitle = container.querySelector('.section-title');
    container.innerHTML = '';
    container.appendChild(sectionTitle);
    
    // 重新添加所有教育经历
    educations.forEach((education, index) => {
        const educationItem = document.createElement('div');
        educationItem.className = 'education-item';
        
        // 如果不是第一项，添加分隔线
        if (index > 0) {
            const divider = document.createElement('div');
            divider.className = 'divider';
            container.appendChild(divider);
        }
        
        educationItem.innerHTML = `
            <div class="education-header">
                <h3>${education.school}</h3>
                <p class="education-meta">${education.meta}</p>
            </div>
            <p class="education-details">${education.details}</p>
            ${education.time ? `<p class="education-time">${education.time}</p>` : ''}
            ${education.research ? `<p class="education-research">${education.research}</p>` : ''}
            ${education.stats ? `<p class="education-stats">${education.stats}</p>` : ''}
            ${education.awards ? `<p class="education-awards">${education.awards}</p>` : ''}
        `;
        
        container.appendChild(educationItem);
    });
}

// 更新工作经历前端
function updateExperienceFrontend() {
    try {
        const experiences = websiteData.experience || [];
        const container = document.querySelector('#experience .container');
        if (!container) {
            console.error('找不到工作经历容器 #experience .container');
            return;
        }
        
        console.log('更新工作经历前端，共', experiences.length, '条记录');
        
        // 保存原有结构
        const sectionTitle = container.querySelector('.section-title');
        const subsectionTitle = container.querySelector('.subsection-title');
        const projectsCarousel = container.querySelector('.projects-carousel');
        
        // 清空现有内容（保留项目轮播）
        container.innerHTML = '';
        if (sectionTitle) container.appendChild(sectionTitle);
        
        if (experiences.length === 0) {
            console.log('工作经历数据为空，不执行更新');
            
            // 添加分隔线
            const divider = document.createElement('div');
            divider.className = 'divider';
            container.appendChild(divider);
            
            // 重新添加子标题和项目轮播
            if (subsectionTitle) container.appendChild(subsectionTitle);
            if (projectsCarousel) container.appendChild(projectsCarousel);
            
            return;
        }
        
        // 重新添加所有工作经历
        experiences.forEach((experience, index) => {
            console.log(`正在添加工作经历 ${index+1}: ${experience.company}`);
            
            try {
                const experienceItem = document.createElement('div');
                experienceItem.className = 'experience-item';
                
                // 如果不是第一项，添加分隔线
                if (index > 0) {
                    const divider = document.createElement('div');
                    divider.className = 'divider';
                    container.appendChild(divider);
                }
                
                // 安全的ID生成 - 更健壮的方式处理ID
                const safeId = (experience.company || 'exp')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '') + '-' + (experience.id || index);
                
                // 检查Logo是否有效
                let logoUrl = experience.logoPath || 'assets/images/placeholder-logo.png';
                if (logoUrl.startsWith('blob:') || !logoUrl.match(/^(https?:|data:|assets\/|\/)/i)) {
                    logoUrl = 'assets/images/placeholder-logo.png';
                }
                
                // 格式化工作内容为列表
                let detailsHtml = '';
                if (experience.details) {
                    const details = experience.details.split('\n')
                        .filter(line => line.trim())
                        .map(line => line.trim().replace(/^-\s*/, '').trim());
                    
                    if (details.length > 0) {
                        detailsHtml = `
                            <ul class="experience-details" id="${safeId}-details">
                                ${details.map(detail => `<li>${detail}</li>`).join('')}
                            </ul>
                        `;
                    }
                }
                
                // 构造HTML
                experienceItem.innerHTML = `
                    <div class="experience-logo" data-controls="${safeId}-details" title="Click to expand details">
                        <img src="${logoUrl}" alt="${experience.company} Logo" onerror="this.src='assets/images/placeholder-logo.png'">
                    </div>
                    <div class="experience-content">
                        <div class="experience-header" data-controls="${safeId}-details" title="Click to expand details">
                            <h3>${experience.company || 'Untitled'}</h3>
                            <p class="experience-meta">${experience.meta || ''}</p>
                            <p class="experience-time">${experience.time || ''}</p>
                            <button class="experience-toggle" aria-expanded="false" aria-controls="${safeId}-details" title="Toggle details">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="experience-details-wrapper" id="${safeId}-wrapper">
                            ${detailsHtml}
                        </div>
                    </div>
                `;
                
                container.appendChild(experienceItem);
                console.log(`工作经历 ${index+1} (${experience.company}) 添加成功`);
            } catch (e) {
                console.error(`添加工作经历 ${index+1} 时出错:`, e);
            }
        });
        
        // 添加分隔线
        const divider = document.createElement('div');
        divider.className = 'divider';
        container.appendChild(divider);
        
        // 重新添加子标题和项目轮播
        if (subsectionTitle) container.appendChild(subsectionTitle);
        if (projectsCarousel) container.appendChild(projectsCarousel);
        
        console.log('重新绑定工作经历展开/折叠事件');
        
        // 重新绑定展开/折叠事件
        document.querySelectorAll('.experience-header, .experience-logo').forEach(header => {
            header.addEventListener('click', function() {
                const detailsId = this.getAttribute('data-controls');
                if (detailsId) {
                    toggleDetails(detailsId);
                }
            });
        });
        
        // 展开/折叠功能
        function toggleDetails(detailsId) {
            const wrapper = document.getElementById(detailsId + '-wrapper');
            if (!wrapper) {
                console.error('找不到工作经历详情容器:', detailsId + '-wrapper');
                return;
            }
            
            const button = document.querySelector(`[aria-controls="${detailsId}"]`);
            if (!button) {
                console.error('找不到控制按钮:', `[aria-controls="${detailsId}"]`);
                return;
            }
            
            const isExpanded = button.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                wrapper.style.maxHeight = '0';
                wrapper.style.opacity = '0';
                button.setAttribute('aria-expanded', 'false');
                button.querySelector('i').style.transform = 'rotate(0deg)';
            } else {
                const details = document.getElementById(detailsId);
                if (details) {
                    wrapper.style.maxHeight = details.scrollHeight + 'px';
                    wrapper.style.opacity = '1';
                    button.setAttribute('aria-expanded', 'true');
                    button.querySelector('i').style.transform = 'rotate(180deg)';
                }
            }
        }
        
        console.log('工作经历前端更新完成');
    } catch (error) {
        console.error('更新工作经历前端失败:', error);
    }
}

// 更新项目展示前端
function updateProjectsFrontend() {
    const projects = websiteData.projects || [];
    const container = document.querySelector('.projects-wrapper');
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 重新添加所有项目
    projects.forEach((project, index) => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        
        projectItem.innerHTML = `
            <a href="${project.link}" target="_blank" class="project-link">
                <div class="project-image-container">
                    <img src="${project.imagePath}" alt="${project.title}" class="project-image">
                </div>
                <div class="project-info">
                    <h3>${project.title}</h3>
                    <p class="view-project">View In Behance</p>
                </div>
            </a>
        `;
        
        container.appendChild(projectItem);
    });
    
    // 更新轮播控件
    updateCarouselDots();
    
    // 重新初始化项目轮播功能
    if (typeof initProjectsCarousel === 'function') {
        setTimeout(initProjectsCarousel, 100);
    }
}

// 更新轮播点
function updateCarouselDots() {
    const projects = websiteData.projects || [];
    const dotsContainer = document.querySelector('.carousel-dots');
    if (!dotsContainer) return;
    
    // 清空现有内容
    dotsContainer.innerHTML = '';
    
    // 重新添加轮播点
    projects.forEach((project, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot' + (index === 0 ? ' active' : '');
        dot.setAttribute('data-index', index);
        dotsContainer.appendChild(dot);
        
        // 添加点击事件
        dot.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            if (typeof goToProject === 'function') {
                goToProject(index);
            }
        });
    });
}

// 更新论文与专利前端
function updatePapersFrontend() {
    const papers = websiteData.papers || [];
    const container = document.querySelector('#papers .timeline');
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 重新添加所有论文与专利
    papers.forEach(paper => {
        const paperItem = document.createElement('div');
        paperItem.className = 'timeline-item';
        
        paperItem.innerHTML = `
            <div class="timeline-date">${paper.time}</div>
            <div class="timeline-content">
                <h3>${paper.link ? `<a href="${paper.link}" class="paper-link" target="_blank">${paper.title}</a>` : paper.title}</h3>
                <p>${paper.authors}</p>
            </div>
        `;
        
        container.appendChild(paperItem);
    });
}

// 更新奖项荣誉前端
function updateAwardsFrontend() {
    const awards = websiteData.awards || [];
    const container = document.querySelector('#awards .timeline');
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 重新添加所有奖项荣誉
    awards.forEach(award => {
        const awardItem = document.createElement('div');
        awardItem.className = 'timeline-item';
        
        awardItem.innerHTML = `
            <div class="timeline-date">${award.time}</div>
            <div class="timeline-content">
                <h3>${award.title}</h3>
                ${award.details ? `<p>${award.details}</p>` : ''}
            </div>
        `;
        
        container.appendChild(awardItem);
    });
}

// 更新足迹前端
function updateFootprintsFrontend() {
    const footprints = websiteData.footprints || [];
    
    // 准备足迹数据
    const footprintData = footprints.map(footprint => {
        return {
            name: `${footprint.city}${footprint.country ? ', ' + footprint.country : ''}`,
            location: [parseFloat(footprint.lng), parseFloat(footprint.lat)],
            intensity: footprint.intensity || 5,
            image: footprint.image || 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(footprint.city)
        };
    });
    
    // 尝试更新地图
    try {
        // 检查地图是否已初始化
        const worldMap = document.querySelector('#world-map svg');
        if (!worldMap) {
            // 如果地图还没初始化，将数据保存到window对象，等待地图初始化
            window.customFootprints = footprintData;
            return;
        }
        
        // 从地图中移除现有足迹点
        d3.selectAll('.footprint').remove();
        
        // 获取所需的变量
        const g = d3.select('#world-map svg g');
        const projection = d3.geoMercator()
            .scale(worldMap.clientWidth / 2 / Math.PI)
            .translate([worldMap.clientWidth / 2, worldMap.clientHeight / 1.5]);
        
        // CSS变量
        const footprintColor = getComputedStyle(document.documentElement).getPropertyValue('--footprint-color').trim();
        
        // 添加新的足迹点
        const footprintPoints = g.selectAll('.footprint')
            .data(footprintData)
            .enter()
            .append('circle')
            .attr('cx', d => projection(d.location)[0])
            .attr('cy', d => projection(d.location)[1])
            .attr('r', d => Math.sqrt(d.intensity) * 2)
            .attr('fill', footprintColor)
            .attr('fill-opacity', 0.8)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5)
            .attr('class', 'footprint');
            
        // 添加律动动画效果
        footprintPoints.each(function(d, i) {
            const delay = i % 5 * 300;
            
            d3.select(this)
                .style('transform-origin', 'center center')
                .style('transform-box', 'fill-box')
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
        });
        
        // 为足迹点添加交互事件
        const tooltip = d3.select('.location-thumbnail');
        
        footprintPoints
            .on('mouseover', function(event, d) {
                // 鼠标悬停时放大圆点
                d3.select(this)
                    .interrupt()
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
                thisPoint.interrupt();
                
                // 计算当前点在数组中的索引
                const index = footprintData.findIndex(fp => fp.name === d.name);
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
            });
    } catch (error) {
        console.error('更新足迹地图失败:', error);
    }
}

// 更新社交媒体前端
function updateSocialFrontend() {
    const socials = websiteData.social || [];
    const container = document.querySelector('#social .social-icons');
    if (!container) return;
    
    // 清空现有内容
    container.innerHTML = '';
    
    // 重新添加所有社交媒体
    socials.forEach(social => {
        const socialItem = document.createElement('a');
        socialItem.href = social.link;
        socialItem.target = '_blank';
        socialItem.className = 'social-icon';
        socialItem.setAttribute('aria-label', social.name);
        
        // 根据类型使用不同的图标
        if (social.type === 'custom' && social.iconPath) {
            socialItem.innerHTML = `<img src="${social.iconPath}" alt="${social.name}" class="custom-icon">`;
        } else {
            const iconClass = getSocialIconClass(social.type);
            socialItem.innerHTML = `<i class="${iconClass}"></i>`;
        }
        
        container.appendChild(socialItem);
    });
}

// 获取社交媒体图标类
function getSocialIconClass(type) {
    const iconMap = {
        'instagram': 'fab fa-instagram',
        'behance': 'fab fa-behance',
        'github': 'fab fa-github',
        'pinterest': 'fab fa-pinterest',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'rednote': 'fas fa-bookmark', // 小红书没有官方图标
        'netease': 'fas fa-music', // 网易云音乐没有官方图标
        'custom': 'fas fa-link'
    };
    
    return iconMap[type] || 'fas fa-link';
}

// 修改world-map的initWorldMap函数，支持自定义足迹数据
window.addEventListener('load', function() {
    // 重写initWorldMap函数，接受自定义足迹数据
    const originalInitWorldMap = window.initWorldMap;
    
    if (typeof originalInitWorldMap === 'function') {
        window.initWorldMap = function() {
            // 使用window.customFootprints（如果存在）
            if (window.customFootprints && Array.isArray(window.customFootprints)) {
                // 修改footprints数组定义的那一行
                const scriptText = originalInitWorldMap.toString();
                const customizedFunction = scriptText.replace(
                    /const\s+footprints\s*=\s*\[[\s\S]*?\];/,
                    `const footprints = window.customFootprints;`
                );
                
                // 执行修改后的函数
                try {
                    eval(`(${customizedFunction})()`);
                    return;
                } catch (e) {
                    console.error('执行自定义地图初始化失败:', e);
                }
            }
            
            // 如果没有自定义数据或执行失败，回退到原始函数
            originalInitWorldMap();
        };
    }
});

// 在脚本加载后执行一次前端更新，以应用后台已有的数据
setTimeout(function() {
    if (typeof websiteData !== 'undefined') {
        updateFrontend();
    }
}, 2000); 