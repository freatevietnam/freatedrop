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

    (() => {
        const panelId = 'shortcuts-panel';
        const overlayId = 'shortcuts-overlay';

        function buildShortcutsPanel() {
            if (document.getElementById(panelId)) return;

            const overlay = document.createElement('div');
            overlay.id = overlayId;
            overlay.className = 'fixed inset-0 z-50 hidden bg-black/40';

            const panel = document.createElement('div');
            panel.id = panelId;
            panel.className = 'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl';

            panel.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-lg font-semibold tracking-tight">Shortcuts</h2>
                    <button id="shortcuts-close" class="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600">
                        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between py-1.5"><span class="text-zinc-600">Show / hide shortcuts</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">F1</kbd></div>
                    <div class="flex justify-between py-1.5"><span class="text-zinc-600">Toggle fullview</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">F</kbd></div>
                    <div class="flex justify-between py-1.5"><span class="text-zinc-600">Print drop</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">P</kbd></div>
                    <div class="flex justify-between py-1.5 border-t border-zinc-100 mt-2 pt-3"><span class="text-zinc-600">Exit fullview</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">Esc</kbd></div>
                </div>
            `;

            document.body.appendChild(overlay);
            document.body.appendChild(panel);

            function close() {
                overlay.classList.add('hidden');
                panel.classList.add('hidden');
            }

            overlay.addEventListener('click', close);
            document.getElementById('shortcuts-close')?.addEventListener('click', close);
        }

        function toggleShortcuts() {
            buildShortcutsPanel();
            const overlay = document.getElementById(overlayId);
            const panel = document.getElementById(panelId);
            const isHidden = overlay.classList.contains('hidden');
            overlay.classList.toggle('hidden', !isHidden);
            panel.classList.toggle('hidden', !isHidden);
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'F1' || (e.key === '?' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                toggleShortcuts();
                return;
            }
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,button,a')) {
                e.preventDefault();
                toggleFullview();
                return;
            }
            if (e.key === 'p' && !e.ctrlKey && !e.metaKey && !e.target.closest('input,textarea,button,a')) {
                e.preventDefault();
                window.print();
                return;
            }
        });
    })();

    if (config.canAccess || config.canEdit || !config.hasPassword) {
        loadDrop();
    }
})();
