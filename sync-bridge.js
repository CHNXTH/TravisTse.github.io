/**
 * sync-bridge.js
 * 负责在index.html和admin.html之间同步数据
 * 使用localStorage和sessionStorage作为传输介质
 */

// 同步标志
const SYNC_FLAG_KEY = 'websiteDataSyncFlag';

// 页面加载时检查同步标志
document.addEventListener('DOMContentLoaded', function() {
    console.log('同步桥接初始化...');
    initSyncBridge();
});

// 初始化同步桥接
function initSyncBridge() {
    // 注册存储事件监听器
    window.addEventListener('storage', function(event) {
        // 检查是否是websiteData或同步标志的变化
        if (event.key === 'websiteData' || event.key === 'websiteDataSync') {
            console.log(`检测到${event.key}变更，准备更新页面...`);
            
            // 当localStorage中的websiteData被更改时
            try {
                if (typeof updateFrontend === 'function') {
                    console.log('调用updateFrontend来更新页面...');
                    updateFrontend();
                } else if (window.location.pathname.includes('admin')) {
                    console.log('在admin页面检测到数据更改，刷新数据...');
                    // 重新加载网站数据
                    loadWebsiteData();
                    
                    // 重新加载各个模块
                    if (typeof loadExperienceItems === 'function') {
                        loadExperienceItems();
                    }
                    if (typeof loadEducationItems === 'function') {
                        loadEducationItems();
                    }
                    if (typeof loadProjectItems === 'function') {
                        loadProjectItems();
                    }
                    if (typeof loadPaperItems === 'function') {
                        loadPaperItems();
                    }
                    if (typeof loadAwardItems === 'function') {
                        loadAwardItems();
                    }
                    if (typeof loadSocialItems === 'function') {
                        loadSocialItems();
                    }
                    if (typeof loadFootprintItems === 'function') {
                        loadFootprintItems();
                    }
                }
            } catch (e) {
                console.error('同步更新失败:', e);
            }
        }
    });
    
    // 每5秒检查一次同步状态
    setInterval(checkSyncState, 5000);
    
    // 立即执行一次检查
    checkSyncState();
    
    console.log('同步桥接初始化完成');
}

// 检查同步状态
function checkSyncState() {
    try {
        const currentPath = window.location.pathname;
        const isAdminPage = currentPath.includes('admin');
        
        if (isAdminPage) {
            // 在管理页面，检查localStorage数据是否存在
            if (!localStorage.getItem('websiteData')) {
                console.warn('管理页面中未找到websiteData，将添加测试数据');
                if (typeof addSampleExperiences === 'function') {
                    addSampleExperiences();
                }
            }
        } else {
            // 在index页面，确保数据提取完成
            if (!window.frontendDataExtracted) {
                console.log('前端数据未提取，尝试重新提取...');
                if (typeof extractFrontendData === 'function') {
                    extractFrontendData();
                }
            }
        }
    } catch (e) {
        console.error('检查同步状态失败:', e);
    }
}

// 强制保存前端数据并触发同步
function forceSaveAndSync() {
    try {
        console.group('强制保存并同步');
        
        // 在前端页面，提取数据并保存
        if (!window.location.pathname.includes('admin')) {
            console.log('在前端页面，提取数据并保存');
            
            if (typeof extractFrontendData === 'function') {
                extractFrontendData();
                console.log('前端数据提取完成');
            } else {
                console.error('找不到extractFrontendData函数');
            }
        }
        // 在管理页面，保存当前数据
        else {
            console.log('在管理页面，保存当前数据');
            
            if (typeof saveWebsiteData === 'function') {
                saveWebsiteData();
                console.log('数据保存完成');
            } else {
                console.error('找不到saveWebsiteData函数');
            }
        }
        
        // 设置同步标志触发storage事件
        const timestamp = new Date().getTime();
        localStorage.setItem(SYNC_FLAG_KEY, timestamp.toString());
        console.log('同步标志已设置:', timestamp);
        
        console.groupEnd();
        return true;
    } catch (e) {
        console.error('强制保存并同步失败:', e);
        return false;
    }
}

// 导出函数到全局
window.initSyncBridge = initSyncBridge;
window.forceSaveAndSync = forceSaveAndSync;
window.checkSyncState = checkSyncState; 