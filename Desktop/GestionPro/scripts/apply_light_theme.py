import os
import glob

replacements = {
    '#0f172a': '#f8fafc',
    '#1e293b': '#ffffff',
    '#334155': '#e2e8f0',
    '#f1f5f9': '#0f172a',
    '#e2e8f0': '#1e293b',
    '#94a3b8': '#64748b',
    '#64748b': '#475569',
    'rgba(15, 23, 42,': 'rgba(248, 250, 252,',
    'rgba(15,23,42,': 'rgba(248,250,252,',
    'rgba(30, 41, 59,': 'rgba(255, 255, 255,',
    'rgba(30,41,59,': 'rgba(255,255,255,',
    'rgba(51, 65, 85,': 'rgba(226, 232, 240,',
    'rgba(51,65,85,': 'rgba(226,232,240,'
}

src_dir = 'C:/Users/54112/Desktop/GestionPro/StockPro/src'
files = glob.glob(src_dir + '/**/*.tsx', recursive=True)
files.extend(glob.glob(src_dir + '/**/*.ts', recursive=True))
files.extend(glob.glob(src_dir + '/**/*.css', recursive=True))

count = 0
for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        new_content = new_content.replace(old, new)
        
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        count += 1
print(f'Done! Updated {count} files.')
