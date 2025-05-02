// 后台管理系统JavaScript - 第二部分：内容管理功能

// 初始化个人资料部分
function initProfileSection() {
    // 加载当前个人资料数据
    const profile = websiteData.profile || {};
    
    // 填充表单
    document.getElementById('name-en').value = profile.nameEn || '';
    document.getElementById('name-zh').value = profile.nameZh || '';
    document.getElementById('age').value = profile.age || '';
    document.getElementById('phone').value = profile.phone || '';
    document.getElementById('email').value = profile.email || '';
    document.getElementById('location').value = profile.location || '';
    
    // 显示当前头像
    if (profile.avatar) {
        document.getElementById('current-avatar').src = profile.avatar;
    }
    
    // 头像上传预览
    const avatarUpload = document.getElementById('avatar-upload');
    avatarUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('current-avatar').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 保存头像按钮
    document.getElementById('save-avatar').addEventListener('click', function() {
        const file = avatarUpload.files[0];
        if (file) {
            loadImage(file, function(dataUrl) {
                if (dataUrl) {
                    // 保存头像
                    websiteData.profile = websiteData.profile || {};
                    websiteData.profile.avatar = dataUrl;
                    saveWebsiteData();
                    showMessage('头像已更新', 'success');
                }
            });
        } else {
            showMessage('请先选择头像图片', 'warning');
        }
    });
    
    // 保存个人信息按钮
    document.getElementById('save-profile').addEventListener('click', function() {
        // 获取表单数据
        const nameEn = document.getElementById('name-en').value.trim();
        const nameZh = document.getElementById('name-zh').value.trim();
        const age = document.getElementById('age').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const location = document.getElementById('location').value.trim();
        
        // 验证数据
        if (!nameEn || !nameZh) {
            showMessage('请填写姓名', 'warning');
            return;
        }
        
        // 保存数据
        websiteData.profile = websiteData.profile || {};
        websiteData.profile.nameEn = nameEn;
        websiteData.profile.nameZh = nameZh;
        websiteData.profile.age = age;
        websiteData.profile.phone = phone;
        websiteData.profile.email = email;
        websiteData.profile.location = location;
        
        saveWebsiteData();
        showMessage('个人信息已保存', 'success');
    });
}

// 初始化教育经历部分
function initEducationSection() {
    // 加载教育经历数据
    loadEducationItems();
    
    // 添加教育经历按钮
    document.getElementById('add-education').addEventListener('click', function() {
        openEducationModal();
    });
    
    // 关闭模态框按钮
    document.getElementById('close-education-modal').addEventListener('click', function() {
        document.getElementById('education-modal').classList.remove('active');
    });
    
    // 保存教育经历按钮
    document.getElementById('save-education').addEventListener('click', function() {
        saveEducation();
    });
}

// 加载教育经历项
function loadEducationItems() {
    const container = document.getElementById('education-items');
    container.innerHTML = '';
    
    const educations = websiteData.education || [];
    
    if (educations.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无教育经历，请点击"添加教育经历"按钮添加</p>';
        return;
    }
    
    educations.forEach(education => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', education.id);
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(education.school)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${education.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${education.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">学校简介</div>
                    <div class="field-value">${escapeHtml(education.meta || '')}</div>
                </div>
                <div class="item-field">
                    <div class="field-label">专业详情</div>
                    <div class="field-value">${escapeHtml(education.details || '')}</div>
                </div>
                <div class="item-field">
                    <div class="field-label">时间段</div>
                    <div class="field-value">${escapeHtml(education.time || '')}</div>
                </div>
                ${education.research ? `
                <div class="item-field">
                    <div class="field-label">研究方向</div>
                    <div class="field-value">${escapeHtml(education.research)}</div>
                </div>
                ` : ''}
                ${education.stats ? `
                <div class="item-field">
                    <div class="field-label">学业数据</div>
                    <div class="field-value">${escapeHtml(education.stats)}</div>
                </div>
                ` : ''}
                ${education.awards ? `
                <div class="item-field">
                    <div class="field-label">所获奖项</div>
                    <div class="field-value">${escapeHtml(education.awards)}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editEducation(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此教育经历吗？')) {
                deleteEducation(id);
            }
        });
    });
}

// 打开教育经历模态框
function openEducationModal(education = null) {
    const modal = document.getElementById('education-modal');
    const modalTitle = document.getElementById('education-modal-title');
    
    // 重置表单
    document.getElementById('edu-school').value = '';
    document.getElementById('edu-meta').value = '';
    document.getElementById('edu-details').value = '';
    document.getElementById('edu-time').value = '';
    document.getElementById('edu-research').value = '';
    document.getElementById('edu-stats').value = '';
    document.getElementById('edu-awards').value = '';
    document.getElementById('edu-id').value = '';
    
    if (education) {
        // 编辑模式
        modalTitle.textContent = '编辑教育经历';
        document.getElementById('edu-school').value = education.school || '';
        document.getElementById('edu-meta').value = education.meta || '';
        document.getElementById('edu-details').value = education.details || '';
        document.getElementById('edu-time').value = education.time || '';
        document.getElementById('edu-research').value = education.research || '';
        document.getElementById('edu-stats').value = education.stats || '';
        document.getElementById('edu-awards').value = education.awards || '';
        document.getElementById('edu-id').value = education.id;
    } else {
        // 添加模式
        modalTitle.textContent = '添加教育经历';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存教育经历
function saveEducation() {
    // 获取表单数据
    const school = document.getElementById('edu-school').value.trim();
    const meta = document.getElementById('edu-meta').value.trim();
    const details = document.getElementById('edu-details').value.trim();
    const time = document.getElementById('edu-time').value.trim();
    const research = document.getElementById('edu-research').value.trim();
    const stats = document.getElementById('edu-stats').value.trim();
    const awards = document.getElementById('edu-awards').value.trim();
    const id = document.getElementById('edu-id').value;
    
    // 验证必填字段
    if (!school) {
        showMessage('请填写学校名称', 'warning');
        return;
    }
    
    // 准备数据
    const education = {
        school,
        meta,
        details,
        time,
        research,
        stats,
        awards
    };
    
    if (id) {
        // 编辑模式
        education.id = id;
        const index = websiteData.education.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.education[index] = education;
        }
    } else {
        // 添加模式
        education.id = generateId();
        websiteData.education = websiteData.education || [];
        websiteData.education.push(education);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadEducationItems();
    
    // 关闭模态框
    document.getElementById('education-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '教育经历已更新' : '教育经历已添加', 'success');
}

// 编辑教育经历
function editEducation(id) {
    const education = websiteData.education.find(item => item.id === id);
    if (education) {
        openEducationModal(education);
    }
}

// 删除教育经历
function deleteEducation(id) {
    websiteData.education = websiteData.education.filter(item => item.id !== id);
    saveWebsiteData();
    loadEducationItems();
    showMessage('教育经历已删除', 'success');
}

// 初始化工作经历部分
function initExperienceSection() {
    // 加载工作经历数据
    loadExperienceItems();
    
    // 添加工作经历按钮
    document.getElementById('add-experience').addEventListener('click', function() {
        openExperienceModal();
    });
    
    // 关闭模态框按钮
    document.getElementById('close-experience-modal').addEventListener('click', function() {
        document.getElementById('experience-modal').classList.remove('active');
    });
    
    // 保存工作经历按钮
    document.getElementById('save-experience').addEventListener('click', function() {
        saveExperience();
    });
    
    // Logo上传预览
    const logoUpload = document.getElementById('exp-logo-upload');
    logoUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('exp-logo-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// 加载工作经历项
function loadExperienceItems() {
    const container = document.getElementById('experience-items');
    if (!container) {
        console.error('找不到工作经历容器 #experience-items');
        return;
    }
    
    container.innerHTML = '';
    
    const experiences = websiteData.experience || [];
    console.log('正在加载工作经历列表，共', experiences.length, '条记录', experiences);
    
    if (experiences.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无工作经历，请点击"添加工作经历"按钮添加</p>';
        return;
    }
    
    // 按ID排序，确保顺序一致
    const sortedExperiences = [...experiences].sort((a, b) => {
        // 如果有time属性，按time排序（近期的排在前面）
        if (a.time && b.time) {
            const aYear = parseInt(a.time.split(' - ')[0].split('.')[0]);
            const bYear = parseInt(b.time.split(' - ')[0].split('.')[0]);
            return bYear - aYear;
        }
        return 0;
    });
    
    sortedExperiences.forEach(experience => {
        if (!experience || !experience.id) {
            console.error('无效的工作经历数据:', experience);
            return;
        }
        
        try {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-card fade-in';
            itemElement.setAttribute('data-id', experience.id);
            
            // 截断显示详情，如果太长的话
            let displayDetails = experience.details || '';
            if (displayDetails.length > 150) {
                displayDetails = displayDetails.substring(0, 150) + '...';
            }
            
            // 确保logo路径有效
            let logoSrc = experience.logoPath || 'assets/images/placeholder-logo.png';
            
            itemElement.innerHTML = `
                <div class="item-header">
                    <div class="item-title">${escapeHtml(experience.company || 'Untitled')}</div>
                    <div class="item-actions">
                        <button class="action-btn edit-btn" data-id="${experience.id}" title="编辑">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" data-id="${experience.id}" title="删除">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="item-body">
                    <div style="display: flex; margin-bottom: 15px;">
                        <div class="item-logo">
                            <img src="${logoSrc}" alt="${escapeHtml(experience.company || '')}" style="max-width: 80px; max-height: 80px;" onerror="this.src='assets/images/placeholder-logo.png'">
                        </div>
                        <div style="margin-left: 15px; flex-grow: 1;">
                            <div class="item-field">
                                <div class="field-label">职位/角色</div>
                                <div class="field-value">${escapeHtml(experience.meta || '')}</div>
                            </div>
                            <div class="item-field">
                                <div class="field-label">工作时间</div>
                                <div class="field-value">${escapeHtml(experience.time || '')}</div>
                            </div>
                        </div>
                    </div>
                    <div class="item-field">
                        <div class="field-label">工作内容/项目细节</div>
                        <div class="field-value">${formatDetails(displayDetails)}</div>
                    </div>
                </div>
            `;
            
            container.appendChild(itemElement);
            
            // 添加编辑和删除事件
            itemElement.querySelector('.edit-btn').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                editExperience(id);
            });
            
            itemElement.querySelector('.delete-btn').addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (confirm('确定要删除此工作经历吗？')) {
                    deleteExperience(id);
                }
            });
        } catch (e) {
            console.error('加载工作经历项失败:', e);
        }
    });
    
    console.log('工作经历列表加载完成');
}

// 格式化工作内容详情
function formatDetails(details) {
    if (!details) return '';
    
    // 将文本按行分割
    const lines = details.split('\n');
    
    // 转换为HTML列表
    return '<ul class="details-list">' + 
        lines.map(line => {
            line = line.trim();
            if (line.startsWith('-') || line.startsWith('*')) {
                line = line.substring(1).trim();
            }
            if (line) {
                return `<li>${escapeHtml(line)}</li>`;
            }
            return '';
        }).join('') + 
    '</ul>';
}

// 打开工作经历模态框
function openExperienceModal(experience = null) {
    const modal = document.getElementById('experience-modal');
    const modalTitle = document.getElementById('experience-modal-title');
    
    // 重置表单
    document.getElementById('exp-logo-preview').src = 'assets/images/placeholder-logo.png';
    document.getElementById('exp-company').value = '';
    document.getElementById('exp-meta').value = '';
    document.getElementById('exp-time').value = '';
    document.getElementById('exp-details').value = '';
    document.getElementById('exp-id').value = '';
    document.getElementById('exp-logo-path').value = '';
    document.getElementById('exp-logo-upload').value = '';
    
    if (experience) {
        // 编辑模式
        modalTitle.textContent = '编辑工作经历';
        document.getElementById('exp-company').value = experience.company || '';
        document.getElementById('exp-meta').value = experience.meta || '';
        document.getElementById('exp-time').value = experience.time || '';
        document.getElementById('exp-details').value = experience.details || '';
        document.getElementById('exp-id').value = experience.id;
        document.getElementById('exp-logo-path').value = experience.logoPath || '';
        
        if (experience.logoPath) {
            document.getElementById('exp-logo-preview').src = experience.logoPath;
        }
    } else {
        // 添加模式
        modalTitle.textContent = '添加工作经历';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存工作经历
function saveExperience() {
    // 获取表单数据
    const company = document.getElementById('exp-company').value.trim();
    const meta = document.getElementById('exp-meta').value.trim();
    const time = document.getElementById('exp-time').value.trim();
    const details = document.getElementById('exp-details').value.trim();
    const id = document.getElementById('exp-id').value;
    let logoPath = document.getElementById('exp-logo-path').value;
    
    // 验证必填字段
    if (!company) {
        showMessage('请填写公司/项目名称', 'warning');
        return;
    }
    
    // 检查是否有新上传的Logo
    const logoFile = document.getElementById('exp-logo-upload').files[0];
    
    // 如果有新上传的Logo，需要先处理Logo上传
    if (logoFile) {
        loadImage(logoFile, function(dataUrl) {
            if (dataUrl) {
                logoPath = dataUrl;
                saveExperienceData(id, company, meta, time, details, logoPath);
            } else {
                saveExperienceData(id, company, meta, time, details, logoPath);
            }
        });
    } else {
        saveExperienceData(id, company, meta, time, details, logoPath);
    }
}

// 保存工作经历数据
function saveExperienceData(id, company, meta, time, details, logoPath) {
    try {
        console.log('准备保存工作经历数据...');
        // 准备数据
        const experience = {
            company,
            meta,
            time,
            details,
            logoPath
        };
        
        // 确保experience数组存在
        websiteData.experience = websiteData.experience || [];
        
        if (id) {
            // 编辑模式
            experience.id = id;
            const index = websiteData.experience.findIndex(item => item.id === id);
            if (index !== -1) {
                websiteData.experience[index] = experience;
                console.log('更新工作经历:', experience);
            } else {
                // 如果未找到匹配ID的项，则添加新项
                console.log('未找到ID对应的工作经历，添加为新项');
                experience.id = generateId();
                websiteData.experience.push(experience);
            }
        } else {
            // 添加模式
            experience.id = generateId();
            websiteData.experience.push(experience);
            console.log('添加新工作经历:', experience);
        }
        
        // 保存数据
        const saveResult = saveWebsiteData();
        
        if (!saveResult) {
            showMessage('工作经历保存失败', 'error');
            return false;
        }
        
        // 刷新列表
        loadExperienceItems();
        
        // 关闭模态框
        document.getElementById('experience-modal').classList.remove('active');
        
        // 显示成功消息
        showMessage(id ? '工作经历已更新' : '工作经历已添加', 'success');
        
        return true;
    } catch (e) {
        console.error('保存工作经历数据失败:', e);
        showMessage('保存失败，请查看控制台获取详细错误', 'error');
        return false;
    }
}

// 编辑工作经历
function editExperience(id) {
    const experience = websiteData.experience.find(item => item.id === id);
    if (experience) {
        openExperienceModal(experience);
    }
}

// 删除工作经历
function deleteExperience(id) {
    websiteData.experience = websiteData.experience.filter(item => item.id !== id);
    saveWebsiteData();
    loadExperienceItems();
    showMessage('工作经历已删除', 'success');
}

// 初始化设置部分
function initSettingsSection() {
    // 修改密码
    document.getElementById('save-password').addEventListener('click', function() {
        const newPassword = document.getElementById('admin-password').value.trim();
        const confirmPassword = document.getElementById('admin-password-confirm').value.trim();
        const passwordMessage = document.getElementById('password-message');
        
        if (!newPassword) {
            passwordMessage.textContent = '请输入新密码';
            passwordMessage.className = 'password-message text-warning';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            passwordMessage.textContent = '两次输入的密码不一致';
            passwordMessage.className = 'password-message text-danger';
            return;
        }
        
        // 更新密码
        websiteData.settings = websiteData.settings || {};
        websiteData.settings.password = newPassword;
        saveWebsiteData();
        
        // 显示成功消息
        passwordMessage.textContent = '密码已成功修改';
        passwordMessage.className = 'password-message text-success';
        
        // 清空输入框
        document.getElementById('admin-password').value = '';
        document.getElementById('admin-password-confirm').value = '';
        
        showMessage('管理密码已更新', 'success');
    });
    
    // 导出数据
    document.getElementById('backup-data').addEventListener('click', function() {
        const dataStr = JSON.stringify(websiteData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `website_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('数据导出成功', 'success');
    });
    
    // 恢复数据
    document.getElementById('restore-btn').addEventListener('click', function() {
        const fileInput = document.getElementById('restore-data');
        const file = fileInput.files[0];
        
        if (!file) {
            showMessage('请先选择要恢复的数据文件', 'warning');
            return;
        }
        
        if (file.type !== 'application/json') {
            showMessage('请选择正确的JSON格式文件', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data || typeof data !== 'object') {
                    throw new Error('数据格式错误');
                }
                
                // 备份当前数据
                const backupData = JSON.stringify(websiteData);
                
                try {
                    // 更新数据
                    websiteData = data;
                    saveWebsiteData();
                    
                    // 刷新页面
                    showMessage('数据恢复成功，将在3秒后刷新页面', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 3000);
                } catch (error) {
                    // 恢复备份
                    websiteData = JSON.parse(backupData);
                    saveWebsiteData();
                    throw error;
                }
            } catch (error) {
                console.error('恢复数据时出错:', error);
                showMessage('恢复数据失败: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    });
    
    // 清除缓存
    document.getElementById('clear-cache').addEventListener('click', function() {
        if (confirm('确定要清除网站缓存吗？这将删除所有本地存储的数据，包括您的设置和内容。')) {
            localStorage.removeItem('websiteData');
            sessionStorage.removeItem('adminLoggedIn');
            
            showMessage('缓存已清除，将在3秒后刷新页面', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    });
}

// 添加详情列表样式
const detailsListStyle = document.createElement('style');
detailsListStyle.textContent = `
.details-list {
    list-style-type: disc;
    margin: 0;
    padding-left: 20px;
}

.details-list li {
    margin-bottom: 5px;
}

.empty-message {
    color: var(--admin-secondary);
    font-style: italic;
    text-align: center;
    padding: 20px;
}
`;
document.head.appendChild(detailsListStyle);

// 提前声明模块
// 这些模块将在admin-modules.js中实现
window.initProjectsSection = initProjectsSection;
window.initPapersSection = initPapersSection;
window.initAwardsSection = initAwardsSection;
window.initSocialSection = initSocialSection; 