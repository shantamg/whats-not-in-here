/**
 * Main initialization - Simple version browsing only
 */

import { initializeVersionViewer } from './version-viewer.js';

/**
 * Initialize the version viewer system
 */
function initialize() {
    console.log('Initializing version viewer...');
    
    // Initialize version viewer for browsing page variations
    initializeVersionViewer();
    
    console.log('✓ Version viewer ready!');
}

// Run on DOMContentLoaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
