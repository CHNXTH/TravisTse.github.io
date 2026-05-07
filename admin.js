// 后台管理系统JavaScript - 第一部分：基础功能和登录验证

// 全局变量
let websiteData = {}; // 网站数据对象
let adminSectionsInitialized = false;
const USE_CLOUDFLARE_ADMIN = typeof window.cloudflareApi !== 'undefined';
let cloudBootstrapRequired = false;
let cloudAutoSeedAttempted = false;
let cloudRefreshListenersBound = false;
let cloudRefreshIntervalId = null;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', async function() {
    initLoginSystem();
    initNavigationSystem();
    initSidebarToggle();
    initDataMonitorPanel();

    const isLoggedIn = await checkLoginStatus();
    if (isLoggedIn) {
        await prepareAdminPanel();
    }
});

// 加载网站数据
async function loadWebsiteData() {
    if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi.getAdminToken()) {
        try {
            const remoteData = await window.cloudflareApi.getAdminContent();
            if (remoteData.bootstrapRequired || !remoteData.content) {
                cloudBootstrapRequired = true;
                loadWebsiteDataFromLocal();
                showMessage('云端内容尚未初始化，当前已载入本地内容。首次保存后将写入 Cloudflare。', 'warning');
                return;
            }

            cloudBootstrapRequired = false;
            websiteData = normalizeWebsiteData(remoteData.content);
            localStorage.setItem('websiteData', JSON.stringify(websiteData));
            return;
        } catch (error) {
            console.error('从 Cloudflare 加载数据失败，回退到本地数据:', error);
            showMessage(`云端数据加载失败，已回退到本地缓存：${error.message}`, 'warning');
        }
    }

    loadWebsiteDataFromLocal();
}

function loadWebsiteDataFromLocal() {
    try {
        const savedData = localStorage.getItem('websiteData');
        if (savedData) {
            websiteData = normalizeWebsiteData(JSON.parse(savedData));
        } else {
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
            websiteData.anonymousMessages = websiteData.anonymousMessages || [];
            if (websiteData.settings && typeof websiteData.settings === 'object') {
                delete websiteData.settings.password;
                if (Object.keys(websiteData.settings).length === 0) {
                    delete websiteData.settings;
                }
            }
            
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
	            age: '24',
	            phone: '15698010160',
	            email: 'chnxth@gmail.com',
	            location: 'Shanghai',
	            avatar: 'assets/images/avatar.jpg',
	            flipAvatar: 'assets/images/avatar.jpg',
	            summaryEn:
	                'AI product + interaction design, with an architecture background. I care about clarity, craft, and shipping things people actually use.',
	            summaryZh:
	                'AI 产品与交互设计方向，建筑背景出身。我关注清晰表达、体验细节，以及把真正能用的东西做出来。'
	        },
	        education: [],
	        experience: [],
	        projects: [],
	        papers: [],
	        awards: [],
	        knowledgeCards: [],
	        social: [],
	        footprints: [],
        anonymousMessages: [],
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
async function saveWebsiteData() {
    try {
        console.log('正在保存网站数据...');
        
        // 确保每个数据数组都存在
        websiteData = normalizeWebsiteData(websiteData);
        
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
        
        // 保留本地缓存，作为离线回退与导出来源
        const syncId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('websiteData', dataStr);
        
        console.log('本地缓存保存成功，大小:', formatSize(dataSize));
        
        // 在保存完数据后设置一个标志，表示数据已经更改
        window.websiteDataUpdated = true;
        
        // 自动创建每日备份（限制为最多7个备份）
        createBackup();
        
        localStorage.setItem('websiteDataSync', syncId);
        localStorage.setItem('websiteDataSyncSource', 'admin_save_' + syncId);

        if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi.getAdminToken()) {
            await window.cloudflareApi.saveAdminContent(websiteData);
            showMessage('数据已保存到 Cloudflare', 'success');
        } else {
            showMessage('数据已保存到本地缓存', 'success');
        }

        return true;
    } catch (error) {
        console.error('保存数据时出错:', error);
        showMessage('数据保存失败: ' + error.message, 'error');
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
    loginBtn.addEventListener('click', async function() {
        const password = passwordInput.value.trim();
        await login(password);
    });
    
    // 密码输入框Enter键事件
    passwordInput.addEventListener('keypress', async function(e) {
        if (e.key === 'Enter') {
            const password = passwordInput.value.trim();
            await login(password);
        }
    });
    
    // 退出登录按钮点击事件
    logoutBtn.addEventListener('click', function() {
        logout();
    });
}

// 登录函数
async function login(password) {
    const loginError = document.getElementById('login-error');

    try {
        if (USE_CLOUDFLARE_ADMIN) {
            await window.cloudflareApi.login(password);
        } else {
            throw new Error('当前后台需要通过 Cloudflare Worker 登录，请检查 API 配置');
        }

        loginError.textContent = '';
        sessionStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';

        await prepareAdminPanel();
        showMessage('登录成功', 'success');
    } catch (error) {
        loginError.textContent = error.message || '密码错误，请重试';
        document.getElementById('password').value = '';
    }
}

// If Cloudflare admin token expires while the panel is open, force a clean re-login.
window.addEventListener('cf-admin-unauthorized', () => {
    try {
        showMessage('登录已过期，请重新登录', 'warning');
    } catch (_) {
        // ignore
    }
    logout();
});

// 退出登录函数
function logout() {
    // 清除登录状态
    sessionStorage.removeItem('adminLoggedIn');
    if (USE_CLOUDFLARE_ADMIN) {
        window.cloudflareApi.logout();
    }
    
    // 隐藏管理面板，显示登录页面
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-login').style.display = 'flex';
    
    // 清空密码输入框
    document.getElementById('password').value = '';
}

// 检查登录状态
async function checkLoginStatus() {
    const hasSession = sessionStorage.getItem('adminLoggedIn') === 'true';

    if (hasSession && USE_CLOUDFLARE_ADMIN && !window.cloudflareApi.getAdminToken()) {
        sessionStorage.removeItem('adminLoggedIn');
    }

    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        return true;
    }

    document.getElementById('admin-login').style.display = 'flex';
    document.getElementById('admin-panel').style.display = 'none';
    return false;
}

async function prepareAdminPanel() {
    await loadWebsiteData();

    if (USE_CLOUDFLARE_ADMIN && cloudBootstrapRequired) {
        await bootstrapCloudflareContentFromStaticSite();
        await loadWebsiteData();
    }

    if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi.getAdminToken() && !cloudBootstrapRequired && !cloudAutoSeedAttempted) {
        cloudAutoSeedAttempted = true;
        await forceCloudSyncFromSiteIfEmpty();
        await saveWebsiteData();
        await loadWebsiteData();
    }

    if (!adminSectionsInitialized) {
        initProfileSection();
        initEducationSection();
        initExperienceSection();
        initProjectsSection();
        initPapersSection();
        initAwardsSection();
        initKnowledgeSection();
        initSocialSection();
        initFootprintsSection();
        initAnonymousMessagesSection();
        initSettingsSection();
        adminSectionsInitialized = true;
    } else {
        refreshAdminSections();
    }

    bindCloudRefreshListeners();
    updateMonitorPanel();
}

async function refreshAnonymousMessagesFromCloud({ silent = false } = {}) {
    if (!USE_CLOUDFLARE_ADMIN || !window.cloudflareApi.getAdminToken()) {
        return false;
    }

    try {
        const remoteData = await window.cloudflareApi.getAdminContent();
        if (!remoteData || !remoteData.content) {
            return false;
        }

        const normalizedRemote = normalizeWebsiteData(remoteData.content);
        const localCount = Array.isArray(websiteData.anonymousMessages) ? websiteData.anonymousMessages.length : 0;
        const remoteCount = Array.isArray(normalizedRemote.anonymousMessages) ? normalizedRemote.anonymousMessages.length : 0;
        const localModified = websiteData.meta && websiteData.meta.lastModified ? String(websiteData.meta.lastModified) : '';
        const remoteModified = normalizedRemote.meta && normalizedRemote.meta.lastModified ? String(normalizedRemote.meta.lastModified) : '';

        if (remoteCount === localCount && remoteModified === localModified) {
            return false;
        }

        websiteData = normalizedRemote;
        localStorage.setItem('websiteData', JSON.stringify(websiteData));
        refreshAdminSections();
        if (!silent) {
            showMessage('匿名留言已同步到后台列表', 'success');
        }
        return true;
    } catch (error) {
        console.error('刷新匿名留言失败:', error);
        if (!silent) {
            showMessage(`匿名留言刷新失败：${error.message}`, 'warning');
        }
        return false;
    }
}

function bindCloudRefreshListeners() {
    if (cloudRefreshListenersBound) return;
    cloudRefreshListenersBound = true;

    window.addEventListener('focus', () => {
        refreshAnonymousMessagesFromCloud({ silent: true });
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshAnonymousMessagesFromCloud({ silent: true });
        }
    });

    window.addEventListener('storage', (event) => {
        if (event.key === 'websiteDataSync' || event.key === 'websiteData') {
            refreshAnonymousMessagesFromCloud({ silent: true });
        }
    });

    cloudRefreshIntervalId = window.setInterval(() => {
        const activeSection = document.querySelector('.admin-section.active');
        if (!activeSection || activeSection.id !== 'anonymous-messages-section') return;
        if (document.visibilityState !== 'visible') return;
        refreshAnonymousMessagesFromCloud({ silent: true });
    }, 10000);
}

function refreshAdminSections() {
    const profile = websiteData.profile || {};

    if (document.getElementById('name-en')) document.getElementById('name-en').value = profile.nameEn || '';
    if (document.getElementById('name-zh')) document.getElementById('name-zh').value = profile.nameZh || '';
    if (document.getElementById('age')) document.getElementById('age').value = profile.age || '';
    if (document.getElementById('phone')) document.getElementById('phone').value = profile.phone || '';
    if (document.getElementById('email')) document.getElementById('email').value = profile.email || '';
    if (document.getElementById('location')) document.getElementById('location').value = profile.location || '';
    if (document.getElementById('current-avatar') && profile.avatar) {
        document.getElementById('current-avatar').src = profile.avatar;
    }

    if (typeof loadEducationItems === 'function') loadEducationItems();
    if (typeof loadExperienceItems === 'function') loadExperienceItems();
    if (typeof loadProjectItems === 'function') loadProjectItems();
    if (typeof loadPaperItems === 'function') loadPaperItems();
    if (typeof loadAwardItems === 'function') loadAwardItems();
    if (typeof loadKnowledgeItems === 'function') loadKnowledgeItems();
    if (typeof loadSocialItems === 'function') loadSocialItems();
    if (typeof loadFootprintItems === 'function') loadFootprintItems();
    if (typeof loadAnonymousMessageItems === 'function') loadAnonymousMessageItems();
}

function normalizeWebsiteData(data) {
    const normalized = data || {};
    normalized.profile = normalized.profile || {};
    normalized.education = Array.isArray(normalized.education) ? normalized.education : [];
    normalized.experience = Array.isArray(normalized.experience) ? normalized.experience : [];
    normalized.projects = Array.isArray(normalized.projects) ? normalized.projects : [];
    normalized.papers = Array.isArray(normalized.papers) ? normalized.papers : [];
    normalized.awards = Array.isArray(normalized.awards) ? normalized.awards : [];
    normalized.social = Array.isArray(normalized.social) ? normalized.social : [];
    normalized.footprints = Array.isArray(normalized.footprints) ? normalized.footprints : [];
    normalized.anonymousMessages = Array.isArray(normalized.anonymousMessages) ? normalized.anonymousMessages : [];
    normalized.knowledgeCards = Array.isArray(normalized.knowledgeCards) ? normalized.knowledgeCards : [];
    normalized.settings = normalized.settings && typeof normalized.settings === 'object' ? normalized.settings : {};
    delete normalized.settings.password;
    if (Object.keys(normalized.settings).length === 0) {
        delete normalized.settings;
    }
    normalized.meta = normalized.meta || {};
    return normalized;
}

async function bootstrapCloudflareContentFromStaticSite() {
    try {
        const doc = await fetchHomeDocument();
        const extracted = extractWebsiteDataFromDocument(doc);

        assertExtractedContentUseful(extracted, '云端初始化');
        websiteData = normalizeWebsiteData(extracted);
        await saveWebsiteData();
        cloudBootstrapRequired = false;
        showMessage('已从当前网站页面初始化 Cloudflare 内容库', 'success');
    } catch (error) {
        console.error('初始化 Cloudflare 内容库失败:', error);
        showMessage(`云端初始化失败：${error.message}`, 'error');
    }
}

async function forceCloudSyncFromSiteIfEmpty() {
    // 只在“云端内容明显未初始化/过于空白”时才自动从主页回填，
    // 避免用户主动清空某个模块后被自动回填覆盖。
    const emptyMainSections =
        !websiteData ||
        (
            Array.isArray(websiteData.education) && websiteData.education.length === 0 &&
            Array.isArray(websiteData.experience) && websiteData.experience.length === 0 &&
            Array.isArray(websiteData.projects) && websiteData.projects.length === 0 &&
            Array.isArray(websiteData.papers) && websiteData.papers.length === 0 &&
            Array.isArray(websiteData.awards) && websiteData.awards.length === 0 &&
            Array.isArray(websiteData.social) && websiteData.social.length === 0
        );

    if (!emptyMainSections) {
        return;
    }

    const doc = await fetchHomeDocument();
    const extracted = extractWebsiteDataFromDocument(doc);

    assertExtractedContentUseful(extracted, '强制同步');
    websiteData = mergeWebsiteData(websiteData, extracted);
    showMessage('已从主页提取内容，准备同步到云端...', 'info');
}

async function fetchHomeDocument() {
    // When admin is opened via file://, browsers generally block fetch() for local files.
    // In that case, fall back to a file picker so the user can select index.html manually.
    if (window.location && window.location.protocol === 'file:') {
        showMessage('检测到通过本地文件(file://)打开后台，无法自动读取主页。请在弹窗中选择你的 index.html 用于同步。', 'warning');
        return await pickHomeDocumentFromFile();
    }

    const tried = [];
    const origin = window.location.origin;
    const pathname = window.location.pathname || '/';
    const parts = pathname.split('/'); // leading '' for root

    // 从“当前目录”开始一路向上尝试，兼容 GH Pages 的项目页/子目录部署。
    for (let i = parts.length - 1; i >= 1; i--) {
        const base = parts.slice(0, i).join('/') + '/';
        const url = origin + base + 'index.html';
        if (tried.includes(url)) continue;
        tried.push(url);

        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) continue;
            const html = await res.text();
            const parser = new DOMParser();
            return parser.parseFromString(html, 'text/html');
        } catch (e) {
            // 继续尝试下一个路径
        }
    }

    throw new Error(`无法加载主页 index.html（已尝试：${tried.join(', ')}）`);
}

function pickHomeDocumentFromFile() {
    return new Promise((resolve, reject) => {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'text/html,.html';
            input.style.position = 'fixed';
            input.style.left = '-9999px';

            input.addEventListener('change', () => {
                const file = input.files && input.files[0];
                input.remove();

                if (!file) {
                    reject(new Error('未选择文件'));
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const html = String(reader.result || '');
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        resolve(doc);
                    } catch (e) {
                        reject(new Error('解析 index.html 失败，请确认选择的是主页文件'));
                    }
                };
                reader.onerror = () => reject(new Error('读取文件失败，请重试'));
                reader.readAsText(file);
            }, { once: true });

            document.body.appendChild(input);
            input.click();
        } catch (e) {
            reject(new Error('无法打开文件选择器，请改用 https 方式打开 admin.html'));
        }
    });
}

function assertExtractedContentUseful(extracted, actionLabel) {
    const hasAny =
        extracted &&
        (
            (Array.isArray(extracted.education) && extracted.education.length > 0) ||
            (Array.isArray(extracted.experience) && extracted.experience.length > 0) ||
            (Array.isArray(extracted.projects) && extracted.projects.length > 0) ||
            (Array.isArray(extracted.papers) && extracted.papers.length > 0) ||
            (Array.isArray(extracted.awards) && extracted.awards.length > 0) ||
            (Array.isArray(extracted.social) && extracted.social.length > 0)
        );

    if (!hasAny) {
        throw new Error(`${actionLabel}：从主页提取到的内容为空，已取消写入。请确认 admin 页面能访问到正确的 index.html。`);
    }
}

function extractWebsiteDataFromDocument(doc) {
    const profile = {
        nameEn: doc.querySelector('.name')?.getAttribute('data-en') || doc.querySelector('.name')?.textContent?.trim() || 'Travis Tse',
        nameZh: doc.querySelector('.name')?.getAttribute('data-zh') || '谢堂华 Travis Tse',
        age: extractAgeFromText(doc.querySelector('.contact-info')?.textContent || ''),
        phone: doc.querySelector('.contact-info a[href^="tel:"]')?.textContent?.trim() || '+86 13020264160',
        email: doc.querySelector('.contact-info a[href^="mailto:"]')?.textContent?.trim() || 'chnxth@gmail.com',
        location: doc.querySelector('.location-info')?.textContent?.replace('Shanghai', 'Shanghai').trim() || 'Shanghai',
        avatar: 'assets/images/avatar.jpg'
    };

    return {
        profile,
        education: Array.from(doc.querySelectorAll('#education .education-item')).map((item, index) => ({
            id: `edu_${index + 1}`,
            school: item.querySelector('h3')?.textContent?.trim() || '',
            meta: item.querySelector('.education-meta')?.textContent?.trim() || '',
            details: item.querySelector('.education-details')?.textContent?.trim() || '',
            time: item.querySelector('.education-time')?.textContent?.trim() || '',
            research: item.querySelector('.education-research')?.textContent?.trim() || '',
            stats: item.querySelector('.education-stats')?.textContent?.trim() || '',
            awards: item.querySelector('.education-awards')?.textContent?.trim() || ''
        })),
        experience: Array.from(doc.querySelectorAll('#experience .experience-item')).map((item, index) => ({
            id: `exp_${index + 1}`,
            company: item.querySelector('h3')?.textContent?.trim() || '',
            meta: item.querySelector('.experience-meta')?.textContent?.trim() || '',
            time: item.querySelector('.experience-time')?.textContent?.trim() || '',
            details: Array.from(item.querySelectorAll('.experience-details > li')).map((line) => line.textContent.trim()),
            logoPath: normalizeAssetPath(item.querySelector('.experience-logo img')?.getAttribute('src') || '')
        })),
        projects: Array.from(doc.querySelectorAll('.project-item')).map((item, index) => ({
            id: `project_${index + 1}`,
            title: item.querySelector('.project-info h3')?.textContent?.trim() || '',
            link: item.querySelector('a.project-link')?.getAttribute('href') || '',
            imagePath: normalizeAssetPath(item.querySelector('.project-image')?.getAttribute('src') || '')
        })),
        papers: Array.from(doc.querySelectorAll('#papers .timeline-item')).map((item, index) => ({
            id: `paper_${index + 1}`,
            time: item.querySelector('.timeline-date')?.textContent?.trim() || '',
            title: item.querySelector('h3')?.textContent?.trim() || '',
            link: item.querySelector('h3 a')?.getAttribute('href') || '',
            authors: item.querySelector('.timeline-content p')?.textContent?.trim() || ''
        })),
        awards: Array.from(doc.querySelectorAll('#awards .timeline-item')).map((item, index) => ({
            id: `award_${index + 1}`,
            time: item.querySelector('.timeline-date')?.textContent?.trim() || '',
            title: item.querySelector('h3')?.textContent?.trim() || '',
            details: item.querySelector('.timeline-content p')?.textContent?.trim() || ''
        })),
        social: Array.from(doc.querySelectorAll('#social .social-icon')).map((item, index) => ({
            id: `social_${index + 1}`,
            type: normalizeSocialType(item.getAttribute('aria-label') || ''),
            name: item.getAttribute('aria-label') || '',
            link: item.getAttribute('href') || '',
            iconPath: item.querySelector('img') ? normalizeAssetPath(item.querySelector('img').getAttribute('src') || '') : ''
        })),
        footprints: [],
        anonymousMessages: [],
        meta: {
            version: '2.0-cloudflare',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        }
    };
}

function mergeWebsiteData(base, incoming) {
    const merged = normalizeWebsiteData(base);
    const normalizedIncoming = normalizeWebsiteData(incoming);

    merged.profile = { ...normalizedIncoming.profile, ...merged.profile };

    if (merged.education.length === 0 && normalizedIncoming.education.length > 0) merged.education = normalizedIncoming.education;
    if (merged.experience.length === 0 && normalizedIncoming.experience.length > 0) merged.experience = normalizedIncoming.experience;
    if (merged.projects.length === 0 && normalizedIncoming.projects.length > 0) merged.projects = normalizedIncoming.projects;
    if (merged.papers.length === 0 && normalizedIncoming.papers.length > 0) merged.papers = normalizedIncoming.papers;
    if (merged.awards.length === 0 && normalizedIncoming.awards.length > 0) merged.awards = normalizedIncoming.awards;
    if (merged.social.length === 0 && normalizedIncoming.social.length > 0) merged.social = normalizedIncoming.social;

    if (merged.footprints.length === 0 && normalizedIncoming.footprints.length > 0) merged.footprints = normalizedIncoming.footprints;
    if (merged.anonymousMessages.length === 0 && normalizedIncoming.anonymousMessages.length > 0) merged.anonymousMessages = normalizedIncoming.anonymousMessages;

    merged.settings = {
        ...(normalizedIncoming.settings || {}),
        ...(merged.settings || {})
    };
    if (Object.keys(merged.settings).length === 0) {
        delete merged.settings;
    }
    merged.meta = merged.meta || {};

    return merged;
}

function extractAgeFromText(text) {
    const match = text.match(/(\d+)\s*Years\s*Old/i);
    return match ? match[1] : '24';
}

function normalizeAssetPath(path) {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('assets/')) {
        return path;
    }
    return path.replace(/^\.?\//, '');
}

function normalizeSocialType(label) {
    const value = label.toLowerCase();
    if (value.includes('instagram')) return 'instagram';
    if (value.includes('behance')) return 'behance';
    if (value.includes('github')) return 'github';
    if (value.includes('pinterest')) return 'pinterest';
    if (value.includes('youtube')) return 'youtube';
    if (value.includes('小红书') || value.includes('rednote')) return 'rednote';
    if (value.includes('抖音') || value.includes('tiktok')) return 'tiktok';
    if (value.includes('网易云')) return 'netease';
    return 'custom';
}

// 初始化导航系统
function initNavigationSystem() {
    const menuItems = document.querySelectorAll('.admin-menu li');
    const closeSidebarIfMobile = () => {
        if (window.innerWidth > 768) return;

        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('admin-sidebar-overlay');
        const trigger = document.getElementById('admin-sidebar-trigger');

        if (sidebar) {
            sidebar.classList.remove('active');
        }

        if (overlay) {
            overlay.classList.remove('active');
        }

        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
    };
    
    menuItems.forEach(item => {
        item.addEventListener('click', async function() {
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

            if (targetId === 'anonymous-messages-section') {
                await refreshAnonymousMessagesFromCloud({ silent: true });
            }

            closeSidebarIfMobile();
        });
    });
}

function initSidebarToggle() {
    const trigger = document.getElementById('admin-sidebar-trigger');
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.getElementById('admin-sidebar-overlay');

    if (!trigger || !sidebar || !overlay) {
        return;
    }

    function setSidebarOpen(open) {
        const isMobile = window.innerWidth <= 768;

        if (!isMobile) {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            trigger.setAttribute('aria-expanded', 'false');
            return;
        }

        sidebar.classList.toggle('active', open);
        overlay.classList.toggle('active', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    trigger.addEventListener('click', function() {
        if (window.innerWidth > 768) {
            return;
        }

        setSidebarOpen(!sidebar.classList.contains('active'));
    });

    overlay.addEventListener('click', function() {
        setSidebarOpen(false);
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            setSidebarOpen(false);
        }
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

// 初始化匿名留言部分
function initAnonymousMessagesSection() {
    // 将在第三部分代码中实现（admin-modules.js）
}

// 初始化设置部分
function initSettingsSection() {
    // 将在第二部分代码中实现
}

// 初始化个人内容库部分
function initKnowledgeSection() {
    // 将在第三部分代码中实现（admin-modules.js）
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

    function syncMonitorToggleState() {
        toggle.textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
    }

    syncMonitorToggleState();
    
    // 折叠/展开面板
    toggle.addEventListener('click', function() {
        panel.classList.toggle('collapsed');
        syncMonitorToggleState();
    });
    
    // 强制同步
    forceSync.addEventListener('click', async function() {
        try {
            if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi.getAdminToken()) {
                await forceCloudSyncFromSiteIfEmpty();
            }

            await saveWebsiteData();
            await loadWebsiteData();
            refreshAdminSections();
            updateMonitorPanel();
            showMessage('强制同步已执行', 'success');
        } catch (error) {
            console.error('强制同步失败:', error);
            showMessage(`强制同步失败: ${error.message}`, 'error');
        }
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
    
    // 初始化时保持默认折叠状态，仅刷新显示数据
    setTimeout(function() {
        syncMonitorToggleState();
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
        
        // 计算本地缓存使用量（localStorage上限通常约5MB，图片base64很容易占满）
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
