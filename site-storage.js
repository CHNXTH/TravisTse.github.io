// Storage is isolated by site identity, not URL path (GitHub Pages shares an origin).
// Legacy shared keys are intentionally neither imported nor deleted: they may belong
// to Cristy or contain unsaved drafts. Cloudflare is the source of published content.
(function () {
    const prefix = 'travis-tse:v1:';
    function scopedStorage(kind) {
        const memory = new Map();
        let available = true;
        function keys() {
            const result = new Set(memory.keys());
            try {
                const storage = window[kind];
                for (let i = 0; i < storage.length; i++) {
                    const key = storage.key(i);
                    if (key && key.startsWith(prefix)) result.add(key.slice(prefix.length));
                }
            } catch (_) { available = false; }
            return [...result];
        }
        return {
            physicalKey: key => prefix + key,
            get persistent() { return available; },
            get length() { return keys().length; },
            key: index => keys()[index] ?? null,
            getItem(key) {
                key = String(key);
                if (memory.has(key)) return memory.get(key);
                try { return window[kind].getItem(prefix + key); }
                catch (_) { available = false; return null; }
            },
            setItem(key, value) {
                key = String(key); value = String(value);
                try {
                    window[kind].setItem(prefix + key, value);
                    memory.delete(key);
                } catch (_) {
                    available = false;
                    memory.set(key, value);
                }
            },
            removeItem(key) {
                key = String(key);
                try { window[kind].removeItem(prefix + key); memory.delete(key); }
                catch (_) { available = false; memory.set(key, null); }
            }
        };
    }
    window.travisStorage = scopedStorage('localStorage');
    window.travisSessionStorage = scopedStorage('sessionStorage');
})();
