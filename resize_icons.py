"""
Resize all PNG images in the Icons folder to square dimensions
"""
from PIL import Image
import os
from pathlib import Path

def resize_image(image_path):
    """Make image square using even dimension when one is odd and one is even"""
    try:
        with Image.open(image_path) as img:
            width, height = img.size
            
            width_is_odd = width % 2 == 1
            height_is_odd = height % 2 == 1
            
            # Skip if both dimensions are odd
            if width_is_odd and height_is_odd:
                print(f"⊘ Skipped: {image_path.name} ({width}x{height}) - both dimensions odd")
                return None
            
            # Skip if both dimensions are even
            if not width_is_odd and not height_is_odd:
                print(f"⊘ Skipped: {image_path.name} ({width}x{height}) - both dimensions even")
                return None
            
            # One is odd, one is even - use the even dimension
            if width_is_odd:
                # Width is odd, height is even - use height
                new_size = height
            else:
                # Height is odd, width is even - use width
                new_size = width
            
            # Resize the image using high-quality Lanczos resampling
            img_resized = img.resize((new_size, new_size), Image.Resampling.LANCZOS)
            # Save back to the same file
            img_resized.save(image_path, 'PNG', optimize=True)
            print(f"✓ Resized: {image_path.name} ({width}x{height} → {new_size}x{new_size})")
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
    
    # Get all PNG files but exclude the archive folder
    png_files = [f for f in folder.rglob("*.png") if "archive" not in f.parts]
    
    if not png_files:
        print(f"No PNG files found in {folder}")
        return
    
    print(f"\nFound {len(png_files)} PNG files to resize")
    print("Making images square...")
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
