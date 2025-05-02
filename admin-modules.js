// 后台管理系统JavaScript - 第三部分：项目、论文、奖项和社交媒体模块

// 初始化项目展示部分
function initProjectsSection() {
    loadProjectItems();
    
    document.getElementById('add-project').addEventListener('click', () => openProjectModal());
    document.getElementById('close-project-modal').addEventListener('click', () => {
        document.getElementById('project-modal').classList.remove('active');
    });
    document.getElementById('save-project').addEventListener('click', saveProject);
    
    // 项目图片预览
    document.getElementById('project-image-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('project-image-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// 加载项目列表
function loadProjectItems() {
    const container = document.getElementById('project-items');
    container.innerHTML = '';
    
    const projects = websiteData.projects || [];
    
    if (projects.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无项目，请点击"添加项目"按钮添加</p>';
        return;
    }
    
    projects.forEach(project => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', project.id);
        
        itemElement.innerHTML = `
            <div class="item-preview">
                <img src="${project.imagePath || 'assets/images/placeholder-project.jpg'}" alt="${escapeHtml(project.title)}">
            </div>
            <div class="item-header">
                <div class="item-title">${escapeHtml(project.title)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${project.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${project.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">项目链接</div>
                    <div class="field-value">
                        <a href="${escapeHtml(project.link)}" target="_blank" class="project-link">${escapeHtml(project.link)}</a>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editProject(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此项目吗？')) {
                deleteProject(id);
            }
        });
    });
}

// 打开项目模态框
function openProjectModal(project = null) {
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('project-modal-title');
    
    // 重置表单
    document.getElementById('project-image-preview').src = 'assets/images/placeholder-project.jpg';
    document.getElementById('project-title').value = '';
    document.getElementById('project-link').value = '';
    document.getElementById('project-id').value = '';
    document.getElementById('project-image-path').value = '';
    document.getElementById('project-image-upload').value = '';
    
    if (project) {
        // 编辑模式
        modalTitle.textContent = '编辑项目';
        document.getElementById('project-title').value = project.title || '';
        document.getElementById('project-link').value = project.link || '';
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-image-path').value = project.imagePath || '';
        
        if (project.imagePath) {
            document.getElementById('project-image-preview').src = project.imagePath;
        }
    } else {
        // 添加模式
        modalTitle.textContent = '添加项目';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存项目
function saveProject() {
    // 获取表单数据
    const title = document.getElementById('project-title').value.trim();
    const link = document.getElementById('project-link').value.trim();
    const id = document.getElementById('project-id').value;
    let imagePath = document.getElementById('project-image-path').value;
    
    // 验证必填字段
    if (!title) {
        showMessage('请填写项目名称', 'warning');
        return;
    }
    
    // 检查是否有新上传的图片
    const imageFile = document.getElementById('project-image-upload').files[0];
    
    // 如果有新上传的图片，需要先处理图片上传
    if (imageFile) {
        loadImage(imageFile, function(dataUrl) {
            if (dataUrl) {
                imagePath = dataUrl;
                saveProjectData(id, title, link, imagePath);
            } else {
                saveProjectData(id, title, link, imagePath);
            }
        });
    } else {
        saveProjectData(id, title, link, imagePath);
    }
}

// 保存项目数据
function saveProjectData(id, title, link, imagePath) {
    // 准备数据
    const project = {
        title,
        link,
        imagePath
    };
    
    if (id) {
        // 编辑模式
        project.id = id;
        const index = websiteData.projects.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.projects[index] = project;
        }
    } else {
        // 添加模式
        project.id = generateId();
        websiteData.projects = websiteData.projects || [];
        websiteData.projects.push(project);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadProjectItems();
    
    // 关闭模态框
    document.getElementById('project-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '项目已更新' : '项目已添加', 'success');
}

// 编辑项目
function editProject(id) {
    const project = websiteData.projects.find(item => item.id === id);
    if (project) {
        openProjectModal(project);
    }
}

// 删除项目
function deleteProject(id) {
    websiteData.projects = websiteData.projects.filter(item => item.id !== id);
    saveWebsiteData();
    loadProjectItems();
    showMessage('项目已删除', 'success');
}

// 初始化论文与专利部分
function initPapersSection() {
    loadPaperItems();
    
    document.getElementById('add-paper').addEventListener('click', () => openPaperModal());
    document.getElementById('close-paper-modal').addEventListener('click', () => {
        document.getElementById('paper-modal').classList.remove('active');
    });
    document.getElementById('save-paper').addEventListener('click', savePaper);
}

// 加载论文列表
function loadPaperItems() {
    const container = document.getElementById('paper-items');
    container.innerHTML = '';
    
    const papers = websiteData.papers || [];
    
    if (papers.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无论文与专利，请点击"添加论文/专利"按钮添加</p>';
        return;
    }
    
    papers.forEach(paper => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', paper.id);
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(paper.time)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${paper.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${paper.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">标题</div>
                    <div class="field-value">
                        ${paper.link ? `<a href="${escapeHtml(paper.link)}" target="_blank">${escapeHtml(paper.title)}</a>` : escapeHtml(paper.title)}
                    </div>
                </div>
                <div class="item-field">
                    <div class="field-label">作者/详情</div>
                    <div class="field-value">${escapeHtml(paper.authors || '')}</div>
                </div>
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editPaper(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此论文/专利吗？')) {
                deletePaper(id);
            }
        });
    });
}

// 打开论文模态框
function openPaperModal(paper = null) {
    const modal = document.getElementById('paper-modal');
    const modalTitle = document.getElementById('paper-modal-title');
    
    // 重置表单
    document.getElementById('paper-time').value = '';
    document.getElementById('paper-title').value = '';
    document.getElementById('paper-link').value = '';
    document.getElementById('paper-authors').value = '';
    document.getElementById('paper-id').value = '';
    
    if (paper) {
        // 编辑模式
        modalTitle.textContent = '编辑论文/专利';
        document.getElementById('paper-time').value = paper.time || '';
        document.getElementById('paper-title').value = paper.title || '';
        document.getElementById('paper-link').value = paper.link || '';
        document.getElementById('paper-authors').value = paper.authors || '';
        document.getElementById('paper-id').value = paper.id;
    } else {
        // 添加模式
        modalTitle.textContent = '添加论文/专利';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存论文
function savePaper() {
    // 获取表单数据
    const time = document.getElementById('paper-time').value.trim();
    const title = document.getElementById('paper-title').value.trim();
    const link = document.getElementById('paper-link').value.trim();
    const authors = document.getElementById('paper-authors').value.trim();
    const id = document.getElementById('paper-id').value;
    
    // 验证必填字段
    if (!time || !title) {
        showMessage('请填写时间和标题', 'warning');
        return;
    }
    
    // 准备数据
    const paper = {
        time,
        title,
        link,
        authors
    };
    
    if (id) {
        // 编辑模式
        paper.id = id;
        const index = websiteData.papers.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.papers[index] = paper;
        }
    } else {
        // 添加模式
        paper.id = generateId();
        websiteData.papers = websiteData.papers || [];
        websiteData.papers.push(paper);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadPaperItems();
    
    // 关闭模态框
    document.getElementById('paper-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '论文/专利已更新' : '论文/专利已添加', 'success');
}

// 编辑论文
function editPaper(id) {
    const paper = websiteData.papers.find(item => item.id === id);
    if (paper) {
        openPaperModal(paper);
    }
}

// 删除论文
function deletePaper(id) {
    websiteData.papers = websiteData.papers.filter(item => item.id !== id);
    saveWebsiteData();
    loadPaperItems();
    showMessage('论文/专利已删除', 'success');
}

// 初始化奖项荣誉部分
function initAwardsSection() {
    loadAwardItems();
    
    document.getElementById('add-award').addEventListener('click', () => openAwardModal());
    document.getElementById('close-award-modal').addEventListener('click', () => {
        document.getElementById('award-modal').classList.remove('active');
    });
    document.getElementById('save-award').addEventListener('click', saveAward);
}

// 加载奖项列表
function loadAwardItems() {
    const container = document.getElementById('award-items');
    container.innerHTML = '';
    
    const awards = websiteData.awards || [];
    
    if (awards.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无奖项荣誉，请点击"添加奖项"按钮添加</p>';
        return;
    }
    
    awards.forEach(award => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', award.id);
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(award.time)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${award.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${award.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">奖项名称</div>
                    <div class="field-value">${escapeHtml(award.title)}</div>
                </div>
                ${award.details ? `
                <div class="item-field">
                    <div class="field-label">奖项详情</div>
                    <div class="field-value">${escapeHtml(award.details)}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editAward(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此奖项吗？')) {
                deleteAward(id);
            }
        });
    });
}

// 打开奖项模态框
function openAwardModal(award = null) {
    const modal = document.getElementById('award-modal');
    const modalTitle = document.getElementById('award-modal-title');
    
    // 重置表单
    document.getElementById('award-time').value = '';
    document.getElementById('award-title').value = '';
    document.getElementById('award-details').value = '';
    document.getElementById('award-id').value = '';
    
    if (award) {
        // 编辑模式
        modalTitle.textContent = '编辑奖项';
        document.getElementById('award-time').value = award.time || '';
        document.getElementById('award-title').value = award.title || '';
        document.getElementById('award-details').value = award.details || '';
        document.getElementById('award-id').value = award.id;
    } else {
        // 添加模式
        modalTitle.textContent = '添加奖项';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存奖项
function saveAward() {
    // 获取表单数据
    const time = document.getElementById('award-time').value.trim();
    const title = document.getElementById('award-title').value.trim();
    const details = document.getElementById('award-details').value.trim();
    const id = document.getElementById('award-id').value;
    
    // 验证必填字段
    if (!time || !title) {
        showMessage('请填写获奖时间和奖项名称', 'warning');
        return;
    }
    
    // 准备数据
    const award = {
        time,
        title,
        details
    };
    
    if (id) {
        // 编辑模式
        award.id = id;
        const index = websiteData.awards.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.awards[index] = award;
        }
    } else {
        // 添加模式
        award.id = generateId();
        websiteData.awards = websiteData.awards || [];
        websiteData.awards.push(award);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadAwardItems();
    
    // 关闭模态框
    document.getElementById('award-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '奖项已更新' : '奖项已添加', 'success');
}

// 编辑奖项
function editAward(id) {
    const award = websiteData.awards.find(item => item.id === id);
    if (award) {
        openAwardModal(award);
    }
}

// 删除奖项
function deleteAward(id) {
    websiteData.awards = websiteData.awards.filter(item => item.id !== id);
    saveWebsiteData();
    loadAwardItems();
    showMessage('奖项已删除', 'success');
}

// 初始化社交媒体部分
function initSocialSection() {
    loadSocialItems();
    
    document.getElementById('add-social').addEventListener('click', () => openSocialModal());
    document.getElementById('close-social-modal').addEventListener('click', () => {
        document.getElementById('social-modal').classList.remove('active');
    });
    document.getElementById('save-social').addEventListener('click', saveSocial);
    
    // 社交媒体类型变更事件
    document.getElementById('social-type').addEventListener('change', function() {
        const customIconGroup = document.getElementById('social-custom-icon-group');
        customIconGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
    
    // 自定义图标上传预览
    document.getElementById('social-custom-icon-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('social-custom-icon-preview').src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

// 加载社交媒体列表
function loadSocialItems() {
    const container = document.getElementById('social-items');
    container.innerHTML = '';
    
    const socials = websiteData.social || [];
    
    if (socials.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无社交媒体，请点击"添加社交媒体"按钮添加</p>';
        return;
    }
    
    socials.forEach(social => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', social.id);
        
        let iconHtml = '';
        if (social.type === 'custom' && social.iconPath) {
            iconHtml = `<img src="${social.iconPath}" alt="${escapeHtml(social.name)}" style="width: 32px; height: 32px;">`;
        } else {
            // 使用Font Awesome图标
            const iconClass = getSocialIconClass(social.type);
            iconHtml = `<i class="${iconClass}" style="font-size: 32px;"></i>`;
        }
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(social.name)}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${social.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${social.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body" style="display: flex; align-items: center;">
                <div style="margin-right: 15px; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center;">
                    ${iconHtml}
                </div>
                <div style="flex-grow: 1;">
                    <div class="item-field">
                        <div class="field-label">链接</div>
                        <div class="field-value">
                            <a href="${escapeHtml(social.link)}" target="_blank" class="social-link">${escapeHtml(social.link)}</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editSocial(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此社交媒体吗？')) {
                deleteSocial(id);
            }
        });
    });
}

// 获取社交媒体图标类名
function getSocialIconClass(type) {
    const iconMap = {
        'instagram': 'fab fa-instagram',
        'behance': 'fab fa-behance',
        'github': 'fab fa-github',
        'pinterest': 'fab fa-pinterest',
        'youtube': 'fab fa-youtube',
        'tiktok': 'fab fa-tiktok',
        'rednote': 'fas fa-bookmark', // 小红书没有官方图标，使用通用图标
        'netease': 'fas fa-music', // 网易云音乐没有官方图标，使用通用图标
        'custom': 'fas fa-link'
    };
    
    return iconMap[type] || 'fas fa-link';
}

// 打开社交媒体模态框
function openSocialModal(social = null) {
    const modal = document.getElementById('social-modal');
    const modalTitle = document.getElementById('social-modal-title');
    
    // 重置表单
    document.getElementById('social-type').value = 'instagram';
    document.getElementById('social-custom-icon-group').style.display = 'none';
    document.getElementById('social-custom-icon-preview').src = 'assets/images/placeholder-logo.png';
    document.getElementById('social-name').value = '';
    document.getElementById('social-link').value = '';
    document.getElementById('social-id').value = '';
    document.getElementById('social-icon-path').value = '';
    document.getElementById('social-custom-icon-upload').value = '';
    
    if (social) {
        // 编辑模式
        modalTitle.textContent = '编辑社交媒体';
        document.getElementById('social-type').value = social.type || 'custom';
        document.getElementById('social-name').value = social.name || '';
        document.getElementById('social-link').value = social.link || '';
        document.getElementById('social-id').value = social.id;
        document.getElementById('social-icon-path').value = social.iconPath || '';
        
        if (social.type === 'custom') {
            document.getElementById('social-custom-icon-group').style.display = 'block';
            if (social.iconPath) {
                document.getElementById('social-custom-icon-preview').src = social.iconPath;
            }
        }
    } else {
        // 添加模式
        modalTitle.textContent = '添加社交媒体';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存社交媒体
function saveSocial() {
    // 获取表单数据
    const type = document.getElementById('social-type').value;
    const name = document.getElementById('social-name').value.trim();
    const link = document.getElementById('social-link').value.trim();
    const id = document.getElementById('social-id').value;
    let iconPath = document.getElementById('social-icon-path').value;
    
    // 验证必填字段
    if (!name || !link) {
        showMessage('请填写名称和链接', 'warning');
        return;
    }
    
    // 检查是否有新上传的图标（仅当选择自定义类型时）
    let shouldProcessIcon = false;
    if (type === 'custom') {
        const iconFile = document.getElementById('social-custom-icon-upload').files[0];
        if (iconFile) {
            shouldProcessIcon = true;
            loadImage(iconFile, function(dataUrl) {
                if (dataUrl) {
                    iconPath = dataUrl;
                    saveSocialData(id, type, name, link, iconPath);
                } else {
                    saveSocialData(id, type, name, link, iconPath);
                }
            });
        }
    }
    
    // 如果不需要处理图标，直接保存数据
    if (!shouldProcessIcon) {
        saveSocialData(id, type, name, link, iconPath);
    }
}

// 保存社交媒体数据
function saveSocialData(id, type, name, link, iconPath) {
    // 准备数据
    const social = {
        type,
        name,
        link
    };
    
    // 只有自定义类型才需要保存图标路径
    if (type === 'custom' && iconPath) {
        social.iconPath = iconPath;
    }
    
    if (id) {
        // 编辑模式
        social.id = id;
        const index = websiteData.social.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.social[index] = social;
        }
    } else {
        // 添加模式
        social.id = generateId();
        websiteData.social = websiteData.social || [];
        websiteData.social.push(social);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadSocialItems();
    
    // 关闭模态框
    document.getElementById('social-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '社交媒体已更新' : '社交媒体已添加', 'success');
}

// 编辑社交媒体
function editSocial(id) {
    const social = websiteData.social.find(item => item.id === id);
    if (social) {
        openSocialModal(social);
    }
}

// 删除社交媒体
function deleteSocial(id) {
    websiteData.social = websiteData.social.filter(item => item.id !== id);
    saveWebsiteData();
    loadSocialItems();
    showMessage('社交媒体已删除', 'success');
}

// 添加样式
const socialStyles = document.createElement('style');
socialStyles.textContent = `
.project-link, .social-link {
    word-break: break-all;
    color: var(--admin-primary);
    text-decoration: none;
}

.project-link:hover, .social-link:hover {
    text-decoration: underline;
}
`;
document.head.appendChild(socialStyles); 

// 初始化足迹管理部分
function initFootprintsSection() {
    loadFootprintItems();
    
    document.getElementById('add-footprint').addEventListener('click', () => openFootprintModal());
    document.getElementById('close-footprint-modal').addEventListener('click', () => {
        document.getElementById('footprint-modal').classList.remove('active');
    });
    document.getElementById('save-footprint').addEventListener('click', saveFootprint);
    
    // 初始化拖拽排序
    initSortableItems('footprint-items');
}

// 加载足迹列表
function loadFootprintItems() {
    const container = document.getElementById('footprint-items');
    container.innerHTML = '';
    
    const footprints = websiteData.footprints || [];
    
    if (footprints.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无足迹记录，请点击"添加足迹"按钮添加</p>';
        return;
    }
    
    footprints.forEach(footprint => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', footprint.id);
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(footprint.city)}, ${escapeHtml(footprint.country)}</div>
                <div class="item-actions">
                    <button class="action-btn sort-handle" title="拖拽排序">
                        <i class="fas fa-grip-lines"></i>
                    </button>
                    <button class="action-btn edit-btn" data-id="${footprint.id}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${footprint.id}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">坐标</div>
                    <div class="field-value">纬度: ${footprint.lat}, 经度: ${footprint.lng}</div>
                </div>
                ${footprint.year ? `
                <div class="item-field">
                    <div class="field-label">访问年份</div>
                    <div class="field-value">${escapeHtml(footprint.year)}</div>
                </div>
                ` : ''}
                ${footprint.description ? `
                <div class="item-field">
                    <div class="field-label">描述</div>
                    <div class="field-value">${escapeHtml(footprint.description)}</div>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(itemElement);
        
        // 添加编辑和删除事件
        itemElement.querySelector('.edit-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            editFootprint(id);
        });
        
        itemElement.querySelector('.delete-btn').addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            if (confirm('确定要删除此足迹记录吗？')) {
                deleteFootprint(id);
            }
        });
    });
}

// 打开足迹模态框
function openFootprintModal(footprint = null) {
    const modal = document.getElementById('footprint-modal');
    const modalTitle = document.getElementById('footprint-modal-title');
    
    // 重置表单
    document.getElementById('footprint-city').value = '';
    document.getElementById('footprint-country').value = '';
    document.getElementById('footprint-lat').value = '';
    document.getElementById('footprint-lng').value = '';
    document.getElementById('footprint-year').value = '';
    document.getElementById('footprint-description').value = '';
    document.getElementById('footprint-id').value = '';
    
    if (footprint) {
        // 编辑模式
        modalTitle.textContent = '编辑足迹';
        document.getElementById('footprint-city').value = footprint.city || '';
        document.getElementById('footprint-country').value = footprint.country || '';
        document.getElementById('footprint-lat').value = footprint.lat || '';
        document.getElementById('footprint-lng').value = footprint.lng || '';
        document.getElementById('footprint-year').value = footprint.year || '';
        document.getElementById('footprint-description').value = footprint.description || '';
        document.getElementById('footprint-id').value = footprint.id;
    } else {
        // 添加模式
        modalTitle.textContent = '添加足迹';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存足迹
function saveFootprint() {
    // 获取表单数据
    const city = document.getElementById('footprint-city').value.trim();
    const country = document.getElementById('footprint-country').value.trim();
    const lat = document.getElementById('footprint-lat').value.trim();
    const lng = document.getElementById('footprint-lng').value.trim();
    const year = document.getElementById('footprint-year').value.trim();
    const description = document.getElementById('footprint-description').value.trim();
    const id = document.getElementById('footprint-id').value;
    
    // 验证必填字段
    if (!city || !country) {
        showMessage('请填写城市和国家', 'warning');
        return;
    }
    
    if (!lat || !lng) {
        showMessage('请填写坐标', 'warning');
        return;
    }
    
    // 验证坐标格式
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        showMessage('坐标必须是有效的数字', 'warning');
        return;
    }
    
    // 准备数据
    const footprint = {
        city,
        country,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        year,
        description
    };
    
    if (id) {
        // 编辑模式
        footprint.id = id;
        const index = websiteData.footprints.findIndex(item => item.id === id);
        if (index !== -1) {
            websiteData.footprints[index] = footprint;
        }
    } else {
        // 添加模式
        footprint.id = generateId();
        websiteData.footprints = websiteData.footprints || [];
        websiteData.footprints.push(footprint);
    }
    
    // 保存数据
    saveWebsiteData();
    
    // 刷新列表
    loadFootprintItems();
    
    // 关闭模态框
    document.getElementById('footprint-modal').classList.remove('active');
    
    // 显示成功消息
    showMessage(id ? '足迹已更新' : '足迹已添加', 'success');
}

// 编辑足迹
function editFootprint(id) {
    const footprint = websiteData.footprints.find(item => item.id === id);
    if (footprint) {
        openFootprintModal(footprint);
    }
}

// 删除足迹
function deleteFootprint(id) {
    websiteData.footprints = websiteData.footprints.filter(item => item.id !== id);
    saveWebsiteData();
    loadFootprintItems();
    showMessage('足迹已删除', 'success');
}

// 初始化各模块的拖拽排序功能
function initSortableFunctionality() {
    // 为所有需要排序的容器初始化拖拽功能
    initSortableItems('education-items');
    initSortableItems('experience-items');
    initSortableItems('project-items');
    initSortableItems('paper-items');
    initSortableItems('award-items');
    initSortableItems('social-items');
    initSortableItems('footprint-items');
}

// 初始化特定容器的拖拽排序功能
function initSortableItems(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let items = container.querySelectorAll('.item-card');
    
    items.forEach(item => {
        // 添加拖拽手柄样式（如果还没有）
        if (!item.querySelector('.sort-handle')) {
            const actions = item.querySelector('.item-actions');
            if (actions) {
                const sortHandle = document.createElement('button');
                sortHandle.className = 'action-btn sort-handle';
                sortHandle.title = '拖拽排序';
                sortHandle.innerHTML = '<i class="fas fa-grip-lines"></i>';
                actions.insertBefore(sortHandle, actions.firstChild);
            }
        }
        
        // 添加拖拽事件监听
        const handle = item.querySelector('.sort-handle');
        if (handle) {
            handle.addEventListener('mousedown', function(e) {
                startDrag(e, item, container);
            });
        }
    });
}

// 开始拖拽
function startDrag(e, item, container) {
    e.preventDefault();
    
    // 标记当前正在拖拽的元素
    item.classList.add('dragging');
    
    // 记录起始位置
    const startY = e.clientY;
    const startTop = item.offsetTop;
    const itemHeight = item.offsetHeight;
    
    // 创建半透明的占位元素
    const placeholder = document.createElement('div');
    placeholder.className = 'drag-placeholder';
    placeholder.style.height = itemHeight + 'px';
    container.insertBefore(placeholder, item.nextSibling);
    
    // 设置拖拽样式
    item.style.position = 'absolute';
    item.style.zIndex = '1000';
    item.style.width = item.offsetWidth + 'px';
    item.style.left = item.offsetLeft + 'px';
    item.style.top = startTop + 'px';
    
    // 获取所有其他项目
    const otherItems = Array.from(container.querySelectorAll('.item-card:not(.dragging)'));
    
    // 移动函数
    const onMouseMove = function(e) {
        // 计算拖拽距离
        const deltaY = e.clientY - startY;
        item.style.top = (startTop + deltaY) + 'px';
        
        // 判断是否需要调整顺序
        const currentY = e.clientY;
        let closestItem = null;
        let closestDistance = Number.MAX_VALUE;
        
        otherItems.forEach(otherItem => {
            const box = otherItem.getBoundingClientRect();
            const center = box.top + box.height / 2;
            const distance = Math.abs(currentY - center);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = otherItem;
            }
        });
        
        // 移动占位符到最近的项目前后
        if (closestItem) {
            const box = closestItem.getBoundingClientRect();
            const isAfter = currentY > box.top + box.height / 2;
            
            if (isAfter) {
                container.insertBefore(placeholder, closestItem.nextSibling);
            } else {
                container.insertBefore(placeholder, closestItem);
            }
        }
    };
    
    // 释放拖拽函数
    const onMouseUp = function() {
        // 移除事件监听
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        
        // 恢复样式
        item.classList.remove('dragging');
        item.style.position = '';
        item.style.zIndex = '';
        item.style.width = '';
        item.style.left = '';
        item.style.top = '';
        
        // 移动到占位符位置
        container.insertBefore(item, placeholder);
        
        // 移除占位符
        container.removeChild(placeholder);
        
        // 更新数据顺序
        updateItemsOrder(container.id);
    };
    
    // 添加事件监听
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// 更新数据顺序
function updateItemsOrder(containerId) {
    // 根据容器ID确定数据类型
    let dataType;
    switch (containerId) {
        case 'education-items':
            dataType = 'education';
            break;
        case 'experience-items':
            dataType = 'experience';
            break;
        case 'project-items':
            dataType = 'projects';
            break;
        case 'paper-items':
            dataType = 'papers';
            break;
        case 'award-items':
            dataType = 'awards';
            break;
        case 'social-items':
            dataType = 'social';
            break;
        case 'footprint-items':
            dataType = 'footprints';
            break;
        default:
            return;
    }
    
    // 获取当前DOM顺序的ID
    const container = document.getElementById(containerId);
    const items = container.querySelectorAll('.item-card');
    const newOrder = Array.from(items).map(item => item.getAttribute('data-id'));
    
    // 根据新顺序重新排列数据
    if (websiteData[dataType] && websiteData[dataType].length) {
        const reorderedData = [];
        
        newOrder.forEach(id => {
            const item = websiteData[dataType].find(item => item.id === id);
            if (item) {
                reorderedData.push(item);
            }
        });
        
        // 更新数据
        websiteData[dataType] = reorderedData;
        
        // 保存到localStorage
        saveWebsiteData();
        
        // 显示成功消息
        showMessage('排序已更新', 'success');
    }
}

// 添加拖拽排序相关的样式
const sortableStyles = document.createElement('style');
sortableStyles.textContent = `
.sort-handle {
    cursor: move;
    color: var(--admin-secondary);
}

.sort-handle:hover {
    color: var(--admin-text);
    background-color: rgba(0, 0, 0, 0.05);
}

.dragging {
    opacity: 0.8;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.drag-placeholder {
    background-color: rgba(0, 113, 227, 0.1);
    border: 1px dashed var(--admin-primary);
    border-radius: 10px;
    margin-bottom: 15px;
}

.item-card {
    position: relative;
}
`;
document.head.appendChild(sortableStyles);

// 修改所有加载项目的函数，添加data-id属性和拖拽手柄
const originalLoadEducationItems = window.loadEducationItems;
window.loadEducationItems = function() {
    originalLoadEducationItems();
    initSortableItems('education-items');
}

const originalLoadExperienceItems = window.loadExperienceItems;
window.loadExperienceItems = function() {
    originalLoadExperienceItems();
    initSortableItems('experience-items');
}

const originalLoadProjectItems = window.loadProjectItems;
window.loadProjectItems = function() {
    originalLoadProjectItems();
    initSortableItems('project-items');
}

const originalLoadPaperItems = window.loadPaperItems;
window.loadPaperItems = function() {
    originalLoadPaperItems();
    initSortableItems('paper-items');
}

const originalLoadAwardItems = window.loadAwardItems;
window.loadAwardItems = function() {
    originalLoadAwardItems();
    initSortableItems('award-items');
}

const originalLoadSocialItems = window.loadSocialItems;
window.loadSocialItems = function() {
    originalLoadSocialItems();
    initSortableItems('social-items');
}

// 在页面加载完成后初始化拖拽排序功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化足迹模块
    initFootprintsSection();
    
    // 初始化拖拽排序
    setTimeout(initSortableFunctionality, 1000);
});

// 添加IKEA工作经历样例数据
function addIkeaExampleExperience() {
    console.group('添加示例工作经历数据');
    
    try {
        // 确保数组存在
        websiteData.experience = websiteData.experience || [];
        
        // 检查是否已存在IKEA经历
        let added = 0;
        let skipped = 0;
        
        // 添加IKEA样例数据
        const sampleExperiences = [
            {
                id: generateId(),
                company: 'IKEA China - Digital Innovation Center (IKEA Digital Hub)',
                meta: 'Shanghai | Global Product Collage (GPC) Team | Product Manager, Interaction Designer',
                time: '2024.07 - 2024.12',
                details: '- Used Agile tools like Jira to organize requirements documentation, daily operations, UI design reviews\n- Led the deployment of PPT templates for 20 countries\n- Led the launch of the indoor panorama module\n- AI design tool prototype\n- Collaborated to complete IKEA offline store AR shopping prototype design',
                logoPath: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Ikea_logo.svg'
            },
            {
                id: generateId(),
                company: 'Smart Site360 Mini Program',
                meta: 'Project Lead, Product Manager, UX Designer',
                time: '2024.05 - 2025.05',
                details: '- Conducted user research in multiple architectural colleges\n- Designed a mini program that integrates text, audio, image, and video collection functions\n- The analysis process leverages large language models, LDA topic modeling, and computer vision technology',
                logoPath: 'https://img.icons8.com/color/240/000000/geography--v1.png'
            },
            {
                id: generateId(),
                company: 'Matconstruct Mini Program',
                meta: 'Project Lead, Product Manager, UX Designer',
                time: '2023.05 - 2023.09',
                details: '- Conducted in-depth semi-structured interviews with architecture students\n- Generated user personas based on user needs\n- Optimized the interface design of material detail pages through A/B testing',
                logoPath: 'assets/images/matconstruct.png'
            },
            {
                id: generateId(),
                company: 'Google China Developer Conference',
                meta: 'Shanghai | Gemini AI',
                time: '2025.04',
                details: '- Conducted in-depth semi-structured interviews with architecture students',
                logoPath: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1024px-Google_%22G%22_logo.svg.png'
            }
        ];
        
        // 添加样例数据（避免重复添加）
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
                skipped++;
                console.log(`⏭️ 已跳过: ${sample.company} (已存在)`);
            }
        });
        
        if (added > 0) {
            // 保存数据
            saveWebsiteData();
            
            // 刷新工作经历列表
            loadExperienceItems();
            
            // 显示成功消息
            showMessage(`已添加${added}条示例工作经历数据`, 'success');
        } else if (skipped > 0) {
            showMessage('所有示例数据已存在，无需添加', 'info');
        } else {
            showMessage('没有添加任何数据', 'warning');
        }
        
        console.log(`示例工作经历处理完成。新增: ${added}, 跳过: ${skipped}, 总计: ${websiteData.experience.length}`);
    } catch (error) {
        console.error('添加示例工作经历失败:', error);
        showMessage('添加示例数据失败，请查看控制台获取详细错误信息', 'error');
    }
    
    console.groupEnd();
} 