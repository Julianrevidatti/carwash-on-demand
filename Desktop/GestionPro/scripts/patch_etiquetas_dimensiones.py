import os

COMPONENT_PATH = "components/PriceTagsCreator.tsx"

with open(COMPONENT_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Replace grid CSS to flex for exact sizing
old_grid = """.print-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 5mm; 
                width: 100%;
              }"""
new_grid = """.print-grid { 
                display: flex; 
                flex-wrap: wrap;
                gap: 5mm; 
                width: 100%;
              }"""

# Replace price-tag CSS to EXACT 70x40mm
old_tag = """.price-tag { 
                border: 2px solid #000; 
                padding: 10px; 
                height: 35mm; 
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                align-items: center; 
                text-align: center;
                page-break-inside: avoid;
                border-radius: 6px;
              }"""
new_tag = """.price-tag { 
                border: 2px solid #000; 
                padding: 10px; 
                width: 70mm;
                height: 40mm; 
                box-sizing: border-box;
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                align-items: center; 
                text-align: center;
                page-break-inside: avoid;
                border-radius: 6px;
                overflow: hidden;
              }"""

if old_grid in content or old_tag in content:
    content = content.replace(old_grid, new_grid)
    content = content.replace(old_tag, new_tag)
    
    with open(COMPONENT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched PriceTagsCreator.tsx with 70x40mm dimensions successfully.")
else:
    print("CSS classes not found. File might be changed or already patched.")
