/**
 * Export System - Final UX Specification
 * Generate story.json with global defaults and page overrides
 * NOW INCLUDES: Version selections for multi-variation pages
 */

import { exportSettingsWithCascade } from './text-editor.js';
import { getVersionDataForExport } from './version-viewer.js';

/**
 * Export all text specifications to a story.json patch
 */
export function exportTextSpecs() {
    const cascadeData = exportSettingsWithCascade();
    const pages = [];

    Object.entries(cascadeData.pages).forEach(([pageNumber, pageData]) => {
        const pageEntry = {
            pageNumber: parseInt(pageNumber),
            text: {
                content: pageData.content || '',
            }
        };

        // If page uses global settings, mark it
        if (pageData.useGlobal) {
            // Content only - inherits everything else from global
        } else {
            // Include overrides
            if (pageData.font) {
                pageEntry.text.font = pageData.font;
            }
            if (pageData.fontSize) {
                pageEntry.text.fontSize = pageData.fontSize;
            }
            if (pageData.color) {
                pageEntry.text.color = pageData.color;
            }
        }

        // Always include position data if custom
        if (pageData.position && pageData.position !== 'bottom') {
            pageEntry.text.position = pageData.position;
        }
        if (pageData.widthPercent) {
            pageEntry.text.widthPercent = pageData.widthPercent;
        }
        if (pageData.leftPercent !== undefined) {
            pageEntry.text.leftPercent = pageData.leftPercent;
        }
        if (pageData.topPercent !== undefined) {
            pageEntry.text.topPercent = pageData.topPercent;
        }

        pages.push(pageEntry);
    });

    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // Count pages with overrides
    const pagesWithOverrides = pages.filter(p => 
        p.text.font || p.text.fontSize || p.text.color
    ).length;

    // Get scale factor metadata
    let scaleFactor = null;
    let originalWidth = null;
    let displayWidth = null;
    
    const firstOverlay = document.querySelector('.text-overlay');
    if (firstOverlay) {
        scaleFactor = parseFloat(firstOverlay.getAttribute('data-scale-factor'));
        const firstImg = document.querySelector('img[data-original-width]');
        if (firstImg) {
            originalWidth = parseInt(firstImg.getAttribute('data-original-width'));
            displayWidth = firstImg.naturalWidth;
        }
    }

    // Get selected version data for export
    const selectedVersions = getVersionDataForExport();
    const versionCount = Object.keys(selectedVersions).length;

    const patch = {
        _note: 'Complete book configuration export - Text settings + Image version selections',
        _instructions: [
            'This file contains BOTH text overlay settings AND selected image versions.',
            'To apply these changes to your book:',
            '1. Run: python scripts/apply_preview_config.py this_file.json',
            '',
            'The script will:',
            '- Approve selected image versions (copy to approved.png)',
            '- Merge text settings into story.json',
            '- Display a summary of all changes',
            '',
            'Or manually:',
            '1. For each page in selectedVersions: book approve-page PROJECT PAGE --variation N',
            '2. Merge globalDefaults and pages array into story.json',
            '3. Run: book add-text',
            '',
            'GLOBAL CASCADE MODEL:',
            '- Pages without font/fontSize/color = use globalDefaults',
            '- Pages with these properties = override global settings',
            `- ${pagesWithOverrides} of ${pages.length} pages have custom overrides`,
            `- ${versionCount} pages have selected image versions`
        ],
        _metadata: {
            exportDate: new Date().toISOString(),
            totalPages: pages.length,
            pagesWithOverrides: pagesWithOverrides,
            pagesUsingGlobal: pages.length - pagesWithOverrides,
            pagesWithVersionSelections: versionCount,
            scaleFactor: scaleFactor,
            originalImageWidth: originalWidth,
            previewImageWidth: displayWidth,
            note: originalWidth ? 
                `Preview images scaled to ${displayWidth}px. Font sizes ${(scaleFactor * 100).toFixed(1)}% of story.json values.` :
                'Preview rendering with live font size calculations'
        },
        selectedVersions: selectedVersions,
        textSettings: {
            globalDefaults: {
                font: cascadeData.globalDefaults.font || 'Quicksand-Medium.ttf',
                fontSize: cascadeData.globalDefaults.fontSize || 240,
                color: cascadeData.globalDefaults.colorMode === 'manual' ? 
                    cascadeData.globalDefaults.manualColor : null
            },
            pages: pages
        }
    };

    return patch;
}

/**
 * Download text specifications as JSON file
 */
export function downloadTextExport() {
    const patch = exportTextSpecs();
    const jsonString = JSON.stringify(patch, null, 2);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'book_config_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('Exported complete configuration:', patch);
}

/**
 * Copy text specifications to clipboard
 */
export async function copyTextExportToClipboard() {
    const patch = exportTextSpecs();
    const jsonString = JSON.stringify(patch, null, 2);

    try {
        await navigator.clipboard.writeText(jsonString);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

/**
 * Show export panel with preview and download options
 */
export function showExportPanel() {
    const existingPanel = document.querySelector('.export-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const patch = exportTextSpecs();
    const jsonString = JSON.stringify(patch, null, 2);
    const versionCount = patch._metadata.pagesWithVersionSelections || 0;

    const panel = document.createElement('div');
    panel.className = 'export-panel active';
    panel.innerHTML = `
        <div class="export-header">
            <h3>📦 Export Configuration</h3>
            <button class="panel-close-btn">✕</button>
        </div>
        
        <div class="export-body">
            <div class="export-info">
                <div class="info-row">
                    <span class="info-label">Total Pages:</span>
                    <span class="info-value">${patch._metadata.totalPages}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Text Overrides:</span>
                    <span class="info-value">${patch._metadata.pagesWithOverrides}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Version Selections:</span>
                    <span class="info-value">${versionCount}</span>
                </div>
            </div>

            <div class="preview-disclaimer">
                <strong>📦 Complete Configuration Export</strong><br>
                This file includes both <strong>text settings</strong> and <strong>image version selections</strong>.<br>
                <br>
                <strong>Quick Apply:</strong><br>
                <code>python scripts/apply_preview_config.py exported_config.json</code><br>
                <br>
                <strong>What it does:</strong><br>
                ✓ Approves selected image versions (${versionCount} pages)<br>
                ✓ Merges text settings into story.json<br>
                ✓ Displays summary of all changes<br>
                <br>
                <strong>Manual approach:</strong><br>
                1. For each page in <code>selectedVersions</code>: run <code>book approve-page PAGE --variation N</code><br>
                2. Copy <code>textSettings.globalDefaults</code> to your story.json<br>
                3. Merge <code>textSettings.pages</code> array into your story.json<br>
                4. Run: <code>book add-text</code>
            </div>

            <h4>Preview JSON:</h4>
            <pre class="export-preview">${escapeHtml(jsonString)}</pre>

            <div class="export-actions">
                <button id="download-export-btn" class="btn-primary">⬇️ Download JSON</button>
                <button id="copy-export-btn" class="btn-secondary">📋 Copy to Clipboard</button>
                <button id="close-export-btn" class="btn-secondary">Close</button>
            </div>

            <div id="export-status"></div>
        </div>
    `;

    // Insert after pages section
    const pageGrid = document.querySelector('.page-grid');
    if (pageGrid) {
        pageGrid.parentElement.insertBefore(panel, pageGrid.nextSibling);
    } else {
        document.querySelector('.container').appendChild(panel);
    }

    // Setup event listeners
    panel.querySelector('.panel-close-btn').addEventListener('click', () => panel.remove());
    panel.querySelector('#close-export-btn').addEventListener('click', () => panel.remove());

    panel.querySelector('#download-export-btn').addEventListener('click', () => {
        downloadTextExport();
        const versionInfo = versionCount > 0 ? ` (${versionCount} version selections)` : '';
        showStatus(panel, `✓ Downloaded book_config_export.json${versionInfo}`);
    });

    panel.querySelector('#copy-export-btn').addEventListener('click', async () => {
        const success = await copyTextExportToClipboard();
        if (success) {
            showStatus(panel, '✓ Copied to clipboard');
        } else {
            showStatus(panel, '✗ Failed to copy', 'error');
        }
    });

    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showStatus(panel, message, type = 'success') {
    const statusEl = panel.querySelector('#export-status');
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.className = type === 'error' ? 'status-error' : 'status-success';

    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Add export button to the navigation
 */
export function addExportButton() {
    const nav = document.querySelector('.sticky-nav');
    if (!nav) return;

    const exportBtn = document.createElement('a');
    exportBtn.href = '#';
    exportBtn.textContent = '📦 Export Config';
    exportBtn.style.marginLeft = 'auto';
    exportBtn.style.fontWeight = '600';
    exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showExportPanel();
    });

    nav.appendChild(exportBtn);
}

// Add export panel styles dynamically
const exportPanelStyles = document.createElement('style');
exportPanelStyles.textContent = `
.export-panel {
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 12px;
    margin: 2rem 0;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.export-header {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px 10px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.export-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: white;
    border: none;
}

.panel-close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    font-size: 1.5rem;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    line-height: 1;
    transition: background 0.2s;
}

.panel-close-btn:hover {
    background: rgba(255, 255, 255, 0.35);
}

.export-body {
    padding: 1.5rem;
}

.export-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.info-row {
    background: #f9f9f9;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.info-label {
    font-size: 0.875rem;
    color: #6b5b4f;
    font-weight: 600;
}

.info-value {
    font-size: 1.125rem;
    color: #3b82f6;
    font-weight: 700;
}

.export-body h4 {
    font-size: 0.875rem;
    text-transform: uppercase;
    color: #6b5b4f;
    margin: 1.5rem 0 0.75rem;
    letter-spacing: 0.05em;
}

.export-preview {
    background: #fafafa;
    border: 1px solid #e8e4df;
    padding: 1rem;
    border-radius: 8px;
    font-size: 0.8rem;
    max-height: 400px;
    overflow: auto;
    white-space: pre;
    font-family: 'Courier New', monospace;
}

.export-actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.5rem;
    flex-wrap: wrap;
}

.btn-primary {
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
    padding: 0.75rem 1.5rem;
    background: white;
    color: #3a2f27;
    border: 1px solid #e0dcd7;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: #f5f5f5;
    border-color: #c0c0c0;
}

#export-status {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.875rem;
    display: none;
}

.status-success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #10b981;
}

.status-error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #ef4444;
}

@media (max-width: 768px) {
    .export-actions {
        flex-direction: column;
    }
    
    .export-actions button {
        width: 100%;
    }
}
`;
document.head.appendChild(exportPanelStyles);
