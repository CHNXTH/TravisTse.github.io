/**
 * admin-sync-check.js
 * 用于检查数据同步状态的辅助脚本
 * 可以在浏览器控制台中加载使用
 */

// 检查数据同步状态
function checkSyncStatus() {
    console.group('数据同步状态检查');
    
    // 检查localStorage中的数据
    let websiteDataObj = null;
    try {
        const websiteDataStr = localStorage.getItem('websiteData');
        if (websiteDataStr) {
            websiteDataObj = JSON.parse(websiteDataStr);
            console.log('✅ localStorage中存在websiteData');
            console.log('数据结构:', Object.keys(websiteDataObj));
            
            // 检查各部分数据
            console.group('数据详情');
            
            // 个人资料
            if (websiteDataObj.profile) {
                console.log(`✅ 个人资料: 姓名=${websiteDataObj.profile.nameEn}, 邮箱=${websiteDataObj.profile.email}`);
            } else {
                console.log('❌ 缺少个人资料数据');
            }
            
            // 教育经历
            if (websiteDataObj.education && websiteDataObj.education.length) {
                console.log(`✅ 教育经历: ${websiteDataObj.education.length}条记录`);
            } else {
                console.log('❌ 缺少教育经历数据');
            }
            
            // 工作经历
            if (websiteDataObj.experience && websiteDataObj.experience.length) {
                console.log(`✅ 工作经历: ${websiteDataObj.experience.length}条记录`);
            } else {
                console.log('❌ 缺少工作经历数据');
            }
            
            // 项目展示
            if (websiteDataObj.projects && websiteDataObj.projects.length) {
                console.log(`✅ 项目展示: ${websiteDataObj.projects.length}条记录`);
            } else {
                console.log('❌ 缺少项目展示数据');
            }
            
            // 论文与专利
            if (websiteDataObj.papers && websiteDataObj.papers.length) {
                console.log(`✅ 论文与专利: ${websiteDataObj.papers.length}条记录`);
            } else {
                console.log('❌ 缺少论文与专利数据');
            }
            
            // 奖项荣誉
            if (websiteDataObj.awards && websiteDataObj.awards.length) {
                console.log(`✅ 奖项荣誉: ${websiteDataObj.awards.length}条记录`);
            } else {
                console.log('❌ 缺少奖项荣誉数据');
            }
            
            // 足迹
            if (websiteDataObj.footprints && websiteDataObj.footprints.length) {
                console.log(`✅ 足迹: ${websiteDataObj.footprints.length}条记录`);
            } else {
                console.log('❌ 缺少足迹数据');
            }
            
            // 社交媒体
            if (websiteDataObj.social && websiteDataObj.social.length) {
                console.log(`✅ 社交媒体: ${websiteDataObj.social.length}条记录`);
            } else {
                console.log('❌ 缺少社交媒体数据');
            }
            
            console.groupEnd();
        } else {
            console.log('❌ localStorage中不存在websiteData');
        }
    } catch (e) {
        console.error('解析websiteData失败:', e);
    }
    
    // 检查前端元素数量
    console.group('前端元素检查');
    
    // 教育经历
    const educationItems = document.querySelectorAll('#education .education-item');
    console.log(`教育经历: 前端${educationItems.length}条, 数据${(websiteDataObj?.education || []).length}条`);
    
    // 工作经历
    const experienceItems = document.querySelectorAll('#experience .experience-item');
    console.log(`工作经历: 前端${experienceItems.length}条, 数据${(websiteDataObj?.experience || []).length}条`);
    
    // 项目展示
    const projectItems = document.querySelectorAll('.project-item');
    console.log(`项目展示: 前端${projectItems.length}条, 数据${(websiteDataObj?.projects || []).length}条`);
    
    // 论文与专利
    const paperItems = document.querySelectorAll('#papers .timeline-item');
    console.log(`论文与专利: 前端${paperItems.length}条, 数据${(websiteDataObj?.papers || []).length}条`);
    
    // 奖项荣誉
    const awardItems = document.querySelectorAll('#awards .timeline-item');
    console.log(`奖项荣誉: 前端${awardItems.length}条, 数据${(websiteDataObj?.awards || []).length}条`);
    
    // 足迹
    const footprintItems = document.querySelectorAll('.footprint');
    console.log(`足迹: 前端${footprintItems.length}条, 数据${(websiteDataObj?.footprints || []).length}条`);
    
    // 社交媒体
    const socialItems = document.querySelectorAll('#social .social-icon');
    console.log(`社交媒体: 前端${socialItems.length}条, 数据${(websiteDataObj?.social || []).length}条`);
    
    console.groupEnd();
    
    // 同步状态检查
    console.group('同步功能检查');
    
    if (typeof window.frontendDataExtracted !== 'undefined') {
        console.log(`✅ 前端数据提取标志: ${window.frontendDataExtracted}`);
    } else {
        console.log('❌ 缺少前端数据提取标志');
    }
    
    if (typeof updateFrontend === 'function') {
        console.log('✅ updateFrontend函数已定义');
    } else {
        console.log('❌ updateFrontend函数未定义');
    }
    
    if (typeof saveWebsiteData === 'function') {
        console.log('✅ saveWebsiteData函数已定义');
    } else {
        console.log('❌ saveWebsiteData函数未定义');
    }
    
    console.groupEnd();
    
    console.groupEnd();
    
    return {
        hasLocalStorage: !!websiteDataObj,
        dataStructure: websiteDataObj ? Object.keys(websiteDataObj) : [],
        frontendCounts: {
            education: educationItems.length,
            experience: experienceItems.length,
            projects: projectItems.length,
            papers: paperItems.length,
            awards: awardItems.length,
            footprints: footprintItems.length,
            social: socialItems.length
        },
        dataCounts: {
            education: (websiteDataObj?.education || []).length,
            experience: (websiteDataObj?.experience || []).length,
            projects: (websiteDataObj?.projects || []).length,
            papers: (websiteDataObj?.papers || []).length,
            awards: (websiteDataObj?.awards || []).length,
            footprints: (websiteDataObj?.footprints || []).length,
            social: (websiteDataObj?.social || []).length
        }
    };
}

// 执行手动同步
function forceSync() {
    console.group('执行手动同步');
    
    if (typeof extractFrontendData === 'function') {
        console.log('执行前端数据提取...');
        extractFrontendData();
    } else {
        console.error('找不到extractFrontendData函数');
    }
    
    if (typeof updateFrontend === 'function') {
        console.log('执行前端更新...');
        updateFrontend();
    } else {
        console.error('找不到updateFrontend函数');
    }
    
    console.log('手动同步完成');
    console.groupEnd();
}

// 清除同步数据
function clearSyncData() {
    if (confirm('确定要清除所有同步数据吗？这将删除您在后台管理中的所有更改。')) {
        localStorage.removeItem('websiteData');
        console.log('同步数据已清除');
        
        if (confirm('是否要刷新页面？')) {
            location.reload();
        }
    }
}

// 添加示例工作经历数据
function addSampleExperiences() {
    console.group('添加示例工作经历数据');
    
    try {
        // 获取当前数据
        let websiteData = {};
        try {
            const storedData = localStorage.getItem('websiteData');
            if (storedData) {
                websiteData = JSON.parse(storedData);
            }
        } catch (e) {
            console.error('解析localStorage数据失败:', e);
        }
        
        // 确保experience数组存在
        websiteData.experience = websiteData.experience || [];
        
        // 示例数据
        const sampleExperiences = [
            {
                id: 'ikea-' + Date.now().toString(36),
                company: 'IKEA China - Digital Innovation Center (IKEA Digital Hub)',
                meta: 'Shanghai | Global Product Collage (GPC) Team | Product Manager, Interaction Designer',
                time: '2024.07 - 2024.12',
                details: 'Used Agile tools like Jira to organize requirements documentation, daily operations, UI design reviews\nLed the deployment of PPT templates for 20 countries\nLed the launch of the indoor panorama module\nAI design tool prototype\nCollaborated to complete IKEA offline store AR shopping prototype design',
                logoPath: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg'
            },
            {
                id: 'smartsite-' + Date.now().toString(36),
                company: 'Smart Site360 Mini Program',
                meta: 'Project Lead, Product Manager, UX Designer',
                time: '2024.05 - 2025.05',
                details: 'Conducted user research in multiple architectural colleges\nDesigned a mini program that integrates text, audio, image, and video collection functions\nThe analysis process leverages large language models, LDA topic modeling, and computer vision technology',
                logoPath: 'https://img.icons8.com/color/240/000000/geography--v1.png'
            },
            {
                id: 'matconstruct-' + Date.now().toString(36),
                company: 'Matconstruct Mini Program',
                meta: 'Project Lead, Product Manager, UX Designer',
                time: '2023.05 - 2023.09',
                details: 'Conducted in-depth semi-structured interviews with architecture students\nGenerated user personas based on user needs\nOptimized the interface design of material detail pages through A/B testing',
                logoPath: 'assets/images/matconstruct.png'
            },
            {
                id: 'google-' + Date.now().toString(36),
                company: 'Google China Developer Conference',
                meta: 'Shanghai | Gemini AI',
                time: '2025.04',
                details: 'Conducted in-depth semi-structured interviews with architecture students',
                logoPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png'
            }
        ];
        
        // 添加示例数据（避免重复添加）
        let added = 0;
        sampleExperiences.forEach(sample => {
            // 检查是否已存在相同公司名称的记录
            const exists = websiteData.experience.some(exp => 
                exp.company.toLowerCase().includes(sample.company.toLowerCase().split(' ')[0])
            );
            
            if (!exists) {
                websiteData.experience.push(sample);
                added++;
                console.log(`✅ 已添加: ${sample.company}`);
            } else {
                console.log(`⏭️ 已跳过: ${sample.company} (已存在)`);
            }
        });
        
        // 保存回localStorage
        localStorage.setItem('websiteData', JSON.stringify(websiteData));
        
        console.log(`添加完成。新增: ${added}, 总计: ${websiteData.experience.length}`);
        
        // 提示刷新
        if (added > 0) {
            alert(`已添加${added}条示例工作经历。请刷新页面生效！`);
        } else {
            alert('没有新增工作经历，所有示例已存在。');
        }
    } catch (error) {
        console.error('添加示例工作经历失败:', error);
        alert('添加示例数据失败，请查看控制台获取详细错误信息。');
    }
    
    console.groupEnd();
}

// 显示帮助信息
function showSyncHelp() {
    console.group('数据同步帮助');
    console.log('可用命令:');
    console.log('checkSyncStatus() - 检查数据同步状态');
    console.log('forceSync() - 强制执行数据同步');
    console.log('clearSyncData() - 清除所有同步数据');
    console.log('addSampleExperiences() - 添加示例工作经历数据');
    console.log('showSyncHelp() - 显示此帮助信息');
    console.groupEnd();
}

// 显示帮助信息
showSyncHelp();

// 自动执行检查
setTimeout(checkSyncStatus, 1000);

// 将函数暴露给全局作用域
window.checkSyncStatus = checkSyncStatus;
window.forceSync = forceSync;
window.clearSyncData = clearSyncData;
window.showSyncHelp = showSyncHelp;
window.addSampleExperiences = addSampleExperiences; 