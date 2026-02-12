# Text Overlay Tester - Integration Guide

## Overview

The Text Overlay Tester is now part of the **children's book creator template** and is automatically included with every published project.

## Location

**Template:** `/docs/tools/text-tester/`

**Published:** `https://username.github.io/project-slug/tools/text-tester/`

## How It Works

### 1. Publishing Workflow

When `book publish PROJECT` runs:

```bash
book publish my-luna-story
```

The publish script:
1. Generates the project's GitHub Pages site
2. **Copies** `/docs/tools/text-tester/` to the published site
3. Every project automatically gets the tool

### 2. Tool Integration

The tool integrates with published projects:

**Loads published pages:**
- Reads from `../images/pages/page-XXX.png`
- Can detect pages automatically
- Can read from `../data/pages.json` if available

**Compares with Pillow:**
- Shows HTML preview (new settings) vs published page (Pillow-rendered)
- Side-by-side comparison for visual validation
- User iterates until satisfied

**Exports to story.json format:**
- One-click copy to clipboard
- Ready to send to AI agent
- Agent updates and republishes

### 3. User Workflow

```
1. User opens https://username.github.io/my-project/tools/text-tester/
2. User loads published page (already Pillow-rendered)
3. User adds/edits text overlay visually
4. User clicks "Compare" → sees HTML vs Pillow
5. User clicks "Copy Settings" → JSON copied
6. User sends JSON to AI agent
7. Agent updates story.json
8. Agent runs: book add-text PROJECT
9. Agent runs: book publish PROJECT
10. User refreshes → sees updated Pillow page
```

## File Structure

### Template (Source)

```
docs/
└── tools/
    └── text-tester/
        ├── index.html
        ├── README.md
        ├── QUICKSTART.md
        ├── INTEGRATION.md (this file)
        ├── css/
        │   └── style.css
        ├── js/
        │   ├── main.js
        │   ├── page-loader.js       # NEW: Loads published pages
        │   ├── image-loader.js
        │   ├── text-editor.js
        │   ├── export.js
        │   └── compare.js           # UPDATED: Compares with published
        ├── fonts/
        │   └── .gitkeep
        └── example-settings.json
```

### Published (Deployed)

```
username.github.io/my-project/
├── index.html                        # Main preview
├── tools/
│   └── text-tester/                  # Text overlay tool (copied)
│       ├── index.html
│       └── ...
├── images/
│   └── pages/                        # Published pages (Pillow-rendered)
│       ├── page-001.png
│       ├── page-002.png
│       └── ...
└── data/
    └── pages.json                    # Page metadata (optional)
```

## Key Changes from Standalone Version

### What Changed

**❌ Removed:**
- Python Pillow script (`test_pillow.py`)
- Flask server mode
- Local file testing
- Output directory

**✅ Added:**
- Page loader (`page-loader.js`)
- Published page grid
- Link back to preview
- Relative path loading

**🔄 Updated:**
- Compare shows published images (not generated)
- Export is simpler (just copy)
- Documentation reflects web workflow

### Why These Changes

**No Pillow script needed:**
- Published pages are already Pillow-rendered
- Tool compares against existing images
- Agent handles regeneration

**Web-based workflow:**
- Tool is accessed via browser
- No local Python installation needed
- Works on any device

**Template integration:**
- Every project gets the tool automatically
- Consistent experience across projects
- Zero setup for users

## Navigation Integration

### Option 1: Add Link to Preview

Edit `docs/index.html` to add navigation link:

```html
<nav>
  <a href="index.html">Preview</a>
  <a href="tools/text-tester/">Text Overlay Tester</a>
</nav>
```

### Option 2: Standalone Access

Users can access directly via URL:
```
https://username.github.io/project-slug/tools/text-tester/
```

### Option 3: Documentation Link

Add to project README or docs:
```markdown
## Tools

- [Text Overlay Tester](tools/text-tester/) - Visual text overlay editor
```

## API & Data Formats

### Loading Published Pages

The tool looks for pages in two ways:

**Method 1: pages.json (preferred)**

```json
{
  "pages": [
    {
      "number": 1,
      "path": "../../images/pages/page-001.png",
      "name": "Cover"
    },
    {
      "number": 2,
      "path": "../../images/pages/page-002.png",
      "name": "Page 2"
    }
  ]
}
```

**Method 2: Auto-detection**

Scans for `../../images/pages/page-001.png` through `page-024.png`

### Export Format

Matches `story.json` exactly:

```json
{
  "content": "Text content here",
  "position": "custom",
  "font": "Quicksand-Medium.ttf",
  "fontSize": 240,
  "color": "#000000",
  "leftPercent": 10.0,
  "topPercent": 75.0,
  "widthPercent": 80.0
}
```

## Publish Script Integration

### Recommended Changes to `book publish`

```python
# In publish.py or equivalent

def publish_project(project_path):
    """Publish project to GitHub Pages"""
    
    # ... existing publish logic ...
    
    # Copy text overlay tool
    tool_source = Path(__file__).parent / "docs" / "tools" / "text-tester"
    tool_dest = output_dir / "tools" / "text-tester"
    
    if tool_source.exists():
        shutil.copytree(tool_source, tool_dest, dirs_exist_ok=True)
        print("✓ Text overlay tool copied")
    
    # ... rest of publish logic ...
```

### Alternative: Template-Based

```python
# Use Jinja2 or similar templating
def copy_template_files(output_dir):
    """Copy template files including tools"""
    template_dir = Path(__file__).parent / "docs"
    
    # Copy entire docs directory (includes tools/)
    shutil.copytree(template_dir, output_dir, dirs_exist_ok=True)
```

## Testing the Integration

### 1. Test Template

```bash
# Verify files exist
ls docs/tools/text-tester/

# Should show:
# index.html, README.md, QUICKSTART.md, INTEGRATION.md
# css/, js/, fonts/
```

### 2. Test Publish

```bash
# Publish a test project
book publish my-test-project

# Verify tool was copied
ls output/tools/text-tester/

# Should show all files
```

### 3. Test Live

```bash
# Start local server
cd output
python3 -m http.server 8000

# Open in browser
# http://localhost:8000/tools/text-tester/
```

**Expected behavior:**
- Tool loads
- Can load images from `../images/pages/`
- Can add/edit text overlays
- Export works
- Comparison loads published images

## Troubleshooting

**Tool not found after publish:**
- Check publish script copies `docs/tools/`
- Verify paths are correct
- Check GitHub Pages build logs

**Can't load published pages:**
- Verify pages exist at `../images/pages/`
- Check browser console for 404 errors
- Try manual image upload as fallback

**Comparison doesn't work:**
- Verify image paths are relative
- Check CORS policy (shouldn't be an issue on same domain)
- Check browser console for errors

**Export doesn't copy:**
- Browser may block clipboard access
- User can copy manually from displayed JSON
- Check HTTPS (some browsers require it for clipboard)

## Future Enhancements

### Potential Features

**Import current settings:**
- Load existing text from story.json
- Pre-populate overlay with current values
- Allow editing instead of creating from scratch

**Batch operations:**
- Update multiple pages at once
- Copy settings from one page to another
- Apply template to all pages

**Safe zone visualization:**
- Show 0.75" margins
- Highlight gutter area on spreads
- Warn when text is outside safe zones

**Font integration:**
- Load actual project fonts
- Match font rendering more closely
- Show font samples

## Maintenance

### Updating the Tool

To update the tool for all future projects:

1. Edit files in `/docs/tools/text-tester/`
2. Test changes locally
3. Commit to repository
4. All new publishes will use updated version

### Versioning

Consider adding version to tool:

```html
<!-- In index.html -->
<footer>
  Text Overlay Tester v1.0.0
</footer>
```

Update version when making significant changes.

## Support

**For users:**
- See `README.md` in the tool
- See `QUICKSTART.md` for quick start
- Check project documentation

**For developers:**
- See this `INTEGRATION.md`
- Check publish script
- Review JavaScript modules

---

**The text overlay tester is now a first-class citizen of the children's book creator toolkit, automatically available in every published project.** 🎉
