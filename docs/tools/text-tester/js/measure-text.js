/**
 * Text measurement utility for accurate HTML-to-Pillow conversion
 * 
 * Instead of exporting fontSize (which doesn't translate well),
 * export the actual rendered pixel dimensions of the text.
 */

const TextMeasurement = (function() {
    
    /**
     * Measure actual rendered dimensions of a text overlay
     * @param {HTMLElement} overlayElement - The text overlay element
     * @returns {Object} Measured dimensions in pixels
     */
    function measureOverlay(overlayElement) {
        const contentElement = overlayElement.querySelector('.text-overlay-content');
        if (!contentElement) {
            console.warn('No content element found in overlay');
            return null;
        }

        // Get the image this overlay is positioned on
        const imageWrapper = overlayElement.closest('.image-wrapper');
        const imageElement = imageWrapper ? imageWrapper.querySelector('img') : null;
        
        if (!imageElement) {
            console.warn('No image element found for overlay');
            return null;
        }

        // Get computed style
        const style = window.getComputedStyle(contentElement);
        
        // Measure actual rendered text dimensions
        const range = document.createRange();
        range.selectNodeContents(contentElement);
        const rects = range.getClientRects();
        
        if (rects.length === 0) {
            console.warn('No rendered text found');
            return null;
        }

        // Get bounding box of all text
        const bounds = range.getBoundingClientRect();
        
        // Get container dimensions
        const containerRect = overlayElement.getBoundingClientRect();
        const imageRect = imageElement.getBoundingClientRect();
        
        // Calculate actual text dimensions in pixels (on preview image)
        const measurements = {
            // Actual rendered text dimensions
            textWidth: bounds.width,
            textHeight: bounds.height,
            
            // Container dimensions
            containerWidth: containerRect.width,
            containerHeight: containerRect.height,
            
            // Image dimensions
            imageWidth: imageElement.naturalWidth,
            imageHeight: imageElement.naturalHeight,
            displayImageWidth: imageRect.width,
            displayImageHeight: imageRect.height,
            
            // Font info from CSS
            fontFamily: style.fontFamily,
            fontSize: parseFloat(style.fontSize),
            lineHeight: parseFloat(style.lineHeight),
            
            // Calculated percentages (for verification)
            textWidthPercent: (bounds.width / imageRect.width) * 100,
            textHeightPercent: (bounds.height / imageRect.height) * 100,
            
            // Line count
            lineCount: rects.length,
            
            // First line height (useful for font size calibration)
            firstLineHeight: rects[0].height
        };
        
        return measurements;
    }

    /**
     * Calculate target font size for Pillow based on measured text
     * @param {Object} measurements - From measureOverlay()
     * @param {number} printImageWidth - Width of print-ready image (e.g., 4096)
     * @returns {Object} Calculated Pillow parameters
     */
    function calculatePillowSize(measurements, printImageWidth = 4096) {
        if (!measurements) return null;
        
        // Scale factor from preview to print
        const scaleFactor = printImageWidth / measurements.displayImageWidth;
        
        // Target text height in print image (pixels)
        const targetHeight = measurements.textHeight * scaleFactor;
        
        // Estimate font size based on first line height
        // In Pillow, font.getbbox()[3] is roughly equal to font size for most fonts
        // Add a small correction factor based on typical ascender/descender ratios
        const estimatedFontSize = Math.round(measurements.firstLineHeight * scaleFactor * 1.2);
        
        return {
            targetTextHeight: targetHeight,
            targetTextWidth: measurements.textWidth * scaleFactor,
            estimatedFontSize: estimatedFontSize,
            scaleFactor: scaleFactor,
            
            // For debugging
            cssHeight: measurements.textHeight,
            cssLineHeight: measurements.firstLineHeight,
            lineCount: measurements.lineCount
        };
    }

    /**
     * Enhanced export that includes actual measured dimensions
     * @param {HTMLElement} overlayElement - The text overlay element
     * @param {number} printImageWidth - Width of print-ready image
     * @returns {Object} Export data with measurements
     */
    function exportWithMeasurements(overlayElement, printImageWidth = 4096) {
        const measurements = measureOverlay(overlayElement);
        if (!measurements) return null;
        
        const pillowSize = calculatePillowSize(measurements, printImageWidth);
        
        return {
            // Original export data
            content: overlayElement.querySelector('.text-overlay-content').textContent,
            position: 'custom',
            font: overlayElement.dataset.font || 'Nunito-Regular.ttf',
            fontSize: measurements.fontSize,
            align: window.getComputedStyle(overlayElement).textAlign,
            leftPercent: parseFloat(overlayElement.style.left),
            topPercent: parseFloat(overlayElement.style.top),
            widthPercent: parseFloat(overlayElement.style.width),
            heightPercent: parseFloat(overlayElement.style.height),
            
            // Enhanced measurements for better Pillow conversion
            _measurements: {
                ...measurements,
                ...pillowSize
            }
        };
    }

    // Public API
    return {
        measureOverlay: measureOverlay,
        calculatePillowSize: calculatePillowSize,
        exportWithMeasurements: exportWithMeasurements
    };
})();

// Make available globally
window.TextMeasurement = TextMeasurement;
