/**
 * Safe Zone Calculator
 * Matches the Python logic from text_overlay.py
 */

const DPI = 300;
const OUTER_SAFE_ZONE_INCHES = 0.75;
const GUTTER_SAFE_ZONE_INCHES = 1.0;

/**
 * Calculate safe zones for text placement
 * @param {number} imageWidth - Image width in pixels
 * @param {number} imageHeight - Image height in pixels
 * @param {string} pageType - 'single', 'spread-left', or 'spread-right'
 * @param {number} dpi - DPI for conversion (default: 300)
 * @returns {Object} Safe zone boundaries {left, right, top, bottom}
 */
export function calculateSafeZones(imageWidth, imageHeight, pageType, dpi = DPI) {
    const outerMarginPx = Math.floor(OUTER_SAFE_ZONE_INCHES * dpi);  // 225px
    const gutterMarginPx = Math.floor(GUTTER_SAFE_ZONE_INCHES * dpi); // 300px

    if (pageType === 'single') {
        return {
            left: outerMarginPx,
            right: imageWidth - outerMarginPx,
            top: outerMarginPx,
            bottom: imageHeight - outerMarginPx
        };
    } else if (pageType === 'spread-left') {
        return {
            left: outerMarginPx,
            right: imageWidth - gutterMarginPx,  // Gutter on right
            top: outerMarginPx,
            bottom: imageHeight - outerMarginPx
        };
    } else { // spread-right
        return {
            left: gutterMarginPx,  // Gutter on left
            right: imageWidth - outerMarginPx,
            top: outerMarginPx,
            bottom: imageHeight - outerMarginPx
        };
    }
}

/**
 * Map story.json page types to internal page types
 * @param {string} storyType - Type from story.json
 * @returns {string} Internal page type
 */
export function mapPageType(storyType) {
    if (storyType === 'spread-start') {
        return 'spread-left';
    } else if (storyType === 'spread-companion') {
        return 'spread-right';
    } else {
        return 'single';
    }
}

/**
 * Convert safe zones to CSS margins for absolute positioning
 * @param {Object} safeZones - Safe zone boundaries
 * @param {number} containerWidth - Container width
 * @param {number} containerHeight - Container height
 * @returns {Object} CSS margins {left, right, top, bottom} as strings
 */
export function safeZonesToCSS(safeZones, containerWidth, containerHeight) {
    // Calculate as percentages for responsive scaling
    const leftPct = (safeZones.left / containerWidth) * 100;
    const rightPct = ((containerWidth - safeZones.right) / containerWidth) * 100;
    const topPct = (safeZones.top / containerHeight) * 100;
    const bottomPct = ((containerHeight - safeZones.bottom) / containerHeight) * 100;

    return {
        left: `${leftPct}%`,
        right: `${rightPct}%`,
        top: `${topPct}%`,
        bottom: `${bottomPct}%`
    };
}
