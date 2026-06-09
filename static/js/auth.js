(() => {
    const config = window.FREATE_DROP_AUTH;
    if (!config?.mode) {
        return;
    }

    const form = document.getElementById(`${config.mode}-form`);
    const status = document.getElementById('auth-status');

    form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const endpoint = config.mode === 'register' ? '/api/auth/register/' : '/api/auth/login/';

        const response = await window.FreateDrop.apiFetch(endpoint, {
            method: 'POST',
            body: formData,
        });
        const data = await response.json();

        if (!response.ok) {
            const firstError = Object.values(data.errors || {}).flat()[0] || data.error || 'Unable to continue.';
            window.FreateDrop.showStatus(status, firstError, 'error');
            return;
        }

        window.FreateDrop.showStatus(status, 'Success. Redirecting...', 'success');
        window.location.href = data.redirect_url;
    });
})();
