/**
 * Text Editor - REDESIGNED
 * Click-to-select text overlay, popup panel for editing
 * Direct manipulation with instant feedback
 */

import { renderTextOverlay } from './text-renderer.js';
import { registerChange, revertPageChanges } from './live-changes.js';

let availableFonts = [];
let globalSettings = {
    font: null,
    fontSize: 240, // Real size for Pillow (4K images)
    displayFontSize: 70, // Scaled size for preview
    colorMode: 'auto',
    manualColor: '#000000'
};

// Constants for scaling
const ORIGINAL_IMAGE_WIDTH = 4096;
const PREVIEW_IMAGE_WIDTH = 1200;
const DEFAULT_SCALE_FACTOR = PREVIEW_IMAGE_WIDTH / ORIGINAL_IMAGE_WIDTH;

let selectedOverlay = null;
let dragState = null;
let resizeState = null;

/**
 * Initialize the text editor system
 */
export function initializeEditor() {
    loadAvailableFonts();
    addGlobalSettingsBar();
    makeTextOverlaysClickable();
    setupKeyboardShortcuts();
    console.log('✓ Text editor initialized (redesigned)');
}

function loadAvailableFonts() {
    const fontsAttr = document.body.getAttribute('data-available-fonts');
    if (fontsAttr) {
        try {
            availableFonts = JSON.parse(fontsAttr);
        } catch (e) {
            console.warn('Failed to parse available fonts:', e);
        }
    }
    if (availableFonts.length === 0) {
        availableFonts = [
            { file: 'Quicksand-Medium.ttf', name: 'Quicksand Medium' },
            { file: 'OpenSans-Regular.ttf', name: 'OpenSans Regular' }
        ];
    }
}

/**
 * Add global settings bar at the top of the pages section
 */
function addGlobalSettingsBar() {
    const pagesSection = document.getElementById('pages');
    if (!pagesSection) return;
    
    const bar = document.createElement('div');
    bar.className = 'global-settings-bar';
    bar.innerHTML = `
        <div class="global-settings-content">
            <div class="settings-title">Global Text Settings</div>
            <div class="settings-controls">
                <div class="control-inline">
                    <label>Font:</label>
                    <select id="global-font-select">
                        <option value="">Default</option>
                        ${availableFonts.map(f => `<option value="${f.file}">${f.name}</option>`).join('')}
                    </select>
                </div>
                <div class="control-inline">
                    <label>Size:</label>
                    <input type="range" id="global-size-slider" min="20" max="120" value="70" step="5">
                    <span id="global-size-value">70pt (240pt)</span>
                </div>
                <div class="control-inline">
                    <label>Color:</label>
                    <select id="global-color-mode">
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                    </select>
                    <input type="color" id="global-color-picker" value="#000000" style="display: none;">
                </div>
                <button class="revert-global-btn" id="revert-global-btn">
                    ↺ Revert Global
                </button>
            </div>
        </div>
    `;
    
    pagesSection.parentElement.insertBefore(bar, pagesSection);
    
    // Event listeners
    document.getElementById('global-font-select').addEventListener('change', updateGlobalFont);
    document.getElementById('global-size-slider').addEventListener('input', updateGlobalFontSize);
    document.getElementById('global-color-mode').addEventListener('change', updateGlobalColorMode);
    document.getElementById('global-color-picker').addEventListener('input', updateGlobalColor);
    document.getElementById('revert-global-btn').addEventListener('click', revertGlobal);
}

/**
 * Make all text overlays clickable
 */
function makeTextOverlaysClickable() {
    document.querySelectorAll('.text-overlay').forEach(overlay => {
        overlay.style.cursor = 'pointer';
        
        overlay.addEventListener('click', (e) => {
            e.stopPropagation();
            selectTextOverlay(overlay);
        });
        
        // Add revert button to card
        const card = overlay.closest('.page-card');
        if (card && !card.querySelector('.revert-page-btn')) {
            addRevertButtonToCard(card);
        }
    });
    
    // Deselect when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.text-overlay') && !e.target.closest('.text-edit-popup')) {
            deselectTextOverlay();
        }
    });
}

/**
 * Add revert button to page card
 */
function addRevertButtonToCard(card) {
    const cardBody = card.querySelector('.card-body');
    if (!cardBody) return;
    
    const btn = document.createElement('button');
    btn.className = 'revert-page-btn';
    btn.innerHTML = '↺ Revert Page';
    btn.title = 'Revert all changes to this page';
    
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const pageNumber = card.getAttribute('data-page-number');
        if (pageNumber && confirm(`Revert all changes to page ${pageNumber}?`)) {
            revertPageChanges(pageNumber);
            // Reload to show original settings
            location.reload();
        }
    });
    
    cardBody.appendChild(btn);
}

/**
 * Select a text overlay for editing
 */
function selectTextOverlay(overlay) {
    // Deselect previous
    if (selectedOverlay) {
        deselectTextOverlay();
    }
    
    selectedOverlay = overlay;
    overlay.classList.add('selected');
    
    // Add resize handles
    addResizeHandles(overlay);
    
    // Show edit popup
    showEditPopup(overlay);
}

/**
 * Deselect current text overlay
 */
function deselectTextOverlay() {
    if (!selectedOverlay) return;
    
    selectedOverlay.classList.remove('selected');
    removeResizeHandles(selectedOverlay);
    hideEditPopup();
    
    selectedOverlay = null;
}

/**
 * Add resize handles to overlay
 */
function addResizeHandles(overlay) {
    const handles = ['nw', 'ne', 'se', 'sw'];
    
    handles.forEach(position => {
        const handle = document.createElement('div');
        handle.className = `resize-handle resize-${position}`;
        handle.addEventListener('mousedown', (e) => startResize(e, overlay, position));
        overlay.appendChild(handle);
    });
    
    // Add drag handle (entire overlay)
    overlay.style.cursor = 'move';
    overlay.addEventListener('mousedown', startDrag);
}

/**
 * Remove resize handles
 */
function removeResizeHandles(overlay) {
    overlay.querySelectorAll('.resize-handle').forEach(handle => handle.remove());
    overlay.style.cursor = 'pointer';
    overlay.removeEventListener('mousedown', startDrag);
}

/**
 * Start dragging
 */
function startDrag(e) {
    if (e.target.classList.contains('resize-handle')) return;
    
    // Don't prevent default or stop propagation yet - let click through first
    
    const overlay = selectedOverlay;
    const container = overlay.closest('.page-image-container');
    const rect = container.getBoundingClientRect();
    
    dragState = {
        overlay: overlay,
        container: container,
        containerRect: rect,
        startX: e.clientX,
        startY: e.clientY,
        startLeft: overlay.offsetLeft,
        startTop: overlay.offsetTop,
        hasMoved: false
    };
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
}

function onDrag(e) {
    if (!dragState) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    // Only start dragging if mouse moved more than 5px (prevents accidental drags on click)
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!dragState.hasMoved && distance < 5) {
        return;
    }
    
    if (!dragState.hasMoved) {
        dragState.hasMoved = true;
        dragState.overlay.style.cursor = 'grabbing';
    }
    
    const newLeft = dragState.startLeft + dx;
    const newTop = dragState.startTop + dy;
    
    // Constrain to container
    const maxLeft = dragState.containerRect.width - dragState.overlay.offsetWidth;
    const maxTop = dragState.containerRect.height - dragState.overlay.offsetHeight;
    
    dragState.overlay.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
    dragState.overlay.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
}

function endDrag() {
    if (!dragState) return;
    
    const hasMoved = dragState.hasMoved;
    const overlay = dragState.overlay;
    
    // Restore cursor
    overlay.style.cursor = 'move';
    
    // Only save position if actually moved
    if (hasMoved) {
        const card = overlay.closest('.page-card');
        const pageNumber = card.getAttribute('data-page-number');
        
        const containerWidth = dragState.containerRect.width;
        const containerHeight = dragState.containerRect.height;
        
        const leftPercent = (overlay.offsetLeft / containerWidth) * 100;
        const topPercent = (overlay.offsetTop / containerHeight) * 100;
        
        // Update the overlay's text spec with new position
        const spec = JSON.parse(overlay.getAttribute('data-text-spec') || '{}');
        spec.leftPercent = leftPercent;
        spec.topPercent = topPercent;
        overlay.setAttribute('data-text-spec', JSON.stringify(spec));
        
        // Update changes
        registerChange('page', {
            pageNumber: pageNumber,
            changes: {
                leftPercent: leftPercent,
                topPercent: topPercent
            }
        });
    }
    
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    dragState = null;
}

/**
 * Start resizing
 */
function startResize(e, overlay, position) {
    e.preventDefault();
    e.stopPropagation();
    
    const container = overlay.closest('.page-image-container');
    const rect = container.getBoundingClientRect();
    
    resizeState = {
        overlay: overlay,
        container: container,
        containerRect: rect,
        position: position,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: overlay.offsetWidth,
        startHeight: overlay.offsetHeight,
        startLeft: overlay.offsetLeft,
        startTop: overlay.offsetTop
    };
    
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', endResize);
}

function onResize(e) {
    if (!resizeState) return;
    
    const dx = e.clientX - resizeState.startX;
    const dy = e.clientY - resizeState.startY;
    
    let newWidth = resizeState.startWidth;
    let newHeight = resizeState.startHeight;
    let newLeft = resizeState.startLeft;
    let newTop = resizeState.startTop;
    
    switch (resizeState.position) {
        case 'se':
            newWidth = resizeState.startWidth + dx;
            newHeight = resizeState.startHeight + dy;
            break;
        case 'sw':
            newWidth = resizeState.startWidth - dx;
            newLeft = resizeState.startLeft + dx;
            newHeight = resizeState.startHeight + dy;
            break;
        case 'ne':
            newWidth = resizeState.startWidth + dx;
            newTop = resizeState.startTop + dy;
            newHeight = resizeState.startHeight - dy;
            break;
        case 'nw':
            newWidth = resizeState.startWidth - dx;
            newLeft = resizeState.startLeft + dx;
            newTop = resizeState.startTop + dy;
            newHeight = resizeState.startHeight - dy;
            break;
    }
    
    // Enforce minimum size
    newWidth = Math.max(100, newWidth);
    newHeight = Math.max(50, newHeight);
    
    resizeState.overlay.style.width = `${newWidth}px`;
    resizeState.overlay.style.height = `${newHeight}px`;
    resizeState.overlay.style.left = `${newLeft}px`;
    resizeState.overlay.style.top = `${newTop}px`;
}

function endResize() {
    if (!resizeState) return;
    
    // Save size
    const overlay = resizeState.overlay;
    const card = overlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    const containerWidth = resizeState.containerRect.width;
    const containerHeight = resizeState.containerRect.height;
    
    const widthPercent = (overlay.offsetWidth / containerWidth) * 100;
    const leftPercent = (overlay.offsetLeft / containerWidth) * 100;
    const topPercent = (overlay.offsetTop / containerHeight) * 100;
    
    // Update the overlay's text spec with new dimensions and position
    const spec = JSON.parse(overlay.getAttribute('data-text-spec') || '{}');
    spec.widthPercent = widthPercent;
    spec.leftPercent = leftPercent;
    spec.topPercent = topPercent;
    overlay.setAttribute('data-text-spec', JSON.stringify(spec));
    
    // Update changes
    registerChange('page', {
        pageNumber: pageNumber,
        changes: {
            widthPercent: widthPercent,
            leftPercent: leftPercent,
            topPercent: topPercent
        }
    });
    
    // Re-render text with new dimensions
    updateOverlay(overlay);
    
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', endResize);
    resizeState = null;
}

/**
 * Show edit popup next to the selected overlay
 */
function showEditPopup(overlay) {
    // Remove existing popup
    hideEditPopup();
    
    const card = overlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    const container = overlay.closest('.page-image-container');
    
    // Get current settings
    const spec = JSON.parse(overlay.getAttribute('data-text-spec') || '{}');
    const useGlobal = spec.useGlobal !== false;
    
    const popup = document.createElement('div');
    popup.className = 'text-edit-popup';
    popup.innerHTML = `
        <div class="popup-header">
            <h4>Edit Text - Page ${pageNumber}</h4>
            <button class="popup-close">✕</button>
        </div>
        <div class="popup-body">
            <div class="control-group">
                <label>Font Family</label>
                <select id="page-font-select">
                    <option value="">Use Global</option>
                    ${availableFonts.map(f => 
                        `<option value="${f.file}" ${spec.font === f.file ? 'selected' : ''}>${f.name}</option>`
                    ).join('')}
                </select>
            </div>
            
            <div class="control-group">
                <label>Font Size</label>
                <input type="range" id="page-size-slider" min="20" max="120" value="${spec.displayFontSize || 70}" step="5">
                <span id="page-size-value">${spec.displayFontSize || 70}pt</span>
            </div>
            
            <div class="control-group">
                <label>Color</label>
                <input type="color" id="page-color-picker" value="${spec.color || '#000000'}">
            </div>
            
            <div class="control-group">
                <label>Text Alignment</label>
                <div class="alignment-buttons">
                    <button class="align-btn ${(!spec.alignment || spec.alignment === 'left') ? 'active' : ''}" data-align="left">
                        ◀ Left
                    </button>
                    <button class="align-btn ${spec.alignment === 'center' ? 'active' : ''}" data-align="center">
                        ▮ Center
                    </button>
                    <button class="align-btn ${spec.alignment === 'right' ? 'active' : ''}" data-align="right">
                        Right ▶
                    </button>
                </div>
            </div>
            
            <button class="reset-to-global-btn" id="reset-to-global-btn">
                🔄 Reset to Global Settings
            </button>
        </div>
    `;
    
    // Position popup next to image
    container.style.position = 'relative';
    container.appendChild(popup);
    
    // Event listeners
    popup.querySelector('.popup-close').addEventListener('click', () => hideEditPopup());
    popup.querySelector('#page-font-select').addEventListener('change', updatePageFont);
    popup.querySelector('#page-size-slider').addEventListener('input', updatePageFontSize);
    popup.querySelector('#page-color-picker').addEventListener('input', updatePageColor);
    popup.querySelectorAll('.align-btn').forEach(btn => {
        btn.addEventListener('click', () => updateAlignment(btn.getAttribute('data-align')));
    });
    popup.querySelector('#reset-to-global-btn').addEventListener('click', resetToGlobal);
}

/**
 * Hide edit popup
 */
function hideEditPopup() {
    document.querySelectorAll('.text-edit-popup').forEach(popup => popup.remove());
}

/**
 * Update global font
 */
function updateGlobalFont(e) {
    globalSettings.font = e.target.value || null;
    
    // Update all overlays using global
    updateAllOverlays();
    
    // Register change
    registerChange('global', globalSettings);
}

/**
 * Update global font size
 */
function updateGlobalFontSize(e) {
    const displaySize = parseInt(e.target.value);
    globalSettings.displayFontSize = displaySize;
    globalSettings.fontSize = Math.round(displaySize * (ORIGINAL_IMAGE_WIDTH / PREVIEW_IMAGE_WIDTH));
    
    document.getElementById('global-size-value').textContent = 
        `${displaySize}pt (${globalSettings.fontSize}pt)`;
    
    updateAllOverlays();
    registerChange('global', globalSettings);
}

/**
 * Update global color mode
 */
function updateGlobalColorMode(e) {
    globalSettings.colorMode = e.target.value;
    
    const colorPicker = document.getElementById('global-color-picker');
    colorPicker.style.display = e.target.value === 'manual' ? 'block' : 'none';
    
    updateAllOverlays();
    registerChange('global', globalSettings);
}

/**
 * Update global color
 */
function updateGlobalColor(e) {
    globalSettings.manualColor = e.target.value;
    
    updateAllOverlays();
    registerChange('global', globalSettings);
}

/**
 * Revert global settings
 */
function revertGlobal() {
    if (!confirm('Revert all global text settings?')) return;
    
    // Reset to defaults
    globalSettings = {
        font: null,
        fontSize: 240,
        displayFontSize: 70,
        colorMode: 'auto',
        manualColor: '#000000'
    };
    
    // Update UI
    document.getElementById('global-font-select').value = '';
    document.getElementById('global-size-slider').value = 70;
    document.getElementById('global-size-value').textContent = '70pt (240pt)';
    document.getElementById('global-color-mode').value = 'auto';
    document.getElementById('global-color-picker').style.display = 'none';
    
    updateAllOverlays();
    registerChange('global', globalSettings);
}

/**
 * Update page font
 */
function updatePageFont(e) {
    if (!selectedOverlay) return;
    
    const font = e.target.value || null;
    const card = selectedOverlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    // Update the overlay's text spec
    const spec = JSON.parse(selectedOverlay.getAttribute('data-text-spec') || '{}');
    spec.font = font;
    selectedOverlay.setAttribute('data-text-spec', JSON.stringify(spec));
    
    registerChange('page', {
        pageNumber: pageNumber,
        changes: { font: font }
    });
    
    // Re-render
    updateOverlay(selectedOverlay);
}

/**
 * Update page font size
 */
function updatePageFontSize(e) {
    if (!selectedOverlay) return;
    
    const displaySize = parseInt(e.target.value);
    const realSize = Math.round(displaySize * (ORIGINAL_IMAGE_WIDTH / PREVIEW_IMAGE_WIDTH));
    
    document.getElementById('page-size-value').textContent = `${displaySize}pt`;
    
    const card = selectedOverlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    // Update the overlay's text spec data attribute with new font size
    const spec = JSON.parse(selectedOverlay.getAttribute('data-text-spec') || '{}');
    spec.fontSize = realSize;
    spec.displayFontSize = displaySize;
    selectedOverlay.setAttribute('data-text-spec', JSON.stringify(spec));
    
    registerChange('page', {
        pageNumber: pageNumber,
        changes: {
            fontSize: realSize,
            displayFontSize: displaySize
        }
    });
    
    // Re-render the text with updated size
    updateOverlay(selectedOverlay);
}

/**
 * Update page color
 */
function updatePageColor(e) {
    if (!selectedOverlay) return;
    
    const color = e.target.value;
    const card = selectedOverlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    // Update the overlay's text spec
    const spec = JSON.parse(selectedOverlay.getAttribute('data-text-spec') || '{}');
    spec.color = color;
    selectedOverlay.setAttribute('data-text-spec', JSON.stringify(spec));
    
    registerChange('page', {
        pageNumber: pageNumber,
        changes: { color: color }
    });
    
    updateOverlay(selectedOverlay);
}

/**
 * Update alignment
 */
function updateAlignment(alignment) {
    if (!selectedOverlay) return;
    
    // Update button states
    document.querySelectorAll('.align-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-align') === alignment);
    });
    
    const card = selectedOverlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    // Update the overlay's text spec
    const spec = JSON.parse(selectedOverlay.getAttribute('data-text-spec') || '{}');
    spec.alignment = alignment;
    selectedOverlay.setAttribute('data-text-spec', JSON.stringify(spec));
    
    registerChange('page', {
        pageNumber: pageNumber,
        changes: { alignment: alignment }
    });
    
    updateOverlay(selectedOverlay);
}

/**
 * Reset page to global settings
 */
function resetToGlobal() {
    if (!selectedOverlay) return;
    
    const card = selectedOverlay.closest('.page-card');
    const pageNumber = card.getAttribute('data-page-number');
    
    registerChange('page', {
        pageNumber: pageNumber,
        changes: { useGlobal: true }
    });
    
    hideEditPopup();
    deselectTextOverlay();
    
    // Reload to reset
    location.reload();
}

/**
 * Update all overlays using global settings
 */
function updateAllOverlays() {
    document.querySelectorAll('.text-overlay').forEach(overlay => {
        const spec = JSON.parse(overlay.getAttribute('data-text-spec') || '{}');
        if (spec.useGlobal !== false) {
            updateOverlay(overlay);
        }
    });
}

/**
 * Update a single overlay
 */
function updateOverlay(overlay) {
    const card = overlay.closest('.page-card');
    const spec = JSON.parse(overlay.getAttribute('data-text-spec') || '{}');
    const pageType = overlay.getAttribute('data-page-type');
    
    const wasSelected = overlay.classList.contains('selected');
    
    renderTextOverlay(card, spec, pageType);
    
    // If it was selected, re-select it to restore event handlers
    if (wasSelected) {
        const newOverlay = card.querySelector('.text-overlay');
        if (newOverlay) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                selectTextOverlay(newOverlay);
            }, 10);
        }
    }
}

/**
 * Setup keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Escape to deselect
        if (e.key === 'Escape' && selectedOverlay) {
            deselectTextOverlay();
        }
        
        // Delete to remove overlay (if confirmed)
        if (e.key === 'Delete' && selectedOverlay) {
            if (confirm('Remove text from this page?')) {
                const card = selectedOverlay.closest('.page-card');
                const pageNumber = card.getAttribute('data-page-number');
                registerChange('page', {
                    pageNumber: pageNumber,
                    changes: { content: '' }
                });
                selectedOverlay.remove();
                deselectTextOverlay();
            }
        }
    });
}

/**
 * Export settings (for compatibility)
 */
export function exportSettingsWithCascade() {
    // Placeholder for export functionality
    return {
        globalDefaults: globalSettings,
        pages: {}
    };
}
