/**
 * Live Changes Display - Auto-updating changes panel
 * Shows current changes at the bottom of the page with real-time updates
 */

let changesListeners = [];
let currentChanges = {
    _format: 'delta-only',
    globalDefaults: {},
    pages: [],
    selectedVersions: {}
};

/**
 * Initialize the live changes display
 */
export function initializeLiveChanges() {
    createChangesPanel();
    loadOriginalData();
    updateChangesDisplay();
    console.log('✓ Live changes display initialized');
}

/**
 * Create the persistent changes panel at the bottom of the page
 */
function createChangesPanel() {
    const panel = document.createElement('div');
    panel.id = 'live-changes-panel';
    panel.className = 'live-changes-panel';
    panel.innerHTML = `
        <div class="changes-header">
            <div class="changes-title">
                <span class="changes-icon">📝</span>
                <span>Current Changes</span>
                <span class="changes-count">(0)</span>
            </div>
            <div class="changes-actions">
                <button class="changes-btn" id="copy-changes-btn" title="Copy JSON to clipboard">
                    📋 Copy JSON
                </button>
                <button class="changes-btn revert-btn" id="revert-all-btn" title="Revert all changes">
                    🔄 Revert All
                </button>
                <button class="changes-toggle" id="toggle-changes-btn" title="Expand/Collapse">
                    ▼
                </button>
            </div>
        </div>
        <div class="changes-body">
            <div class="changes-summary" id="changes-summary">
                <p class="no-changes">No changes yet. Make some edits to see them here!</p>
            </div>
            <div class="changes-json" id="changes-json">
                <pre><code>{
  "_format": "delta-only",
  "globalDefaults": {},
  "pages": [],
  "selectedVersions": {}
}</code></pre>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // Event listeners
    document.getElementById('copy-changes-btn').addEventListener('click', copyChangesToClipboard);
    document.getElementById('revert-all-btn').addEventListener('click', revertAllChanges);
    document.getElementById('toggle-changes-btn').addEventListener('click', toggleChangesPanel);
}

/**
 * Load original data from page attributes
 */
function loadOriginalData() {
    // This will be used to compare against current state
    // Store in module-level variable for comparison
    window._originalData = {
        globalDefaults: {},
        pages: {}
    };
    
    // Get global defaults
    const globalAttr = document.body.getAttribute('data-global-defaults');
    if (globalAttr) {
        try {
            window._originalData.globalDefaults = JSON.parse(globalAttr);
        } catch (e) {
            console.warn('Failed to parse global defaults:', e);
        }
    }
    
    // Get original page data
    document.querySelectorAll('.page-card').forEach(card => {
        const pageNum = card.getAttribute('data-page-number') || card.getAttribute('data-page-numbers');
        if (!pageNum) return;
        
        const textSpec = card.getAttribute('data-text-spec');
        if (textSpec) {
            try {
                window._originalData.pages[pageNum] = JSON.parse(textSpec);
            } catch (e) {
                console.warn(`Failed to parse text spec for page ${pageNum}:`, e);
            }
        }
    });
}

/**
 * Register a change (called by other modules)
 */
export function registerChange(changeType, data) {
    // Update the current changes object based on change type
    switch (changeType) {
        case 'global':
            updateGlobalChanges(data);
            break;
        case 'page':
            updatePageChanges(data);
            break;
        case 'version':
            updateVersionChanges(data);
            break;
    }
    
    updateChangesDisplay();
    
    // Notify listeners
    changesListeners.forEach(listener => listener(currentChanges));
}

/**
 * Update global changes
 */
function updateGlobalChanges(data) {
    const original = window._originalData?.globalDefaults || {};
    const changes = {};
    
    ['font', 'fontSize', 'color'].forEach(key => {
        if (data[key] !== undefined && data[key] !== original[key]) {
            changes[key] = data[key];
        }
    });
    
    currentChanges.globalDefaults = changes;
}

/**
 * Update page changes
 */
function updatePageChanges(data) {
    const { pageNumber, changes } = data;
    const original = window._originalData?.pages[pageNumber] || {};
    
    // Find or create page entry
    let pageEntry = currentChanges.pages.find(p => p.pageNumber === parseInt(pageNumber));
    
    if (!pageEntry) {
        pageEntry = { pageNumber: parseInt(pageNumber), text: {} };
        currentChanges.pages.push(pageEntry);
    }
    
    // Update changes
    let hasChanges = false;
    Object.entries(changes).forEach(([key, value]) => {
        if (value !== original[key]) {
            if (!pageEntry.text) pageEntry.text = {};
            pageEntry.text[key] = value;
            hasChanges = true;
        }
    });
    
    // Remove page entry if no changes
    if (!hasChanges || Object.keys(pageEntry.text || {}).length === 0) {
        currentChanges.pages = currentChanges.pages.filter(p => p.pageNumber !== parseInt(pageNumber));
    }
    
    // Sort pages
    currentChanges.pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

/**
 * Update version changes
 */
function updateVersionChanges(data) {
    const { pageNumber, version } = data;
    
    // Only include if not version 1 (default)
    if (version !== 1) {
        currentChanges.selectedVersions[pageNumber] = version;
    } else {
        delete currentChanges.selectedVersions[pageNumber];
    }
}

/**
 * Update the changes display
 */
function updateChangesDisplay() {
    const totalChanges = calculateTotalChanges();
    const summary = generateSummary();
    const json = JSON.stringify(currentChanges, null, 2);
    
    // Update count
    document.querySelector('.changes-count').textContent = `(${totalChanges})`;
    
    // Update summary
    const summaryEl = document.getElementById('changes-summary');
    if (totalChanges === 0) {
        summaryEl.innerHTML = '<p class="no-changes">No changes yet. Make some edits to see them here!</p>';
    } else {
        summaryEl.innerHTML = `
            <ul class="changes-list">
                ${summary.map(item => `<li class="change-item">${item}</li>`).join('')}
            </ul>
        `;
    }
    
    // Update JSON
    document.getElementById('changes-json').innerHTML = `<pre><code>${escapeHtml(json)}</code></pre>`;
    
    // Update revert button state
    const revertBtn = document.getElementById('revert-all-btn');
    if (revertBtn) {
        revertBtn.disabled = totalChanges === 0;
    }
}

/**
 * Calculate total number of changes
 */
function calculateTotalChanges() {
    let count = 0;
    
    // Global changes
    count += Object.keys(currentChanges.globalDefaults).length;
    
    // Page changes
    currentChanges.pages.forEach(page => {
        count += Object.keys(page.text || {}).length;
    });
    
    // Version selections
    count += Object.keys(currentChanges.selectedVersions).length;
    
    return count;
}

/**
 * Generate human-readable summary
 */
function generateSummary() {
    const summary = [];
    
    // Global changes
    Object.entries(currentChanges.globalDefaults).forEach(([key, value]) => {
        let displayValue = value;
        if (key === 'fontSize') {
            displayValue = `${value}pt`;
        }
        summary.push(`<strong>Global:</strong> ${key} → ${displayValue}`);
    });
    
    // Page changes
    currentChanges.pages.forEach(page => {
        Object.entries(page.text || {}).forEach(([key, value]) => {
            let displayValue = value;
            if (key === 'fontSize') {
                displayValue = `${value}pt`;
            }
            summary.push(`<strong>Page ${page.pageNumber}:</strong> ${key} → ${displayValue}`);
        });
    });
    
    // Version selections
    Object.entries(currentChanges.selectedVersions).forEach(([pageNum, version]) => {
        summary.push(`<strong>Page ${pageNum}:</strong> Approved version v${version}`);
    });
    
    return summary;
}

/**
 * Copy changes to clipboard
 */
async function copyChangesToClipboard() {
    const json = JSON.stringify(currentChanges, null, 2);
    
    try {
        await navigator.clipboard.writeText(json);
        showNotification('✓ Changes copied to clipboard!', 'success');
    } catch (err) {
        console.error('Failed to copy:', err);
        showNotification('✗ Failed to copy to clipboard', 'error');
    }
}

/**
 * Revert all changes
 */
function revertAllChanges() {
    if (!confirm('Are you sure you want to revert all changes? This cannot be undone.')) {
        return;
    }
    
    // Clear all changes
    currentChanges = {
        _format: 'delta-only',
        globalDefaults: {},
        pages: [],
        selectedVersions: {}
    };
    
    // Clear localStorage
    localStorage.removeItem('bookVersionSelections');
    
    // Reload the page to reset everything
    location.reload();
}

/**
 * Toggle changes panel expanded/collapsed
 */
function toggleChangesPanel() {
    const panel = document.getElementById('live-changes-panel');
    const btn = document.getElementById('toggle-changes-btn');
    
    if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        btn.textContent = '▼';
    } else {
        panel.classList.add('collapsed');
        btn.textContent = '▲';
    }
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Escape HTML for display
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Get current changes (for export)
 */
export function getCurrentChanges() {
    return currentChanges;
}

/**
 * Add change listener
 */
export function addChangeListener(listener) {
    changesListeners.push(listener);
}

/**
 * Revert page changes
 */
export function revertPageChanges(pageNumber) {
    // Remove page from changes
    currentChanges.pages = currentChanges.pages.filter(p => p.pageNumber !== parseInt(pageNumber));
    
    // Remove version selection
    delete currentChanges.selectedVersions[pageNumber];
    
    updateChangesDisplay();
    
    showNotification(`✓ Page ${pageNumber} changes reverted`, 'success');
}

/**
 * Revert global changes
 */
export function revertGlobalChanges() {
    currentChanges.globalDefaults = {};
    updateChangesDisplay();
    showNotification('✓ Global settings reverted', 'success');
}
