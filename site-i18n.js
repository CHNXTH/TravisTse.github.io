/* Record-owned translations. Root fields remain the original English data. */
(function (root) {
    const fields = {
        education: ['school', 'meta', 'details', 'research', 'stats', 'awards'],
        experience: ['company', 'meta', 'details'],
        papers: ['title', 'authors'], awards: ['title', 'details'],
        profile: ['nameEn', 'summaryEn', 'location']
    };
    let converter;
    function traditional(value) {
        if (Array.isArray(value)) return value.map(traditional);
        if (typeof value !== 'string') return value;
        converter ||= root.OpenCC.Converter({ from: 'cn', to: 'tw' });
        return converter(value);
    }
    function chinese(type, record) {
        const result = { ...(record.i18n?.['zh-CN'] || {}) };
        if (type === 'profile') {
            if (result.nameEn == null && record.nameZh) result.nameEn = record.nameZh;
            if (result.summaryEn == null && record.summaryZh) result.summaryEn = record.summaryZh;
        }
        return result;
    }
    function view(type, record, lang = document.documentElement.lang, fallback = true) {
        const result = { ...record };
        if (!lang.startsWith('zh')) return result;
        const cn = chinese(type, record);
        for (const field of fields[type]) {
            const value = cn[field];
            const present = Array.isArray(value) ? value.length > 0 : Boolean(value);
            result[field] = present ? (lang === 'zh-TW' ? traditional(value) : value) : (fallback ? record[field] : '');
        }
        return result;
    }
    root.SiteI18n = { fields, traditional, chinese, view };
})(globalThis);
