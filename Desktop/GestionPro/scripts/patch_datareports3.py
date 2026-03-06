"""
Patch DataReports.tsx: Remove the per-supplier summary boxes from the
header bar (lines 532-569) and replace with just the simple Total bar.
Keep the sidebar summary boxes intact.
"""

filepath = r'c:\Users\54112\Desktop\GestionPro\components\DataReports.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 532-569 (0-indexed 531-568) with a simple header
simple_header = [
    '                   <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">\n',
    '                      <span className="font-bold text-gray-700">{filteredSales.length} Operaciones</span>\n',
    '                      <span className="font-black text-xl text-blue-600">Total: ${filteredSales.reduce((acc, s) => acc + s.total, 0).toLocaleString()}</span>\n',
    '                   </div>\n',
]

new_lines = lines[:531] + simple_header + lines[569:]

with open(filepath, 'w', encoding='utf-8', newline='') as f:
    f.writelines(new_lines)

print(f"Done! Old: {len(lines)} lines, New: {len(new_lines)} lines")
