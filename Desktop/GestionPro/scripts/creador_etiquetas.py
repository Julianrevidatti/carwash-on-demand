import os
import re

APP_TSX_PATH = "App.tsx"
SIDEBAR_TSX_PATH = "components/Sidebar.tsx"
COMPONENT_PATH = "components/PriceTagsCreator.tsx"

# 1. Write the component
component_code = """import React, { useState, useRef } from 'react';
import { Search, Printer, Tag, X } from 'lucide-react';
import { Product } from '../types';

interface PriceTagsCreatorProps {
  products: Product[];
}

export const PriceTagsCreator: React.FC<PriceTagsCreatorProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<(Product & { printQuantity: number })[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleAdd = (product: Product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id ? { ...p, printQuantity: p.printQuantity + 1 } : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, printQuantity: 1 }]);
    }
  };

  const handleRemove = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleQuantityChange = (id: string, qty: number) => {
    if (qty < 1) return;
    setSelectedProducts(selectedProducts.map(p => 
      p.id === id ? { ...p, printQuantity: qty } : p
    ));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalTags = selectedProducts.reduce((sum, p) => sum + p.printQuantity, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="print:hidden p-6 flex flex-col h-full max-w-7xl mx-auto w-full gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Tag className="text-blue-600" /> Creador de Etiquetas
            </h2>
            <p className="text-slate-500 text-sm mt-1">Selecciona productos para generar etiquetas A4 imprimibles.</p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={selectedProducts.length === 0}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all"
          >
            <Printer size={20} /> Imprimir ({totalTags})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* Listado Principal */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredProducts.slice(0, 100).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl cursor-pointer border-b border-slate-50" onClick={() => handleAdd(product)}>
                  <div>
                    <p className="font-bold text-slate-700 text-sm">{product.name}</p>
                    <p className="text-xs text-slate-400">{product.barcode || 'Sin código'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">${product.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seleccionados */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm">A imprimir</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {selectedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  Sin selección
                </div>
              ) : (
                selectedProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <p className="font-bold text-slate-700 text-sm">{product.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        min="1" 
                        value={product.printQuantity}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                        className="w-16 p-1.5 text-center border border-slate-200 rounded-lg text-sm bg-white"
                      />
                      <button onClick={() => handleRemove(product.id)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zona CSS Impression */}
      <div 
        ref={printRef}
        className="hidden print:block print:w-full bg-white text-black"
      >
        <style>
          {`
            @media print {
              @page { margin: 10mm; size: auto; }
              body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              .print-grid { 
                display: grid; 
                grid-template-columns: repeat(4, 1fr); 
                gap: 5mm; 
                width: 100%;
              }
              .price-tag { 
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
              }
              .tag-title { font-size: 11px; font-weight: bold; line-height: 1.2; overflow: hidden; max-height: 26px; margin: 0; text-transform: uppercase; }
              .tag-price-box { padding: 4px 10px; background: #000; color: #fff; border-radius: 4px; border: 1px solid #000; }
              .tag-price { font-size: 20px; font-weight: 900; margin: 0; }
              .tag-code { font-size: 9px; margin: 0; font-family: monospace; }
            }
          `}
        </style>
        <div className="print-grid">
          {selectedProducts.flatMap(p => 
            Array.from({ length: p.printQuantity }).map((_, i) => (
              <div key={`${p.id}-${i}`} className="price-tag">
                <p className="tag-title">{p.name}</p>
                <div className="tag-price-box">
                  <p className="tag-price">${p.price.toLocaleString()}</p>
                </div>
                {p.barcode && <p className="tag-code">{p.barcode}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
"""

os.makedirs(os.path.dirname(COMPONENT_PATH), exist_ok=True)
with open(COMPONENT_PATH, "w", encoding="utf-8") as f:
    f.write(component_code)
print("Created/Updated PriceTagsCreator.tsx")

# 2. Patch Sidebar.tsx
with open(SIDEBAR_TSX_PATH, "r", encoding="utf-8") as f:
    sidebar_content = f.read()

if "activeTab === 'price_tags'" not in sidebar_content:
    search_str = "<NavBtn icon={<Package />} label=\"Inventario\" active={activeTab === 'inventory'} onClick={() => onNavigate('inventory')} />"
    replace_str = search_str + "\n            <NavBtn icon={<Tag />} label=\"Etiquetas\" active={activeTab === 'price_tags'} onClick={() => onNavigate('price_tags')} />"
    
    sidebar_content = sidebar_content.replace(search_str, replace_str)
    with open(SIDEBAR_TSX_PATH, "w", encoding="utf-8") as f:
        f.write(sidebar_content)
    print("Patched Sidebar.tsx")
else:
    print("Sidebar.tsx already patched")

# 3. Patch App.tsx
with open(APP_TSX_PATH, "r", encoding="utf-8") as f:
    app_content = f.read()

if "const PriceTagsCreator =" not in app_content:
    # Insert lazy import
    import_search = "const Tutorials = lazy(() => import('./components/Tutorials').then(m => ({ default: m.Tutorials })));"
    import_replace = import_search + "\nconst PriceTagsCreator = lazy(() => import('./components/PriceTagsCreator').then(m => ({ default: m.PriceTagsCreator })));"
    app_content = app_content.replace(import_search, import_replace)

    # Insert Route
    route_search = "case 'inventory':"
    route_replace = "case 'price_tags':\n        if (!hasPermission(PERMISSIONS.INVENTORY_MANAGE)) return <AccessDenied />;\n        return <PriceTagsCreator products={products} />;\n\n      " + route_search
    app_content = app_content.replace(route_search, route_replace)
    
    with open(APP_TSX_PATH, "w", encoding="utf-8") as f:
        f.write(app_content)
    print("Patched App.tsx")
else:
    print("App.tsx already patched")
