# Deployment Guide

## Quick Reference

**Template Location:** `/docs/tools/text-tester/`  
**Published Location:** `/tools/text-tester/` (on GitHub Pages)  
**User Access:** `https://username.github.io/project/tools/text-tester/`

## Integration with `book publish`

### Option 1: Simple Copy

Add to your publish script:

```python
from pathlib import Path
import shutil

def publish_project(project_path: Path, output_dir: Path):
    """Publish project including text overlay tool"""
    
    # ... your existing publish logic ...
    
    # Copy text overlay tool
    tool_source = Path(__file__).parent / "docs" / "tools" / "text-tester"
    tool_dest = output_dir / "tools" / "text-tester"
    
    print("Copying text overlay tool...")
    shutil.copytree(tool_source, tool_dest, dirs_exist_ok=True)
    print("✓ Text overlay tool included")
```

### Option 2: Template-Based

If you use templating for the whole docs directory:

```python
def copy_docs_template(output_dir: Path):
    """Copy entire docs template including tools"""
    
    docs_source = Path(__file__).parent / "docs"
    
    # Copy everything
    shutil.copytree(docs_source, output_dir, dirs_exist_ok=True)
    
    # The tools/ directory is copied automatically
```

### Option 3: Selective Copy

If you want more control:

```python
TEMPLATE_ITEMS = [
    "index.html",
    "css/",
    "js/",
    "images/",
    "tools/text-tester/",  # Include tool
]

def copy_template_items(output_dir: Path):
    for item in TEMPLATE_ITEMS:
        source = REPO_ROOT / "docs" / item
        dest = output_dir / item
        
        if source.is_file():
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, dest)
        elif source.is_dir():
            shutil.copytree(source, dest, dirs_exist_ok=True)
```

## Expected Directory Structure

### Before Publish (Template)

```
childrens-book-creator/
├── docs/
│   ├── tools/
│   │   ├── README.md
│   │   └── text-tester/          ← Template location
│   │       ├── index.html
│   │       ├── css/
│   │       ├── js/
│   │       └── ...
│   └── ...
└── ...
```

### After Publish (Deployed)

```
username.github.io/my-project/
├── index.html                     # Main preview
├── tools/
│   └── text-tester/               # Tool (copied from template)
│       ├── index.html
│       ├── css/
│       ├── js/
│       └── ...
├── images/
│   └── pages/                     # Pillow-rendered pages
│       ├── page-001.png
│       ├── page-002.png
│       └── ...
└── data/
    └── pages.json                 # Page metadata (optional)
```

## Testing the Deployment

### 1. Local Testing

```bash
# Navigate to repo
cd childrens-book-creator

# Check template exists
ls -la docs/tools/text-tester/

# Run publish (if available)
book publish test-project

# Check output
ls -la output/test-project/tools/text-tester/
```

### 2. Local Server Testing

```bash
# Navigate to output
cd output/test-project

# Start server
python3 -m http.server 8000

# Open browser
open http://localhost:8000/tools/text-tester/
```

**Expected behavior:**
- Tool loads without errors
- Page list shows "No published pages" (or loads if pages exist)
- Can upload image manually
- Can add text overlays
- Export works

### 3. GitHub Pages Testing

```bash
# After pushing to GitHub
# Visit your project:
https://username.github.io/my-project/tools/text-tester/

# Should work exactly like local version
```

## Troubleshooting

### Tool Not Found After Publish

**Problem:** 404 error accessing `/tools/text-tester/`

**Solution:**
1. Verify template exists at `docs/tools/text-tester/`
2. Check publish script includes tool copy
3. Check output directory for copied files
4. Verify GitHub Pages build succeeded

### Can't Load Published Pages

**Problem:** "No published pages found"

**Solution:**
1. Verify pages exist at `../images/pages/page-XXX.png`
2. Check relative paths are correct
3. Try manual image upload as workaround
4. Check browser console for 404 errors

### Styles Not Loading

**Problem:** Tool loads but looks unstyled

**Solution:**
1. Verify `css/style.css` was copied
2. Check browser console for CSS 404 errors
3. Verify relative paths in HTML are correct
4. Check GitHub Pages serves CSS with correct MIME type

### JavaScript Errors

**Problem:** Tool loads but doesn't work

**Solution:**
1. Open browser console (F12)
2. Check for JavaScript errors
3. Verify all JS files were copied
4. Check for CORS issues (shouldn't happen on same domain)

## Customization

### Adding Navigation Link

Edit `docs/index.html` (or template):

```html
<nav>
  <a href="index.html">Preview</a>
  <a href="tools/text-tester/">Text Overlay Tester</a>
  <!-- other links -->
</nav>
```

### Customizing Tool

Files are in `docs/tools/text-tester/`:
- **index.html** - Main UI
- **css/style.css** - Styling
- **js/*.js** - Functionality

Changes to template will apply to all future publishes.

### Adding Pages Data

Create `data/pages.json` during publish:

```python
def generate_pages_json(project_path: Path, output_dir: Path):
    """Generate pages.json for text overlay tool"""
    
    pages_data = {
        "pages": []
    }
    
    for i, page in enumerate(project.pages):
        pages_data["pages"].append({
            "number": i + 1,
            "path": f"../../images/pages/page-{i+1:03d}.png",
            "name": page.get("name", f"Page {i+1}"),
            "title": page.get("title", "")
        })
    
    data_dir = output_dir / "data"
    data_dir.mkdir(exist_ok=True)
    
    with open(data_dir / "pages.json", "w") as f:
        json.dump(pages_data, f, indent=2)
```

## Maintenance

### Updating the Tool

To update for all future projects:

1. Edit files in `docs/tools/text-tester/`
2. Test locally
3. Commit changes
4. All new publishes will use updated version

### Versioning

Consider adding version to footer:

```html
<!-- In index.html -->
<footer class="tool-footer">
  Text Overlay Tester v1.0.0 • Part of Children's Book Creator
</footer>
```

Update version for significant changes.

## Support

**For users:**
- See `README.md` - User guide
- See `QUICKSTART.md` - Quick start

**For developers:**
- See `INTEGRATION.md` - Integration details
- See this `DEPLOYMENT.md` - Deployment guide
- See `HANDOFF.md` - Implementation summary

---

**The tool is ready for deployment as part of the publish workflow.**
