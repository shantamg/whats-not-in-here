/**
 * Page loader module - loads ALL published pages in a gallery view
 */

const PageLoader = (function() {
    let pages = [];
    let loadedPages = [];
    let storyJsonPages = []; // Store full page objects from story.json for export

    /**
     * Initialize the page loader
     */
    function init() {
        loadAllPublishedPages();
    }

    /**
     * Load all published pages and render gallery
     */
    async function loadAllPublishedPages() {
        const loadingMessage = document.getElementById('loadingMessage');
        const pagesGallery = document.getElementById('pagesGallery');
        
        try {
            // Try to load story.json to get page metadata including spreads
            let storyData = null;
            try {
                const storyResponse = await fetch('../../story.json');
                if (storyResponse.ok) {
                    storyData = await storyResponse.json();
                }
            } catch (e) {
                console.warn('Could not load story.json:', e);
            }

            // Try to load pages.json from the preview
            const response = await fetch('../../data/pages.json');
            
            if (response.ok) {
                const data = await response.json();
                pages = data.pages || [];
            } else {
                // Fallback: detect pages by scanning images directory
                await detectPagesFromImages();
            }

            // Enrich pages with story.json metadata if available
            if (storyData && storyData.pages) {
                // Store full page objects for export merging
                storyJsonPages = storyData.pages;
                // First, enrich existing pages
                pages.forEach(page => {
                    const storyPage = storyData.pages.find(p => p.pageNumber == page.number);
                    if (storyPage) {
                        page.type = storyPage.type;
                        page.companionPage = storyPage.companionPage;
                        page.spreadStart = storyPage.spreadStart;
                    }
                });
                
                // Second, add any missing spread-companion pages
                storyData.pages.forEach(storyPage => {
                    if (storyPage.type === 'spread-companion') {
                        const exists = pages.find(p => p.number == storyPage.pageNumber);
                        if (!exists) {
                            // Find the spread-start page to copy its path
                            const startPage = pages.find(p => p.number == storyPage.spreadStart);
                            if (startPage) {
                                pages.push({
                                    number: storyPage.pageNumber,
                                    path: startPage.path,
                                    name: `Page ${storyPage.pageNumber}`,
                                    type: storyPage.type,
                                    spreadStart: storyPage.spreadStart
                                });
                            }
                        } else {
                            // Update existing companion page to use spread-start's path
                            const startPage = pages.find(p => p.number == exists.spreadStart);
                            if (startPage) {
                                exists.path = startPage.path;
                            }
                        }
                    }
                });
                
                // Sort pages by number
                pages.sort((a, b) => a.number - b.number);
            }

            if (pages.length === 0) {
                loadingMessage.innerHTML = '<p class="warning-message">No published pages found. Publish your book first with <code>book publish</code>.</p>';
                return;
            }

            // Hide loading, show gallery
            loadingMessage.style.display = 'none';
            pagesGallery.style.display = 'block';

            // Render all pages
            await renderAllPages();

            console.log('Loaded', pages.length, 'pages');
            
        } catch (error) {
            console.error('Failed to load pages:', error);
            loadingMessage.innerHTML = '<p class="warning-message">Could not load published pages. Error: ' + error.message + '</p>';
        }
    }

    /**
     * Detect pages by scanning the images directory
     */
    async function detectPagesFromImages() {
        // Generate common page paths (use .jpg for published web previews)
        const possiblePages = [];
        for (let i = 1; i <= 24; i++) {
            const pageNum = i.toString().padStart(2, '0');
            possiblePages.push({
                number: i,
                path: `../../images/pages/page-${pageNum}.jpg`,
                name: `Page ${i}`
            });
        }
        
        // Test which ones exist
        const existingPages = [];
        for (const page of possiblePages) {
            try {
                const response = await fetch(page.path, { method: 'HEAD' });
                if (response.ok) {
                    existingPages.push(page);
                }
            } catch (e) {
                // Page doesn't exist, skip
            }
        }
        
        pages = existingPages;
    }

    /**
     * Render all pages in the gallery as spreads (pairs)
     */
    async function renderAllPages() {
        const pagesGallery = document.getElementById('pagesGallery');
        pagesGallery.innerHTML = '';

        let i = 0;
        while (i < pages.length) {
            const currentPage = pages[i];
            
            // Skip spread-companion pages (they're handled with their spread-start)
            if (currentPage.type === 'spread-companion') {
                i++;
                continue;
            }

            // Check if this is a spread-start page
            if (currentPage.type === 'spread-start' && currentPage.companionPage) {
                // Find the companion page
                const companionPage = pages.find(p => p.number == currentPage.companionPage);
                
                renderSpreadPair(currentPage, companionPage);
                i++; // Skip both pages (companion will be skipped by check above)
            } else {
                // Regular page pairing (2 pages side-by-side)
                const nextPage = pages[i + 1];
                
                // Don't pair if next page is a spread-start or spread-companion
                if (nextPage && nextPage.type !== 'spread-start' && nextPage.type !== 'spread-companion') {
                    renderSpreadPair(currentPage, nextPage);
                    i += 2; // Skip both pages
                } else {
                    // Single page
                    renderSpreadPair(currentPage, null);
                    i++;
                }
            }
        }
    }

    /**
     * Render a spread (2 pages side-by-side or 1 page alone)
     */
    function renderSpreadPair(leftPage, rightPage) {
        const pagesGallery = document.getElementById('pagesGallery');
        const isSinglePage = !rightPage;
        const isDoublePageSpread = leftPage.type === 'spread-start' && rightPage;

        // Create spread container
        const spreadContainer = document.createElement('div');
        spreadContainer.className = 'spread-container';

        // Create spread header
        const spreadHeader = document.createElement('div');
        spreadHeader.className = 'spread-header';
        const leftNum = leftPage.number || leftPage.pageNumber || '?';
        const rightNum = rightPage ? (rightPage.number || rightPage.pageNumber) : null;
        
        let spreadTitle;
        if (isDoublePageSpread) {
            spreadTitle = `Double-Page Spread: Pages ${leftNum}-${rightNum}`;
        } else if (rightNum) {
            spreadTitle = `Pages ${leftNum}-${rightNum}`;
        } else {
            spreadTitle = `Page ${leftNum}`;
        }
        
        spreadHeader.innerHTML = `<span class="spread-title">${spreadTitle}</span>`;
        spreadContainer.appendChild(spreadHeader);

        // Create spread layout
        const spreadLayout = document.createElement('div');
        spreadLayout.className = isSinglePage ? 'spread-layout single-spread' : 'spread-layout';

        // Render pages
        if (isDoublePageSpread) {
            // Both pages use the same image (spread-start page's path), split in half
            const spreadImagePath = leftPage.path;
            console.log(`Double-page spread ${leftNum}-${rightNum}: using image ${spreadImagePath}`);
            
            renderPageInSpread(leftPage, spreadLayout, spreadImagePath, true, false);  // left half
            renderPageInSpread(rightPage, spreadLayout, spreadImagePath, false, true); // right half
        } else {
            // Regular pages with separate images
            renderPageInSpread(leftPage, spreadLayout, null);
            if (rightPage) {
                renderPageInSpread(rightPage, spreadLayout, null);
            }
        }

        spreadContainer.appendChild(spreadLayout);
        pagesGallery.appendChild(spreadContainer);
    }

    /**
     * Render a single page within a spread
     */
    function renderPageInSpread(page, spreadLayout, spreadImagePath = null, isLeftHalf = false, isRightHalf = false) {
        const pageNum = page.number || page.pageNumber || '?';
        // Use explicit spread image path if provided, otherwise use page's own path
        const pagePath = spreadImagePath || page.path || `../../images/pages/page-${pageNum.toString().padStart(2, '0')}.jpg`;

        // Create page preview container
        const pagePreview = document.createElement('div');
        pagePreview.className = 'page-preview';
        pagePreview.dataset.pageNumber = pageNum;

        // Create page header
        const pageHeader = document.createElement('div');
        pageHeader.className = 'page-header';
        pageHeader.innerHTML = `
            <span class="page-number">Page ${pageNum}</span>
            <button class="add-text-btn" data-page-number="${pageNum}">➕ Add Text</button>
        `;

        // Create page canvas (image + overlays container)
        const pageCanvas = document.createElement('div');
        pageCanvas.className = 'page-canvas';
        pageCanvas.dataset.pageNumber = pageNum;

        // Create image wrapper for positioning overlays
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'image-wrapper';
        imageWrapper.id = `imageWrapper-${pageNum}`;

        // Create image element
        const img = document.createElement('img');
        img.alt = `Page ${pageNum}`;
        img.dataset.pageNumber = pageNum;

        // Assemble structure
        imageWrapper.appendChild(img);
        pageCanvas.appendChild(imageWrapper);
        pagePreview.appendChild(pageHeader);
        pagePreview.appendChild(pageCanvas);
        spreadLayout.appendChild(pagePreview);

        // Setup "Add Text" button
        const addTextBtn = pageHeader.querySelector('.add-text-btn');
        addTextBtn.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent deselection
            const pageNumber = this.dataset.pageNumber;
            addTextToPage(pageNumber);
        });

        // Track loaded page
        loadedPages.push({
            number: pageNum,
            element: pagePreview,
            imageWrapper: imageWrapper,
            imageElement: img,
            path: pagePath
        });

        // Setup image load handlers
        if (isLeftHalf || isRightHalf) {
            let hasProcessed = false; // Prevent double-processing
            img.onload = function() {
                if (hasProcessed) return;
                
                // Wait for naturalWidth/Height to be available
                if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                    console.warn(`Page ${pageNum} dimensions not ready, retrying...`);
                    setTimeout(() => img.onload(), 50);
                    return;
                }
                
                hasProcessed = true;
                console.log(`Page ${pageNum} image loaded (${img.naturalWidth}x${img.naturalHeight}), splitting ${isLeftHalf ? 'left' : 'right'} half`);
                splitSpreadImage(img, isLeftHalf ? 'left' : 'right');
                loadTextForPage(pageNum, imageWrapper, img);
            };
            img.onerror = function() {
                console.error(`Failed to load image for page ${pageNum}: ${pagePath}`);
            };
        } else {
            img.onload = function() {
                loadTextForPage(pageNum, imageWrapper, img);
            };
            img.onerror = function() {
                console.error(`Failed to load image for page ${pageNum}: ${pagePath}`);
            };
        }

        // Set crossOrigin to avoid CORS issues with canvas
        img.crossOrigin = 'anonymous';
        
        // Set src last to trigger load
        img.src = pagePath;
    }

    /**
     * Split a wide spread image in half (left or right)
     */
    function splitSpreadImage(img, side) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Original image dimensions
            const fullWidth = img.naturalWidth;
            const fullHeight = img.naturalHeight;

            console.log(`Splitting image: ${fullWidth}x${fullHeight}, side: ${side}`);

            if (fullWidth === 0 || fullHeight === 0) {
                console.error('Image has zero dimensions, cannot split');
                return;
            }

            // Half width for split
            const halfWidth = fullWidth / 2;

            // Set canvas to half width
            canvas.width = halfWidth;
            canvas.height = fullHeight;

            // Draw the appropriate half
            if (side === 'left') {
                // Draw left half (source x=0)
                ctx.drawImage(img, 0, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
            } else {
                // Draw right half (source x=halfWidth)
                ctx.drawImage(img, halfWidth, 0, halfWidth, fullHeight, 0, 0, halfWidth, fullHeight);
            }

            // Replace image src with canvas data
            const dataURL = canvas.toDataURL('image/jpeg', 0.95);
            img.src = dataURL;
            console.log(`Split complete, new image src length: ${dataURL.length}`);
        } catch (e) {
            console.error('Error splitting image:', e);
        }
    }

    /**
     * Add text overlay to a specific page
     */
    function addTextToPage(pageNumber) {
        const pageData = loadedPages.find(p => p.number == pageNumber);
        if (!pageData) {
            console.error('Page not found:', pageNumber);
            return;
        }

        // Add text overlay using TextEditor
        TextEditor.addTextOverlay(
            pageNumber,
            pageData.imageWrapper,
            pageData.imageElement
        );

        console.log('Added text to page', pageNumber);
    }

    /**
     * Load text overlays from story.json for a specific page
     */
    async function loadTextForPage(pageNumber, imageWrapper, imageElement) {
        try {
            // Try to load story.json from the preview root
            const response = await fetch('../../story.json');
            
            if (!response.ok) {
                console.warn('story.json not found, text overlays will not auto-load');
                return;
            }
            
            const storyData = await response.json();
            const page = storyData.pages.find(p => p.pageNumber == pageNumber);
            
            if (page && page.text) {
                // Convert story.json text config to overlay settings
                const textConfig = page.text;
                
                // Handle both simple text objects and detailed overlay configs
                let settings;
                if (textConfig.leftPercent !== undefined) {
                    // Already has detailed overlay settings
                    settings = textConfig;
                } else {
                    // Convert simple text config to overlay settings
                    settings = {
                        content: textConfig.content || '',
                        fontFamily: textConfig.fontFamily || textConfig.font || 'Quicksand',
                        fontSize: textConfig.fontSize || 48,
                        color: textConfig.color || '#000000',
                        align: textConfig.align || 'left',
                        leftPercent: textConfig.leftPercent || 10,
                        topPercent: textConfig.topPercent || 70,
                        widthPercent: textConfig.widthPercent || 80,
                        heightPercent: textConfig.heightPercent || 20
                    };
                }
                
                createOverlayFromSettings(settings, pageNumber, imageWrapper, imageElement);
                console.log('Loaded text overlay for page', pageNumber, 'from story.json');
            }
        } catch (e) {
            console.warn('Could not load text data for page', pageNumber, ':', e);
        }
    }

    /**
     * Create text overlay from settings
     */
    function createOverlayFromSettings(settings, pageNumber, imageWrapper, imageElement) {
        // Wait a bit for image to be fully loaded and rendered
        setTimeout(() => {
            if (!imageElement || !imageElement.complete) {
                console.warn('Image not fully loaded for page', pageNumber);
                return;
            }

            // Add page-specific data to settings
            settings.pageNumber = pageNumber;
            settings.imageWrapper = imageWrapper;
            settings.imageElement = imageElement;

            // Add overlay with pre-filled settings
            TextEditor.addTextOverlayWithSettings(settings, pageNumber);
        }, 100);
    }

    /**
     * Get all loaded pages
     */
    function getAllPages() {
        return loadedPages;
    }

    /**
     * Get page data by number
     */
    function getPageByNumber(pageNumber) {
        return loadedPages.find(p => p.number == pageNumber);
    }

    /**
     * Get full page objects from story.json for export merging
     */
    function getStoryJsonPages() {
        return storyJsonPages;
    }

    /**
     * Get a specific page object from story.json by page number
     */
    function getStoryJsonPage(pageNumber) {
        return storyJsonPages.find(p => p.pageNumber == pageNumber);
    }

    // Public API
    return {
        init: init,
        getAllPages: getAllPages,
        getPageByNumber: getPageByNumber,
        addTextToPage: addTextToPage,
        getStoryJsonPages: getStoryJsonPages,
        getStoryJsonPage: getStoryJsonPage
    };
})();
