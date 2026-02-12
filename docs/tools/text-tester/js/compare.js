/**
 * Comparison manager - handles side-by-side comparison of HTML preview vs published Pillow output
 */

const ComparisonManager = (function() {
    let compareBtn;
    let comparisonContainer;
    let htmlCanvas;
    let publishedOutput;

    /**
     * Initialize comparison manager
     */
    function init() {
        compareBtn = document.getElementById('compareBtn');
        comparisonContainer = document.getElementById('comparisonContainer');
        htmlCanvas = document.getElementById('htmlCanvas');
        publishedOutput = document.getElementById('publishedOutput');

        // Only setup if elements exist
        if (compareBtn) {
            setupEventListeners();
        } else {
            console.log('Comparison feature not available in multi-page view');
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        if (compareBtn) {
            compareBtn.addEventListener('click', showComparison);
        }
    }

    /**
     * Show comparison between HTML preview and published page
     */
    function showComparison() {
        const app = window.TextOverlayApp;
        const currentPage = PageLoader.getCurrentPage();
        
        if (!currentPage) {
            alert('Please load a published page first');
            return;
        }

        if (!app.activeOverlay && app.textOverlays.length === 0) {
            alert('Please add a text overlay first');
            return;
        }

        try {
            // Create HTML preview canvas
            createHTMLPreview();

            // Load published page
            publishedOutput.src = currentPage.path + '?t=' + Date.now();
            
            // Show comparison
            comparisonContainer.style.display = 'block';
            comparisonContainer.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Comparison failed:', error);
            alert('Failed to create comparison: ' + error.message);
        }
    }

    /**
     * Create HTML preview on canvas
     */
    function createHTMLPreview() {
        const app = window.TextOverlayApp;
        const imageElement = ImageLoader.getImageElement();

        if (!imageElement || !imageElement.src) {
            throw new Error('No image loaded');
        }

        // Set canvas size to match image
        htmlCanvas.width = imageElement.naturalWidth;
        htmlCanvas.height = imageElement.naturalHeight;

        const ctx = htmlCanvas.getContext('2d');

        // Draw image
        ctx.drawImage(imageElement, 0, 0);

        // Draw each overlay
        app.textOverlays.forEach(overlay => {
            drawTextOverlay(ctx, overlay, htmlCanvas.width, htmlCanvas.height);
        });
    }

    /**
     * Draw a text overlay on canvas
     */
    function drawTextOverlay(ctx, overlay, canvasWidth, canvasHeight) {
        // Calculate text position in pixels
        const left = (overlay.leftPercent / 100) * canvasWidth;
        const top = (overlay.topPercent / 100) * canvasHeight;
        const width = (overlay.widthPercent / 100) * canvasWidth;

        // Setup text rendering
        ctx.font = overlay.fontSize + 'px ' + overlay.fontFamily;
        ctx.fillStyle = overlay.color;
        ctx.textAlign = overlay.align;

        // Draw text (with wrapping)
        const lines = wrapText(ctx, overlay.content, width);
        
        let textX = left;
        if (overlay.align === 'center') {
            textX = left + width / 2;
        } else if (overlay.align === 'right') {
            textX = left + width;
        }

        let currentY = top + overlay.fontSize;
        const lineHeight = overlay.fontSize * 1.2;
        
        lines.forEach(line => {
            ctx.fillText(line, textX, currentY);
            currentY += lineHeight;
        });
    }

    /**
     * Simple text wrapping for canvas
     */
    function wrapText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    // Public API
    return {
        init: init
    };
})();
