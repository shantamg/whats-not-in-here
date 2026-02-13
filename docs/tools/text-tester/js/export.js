/**
 * Export manager - handles exporting overlay settings for ALL pages
 */

const ExportManager = (function() {
    let exportAllBtn;
    let jsonOutput;
    let jsonContent;

    /**
     * Initialize export manager
     */
    function init() {
        exportAllBtn = document.getElementById('exportAllBtn');
        jsonOutput = document.getElementById('jsonOutput');
        jsonContent = document.getElementById('jsonContent');

        setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', exportAllPages);
        }
    }

    /**
     * Export all pages with text overlays
     */
    function exportAllPages() {
        const allOverlays = TextEditor.getAllOverlays();
        
        if (allOverlays.length === 0) {
            alert('No text overlays to export. Add text to at least one page first.');
            return;
        }

        // Group overlays by page number
        const pageGroups = {};
        
        allOverlays.forEach(overlay => {
            const pageNum = overlay.pageNumber || 'unknown';
            if (!pageGroups[pageNum]) {
                pageGroups[pageNum] = [];
            }
            pageGroups[pageNum].push(overlay);
        });

        // Convert to array format, merging with existing story.json page objects
        // This preserves all existing fields (type, folder, scene, etc.)
        const pagesData = [];
        
        Object.keys(pageGroups).sort((a, b) => {
            // Sort numerically
            return parseInt(a) - parseInt(b);
        }).forEach(pageNum => {
            const overlays = pageGroups[pageNum];
            const pillowFormats = overlays.map(overlay => convertToPillowFormat(overlay));
            
            // If only one overlay, export as object; if multiple, export as array
            const textData = pillowFormats.length === 1 ? pillowFormats[0] : pillowFormats;
            
            // Get the full page object from story.json if available
            const existingPage = PageLoader.getStoryJsonPage(parseInt(pageNum));
            
            if (existingPage) {
                // Merge: keep all existing fields, only update text
                const mergedPage = { ...existingPage, text: textData };
                pagesData.push(mergedPage);
            } else {
                // No existing page data, create minimal object
                pagesData.push({
                    pageNumber: parseInt(pageNum),
                    text: textData
                });
            }
        });

        // Generate JSON
        const jsonText = JSON.stringify({ pages: pagesData }, null, 2);

        // Copy to clipboard
        navigator.clipboard.writeText(jsonText).then(() => {
            // Show JSON and success message
            jsonContent.textContent = jsonText;
            jsonOutput.style.display = 'block';
            
            // Update button with success feedback
            const originalText = exportAllBtn.textContent;
            const pageCount = pagesData.length;
            const overlayCount = allOverlays.length;
            
            const hasStoryJson = PageLoader.getStoryJsonPages().length > 0;
            const mergeMsg = hasStoryJson ? ' (merged with story.json)' : '';
            exportAllBtn.textContent = `✓ Copied ${pageCount} page(s), ${overlayCount} text(s)!${mergeMsg}`;
            exportAllBtn.style.background = '#27ae60';
            
            setTimeout(() => {
                exportAllBtn.textContent = originalText;
                exportAllBtn.style.background = '';
            }, 3000);
            
            // Scroll to show the JSON
            jsonOutput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }).catch(err => {
            console.error('Failed to copy:', err);
            
            // Fallback: just show the JSON
            jsonContent.textContent = jsonText;
            jsonOutput.style.display = 'block';
            alert('Could not auto-copy. Please copy manually from below.');
        });

        console.log('Exported text settings for', pagesData.length, 'pages');
    }

    /**
     * Convert overlay data to export format
     * Now exports Google Font name directly (no .ttf mapping)
     */
    function convertToPillowFormat(overlay) {
        // Export the font family name directly for Google Fonts
        // Playwright will load it from Google Fonts automatically
        const fontName = overlay.fontFamily || 'Quicksand';

        return {
            content: overlay.content,
            position: "custom",
            font: fontName,
            fontSize: overlay.fontSize,
            lineHeight: overlay.lineHeight || 1.2,
            letterSpacing: overlay.letterSpacing || 0,
            color: overlay.color,
            align: overlay.align,
            leftPercent: parseFloat(overlay.leftPercent.toFixed(2)),
            topPercent: parseFloat(overlay.topPercent.toFixed(2)),
            widthPercent: parseFloat(overlay.widthPercent.toFixed(2)),
            heightPercent: parseFloat(overlay.heightPercent.toFixed(2))
        };
    }

    /**
     * Get current overlay settings in Pillow format (backwards compatibility)
     */
    function getPillowFormat(overlay) {
        if (!overlay) return null;
        return convertToPillowFormat(overlay);
    }

    /**
     * Get all overlays in Pillow format (backwards compatibility)
     */
    function getAllPillowFormats() {
        const overlays = TextEditor.getAllOverlays();
        return overlays.map(overlay => convertToPillowFormat(overlay));
    }

    // For backwards compatibility with old export button (if it exists)
    function exportAndCopy() {
        exportAllPages();
    }

    // Public API
    return {
        init: init,
        exportAllPages: exportAllPages,
        exportAndCopy: exportAndCopy,
        getPillowFormat: getPillowFormat,
        getAllPillowFormats: getAllPillowFormats
    };
})();
