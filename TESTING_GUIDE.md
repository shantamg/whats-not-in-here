# Interactive Editor Testing Guide

## 🎯 Quick Start

Visit: **https://shantamg.github.io/whats-not-in-here/**

## 🧪 Test Scenarios

### Test 1: Version Approval (PRIORITY 1)
**Goal:** Verify the approve button works correctly

1. Scroll to a page with multiple versions (Page 1 or Page 4)
2. Look at the bottom of the page image - you should see version controls
3. **Check status indicator:**
   - Should show "Viewing: v1 | Approved: v1" (or similar)
4. **Click the right arrow** to view a different version
5. **Look for the approve button:**
   - Big green button: "✓ Approve This Version"
   - Should be pulsing/animated
6. **Click the approve button**
   - Watch for green checkmark animation (1.5 seconds)
   - Status should update: "Viewing: v2 | Approved: v2"
   - Button should change to "Approved" indicator
7. **Scroll to bottom of page**
   - Live changes panel should show: "Page X: Approved version vY"

**Expected Result:** ✅ Version approval works, updates live changes

---

### Test 2: Live Changes Display
**Goal:** Verify changes update in real-time

1. **Find the live changes panel** at the very bottom of the page
   - Should see: "📝 Current Changes (0)"
2. **Make any change:**
   - Adjust global font size slider
   - OR click a text overlay and change something
3. **Watch the panel:**
   - Counter should increment: "(1)"
   - Summary should show the change
   - JSON should update
4. **Click "📋 Copy JSON"**
   - Should see notification: "✓ Changes copied to clipboard!"
5. **Click "🔄 Revert All"**
   - Confirm dialog should appear
   - Page should reload, all changes cleared

**Expected Result:** ✅ Changes display and update live

---

### Test 3: Click-to-Edit Text
**Goal:** Verify direct text manipulation works

1. **Click any text overlay** on a page
   - Text should get blue outline
   - Resize handles should appear at corners
2. **Look for popup panel** next to the image
   - Should show: "Edit Text - Page X"
   - Controls: font, size, color, alignment
3. **Adjust font size slider**
   - Text should resize immediately
   - Live changes should update
4. **Drag the text overlay** (click and hold center)
   - Should move with mouse
   - Position should change
5. **Drag a corner handle**
   - Text container should resize
   - Width should change
6. **Click alignment buttons**
   - Text should realign (left/center/right)
7. **Click "🔄 Reset to Global Settings"**
   - Text should reset to global defaults
8. **Click outside or close button**
   - Popup should disappear
   - Outline and handles should disappear

**Expected Result:** ✅ Text editing works with direct manipulation

---

### Test 4: Global Settings
**Goal:** Verify global settings work

1. **Find gray bar above page grid**
   - "Global Text Settings"
2. **Change global font size**
   - Drag slider left/right
   - Should see: "70pt (240pt)" updating
3. **Watch all text overlays**
   - All pages using global should update
   - Check live changes panel for update
4. **Change font dropdown**
   - Select different font
   - Text should change on all pages
5. **Click "↺ Revert Global"**
   - Should reset all global settings
   - Live changes should update

**Expected Result:** ✅ Global settings apply to all pages

---

### Test 5: Revert Functionality
**Goal:** Verify all revert buttons work

1. **Make several changes:**
   - Change global size
   - Approve a version
   - Edit a page's text
2. **Check live changes panel:**
   - Should show 3+ changes
3. **Click "↺ Revert Page" on a card**
   - That page's changes should clear
   - Live changes should update
4. **Click "↺ Revert Global"**
   - Global changes should clear
5. **Click "🔄 Revert All" in changes panel**
   - Confirm dialog
   - Page should reload
   - Everything should reset

**Expected Result:** ✅ All revert buttons work

---

### Test 6: Keyboard Shortcuts
**Goal:** Verify keyboard navigation works

1. **Click a text overlay** to select it
2. **Press ESC**
   - Should deselect
3. **Navigate to a multi-version page**
4. **Press LEFT ARROW**
   - Should go to previous version
5. **Press RIGHT ARROW**
   - Should go to next version
6. **Press ENTER** (when approve button visible)
   - Should approve version

**Expected Result:** ✅ Keyboard shortcuts work

---

## 🐛 Known Issues to Check

1. **Text rendering accuracy:** Does text match what you expect?
2. **Mobile responsiveness:** Does it work on mobile? (Resize browser)
3. **Performance:** Does it lag with many changes?
4. **Browser compatibility:** Try in Chrome, Firefox, Safari
5. **LocalStorage:** Do selections persist after refresh?

## 📱 Mobile Testing

1. Open on mobile device or resize browser to < 768px
2. Check if version controls are always visible (not just on hover)
3. Check if popup panel fits on screen
4. Check if global settings stack vertically
5. Check if live changes panel is usable

## 🎨 Visual Polish Check

1. **Animations:**
   - Approve button pulses
   - Checkmark animation plays
   - Popup slides in smoothly
   - Panel expands/collapses smoothly

2. **Colors:**
   - Blue = currently viewing
   - Green = approved
   - Red = revert/danger
   - Gray = global settings (not blue)

3. **Spacing:**
   - Nothing overlapping
   - Good whitespace
   - Readable at all sizes

## ✅ Success Criteria

The redesign is successful if:

- [x] Approve button is **impossible to miss**
- [x] Changes are **always visible** at bottom
- [x] Text editing is **intuitive** (click → edit)
- [x] All actions give **instant feedback**
- [x] Easy to **undo mistakes** at any level
- [x] Works on **mobile and desktop**

## 🚨 If Something Breaks

1. **Open browser console** (F12)
2. Look for errors (red text)
3. Take screenshot
4. Note which browser and version
5. Report what you did before it broke

## 📊 Report Template

```
FEATURE TESTED: [e.g., Version Approval]
STATUS: [✅ Pass | ❌ Fail | ⚠️ Partial]
BROWSER: [Chrome 119, Firefox 120, etc.]
DEVICE: [Desktop / Mobile / Tablet]
NOTES: [What worked, what didn't]
```

---

**Live Demo:** https://shantamg.github.io/whats-not-in-here/

Good luck testing! 🎉
