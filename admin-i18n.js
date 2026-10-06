/* Language drafts are local until the existing revision-checked cloud save succeeds. */
(function () {
    const configs = {
        profile: { prefix: '', inputs: {nameEn:'name-en',summaryEn:'summary-en',location:'location'}, shared:{age:'age',phone:'phone',email:'email'} },
        education: {prefix:'edu', modal:'education', open:'openEducationModal', list:'loadEducationItems', shared:{time:'edu-time'}},
        experience: {prefix:'exp', modal:'experience', open:'openExperienceModal', list:'loadExperienceItems', shared:{time:'exp-time',logoPath:'exp-logo-path'}},
        papers: {prefix:'paper', modal:'paper', open:'openPaperModal', list:'loadPaperItems', shared:{time:'paper-time',link:'paper-link'}},
        awards: {prefix:'award', modal:'award', open:'openAwardModal', list:'loadAwardItems', shared:{time:'award-time'}}
    };
    const states = {};
    const clone = value => structuredClone(value);
    const input = id => document.getElementById(id);
    for (const [type,c] of Object.entries(configs)) {
        c.inputs ||= Object.fromEntries(SiteI18n.fields[type].map(field => [field,`${c.prefix}-${field}`]));
        states[type] = { lang:'en', draft:null, busy:false };
    }
    function capture(type) {
        const s=states[type], c=configs[type];
        if (!s.draft) return;
        for (const [field,id] of Object.entries(c.shared)) s.draft[field]=input(id).value.trim();
        if(type==='experience') s.draft.logoInvertOnDark=input('exp-logo-invert').checked;
        if(s.lang==='zh-TW') return;
        const target=s.lang==='en' ? s.draft : (s.draft.i18n ||= {}, s.draft.i18n['zh-CN'] ||= SiteI18n.chinese(type,s.draft));
        for (const [field,id] of Object.entries(c.inputs)) {
            const value=input(id).value.trim();
            target[field]=type==='experience' && field==='details' ? experienceDetailsFromText(value) : value;
        }
        for (const [field,id] of Object.entries(c.shared)) s.draft[field]=input(id).value.trim();
        if(type==='experience') s.draft.logoInvertOnDark=input('exp-logo-invert').checked;
        if(type==='profile' && s.lang==='zh-CN') {
            s.draft.nameZh=target.nameEn; s.draft.summaryZh=target.summaryEn;
        }
    }
    function fill(type) {
        const s=states[type],c=configs[type];
        document.querySelectorAll(`[data-i18n-module="${type}"] button`).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===s.lang)));
        if(!s.draft) return;
        const view=SiteI18n.view(type,s.draft,s.lang,false);
        for (const [field,id] of Object.entries(c.inputs)) {
            const el=input(id),value=view[field];
            el.value=Array.isArray(value)?value.join('\n'):(value||'');
            el.readOnly=s.lang==='zh-TW';
            el.placeholder=s.lang==='zh-TW'?'由简体中文自动转换':s.lang==='zh-CN'?'填写简体中文；留空时前台使用英文':'';
        }
        for(const [field,id] of Object.entries(c.shared)) { input(id).value=s.draft[field]||''; input(id).readOnly=false; }
        document.querySelectorAll(`[data-i18n-module="${type}"] button`).forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.lang===s.lang));b.disabled=s.busy;});
    }
    function begin(type,record) { states[type].draft=clone(record||{});fill(type); }
    function tabs(type) {
        const bar=document.createElement('div');bar.className='content-language-tabs';bar.dataset.i18nModule=type;
        for(const [lang,label] of [['en','English'],['zh-CN','简体中文'],['zh-TW','繁體中文']]) {
            const b=document.createElement('button');b.type='button';b.dataset.lang=lang;b.textContent=label;b.setAttribute('aria-pressed',String(lang==='en'));
            b.addEventListener('click',()=>{capture(type);states[type].lang=lang;fill(type);if(configs[type].list) window[configs[type].list]();});bar.append(b);
        }
        const note=document.createElement('p');note.textContent='英文、简体分别维护；繁体由简体自动转换。日期、链接与图片三种语言共用。';bar.append(note);return bar;
    }
    async function save(type,button) {
        const s=states[type],c=configs[type];if(s.busy)return;
        capture(type);const draft=clone(s.draft || {});
        const first=SiteI18n.fields[type][0],cn=SiteI18n.chinese(type,draft);
        if(!draft[first]&&!cn[first]) {showMessage('请至少填写英文或简体中文名称','warning');return;}
        if((type==='papers'||type==='awards')&&!draft.time){showMessage('请填写时间','warning');return;}
        s.busy=true;button.disabled=true;fill(type);
        // Lock the editor during upload/save so edits cannot be silently lost.
        const container=type==='profile'?input('profile-section'):input(c.modal+'-modal');
        const controls=[...container.querySelectorAll('input,textarea,button,select')];
        const disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);
        const previous=clone(websiteData[type]);
        try {
            if(type==='experience') {
                const file=input('exp-logo-upload').files[0];
                if(file) { const uploaded=await window.cloudflareApi.uploadAdminAsset(file);draft.logoPath=uploaded.url; }
            }
            if(type==='profile') {
                // Avatar uploads are independent from the text draft.
                draft.avatar=websiteData.profile?.avatar;
                draft.flipAvatar=websiteData.profile?.flipAvatar;
                websiteData.profile=draft;
            }
            else {
                const records=websiteData[type] ||= [];
                if(!draft.id) draft.id=generateId();
                const index=records.findIndex(r=>r.id===draft.id);
                if(index<0) records.push(draft);else records[index]=draft;
            }
            if(!await saveWebsiteData()) {websiteData[type]=previous;showMessage('保存未成功，输入已保留，请重试','error');return;}
            s.draft=clone(draft);
            if(c.list) window[c.list]();
            if(c.modal) input(c.modal+'-modal').classList.remove('active');
            showMessage('英文与简体已保存，繁体自动同步','success');
        } catch(error) {websiteData[type]=previous;showMessage(`保存失败，输入已保留：${error.message}`,'error');}
        finally {controls.forEach((el,i)=>el.disabled=disabled[i]);s.busy=false;button.disabled=false;fill(type);}
    }
    // Install before initSection registers its event listeners.
    for(const [type,c] of Object.entries(configs)) {
        if(c.open) {const original=window[c.open];window[c.open]=function(record){original(record);begin(type,record);};}
        if(c.list) {const original=window[c.list];window[c.list]=function(){const source=websiteData[type];try{websiteData[type]=(source||[]).map(r=>SiteI18n.view(type,r,states[type].lang));return original();}finally{websiteData[type]=source;}};}
    }
    const init=window.initProfileSection;
    window.initProfileSection=function(){init();begin('profile',websiteData.profile);};
    const refresh=window.refreshAdminSections;
    window.refreshAdminSections=function(){refresh();begin('profile',websiteData.profile);};
    document.addEventListener('DOMContentLoaded',()=>{
        const css=document.createElement('style');css.textContent='.content-language-tabs{margin:16px 0 22px;display:flex;gap:8px;flex-wrap:wrap}.content-language-tabs button{padding:8px 16px;border:1px solid #777;border-radius:6px;background:transparent;color:inherit;cursor:pointer}.content-language-tabs button[aria-pressed="true"]{background:#285ac8;color:white;border-color:#285ac8}.content-language-tabs p{flex-basis:100%;font-size:13px;opacity:.75;margin:4px 0}.content-language-tabs button:focus-visible{outline:3px solid #79a6ff}';document.head.append(css);
        for(const [type,c] of Object.entries(configs)) {
            const section=input(type+'-section');section.querySelector('.section-title').after(tabs(type));
            if(c.modal) input(c.modal+'-modal').querySelector('.modal-body').prepend(tabs(type));
            const button=input('save-'+(c.modal||type));
            button.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();save(type,button);},true);
        }
        for(const id of ['name-zh','summary-zh']) input(id).closest('.form-group').hidden=true;
        document.querySelector('label[for="name-en"]').textContent='姓名';
        document.querySelector('label[for="summary-en"]').textContent='个人简介';
    });
})();
