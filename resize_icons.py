"""
Resize all PNG images in the Icons folder to 200x200 pixels
"""
from PIL import Image
import os
from pathlib import Path

def resize_image(image_path, output_size=(200, 200)):
    """Resize a single image to the specified size (only if larger)"""
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            
            # Skip if image is already 200x200
            if width == output_size[0] and height == output_size[1]:
                print(f"⊘ Skipped: {image_path.name} ({width}x{height}) - already at target size")
                return None
            
            # Skip if this would upscale the image
            if width < output_size[0] or height < output_size[1]:
                print(f"⊘ Skipped: {image_path.name} ({width}x{height}) - would require upscaling")
                return None
            
            # Resize the image using high-quality Lanczos resampling
            img_resized = img.resize(output_size, Image.Resampling.LANCZOS)
            # Save back to the same file
            img_resized.save(image_path, 'PNG', optimize=True)
            print(f"✓ Resized: {image_path.name} ({width}x{height} → {output_size[0]}x{output_size[1]})")
            return True
    except Exception as e:
        print(f"✗ Error resizing {image_path.name}: {e}")
        return False

def resize_all_images_in_folder(folder_path):
    """Recursively resize all PNG images in a folder"""
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"Folder not found: {folder}")
        return
    
    png_files = list(folder.rglob("*.png"))
    
    if not png_files:
        print(f"No PNG files found in {folder}")
        return
    
    print(f"\nFound {len(png_files)} PNG files to resize")
    print("Resizing to 200x200...")
    print("-" * 50)
    
    success_count = 0
    skipped_count = 0
    for png_file in png_files:
        result = resize_image(png_file)
        if result is True:
            success_count += 1
        elif result is None:
            skipped_count += 1
    
    print("-" * 50)
    print(f"\nCompleted: {success_count} resized, {skipped_count} skipped, {len(png_files) - success_count - skipped_count} errors")

if __name__ == "__main__":
    icons_folder = Path(__file__).parent / "src" / "assets" / "Icons"
    resize_all_images_in_folder(icons_folder)
