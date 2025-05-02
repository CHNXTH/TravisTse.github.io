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
            websiteData = JSON.parse(existingData);
            
            // 确保所有必要的字段都存在
            websiteData.profile = websiteData.profile || {};
            websiteData.education = websiteData.education || [];
            websiteData.experience = websiteData.experience || [];
            websiteData.projects = websiteData.projects || [];
            websiteData.papers = websiteData.papers || [];
            websiteData.awards = websiteData.awards || [];
            websiteData.social = websiteData.social || [];
            websiteData.footprints = websiteData.footprints || [];
            websiteData.settings = websiteData.settings || { password: DEFAULT_PASSWORD };
            
            console.log('数据加载完成，发现工作经历数量:', websiteData.experience.length);
            
            // 保存到localStorage以确保结构完整
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
        }
    };
    
    console.log('默认数据创建完成');
    
    // 保存到localStorage
    saveWebsiteData();
}

// 保存网站数据
function saveWebsiteData() {
    try {
        console.log('正在保存网站数据到localStorage...', websiteData);
        
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
        
        // 转换为JSON字符串
        const dataStr = JSON.stringify(websiteData);
        
        // 保存到localStorage
        localStorage.setItem('websiteData', dataStr);
        
        console.log('数据保存成功，大小:', dataStr.length, '字节');
        
        // 在保存完数据后设置一个标志，表示数据已经更改
        window.websiteDataUpdated = true;
        
        // 使用更健壮的方式触发前端更新
        try {
            // 1. 直接调用updateFrontend函数（如果在同一页面）
            if (typeof updateFrontend === 'function') {
                console.log('直接调用updateFrontend更新前端...');
                updateFrontend();
            }
            
            // 2. 触发storage事件通知其他页面
            try {
                // 设置一个特殊的标记，触发storage事件
                localStorage.setItem('websiteDataSync', Date.now().toString());
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
                            if (frameWindow && frameWindow.updateFrontend) {
                                console.log('通过iframe调用updateFrontend...');
                                frameWindow.updateFrontend();
                            }
                        } catch (e) {
                            console.error('iframe更新尝试失败:', e);
                        }
                    };
                    document.body.appendChild(updateFrame);
                }
                
                // 设置iframe源为主页
                updateFrame.src = 'index.html#' + Date.now(); // 添加随机参数避免缓存
            }
        } catch (e) {
            console.error('尝试更新前端失败:', e);
        }
        
        return true;
    } catch (error) {
        console.error('保存数据时出错:', error);
        showMessage('数据保存失败，请检查浏览器存储空间', 'error');
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