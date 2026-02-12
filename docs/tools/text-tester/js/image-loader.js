/**
 * Image loading utilities
 * Simplified for multi-page gallery (no drag & drop needed)
 */

const ImageLoader = (function() {
    /**
     * No initialization needed anymore - pages load automatically
     */
    function init() {
        console.log('ImageLoader ready (multi-page mode)');
    }

    /**
     * Get current image element (backwards compatibility)
     * Returns the first image found (if any)
     */
    function getImageElement() {
        const firstImage = document.querySelector('.page-canvas img');
        return firstImage || null;
    }

    /**
     * Get image wrapper element (backwards compatibility)
     * Returns the first wrapper found (if any)
     */
    function getImageWrapper() {
        const firstWrapper = document.querySelector('.image-wrapper');
        return firstWrapper || null;
    }

    /**
     * Get image wrapper for a specific page
     */
    function getImageWrapperForPage(pageNumber) {
        return document.getElementById(`imageWrapper-${pageNumber}`);
    }

    /**
     * Get image element for a specific page
     */
    function getImageElementForPage(pageNumber) {
        const wrapper = getImageWrapperForPage(pageNumber);
        return wrapper ? wrapper.querySelector('img') : null;
    }

    /**
     * Load image from URL (backwards compatibility - not used in gallery mode)
     */
    function loadImageFromURL(imageURL) {
        console.warn('loadImageFromURL not used in multi-page gallery mode');
    }

    // Public API
    return {
        init: init,
        getImageElement: getImageElement,
        getImageWrapper: getImageWrapper,
        getImageWrapperForPage: getImageWrapperForPage,
        getImageElementForPage: getImageElementForPage,
        loadImageFromURL: loadImageFromURL
    };
})();
