// Navigation metadata never enters the message renderer.
(() => {
    let interaction = 0;
    let lastTarget = null;
    const desktop = () => matchMedia('(min-width: 769px)').matches;
    window.addEventListener('wheel', event => {
        if (!event.target.closest?.('#ai-chat-container')) interaction++;
    }, { passive: true });
    window.addEventListener('pointerdown', event => {
        if (!event.target.closest?.('#ai-chat-container, #floating-chat-button')) interaction++;
    }, { passive: true });
    window.addEventListener('keydown', event => {
        if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)
            && !event.target.closest?.('input, textarea, #ai-chat-container')) interaction++;
    });
    const sections = [
        ['profile', null], ['education', '.education-item'], ['experience', '.experience-item'],
        ['projects', '.project-item'], ['papers', '.timeline-item'],
        ['awards', '.timeline-item'], ['footprints', null], ['social', null]
    ];
    window.travisChatNavigation = {
        begin(message = '') {
            if (!desktop() || /比较|对比|区别|共同|重叠|异同|简短|精简|换个说法|重写|改写|再说一遍|\bcompare\b|\bversus\b|\bvs\b|\brephrase\b|\bshorter\b/i.test(message)) return null;
            const nodes = new Map();
            const targets = [];
            for (const [section, selector] of sections) {
                const root = section === 'profile' ? document.querySelector('.hero') : section === 'projects' ? document.querySelector('.projects-carousel') : document.getElementById(section);
                if (!root) continue;
                const add = (id, node, label) => {
                    nodes.set(id, node);
                    targets.push({ id, label: label.trim().slice(0, 350) });
                };
                add(section, root, root.querySelector('.section-title')?.textContent || section);
                if (selector) root.querySelectorAll(selector).forEach((node, index) => {
                    add(`${section}:${index}`, node, node.querySelector('h3')?.textContent || node.textContent);
                });
            }
            return { targets, nodes, interaction };
        },
        apply(id, request) {
            if (!desktop() || !request || interaction !== request.interaction || typeof id !== 'string') return;
            const node = request.nodes.get(id);
            if (!node?.isConnected || lastTarget === node) return;
            lastTarget = node;
            if (id === 'footprints' || id === 'social') {
                document.querySelector(`.nav-link[href="#${id}"]`)?.click();
                return;
            }
            const toggle = node.querySelector('.experience-toggle');
            if (toggle?.getAttribute('aria-expanded') === 'false') toggle.click();
            const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
            requestAnimationFrame(() => {
                if (interaction !== request.interaction) return;
                const header = document.querySelector('header')?.getBoundingClientRect();
                window.scrollTo({ top: Math.max(0, scrollY + node.getBoundingClientRect().top - (header?.bottom || 80) - 24), behavior: reduced ? 'instant' : 'smooth' });
                if (id.startsWith('projects:')) node.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduced ? 'instant' : 'smooth' });
                node.classList.add('travis-ai-target-highlight');
                setTimeout(() => node.classList.remove('travis-ai-target-highlight'), 2400);
            });
        }
    };
})();
