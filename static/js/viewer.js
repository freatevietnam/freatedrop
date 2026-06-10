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

    const printButton = document.getElementById('print-button');

    printButton?.addEventListener('click', () => window.print());

    (() => {
        const trigger = document.getElementById('drop-bar-trigger');
        const menu = document.getElementById('drop-bar-menu');
        if (!trigger || !menu) return;

        function closeMenu() { menu.classList.add('hidden'); }
        function toggleMenu() { menu.classList.toggle('hidden'); }

        trigger.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });

        document.addEventListener('click', closeMenu);

        menu.querySelectorAll('button, a').forEach(el => {
            el.addEventListener('click', closeMenu);
        });
    })();

    const fullviewButton = document.getElementById('fullview-button');
    let fullviewExitBtn = null;

    function toggleFullview() {
        if (renderedView.classList.contains('hidden')) {
            window.FreateDrop.showStatus(status, 'Unlock the drop first to use Fullview.', 'error');
            return;
        }

        const isActive = document.body.classList.toggle('fullview-mode');

        if (isActive) {
            fullviewButton.textContent = 'Exit';
            fullviewExitBtn = document.createElement('button');
            fullviewExitBtn.textContent = 'Exit Fullview';
            fullviewExitBtn.className = 'fullview-exit-btn fixed top-4 right-4 z-50 rounded border border-zinc-600 bg-zinc-900/80 px-3 py-2 text-sm text-white hover:bg-zinc-900 backdrop-blur-sm';
            fullviewExitBtn.addEventListener('click', toggleFullview);
            document.body.appendChild(fullviewExitBtn);
        } else {
            fullviewButton.textContent = 'Fullview';
            if (fullviewExitBtn) {
                fullviewExitBtn.remove();
                fullviewExitBtn = null;
            }
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('fullview-mode')) {
            toggleFullview();
        }
    });

    fullviewButton?.addEventListener('click', toggleFullview);

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
