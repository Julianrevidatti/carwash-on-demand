import os
import glob
import re

src_dir = 'C:/Users/54112/Desktop/GestionPro/StockPro/src'
files = glob.glob(src_dir + '/**/*.tsx', recursive=True)

grays = ['#475569', '#64748b', '#94a3b8', '#0f172a', '#1e293b']

def replace_fill(match):
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
    
    new_content = re.sub(r'(fill\s*=\s*[\'"])(#[0-9a-fA-F]{6})([\'"])', replace_fill, content)
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
        
print(f'Done! Updated {count} files for SVG fill colors.')
