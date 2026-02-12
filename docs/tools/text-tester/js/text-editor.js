/**
 * Text overlay editor - handles creating, editing, dragging, and resizing text overlays
 * Now supports MULTIPLE text overlays per page
 * Supports dynamic Google Fonts loading
 */

const TextEditor = (function() {
    let overlayCounter = 0;
    let overlays = []; // Array of overlay objects
    let selectedOverlayId = null;
    let isDragging = false;
    let isResizing = false;
    let currentOverlay = null;
    let dragStartX = 0;
    let dragStartY = 0;
    let resizeHandle = null;
    
    // Track loaded Google Fonts to avoid duplicate link elements
    const loadedFonts = new Set();

    /**
     * Initialize the text editor
     */
    function init() {
        setupPropertyListeners();
        setupOverlayControls();
        setupDeselectionHandler();
    }

    /**
     * Setup click-away deselection handler
     */
    function setupDeselectionHandler() {
        document.addEventListener('click', function(e) {
            // Check if click is outside all text overlays and not on controls
            if (!e.target.closest('.text-overlay') && 
                !e.target.closest('#textProperties') &&
                !e.target.closest('.add-text-btn') &&
                !e.target.closest('.canvas-controls')) {
                deselectAllOverlays();
            }
        });
    }

    /**
     * Deselect all overlays
     */
    function deselectAllOverlays() {
        // Remove selected class from all overlays
        document.querySelectorAll('.text-overlay').forEach(el => {
            el.classList.remove('selected');
            el.classList.remove('active');
        });
        
        selectedOverlayId = null;
        
        // Update UI
        if (overlays.length > 0) {
            document.getElementById('noTextMessage').style.display = 'none';
            document.getElementById('textProperties').style.display = 'block';
            
            // Show generic message
            const pageContext = document.getElementById('pageContextText');
            if (pageContext) {
                pageContext.textContent = 'No text selected';
            }
        } else {
            document.getElementById('noTextMessage').style.display = 'block';
            document.getElementById('textProperties').style.display = 'none';
        }
    }

    /**
     * Load a Google Font dynamically and apply it
     */
    function loadAndApplyFont(fontName, targetElement) {
        if (!fontName || fontName.trim() === '') return;
        
        fontName = fontName.trim();
        
        // Check if already loaded
        if (!loadedFonts.has(fontName)) {
            const formattedFontName = fontName.replace(/\s+/g, '+');
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;500;600;700&display=swap`;
            document.head.appendChild(link);
            loadedFonts.add(fontName);
            console.log(`Loaded Google Font: ${fontName}`);
        }
        
        // Apply to target element if provided
        if (targetElement) {
            targetElement.style.fontFamily = `"${fontName}", sans-serif`;
        }
    }

    /**
     * Setup listeners for property panel changes
     */
    function setupPropertyListeners() {
        document.getElementById('textContent').addEventListener('input', updateActiveOverlay);
        
        // Font family uses input event for dynamic loading as user types
        const fontFamilyInput = document.getElementById('fontFamily');
        fontFamilyInput.addEventListener('input', function() {
            const fontName = this.value.trim();
            if (fontName) {
                loadAndApplyFont(fontName);
            }
            updateActiveOverlay();
        });
        fontFamilyInput.addEventListener('change', function() {
            const fontName = this.value.trim();
            if (fontName) {
                loadAndApplyFont(fontName);
            }
            updateActiveOverlay();
        });
        
        document.getElementById('fontSize').addEventListener('input', updateActiveOverlay);
        document.getElementById('lineHeight').addEventListener('input', updateActiveOverlay);
        document.getElementById('letterSpacing').addEventListener('input', updateActiveOverlay);
        document.getElementById('fontColor').addEventListener('input', updateActiveOverlay);
        document.getElementById('textAlign').addEventListener('change', updateActiveOverlay);
        document.getElementById('posX').addEventListener('input', updateActiveOverlay);
        document.getElementById('posY').addEventListener('input', updateActiveOverlay);
        document.getElementById('boxWidth').addEventListener('input', updateActiveOverlay);
        document.getElementById('boxHeight').addEventListener('input', updateActiveOverlay);
    }

    /**
     * Setup overlay management controls
     */
    function setupOverlayControls() {
        // Add "Delete This Overlay" button to properties panel
        const textProperties = document.getElementById('textProperties');
        if (textProperties) {
            // Create delete button if it doesn't exist
            let deleteBtn = document.getElementById('deleteOverlayBtn');
            if (!deleteBtn) {
                deleteBtn = document.createElement('button');
                deleteBtn.id = 'deleteOverlayBtn';
                deleteBtn.className = 'btn-small';
                deleteBtn.style.background = '#e74c3c';
                deleteBtn.textContent = '🗑️ Delete This Text';
                deleteBtn.addEventListener('click', deleteSelectedOverlay);
                textProperties.appendChild(deleteBtn);
            }

            // Create overlay navigation indicator
            let navIndicator = document.getElementById('overlayNavIndicator');
            if (!navIndicator) {
                navIndicator = document.createElement('div');
                navIndicator.id = 'overlayNavIndicator';
                navIndicator.style.cssText = 'padding: 10px; background: #ecf0f1; border-radius: 4px; margin-bottom: 15px; text-align: center; font-weight: 600; color: #2c3e50;';
                textProperties.insertBefore(navIndicator, textProperties.firstChild);
            }
        }
    }

    /**
     * Add a new text overlay
     */
    function addTextOverlay(pageNumber, imageWrapper, imageElement) {
        // Use provided elements or fall back to defaults
        imageWrapper = imageWrapper || ImageLoader.getImageWrapper();
        imageElement = imageElement || ImageLoader.getImageElement();

        if (!imageElement || !imageElement.src) {
            alert('Please load an image first');
            return;
        }

        overlayCounter++;
        const overlayId = 'overlay-' + overlayCounter;

        // Create overlay data
        const overlayData = {
            id: overlayId,
            pageNumber: pageNumber || null,
            content: 'Sample text here',
            fontFamily: 'Quicksand',
            fontSize: 48,
            lineHeight: 1.2,
            letterSpacing: 0,
            color: '#000000',
            align: 'left',
            leftPercent: 10,
            topPercent: 70,
            widthPercent: 80,
            heightPercent: 20
        };

        // Create overlay element
        const overlay = createOverlayElement(overlayData, imageElement);
        
        // Add to DOM
        imageWrapper.appendChild(overlay);

        // Add to overlays array
        overlays.push({
            id: overlayId,
            element: overlay,
            data: overlayData
        });

        // Select the new overlay
        selectOverlay(overlayId);

        // Update app state
        window.TextOverlayApp.textOverlays = overlays.map(o => o.data);

        return overlayData;
    }

    /**
     * Add text overlay with pre-filled settings (for loading from published)
     */
    function addTextOverlayWithSettings(settings, pageNumber) {
        const imageWrapper = settings.imageWrapper || ImageLoader.getImageWrapper();
        const imageElement = settings.imageElement || ImageLoader.getImageElement();

        if (!imageElement || !imageElement.src) {
            console.warn('Cannot add overlay: image not loaded');
            return null;
        }

        overlayCounter++;
        const overlayId = 'overlay-' + overlayCounter;

        // Merge with defaults
        const overlayData = {
            id: overlayId,
            pageNumber: pageNumber || settings.pageNumber || null,
            content: settings.content || 'Sample text',
            fontFamily: settings.fontFamily || settings.font || 'Quicksand',
            fontSize: settings.fontSize || 48,
            lineHeight: settings.lineHeight || 1.2,
            letterSpacing: settings.letterSpacing || 0,
            color: settings.color || '#000000',
            align: settings.align || 'left',
            leftPercent: settings.leftPercent || 10,
            topPercent: settings.topPercent || 70,
            widthPercent: settings.widthPercent || 80,
            heightPercent: settings.heightPercent || 20
        };

        // Create overlay element
        const overlay = createOverlayElement(overlayData, imageElement);
        
        // Add to DOM
        imageWrapper.appendChild(overlay);

        // Add to overlays array
        overlays.push({
            id: overlayId,
            element: overlay,
            data: overlayData
        });

        // Select the new overlay
        selectOverlay(overlayId);

        // Update app state
        window.TextOverlayApp.textOverlays = overlays.map(o => o.data);

        console.log('Added overlay with settings:', overlayData);
        return overlayData;
    }

    /**
     * Create the DOM element for an overlay
     */
    function createOverlayElement(data, imageElement) {
        const overlay = document.createElement('div');
        overlay.className = 'text-overlay';
        overlay.id = data.id;
        overlay.dataset.overlayId = data.id;

        // Apply styles
        applyOverlayStyles(overlay, data, imageElement);

        // Add content container
        const content = document.createElement('div');
        content.className = 'text-overlay-content';
        content.textContent = data.content;
        overlay.appendChild(content);

        // Add resize handles
        addResizeHandles(overlay);

        // Add event listeners
        overlay.addEventListener('mousedown', handleOverlayMouseDown);

        return overlay;
    }

    /**
     * Apply styles to overlay element
     */
    function applyOverlayStyles(element, data, imageElement) {
        element.style.left = data.leftPercent + '%';
        element.style.top = data.topPercent + '%';
        element.style.width = data.widthPercent + '%';
        element.style.height = data.heightPercent + '%';
        
        // Load Google Font dynamically and apply
        const fontFamily = data.fontFamily;
        if (fontFamily) {
            loadAndApplyFont(fontFamily);
            element.style.fontFamily = `"${fontFamily}", sans-serif`;
        }
        
        element.style.fontSize = data.fontSize + 'px';
        element.style.lineHeight = data.lineHeight || 1.2;
        element.style.letterSpacing = (data.letterSpacing || 0) + 'px';
        element.style.color = data.color;
        element.style.textAlign = data.align;
    }

    /**
     * Add resize handles to overlay
     */
    function addResizeHandles(overlay) {
        const handles = ['nw', 'ne', 'sw', 'se'];
        
        handles.forEach(position => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle resize-' + position;
            handle.dataset.position = position;
            handle.addEventListener('mousedown', handleResizeMouseDown);
            overlay.appendChild(handle);
        });
    }

    /**
     * Handle overlay mousedown (for dragging)
     */
    function handleOverlayMouseDown(e) {
        if (e.target.classList.contains('resize-handle')) {
            return; // Let resize handler deal with it
        }

        e.stopPropagation();
        
        const overlay = e.currentTarget;
        const overlayId = overlay.dataset.overlayId;

        selectOverlay(overlayId);

        // Start dragging
        isDragging = true;
        currentOverlay = overlay;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handle resize handle mousedown
     */
    function handleResizeMouseDown(e) {
        e.stopPropagation();
        
        const handle = e.currentTarget;
        const overlay = handle.closest('.text-overlay');
        const overlayId = overlay.dataset.overlayId;

        selectOverlay(overlayId);

        // Start resizing
        isResizing = true;
        currentOverlay = overlay;
        resizeHandle = handle.dataset.position;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    /**
     * Handle mouse move (dragging or resizing)
     */
    function handleMouseMove(e) {
        if (!currentOverlay) return;

        // Get the image wrapper that contains this overlay
        const imageWrapper = currentOverlay.parentElement;
        if (!imageWrapper || !imageWrapper.classList.contains('image-wrapper')) {
            console.warn('Overlay parent is not an image-wrapper');
            return;
        }

        // The wrapper dimensions are what matter for % positioning
        const wrapperWidth = imageWrapper.offsetWidth;
        const wrapperHeight = imageWrapper.offsetHeight;

        if (isDragging) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            // Get current position in pixels
            const currentLeft = parseFloat(currentOverlay.style.left) || 0;
            const currentTop = parseFloat(currentOverlay.style.top) || 0;
            const currentWidth = parseFloat(currentOverlay.style.width) || 0;
            const currentHeight = parseFloat(currentOverlay.style.height) || 0;

            // Convert pixel delta to percentage
            const deltaXPercent = (deltaX / wrapperWidth) * 100;
            const deltaYPercent = (deltaY / wrapperHeight) * 100;

            // Calculate new position
            let newLeft = currentLeft + deltaXPercent;
            let newTop = currentTop + deltaYPercent;

            // Clamp to image bounds
            newLeft = Math.max(0, Math.min(100 - currentWidth, newLeft));
            newTop = Math.max(0, Math.min(100 - currentHeight, newTop));

            currentOverlay.style.left = newLeft + '%';
            currentOverlay.style.top = newTop + '%';

            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Update data
            updateOverlayDataFromElement(currentOverlay);
        } else if (isResizing) {
            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            let newLeft = parseFloat(currentOverlay.style.left);
            let newTop = parseFloat(currentOverlay.style.top);
            let newWidth = parseFloat(currentOverlay.style.width);
            let newHeight = parseFloat(currentOverlay.style.height);

            const deltaXPercent = (deltaX / wrapperWidth) * 100;
            const deltaYPercent = (deltaY / wrapperHeight) * 100;

            if (resizeHandle.includes('w')) {
                newLeft += deltaXPercent;
                newWidth -= deltaXPercent;
            }
            if (resizeHandle.includes('e')) {
                newWidth += deltaXPercent;
            }
            if (resizeHandle.includes('n')) {
                newTop += deltaYPercent;
                newHeight -= deltaYPercent;
            }
            if (resizeHandle.includes('s')) {
                newHeight += deltaYPercent;
            }

            // Clamp values
            newWidth = Math.max(5, Math.min(100, newWidth));
            newHeight = Math.max(5, Math.min(100, newHeight));
            newLeft = Math.max(0, Math.min(100 - newWidth, newLeft));
            newTop = Math.max(0, Math.min(100 - newHeight, newTop));

            currentOverlay.style.left = newLeft + '%';
            currentOverlay.style.top = newTop + '%';
            currentOverlay.style.width = newWidth + '%';
            currentOverlay.style.height = newHeight + '%';

            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Update data
            updateOverlayDataFromElement(currentOverlay);
        }
    }

    /**
     * Handle mouse up (stop dragging or resizing)
     */
    function handleMouseUp(e) {
        isDragging = false;
        isResizing = false;
        currentOverlay = null;
        resizeHandle = null;

        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }

    /**
     * Select an overlay
     */
    function selectOverlay(overlayId) {
        // Deselect all overlays
        document.querySelectorAll('.text-overlay').forEach(el => {
            el.classList.remove('active');
            el.classList.remove('selected');
        });

        // Find and select this overlay
        const overlayObj = overlays.find(o => o.id === overlayId);
        if (!overlayObj) return;

        overlayObj.element.classList.add('selected');
        overlayObj.element.classList.add('active'); // Keep for backwards compatibility
        selectedOverlayId = overlayId;

        // Update properties panel
        updatePropertiesPanel(overlayObj.data);

        // Update app state
        window.TextOverlayApp.activeOverlay = overlayObj.data;
    }

    /**
     * Update properties panel with overlay data
     */
    function updatePropertiesPanel(data) {
        // Show properties panel
        document.getElementById('noTextMessage').style.display = 'none';
        document.getElementById('textProperties').style.display = 'block';
        document.getElementById('exportSection').style.display = 'block';

        // Update fields
        document.getElementById('textContent').value = data.content;
        document.getElementById('fontFamily').value = data.fontFamily;
        document.getElementById('fontSize').value = data.fontSize;
        document.getElementById('lineHeight').value = data.lineHeight || 1.2;
        document.getElementById('letterSpacing').value = data.letterSpacing || 0;
        document.getElementById('fontColor').value = data.color;
        document.getElementById('textAlign').value = data.align;
        document.getElementById('posX').value = data.leftPercent;
        document.getElementById('posY').value = data.topPercent;
        document.getElementById('boxWidth').value = data.widthPercent;
        document.getElementById('boxHeight').value = data.heightPercent;

        // Update page context
        const pageContext = document.getElementById('pageContextText');
        if (pageContext) {
            const currentIndex = overlays.findIndex(o => o.id === selectedOverlayId);
            const pageNum = data.pageNumber || '?';
            const overlayNum = currentIndex + 1;
            
            // Count overlays on this page
            const pageOverlays = overlays.filter(o => o.data.pageNumber === data.pageNumber);
            const pageOverlayIndex = pageOverlays.findIndex(o => o.id === selectedOverlayId) + 1;
            
            pageContext.textContent = `Page ${pageNum} - Text ${pageOverlayIndex} of ${pageOverlays.length}`;
        }

        // Update navigation indicator (if exists from old code)
        const navIndicator = document.getElementById('overlayNavIndicator');
        if (navIndicator) {
            const currentIndex = overlays.findIndex(o => o.id === selectedOverlayId);
            navIndicator.textContent = `Text Overlay ${currentIndex + 1} of ${overlays.length}`;
        }
    }

    /**
     * Update overlay data from element position/size
     */
    function updateOverlayDataFromElement(element) {
        const overlayId = element.dataset.overlayId;
        const overlayObj = overlays.find(o => o.id === overlayId);

        if (overlayObj) {
            overlayObj.data.leftPercent = parseFloat(element.style.left);
            overlayObj.data.topPercent = parseFloat(element.style.top);
            overlayObj.data.widthPercent = parseFloat(element.style.width);
            overlayObj.data.heightPercent = parseFloat(element.style.height);

            // Update properties panel if this is the selected overlay
            if (overlayId === selectedOverlayId) {
                document.getElementById('posX').value = overlayObj.data.leftPercent.toFixed(1);
                document.getElementById('posY').value = overlayObj.data.topPercent.toFixed(1);
                document.getElementById('boxWidth').value = overlayObj.data.widthPercent.toFixed(1);
                document.getElementById('boxHeight').value = overlayObj.data.heightPercent.toFixed(1);
            }

            // Update app state
            window.TextOverlayApp.textOverlays = overlays.map(o => o.data);
        }
    }

    /**
     * Update active overlay from properties panel
     */
    function updateActiveOverlay() {
        if (!selectedOverlayId) return;

        const overlayObj = overlays.find(o => o.id === selectedOverlayId);
        if (!overlayObj) return;

        const data = overlayObj.data;
        const element = overlayObj.element;
        const imageElement = ImageLoader.getImageElement();

        if (!element) return;

        // Update data
        data.content = document.getElementById('textContent').value;
        data.fontFamily = document.getElementById('fontFamily').value;
        data.fontSize = parseInt(document.getElementById('fontSize').value);
        data.lineHeight = parseFloat(document.getElementById('lineHeight').value);
        data.letterSpacing = parseFloat(document.getElementById('letterSpacing').value);
        data.color = document.getElementById('fontColor').value;
        data.align = document.getElementById('textAlign').value;
        data.leftPercent = parseFloat(document.getElementById('posX').value);
        data.topPercent = parseFloat(document.getElementById('posY').value);
        data.widthPercent = parseFloat(document.getElementById('boxWidth').value);
        data.heightPercent = parseFloat(document.getElementById('boxHeight').value);

        // Update element
        applyOverlayStyles(element, data, imageElement);
        element.querySelector('.text-overlay-content').textContent = data.content;

        // Update app state
        window.TextOverlayApp.textOverlays = overlays.map(o => o.data);
    }

    /**
     * Delete the currently selected overlay
     */
    function deleteSelectedOverlay() {
        if (!selectedOverlayId) return;

        const overlayObj = overlays.find(o => o.id === selectedOverlayId);
        if (!overlayObj) return;

        // Remove from DOM
        overlayObj.element.remove();

        // Remove from array
        overlays = overlays.filter(o => o.id !== selectedOverlayId);

        // Select another overlay or deselect
        if (overlays.length > 0) {
            selectOverlay(overlays[0].id);
        } else {
            selectedOverlayId = null;
            window.TextOverlayApp.activeOverlay = null;
            window.onTextOverlayDeselected();
        }

        // Update app state
        window.TextOverlayApp.textOverlays = overlays.map(o => o.data);

        console.log('Deleted overlay, remaining:', overlays.length);
    }

    /**
     * Clear all overlays
     */
    function clearAllOverlays() {
        const imageWrapper = ImageLoader.getImageWrapper();
        const overlayElements = imageWrapper.querySelectorAll('.text-overlay');
        
        overlayElements.forEach(overlay => overlay.remove());
        
        overlays = [];
        selectedOverlayId = null;
        
        window.TextOverlayApp.textOverlays = [];
        window.TextOverlayApp.activeOverlay = null;
        
        window.onTextOverlayDeselected();
    }

    /**
     * Get all overlays
     */
    function getAllOverlays() {
        return overlays.map(o => o.data);
    }

    /**
     * Get selected overlay
     */
    function getSelectedOverlay() {
        const overlayObj = overlays.find(o => o.id === selectedOverlayId);
        return overlayObj ? overlayObj.data : null;
    }

    // Public API
    return {
        init: init,
        addTextOverlay: addTextOverlay,
        addTextOverlayWithSettings: addTextOverlayWithSettings,
        clearAllOverlays: clearAllOverlays,
        deselectAllOverlays: deselectAllOverlays,
        getAllOverlays: getAllOverlays,
        getSelectedOverlay: getSelectedOverlay,
        deleteSelectedOverlay: deleteSelectedOverlay
    };
})();
