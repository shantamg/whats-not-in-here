# Text Overlay Tester - Multi-Page Gallery Editor

Visual editor for testing and configuring text overlays on ALL book pages simultaneously.

## ✨ Features

### Multi-Page Gallery View
- **Automatic Loading**: All published pages load automatically in a scrollable gallery
- **Visual Context**: See all pages with their text overlays in one view
- **No Manual Upload**: No need to load pages one by one

### Smart Selection
- **Click to Edit**: Click any text overlay to select and edit it
- **Click Away to Deselect**: Click anywhere outside text to deselect (hides red border)
- **Visual Feedback**: 
  - Transparent border by default (clean preview)
  - Blue hover effect (shows interactive areas)
  - Red border + handles when selected (editing mode)

### Per-Page Text Management
- **Add Text Per Page**: Each page has its own ➕ Add Text button
- **Multiple Text Overlays**: Add unlimited text overlays to any page
- **Page Context Display**: Properties panel shows "Page X - Text Y of Z"
- **Independent Editing**: Edit text on any page without affecting others

### Drag & Resize
- **Drag to Position**: Click and drag text overlays to reposition
- **Resize Handles**: Drag corner handles to resize (only visible when selected)
- **Live Preview**: See changes in real-time

### Export All Pages
- **One-Click Export**: Export text settings for ALL pages at once
- **JSON Format**: Generates complete `story.json` patch with all pages
- **Format**: `{ pages: [{pageNumber: 1, text: {...}}, ...] }`
- **Auto-Copy**: Automatically copies to clipboard

## 🚀 Quick Start

1. **Publish Your Book First**
   ```bash
   book publish
   ```

2. **Open Text Tester**
   - Navigate to: `docs/tools/text-tester/index.html`
   - All published pages load automatically

3. **Add Text to Pages**
   - Click ➕ Add Text on any page
   - Drag to position, resize with handles
   - Edit properties in right panel

4. **Export Settings**
   - Click "💾 Export All Pages" at top
   - Settings copied to clipboard
   - Send to AI agent with `book add-text`

## 🎨 Workflow

### Before (Old Single-Page Workflow)
1. Click "Load Published Page"
2. Select page from grid
3. Add text, configure, export
4. Repeat for each page individually
5. Red border always visible

### After (New Multi-Page Workflow)
1. All pages load automatically ✨
2. Scroll through gallery, click ➕ to add text
3. Text overlays load from existing config automatically
4. Click text to edit, click away to deselect
5. Export all pages at once
6. Clean preview with transparent borders

## 📐 Text Properties

### Content & Style
- **Content**: Multi-line text input
- **Font**: Google Fonts + System fonts
- **Size**: 8-500px
- **Color**: Color picker
- **Align**: Left, Center, Right

### Position & Size
- **Position X/Y**: Percentage-based positioning
- **Width/Height**: Percentage-based sizing
- **Drag & Drop**: Visual positioning
- **Resize Handles**: Visual sizing

### Supported Fonts
- **Google Fonts**: Quicksand, Comfortaa, Nunito, Lato, Open Sans, Merriweather, Lora
- **System Fonts**: Arial, Georgia, Times New Roman

## 🔄 Export Format

### Single Text on Page
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "text": {
        "content": "Hello!",
        "position": "custom",
        "font": "Quicksand-Medium.ttf",
        "fontSize": 48,
        "color": "#000000",
        "align": "center",
        "leftPercent": 10,
        "topPercent": 70,
        "widthPercent": 80,
        "heightPercent": 20
      }
    }
  ]
}
```

### Multiple Texts on Page
```json
{
  "pages": [
    {
      "pageNumber": 1,
      "text": [
        {
          "content": "Title Text",
          "fontSize": 72,
          ...
        },
        {
          "content": "Body Text",
          "fontSize": 36,
          ...
        }
      ]
    },
    {
      "pageNumber": 2,
      "text": {
        "content": "Page 2 text",
        ...
      }
    }
  ]
}
```

## 🎯 Key Improvements

### UX Enhancements
✅ All pages visible at once (gallery view)  
✅ Text overlays auto-load from config  
✅ Click-away deselection (clean preview)  
✅ Transparent borders by default  
✅ Red border only when selected  
✅ Page context in properties panel  
✅ Export all pages with one click  

### Technical Improvements
- Modular page loading (each page independent)
- Per-page overlay tracking
- Smart selection management
- Grouped export by page number
- Backwards-compatible APIs

## 🛠️ Architecture

### File Structure
```
text-tester/
├── index.html          # Multi-page gallery layout
├── css/
│   └── style.css       # Gallery + selection styles
└── js/
    ├── main.js         # App initialization
    ├── page-loader.js  # Load all pages in gallery
    ├── text-editor.js  # Text overlay management + deselection
    ├── export.js       # Export all pages
    ├── image-loader.js # Image utilities (simplified)
    └── compare.js      # Comparison feature (optional)
```

### Module Responsibilities

**PageLoader**: 
- Detect/load all published pages
- Create gallery structure
- Auto-load text from config
- Per-page "Add Text" buttons

**TextEditor**: 
- Create/edit/delete text overlays
- Drag & resize functionality
- Selection management
- Click-away deselection
- Page context tracking

**ExportManager**: 
- Group overlays by page
- Generate JSON for all pages
- Copy to clipboard
- Format validation

**ImageLoader**: 
- Utility functions for image access
- Page-specific image lookups
- Backwards compatibility

## 🧪 Testing Checklist

- ✅ All published pages load in gallery
- ✅ Text overlays render on each page
- ✅ Click text overlay → shows red border + handles
- ✅ Click outside → hides red border (deselection)
- ✅ Properties panel shows page + overlay context
- ✅ Can edit any text on any page
- ✅ Can add new text to any page (➕ button)
- ✅ Can delete text from any page
- ✅ Export includes all pages with text
- ✅ Scroll works smoothly through all pages
- ✅ Handles load from existing config automatically

## 📝 Usage with AI Agent

### Add Text to Book
```
After exporting settings:
"Here are the text overlay settings for all pages. Please add them with: book add-text"
[Paste JSON]
```

### Update Specific Page
```
"Update page 5's text with these settings:"
{
  "pages": [
    {
      "pageNumber": 5,
      "text": { ... }
    }
  ]
}
```

## 🔧 Troubleshooting

### Pages Not Loading
- Ensure book is published: `book publish`
- Check `docs/images/pages/` directory exists
- Verify image files: `page-01.jpg`, `page-02.jpg`, etc.

### Text Not Loading from Config
- Check `docs/index.html` for `data-text-spec` attributes
- Verify JSON format in page cards
- Check browser console for parsing errors

### Export Not Working
- Ensure at least one page has text overlay
- Check clipboard permissions in browser
- Use manual copy from displayed JSON if auto-copy fails

### Selection Issues
- Click directly on text to select
- Click outside all text to deselect
- Refresh page if selection state is stuck

## 🎓 Tips & Best Practices

1. **Work on Multiple Pages**: Add text to all pages before exporting
2. **Use Consistent Fonts**: Pick 1-2 fonts for the whole book
3. **Preview Before Export**: Deselect all to see clean preview
4. **Save Often**: Copy export JSON to a file as backup
5. **Start with Defaults**: New text starts at 80% width, easy to adjust
6. **Use Page Context**: Check which page/text you're editing in properties panel

## 📚 Related Documentation

- [Text Overlay User Guide](../../TEXT_OVERLAY_USER_GUIDE.md)
- [Text Preview Design](../../TEXT_PREVIEW_DESIGN.md)
- [Book Creation System](../../BOOK_CREATION_SYSTEM.md)

## 🔄 Migration from Old Version

### Breaking Changes
- Single canvas → Multi-page gallery
- Manual page loading → Auto-load all pages
- Always-visible borders → Click-away deselection
- Single-page export → Multi-page export

### Benefits
- 10x faster workflow (no manual page loading)
- Complete book overview in one view
- Cleaner preview (transparent borders)
- Single export for entire book

### Backwards Compatibility
- All APIs maintained (addTextOverlay, etc.)
- Old export format still supported
- Comparison feature still available (optional)

## 🚀 Future Enhancements

Potential improvements:
- [ ] Undo/redo functionality
- [ ] Text overlay templates
- [ ] Bulk text operations
- [ ] Font preview in selector
- [ ] Text alignment guides
- [ ] Keyboard shortcuts
- [ ] Duplicate overlay between pages
- [ ] Search/filter pages

---

**Version**: 2.0 (Multi-Page Gallery)  
**Updated**: February 2026  
**Status**: ✅ Production Ready
