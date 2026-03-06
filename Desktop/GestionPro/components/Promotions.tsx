import React, { useState } from 'react';
import { Product, Promotion, Sale, InventoryBatch, BulkProduct } from '../types';
import { Plus, Trash2, Tag, Save, X, ShoppingBag, Search, CheckSquare, Square, Scale, Pencil, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../src/lib/supabase';
import { compressImage } from '../src/utils/imageUtils';

interface PromotionsProps {
  promotions: Promotion[];
  products: Product[];
  bulkProducts: BulkProduct[];
  sales: Sale[];
  batches: InventoryBatch[];
  onAddPromotion: (promo: Promotion) => void;
  onUpdatePromotion: (promo: Promotion) => void;
  onDeletePromotion: (id: string) => void;
}

export const Promotions: React.FC<PromotionsProps> = ({ promotions, products, bulkProducts, sales, batches, onAddPromotion, onUpdatePromotion, onDeletePromotion }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);

  // Form State
  const [promoName, setPromoName] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [promoType, setPromoType] = useState<'standard' | 'flexible' | 'weighted'>('standard');
  const [quantityRequired, setQuantityRequired] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [weightedRequirements, setWeightedRequirements] = useState<{ productId: string, minWeight: string }[]>([]);
  const [promoImage, setPromoImage] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = () => {
    if (!promoName || !promoPrice) {
      alert("Complete nombre y precio.");
      return;
    }

    if (promoType === 'flexible') {
      if (!quantityRequired || parseInt(quantityRequired) < 1 || selectedProductIds.length < 1) {
        alert("Para promos flexibles, indique la cantidad requerida y seleccione al menos 1 producto.");
        return;
      }
    } else if (promoType === 'weighted') {
      if (selectedProductIds.length < 1) {
        alert("Seleccione al menos 1 producto para la promo pesable.");
        return;
      }
      // Validate all weights are filled
      const incomplete = selectedProductIds.some(pid => {
        const req = weightedRequirements.find(r => r.productId === pid);
        return !req || !req.minWeight || parseFloat(req.minWeight) <= 0;
      });
      if (incomplete) {
        alert("Complete todos los pesos requeridos para los productos seleccionados.");
        return;
      }
    } else {
      if (selectedProductIds.length < 2) {
        alert("Para promos fijas, seleccione al menos 2 productos.");
        return;
      }
    }

    const newPromo: Promotion = {
      id: editingPromoId || crypto.randomUUID(),
      name: promoName,
      promoPrice: parseFloat(promoPrice),
      triggerProductIds: selectedProductIds,
      active: true,
      type: promoType,
      quantityRequired: promoType === 'flexible' ? parseInt(quantityRequired) : undefined,
      requirements: promoType === 'weighted' ? weightedRequirements.map(r => ({ productId: r.productId, minWeight: parseFloat(r.minWeight) })) : undefined,
      imageUrl: promoImage
    };

    if (editingPromoId) {
      onUpdatePromotion(newPromo);
    } else {
      onAddPromotion(newPromo);
    }
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      toast.info("Subiendo imagen...");

      // Compress
      const compressedBlob = await compressImage(file);
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });

      // Upload
      const fileExt = 'webp';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      // Get URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setPromoImage(data.publicUrl);
      toast.success("Imagen subida con éxito");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Error al subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromoId(promo.id);
    setPromoName(promo.name);
    setPromoPrice(promo.promoPrice.toString());
    setPromoType(promo.type || 'standard');
    setSelectedProductIds(promo.triggerProductIds);
    setQuantityRequired(promo.quantityRequired ? promo.quantityRequired.toString() : '');
    setWeightedRequirements(promo.requirements ? promo.requirements.map(r => ({ productId: r.productId, minWeight: r.minWeight.toString() })) : []);
    setPromoImage(promo.imageUrl);

    setShowForm(true);
  };

  const resetForm = () => {
    setPromoName('');
    setPromoPrice('');
    setProductSearch('');
    setSelectedProductIds([]);
    setPromoType('standard');
    setQuantityRequired('');
    setWeightedRequirements([]);
    setPromoImage(undefined);
    setEditingPromoId(null);
    setShowForm(false);
  };

  const toggleProductSelection = (id: string, isBulk: boolean = false) => {
    if (promoType === 'flexible' || promoType === 'weighted') {
      if (selectedProductIds.includes(id)) {
        setSelectedProductIds(prev => prev.filter(pid => pid !== id));
        if (promoType === 'weighted') {
          setWeightedRequirements(prev => prev.filter(r => r.productId !== id));
        }
      } else {
        setSelectedProductIds(prev => [...prev, id]);
        if (promoType === 'weighted') {
          setWeightedRequirements(prev => [...prev, { productId: id, minWeight: '' }]);
        }
      }
    } else {
      // For standard, we add logic via the +/- buttons in the UI loop, but this helper is for the checkbox style toggles
    }
  };

  // Filter products for search based on Promo Type
  const filteredProducts = promoType === 'weighted'
    ? (bulkProducts || []).filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
    : (products || []).filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch)
    );

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="w-6 h-6 text-pink-600" /> Promociones & Combos
          </h2>
          <p className="text-gray-500 text-sm">Configure reglas automáticas (Fijas o Mix & Match).</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200"
          >
            <Plus className="w-4 h-4" /> Crear Promo
          </button>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map(promo => (
          <div key={promo.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-pink-100 p-2 rounded-lg text-pink-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                {promo.type === 'flexible' ? (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full border border-purple-200">
                    MIX & MATCH
                  </span>
                ) : promo.type === 'weighted' ? (
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200">
                    COMBO PESABLE
                  </span>
                ) : (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full border border-blue-200">
                    COMBO FIJO
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(promo)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => onDeletePromotion(promo.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-1">{promo.name}</h3>

            <div className="my-4 space-y-2">
              {promo.type === 'flexible' ? (
                <div className="text-sm text-gray-600">
                  <p className="font-bold mb-1">Llevando {promo.quantityRequired} de:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    {promo.triggerProductIds.slice(0, 3).map(pid => {
                      const p = products.find(prod => prod.id === pid);
                      return <li key={pid}>{p?.name || '???'}</li>
                    })}
                    {promo.triggerProductIds.length > 3 && <li>... y {promo.triggerProductIds.length - 3} más</li>}
                  </ul>
                </div>
              ) : promo.type === 'weighted' ? (
                <div className="text-sm text-gray-600">
                  <ul className="space-y-1">
                    {promo.requirements?.map((req, idx) => {
                      const p = products.find(prod => prod.id === req.productId) || bulkProducts.find(prod => prod.id === req.productId);
                      return (
                        <li key={idx} className="flex items-center gap-2">
                          <Scale className="w-3 h-3 text-purple-600" />
                          <span>{req.minWeight}kg de {p?.name || 'Producto'}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ) : (
                promo.triggerProductIds.map((pid, idx) => {
                  const p = products.find(prod => prod.id === pid);
                  return (
                    <div key={`${pid}-${idx}`} className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      {p?.name || 'Producto Eliminado'}
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-xs text-gray-400 uppercase font-bold">Precio Final</span>
              <div className="text-right">
                {(() => {
                  let originalPrice = 0;
                  if (promo.type === 'flexible' && promo.quantityRequired) {
                    const pool = promo.triggerProductIds.map(pid => products.find(p => p.id === pid)?.price || 0);
                    const avgPrice = pool.reduce((a, b) => a + b, 0) / (pool.length || 1);
                    originalPrice = avgPrice * promo.quantityRequired;
                  } else {
                    originalPrice = promo.triggerProductIds.reduce((sum, pid) => {
                      const p = products.find(prod => prod.id === pid);
                      return sum + (p?.price || 0);
                    }, 0);
                  }

                  if (originalPrice > promo.promoPrice) {
                    return (
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 line-through font-bold">${originalPrice.toFixed(0)}</span>
                        <span className="text-2xl font-black text-pink-600">${promo.promoPrice}</span>
                      </div>
                    );
                  }
                  return <span className="text-2xl font-black text-pink-600">${promo.promoPrice}</span>;
                })()}
              </div>
            </div>
          </div>
        ))}

        {promotions.length === 0 && !showForm && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay promociones activas.</p>
          </div>
        )}
      </div>

      {/* CREATE/EDIT FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">{editingPromoId ? 'Editar Promoción' : 'Nueva Promoción'}</h3>
              <button onClick={resetForm}><X className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">

              {/* Type Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => { setPromoType('standard'); setSelectedProductIds([]); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${promoType === 'standard' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Combo Fijo
                </button>
                <button
                  onClick={() => { setPromoType('flexible'); setSelectedProductIds([]); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${promoType === 'flexible' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Mix & Match
                </button>
                <button
                  onClick={() => { setPromoType('weighted'); setSelectedProductIds([]); }}
                  className={`flex-1 py-2 text-xs md:text-sm font-bold rounded-md transition-all ${promoType === 'weighted' ? 'bg-white shadow text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Combos Pesables
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                <input
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                  placeholder={promoType === 'flexible' ? "Ej: 4 Yogures Surtidos" : "Ej: Fernet + Coca"}
                  value={promoName}
                  onChange={e => setPromoName(e.target.value)}
                />
              </div>

              {/* IMAGE UPLOAD */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagen de la Promo (Catálogo Opcional)</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 relative group border-pink-100">
                    {promoImage ? (
                      <>
                        <img src={promoImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all">
                          <button
                            onClick={() => setPromoImage(undefined)}
                            className="text-white hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${isUploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-pink-50 text-pink-600 hover:bg-pink-100 border border-pink-200'}`}>
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      {promoImage ? 'Cambiar Imagen' : 'Subir Imagen'}
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">Recomendado: 1:1 (Cuadrada). Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Product Selection with Search */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  {promoType === 'flexible' ? "Seleccionar Productos (El pool de opciones)" : promoType === 'weighted' ? "Seleccionar Productos a Granel" : "Armar el Combo (Seleccionar componentes)"}
                </label>

                {/* Search Bar */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    className="w-full border pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded-lg bg-gray-50">
                  {filteredProducts.map(p => {
                    const count = selectedProductIds.filter(id => id === p.id).length;
                    const isSelected = count > 0;

                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded border transition-all flex justify-between items-center ${isSelected ? 'bg-pink-50 border-pink-300' : 'bg-white border-gray-200'}`}
                      >
                        <div className="flex-1 truncate mr-2">
                          <span className="text-sm block truncate">{p.name}</span>
                          <span className="text-xs font-bold text-gray-500">
                            {promoType === 'weighted' ? `$${(p as any).pricePerKg}/kg` : `$${(p as any).price}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {promoType === 'flexible' || promoType === 'weighted' ? (
                            // For Flexible/Weighted: Checkbox behavior
                            <button
                              onClick={() => toggleProductSelection(p.id)}
                              className={`w-6 h-6 flex items-center justify-center rounded border ${isSelected ? (promoType === 'weighted' ? 'bg-green-600 border-green-600 text-white' : 'bg-purple-600 border-purple-600 text-white') : 'bg-white border-gray-300 text-gray-300'}`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            </button>
                          ) : (
                            // For Standard: Counter behavior
                            <>
                              {count > 0 && (
                                <>
                                  <button onClick={() => {
                                    const idx = selectedProductIds.indexOf(p.id);
                                    if (idx > -1) {
                                      const newArr = [...selectedProductIds];
                                      newArr.splice(idx, 1);
                                      setSelectedProductIds(newArr);
                                    }
                                  }} className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-red-50 text-red-500 font-bold">-</button>
                                  <span className="font-bold text-pink-700 w-4 text-center">{count}</span>
                                </>
                              )}
                              <button onClick={() => setSelectedProductIds(prev => [...prev, p.id])} className="w-6 h-6 flex items-center justify-center bg-pink-600 text-white rounded hover:bg-pink-700 font-bold">+</button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-right text-gray-400 mt-1">
                  {selectedProductIds.length} {promoType === 'flexible' ? "productos en el pool" : "items en el combo"}
                </p>
              </div>

              {/* Weighted Configuration - Show inputs per selected product */}
              {promoType === 'weighted' && selectedProductIds.length > 0 && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-3">
                  <h4 className="text-xs font-bold text-green-700 uppercase mb-2">Configurar Pesos Mínimos</h4>
                  {selectedProductIds.map(pid => {
                    const p = products.find(prod => prod.id === pid) || bulkProducts.find(prod => prod.id === pid);
                    const req = weightedRequirements.find(r => r.productId === pid);
                    return (
                      <div key={pid} className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                        <span className="text-sm font-medium text-gray-700 line-clamp-1 flex-1">{p?.name}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            className="w-20 border rounded p-1 text-right font-bold outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="0.00"
                            value={req?.minWeight || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              const newVal = isNaN(val) ? '' : val.toString();
                              setWeightedRequirements(prev => prev.map(r => r.productId === pid ? { ...r, minWeight: newVal } : r));
                            }}
                          />
                          <span className="text-xs text-gray-500">Kg</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Flexible Configuration */}
              {promoType === 'flexible' && (
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <label className="block text-xs font-bold text-purple-700 uppercase mb-1">Cantidad para activar promo</label>
                  <input
                    type="number"
                    className="w-full border-2 border-purple-200 p-2 rounded-lg text-lg font-bold text-gray-800 focus:border-purple-500 outline-none"
                    placeholder="Ej: 4"
                    value={quantityRequired}
                    onChange={e => setQuantityRequired(e.target.value)}
                  />
                  <p className="text-xs text-purple-600 mt-1">El cliente debe llevar esta cantidad combinada entre los productos seleccionados.</p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-pink-600 uppercase mb-1">Precio Final de la Promo</label>
                  <input
                    type="number"
                    className="w-full border-2 border-pink-200 p-2 rounded-lg text-xl font-bold text-pink-600 focus:border-pink-500 outline-none"
                    placeholder="0"
                    value={promoPrice}
                    onChange={e => setPromoPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={resetForm} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button
                onClick={handleSave}
                className="bg-pink-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-pink-700 shadow-lg shadow-pink-200 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {editingPromoId ? 'Actualizar' : 'Guardar Promo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};