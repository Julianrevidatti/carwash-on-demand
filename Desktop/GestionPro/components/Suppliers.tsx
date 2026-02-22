import React, { useState } from 'react';
import { Supplier, Product, InventoryBatch } from '../types';
import { getTotalStock } from '../services/inventoryService';
import { Truck, Plus, Phone, Calendar, TrendingUp, X, Save, AlertTriangle, Eye, Package, Pencil, Trash2, ArrowRightLeft } from 'lucide-react';

interface SuppliersProps {
   suppliers: Supplier[];
   products: Product[];
   batches: InventoryBatch[];
   onAddSupplier: (supplier: Supplier) => void;
   onUpdateSupplier: (supplier: Supplier) => void;
   onDeleteSupplier: (supplierId: string) => void;
   onTransferProducts: (fromId: string, toId: string) => void;
   onMassUpdate: (supplierId: string, percent: number) => void;
}

export const Suppliers: React.FC<SuppliersProps> = ({ suppliers, products, batches, onAddSupplier, onUpdateSupplier, onDeleteSupplier, onTransferProducts, onMassUpdate }) => {
   const [showAddModal, setShowAddModal] = useState(false);
   const [showUpdateModal, setShowUpdateModal] = useState(false);
   const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
   const [showTransferModal, setShowTransferModal] = useState(false);
   const [targetSupplierId, setTargetSupplierId] = useState('');

   // View Products Modal State
   const [viewingProductsSupplier, setViewingProductsSupplier] = useState<Supplier | null>(null);

   // New/Edit Supplier State
   const [editingId, setEditingId] = useState<string | null>(null);
   const [newName, setNewName] = useState('');
   const [newContact, setNewContact] = useState('');
   const [newFreq, setNewFreq] = useState('');

   // Mass Update State
   const [updatePercent, setUpdatePercent] = useState('');

   const handleOpenCreate = () => {
      setEditingId(null);
      setNewName('');
      setNewContact('');
      setNewFreq('');
      setShowAddModal(true);
   };

   const handleOpenEdit = (supplier: Supplier) => {
      setEditingId(supplier.id);
      setNewName(supplier.name);
      setNewContact(supplier.contactInfo || '');
      setNewFreq(supplier.visitFrequency || '');
      setShowAddModal(true);
   };

   const handleSaveSupplier = () => {
      if (!newName) return;

      if (editingId) {
         // Edit Mode
         const updatedSupplier: Supplier = {
            id: editingId,
            name: newName,
            contactInfo: newContact,
            visitFrequency: newFreq
         };
         onUpdateSupplier(updatedSupplier);
      } else {
         // Create Mode
         const newSupplier: Supplier = {
            id: crypto.randomUUID(),
            name: newName,
            contactInfo: newContact,
            visitFrequency: newFreq
         };
         onAddSupplier(newSupplier);
      }

      setNewName('');
      setNewContact('');
      setNewFreq('');
      setEditingId(null);
      setShowAddModal(false);
   };

   const openMassUpdate = (supplier: Supplier) => {
      setSelectedSupplier(supplier);
      setUpdatePercent('');
      setShowUpdateModal(true);
   };

   const handleApplyUpdate = () => {
      if (!selectedSupplier || !updatePercent) return;
      const percent = parseFloat(updatePercent);
      if (isNaN(percent)) return;

      onMassUpdate(selectedSupplier.id, percent);
      alert(`Se actualizaron los precios de ${selectedSupplier.name} un ${percent}% exitosamente.`);
      setShowUpdateModal(false);
      setSelectedSupplier(null);
   };

   // Helper to count products per supplier
   const getProductCount = (supplierId: string) => (products || []).filter(p => p.supplierId === supplierId).length;

   return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
               <Truck className="w-6 h-6 text-blue-600" /> Gestión de Proveedores
            </h2>
            <button
               onClick={handleOpenCreate}
               className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
               <Plus className="w-4 h-4" /> Nuevo Proveedor
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map(supplier => {
               const productCount = getProductCount(supplier.id);
               return (
                  <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all flex flex-col group">
                     <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                           <div className="bg-blue-50 p-3 rounded-lg">
                              <Truck className="w-6 h-6 text-blue-600" />
                           </div>
                           <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                              {productCount} prod.
                           </span>
                        </div>

                        <div className="flex items-center gap-1">
                           <button
                              onClick={() => {
                                 const count = getProductCount(supplier.id);
                                 if (count > 0) {
                                    alert(`No se puede eliminar ${supplier.name} porque tiene ${count} productos asociados.`);
                                    return;
                                 }
                                 if (confirm(`¿Seguro que desea eliminar al proveedor ${supplier.name}?`)) {
                                    onDeleteSupplier(supplier.id);
                                 }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar Proveedor"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                           <button
                              onClick={() => {
                                 setSelectedSupplier(supplier);
                                 setTargetSupplierId('');
                                 setShowTransferModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Transferir Productos"
                           >
                              <ArrowRightLeft className="w-4 h-4" />
                           </button>
                           <button
                              onClick={() => handleOpenEdit(supplier)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar Proveedor"
                           >
                              <Pencil className="w-4 h-4" />
                           </button>
                        </div>
                     </div>


                     <h3 className="text-lg font-bold text-gray-800 mb-2">{supplier.name}</h3>

                     <div className="space-y-2 mb-6 flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Phone className="w-4 h-4" />
                           <span>{supplier.contactInfo || 'Sin contacto'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                           <Calendar className="w-4 h-4" />
                           <span>Visita: {supplier.visitFrequency || 'A demanda'}</span>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <button
                           onClick={() => setViewingProductsSupplier(supplier)}
                           disabled={productCount === 0}
                           className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors border ${productCount === 0
                              ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                              }`}
                        >
                           <Eye className="w-4 h-4" /> Ver Productos
                        </button>

                        <button
                           onClick={() => openMassUpdate(supplier)}
                           disabled={productCount === 0}
                           className={`w-full py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors border ${productCount === 0
                              ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                              : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700'
                              }`}
                        >
                           <TrendingUp className="w-4 h-4" /> Actualizar Precios
                        </button>
                     </div>
                  </div>
               );
            })}
         </div >

         {/* --- ADD/EDIT SUPPLIER MODAL --- */}
         {
            showAddModal && (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Proveedor' : 'Registrar Proveedor'}</h3>
                        <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                     </div>
                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Empresa</label>
                           <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" placeholder="Ej: Distribuidora Oeste" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono / Contacto</label>
                           <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" placeholder="Ej: 11-1234-5678" value={newContact} onChange={e => setNewContact(e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Frecuencia de Visita</label>
                           <input className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900" placeholder="Ej: Lunes y Jueves" value={newFreq} onChange={e => setNewFreq(e.target.value)} />
                        </div>
                        <button onClick={handleSaveSupplier} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-2 hover:bg-blue-700">
                           {editingId ? 'Guardar Cambios' : 'Registrar Proveedor'}
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         {/* --- TRANSFER MODAL --- */}
         {
            showTransferModal && selectedSupplier && (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                           <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Transferir Productos
                        </h3>
                        <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                     </div>

                     <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-blue-800">
                           Estás por mover <b>{getProductCount(selectedSupplier.id)} productos</b> de <span className="font-bold">{selectedSupplier.name}</span> hacia otro proveedor.
                        </p>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor Destino</label>
                           <select
                              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                              value={targetSupplierId}
                              onChange={e => setTargetSupplierId(e.target.value)}
                           >
                              <option value="">Seleccione un proveedor...</option>
                              {(suppliers || []).filter(s => s.id !== selectedSupplier.id).map(s => (
                                 <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                           </select>
                        </div>

                        <button
                           onClick={() => {
                              if (!targetSupplierId) {
                                 alert('Seleccione un proveedor destino');
                                 return;
                              }
                              if (confirm(`¿Mover TODOS los productos de ${selectedSupplier.name} al nuevo proveedor?`)) {
                                 onTransferProducts(selectedSupplier.id, targetSupplierId);
                                 setShowTransferModal(false);
                              }
                           }}
                           className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-2 hover:bg-indigo-700"
                        >
                           Confirmar Transferencia
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         {/* --- MASS UPDATE MODAL --- */}
         {
            showUpdateModal && selectedSupplier && (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl border-t-4 border-indigo-500">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                           <TrendingUp className="w-5 h-5 text-indigo-600" /> Aumento Masivo
                        </h3>
                        <button onClick={() => setShowUpdateModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                     </div>

                     <div className="bg-indigo-50 p-4 rounded-lg mb-4">
                        <p className="text-sm text-indigo-800">
                           Estás por aumentar los precios de <b>{getProductCount(selectedSupplier.id)} productos</b> de <span className="font-bold">{selectedSupplier.name}</span>.
                        </p>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Porcentaje de Aumento (%)</label>
                           <div className="relative">
                              <input
                                 type="number"
                                 className="w-full border-2 border-indigo-100 p-3 pl-4 rounded-xl text-xl font-bold focus:border-indigo-500 outline-none bg-white text-gray-900"
                                 placeholder="10"
                                 autoFocus
                                 value={updatePercent}
                                 onChange={e => setUpdatePercent(e.target.value)}
                              />
                              <span className="absolute right-4 top-3.5 text-gray-400 font-bold">%</span>
                           </div>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                           <AlertTriangle className="w-4 h-4 shrink-0" />
                           <p>Esta acción actualizará el Precio de Venta manteniendo el margen de ganancia actual, basado en el nuevo costo calculado.</p>
                        </div>

                        <button onClick={handleApplyUpdate} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold mt-2 hover:bg-indigo-700 flex items-center justify-center gap-2">
                           <Save className="w-4 h-4" /> Aplicar Aumento
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         {/* --- VIEW PRODUCTS MODAL --- */}
         {
            viewingProductsSupplier && (
               <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                     <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <div>
                           <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              <Package className="w-5 h-5 text-blue-600" /> Productos Asociados
                           </h3>
                           <p className="text-sm text-gray-500">Proveedor: {viewingProductsSupplier.name}</p>
                        </div>
                        <button onClick={() => setViewingProductsSupplier(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                     </div>

                     <div className="overflow-y-auto p-6">
                        <table className="w-full text-sm text-left">
                           <thead className="bg-gray-50 text-gray-600 sticky top-0">
                              <tr>
                                 <th className="p-3">Producto</th>
                                 <th className="p-3">SKU</th>
                                 <th className="p-3">Costo</th>
                                 <th className="p-3">Precio</th>
                                 <th className="p-3 text-center">Stock Actual</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-100">
                              {(products || [])
                                 .filter(p => p.supplierId === viewingProductsSupplier.id)
                                 .map(p => {
                                    const stock = getTotalStock(batches, p.id);
                                    const isLow = stock < 5;
                                    return (
                                       <tr key={p.id} className="hover:bg-gray-50">
                                          <td className="p-3 font-medium text-gray-900">{p.name}</td>
                                          <td className="p-3 font-mono text-gray-500">{p.barcode}</td>
                                          <td className="p-3 text-gray-500">${p.cost}</td>
                                          <td className="p-3 font-bold text-gray-800">${p.price}</td>
                                          <td className="p-3 text-center">
                                             <span className={`px-2 py-1 rounded text-xs font-bold border ${isLow ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                                                {stock} un.
                                             </span>
                                          </td>
                                       </tr>
                                    );
                                 })
                              }
                              {(products || []).filter(p => p.supplierId === viewingProductsSupplier.id).length === 0 && (
                                 <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-400">
                                       No hay productos asociados a este proveedor.
                                    </td>
                                 </tr>
                              )}
                           </tbody>
                        </table>
                     </div>

                     <div className="p-4 border-t border-gray-100 bg-gray-50 text-right rounded-b-xl shrink-0">
                        <button
                           onClick={() => setViewingProductsSupplier(null)}
                           className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold hover:bg-gray-300 transition-colors"
                        >
                           Cerrar
                        </button>
                     </div>
                  </div>
               </div>
            )
         }
      </div >
   );
};
