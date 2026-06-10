window.FreateDrop = (() => {
    const LANGUAGE_LABELS = {
        // JavaScript ecosystem
        js: 'JavaScript',
        jsx: 'JSX',
        mjs: 'JavaScript Module',
        cjs: 'CommonJS',
        ts: 'TypeScript',
        tsx: 'TSX',
        
        // Python
        py: 'Python',
        python: 'Python',
        ipynb: 'Jupyter Notebook',
        
        // Ruby
        rb: 'Ruby',
        ruby: 'Ruby',
        
        // PHP
        php: 'PHP',
        
        // Java & JVM
        java: 'Java',
        kt: 'Kotlin',
        kts: 'Kotlin Script',
        scala: 'Scala',
        groovy: 'Groovy',
        
        // C family
        c: 'C',
        h: 'C Header',
        cpp: 'C++',
        cc: 'C++',
        cxx: 'C++',
        hpp: 'C++ Header',
        cs: 'C#',
        
        // Go
        go: 'Go',
        
        // Rust
        rs: 'Rust',
        rust: 'Rust',
        
        // Swift
        swift: 'Swift',
        
        // Lua
        lua: 'Lua',
        
        // R
        r: 'R',
        
        // Shell scripting
        sh: 'Shell',
        bash: 'Bash',
        shell: 'Shell',
        zsh: 'Zsh',
        fish: 'Fish',
        powershell: 'PowerShell',
        ps1: 'PowerShell',
        bat: 'Batch',
        cmd: 'Batch',
        
        // Web
        html: 'HTML',
        xml: 'XML',
        svg: 'SVG',
        css: 'CSS',
        scss: 'SCSS',
        sass: 'Sass',
        less: 'Less',
        
        // Data formats
        json: 'JSON',
        yaml: 'YAML',
        yml: 'YAML',
        toml: 'TOML',
        ini: 'INI',
        env: 'ENV',
        
        // SQL
        sql: 'SQL',
        mysql: 'MySQL',
        pgsql: 'PostgreSQL',
        sqlite: 'SQLite',
        
        // GraphQL
        graphql: 'GraphQL',
        gql: 'GraphQL',
        
        // Markdown & Docs
        md: 'Markdown',
        markdown: 'Markdown',
        mdx: 'MDX',
        
        // Version control
        diff: 'Diff',
        
        // Container & Config
        dockerfile: 'Dockerfile',
        docker: 'Dockerfile',
        yml: 'YAML',
        
        // Other languages
        dart: 'Dart',
        elixir: 'Elixir',
        ex: 'Elixir',
        exs: 'Elixir Script',
        erlang: 'Erlang',
        erl: 'Erlang',
        haskell: 'Haskell',
        hs: 'Haskell',
        clojure: 'Clojure',
        clj: 'Clojure',
        perl: 'Perl',
        pascal: 'Pascal',
        pas: 'Pascal',
        delphi: 'Delphi',
        fortran: 'Fortran',
        f90: 'Fortran',
        cobol: 'COBOL',
        vba: 'VBA',
        vb: 'Visual Basic',
        matlab: 'MATLAB',
        octave: 'Octave',
        wolfram: 'Wolfram',
        mathematica: 'Mathematica',
        stata: 'Stata',
        sas: 'SAS',
        julia: 'Julia',
        jl: 'Julia',
        nim: 'Nim',
        zig: 'Zig',
        v: 'V',
        ada: 'Ada',
        lisp: 'Lisp',
        scheme: 'Scheme',
        racket: 'Racket',
        fsharp: 'F#',
        fs: 'F#',
        ocaml: 'OCaml',
        ml: 'OCaml',
        solidity: 'Solidity',
        sol: 'Solidity',
        vyper: 'Vyper',
        move: 'Move',
        cadence: 'Cadence',
        circom: 'Circom',
        noir: 'Noir',
        cairo: 'Cairo',
        
        // Template engines
        handlebars: 'Handlebars',
        hbs: 'Handlebars',
        mustache: 'Mustache',
        ejs: 'EJS',
        liquid: 'Liquid',
        twig: 'Twig',
        blade: 'Blade',
        erb: 'ERB',
        jinja: 'Jinja',
        nunjucks: 'Nunjucks',
        
        // Protocols & Schemas
        protobuf: 'Protobuf',
        proto: 'Protobuf',
        thrift: 'Thrift',
        avro: 'Avro',
        
        // Miscellaneous
        plaintext: 'Plain text',
        text: 'Plain text',
        txt: 'Plain text',
        log: 'Log',
        makefile: 'Makefile',
        cmake: 'CMake',
        ninja: 'Ninja',
        bazel: 'Bazel',
        nginx: 'Nginx',
        apache: 'Apache Config',
        htaccess: 'htaccess',
        ssh: 'SSH Config',
        editorconfig: 'EditorConfig',
        gitignore: 'Git Ignore',
        gitattributes: 'Git Attributes',
    };

    const loadedFonts = {};
    const loadedGoogleFontsFamilies = new Set();

    function loadFontFromUrl(fontName, fontUrl) {
        if (loadedFonts[fontName]) {
            return;
        }

        if (fontUrl.includes('fonts.googleapis.com/css')) {
            loadGoogleFontCSS(fontUrl);
            loadedFonts[fontName] = true;
            return;
        }

        let format = 'woff2';
        if (fontUrl.endsWith('.woff')) {
            format = 'woff';
        } else if (fontUrl.endsWith('.ttf')) {
            format = 'truetype';
        } else if (fontUrl.endsWith('.otf')) {
            format = 'opentype';
        } else if (fontUrl.endsWith('.eot')) {
            format = 'embedded-opentype';
        }

        const style = document.createElement('style');
        style.textContent = `@font-face {
            font-family: "${fontName}";
            src: url("${fontUrl}") format("${format}");
            font-display: swap;
        }`;
        document.head.appendChild(style);

        loadedFonts[fontName] = true;
    }

    function loadGoogleFontCSS(cssUrl) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);

        try {
            const url = new URL(cssUrl);
            const familyParam = url.searchParams.get('family');
            if (familyParam) {
                const families = familyParam.split('&').map(f => {
                    return f.split(':')[0].trim();
                });
                families.forEach(f => loadedGoogleFontsFamilies.add(f));
            }
        } catch (e) {
        }
    }

    function detectAndLoadFonts(markdown) {
        const regex = /%%font:([^:]+):([^%]+)%%/g;
        let match;

        while ((match = regex.exec(markdown)) !== null) {
            const fontName = match[1].trim();
            const fontUrl = match[2].trim();
            loadFontFromUrl(fontName, fontUrl);
        }

        return markdown.replace(/%%font:[^:]+:[^%]+%%/g, '');
    }

    function sanitizeHtml(html) {
        if (!window.DOMPurify) {
            console.error('DOMPurify not loaded! Falling back to strict text-only sanitization.');
            const temp = document.createElement('div');
            temp.textContent = html;
            return temp.innerHTML;
        }

        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['span', 'div', 'p', 'br', 'strong', 'em', 'a', 'ul', 'ol', 'li',
                           'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote',
                           'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'img', 'kbd',
                           'del', 'input', 'sup', 'sub'],
            ALLOWED_ATTR: ['style', 'href', 'title', 'src', 'alt', 'width', 'height', 'type', 'checked', 'class', 'id'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'option'],
            ALLOW_DATA_ATTR: false,
            KEEP_CONTENT: true
        });
    }

    if (window.DOMPurify) {
        const ALLOWED_STYLES_LIST = ['font-family', 'color', 'background-color', 'font-style', 
                                      'font-weight', 'text-decoration', 'text-align', 'font-size'];

        DOMPurify.addHook('uponSanitizeAttribute', function(node, data) {
            if (data.attrName === 'style') {
                const filtered = data.attrValue.split(';')
                    .map(s => s.trim())
                    .filter(s => {
                        if (!s) return false;
                        const prop = s.split(':')[0].trim().toLowerCase();
                        return ALLOWED_STYLES_LIST.includes(prop);
                    })
                    .join('; ');

                data.attrValue = filtered;
                data.keepAttr = !!filtered;
            }
        });
    }

    function setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    function getCookie(name) {
        const cookies = document.cookie ? document.cookie.split('; ') : [];
        for (const cookie of cookies) {
            const [key, ...rest] = cookie.split('=');
            if (key === name) {
                return decodeURIComponent(rest.join('='));
            }
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
    }

    function getCsrfToken() {
        return getCookie('csrftoken');
    }

    function escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function configureMarked() {
        if (!window.marked) {
            return;
        }

        const renderer = new marked.Renderer();
        renderer.link = ({ href, title, tokens }) => {
            const text = marked.Parser.parseInline(tokens);
            const safeTitle = title ? ` title="${title.replaceAll('"', '&quot;')}"` : '';
            return `<a href="${href}" target="_blank" rel="noopener noreferrer nofollow"${safeTitle}>${text}</a>`;
        };

        marked.use({ renderer });
        marked.setOptions({
            gfm: true,
            breaks: true,
            pedantic: false,
            headerIds: true,
            mangle: false,
        });
    }

    function renderMath(container) {
        if (!container) {
            return;
        }

        if (window.renderMathInElement) {
            window.renderMathInElement(container, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false },
                    { left: '\\(', right: '\\)', display: false },
                    { left: '\\[', right: '\\]', display: true },
                ],
                throwOnError: false,
            });
        }

        if (window.MathJax?.typesetPromise) {
            window.MathJax.typesetPromise([container]).catch(() => {});
        }
    }

    function getCodeLanguageLabel(block) {
        const className = Array.from(block.classList).find((name) => name.startsWith('language-')) || '';
        const language = className.replace('language-', '').toLowerCase();
        if (!language) {
            return 'Code';
        }
        return LANGUAGE_LABELS[language] || language.charAt(0).toUpperCase() + language.slice(1);
    }

    function enhanceCodeBlocks(target) {
        target.querySelectorAll('pre code').forEach((block) => {
            if (window.hljs) {
                hljs.highlightElement(block);
            }

            const pre = block.parentElement;
            if (!pre || pre.parentElement?.classList.contains('code-block')) {
                return;
            }

            const wrapper = document.createElement('div');
            wrapper.className = 'code-block my-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950';

            const header = document.createElement('div');
            header.className = 'code-block-header flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2 text-sm';

            const language = document.createElement('span');
            language.className = 'code-block-language font-medium text-zinc-300';
            language.textContent = getCodeLanguageLabel(block);

            const copyButton = document.createElement('button');
            copyButton.type = 'button';
            copyButton.className = 'code-copy-button rounded border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800';
            copyButton.textContent = 'Copy';
            copyButton.dataset.copyText = block.textContent || '';

            copyButton.addEventListener('click', async () => {
                const originalLabel = copyButton.textContent;
                try {
                    await navigator.clipboard.writeText(copyButton.dataset.copyText || '');
                    copyButton.textContent = 'Copied';
                    copyButton.classList.add('border-green-600', 'text-green-300');
                } catch {
                    copyButton.textContent = 'Failed';
                    copyButton.classList.add('border-red-600', 'text-red-300');
                }

                window.setTimeout(() => {
                    copyButton.textContent = originalLabel;
                    copyButton.classList.remove('border-green-600', 'text-green-300', 'border-red-600', 'text-red-300');
                }, 1600);
            });

            header.appendChild(language);
            header.appendChild(copyButton);

            pre.parentNode.insertBefore(wrapper, pre);
            wrapper.appendChild(header);
            wrapper.appendChild(pre);
        });
    }

    function renderMarkdownToHtml(markdown) {
        configureMarked();
        if (!markdown?.trim()) {
            return '<p class="text-zinc-500">Nothing to preview yet.</p>';
        }

        const cleanMarkdown = detectAndLoadFonts(markdown);
        const rawHtml = marked.parse(cleanMarkdown);
        return sanitizeHtml(rawHtml);
    }

    function renderMarkdown(markdown, target) {
        if (!target) {
            return;
        }
        const content = renderMarkdownToHtml(markdown);
        target.innerHTML = content;
        enhanceCodeBlocks(target);
        target.querySelectorAll('table').forEach((table) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'overflow-x-auto';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
        renderMath(target);
    }

    function showStatus(element, message, kind = 'info') {
        if (!element) {
            return;
        }
        const classes = {
            info: 'border-zinc-300 bg-zinc-50 text-zinc-700',
            success: 'border-green-300 bg-green-50 text-green-700',
            error: 'border-red-300 bg-red-50 text-red-700',
        };
        element.className = `rounded border px-4 py-3 text-sm ${classes[kind] || classes.info}`;
        element.textContent = message;
        element.classList.remove('hidden');
    }

    async function apiFetch(url, options = {}) {
        const headers = new Headers(options.headers || {});
        if (!headers.has('X-CSRFToken')) {
            headers.set('X-CSRFToken', getCsrfToken() || '');
        }
        return fetch(url, { credentials: 'same-origin', ...options, headers });
    }

    function toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.toggle('dark');
        localStorage.setItem('freatedrop-theme', isDark ? 'dark' : 'light');
    }

    document.getElementById('darkmode-toggle')?.addEventListener('click', toggleTheme);

    return {
        setCookie,
        getCookie,
        deleteCookie,
        getCsrfToken,
        renderMarkdown,
        renderMarkdownToHtml,
        renderMath,
        showStatus,
        apiFetch,
        toggleTheme,
        escapeHtml,
        sanitizeHtml,
        loadFontFromUrl,
        detectAndLoadFonts,
    };
})();