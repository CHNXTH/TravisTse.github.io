// 后台管理系统JavaScript - 第三部分：项目、论文、奖项和社交媒体模块

// 初始化个人内容库（用于聊天助手 RAG）
function initKnowledgeSection() {
    loadKnowledgeItems();

    const addBtn = document.getElementById('add-knowledge');
    const closeBtn = document.getElementById('close-knowledge-modal');
    const saveBtn = document.getElementById('save-knowledge');
    const polishBtn = document.getElementById('polish-knowledge');
    const searchInput = document.getElementById('knowledge-search');

    if (addBtn) addBtn.addEventListener('click', () => openKnowledgeModal());
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('knowledge-modal').classList.remove('active');
    });
    if (saveBtn) saveBtn.addEventListener('click', saveKnowledgeCard);
    if (polishBtn) polishBtn.addEventListener('click', polishKnowledgeSummary);
    if (searchInput) searchInput.addEventListener('input', () => loadKnowledgeItems(searchInput.value));
}

function loadKnowledgeItems(query = '') {
    const container = document.getElementById('knowledge-items');
    if (!container) return;
    container.innerHTML = '';

    const cards = Array.isArray(websiteData.knowledgeCards) ? websiteData.knowledgeCards : [];
    const q = String(query || '').trim().toLowerCase();

    const filtered = !q ? cards : cards.filter((c) => {
        const hay = `${c.title || ''} ${(c.tags || []).join(',')} ${c.summary || ''}`.toLowerCase();
        return hay.includes(q);
    });

    const sorted = [...filtered].sort((a, b) => {
        const pa = Number(a.priority || 0);
        const pb = Number(b.priority || 0);
        if (pb !== pa) return pb - pa;
        return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });

    if (sorted.length === 0) {
        container.innerHTML = '<p class="empty-message">暂无内容卡片。你可以点“添加内容卡片”来创建一条，用于聊天助手检索。</p>';
        return;
    }

    sorted.forEach((card) => {
        const item = document.createElement('div');
        item.className = 'item-card fade-in';
        item.setAttribute('data-id', card.id);

        const enabled = card.enabled !== false;
        const tags = Array.isArray(card.tags) ? card.tags : [];
        const links = Array.isArray(card.links) ? card.links : [];

        item.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(card.title || 'Untitled')}</div>
                <div class="item-actions">
                    <button class="action-btn edit-btn" data-id="${escapeHtml(card.id)}" title="编辑">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${escapeHtml(card.id)}" title="删除">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
            <div class="item-body">
                <div class="item-field">
                    <div class="field-label">状态</div>
                    <div class="field-value">${enabled ? '启用' : '停用'} · 优先级 ${Number(card.priority || 0)}</div>
                </div>
                <div class="item-field">
                    <div class="field-label">标签</div>
                    <div class="field-value">${escapeHtml(tags.join(', '))}</div>
                </div>
                <div class="item-field">
                    <div class="field-label">摘要</div>
                    <div class="field-value">${escapeHtml(card.summary || '')}</div>
                </div>
                ${links.length ? `
                <div class="item-field">
                    <div class="field-label">链接</div>
                    <div class="field-value">${links.map((u) => `<a href="${escapeHtml(u)}" target="_blank">${escapeHtml(u)}</a>`).join('<br>')}</div>
                </div>` : ''}
            </div>
        `;

        container.appendChild(item);

        item.querySelector('.edit-btn').addEventListener('click', () => editKnowledgeCard(card.id));
        item.querySelector('.delete-btn').addEventListener('click', () => {
            if (confirm('确定要删除此内容卡片吗？')) deleteKnowledgeCard(card.id);
        });
    });
}

function openKnowledgeModal(card = null) {
    const modal = document.getElementById('knowledge-modal');
    const title = document.getElementById('knowledge-modal-title');

    document.getElementById('knowledge-title').value = '';
    document.getElementById('knowledge-tags').value = '';
    document.getElementById('knowledge-summary').value = '';
    document.getElementById('knowledge-content').value = '';
    document.getElementById('knowledge-links').value = '';
    document.getElementById('knowledge-lang').value = '';
    document.getElementById('knowledge-priority').value = 0;
    document.getElementById('knowledge-enabled').checked = true;
    document.getElementById('knowledge-id').value = '';

    if (card) {
        title.textContent = '编辑内容卡片';
        document.getElementById('knowledge-title').value = card.title || '';
        document.getElementById('knowledge-tags').value = (Array.isArray(card.tags) ? card.tags : []).join(', ');
        document.getElementById('knowledge-summary').value = card.summary || '';
        document.getElementById('knowledge-content').value = card.content || '';
        document.getElementById('knowledge-links').value = (Array.isArray(card.links) ? card.links : []).join('\n');
        document.getElementById('knowledge-lang').value = card.lang || '';
        document.getElementById('knowledge-priority').value = Number(card.priority || 0);
        document.getElementById('knowledge-enabled').checked = card.enabled !== false;
        document.getElementById('knowledge-id').value = card.id;
    } else {
        title.textContent = '添加内容卡片';
    }

    modal.classList.add('active');
}

function saveKnowledgeCard() {
    const title = document.getElementById('knowledge-title').value.trim();
    const tagsRaw = document.getElementById('knowledge-tags').value.trim();
    const summary = document.getElementById('knowledge-summary').value.trim();
    const content = document.getElementById('knowledge-content').value.trim();
    const linksRaw = document.getElementById('knowledge-links').value.trim();
    const lang = document.getElementById('knowledge-lang').value.trim();
    const priority = Number(document.getElementById('knowledge-priority').value || 0);
    const enabled = document.getElementById('knowledge-enabled').checked;
    const id = document.getElementById('knowledge-id').value.trim();

    if (!title) {
        showMessage('请填写标题', 'warning');
        return;
    }
    if (!summary && !content) {
        showMessage('请至少填写摘要或全文', 'warning');
        return;
    }

    const tags = tagsRaw
        ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    const links = linksRaw
        ? linksRaw.split('\n').map((t) => t.trim()).filter(Boolean)
        : [];

    const card = {
        id: id || generateId(),
        title,
        tags,
        summary,
        content,
        links,
        lang,
        priority,
        enabled,
        updatedAt: new Date().toISOString()
    };

    websiteData.knowledgeCards = Array.isArray(websiteData.knowledgeCards) ? websiteData.knowledgeCards : [];
    const idx = websiteData.knowledgeCards.findIndex((c) => c.id === card.id);
    if (idx >= 0) websiteData.knowledgeCards[idx] = card;
    else websiteData.knowledgeCards.push(card);

    saveWebsiteData();
    loadKnowledgeItems(document.getElementById('knowledge-search')?.value || '');
    document.getElementById('knowledge-modal').classList.remove('active');
    showMessage(id ? '内容卡片已更新' : '内容卡片已添加', 'success');
}

function editKnowledgeCard(id) {
    const cards = Array.isArray(websiteData.knowledgeCards) ? websiteData.knowledgeCards : [];
    const card = cards.find((c) => c.id === id);
    if (card) openKnowledgeModal(card);
}

function deleteKnowledgeCard(id) {
    websiteData.knowledgeCards = (Array.isArray(websiteData.knowledgeCards) ? websiteData.knowledgeCards : []).filter((c) => c.id !== id);
    saveWebsiteData();
    loadKnowledgeItems(document.getElementById('knowledge-search')?.value || '');
    showMessage('内容卡片已删除', 'success');
}

async function polishKnowledgeSummary() {
    const content = document.getElementById('knowledge-content').value.trim();
    const summaryEl = document.getElementById('knowledge-summary');
    const title = document.getElementById('knowledge-title').value.trim();

    if (!content && !title) {
        showMessage('请先填写标题或全文，再用 AI 润色摘要', 'warning');
        return;
    }

    try {
        if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi && window.cloudflareApi.getAdminToken()) {
            const res = await window.cloudflareApi.polishKnowledge({
                title,
                content,
                summary: summaryEl.value.trim()
            });
            if (res && res.summary) summaryEl.value = res.summary;
            if (res && Array.isArray(res.tags)) {
                document.getElementById('knowledge-tags').value = res.tags.join(', ');
            }
            showMessage('已用 AI 生成/润色摘要', 'success');
            return;
        }
        showMessage('未启用 Cloudflare 管理端，无法调用 AI 润色。请先在云端部署 Worker。', 'warning');
    } catch (e) {
        console.error('润色摘要失败:', e);
        showMessage(`润色摘要失败: ${e.message}`, 'error');
    }
}

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
            const url = URL.createObjectURL(file);
            document.getElementById('project-image-preview').src = url;
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
        (async () => {
            try {
                if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi && window.cloudflareApi.getAdminToken()) {
                    const uploaded = await window.cloudflareApi.uploadAdminAsset(imageFile);
                    imagePath = uploaded.url;
                    saveProjectData(id, title, link, imagePath);
                    return;
                }

                loadImage(imageFile, function(dataUrl) {
                    if (dataUrl) {
                        imagePath = dataUrl;
                    }
                    saveProjectData(id, title, link, imagePath);
                });
            } catch (e) {
                console.error('项目图片上传失败:', e);
                showMessage(`项目图片上传失败: ${e.message}`, 'error');
            }
        })();
        return;
    }

    saveProjectData(id, title, link, imagePath);
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
            const url = URL.createObjectURL(file);
            document.getElementById('social-custom-icon-preview').src = url;
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
            (async () => {
                try {
                    if (USE_CLOUDFLARE_ADMIN && window.cloudflareApi && window.cloudflareApi.getAdminToken()) {
                        const uploaded = await window.cloudflareApi.uploadAdminAsset(iconFile);
                        iconPath = uploaded.url;
                        saveSocialData(id, type, name, link, iconPath);
                        return;
                    }

                    loadImage(iconFile, function(dataUrl) {
                        if (dataUrl) {
                            iconPath = dataUrl;
                        }
                        saveSocialData(id, type, name, link, iconPath);
                    });
                } catch (e) {
                    console.error('社交图标上传失败:', e);
                    showMessage(`社交图标上传失败: ${e.message}`, 'error');
                }
            })();
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

    const intensity = document.getElementById('footprint-intensity');
    const intensityValue = document.getElementById('footprint-intensity-value');
    if (intensity && intensityValue) {
        intensity.addEventListener('input', () => {
            intensityValue.textContent = String(intensity.value || '2');
        });
    }

    initFootprintsPlaceSearch();
    initFootprintsImagePreview();
    
    // 初始化拖拽排序
    initSortableItems('footprint-items');
}

function initFootprintsPlaceSearch() {
    const input = document.getElementById('footprint-place-query');
    const results = document.getElementById('footprint-place-results');
    const meta = document.getElementById('footprint-place-selected-meta');
    if (!input || !results || !meta) return;

    let abort = null;
    let debounceId = 0;

    const setHidden = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.value = v == null ? '' : String(v);
    };

    const clearSelection = () => {
        setHidden('footprint-place-id', '');
        setHidden('footprint-place-displayName', '');
        setHidden('footprint-place-city', '');
        setHidden('footprint-place-country', '');
        setHidden('footprint-place-countryCode', '');
        setHidden('footprint-place-lat', '');
        setHidden('footprint-place-lng', '');
        meta.textContent = '';
    };

    const renderResults = (items) => {
        if (!items || items.length === 0) {
            results.classList.remove('active');
            results.innerHTML = '';
            return;
        }
        results.innerHTML = items.map((it, idx) => {
            const label = escapeHtml(it.label || '');
            const extra = escapeHtml(it.extra || '');
            return `<div class="place-search-item" data-idx="${idx}"><div>${label}</div><div style="margin-top:4px;font-size:12px;opacity:.75;">${extra}</div></div>`;
        }).join('');
        results.classList.add('active');

        Array.from(results.querySelectorAll('.place-search-item')).forEach((el) => {
            el.addEventListener('click', () => {
                const idx = Number(el.getAttribute('data-idx') || '0');
                const picked = items[idx];
                if (!picked) return;
                input.value = picked.label || '';
                setHidden('footprint-place-id', picked.id || '');
                setHidden('footprint-place-displayName', picked.label || '');
                // Prefer a meaningful city field; fall back to label (without country) if needed.
                const city = picked.city || (picked.label ? String(picked.label).split(',')[0].trim() : '');
                setHidden('footprint-place-city', city);
                setHidden('footprint-place-country', picked.country || '');
                setHidden('footprint-place-countryCode', picked.countryCode || '');
                setHidden('footprint-place-lat', picked.lat);
                setHidden('footprint-place-lng', picked.lng);
                meta.textContent = `Lat: ${picked.lat}  Lng: ${picked.lng}`;
                results.classList.remove('active');
                results.innerHTML = '';
            });
        });
    };

    const query = async (q) => {
        if (abort) abort.abort();
        abort = new AbortController();
        if (!window.cloudflareApi || !window.cloudflareApi.searchPlaces) {
            throw new Error('Missing cloudflareApi.searchPlaces');
        }
        const data = await window.cloudflareApi.searchPlaces(q);
        const mapped = (data && data.results) ? data.results : [];
        renderResults(mapped);
    };

    input.addEventListener('input', () => {
        const q = String(input.value || '').trim();
        clearSelection();
        if (debounceId) window.clearTimeout(debounceId);
        if (q.length < 2) {
            renderResults([]);
            return;
        }
        debounceId = window.setTimeout(() => {
            query(q).catch((e) => {
                console.warn('Place search error:', e);
                renderResults([]);
            });
        }, 220);
    });

    document.addEventListener('click', (e) => {
        if (!results.classList.contains('active')) return;
        const t = e.target;
        if (t === input || results.contains(t)) return;
        results.classList.remove('active');
    });
}

function initFootprintsImagePreview() {
    const file = document.getElementById('footprint-image-file');
    const url = document.getElementById('footprint-image-url');
    const preview = document.getElementById('footprint-image-preview');
    if (!file || !url || !preview) return;

    const render = (src) => {
        preview.innerHTML = src ? `<img src="${src}" alt="">` : '';
    };

    file.addEventListener('change', () => {
        const f = file.files && file.files[0];
        if (!f) return render('');
        const reader = new FileReader();
        reader.onload = () => {
            render(reader.result);
        };
        reader.readAsDataURL(f);
    });

    url.addEventListener('input', () => {
        const v = String(url.value || '').trim();
        if (!v) return;
        render(v);
    });
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
        const place = footprint && footprint.place ? footprint.place : null;
        const title = place && place.displayName
            ? place.displayName
            : `${footprint.city || ''}${footprint.country ? ', ' + footprint.country : ''}`;
        const lat = place && isFinite(place.lat) ? place.lat : footprint.lat;
        const lng = place && isFinite(place.lng) ? place.lng : footprint.lng;
        const visitedAt = footprint.visitedAt || footprint.year || '';

        const itemElement = document.createElement('div');
        itemElement.className = 'item-card fade-in';
        itemElement.setAttribute('data-id', footprint.id);
        
        itemElement.innerHTML = `
            <div class="item-header">
                <div class="item-title">${escapeHtml(title)}</div>
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
                    <div class="field-value">Lat: ${lat}, Lng: ${lng}</div>
                </div>
                ${visitedAt ? `
                <div class="item-field">
                    <div class="field-label">Time</div>
                    <div class="field-value">${escapeHtml(visitedAt)}</div>
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
    document.getElementById('footprint-place-query').value = '';
    document.getElementById('footprint-place-results').classList.remove('active');
    document.getElementById('footprint-place-results').innerHTML = '';
    document.getElementById('footprint-place-selected-meta').textContent = '';
    document.getElementById('footprint-visitedAt').value = '';
    document.getElementById('footprint-intensity').value = '2';
    document.getElementById('footprint-intensity-value').textContent = '2';
    document.getElementById('footprint-description').value = '';
    document.getElementById('footprint-image-file').value = '';
    document.getElementById('footprint-image-url').value = '';
    document.getElementById('footprint-image-preview').innerHTML = '';
    document.getElementById('footprint-id').value = '';

    document.getElementById('footprint-place-id').value = '';
    document.getElementById('footprint-place-displayName').value = '';
    document.getElementById('footprint-place-city').value = '';
    document.getElementById('footprint-place-country').value = '';
    document.getElementById('footprint-place-countryCode').value = '';
    document.getElementById('footprint-place-lat').value = '';
    document.getElementById('footprint-place-lng').value = '';
    
    if (footprint) {
        // 编辑模式
        modalTitle.textContent = '编辑足迹';
        const place = footprint.place || null;
        const displayName = place && place.displayName
            ? place.displayName
            : `${footprint.city || ''}${footprint.country ? ', ' + footprint.country : ''}`;

        document.getElementById('footprint-place-query').value = displayName;
        document.getElementById('footprint-place-id').value = place && place.id ? place.id : '';
        document.getElementById('footprint-place-displayName').value = displayName;
        document.getElementById('footprint-place-city').value = place && place.city ? place.city : (footprint.city || '');
        document.getElementById('footprint-place-country').value = place && place.country ? place.country : (footprint.country || '');
        document.getElementById('footprint-place-countryCode').value = place && place.countryCode ? place.countryCode : '';
        document.getElementById('footprint-place-lat').value = place && isFinite(place.lat) ? place.lat : (footprint.lat || '');
        document.getElementById('footprint-place-lng').value = place && isFinite(place.lng) ? place.lng : (footprint.lng || '');
        document.getElementById('footprint-place-selected-meta').textContent = `Lat: ${document.getElementById('footprint-place-lat').value}  Lng: ${document.getElementById('footprint-place-lng').value}`;

        document.getElementById('footprint-visitedAt').value = footprint.visitedAt || footprint.year || '';
        document.getElementById('footprint-intensity').value = String(footprint.intensity || 2);
        document.getElementById('footprint-intensity-value').textContent = String(footprint.intensity || 2);
        document.getElementById('footprint-description').value = footprint.description || '';
        document.getElementById('footprint-id').value = footprint.id;

        const imageUrl =
            (footprint.image && typeof footprint.image === 'object' ? (footprint.image.url || '') : footprint.image) ||
            footprint.imageUrl ||
            '';
        if (imageUrl) {
            document.getElementById('footprint-image-url').value = imageUrl;
            document.getElementById('footprint-image-preview').innerHTML = `<img src="${imageUrl}" alt="">`;
        }
    } else {
        // 添加模式
        modalTitle.textContent = '添加足迹';
    }
    
    // 显示模态框
    modal.classList.add('active');
}

// 保存足迹
async function saveFootprint() {
    // 获取表单数据
    const placeId = document.getElementById('footprint-place-id').value.trim();
    const displayName = document.getElementById('footprint-place-displayName').value.trim() || document.getElementById('footprint-place-query').value.trim();
    const city = document.getElementById('footprint-place-city').value.trim();
    const country = document.getElementById('footprint-place-country').value.trim();
    const countryCode = document.getElementById('footprint-place-countryCode').value.trim();
    const lat = document.getElementById('footprint-place-lat').value.trim();
    const lng = document.getElementById('footprint-place-lng').value.trim();
    const visitedAt = document.getElementById('footprint-visitedAt').value.trim();
    const intensity = Number(document.getElementById('footprint-intensity').value || 2);
    const description = document.getElementById('footprint-description').value.trim();
    const id = document.getElementById('footprint-id').value;
    const imageUrl = document.getElementById('footprint-image-url').value.trim();
    const imageFile = (document.getElementById('footprint-image-file').files || [])[0];
    
    // 验证必填字段
    if (!displayName || !lat || !lng) {
        showMessage('请先搜索并选择城市（会自动填充坐标）', 'warning');
        return;
    }
    
    // 验证坐标格式
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
        showMessage('坐标必须是有效的数字', 'warning');
        return;
    }
    
    let finalImageUrl = imageUrl;
    if (imageFile) {
        try {
            if (window.cloudflareApi && window.cloudflareApi.uploadAdminAsset) {
                const uploaded = await window.cloudflareApi.uploadAdminAsset(imageFile);
                finalImageUrl = uploaded && uploaded.url ? uploaded.url : finalImageUrl;
            }
        } catch (e) {
            console.error('上传图片失败:', e);
            showMessage('图片上传失败: ' + (e.message || 'Unknown error'), 'error');
            return;
        }
    }

    // 准备数据
    const footprint = {
        place: {
            id: placeId || '',
            displayName,
            city,
            country,
            countryCode,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            source: placeId ? 'photon' : 'manual'
        },
        visitedAt,
        description,
        intensity: isFinite(intensity) ? intensity : 2,
        image: finalImageUrl ? { url: finalImageUrl, mode: imageFile ? 'upload' : 'url' } : { url: '', mode: '' }
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

// 已移除“工作经历示例数据”注入逻辑，避免污染真实内容源与云端同步。
