import os
import re

COMPONENT_PATH = "components/PriceTagsCreator.tsx"

with open(COMPONENT_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# We need to replace the entire <style> block inside the print section
# Let's use regex to replace from <style> to </style>
style_pattern = re.compile(r"<style>.*?</style>", re.DOTALL)

new_style = """<style>
          {`
            @media print {
              @page { margin: 0; size: A4 portrait; }
              body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              
              .print-grid { 
                display: flex; 
                flex-wrap: wrap; 
                gap: 0; 
                width: 210mm; 
                margin: 0 auto;
                align-content: flex-start;
              }
              
              .price-tag { 
                /* Borde sutil discontinuo para ayudar a recortar si no es papel precortado */
                border: 1px dashed #ccc; 
                padding: 4mm;
                width: 70mm;
                height: 40mm; 
                box-sizing: border-box;
                display: flex; 
                flex-direction: column; 
                justify-content: space-between; 
                align-items: center; 
                text-align: center;
                page-break-inside: avoid;
                overflow: hidden;
                background: white;
              }
              
              .tag-title { 
                font-size: 13px; 
                font-weight: bold; 
                line-height: 1.1; 
                overflow: hidden; 
                max-height: 28px; 
                margin: 0; 
                text-transform: uppercase;
                width: 100%;
              }
              
              .tag-price-box { 
                padding: 2px 10px; 
                background: #000; 
                color: #fff; 
                border-radius: 4px; 
                border: 1px solid #000; 
                width: 85%; 
                margin-top: auto;
              }
              
              .tag-price { 
                font-size: 22px; 
                font-weight: 900; 
                margin: 0; 
              }
              
              .tag-code { 
                font-size: 10px; 
                margin: 2px 0 0 0; 
                font-family: monospace; 
                color: #333;
              }
            }
          `}
        </style>"""

if style_pattern.search(content):
    content = style_pattern.sub(new_style, content)
    with open(COMPONENT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Patched PriceTagsCreator.tsx to maximize A4 page usages with 70x40 grids.")
else:
    print("Could not find <style> block to replace.")
