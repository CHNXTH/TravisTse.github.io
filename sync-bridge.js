/**
 * sync-bridge.js
 * 负责在index.html和admin.html之间同步数据
 * 使用localStorage和sessionStorage作为传输介质
 */

// 同步标志
const SYNC_FLAG_KEY = 'websiteDataSyncFlag';

// 全局变量，用于存储同步状态
let syncState = {
    lastSync: null,
    syncCount: 0,
    pendingRetry: null,
    syncSource: null,
    syncErrors: 0
};

// 页面加载时检查同步标志并强制刷新数据
document.addEventListener('DOMContentLoaded', function() {
    console.log('同步桥接初始化...');
    initSyncBridge();
    
    // 强制从localStorage读取并应用最新数据 - 确保页面刷新时不丢失修改
    setTimeout(function() {
        try {
            // 先从localStorage读取数据
            const savedData = localStorage.getItem('websiteData');
            if (savedData && typeof updateFrontend === 'function') {
                console.log('页面加载完成，从localStorage强制更新数据...');
                updateFrontend();
            }
        } catch (e) {
            console.error('DOMContentLoaded时强制更新失败:', e);
        }
    }, 300);
});

// 初始化同步桥接
function initSyncBridge() {
    console.log('初始化同步桥接...');
    
    // 记录当前页面类型
    const isAdmin = window.location.pathname.includes('admin');
    syncState.syncSource = isAdmin ? 'admin' : 'frontend';
    
    // 注册存储事件监听器
    window.addEventListener('storage', function(event) {
        // 获取当前时间戳（用于记录）
        const now = new Date();
        
        // 检查是否是websiteData或同步标志的变化
        if (event.key === 'websiteData' || event.key === 'websiteDataSync') {
            console.log(`[${now.toLocaleTimeString()}] 检测到${event.key}变更，准备更新页面...`);
            
            // 获取事件来源以避免循环更新
            const syncSource = localStorage.getItem('websiteDataSyncSource');
            if (syncSource && syncSource.includes(syncState.syncSource)) {
                console.log('忽略自身触发的更新事件');
                return;
            }
            
            // 更新同步状态
            syncState.lastSync = now;
            syncState.syncCount++;
            
            try {
                // 在前端页面执行更新
                if (typeof updateFrontend === 'function') {
                    console.log('调用updateFrontend来更新页面...');
                    try {
                        // 添加延迟确保数据已完全写入localStorage
                        setTimeout(function() {
                            updateFrontend();
                            // 清除任何待处理的重试
                            if (syncState.pendingRetry) {
                                clearTimeout(syncState.pendingRetry);
                                syncState.pendingRetry = null;
                            }
                        }, 200);
                    } catch (e) {
                        console.error('更新前端失败:', e);
                        syncState.syncErrors++;
                        
                        // 设置重试
                        if (!syncState.pendingRetry) {
                            console.log('5秒后将重试更新...');
                            syncState.pendingRetry = setTimeout(function() {
                                console.log('执行重试更新...');
                                try {
                                    updateFrontend();
                                    syncState.pendingRetry = null;
                                } catch (retryError) {
                                    console.error('重试更新失败:', retryError);
                                    syncState.syncErrors++;
                                }
                            }, 5000);
                        }
                    }
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
            } catch (err) {
                console.error('处理同步事件时出错:', err);
                syncState.syncErrors++;
                
                // 记录错误并在控制台中可视化显示
                console.group('同步错误详情');
                console.error('时间:', now.toLocaleTimeString());
                console.error('事件:', event.key);
                console.error('错误:', err.message);
                console.error('总错误数:', syncState.syncErrors);
                console.groupEnd();
            }
        }
    });
    
    // 添加页面可见性变化监听器（当用户从其他标签切回时触发同步）
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            console.log('页面变为可见，检查数据更新...');
            try {
                // 页面变为可见时，始终检查最新数据并强制更新
                if (typeof updateFrontend === 'function') {
                    console.log('页面变为可见，强制执行更新...');
                    updateFrontend();
                } else if (typeof checkForUpdates === 'function') {
                    checkForUpdates();
                }
            } catch (e) {
                console.error('可见性变化时更新失败:', e);
            }
        }
    });
    
    // 注册beforeunload事件，确保在页面关闭前数据已保存
    window.addEventListener('beforeunload', function() {
        if (window.location.pathname.includes('admin') && window.websiteDataUpdated) {
            try {
                console.log('页面即将关闭，确保数据已保存...');
                saveWebsiteData(); // 确保在admin页面关闭前保存数据
            } catch (e) {
                console.error('页面关闭前保存数据失败:', e);
            }
        }
    });
    
    console.log('同步桥接初始化完成');
}

// 检查更新
function checkForUpdates() {
    try {
        console.log('检查数据更新...');
        
        // 获取当前localStorage中的数据
        const currentData = localStorage.getItem('websiteData');
        if (!currentData) {
            console.log('localStorage中没有数据，跳过更新检查');
            return;
        }
        
        // 比较数据哈希
        try {
            const data = JSON.parse(currentData);
            if (data.meta && data.meta.lastModified) {
                console.log('数据最后修改时间:', new Date(data.meta.lastModified).toLocaleString());
            }
        } catch (e) {
            console.error('解析数据时出错:', e);
        }
        
        // 执行更新
        if (typeof updateFrontend === 'function') {
            updateFrontend();
        }
    } catch (e) {
        console.error('检查更新失败:', e);
    }
}

// 获取同步状态 (用于监控)
function getSyncStatus() {
    return {
        ...syncState,
        lastSyncTime: syncState.lastSync ? syncState.lastSync.toLocaleString() : 'Never',
        dataSize: getDataSize()
    };
}

// 获取数据大小
function getDataSize() {
    try {
        const data = localStorage.getItem('websiteData');
        if (data) {
            const bytes = new Blob([data]).size;
            if (bytes < 1024) return bytes + ' bytes';
            else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
            else return (bytes / 1048576).toFixed(2) + ' MB';
        }
        return '0 bytes';
    } catch (e) {
        console.error('获取数据大小失败:', e);
        return 'Unknown';
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
        localStorage.setItem('websiteDataSync', timestamp.toString());
        localStorage.setItem('websiteDataSyncSource', 'manual_sync_' + Math.random().toString(36).substring(2));
        console.log('同步标志已设置:', timestamp);
        
        console.groupEnd();
        return true;
    } catch (e) {
        console.error('强制保存并同步失败:', e);
        return false;
    }
}

// 检查同步状态函数 - 用于调试
function checkSyncState() {
    const state = {
        ...getSyncStatus(),
        currentPage: window.location.pathname,
        dataExists: !!localStorage.getItem('websiteData'),
        websiteDataUpdated: window.websiteDataUpdated || false,
        frontendDataExtracted: window.frontendDataExtracted || false
    };
    
    console.group('同步状态检查');
    console.log('当前页面:', state.currentPage);
    console.log('最后同步时间:', state.lastSyncTime);
    console.log('同步次数:', state.syncCount);
    console.log('同步错误:', state.syncErrors);
    console.log('数据大小:', state.dataSize);
    console.log('数据是否存在:', state.dataExists);
    console.log('数据是否已更新:', state.websiteDataUpdated);
    console.log('前端数据是否已提取:', state.frontendDataExtracted);
    console.groupEnd();
    
    return state;
}

// 导出函数到全局
window.initSyncBridge = initSyncBridge;
window.forceSaveAndSync = forceSaveAndSync;
window.checkSyncState = checkSyncState;

// 导出同步状态检查函数 (全局可访问)
window.checkSyncStatus = function() {
    const status = getSyncStatus();
    
    console.group('同步状态检查');
    console.log('最后同步时间:', status.lastSyncTime);
    console.log('同步次数:', status.syncCount);
    console.log('同步错误:', status.syncErrors);
    console.log('数据大小:', status.dataSize);
    console.log('当前页面:', status.syncSource);
    console.groupEnd();
    
    return status;
};

// 将更新前端函数暴露给全局
window.forceSyncUpdate = function() {
    if (typeof updateFrontend === 'function') {
        console.log('强制执行前端更新...');
        updateFrontend();
        return true;
    } else {
        console.error('updateFrontend函数不可用，无法执行更新');
        return false;
    }
}; 