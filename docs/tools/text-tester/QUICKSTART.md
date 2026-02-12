# Quick Start Guide

## 🚀 5-Minute Workflow

### Prerequisites

✅ Your project is published: `book publish my-project`  
✅ You have access to your project's GitHub Pages site

---

## Step 1: Open the Tool

Visit your project's text tester:
```
https://username.github.io/my-project/tools/text-tester/
```

Or navigate from your project preview → "Text Overlay Tester" link

---

## Step 2: Load a Page

1. Click **"📚 Load Published Page"**
2. Select a page from the grid
3. Page loads with current Pillow rendering

---

## Step 3: Add Text Overlay

1. Click **"➕ Add Text"**
2. **Drag** to reposition
3. **Resize** using corner handles
4. **Edit** in properties panel

---

## Step 4: Compare

1. Click **"🔍 Compare"**
2. See side-by-side:
   - Your HTML preview (left)
   - Published Pillow page (right)
3. Adjust text until satisfied

---

## Step 5: Export & Update

1. Click **"📋 Copy Settings to Clipboard"**
2. Send to AI agent:

```
Update page 5 with these text settings:
<paste JSON>
```

3. Agent runs `book add-text` and republishes
4. Refresh comparison to see updated page

---

## 🎨 Quick Tips

**Dragging:** Click and drag overlay box  
**Resizing:** Drag corner circles  
**Fine-tuning:** Use % inputs in properties  
**Multiple overlays:** Add more with "Add Text"

---

## 📝 Example Session

```
YOU: Opens https://username.github.io/my-project/tools/text-tester/

YOU: Clicks "Load Published Page" → selects Page 5

YOU: Clicks "Add Text"
     Types: "Luna soared through the starry night."
     Drags to position at bottom of page
     Sets font size: 240px
     
YOU: Clicks "Compare" → sees HTML vs Pillow side-by-side

YOU: Adjusts position from 70% to 75% for better fit

YOU: Clicks "Copy Settings to Clipboard"

YOU: Sends to agent:
     "Update page 5 text settings with:
     { ... pasted JSON ... }"

AGENT: Updates story.json
       Runs: book add-text my-project
       Runs: book publish my-project
       
YOU: Refreshes comparison → sees updated page! ✓
```

---

## ⚙️ Settings Format

```json
{
  "content": "Your text here",
  "position": "custom",
  "font": "Quicksand-Medium.ttf",
  "fontSize": 240,
  "color": "#000000",
  "leftPercent": 10,
  "topPercent": 75,
  "widthPercent": 80
}
```

**Remember to:**
- ✅ Update `"font"` to match your project fonts
- ✅ Check fontSize for print (240px ≈ 0.8" at 300 DPI)
- ✅ Keep text within safe zones (9-91%)

---

## 🆘 Common Issues

**Problem:** No pages showing  
**Solution:** Run `book publish` first

**Problem:** Can't add text  
**Solution:** Load a page first

**Problem:** Export button grayed out  
**Solution:** Click on overlay to select (red border)

**Problem:** HTML doesn't match Pillow exactly  
**Solution:** This is expected! Different renderers. Use comparison to guide positioning.

---

## 📚 Need More Help?

- Full README: `README.md` in this directory
- Book commands: `book --help`
- Project preview: `https://username.github.io/my-project/`

---

**Ready? Load a page and start designing! 🎨**
