/**
 * Version Viewer - Navigate and approve page variations
 * REDESIGNED: Prominent approve button, integrated with live changes
 */

import { registerChange } from './live-changes.js';

let versionData = {};
let currentVersions = {}; // pageNumber -> currently VIEWING index
let selectedVersions = {}; // pageNumber -> SELECTED/APPROVED index

/**
 * Initialize version viewer system
 */
export function initializeVersionViewer() {
    console.log('Initializing version viewer...');
    
    // Load saved selections from localStorage
    loadVersionSelections();
    
    // Check if metadata is available in global scope
    if (window.versionMetadata) {
        initializeWithVersionMetadata(window.versionMetadata);
    } else {
        console.warn('No version metadata found, using auto-detection');
        detectVersions();
        addVersionUIToPages();
    }
    
    console.log('✓ Version viewer initialized');
    console.log('  Selected versions:', selectedVersions);
}

// Make function available globally for metadata script
window.initializeWithVersionMetadata = initializeWithVersionMetadata;

/**
 * Detect all available versions for each page
 */
function detectVersions() {
    const pageCards = document.querySelectorAll('.page-card');
    
    pageCards.forEach(card => {
        const pageNumber = parseInt(card.getAttribute('data-page-number'));
        const imgElement = card.querySelector('img');
        
        if (!imgElement) return;
        
        const imgSrc = imgElement.getAttribute('src');
        const basePath = imgSrc.substring(0, imgSrc.lastIndexOf('/') + 1);
        const filename = imgSrc.substring(imgSrc.lastIndexOf('/') + 1);
        
        const pageMatch = filename.match(/page-(\d+)/);
        if (!pageMatch) return;
        
        const pageNum = pageMatch[1];
        const versions = detectAvailableVersions(basePath, pageNum);
        
        if (versions.length > 1) {
            versionData[pageNumber] = {
                basePath: basePath,
                pageNum: pageNum,
                versions: versions,
                currentIndex: getCurrentVersionIndex(versions, filename)
            };
            
            currentVersions[pageNumber] = versionData[pageNumber].currentIndex;
            
            console.log(`Page ${pageNumber}: Found ${versions.length} versions`);
        }
    });
}

function detectAvailableVersions(basePath, pageNum) {
    // Placeholder - in production this should come from metadata
    return Array.from({ length: 3 }, (_, i) => ({
        index: i + 1,
        filename: `page-${pageNum}-v${i + 1}.jpg`,
        fullPath: `${basePath}page-${pageNum}-v${i + 1}.jpg`,
        label: `v${i + 1}`
    }));
}

function getCurrentVersionIndex(versions, filename) {
    const versionMatch = filename.match(/-v(\d+)\./);
    if (versionMatch) {
        const vNum = parseInt(versionMatch[1]);
        const index = versions.findIndex(v => v.index === vNum);
        return index >= 0 ? index : 0;
    }
    return 0;
}

/**
 * Add version UI to pages with multiple versions
 */
function addVersionUIToPages() {
    Object.entries(versionData).forEach(([pageNumber, data]) => {
        const card = document.querySelector(`.page-card[data-page-number="${pageNumber}"]`);
        if (!card) return;
        
        const container = card.querySelector('.page-image-container');
        if (!container) return;
        
        // Add version navigation UI
        const versionUI = createVersionUI(pageNumber, data);
        container.appendChild(versionUI);
        
        // Update badge
        updateVersionBadge(card, data);
    });
}

/**
 * Create version navigation UI with prominent approve button
 */
function createVersionUI(pageNumber, data) {
    const selectedIndex = selectedVersions[pageNumber] !== undefined ? 
        selectedVersions[pageNumber] : data.currentIndex;
    const viewingLabel = data.versions[data.currentIndex].label;
    const selectedLabel = data.versions[selectedIndex].label;
    const isViewingSelected = data.currentIndex === selectedIndex;
    
    const ui = document.createElement('div');
    ui.className = 'version-nav';
    ui.innerHTML = `
        <div class="version-status">
            <span>Viewing: <span class="version-status-viewing">${viewingLabel}</span></span>
            <span class="version-status-separator">|</span>
            <span>Approved: <span class="version-status-selected">${selectedLabel}</span></span>
        </div>
        
        <div class="version-controls">
            <button class="version-nav-btn version-prev" aria-label="Previous version">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            
            <div class="version-indicator">
                <span class="version-current">${data.currentIndex + 1}</span>
                <span class="version-separator">/</span>
                <span class="version-total">${data.versions.length}</span>
            </div>
            
            <button class="version-nav-btn version-next" aria-label="Next version">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            
            ${!isViewingSelected ? `
                <button class="approve-version-btn" data-page="${pageNumber}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approve This Version
                </button>
            ` : `
                <div class="approved-indicator">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Approved
                </div>
            `}
        </div>
        
        <div class="version-labels">
            ${data.versions.map((v, i) => {
                const isViewing = i === data.currentIndex;
                const isSelected = i === selectedIndex;
                let classes = 'version-label';
                if (isViewing) classes += ' viewing';
                if (isSelected) classes += ' selected';
                
                return `
                    <button class="${classes}" 
                            data-version="${i}"
                            aria-label="View version ${v.label}">
                        ${v.label}${isSelected ? '<span class="version-checkmark">✓</span>' : ''}
                    </button>
                `;
            }).join('')}
        </div>
    `;
    
    // Add event listeners
    setupVersionNavListeners(ui, pageNumber, data);
    
    return ui;
}

/**
 * Setup event listeners for version navigation
 */
function setupVersionNavListeners(ui, pageNumber, data) {
    const prevBtn = ui.querySelector('.version-prev');
    const nextBtn = ui.querySelector('.version-next');
    const labels = ui.querySelectorAll('.version-label');
    const approveBtn = ui.querySelector('.approve-version-btn');
    
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateVersion(pageNumber, -1);
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateVersion(pageNumber, 1);
    });
    
    labels.forEach(label => {
        label.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetVersion = parseInt(label.getAttribute('data-version'));
            switchToVersion(pageNumber, targetVersion);
        });
    });
    
    if (approveBtn) {
        approveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            approveCurrentVersion(pageNumber);
        });
    }
    
    // Keyboard navigation
    ui.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateVersion(pageNumber, -1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateVersion(pageNumber, 1);
        } else if (e.key === 'Enter' && approveBtn) {
            e.preventDefault();
            approveCurrentVersion(pageNumber);
        }
    });
}

/**
 * Navigate to relative version (next/prev)
 */
function navigateVersion(pageNumber, direction) {
    const data = versionData[pageNumber];
    if (!data) return;
    
    const currentIndex = currentVersions[pageNumber];
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) {
        newIndex = data.versions.length - 1;
    } else if (newIndex >= data.versions.length) {
        newIndex = 0;
    }
    
    switchToVersion(pageNumber, newIndex);
}

/**
 * Switch to a specific version (for viewing/browsing only)
 */
async function switchToVersion(pageNumber, versionIndex) {
    const data = versionData[pageNumber];
    if (!data || versionIndex < 0 || versionIndex >= data.versions.length) return;
    
    const card = document.querySelector(`.page-card[data-page-number="${pageNumber}"]`);
    if (!card) return;
    
    const imgElement = card.querySelector('img');
    const version = data.versions[versionIndex];
    
    // Update image source
    imgElement.src = version.fullPath;
    
    // Update currently viewing version
    currentVersions[pageNumber] = versionIndex;
    
    // Update UI
    updateVersionUI(card, pageNumber, versionIndex, data.versions.length);
    
    // Re-render text overlay if exists
    const overlay = card.querySelector('.text-overlay');
    if (overlay) {
        const specAttr = overlay.getAttribute('data-text-spec');
        const pageType = overlay.getAttribute('data-page-type');
        if (specAttr) {
            try {
                const spec = JSON.parse(specAttr);
                const { renderTextOverlay } = await import('./text-renderer.js');
                renderTextOverlay(card, spec, pageType);
            } catch (e) {
                console.error('Failed to re-render text overlay:', e);
            }
        }
    }
    
    console.log(`Viewing page ${pageNumber} version ${versionIndex + 1}/${data.versions.length}`);
}

/**
 * Approve the currently viewing version (PROMINENT ACTION)
 */
function approveCurrentVersion(pageNumber) {
    const viewingIndex = currentVersions[pageNumber];
    if (viewingIndex === undefined) return;
    
    const data = versionData[pageNumber];
    if (!data) return;
    
    // Mark this version as approved
    selectedVersions[pageNumber] = viewingIndex;
    
    // Save to localStorage
    saveVersionSelections();
    
    // Notify live changes system
    const versionNumber = data.versions[viewingIndex].index;
    registerChange('version', {
        pageNumber: pageNumber,
        version: versionNumber
    });
    
    // Update UI
    const card = document.querySelector(`.page-card[data-page-number="${pageNumber}"]`);
    if (card) {
        updateVersionUI(card, pageNumber, viewingIndex, data.versions.length);
    }
    
    // Show success animation
    showApprovalAnimation(card);
    
    console.log(`✓ Approved page ${pageNumber} version ${viewingIndex + 1}`);
}

/**
 * Show approval animation
 */
function showApprovalAnimation(card) {
    const versionNav = card.querySelector('.version-nav');
    if (!versionNav) return;
    
    // Create checkmark animation
    const checkmark = document.createElement('div');
    checkmark.className = 'approval-checkmark';
    checkmark.innerHTML = `
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    `;
    
    versionNav.appendChild(checkmark);
    
    setTimeout(() => {
        checkmark.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        checkmark.classList.remove('show');
        setTimeout(() => checkmark.remove(), 300);
    }, 1500);
}

/**
 * Update version UI to reflect current viewing and approved states
 */
function updateVersionUI(card, pageNumber, viewingIndex, totalVersions) {
    const versionNav = card.querySelector('.version-nav');
    if (!versionNav) return;
    
    const data = versionData[pageNumber];
    if (!data) return;
    
    const selectedIndex = selectedVersions[pageNumber];
    const isViewingSelected = viewingIndex === selectedIndex;
    
    // Update status indicator
    const statusViewing = versionNav.querySelector('.version-status-viewing');
    const statusSelected = versionNav.querySelector('.version-status-selected');
    if (statusViewing && data.versions[viewingIndex]) {
        statusViewing.textContent = data.versions[viewingIndex].label;
    }
    if (statusSelected && data.versions[selectedIndex]) {
        statusSelected.textContent = data.versions[selectedIndex].label;
    }
    
    // Update indicator
    const currentSpan = versionNav.querySelector('.version-current');
    if (currentSpan) {
        currentSpan.textContent = viewingIndex + 1;
    }
    
    // Update version labels
    const labels = versionNav.querySelectorAll('.version-label');
    labels.forEach((label, i) => {
        const isViewing = i === viewingIndex;
        const isSelected = i === selectedIndex;
        
        label.classList.remove('viewing', 'selected');
        
        if (isViewing) label.classList.add('viewing');
        if (isSelected) label.classList.add('selected');
        
        const existingCheck = label.querySelector('.version-checkmark');
        if (isSelected && !existingCheck) {
            const checkmark = document.createElement('span');
            checkmark.className = 'version-checkmark';
            checkmark.innerHTML = '✓';
            label.appendChild(checkmark);
        } else if (!isSelected && existingCheck) {
            existingCheck.remove();
        }
    });
    
    // Update approve button / approved indicator
    const controls = versionNav.querySelector('.version-controls');
    const existingBtn = controls.querySelector('.approve-version-btn');
    const existingIndicator = controls.querySelector('.approved-indicator');
    
    if (isViewingSelected) {
        // Show "Approved" indicator
        if (existingBtn) existingBtn.remove();
        if (!existingIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'approved-indicator';
            indicator.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Approved
            `;
            controls.appendChild(indicator);
        }
    } else {
        // Show "Approve" button
        if (existingIndicator) existingIndicator.remove();
        if (!existingBtn) {
            const btn = document.createElement('button');
            btn.className = 'approve-version-btn';
            btn.setAttribute('data-page', pageNumber);
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Approve This Version
            `;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                approveCurrentVersion(pageNumber);
            });
            controls.appendChild(btn);
        }
    }
}

/**
 * Update version badge in card body
 */
function updateVersionBadge(card, data) {
    const cardBody = card.querySelector('.card-body');
    if (!cardBody) return;
    
    let versionBadge = cardBody.querySelector('.version-info-badge');
    
    if (!versionBadge) {
        versionBadge = document.createElement('span');
        versionBadge.className = 'badge version-info-badge';
        
        const pageNum = cardBody.querySelector('.page-num');
        if (pageNum) {
            pageNum.after(versionBadge);
        } else {
            cardBody.insertBefore(versionBadge, cardBody.firstChild);
        }
    }
    
    versionBadge.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
        </svg>
        ${data.versions.length} versions
    `;
}

/**
 * Get version data for export
 */
export function getVersionDataForExport() {
    const result = {};
    
    Object.entries(selectedVersions).forEach(([pageNumber, selectedIndex]) => {
        const data = versionData[pageNumber];
        if (!data) return;
        
        const version = data.versions[selectedIndex];
        const versionNum = parseInt(version.label.replace(/[^0-9]/g, ''));
        
        result[pageNumber] = versionNum;
    });
    
    return result;
}

/**
 * Initialize with version metadata from server/build
 */
export function initializeWithVersionMetadata(metadata) {
    versionData = {};
    
    Object.entries(metadata).forEach(([pageNumber, data]) => {
        versionData[pageNumber] = {
            basePath: data.basePath || 'images/pages/',
            pageNum: data.pageNum || pageNumber.toString().padStart(2, '0'),
            versions: data.versions,
            currentIndex: data.currentIndex || 0
        };
        
        currentVersions[pageNumber] = data.currentIndex || 0;
        
        if (selectedVersions[pageNumber] === undefined) {
            selectedVersions[pageNumber] = data.currentIndex || 0;
        }
    });
    
    addVersionUIToPages();
}

/**
 * Load version selections from localStorage
 */
export function loadVersionSelections() {
    try {
        const saved = localStorage.getItem('bookVersionSelections');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.assign(selectedVersions, parsed);
            console.log('Loaded saved version selections:', selectedVersions);
        }
    } catch (e) {
        console.error('Failed to load version selections:', e);
    }
}

/**
 * Save version selections to localStorage
 */
export function saveVersionSelections() {
    try {
        localStorage.setItem('bookVersionSelections', JSON.stringify(selectedVersions));
    } catch (e) {
        console.error('Failed to save version selections:', e);
    }
}
