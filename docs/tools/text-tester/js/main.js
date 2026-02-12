/**
 * Main application initialization and state management
 * Multi-page gallery view version
 */

// Global application state
window.TextOverlayApp = {
    textOverlays: [],
    activeOverlay: null,
    pages: []
};

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Text Overlay Tester (Multi-Page Gallery) initialized');
    
    // Initialize modules in order
    TextEditor.init();
    ExportManager.init();
    PageLoader.init(); // This loads all pages automatically
    
    // Setup global event listeners
    setupEventListeners();
});

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    const clearAllTextBtn = document.getElementById('clearAllTextBtn');
    
    if (clearAllTextBtn) {
        clearAllTextBtn.addEventListener('click', function() {
            if (confirm('Clear all text overlays from ALL pages? This cannot be undone.')) {
                TextEditor.clearAllOverlays();
                console.log('Cleared all text overlays');
            }
        });
    }
}

/**
 * Update UI state when text overlay is selected
 */
function onTextOverlaySelected(overlay) {
    const app = window.TextOverlayApp;
    app.activeOverlay = overlay;
}

/**
 * Update UI state when no overlay is selected
 */
function onTextOverlayDeselected() {
    const app = window.TextOverlayApp;
    app.activeOverlay = null;
}

// Make functions globally accessible (backwards compatibility)
window.onTextOverlaySelected = onTextOverlaySelected;
window.onTextOverlayDeselected = onTextOverlayDeselected;
