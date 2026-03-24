import os
import re

APP_TSX_PATH = "App.tsx"
COMPONENT_PATH = "components/PriceTagsCreator.tsx"

# 1. Update PriceTagsCreator.tsx
component_code = """import React, { useState, useRef, useMemo } from 'react';
import { Search, Printer, Tag, X, CheckSquare, Filter } from 'lucide-react';
import { Product, Supplier } from '../types';

interface PriceTagsCreatorProps {
  products: Product[];
  suppliers: Supplier[];
}

export const PriceTagsCreator: React.FC<PriceTagsCreatorProps> = ({ products, suppliers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<(Product & { printQuantity: number })[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.barcode && p.barcode.includes(searchTerm));
      const matchSupplier = selectedSupplier === 'all' || p.supplierId === selectedSupplier;
      return matchSearch && matchSupplier;
    });
  }, [products, searchTerm, selectedSupplier]);

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

  const handleSelectAll = () => {
    const toAdd = filteredProducts.filter(fp => !selectedProducts.some(sp => sp.id === fp.id));
    const newProducts = toAdd.map(p => ({ ...p, printQuantity: 1 }));
    setSelectedProducts([...selectedProducts, ...newProducts]);
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
          {/* Panel Izquierdo: Buscador y Filtro */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input 
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </div>
                <div className="relative w-48">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none cursor-pointer"
                  >
                    <option value="all">Todos los Proveedores</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-slate-500 font-medium">Mostrando {filteredProducts.length} productos</span>
                <button 
                  onClick={handleSelectAll}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <CheckSquare size={14} />
                  Seleccionar Todo
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
              {filteredProducts.slice(0, 100).map(product => {
                const isSelected = selectedProducts.some(sp => sp.id === product.id);
                return (
                  <div 
                    key={product.id} 
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border-b last:border-0 transition-colors ${isSelected ? 'bg-blue-50 border-blue-100' : 'hover:bg-slate-50 border-slate-50'}`} 
                    onClick={() => handleAdd(product)}
                  >
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{product.name}</p>
                      <p className="text-xs text-slate-400">{product.barcode || 'Sin código'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">${product.price.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length > 100 && (
                <p className="text-center text-xs text-slate-400 py-3">
                  Mostrando los primeros 100 resultados. Usa la búsqueda para refinar.
                </p>
              )}
            </div>
          </div>

          {/* Panel Derecho: A Imprimir */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700 text-sm">A imprimir</h3>
              {selectedProducts.length > 0 && (
                <button 
                  onClick={() => setSelectedProducts([])}
                  className="text-xs text-red-500 hover:text-red-600 hover:underline"
                >
                  Vaciar lista
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
              {selectedProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                  Sin selección
                </div>
              ) : (
                selectedProducts.map(product => (
                  <div key={product.id} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex-1">
                      <p className="font-bold text-slate-700 text-sm line-clamp-2 leading-tight">{product.name}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          value={product.printQuantity}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                          className="w-14 p-1.5 text-center border border-slate-200 rounded-lg text-sm bg-white font-bold"
                        />
                        <button onClick={() => handleRemove(product.id)} className="text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ZONA DE IMPRESIÓN */}
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
              .tag-price-box { padding: 4px 10px; background: #000; color: #fff; border-radius: 4px; border: 1px solid #000; width: 80%; }
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
print("Updated PriceTagsCreator.tsx to V2")

# 2. Patch App.tsx to pass suppliers prop
with open(APP_TSX_PATH, "r", encoding="utf-8") as f:
    app_content = f.read()

search_prop = "<PriceTagsCreator products={products} />"
replace_prop = "<PriceTagsCreator products={products} suppliers={suppliers} />"

if search_prop in app_content:
    app_content = app_content.replace(search_prop, replace_prop)
    with open(APP_TSX_PATH, "w", encoding="utf-8") as f:
        f.write(app_content)
    print("Patched App.tsx to pass suppliers array")
else:
    print("App.tsx already patched or PriceTagsCreator not found with products={products} alone.")
