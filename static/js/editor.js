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

    function updatePreview() {
        window.FreateDrop.renderMarkdown(getContent(), preview);
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
})();
