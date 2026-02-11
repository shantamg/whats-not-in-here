# Spread Prompt Redesign - Eliminating Book/Page References

## Problem
AI was drawing vertical lines down the middle of spreads because prompts mentioned "TWO-PAGE SPREAD", "DOUBLE-PAGE", "pages", "gutter", etc. Even though we removed "crease", the concept of "two pages" made the AI draw a dividing line.

## Solution
Completely redesigned spread prompts to NEVER mention books, pages, spreads, or gutters. Just describe as wide panoramic images.

## Changes Made

### 1. Code Updates (childrens-book-creator repo)

**Files modified:**
- `src/book_creator/generation/prompts.py`
- `src/book_creator/generation/spread_generation.py`
- `scripts/generate_pages_batch.py`

**Terminology changes:**
- ❌ "TWO-PAGE SPREAD" → ✅ "WIDE PANORAMIC ILLUSTRATION"
- ❌ "DOUBLE-PAGE SPREAD" → ✅ "panoramic landscape"
- ❌ "spread" → ✅ "panoramic scene" / "wide composition"
- ❌ "left page" / "right page" → ✅ "left third" / "right third"
- ❌ "gutter" → ✅ "center zone"
- ❌ "CHILDREN'S BOOK ILLUSTRATION" → ✅ "ILLUSTRATION"

### 2. Story.json Updates (whats-not-in-here repo)

**Pages modified:**
- Page 17-18 (forest meditation spread)
- Page 19-20 (sunset meditation spread)
- Page 21-22 (space meditation spread)

**Scene description changes:**
- Removed "DOUBLE-PAGE SPREAD" prefix
- Changed "panoramic landscape" instead
- "RIGHT side" / "LEFT side" → "right third" / "left third"
- "flows across gutter" → "flows through center zone"

## Prompt Comparison: Spread 17-18

### OLD (v2) - With Book/Page References
```
TWO-PAGE SPREAD ILLUSTRATION - PAGES 17-18
Art style: Whimsical watercolor with soft edges
Overall mood: Warm, dreamy, magical

SCENE: Whimsical watercolor DOUBLE-PAGE SPREAD: Eloy sitting in meditation pose, 
eyes closed, on a large rock positioned on the RIGHT side. LEFT side shows redwood 
forest scene with a gentle creek flowing, ferns, dappled sunlight through trees, 
deer in distance.

CRITICAL COMPOSITION REQUIREMENTS FOR TWO-PAGE SPREAD:
- Format: 2:1 LANDSCAPE (twice as wide as tall)
- Create a continuous panoramic scene that spans seamlessly across the full width
- Avoid placing important elements (faces, text, key objects) in the center 5% zone
- Center area should contain background elements (sky, landscape, negative space)
- Position main focal points in the left 1/3 or right 1/3 of the spread
- Seamless composition - no visual dividers or lines down the middle
- Full bleed to all edges (no borders)
- Balanced composition across the entire panoramic spread

GUTTER STRATEGY: Eloy positioned right, forest scene flows across gutter from left
```

### NEW (v3) - Panoramic Language Only
```
WIDE PANORAMIC ILLUSTRATION - Scene 17-18
Art style: Whimsical watercolor with soft edges
Overall mood: Warm, dreamy, magical

SCENE: Whimsical watercolor panoramic landscape: Eloy sitting in meditation pose, 
eyes closed, on a large rock positioned in the right third of the frame. Left third 
shows redwood forest scene with a gentle creek flowing, ferns, dappled sunlight 
through trees, deer in distance.

COMPOSITION REQUIREMENTS:
- Format: 2:1 LANDSCAPE (twice as wide as tall)
- Wide panoramic composition
- Avoid placing important subjects (faces, focal points) in the center 5% horizontal zone
- Position main subjects in the left third or right third of the frame
- Center zone should contain background elements (sky, landscape, water, space)
- Seamless continuous composition - no dividing lines or breaks
- Full bleed to all edges

POSITIONING STRATEGY: Eloy positioned in right third, forest scene flows through 
center zone from left
```

## Verification Checklist

✅ **Code changes:**
- [x] prompts.py updated
- [x] spread_generation.py updated
- [x] generate_pages_batch.py updated
- [x] Changes committed and pushed to childrens-book-creator repo

✅ **Story.json changes:**
- [x] Page 17-18 scene description updated
- [x] Page 19-20 scene description updated
- [x] Page 21-22 scene description updated
- [x] Changes committed locally

✅ **Eliminated phrases:**
- [x] "TWO-PAGE SPREAD" - ZERO mentions
- [x] "DOUBLE-PAGE" - ZERO mentions
- [x] "spread" (except spread-start type) - eliminated from prompts
- [x] "pages" - eliminated from spread prompts
- [x] "left page" / "right page" - changed to "left third" / "right third"
- [x] "binding" - not used
- [x] "gutter" - changed to "center zone"
- [x] "book" - eliminated from prompts

✅ **New panoramic language:**
- [x] "WIDE PANORAMIC ILLUSTRATION"
- [x] "panoramic landscape" / "panoramic composition"
- [x] "left third" / "right third" / "center zone"
- [x] "Seamless continuous composition - no dividing lines or breaks"
- [x] "Full bleed to all edges"

## Next Steps

To regenerate the meditation spreads with the new prompts:

```bash
# Navigate to the whats-not-in-here project
cd /home/node/.openclaw/workspace/whats-not-in-here

# Option 1: Use Python directly (requires GEMINI_API_KEY)
cd /home/node/.openclaw/workspace/childrens-book-creator
uv run python -c "
from pathlib import Path
from book_creator.project import Project
from book_creator.generation.spread_generation import SpreadGenerator
import os

project = Project(Path('/home/node/.openclaw/workspace/whats-not-in-here'))
gen = SpreadGenerator(project, os.environ.get('GEMINI_API_KEY'))

# Generate all three meditation spreads
gen.generate_spread(17, variation=3)
gen.generate_spread(19, variation=3)
gen.generate_spread(21, variation=3)
"

# Option 2: Use batch generation script
cd /home/node/.openclaw/workspace/childrens-book-creator
uv run python scripts/generate_pages_batch.py \
  /home/node/.openclaw/workspace/whats-not-in-here \
  --stage draft \
  --pages 17,19,21
```

## Expected Results

With the new prompts, the AI should:
1. ✅ Generate seamless wide 2:1 panoramic images
2. ✅ Position subjects in left/right thirds as specified
3. ✅ Use center zone for background elements only
4. ❌ NO vertical lines down the middle
5. ❌ NO visual dividers or page breaks
6. ❌ NO book-like appearance

## Success Criteria

- [x] Zero mentions of "page", "spread", "gutter", "binding", or "book" in generated prompts
- [ ] AI generates seamless wide panoramic images (needs API key to test)
- [ ] No unwanted vertical lines down the middle (needs API key to test)
- [x] Subject positioning still respected (left/right/center as specified in prompt)
