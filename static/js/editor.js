(() => {
    const config = window.FREATE_DROP_EDITOR;
    const textarea = document.getElementById('markdown-input');
    const preview = document.getElementById('markdown-preview');
    const status = document.getElementById('editor-status');
    const button = document.getElementById('publish-button');
    const passwordEnabledInput = document.getElementById('password-enabled');
    const passwordFields = document.getElementById('password-fields');
    const passwordInput = document.getElementById('drop-password');

    const easyMDE = new EasyMDE({
        element: textarea,
        autofocus: config.mode !== 'edit',
        spellChecker: false,
        status: ['lines', 'words', 'cursor'],
        minHeight: '70vh',
        autoRefresh: { delay: 200 },
        sideBySideFullscreen: false,
        previewRender(plainText) {
            return window.FreateDrop.renderMarkdownToHtml(plainText);
        },
        toolbar: [
            'bold',
            'italic',
            'heading',
            '|',
            'quote',
            'unordered-list',
            'ordered-list',
            'code',
            'table',
            'horizontal-rule',
            '|',
            'link',
            'image',
            '|',
            'fullscreen',
            '|',
            'guide',
        ],
    });

    function getContent() {
        return easyMDE.value();
    }

    function isPasswordEnabled() {
        return Boolean(passwordEnabledInput?.checked);
    }

    function getPassword() {
        return passwordInput?.value?.trim() || '';
    }

    function syncPasswordVisibility() {
        if (!passwordFields) {
            return;
        }
        passwordFields.classList.toggle('hidden', !isPasswordEnabled());
    }

    const MAX_CHARS = 128_000;
    const charCounter = document.getElementById('char-counter');

    function updateCharCount() {
        if (!charCounter) return;
        const len = getContent().length;
        const over = len > MAX_CHARS;
        charCounter.textContent = `${len.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`;
        charCounter.className = `text-right text-xs ${over ? 'text-red-500 font-medium' : 'text-zinc-400'}`;
    }

    function updatePreview() {
        window.FreateDrop.renderMarkdown(getContent(), preview);
        updateCharCount();
    }

    async function submitDrop() {
        const content = getContent().trim();
        const passwordEnabled = isPasswordEnabled();
        const password = getPassword();
        const keepingExistingPassword = config.mode === 'edit' && config.hasPassword && passwordEnabled && !password;

        if (!content) {
            window.FreateDrop.showStatus(status, 'Please enter Markdown content before publishing.', 'error');
            return;
        }

        if (content.length > MAX_CHARS) {
            window.FreateDrop.showStatus(status, `Content exceeds the maximum of ${MAX_CHARS.toLocaleString()} characters.`, 'error');
            return;
        }

        if (passwordEnabled && !password && !keepingExistingPassword) {
            window.FreateDrop.showStatus(status, 'Please enter a password or disable password protection.', 'error');
            return;
        }

        if (config.mode === 'edit' && !config.canEdit) {
            window.FreateDrop.showStatus(status, 'You do not have permission to edit this drop.', 'error');
            return;
        }

        button.disabled = true;
        button.classList.add('opacity-60');

        try {
            let response;
            if (config.mode === 'edit') {
                response = await window.FreateDrop.apiFetch(`/api/drops/${config.dropId}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content, password_enabled: passwordEnabled, password }),
                });
            } else {
                const formData = new FormData();
                formData.append('content', content);
                formData.append('password', passwordEnabled ? password : '');
                response = await window.FreateDrop.apiFetch('/api/drops/create/', {
                    method: 'POST',
                    body: formData,
                });
            }

            const data = await response.json();
            if (!response.ok) {
                window.FreateDrop.showStatus(status, data.error || 'Unable to save this drop.', 'error');
                return;
            }

            window.location.href = data.view_url;
        } catch (error) {
            window.FreateDrop.showStatus(status, 'A network error occurred while saving the drop.', 'error');
        } finally {
            button.disabled = false;
            button.classList.remove('opacity-60');
        }
    }

    passwordEnabledInput?.addEventListener('change', syncPasswordVisibility);
    easyMDE.codemirror.on('change', updatePreview);
    button.addEventListener('click', submitDrop);
    syncPasswordVisibility();
    updatePreview();

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
                    <div class="flex justify-between py-1.5"><span class="text-zinc-600">Publish / save</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">Ctrl+Enter</kbd></div>
                    <div class="flex justify-between py-1.5"><span class="text-zinc-600">Toggle password</span><kbd class="rounded border border-zinc-300 bg-zinc-50 px-2 py-0.5 font-mono text-xs">Ctrl+P</kbd></div>
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

            const mod = e.ctrlKey || e.metaKey;
            if (mod && e.key === 'Enter') {
                e.preventDefault();
                submitDrop();
                return;
            }

            if (mod && e.key === 'p') {
                e.preventDefault();
                passwordEnabledInput?.click();
                return;
            }
        });
    })();
})();
