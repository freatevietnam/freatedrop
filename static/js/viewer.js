(() => {
    const config = window.FREATE_DROP_VIEWER;
    const renderedView = document.getElementById('rendered-view');
    const status = document.getElementById('viewer-status');
    const copyButton = document.getElementById('copy-link-button');
    const rawButton = document.getElementById('raw-toggle-button');
    const shortenButton = document.getElementById('shorten-button');
    const deleteButton = document.getElementById('delete-button');
    const shortUrlPanel = document.getElementById('short-url-panel');
    const shortUrlInput = document.getElementById('short-url-input');
    const copyShortUrlButton = document.getElementById('copy-short-url-button');
    const unlockButton = document.getElementById('unlock-drop-button');
    const accessPasswordInput = document.getElementById('drop-access-password');
    let currentShortUrl = '';

    function showShortUrl(url) {
        if (!url || !shortUrlPanel || !shortUrlInput) {
            return;
        }
        currentShortUrl = url;
        shortUrlInput.value = url;
        shortUrlPanel.classList.remove('hidden');
    }

    function hideShortUrl() {
        if (!shortUrlPanel) {
            return;
        }
        shortUrlPanel.classList.add('hidden');
    }

    async function loadDrop() {
        const response = await fetch(`/api/drops/${config.dropId}/`, { credentials: 'same-origin' });
        const data = await response.json();
        if (!response.ok) {
            if (data.requires_password) {
                window.FreateDrop.showStatus(status, data.error || 'This drop is password protected.', 'info');
                return;
            }
            window.FreateDrop.showStatus(status, data.error || 'Unable to load the drop.', 'error');
            return;
        }

        const content = data.drop.content || '';
        currentShortUrl = data.drop.short_url || '';
        renderedView.classList.remove('hidden');
        window.FreateDrop.renderMarkdown(content, renderedView);
    }

    async function unlockDrop() {
        const password = accessPasswordInput?.value?.trim() || '';
        if (!password) {
            window.FreateDrop.showStatus(status, 'Please enter the drop password.', 'error');
            return;
        }

        unlockButton.disabled = true;
        unlockButton.classList.add('opacity-60');

        try {
            const formData = new FormData();
            formData.append('password', password);
            const response = await window.FreateDrop.apiFetch(`/api/drops/${config.dropId}/access/`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (!response.ok) {
                window.FreateDrop.showStatus(status, data.error || 'Incorrect password.', 'error');
                return;
            }
            window.location.reload();
        } catch (error) {
            window.FreateDrop.showStatus(status, 'A network error occurred while unlocking the drop.', 'error');
        } finally {
            unlockButton.disabled = false;
            unlockButton.classList.remove('opacity-60');
        }
    }

    async function copyLink() {
        await navigator.clipboard.writeText(window.location.href);
        window.FreateDrop.showStatus(status, 'Drop link copied to clipboard.', 'success');
    }

    async function copyShortUrl() {
        if (!shortUrlInput?.value) {
            return;
        }
        await navigator.clipboard.writeText(shortUrlInput.value);
        window.FreateDrop.showStatus(status, 'Short URL copied to clipboard.', 'success');
    }

    function openRaw() {
        window.open(config.rawUrl, '_blank', 'noopener');
    }

    async function shortenUrl() {
        if (shortUrlPanel && !shortUrlPanel.classList.contains('hidden')) {
            hideShortUrl();
            return;
        }

        if (currentShortUrl) {
            showShortUrl(currentShortUrl);
            return;
        }

        const response = await window.FreateDrop.apiFetch(`/api/drops/${config.dropId}/shorten/`, {
            method: 'POST',
        });
        const data = await response.json();
        if (!response.ok) {
            window.FreateDrop.showStatus(status, data.error || 'Unable to shorten URL.', 'error');
            return;
        }
        showShortUrl(data.short_url);
        window.FreateDrop.showStatus(status, 'Short URL is ready.', 'success');
    }

    async function deleteDrop() {
        if (!window.confirm('Delete this drop permanently?')) {
            return;
        }
        const response = await window.FreateDrop.apiFetch(`/api/drops/${config.dropId}/`, {
            method: 'DELETE',
        });
        const data = await response.json();
        if (!response.ok) {
            window.FreateDrop.showStatus(status, data.error || 'Unable to delete drop.', 'error');
            return;
        }
        window.location.href = data.redirect_url;
    }

    accessPasswordInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            unlockDrop();
        }
    });
    unlockButton?.addEventListener('click', unlockDrop);
    copyButton?.addEventListener('click', copyLink);
    copyShortUrlButton?.addEventListener('click', copyShortUrl);
    rawButton?.addEventListener('click', openRaw);
    shortenButton?.addEventListener('click', shortenUrl);
    deleteButton?.addEventListener('click', deleteDrop);
    if (config.canAccess || config.canEdit || !config.hasPassword) {
        loadDrop();
    }
})();
