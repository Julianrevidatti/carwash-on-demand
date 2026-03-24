import os
import glob
import re

src_dir = 'C:/Users/54112/Desktop/GestionPro/StockPro/src'
files = glob.glob(src_dir + '/**/*.tsx', recursive=True)
files.extend(glob.glob(src_dir + '/**/*.ts', recursive=True))

# We want to replace color: '#...' with color: '#000000' for slate/gray colors.
grays = ['#0f172a', '#1e293b', '#475569', '#64748b', '#334155']

def replace_color(match):
    prefix = match.group(1)
    hex_color = match.group(2).lower()
    suffix = match.group(3)
    if hex_color in grays:
        return f"{prefix}#000000{suffix}"
    return match.group(0)

count = 0
for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Matches 'color': '#...' or color: "#..." or color="#..."
    # We use a regex that catches the property "color" and the hex code.
    # Group 1: anything before the hex
    # Group 2: the hex code itself
    # Group 3: the closing quote
    new_content = re.sub(r'(color\s*:\s*[\'"]|color\s*=\s*[\'"])(#[0-9a-fA-F]{6})([\'"])', replace_color, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        
print(f'Done! Updated {count} files with pure black text.')
