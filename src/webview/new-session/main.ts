(function () {
    // @ts-ignore — acquireVsCodeApi is injected by the VS Code webview host
    const vscode = acquireVsCodeApi();

    // -------------------------------------------------------------------------
    // Types (mirrored from extension-side contracts)
    // -------------------------------------------------------------------------

    interface SourceLogConfigReference {
        type: 'file' | 'kibana';
        sourceConfig: string;
        logConfig: string;
    }

    interface TemplateData {
        id: string;
        name: string;
        description: string;
        parameters: Array<{ name: string }>;
        sources: SourceLogConfigReference[];
    }

    interface SessionSummary {
        name: string;
        description: string;
        folderName: string;
    }

    // -------------------------------------------------------------------------
    // State
    // -------------------------------------------------------------------------

    let allTemplates: TemplateData[] = [];
    let selectedTemplate: TemplateData | null = null;

    // -------------------------------------------------------------------------
    // Register message listener before posting `ready`
    // -------------------------------------------------------------------------

    window.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        switch (message.type) {
            case 'init':
                handleInit(message.templates ?? [], message.recentSessions ?? []);
                break;
            case 'sessionCreated':
                handleSessionCreated(message.session);
                break;
            case 'sessionError':
                handleSessionError(message.message);
                break;
            case 'loadSession':
                handleLoadSession(message.session);
                break;
        }
    });

    vscode.postMessage({ type: 'ready' });

    // -------------------------------------------------------------------------
    // init — render templates and recent sessions
    // -------------------------------------------------------------------------

    function handleInit(templates: TemplateData[], recentSessions: SessionSummary[]): void {
        allTemplates = templates;
        renderTemplates(templates);
        renderRecentSessions(recentSessions);
        showUnselectedState();
    }

    function renderTemplates(templates: TemplateData[]): void {
        const list = document.getElementById('templates-list')!;
        list.innerHTML = '';

        if (templates.length === 0) {
            list.innerHTML = '<p class="empty-state">No templates found.</p>';
            return;
        }

        for (const tpl of templates) {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.dataset.id = tpl.id;
            item.innerHTML = `
                <div class="item-name">${escHtml(tpl.name)}</div>
                <div class="item-desc">${escHtml(tpl.description)}</div>
            `;
            item.addEventListener('click', () => selectTemplate(tpl));
            list.appendChild(item);
        }
    }

    function renderRecentSessions(sessions: SessionSummary[]): void {
        const list = document.getElementById('recent-sessions-list')!;
        list.innerHTML = '';

        if (sessions.length === 0) {
            list.innerHTML = '<p class="empty-state">No recent sessions.</p>';
            return;
        }

        for (const s of sessions) {
            list.appendChild(buildSessionEntry(s));
        }
    }

    function buildSessionEntry(s: SessionSummary): HTMLElement {
        const item = document.createElement('div');
        item.className = 'session-item';
        item.dataset.folderName = s.folderName;
        item.innerHTML = `
            <div class="item-name">${escHtml(s.name)}</div>
            <div class="item-desc">${escHtml(s.description)}</div>
        `;
        item.addEventListener('click', () => {
            vscode.postMessage({ type: 'openSession', folderName: s.folderName });
        });
        return item;
    }

    // -------------------------------------------------------------------------
    // Page navigation
    // -------------------------------------------------------------------------

    function showPage(page: 'discovery' | 'form'): void {
        document.getElementById('page-discovery')!.classList.toggle('active', page === 'discovery');
        document.getElementById('page-form')!.classList.toggle('active', page === 'form');
    }

    document.getElementById('back-to-discovery')?.addEventListener('click', () => {
        showPage('discovery');
        showUnselectedState();
    });

    // -------------------------------------------------------------------------
    // Template selection
    // -------------------------------------------------------------------------

    function selectTemplate(tpl: TemplateData): void {
        selectedTemplate = tpl;

        // Highlight selected item
        document.querySelectorAll('.template-item').forEach(el => el.classList.remove('selected'));
        const el = document.querySelector(`.template-item[data-id="${CSS.escape(tpl.id)}"]`);
        el?.classList.add('selected');

        // Set form-page header
        document.getElementById('template-header-name')!.textContent = tpl.name;
        document.getElementById('template-header-desc')!.textContent = tpl.description;

        // Render dynamic parameter fields
        renderParameters(tpl.parameters);

        // Pre-populate sources
        setSources(tpl.sources);

        // Navigate to form page
        showPage('form');
    }

    function showUnselectedState(): void {
        selectedTemplate = null;
        // Reset form page header to generic title
        const nameEl = document.getElementById('template-header-name');
        const descEl = document.getElementById('template-header-desc');
        if (nameEl) { nameEl.textContent = 'New Session'; }
        if (descEl) { descEl.textContent = ''; }
        renderParameters([]);
        setSources([]);
    }

    function renderParameters(parameters: Array<{ name: string }>): void {
        const section = document.getElementById('parameters-section')!;
        section.innerHTML = '';
        for (const param of parameters) {
            const group = document.createElement('div');
            group.className = 'form-group';
            group.innerHTML = `
                <label class="form-label">${escHtml(param.name)}</label>
                <input class="form-input param-input" data-param="${escHtml(param.name)}" type="text" />
            `;
            section.appendChild(group);
        }
    }

    // -------------------------------------------------------------------------
    // Template search / filter
    // -------------------------------------------------------------------------

    document.getElementById('template-search')?.addEventListener('input', (e) => {
        const query = (e.target as HTMLInputElement).value.toLowerCase();
        const items = document.querySelectorAll<HTMLElement>('.template-item');
        let anyVisible = false;

        items.forEach(item => {
            const name = item.querySelector('.item-name')?.textContent?.toLowerCase() ?? '';
            const desc = item.querySelector('.item-desc')?.textContent?.toLowerCase() ?? '';
            const matches = name.includes(query) || desc.includes(query);
            item.style.display = matches ? '' : 'none';
            if (matches) { anyVisible = true; }

            // If the currently selected template was filtered out, clear selection
            if (!matches && selectedTemplate && item.dataset.id === selectedTemplate.id) {
                showUnselectedState();
            }
        });

        // Show/hide no-results placeholder
        let noResults = document.getElementById('template-no-results');
        if (!anyVisible && allTemplates.length > 0) {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.id = 'template-no-results';
                noResults.className = 'empty-state';
                noResults.textContent = 'No templates match your search.';
                document.getElementById('templates-list')!.appendChild(noResults);
            }
            noResults.style.display = '';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    });

    // -------------------------------------------------------------------------
    // Sources table
    // -------------------------------------------------------------------------

    function setSources(sources: SourceLogConfigReference[]): void {
        const tbody = document.getElementById('sources-tbody')!;
        tbody.innerHTML = '';
        for (const s of sources) {
            tbody.appendChild(buildSourceRow(s));
        }
    }

    function buildSourceRow(s?: SourceLogConfigReference): HTMLElement {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="col-type">
                <select class="source-type">
                    <option value="file"${(!s || s.type === 'file') ? ' selected' : ''}>file</option>
                    <option value="kibana"${(s?.type === 'kibana') ? ' selected' : ''}>kibana</option>
                </select>
            </td>
            <td class="col-source">
                <input class="source-config" type="text" placeholder="Source config name" value="${escHtml(s?.sourceConfig ?? '')}" />
            </td>
            <td class="col-log">
                <input class="log-config" type="text" placeholder="Log config name" value="${escHtml(s?.logConfig ?? '')}" />
            </td>
            <td class="col-remove">
                <button class="btn-icon remove-source-btn" title="Remove">✕</button>
            </td>
        `;
        tr.querySelector('.remove-source-btn')!.addEventListener('click', () => tr.remove());
        return tr;
    }

    document.getElementById('add-source-btn')?.addEventListener('click', () => {
        document.getElementById('sources-tbody')!.appendChild(buildSourceRow());
    });

    // -------------------------------------------------------------------------
    // Form submission
    // -------------------------------------------------------------------------

    document.getElementById('create-session-btn')?.addEventListener('click', () => {
        clearFormMessages();

        const nameInput = document.getElementById('session-name') as HTMLInputElement;
        if (!nameInput.value.trim()) {
            nameInput.classList.add('required-error');
            return;
        }
        nameInput.classList.remove('required-error');

        // Collect parameters
        const parameters: Record<string, string> = {};
        document.querySelectorAll<HTMLInputElement>('.param-input').forEach(input => {
            const key = input.dataset.param ?? '';
            if (key) { parameters[key] = input.value; }
        });

        // Collect sources
        const sources: SourceLogConfigReference[] = [];
        document.querySelectorAll<HTMLTableRowElement>('#sources-tbody tr').forEach(row => {
            const type = (row.querySelector('.source-type') as HTMLSelectElement)?.value as 'file' | 'kibana';
            const sourceConfig = (row.querySelector('.source-config') as HTMLInputElement)?.value ?? '';
            const logConfig = (row.querySelector('.log-config') as HTMLInputElement)?.value ?? '';
            sources.push({ type, sourceConfig, logConfig });
        });

        vscode.postMessage({
            type: 'submitSession',
            payload: {
                name: nameInput.value.trim(),
                description: (document.getElementById('session-description') as HTMLInputElement).value,
                templateName: selectedTemplate?.name ?? null,
                parameters,
                timeStart: (document.getElementById('time-start') as HTMLInputElement).value,
                sources,
            },
        });
    });

    // -------------------------------------------------------------------------
    // sessionCreated — prepend new session to Recent Sessions list
    // -------------------------------------------------------------------------

    function handleSessionCreated(session: SessionSummary): void {
        const list = document.getElementById('recent-sessions-list')!;
        // Remove empty-state message if present
        const empty = list.querySelector('.empty-state');
        if (empty) { empty.remove(); }

        list.insertBefore(buildSessionEntry(session), list.firstChild);

        // Clear form
        (document.getElementById('session-name') as HTMLInputElement).value = '';
        (document.getElementById('session-description') as HTMLInputElement).value = '';
        (document.getElementById('time-start') as HTMLInputElement).value = '';
        document.getElementById('parameters-section')!.innerHTML = '';
        document.getElementById('sources-tbody')!.innerHTML = '';

        // Return to discovery — new session is visible in Recent Sessions
        showPage('discovery');
        showUnselectedState();
    }

    // -------------------------------------------------------------------------
    // sessionError — display inline error
    // -------------------------------------------------------------------------

    function handleSessionError(message: string): void {
        showError(message);
    }

    // -------------------------------------------------------------------------
    // loadSession (US2) — populate form from an existing session
    // -------------------------------------------------------------------------

    function handleLoadSession(session: {
        name: string;
        description: string;
        templateName: string | null;
        parameters: Record<string, string>;
        timeStart: string;
        sources: SourceLogConfigReference[];
    }): void {
        clearFormMessages();

        (document.getElementById('session-name') as HTMLInputElement).value = session.name;
        (document.getElementById('session-description') as HTMLInputElement).value = session.description;
        (document.getElementById('time-start') as HTMLInputElement).value = session.timeStart;

        // Rebuild sources table
        setSources(session.sources);

        // Select matching template if available (triggers parameter fields + pre-fill)
        if (session.templateName) {
            const match = allTemplates.find(t => t.name === session.templateName);
            if (match) {
                selectTemplate(match);
                // Pre-fill parameter inputs
                document.querySelectorAll<HTMLInputElement>('.param-input').forEach(input => {
                    const key = input.dataset.param ?? '';
                    if (key && key in session.parameters) {
                        input.value = session.parameters[key];
                    }
                });
                return; // selectTemplate already called showPage('form')
            }
        }

        // No matching template — show form page with generic header
        document.getElementById('template-header-name')!.textContent = session.name || 'Edit Session';
        document.getElementById('template-header-desc')!.textContent = '';
        showPage('form');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function clearFormMessages(): void {
        const err = document.getElementById('form-error')!;
        err.classList.remove('visible');
        err.textContent = '';
        const ok = document.getElementById('form-success')!;
        ok.classList.remove('visible');
        ok.textContent = '';
    }

    function showError(msg: string): void {
        const err = document.getElementById('form-error')!;
        err.textContent = msg;
        err.classList.add('visible');
    }

    function showSuccess(msg: string): void {
        const ok = document.getElementById('form-success')!;
        ok.textContent = msg;
        ok.classList.add('visible');
        setTimeout(() => ok.classList.remove('visible'), 4000);
    }

    function escHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
}());
