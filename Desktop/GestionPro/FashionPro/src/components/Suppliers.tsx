import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Supplier } from '../types';
import {
    Truck, Plus, Phone, Calendar, TrendingUp, X, Save,
    AlertTriangle, Eye, Package, Pencil, Trash2, ArrowRightLeft
} from 'lucide-react';
import { toast } from 'sonner';

export const Suppliers: React.FC = () => {
    const suppliers = useStore(s => s.suppliers);
    const products = useStore(s => s.products);
    const batches = useStore(s => s.batches);
    const addSupplier = useStore(s => s.addSupplier);
    const updateSupplier = useStore(s => s.updateSupplier);
    const deleteSupplier = useStore(s => s.deleteSupplier);
    const transferProducts = useStore(s => s.transferProducts);
    const massUpdatePrices = useStore(s => s.massUpdatePrices);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [targetSupplierId, setTargetSupplierId] = useState('');
    const [viewingProducts, setViewingProducts] = useState<Supplier | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newContact, setNewContact] = useState('');
    const [newFreq, setNewFreq] = useState('');
    const [updatePercent, setUpdatePercent] = useState('');

    const getProductCount = (id: string) => products.filter(p => p.supplierId === id).length;
    const getTotalStock = (productId: string) => batches.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);

    const handleSave = () => {
        if (!newName) return;
        if (editingId) {
            updateSupplier({ id: editingId, name: newName, contactInfo: newContact, visitFrequency: newFreq });
            toast.success('Proveedor actualizado');
        } else {
            addSupplier({ id: crypto.randomUUID(), name: newName, contactInfo: newContact, visitFrequency: newFreq });
            toast.success('Proveedor registrado');
        }
        setShowAddModal(false);
        setNewName(''); setNewContact(''); setNewFreq(''); setEditingId(null);
    };

    const handleApplyUpdate = () => {
        if (!selectedSupplier || !updatePercent) return;
        massUpdatePrices(selectedSupplier.id, parseFloat(updatePercent));
        toast.success(`Precios actualizados un ${updatePercent}%`);
        setShowUpdateModal(false);
    };

    const modalOverlay: React.CSSProperties = {
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    };

    const modalBox: React.CSSProperties = {
        background: '#ffffff', borderRadius: '16px', width: '100%',
        maxWidth: '460px', padding: '24px', border: '1px solid #000000'
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', background: '#f8fafc',
        border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '14px'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={22} style={{ color: '#6366f1' }} /> Proveedores
                </h2>
                <button onClick={() => { setEditingId(null); setNewName(''); setNewContact(''); setNewFreq(''); setShowAddModal(true); }}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Nuevo Proveedor
                </button>
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {suppliers.map(supplier => {
                    const count = getProductCount(supplier.id);
                    return (
                        <div key={supplier.id} style={{
                            background: '#ffffff', border: '1px solid #000000', borderRadius: '16px', padding: '20px', transition: 'all 0.2s'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Truck size={20} style={{ color: '#6366f1' }} />
                                    </div>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#000000', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px' }}>
                                        {count} prod.
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '2px' }}>
                                    <button onClick={() => { setEditingId(supplier.id); setNewName(supplier.name); setNewContact(supplier.contactInfo || ''); setNewFreq(supplier.visitFrequency || ''); setShowAddModal(true); }}
                                        style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Editar">
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => { setSelectedSupplier(supplier); setTargetSupplierId(''); setShowTransferModal(true); }}
                                        style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Transferir">
                                        <ArrowRightLeft size={14} />
                                    </button>
                                    <button onClick={() => {
                                        if (count > 0) { toast.error(`No se puede eliminar: tiene ${count} productos`); return; }
                                        if (confirm(`¿Eliminar ${supplier.name}?`)) { deleteSupplier(supplier.id); toast.success('Eliminado'); }
                                    }} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '6px', borderRadius: '6px' }} title="Eliminar">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000', marginBottom: '10px' }}>{supplier.name}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#000000' }}>
                                    <Phone size={12} /> {supplier.contactInfo || 'Sin contacto'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#000000' }}>
                                    <Calendar size={12} /> {supplier.visitFrequency || 'A demanda'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={() => setViewingProducts(supplier)} disabled={count === 0}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #000000', background: count > 0 ? 'rgba(99,102,241,0.05)' : 'transparent', color: count > 0 ? '#818cf8' : '#475569', fontSize: '12px', fontWeight: '500', cursor: count > 0 ? 'pointer' : 'default' }}>
                                    <Eye size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Ver
                                </button>
                                <button onClick={() => { setSelectedSupplier(supplier); setUpdatePercent(''); setShowUpdateModal(true); }} disabled={count === 0}
                                    style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: count > 0 ? '#6366f1' : '#000000', color: count > 0 ? 'white' : '#475569', fontSize: '12px', fontWeight: '600', cursor: count > 0 ? 'pointer' : 'default' }}>
                                    <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Precios
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{editingId ? 'Editar' : 'Nuevo'} Proveedor</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Distribuidora Oeste" style={inputStyle} autoFocus />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Contacto</label>
                                <input value={newContact} onChange={e => setNewContact(e.target.value)} placeholder="11-1234-5678" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Frecuencia Visita</label>
                                <input value={newFreq} onChange={e => setNewFreq(e.target.value)} placeholder="Lunes y Jueves" style={inputStyle} />
                            </div>
                            <button onClick={handleSave} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', marginTop: '4px' }}>
                                {editingId ? 'Guardar Cambios' : 'Registrar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {showTransferModal && selectedSupplier && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>Transferir Productos</h3>
                            <button onClick={() => setShowTransferModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#000000', marginBottom: '16px' }}>
                            Mover <strong style={{ color: '#000000' }}>{getProductCount(selectedSupplier.id)} productos</strong> de <strong style={{ color: '#818cf8' }}>{selectedSupplier.name}</strong> a:
                        </p>
                        <select value={targetSupplierId} onChange={e => setTargetSupplierId(e.target.value)} style={{ ...inputStyle, marginBottom: '16px' }}>
                            <option value="">Seleccionar proveedor destino...</option>
                            {suppliers.filter(s => s.id !== selectedSupplier.id).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                        <button onClick={() => {
                            if (!targetSupplierId) { toast.error('Seleccioná un proveedor'); return; }
                            transferProducts(selectedSupplier.id, targetSupplierId);
                            setShowTransferModal(false);
                            toast.success('Productos transferidos');
                        }} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                            Confirmar
                        </button>
                    </div>
                </div>
            )}

            {/* Mass Update Modal */}
            {showUpdateModal && selectedSupplier && (
                <div style={modalOverlay}>
                    <div style={{ ...modalBox, borderTop: '3px solid #6366f1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>Aumento Masivo</h3>
                            <button onClick={() => setShowUpdateModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#000000', marginBottom: '16px' }}>
                            Aumentar precios de <strong style={{ color: '#818cf8' }}>{selectedSupplier.name}</strong> ({getProductCount(selectedSupplier.id)} productos)
                        </p>
                        <div style={{ position: 'relative', marginBottom: '12px' }}>
                            <input type="number" value={updatePercent} onChange={e => setUpdatePercent(e.target.value)} placeholder="10" autoFocus
                                style={{ ...inputStyle, fontSize: '20px', fontWeight: '700', paddingRight: '40px' }} />
                            <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#000000', fontWeight: '700' }}>%</span>
                        </div>
                        <div style={{ padding: '8px 12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '8px' }}>
                            <AlertTriangle size={14} style={{ color: '#f59e0b', marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ fontSize: '11px', color: '#f59e0b' }}>Se actualizará el Costo y Precio de Venta manteniendo el margen actual.</p>
                        </div>
                        <button onClick={handleApplyUpdate} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                            Aplicar Aumento
                        </button>
                    </div>
                </div>
            )}

            {/* View Products Modal */}
            {viewingProducts && (
                <div style={modalOverlay}>
                    <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #000000' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>Productos de {viewingProducts.name}</h3>
                            </div>
                            <button onClick={() => setViewingProducts(null)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', padding: '16px 24px' }}>
                            <table style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #ffffff' }}>
                                        <th style={{ padding: '10px 8px', color: '#000000', fontWeight: '500' }}>Producto</th>
                                        <th style={{ padding: '10px 8px', color: '#000000', fontWeight: '500' }}>Código</th>
                                        <th style={{ padding: '10px 8px', color: '#000000', fontWeight: '500' }}>Costo</th>
                                        <th style={{ padding: '10px 8px', color: '#000000', fontWeight: '500' }}>Precio</th>
                                        <th style={{ padding: '10px 8px', color: '#000000', fontWeight: '500', textAlign: 'center' }}>Stock</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.filter(p => p.supplierId === viewingProducts.id).map(p => {
                                        const stock = getTotalStock(p.id);
                                        return (
                                            <tr key={p.id} style={{ borderBottom: '1px solid #ffffff' }}>
                                                <td style={{ padding: '10px 8px', color: '#000000', fontWeight: '500' }}>{p.name}</td>
                                                <td style={{ padding: '10px 8px', color: '#000000', fontFamily: 'monospace' }}>{p.barcode}</td>
                                                <td style={{ padding: '10px 8px', color: '#000000' }}>${p.cost}</td>
                                                <td style={{ padding: '10px 8px', color: '#000000', fontWeight: '600' }}>${p.price}</td>
                                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                                        color: stock < 5 ? '#ef4444' : '#22c55e',
                                                        background: stock < 5 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)'
                                                    }}>
                                                        {stock}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
