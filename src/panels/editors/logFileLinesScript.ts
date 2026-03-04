// script used inside the log file lines editor webview.  Kept separate to
// avoid bloating the panel host file with 400+ lines of markup logic.
export const FILELOG_EDITOR_SCRIPT = `
(function() {
    const vscode = acquireVsCodeApi();

    const form = document.getElementById('config-form');
    const pageTitle = document.getElementById('page-title');
    const shortNameInput = document.getElementById('shortName');
    const labelInput = document.getElementById('label');
    const descriptionInput = document.getElementById('description');
    const lineTypeSelect = document.getElementById('lineType');
    const saveBtn = document.getElementById('save-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const statusBar = document.getElementById('status-bar');
    const shortNameError = document.getElementById('shortName-error');
    const labelError = document.getElementById('label-error');

    const textSection = document.getElementById('text-section');
    const xmlSection = document.getElementById('xml-section');
    const jsonSection = document.getElementById('json-section');
    const textFieldsDiv = document.getElementById('text-fields');
    const xmlFieldsDiv = document.getElementById('xml-fields');
    const jsonFieldsDiv = document.getElementById('json-fields');
    const rootXpathInput = document.getElementById('rootXpath');

    let isNew = true;
    let originalShortName = null;
    const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    let textFields = [];
    let xmlFields = [];
    let jsonFields = [];

    // ΓöÇΓöÇ Type switching ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    lineTypeSelect.addEventListener('change', updateTypeSections);

    function updateTypeSections() {
        const t = lineTypeSelect.value;
        textSection.classList.toggle('hidden', t !== 'text');
        xmlSection.classList.toggle('hidden', t !== 'xml');
        jsonSection.classList.toggle('hidden', t !== 'json');
    }

    // ΓöÇΓöÇ Field management: Text ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    document.getElementById('add-text-field').addEventListener('click', function() {
        textFields.push({ name: '', extraction: { kind: 'prefix-suffix', prefix: '' }, datetime: null });
        renderTextFields();
    });

    function renderTextFields() {
        textFieldsDiv.innerHTML = '';
        textFields.forEach(function(f, i) {
            const row = document.createElement('div');
            row.className = 'field-row';
            row.innerHTML =
                '<div class="field-row-header">' +
                  '<label style="min-width:40px">Name</label>' +
                  '<input class="tf-name" type="text" value="' + escHtml(f.name) + '" placeholder="fieldName" />' +
                  '<button type="button" class="remove-btn">Remove</button></div>' +
                '<div class="field-sub-group">' +
                  '<div><div class="field-sub-label">Extraction kind</div>' +
                  '<select class="tf-kind"><option value="prefix-suffix"' + (f.extraction.kind === 'prefix-suffix' ? ' selected' : '') + '>Prefix / Suffix</option>' +
                  '<option value="regex"' + (f.extraction.kind === 'regex' ? ' selected' : '') + '>Regex</option></select></div>' +
                '</div>' +
                '<div class="ps-group"' + (f.extraction.kind !== 'prefix-suffix' ? ' style="display:none"' : '') + '>' +
                '<div class="field-sub-group">' +
                  '<div><div class="field-sub-label">Prefix</div><input class="tf-prefix" type="text" value="' + escHtml(f.extraction.prefix||'') + '" /></div>' +
                  '<div><div class="field-sub-label">Suffix (optional)</div><input class="tf-suffix" type="text" value="' + escHtml(f.extraction.suffix||'') + '" /></div>' +
                '</div></div>' +
                '<div class="re-group"' + (f.extraction.kind !== 'regex' ? ' style="display:none"' : '') + '>' +
                '<div class="field-sub-group single"><div><div class="field-sub-label">Pattern</div><input class="tf-pattern" type="text" value="' + escHtml(f.extraction.pattern||'') + '" placeholder="(?&lt;value&gt;...)" /></div></div>' +
                '<div class="regex-test-row"><input class="tf-sample" type="text" placeholder="Sample log line to test" /><button type="button" class="small-btn test-regex-btn">Test</button></div>' +
                '<div class="regex-result" id="regex-result-' + i + '"></div>' +
                '</div>' +
                '<div><button type="button" class="datetime-toggle">+ Datetime format</button>' +
                '<div class="datetime-sub' + (f.datetime ? '' : ' hidden') + '">' +
                '<input class="tf-dtformat" type="text" value="' + escHtml((f.datetime && f.datetime.formatString)||'') + '" placeholder="yyyy-MM-dd HH:mm:ss" /></div></div>';

            row.querySelector('.remove-btn').addEventListener('click', function() {
                textFields.splice(i, 1);
                renderTextFields();
            });
            row.querySelector('.tf-name').addEventListener('input', function(e) { textFields[i].name = e.target.value; });
            row.querySelector('.tf-kind').addEventListener('change', function(e) {
                textFields[i].extraction = e.target.value === 'regex'
                    ? { kind: 'regex', pattern: '' }
                    : { kind: 'prefix-suffix', prefix: '' };
                renderTextFields();
            });
            const psGroup = row.querySelector('.ps-group');
            const reGroup = row.querySelector('.re-group');
            if (f.extraction.kind === 'prefix-suffix') {
                row.querySelector('.tf-prefix').addEventListener('input', function(e) { textFields[i].extraction.prefix = e.target.value; });
                const sfx = row.querySelector('.tf-suffix');
                sfx.addEventListener('input', function(e) { textFields[i].extraction.suffix = e.target.value || undefined; });
            } else {
                row.querySelector('.tf-pattern').addEventListener('input', function(e) { textFields[i].extraction.pattern = e.target.value; });
                row.querySelector('.test-regex-btn').addEventListener('click', function() {
                    const sample = row.querySelector('.tf-sample').value;
                    vscode.postMessage({ type: 'filelog-config:test-regex', fieldIndex: i, pattern: textFields[i].extraction.pattern || '', sampleLine: sample });
                });
            }
            row.querySelector('.datetime-toggle').addEventListener('click', function() {
                const sub = row.querySelector('.datetime-sub');
                sub.classList.toggle('hidden');
                if (!textFields[i].datetime) textFields[i].datetime = { formatString: '' };
            });
            const dtInput = row.querySelector('.tf-dtformat');
            if (dtInput) dtInput.addEventListener('input', function(e) {
                if (!textFields[i].datetime) textFields[i].datetime = {};
                textFields[i].datetime.formatString = e.target.value;
            });

            textFieldsDiv.appendChild(row);
        });
    }

    // ΓöÇΓöÇ Field management: XML ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    document.getElementById('add-xml-field').addEventListener('click', function() {
        xmlFields.push({ name: '', xpath: '' });
        renderXmlFields();
    });

    function renderXmlFields() {
        xmlFieldsDiv.innerHTML = '';
        xmlFields.forEach(function(f, i) {
            const row = document.createElement('div');
            row.className = 'field-row';
            row.innerHTML =
                '<div class="field-row-header">' +
                '<label style="min-width:40px">Name</label>' +
                '<input class="xf-name" type="text" value="' + escHtml(f.name) + '" placeholder="fieldName" />' +
                '<button type="button" class="remove-btn">Remove</button></div>' +
                '<div class="field-sub-group single"><div><div class="field-sub-label">XPath</div>' +
                '<input class="xf-xpath" type="text" value="' + escHtml(f.xpath) + '" placeholder="@Level" /></div></div>';
            row.querySelector('.remove-btn').addEventListener('click', function() { xmlFields.splice(i, 1); renderXmlFields(); });
            row.querySelector('.xf-name').addEventListener('input', function(e) { xmlFields[i].name = e.target.value; });
            row.querySelector('.xf-xpath').addEventListener('input', function(e) { xmlFields[i].xpath = e.target.value; });
            xmlFieldsDiv.appendChild(row);
        });
    }

    // ΓöÇΓöÇ Field management: JSON ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    document.getElementById('add-json-field').addEventListener('click', function() {
        jsonFields.push({ name: '', jsonPath: '' });
        renderJsonFields();
    });

    function renderJsonFields() {
        jsonFieldsDiv.innerHTML = '';
        jsonFields.forEach(function(f, i) {
            const row = document.createElement('div');
            row.className = 'field-row';
            row.innerHTML =
                '<div class="field-row-header">' +
                '<label style="min-width:40px">Name</label>' +
                '<input class="jf-name" type="text" value="' + escHtml(f.name) + '" placeholder="fieldName" />' +
                '<button type="button" class="remove-btn">Remove</button></div>' +
                '<div class="field-sub-group single"><div><div class="field-sub-label">JSON Path (dot notation)</div>' +
                '<input class="jf-path" type="text" value="' + escHtml(f.jsonPath) + '" placeholder="metadata.timestamp" /></div></div>' +
                '<div><button type="button" class="datetime-toggle">+ Datetime format</button>' +
                '<div class="datetime-sub' + (f.datetime ? '' : ' hidden') + '">' +
                '<input class="jf-dtformat" type="text" value="' + escHtml((f.datetime && f.datetime.formatString)||'') + '" placeholder="yyyy-MM-ddTHH:mm:ss.SSS" /></div></div>';
            row.querySelector('.remove-btn').addEventListener('click', function() { jsonFields.splice(i, 1); renderJsonFields(); });
            row.querySelector('.jf-name').addEventListener('input', function(e) { jsonFields[i].name = e.target.value; });
            row.querySelector('.jf-path').addEventListener('input', function(e) { jsonFields[i].jsonPath = e.target.value; });
            row.querySelector('.datetime-toggle').addEventListener('click', function() {
                const sub = row.querySelector('.datetime-sub');
                sub.classList.toggle('hidden');
                if (!jsonFields[i].datetime) jsonFields[i].datetime = { formatString: '' };
            });
            const dtInput = row.querySelector('.jf-dtformat');
            if (dtInput) dtInput.addEventListener('input', function(e) {
                if (!jsonFields[i].datetime) jsonFields[i].datetime = {};
                jsonFields[i].datetime.formatString = e.target.value;
            });
            jsonFieldsDiv.appendChild(row);
        });
    }

    // ΓöÇΓöÇ Validate & Submit ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    function validateForm() {
        shortNameError.textContent = '';
        labelError.textContent = '';
        let valid = true;
        const name = shortNameInput.value.trim();
        if (!name) { shortNameError.textContent = 'Short name is required.'; valid = false; }
        else if (!KEBAB_RE.test(name)) { shortNameError.textContent = 'Short name must be kebab-case.'; valid = false; }
        if (!labelInput.value.trim()) { labelError.textContent = 'Label is required.'; valid = false; }
        return valid;
    }

    function buildConfig() {
        const type = lineTypeSelect.value;
        const base = {
            type,
            shortName: shortNameInput.value.trim(),
            label: labelInput.value.trim(),
            ...(descriptionInput.value.trim() ? { description: descriptionInput.value.trim() } : {})
        };
        if (type === 'text') {
            return { ...base, fields: textFields.map(function(f) {
                return { name: f.name, extraction: f.extraction, ...(f.datetime && f.datetime.formatString ? { datetime: f.datetime } : {}) };
            })};
        } else if (type === 'xml') {
            return { ...base, rootXpath: rootXpathInput.value.trim(), fields: xmlFields.slice() };
        } else {
            return { ...base, fields: jsonFields.map(function(f) {
                return { name: f.name, jsonPath: f.jsonPath, ...(f.datetime && f.datetime.formatString ? { datetime: f.datetime } : {}) };
            })};
        }
    }

    shortNameInput.addEventListener('blur', function() {
        const name = shortNameInput.value.trim();
        if (!name || !KEBAB_RE.test(name)) return;
        if (isNew || name !== originalShortName) {
            vscode.postMessage({ type: 'filelog-config:validate-name', shortName: name });
        }
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!validateForm()) return;
        saveBtn.disabled = true;
        setStatus('Saving\u2026', 'info');
        vscode.postMessage({ type: 'filelog-config:save', config: buildConfig() });
    });

    cancelBtn.addEventListener('click', function() {
        vscode.postMessage({ type: 'filelog-config:cancel' });
    });

    // ΓöÇΓöÇ Host messages ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    window.addEventListener('message', function(event) {
        const msg = event.data;
        switch (msg.type) {
            case 'filelog-config:load': {
                isNew = msg.isNew;
                if (msg.config) {
                    const c = msg.config;
                    shortNameInput.value = c.shortName;
                    labelInput.value = c.label;
                    descriptionInput.value = c.description || '';
                    lineTypeSelect.value = c.type;
                    originalShortName = c.shortName;
                    pageTitle.textContent = 'Edit: ' + c.shortName;
                    shortNameInput.readOnly = true;
                    if (c.type === 'text') { textFields = (c.fields || []).map(function(f) { return Object.assign({}, f, { extraction: Object.assign({}, f.extraction) }); }); renderTextFields(); }
                    else if (c.type === 'xml') { xmlFields = (c.fields || []).slice(); rootXpathInput.value = c.rootXpath || ''; renderXmlFields(); }
                    else { jsonFields = (c.fields || []).slice(); renderJsonFields(); }
                } else {
                    pageTitle.textContent = 'New Line Config';
                }
                updateTypeSections();
                break;
            }
            case 'filelog-config:name-available':
                if (!msg.available) shortNameError.textContent = 'A config with this name already exists.';
                break;
            case 'filelog-config:save-result':
                saveBtn.disabled = false;
                if (msg.success) {
                    setStatus('Saved successfully.', 'success');
                    if (isNew) { isNew = false; originalShortName = shortNameInput.value.trim(); pageTitle.textContent = 'Edit: ' + originalShortName; shortNameInput.readOnly = true; }
                } else {
                    setStatus('Error: ' + (msg.errorMessage || 'Save failed.'), 'error');
                }
                break;
            case 'filelog-config:regex-test-result': {
                const el = document.getElementById('regex-result-' + msg.fieldIndex);
                if (!el) break;
                if (msg.errorMessage) { el.textContent = 'Error: ' + msg.errorMessage; el.className = 'regex-result error'; }
                else if (msg.matched) {
                    const groups = msg.groups && Object.keys(msg.groups).length ? ' Groups: ' + JSON.stringify(msg.groups) : '';
                    el.textContent = 'Match\u2713' + groups; el.className = 'regex-result match';
                } else { el.textContent = 'No match'; el.className = 'regex-result no-match'; }
                break;
            }
        }
    });

    function setStatus(text, kind) { statusBar.textContent = text; statusBar.className = 'status ' + kind; }
    function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
})();
`;
