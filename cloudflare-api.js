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

    async function getPublicContent() {
        return request('/api/content', { method: 'GET' });
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
        getPublicContent,
        logout,
    };
})();
