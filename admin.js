// 后台管理系统JavaScript - 第一部分：基础功能和登录验证

// 全局变量
const DEFAULT_PASSWORD = '725500@20020303'; // 初始密码
let websiteData = {}; // 网站数据对象

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 从localStorage加载网站数据
    loadWebsiteData();
    
    // 初始化登录功能
    initLoginSystem();
    
    // 初始化导航系统
    initNavigationSystem();
    
    // 初始化各个模块
    initProfileSection();
    initEducationSection();
    initExperienceSection();
    initProjectsSection();
    initPapersSection();
    initAwardsSection();
    initSocialSection();
    initFootprintsSection();
    initSettingsSection();
    
    // 检查是否已登录
    checkLoginStatus();
    
    // 初始化数据监控面板
    initDataMonitorPanel();
});

// 加载网站数据
function loadWebsiteData() {
    try {
        const savedData = localStorage.getItem('websiteData');
        if (savedData) {
            websiteData = JSON.parse(savedData);
        } else {
            // 初始化默认数据
            initDefaultData();
        }
    } catch (error) {
        console.error('加载数据时出错:', error);
        initDefaultData();
    }
}

// 初始化默认数据
function initDefaultData() {
    // 首先检查是否已存在网站数据
    console.log('检查现有网站数据...');
    try {
        const existingData = localStorage.getItem('websiteData');
        if (existingData) {
            // 如果已有数据，则解析它
            console.log('发现现有数据，正在加载...');
            const parsedData = JSON.parse(existingData);
            
            // 确保所有必要的字段都存在（只补充缺失字段，不覆盖现有数据）
            websiteData = parsedData;
            
            // 确保数据完整性
            websiteData.profile = websiteData.profile || {};
            websiteData.education = websiteData.education || [];
            websiteData.experience = websiteData.experience || [];
            websiteData.projects = websiteData.projects || [];
            websiteData.papers = websiteData.papers || [];
            websiteData.awards = websiteData.awards || [];
            websiteData.social = websiteData.social || [];
            websiteData.footprints = websiteData.footprints || [];
            websiteData.settings = websiteData.settings || { password: DEFAULT_PASSWORD };
            
            // 添加数据版本信息（用于将来可能的数据迁移）
            if (!websiteData.meta) {
                websiteData.meta = {
                    version: '1.0',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
            }
            
            console.log('数据加载完成，发现工作经历数量:', websiteData.experience.length);
            
            // 保存回localStorage以确保结构完整
            saveWebsiteData();
            return;
        }
    } catch (error) {
        console.error('检查现有数据失败:', error);
    }
    
    console.log('未发现现有数据，创建默认数据...');
    
    // 如果没有现有数据或解析失败，则创建默认数据
    websiteData = {
        profile: {
            nameEn: 'Travis Tse',
            nameZh: '谢堂华',
            age: '23',
            phone: '15698010160',
            email: 'chnxth@gmail.com',
            location: 'Shanghai',
            avatar: 'assets/images/avatar.jpg'
        },
        education: [],
        experience: [],
        projects: [],
        papers: [],
        awards: [],
        social: [],
        footprints: [],
        settings: {
            password: DEFAULT_PASSWORD
        },
        meta: {
            version: '1.0',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        }
    };
    
    console.log('默认数据创建完成');
    
    // 保存到localStorage
    saveWebsiteData();
    
    // 同时创建一个备份
    createBackup();
}

// 保存网站数据
function saveWebsiteData() {
    try {
        console.log('正在保存网站数据到localStorage...');
        
        // 确保每个数据数组都存在
        websiteData.profile = websiteData.profile || {};
        websiteData.education = websiteData.education || [];
        websiteData.experience = websiteData.experience || [];
        websiteData.projects = websiteData.projects || [];
        websiteData.papers = websiteData.papers || [];
        websiteData.awards = websiteData.awards || [];
        websiteData.social = websiteData.social || [];
        websiteData.footprints = websiteData.footprints || [];
        websiteData.settings = websiteData.settings || { password: DEFAULT_PASSWORD };
        
        // 更新元数据
        if (!websiteData.meta) {
            websiteData.meta = {
                version: '1.0',
                created: new Date().toISOString()
            };
        }
        websiteData.meta.lastModified = new Date().toISOString();
        
        // 计算简单的数据哈希（用于验证数据完整性）
        websiteData.meta.dataHash = calculateDataHash(websiteData);
        
        // 转换为JSON字符串
        const dataStr = JSON.stringify(websiteData);
        
        // 检查数据大小
        const dataSize = new Blob([dataStr]).size;
        const maxSize = 5 * 1024 * 1024; // 5MB (localStorage理论上限)
        const warningSize = 4 * 1024 * 1024; // 4MB (警告阈值)
        
        if (dataSize > maxSize) {
            throw new Error(`数据大小 ${formatSize(dataSize)} 超过了localStorage限制 ${formatSize(maxSize)}`);
        }
        
        if (dataSize > warningSize) {
            showMessage(`警告：数据大小 ${formatSize(dataSize)} 接近localStorage限制 ${formatSize(maxSize)}，请导出备份`, 'warning');
        }
        
        // 保存到localStorage - 添加一个随机生成的标识符，确保写入生效并触发storage事件
        const syncId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('websiteData', dataStr);
        
        console.log('数据保存成功，大小:', formatSize(dataSize));
        
        // 在保存完数据后设置一个标志，表示数据已经更改
        window.websiteDataUpdated = true;
        
        // 自动创建每日备份（限制为最多7个备份）
        createBackup();
        
        // 使用更健壮的方式触发前端更新
        try {
            // 添加保存验证步骤 - 确保数据已经成功写入
            const verifyData = localStorage.getItem('websiteData');
            if (!verifyData) {
                console.error('数据保存验证失败：localStorage中找不到websiteData');
                showMessage('数据保存失败，请重试或检查浏览器存储空间', 'error');
                return false;
            }
            
            // 1. 直接调用updateFrontend函数（如果在同一页面）
            if (typeof updateFrontend === 'function') {
                console.log('直接调用updateFrontend更新前端...');
                updateFrontend();
            }
            
            // 2. 触发storage事件通知其他页面
            try {
                // 设置一个特殊的标记，触发storage事件
                localStorage.setItem('websiteDataSync', syncId);
                localStorage.setItem('websiteDataSyncSource', 'admin_save_' + syncId);
            } catch (e) {
                console.error('触发storage事件失败:', e);
            }
            
            // 3. 如果当前页面是admin.html，尝试通过iframe更新前端
            if (window.location.pathname.includes('admin')) {
                console.log('当前在admin页面，尝试通过iframe更新前端页面...');
                
                // 查找或创建用于前端更新的iframe
                let updateFrame = document.getElementById('update-frame');
                if (!updateFrame) {
                    updateFrame = document.createElement('iframe');
                    updateFrame.id = 'update-frame';
                    updateFrame.style.display = 'none';
                    updateFrame.onload = function() {
                        try {
                            const frameWindow = updateFrame.contentWindow;
                            if (frameWindow) {
                                console.log('iframe已加载，尝试更新前端...');
                                
                                // 首先确保iframe能访问localStorage
                                try {
                                    // 传递最新数据到iframe
                                    if (frameWindow.localStorage) {
                                        frameWindow.localStorage.setItem('websiteData', dataStr);
                                        frameWindow.localStorage.setItem('websiteDataSync', syncId);
                                        frameWindow.localStorage.setItem('websiteDataSyncSource', 'admin_iframe_' + syncId);
                                    }
                                } catch (storageError) {
                                    console.error('向iframe传递数据失败:', storageError);
                                }
                                
                                // 尝试直接调用iframe中的更新函数
                                if (frameWindow.updateFrontend) {
                                    console.log('通过iframe调用updateFrontend...');
                                    frameWindow.updateFrontend();
                                } else if (frameWindow.forceSyncUpdate) {
                                    console.log('通过iframe调用forceSyncUpdate...');
                                    frameWindow.forceSyncUpdate();
                                } else {
                                    console.log('无法在iframe中找到更新函数，尝试注入脚本');
                                    
                                    // 注入更新脚本
                                    try {
                                        const script = frameWindow.document.createElement('script');
                                        script.textContent = `
                                            if (typeof updateFrontend === 'function') {
                                                console.log('iframe注入脚本执行更新...');
                                                updateFrontend();
                                            }
                                        `;
                                        frameWindow.document.body.appendChild(script);
                                    } catch (injectError) {
                                        console.error('向iframe注入脚本失败:', injectError);
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('iframe更新尝试失败:', e);
                        }
                    };
                    document.body.appendChild(updateFrame);
                }
                
                // 设置iframe源为主页（使用相对路径并添加随机参数避免缓存）
                let basePath = './';
                if (window.location.pathname.includes('/admin.html')) {
                    basePath = window.location.pathname.replace('/admin.html', '/');
                }
                
                // 添加同步标识符作为URL参数，确保不使用缓存且传递最新数据
                updateFrame.src = `${basePath}index.html?sync=${syncId}&t=${Date.now()}`;
            }
            
            // 4. 显示保存成功消息
            showMessage('数据已保存并同步', 'success');
            
            return true;
        } catch (e) {
            console.error('尝试更新前端失败:', e);
            showMessage('数据已保存但同步失败: ' + e.message, 'warning');
            return false;
        }
    } catch (error) {
        console.error('保存数据时出错:', error);
        showMessage('数据保存失败，请检查浏览器存储空间: ' + error.message, 'error');
        return false;
    }
}

// 创建数据备份
function createBackup() {
    try {
        // 创建一个包含时间戳的备份键
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0]; // 如 "2024-05-02"
        const backupKey = `websiteData_backup_${dateStr}`;
        
        // 检查是否今天已经有备份
        let backupExists = false;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key === backupKey) {
                backupExists = true;
                break;
            }
        }
        
        // 如果今天还没有备份，创建一个
        if (!backupExists) {
            const dataStr = JSON.stringify(websiteData);
            localStorage.setItem(backupKey, dataStr);
            console.log(`创建了每日备份: ${backupKey}`);
            
            // 清理旧备份，只保留最近7天的
            cleanupOldBackups();
        }
    } catch (e) {
        console.error('创建备份失败:', e);
    }
}

// 清理旧备份
function cleanupOldBackups() {
    try {
        const backups = [];
        
        // 收集所有备份
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('websiteData_backup_')) {
                backups.push(key);
            }
        }
        
        // 按日期排序（最新的在前）
        backups.sort().reverse();
        
        // 只保留最近7个备份
        const maxBackups = 7;
        if (backups.length > maxBackups) {
            for (let i = maxBackups; i < backups.length; i++) {
                localStorage.removeItem(backups[i]);
                console.log(`删除了旧备份: ${backups[i]}`);
            }
        }
    } catch (e) {
        console.error('清理旧备份失败:', e);
    }
}

// 计算数据哈希（简单版本）
function calculateDataHash(data) {
    try {
        // 创建一个没有meta的数据副本
        const dataCopy = JSON.parse(JSON.stringify(data));
        delete dataCopy.meta;
        
        // 将数据转换为字符串并计算简单的哈希
        const str = JSON.stringify(dataCopy);
        
        // 简单的哈希函数
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        
        // 转换为十六进制
        return (hash >>> 0).toString(16);
    } catch (e) {
        console.error('计算数据哈希失败:', e);
        return Date.now().toString(16); // 回退方案
    }
}

// 格式化文件大小
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
}

// 从备份恢复数据
function restoreFromBackup(backupKey) {
    try {
        const backupData = localStorage.getItem(backupKey);
        if (!backupData) {
            showMessage(`找不到备份: ${backupKey}`, 'error');
            return false;
        }
        
        // 解析备份数据
        const parsedData = JSON.parse(backupData);
        
        // 创建当前数据的备份
        localStorage.setItem('websiteData_before_restore', JSON.stringify(websiteData));
        
        // 恢复数据
        websiteData = parsedData;
        
        // 更新元数据
        if (!websiteData.meta) websiteData.meta = {};
        websiteData.meta.restoredFrom = backupKey;
        websiteData.meta.restoredAt = new Date().toISOString();
        
        // 保存恢复的数据
        saveWebsiteData();
        
        showMessage(`已从备份 ${backupKey} 恢复数据`, 'success');
        return true;
    } catch (e) {
        console.error(`从备份恢复失败 ${backupKey}:`, e);
        showMessage(`恢复备份失败: ${e.message}`, 'error');
        return false;
    }
}

// 初始化登录系统
function initLoginSystem() {
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const passwordInput = document.getElementById('password');
    
    // 登录按钮点击事件
    loginBtn.addEventListener('click', function() {
        const password = passwordInput.value.trim();
        login(password);
    });
    
    // 密码输入框Enter键事件
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const password = passwordInput.value.trim();
            login(password);
        }
    });
    
    // 退出登录按钮点击事件
    logoutBtn.addEventListener('click', function() {
        logout();
    });
}

// 登录函数
function login(password) {
    const loginError = document.getElementById('login-error');
    const currentPassword = websiteData.settings?.password || DEFAULT_PASSWORD;
    
    if (password === currentPassword) {
        // 登录成功
        loginError.textContent = '';
        
        // 保存登录状态
        sessionStorage.setItem('adminLoggedIn', 'true');
        
        // 显示管理面板，隐藏登录页面
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        
        // 显示消息
        showMessage('登录成功', 'success');
    } else {
        // 登录失败
        loginError.textContent = '密码错误，请重试';
        
        // 清空密码输入框
        document.getElementById('password').value = '';
    }
}

// 退出登录函数
function logout() {
    // 清除登录状态
    sessionStorage.removeItem('adminLoggedIn');
    
    // 隐藏管理面板，显示登录页面
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-login').style.display = 'flex';
    
    // 清空密码输入框
    document.getElementById('password').value = '';
}

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (isLoggedIn) {
        // 已登录，显示管理面板
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
    } else {
        // 未登录，显示登录页面
        document.getElementById('admin-login').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }
}

// 初始化导航系统
function initNavigationSystem() {
    const menuItems = document.querySelectorAll('.admin-menu li');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 获取目标部分的ID
            const targetId = this.getAttribute('data-target');
            
            // 切换活动菜单项
            menuItems.forEach(menuItem => {
                menuItem.classList.remove('active');
            });
            this.classList.add('active');
            
            // 切换显示的部分
            const sections = document.querySelectorAll('.admin-section');
            sections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

// 显示提示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
        messageElement.classList.add('message-show');
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        messageElement.classList.remove('message-show');
        setTimeout(() => {
            messageElement.remove();
        }, 300);
    }, 3000);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '';
    return dateString;
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 转义HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 加载图片
function loadImage(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// 初始化个人资料部分
function initProfileSection() {
    // 将在第二部分代码中实现
}

// 初始化教育经历部分
function initEducationSection() {
    // 将在第二部分代码中实现
}

// 初始化工作经历部分
function initExperienceSection() {
    // 将在第二部分代码中实现
}

// 初始化项目部分
function initProjectsSection() {
    // 将在第二部分代码中实现
}

// 初始化论文部分
function initPapersSection() {
    // 将在第二部分代码中实现
}

// 初始化奖项部分
function initAwardsSection() {
    // 将在第二部分代码中实现
}

// 初始化社交媒体部分
function initSocialSection() {
    // 将在第二部分代码中实现
}

// 初始化足迹部分
function initFootprintsSection() {
    // 将在第三部分代码中实现
}

// 初始化设置部分
function initSettingsSection() {
    // 将在第二部分代码中实现
}

// 初始化数据监控面板
function initDataMonitorPanel() {
    const panel = document.getElementById('data-monitor-panel');
    const toggle = document.getElementById('data-monitor-toggle');
    const dataVersion = document.getElementById('data-version');
    const lastSyncTime = document.getElementById('last-sync-time');
    const storageUsage = document.getElementById('storage-usage');
    const syncStatus = document.getElementById('sync-status');
    const forceSync = document.getElementById('force-sync');
    const checkSyncStatus = document.getElementById('check-sync-status');
    const createBackup = document.getElementById('create-backup');
    
    if (!panel) return;
    
    // 折叠/展开面板
    toggle.addEventListener('click', function() {
        panel.classList.toggle('collapsed');
        toggle.textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
    });
    
    // 强制同步
    forceSync.addEventListener('click', function() {
        saveWebsiteData();
        updateMonitorPanel();
        showMessage('强制同步已执行', 'success');
    });
    
    // 检查同步状态
    checkSyncStatus.addEventListener('click', function() {
        updateMonitorPanel();
        showMessage('同步状态已更新', 'info');
    });
    
    // 创建备份
    createBackup.addEventListener('click', function() {
        try {
            // 创建一个带时间戳的备份键
            const now = new Date();
            const timestamp = now.toISOString().replace(/[^0-9]/g, '').slice(0, 14);
            const backupKey = `websiteData_backup_manual_${timestamp}`;
            
            // 保存当前数据
            localStorage.setItem(backupKey, JSON.stringify(websiteData));
            
            showMessage(`备份已创建: ${backupKey}`, 'success');
            updateMonitorPanel();
        } catch (e) {
            console.error('创建备份失败:', e);
            showMessage('创建备份失败: ' + e.message, 'error');
        }
    });
    
    // 定期更新面板
    updateMonitorPanel();
    setInterval(updateMonitorPanel, 30000); // 每30秒更新一次
    
    // 添加到页面初始化后的面板状态
    setTimeout(function() {
        panel.classList.remove('collapsed');
        updateMonitorPanel();
    }, 1000);
}

// 更新监控面板数据
function updateMonitorPanel() {
    const dataVersion = document.getElementById('data-version');
    const lastSyncTime = document.getElementById('last-sync-time');
    const storageUsage = document.getElementById('storage-usage');
    const syncStatus = document.getElementById('sync-status');
    
    if (!dataVersion) return;
    
    try {
        // 获取数据版本
        if (websiteData && websiteData.meta && websiteData.meta.version) {
            dataVersion.textContent = websiteData.meta.version;
        } else {
            dataVersion.textContent = '未知';
        }
        
        // 获取同步状态
        if (typeof window.checkSyncStatus === 'function') {
            const status = window.checkSyncStatus();
            lastSyncTime.textContent = status.lastSyncTime || '无';
            syncStatus.textContent = status.syncErrors > 0 ? `错误(${status.syncErrors})` : '正常';
            syncStatus.style.color = status.syncErrors > 0 ? 'red' : 'green';
        } else {
            lastSyncTime.textContent = new Date().toLocaleTimeString();
            syncStatus.textContent = '未知';
            syncStatus.style.color = 'orange';
        }
        
        // 计算存储使用量
        const dataStr = localStorage.getItem('websiteData');
        if (dataStr) {
            const bytes = new Blob([dataStr]).size;
            if (bytes < 1024) storageUsage.textContent = bytes + ' bytes';
            else if (bytes < 1048576) storageUsage.textContent = (bytes / 1024).toFixed(2) + ' KB';
            else storageUsage.textContent = (bytes / 1048576).toFixed(2) + ' MB';
            
            // 存储空间预警
            const maxSize = 5 * 1024 * 1024; // 5MB
            const usagePercent = (bytes / maxSize) * 100;
            if (usagePercent > 80) {
                storageUsage.style.color = 'red';
            } else if (usagePercent > 60) {
                storageUsage.style.color = 'orange';
            } else {
                storageUsage.style.color = 'green';
            }
        } else {
            storageUsage.textContent = '0 bytes';
        }
    } catch (e) {
        console.error('更新监控面板失败:', e);
    }
}

// 添加页面消息样式
const style = document.createElement('style');
style.textContent = `
.message {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    background-color: #333;
    color: white;
    font-size: 14px;
    z-index: 10000;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.3s ease, transform 0.3s ease;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-show {
    opacity: 1;
    transform: translateY(0);
}

.message-success {
    background-color: var(--admin-success);
}

.message-error {
    background-color: var(--admin-danger);
}

.message-warning {
    background-color: var(--admin-warning);
    color: #333;
}

.message-info {
    background-color: var(--admin-info);
}
`;
document.head.appendChild(style); 