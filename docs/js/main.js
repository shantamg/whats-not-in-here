/**
 * Main initialization - REDESIGNED interactive book editor
 * Features: Live changes tracking, version approval, click-to-edit text
 */

import { initializeTextOverlays } from './text-renderer.js';
import { initializeEditor } from './text-editor.js';
import { initializeVersionViewer } from './version-viewer.js';
import { initializeLiveChanges } from './live-changes.js';

/**
 * Load font CSS dynamically from available fonts
 */
function loadFontCSS() {
    const fontsAttr = document.body.getAttribute('data-available-fonts');
    if (!fontsAttr) return;

    try {
        const fonts = JSON.parse(fontsAttr);
        
        // Generate @font-face rules
        const fontFaces = fonts.map(font => {
            const family = font.name;
            const filename = font.file;
            
            return `
                @font-face {
                    font-family: '${family}';
                    src: url('fonts/${filename}') format('truetype');
                    font-display: swap;
                }
            `;
        }).join('\n');

        // Inject into document
        const style = document.createElement('style');
        style.textContent = fontFaces;
        document.head.appendChild(style);

        console.log(`✓ Loaded ${fonts.length} fonts for preview`);
    } catch (e) {
        console.error('Failed to load font CSS:', e);
    }
}

/**
 * Initialize the complete system
 */
function initialize() {
    console.log('🚀 Initializing REDESIGNED interactive book editor...');
    
    // Load fonts
    loadFontCSS();
    
    // Initialize text overlays (rendering)
    initializeTextOverlays();
    
    // Initialize live changes display (must be before editor/viewer)
    initializeLiveChanges();
    
    // Initialize interactive editor (click-to-edit)
    initializeEditor();
    
    // Initialize version viewer (with approve button)
    initializeVersionViewer();
    
    console.log('✅ Interactive book editor ready!');
    console.log('   • Click any text to edit');
    console.log('   • Use arrow keys to browse versions');
    console.log('   • Click "Approve" to select a version');
    console.log('   • Watch changes update live at the bottom');
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
