#!/usr/bin/env python3
"""
Convert page version PNGs to JPGs for the web preview
Scans source pages directory and converts all versions to web format
"""

import os
import sys
from pathlib import Path
from PIL import Image

def convert_page_versions(pages_source_dir, output_dir, max_width=1200, quality=85):
    """
    Convert all page version PNGs to JPGs
    
    Args:
        pages_source_dir: Path to source pages directory (e.g., ../pages)
        output_dir: Path to output directory (e.g., images/pages)
        max_width: Maximum width for web images (default 1200px)
        quality: JPEG quality (default 85)
    """
    pages_source = Path(pages_source_dir)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    
    converted_count = 0
    skipped_count = 0
    
    print(f"Scanning {pages_source} for page versions...")
    
    # Find all page folders
    page_folders = sorted([d for d in pages_source.iterdir() if d.is_dir()])
    
    for folder in page_folders:
        # Extract page number from folder name (e.g., 001-page1 -> 1)
        folder_name = folder.name
        page_num_str = folder_name.split('-')[0]
        try:
            page_num = int(page_num_str)
        except ValueError:
            continue
        
        # Find all version files: page_XXX_vN.png
        version_files = list(folder.glob('page_*_v*.png'))
        
        for version_file in version_files:
            # Extract version number from filename
            filename = version_file.name
            # Pattern: page_XXX_vN.png
            if '_v' not in filename:
                continue
            
            version_part = filename.split('_v')[1].split('.')[0]
            try:
                version_num = int(version_part)
            except ValueError:
                continue
            
            # Output filename: page-XX-vN.jpg
            output_filename = f"page-{page_num:02d}-v{version_num}.jpg"
            output_path = output / output_filename
            
            # Skip if already exists and is newer than source
            if output_path.exists():
                if output_path.stat().st_mtime >= version_file.stat().st_mtime:
                    print(f"  Skip {output_filename} (already exists)")
                    skipped_count += 1
                    continue
            
            # Convert PNG to JPG
            try:
                print(f"  Converting {filename} -> {output_filename}")
                
                with Image.open(version_file) as img:
                    # Convert to RGB (remove alpha channel if present)
                    if img.mode in ('RGBA', 'LA', 'P'):
                        # Create white background
                        background = Image.new('RGB', img.size, (255, 255, 255))
                        if img.mode == 'P':
                            img = img.convert('RGBA')
                        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                        img = background
                    elif img.mode != 'RGB':
                        img = img.convert('RGB')
                    
                    # Resize if needed
                    if img.width > max_width:
                        ratio = max_width / img.width
                        new_height = int(img.height * ratio)
                        img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
                        print(f"    Resized to {max_width}x{new_height}")
                    
                    # Save as JPEG
                    img.save(output_path, 'JPEG', quality=quality, optimize=True)
                    
                converted_count += 1
                print(f"    ✓ Saved {output_filename}")
                
            except Exception as e:
                print(f"    ✗ Error converting {filename}: {e}")
    
    print(f"\n=== Conversion Complete ===")
    print(f"Converted: {converted_count} files")
    print(f"Skipped: {skipped_count} files (already up to date)")
    
    return converted_count

if __name__ == '__main__':
    # Default paths relative to docs directory
    pages_source = Path('../pages')
    output_dir = Path('images/pages')
    
    if len(sys.argv) > 1:
        pages_source = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_dir = Path(sys.argv[2])
    
    if not pages_source.exists():
        print(f"Error: Source directory not found: {pages_source}")
        sys.exit(1)
    
    converted = convert_page_versions(pages_source, output_dir)
    
    if converted > 0:
        print("\n✓ Now run: python generate_version_metadata.py")
        print("  This will update version-metadata.js with the new versions")
