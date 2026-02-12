/**
 * Version Viewer - Navigate between multiple generated versions of each page
 * Simplified for browsing only (no approval/editing features)
 */

/**
 * Initialize version viewer controls for all pages with multiple versions
 */
export function initializeVersionViewer() {
    const pageCards = document.querySelectorAll('.page-card[data-versions]');
    
    console.log(`Initializing version viewer for ${pageCards.length} pages with versions...`);
    
    pageCards.forEach(card => {
        const versionsAttr = card.getAttribute('data-versions');
        if (!versionsAttr) return;
        
        try {
            const versions = JSON.parse(versionsAttr);
            if (versions.length > 1) {
                addVersionControls(card, versions);
            }
        } catch (e) {
            console.error('Failed to parse versions:', e);
        }
    });
    
    console.log('✓ Version viewer initialized');
}

/**
 * Add version navigation controls to a page card
 */
function addVersionControls(card, versions) {
    const container = card.querySelector('.page-image-container, .spread-image-container');
    if (!container) return;
    
    // Handle both single pages and spread pages
    const pageNum = card.getAttribute('data-page-number') || card.getAttribute('data-page-numbers');
    const currentVersion = parseInt(card.getAttribute('data-current-version')) || versions[0];
    
    // Create controls container
    const controls = document.createElement('div');
    controls.className = 'version-controls';
    
    // Create prev arrow
    const prevBtn = document.createElement('button');
    prevBtn.className = 'version-arrow version-arrow-prev';
    prevBtn.innerHTML = '←';
    prevBtn.setAttribute('aria-label', 'Previous version');
    prevBtn.addEventListener('click', () => navigateVersion(card, versions, -1));
    
    // Create next arrow
    const nextBtn = document.createElement('button');
    nextBtn.className = 'version-arrow version-arrow-next';
    nextBtn.innerHTML = '→';
    nextBtn.setAttribute('aria-label', 'Next version');
    nextBtn.addEventListener('click', () => navigateVersion(card, versions, 1));
    
    // Create version counter
    const counter = document.createElement('div');
    counter.className = 'version-counter';
    updateCounter(counter, versions.indexOf(currentVersion) + 1, versions.length);
    
    // Append controls
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(counter);
    container.appendChild(controls);
    
    // Store state
    card._versionState = {
        versions,
        currentIndex: versions.indexOf(currentVersion),
        pageNum
    };
}

/**
 * Navigate to next/previous version
 */
function navigateVersion(card, versions, delta) {
    const state = card._versionState;
    if (!state) return;
    
    // Update index with wrapping
    state.currentIndex = (state.currentIndex + delta + versions.length) % versions.length;
    const newVersion = versions[state.currentIndex];
    
    // Update card attribute
    card.setAttribute('data-current-version', newVersion);
    
    // Update image src (handle both single pages and spreads)
    const img = card.querySelector('.page-image-container img, .spread-image-container img');
    if (img) {
        const basePath = img.src.replace(/-v\d+\.jpg$/, '.jpg').replace(/page-\d+\.jpg$/, 
            match => match.replace('.jpg', `-v${newVersion}.jpg`));
        const newSrc = basePath.includes('-v') ? basePath : 
            basePath.replace(/page-(\d+)\.jpg/, `page-$1-v${newVersion}.jpg`);
        
        img.src = newSrc;
        img.alt = `Page ${state.pageNum} v${newVersion}`;
    }
    
    // Update counter
    const counter = card.querySelector('.version-counter');
    if (counter) {
        updateCounter(counter, state.currentIndex + 1, versions.length);
    }
    
    // Highlight current version briefly
    card.classList.add('version-changed');
    setTimeout(() => card.classList.remove('version-changed'), 300);
    
    console.log(`Page ${state.pageNum}: switched to version ${newVersion}`);
}

/**
 * Update version counter display
 */
function updateCounter(counter, current, total) {
    counter.textContent = `${current} / ${total}`;
}

/**
 * Get current version for a page (for external use)
 */
export function getCurrentVersion(pageNumber) {
    const card = document.querySelector(`.page-card[data-page-number="${pageNumber}"]`);
    if (!card) return 1;
    
    return parseInt(card.getAttribute('data-current-version')) || 1;
}

/**
 * Set version for a page programmatically
 */
export function setVersion(pageNumber, version) {
    const card = document.querySelector(`.page-card[data-page-number="${pageNumber}"]`);
    if (!card || !card._versionState) return;
    
    const state = card._versionState;
    const versionIndex = state.versions.indexOf(version);
    if (versionIndex === -1) {
        console.warn(`Version ${version} not found for page ${pageNumber}`);
        return;
    }
    
    // Calculate delta to reach target version
    const delta = versionIndex - state.currentIndex;
    navigateVersion(card, state.versions, delta);
}
