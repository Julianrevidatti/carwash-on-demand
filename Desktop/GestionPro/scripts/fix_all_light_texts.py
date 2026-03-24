import os
import re

def fix_all_text_colors(directory):
    # Regex para encontrar color: '#ffffff', color: '#f8fafc', etc.
    # Cubre variables como color, background, y hex.
    color_pattern = re.compile(r"(color|fill|stroke):\s*['\"]#(ffffff|f8fafc|fff|e2e8f0|cbd5e1)['\"]", re.IGNORECASE)
    
    modified_files = 0
    total_files = 0

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                total_files += 1
                filepath = os.path.join(root, file)
                
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Reemplazar todos esos colores claros por #000000
                new_content, num_subs = color_pattern.subn(r"\1: '#000000'", content)
                
                # Tambien vamos a arreglar border: '1px solid #ffffff'
                border_pattern = re.compile(r"border:\s*['\"](.*?)#(ffffff|f8fafc|fff)['\"]", re.IGNORECASE)
                new_content, num_subs_border = border_pattern.subn(r"border: '\1#000000'", new_content)

                if num_subs > 0 or num_subs_border > 0:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    modified_files += 1
                    print(f"Updated: {file} ({num_subs} colors, {num_subs_border} borders)")

    print(f"\nDone! Scanned {total_files} files.")
    print(f"Updated {modified_files} files with pure black text and borders.")

if __name__ == "__main__":
    src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'StockPro', 'src')
    fix_all_text_colors(src_dir)
