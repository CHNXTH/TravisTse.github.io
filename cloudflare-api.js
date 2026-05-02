(function () {
    function getWorkerBaseUrl() {
        return (window.TRAVIS_AI_API_URL || '').replace(/\/+$/, '');
    }

    function getApiUrl(path) {
        const base = getWorkerBaseUrl();
        return `${base}${path}`;
    }

    function getAdminToken() {
        return sessionStorage.getItem('cfAdminToken') || '';
    }

    function setAdminToken(token) {
        if (token) {
            sessionStorage.setItem('cfAdminToken', token);
        } else {
            sessionStorage.removeItem('cfAdminToken');
        }
    }

    function handleUnauthorized() {
        // Token expired/invalid: clear both the token and the UI login flag.
        setAdminToken('');
        sessionStorage.removeItem('adminLoggedIn');
        try {
            window.dispatchEvent(new CustomEvent('cf-admin-unauthorized'));
        } catch (_) {
            // ignore
        }
    }

    async function request(path, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        const token = getAdminToken();
        if (token && !headers.Authorization) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(getApiUrl(path), {
            ...options,
            headers,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
            }
            const error = new Error(data && data.error ? data.error : 'Request failed');
            error.status = response.status;
            error.payload = data;
            throw error;
        }

        return data;
    }

    async function login(password) {
        const data = await request('/api/admin/login', {
            method: 'POST',
            body: JSON.stringify({ password }),
        });

        setAdminToken(data.token || '');
        return data;
    }

    async function getAdminContent() {
        return request('/api/admin/content', { method: 'GET' });
    }

    async function saveAdminContent(content) {
        return request('/api/admin/content', {
            method: 'PUT',
            body: JSON.stringify({ content }),
        });
    }

    async function uploadAdminAsset(file) {
        if (!file) {
            throw new Error('Missing file');
        }

        const base = getWorkerBaseUrl();
        if (!base) {
            throw new Error('Missing TRAVIS_AI_API_URL (Worker URL). Please set it in chat-config.js.');
        }

        const token = getAdminToken();
        if (!token) {
            const err = new Error('Missing admin token');
            err.status = 401;
            throw err;
        }

        const form = new FormData();
        form.append('file', file, file.name || 'upload');

        const response = await fetch(getApiUrl('/api/admin/upload'), {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form,
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401) {
                handleUnauthorized();
            }
            let message = data && data.error ? data.error : 'Upload failed';
            if (response.status === 404 && message === 'Not found') {
                message = 'Upload endpoint not found. Please redeploy the Cloudflare Worker to the latest version, then try again.';
            }
            const error = new Error(message);
            error.status = response.status;
            error.payload = data;
            throw error;
        }

        return data;
    }

    async function getPublicContent() {
        return request('/api/content', { method: 'GET' });
    }

    async function polishKnowledge(payload) {
        return request('/api/admin/knowledge/polish', {
            method: 'POST',
            body: JSON.stringify(payload || {}),
        });
    }

    function logout() {
        setAdminToken('');
    }

    window.cloudflareApi = {
        getApiUrl,
        getAdminToken,
        setAdminToken,
        login,
        getAdminContent,
        saveAdminContent,
        uploadAdminAsset,
        getPublicContent,
        polishKnowledge,
        logout,
    };
})();
