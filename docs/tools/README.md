# Tools

This directory contains tools that are automatically included with every published project.

## Text Overlay Tester

**Location:** `tools/text-tester/`

A visual editor for designing and testing text overlays on book pages.

### Features

- Load published pages from your project
- Visually edit text overlays (drag, resize, style)
- Compare HTML preview with Pillow-rendered output
- Export settings to story.json format
- Copy to clipboard for agent updates

### Access

After publishing your project with `book publish PROJECT`:

```
https://username.github.io/project-slug/tools/text-tester/
```

### Documentation

See `text-tester/README.md` for full documentation.

---

## Adding New Tools

To add a new tool:

1. Create directory: `docs/tools/your-tool/`
2. Add tool files (HTML, CSS, JS, etc.)
3. Tool will be automatically copied during `book publish`
4. Users can access at: `/tools/your-tool/`
