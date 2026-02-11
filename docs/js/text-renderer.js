/**
 * Text Renderer - Matches Pillow text overlay rendering with proper scaling
 */

import { calculateSafeZones, mapPageType, safeZonesToCSS } from './safe-zones.js';

const LUMINANCE_THRESHOLD = 128;
const TEXT_COLOR_BLACK = 'rgb(0, 0, 0)';
const TEXT_COLOR_WHITE = 'rgb(255, 255, 255)';

/**
 * Calculate font size scale factor based on image dimensions
 * @param {HTMLImageElement} imgElement - Image element
 * @returns {number} Scale factor to apply to font sizes
 */
function calculateScaleFactor(imgElement) {
    const originalWidth = parseInt(imgElement.getAttribute('data-original-width')) || 4096;
    const displayWidth = imgElement.naturalWidth;
    
    const scaleFactor = displayWidth / originalWidth;
    console.log(`Scale: ${displayWidth}/${originalWidth} = ${scaleFactor.toFixed(3)}`);
    
    return scaleFactor;
}

/**
 * Wrap text to fit within max width (matching Pillow algorithm)
 */
export function wrapText(text, fontFamily, fontSize, maxWidth) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontSize}px ${fontFamily}`;

    const words = text.split(' ');
    const lines = [];
    let currentLine = [];

    for (const word of words) {
        const testLine = [...currentLine, word].join(' ');
        const metrics = ctx.measureText(testLine);

        if (metrics.width <= maxWidth) {
            currentLine.push(word);
        } else {
            if (currentLine.length > 0) {
                lines.push(currentLine.join(' '));
            }
            currentLine = [word];
        }
    }

    if (currentLine.length > 0) {
        lines.push(currentLine.join(' '));
    }

    return lines;
}

/**
 * Calculate average luminance of an image region
 */
export function calculateLuminance(img, bounds) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);

    const left = Math.max(0, Math.floor(bounds.left));
    const top = Math.max(0, Math.floor(bounds.top));
    const right = Math.min(canvas.width, Math.ceil(bounds.right));
    const bottom = Math.min(canvas.height, Math.ceil(bounds.bottom));

    if (right <= left || bottom <= top) {
        return 255;
    }

    const imageData = ctx.getImageData(left, top, right - left, bottom - top);
    const data = imageData.data;

    let totalLuma = 0;
    const pixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        totalLuma += luma;
    }

    return totalLuma / pixels;
}

/**
 * Pick text color based on background luminance
 */
export function pickTextColor(img, textBounds) {
    const luma = calculateLuminance(img, textBounds);
    return luma < LUMINANCE_THRESHOLD ? TEXT_COLOR_WHITE : TEXT_COLOR_BLACK;
}

/**
 * Render text overlay on a page card with proper scaling
 */
export function renderTextOverlay(pageCard, textSpec, pageType) {
    if (!textSpec || !textSpec.content) {
        return;
    }

    const imgElement = pageCard.querySelector('img');
    if (!imgElement || !imgElement.complete) {
        if (imgElement) {
            imgElement.addEventListener('load', () => {
                renderTextOverlay(pageCard, textSpec, pageType);
            }, { once: true });
        }
        return;
    }

    const container = pageCard.querySelector('.page-image-container');
    if (!container) {
        console.warn('No image container found');
        return;
    }

    const imgWidth = imgElement.naturalWidth;
    const imgHeight = imgElement.naturalHeight;
    
    // Calculate scale factor for font sizing
    const scaleFactor = calculateScaleFactor(imgElement);

    const mappedType = mapPageType(pageType);
    const safeZones = calculateSafeZones(imgWidth, imgHeight, mappedType);

    let overlay = container.querySelector('.text-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'text-overlay';
        container.appendChild(overlay);
    }

    const maxTextWidth = safeZones.right - safeZones.left;

    const fontFamily = textSpec.font ? getFontFamily(textSpec.font) : 'sans-serif';
    const storyFontSize = textSpec.fontSize || 240;
    const displayFontSize = Math.round(storyFontSize * scaleFactor);
    
    // Store metadata for export
    overlay.setAttribute('data-story-font-size', storyFontSize);
    overlay.setAttribute('data-display-font-size', displayFontSize);
    overlay.setAttribute('data-scale-factor', scaleFactor.toFixed(4));

    const lines = wrapText(textSpec.content, fontFamily, displayFontSize, maxTextWidth);

    const textContent = document.createElement('div');
    textContent.className = 'text-content';
    textContent.textContent = lines.join('\n');

    overlay.style.fontFamily = fontFamily;
    overlay.style.fontSize = `${displayFontSize}px`;
    overlay.style.lineHeight = '1.2';
    overlay.style.whiteSpace = 'pre-wrap';
    overlay.style.textAlign = 'left';

    const position = textSpec.position || 'bottom';
    overlay.setAttribute('data-position', position);

    // Handle custom positioning from drag
    if (textSpec.leftPercent !== undefined && textSpec.topPercent !== undefined) {
        overlay.style.left = `${textSpec.leftPercent}%`;
        overlay.style.top = `${textSpec.topPercent}%`;
        overlay.style.right = 'auto';
        overlay.style.bottom = 'auto';
        overlay.style.transform = 'none';
    } else {
        // Use safe zones for standard positioning
        const cssMargins = safeZonesToCSS(safeZones, imgWidth, imgHeight);
        overlay.style.left = cssMargins.left;
        overlay.style.right = cssMargins.right;
        overlay.style.top = position === 'top' ? cssMargins.top : 'auto';
        overlay.style.bottom = position === 'bottom' ? cssMargins.bottom : 'auto';

        if (position === 'center') {
            overlay.style.top = '50%';
            overlay.style.transform = 'translateY(-50%)';
        }
    }

    // Handle custom width from resize
    if (textSpec.widthPercent) {
        overlay.style.width = `${textSpec.widthPercent}%`;
        overlay.style.maxWidth = `${textSpec.widthPercent}%`;
    }

    let textColor;
    if (textSpec.color && Array.isArray(textSpec.color)) {
        textColor = `rgb(${textSpec.color.join(',')})`;
    } else {
        const textBounds = {
            left: safeZones.left,
            top: position === 'top' ? safeZones.top : (position === 'center' ? imgHeight / 2 - 100 : safeZones.bottom - 200),
            right: safeZones.right,
            bottom: position === 'top' ? safeZones.top + 200 : (position === 'center' ? imgHeight / 2 + 100 : safeZones.bottom)
        };
        textColor = pickTextColor(imgElement, textBounds);
    }

    overlay.style.color = textColor;

    if (textSpec.background) {
        const bgColor = textSpec.background.color || [255, 255, 255];
        overlay.style.backgroundColor = `rgb(${bgColor.join(',')})`;
        const padding = textSpec.background.padding || 20;
        overlay.style.padding = `${padding}px`;
        overlay.style.boxSizing = 'border-box';
    } else {
        overlay.style.backgroundColor = '';
        overlay.style.padding = '';
    }

    overlay.innerHTML = '';
    overlay.appendChild(textContent);

    overlay.setAttribute('data-text-spec', JSON.stringify(textSpec));
    overlay.setAttribute('data-page-type', pageType);
}

function getFontFamily(fontFile) {
    const name = fontFile.replace(/\.(ttf|otf|woff2?)$/i, '');
    return `'${name.replace(/[-_]/g, ' ')}'`;
}

/**
 * Initialize text overlays for all pages
 */
export function initializeTextOverlays() {
    const pageCards = document.querySelectorAll('.page-card');

    pageCards.forEach(card => {
        const pageNumber = parseInt(card.getAttribute('data-page-number'));
        const textSpec = card.getAttribute('data-text-spec');
        const pageType = card.getAttribute('data-page-type');

        if (!textSpec || !pageNumber) {
            return;
        }

        try {
            const spec = JSON.parse(textSpec);
            renderTextOverlay(card, spec, pageType);
        } catch (e) {
            console.error(`Failed to render text for page ${pageNumber}:`, e);
        }
    });
}
