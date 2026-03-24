import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Promotion } from '../types';
import { Plus, Trash2, Tag, Save, X, Search, CheckSquare, Square, Scale, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export const Promotions: React.FC = () => {
    const promotions = useStore(s => s.promotions);
    const products = useStore(s => s.products);
    const bulkProducts = useStore(s => s.bulkProducts);
    const addPromotion = useStore(s => s.addPromotion);
    const deletePromotion = useStore(s => s.deletePromotion);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [promoPrice, setPromoPrice] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState('');

    const resetForm = () => {
        setShowForm(false); setEditingId(null); setName(''); setPromoPrice(''); setSelectedIds([]); setSearch('');
    };

    const handleSave = () => {
        if (!name || !promoPrice || selectedIds.length === 0) {
            toast.error('Completá todos los campos');
            return;
        }
        const promo: Promotion = {
            id: editingId || crypto.randomUUID(),
            name,
            triggerProductIds: selectedIds,
            promoPrice: parseFloat(promoPrice),
            active: true
        };
        addPromotion(promo);
        toast.success(editingId ? 'Promo actualizada' : 'Promo creada');
        resetForm();
    };

    const handleEdit = (promo: Promotion) => {
        setEditingId(promo.id);
        setName(promo.name);
        setPromoPrice(String(promo.promoPrice));
        setSelectedIds(promo.triggerProductIds);
        setShowForm(true);
    };

    const toggleProduct = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const allProducts = [
        ...products.map(p => ({ id: p.id, name: p.name, price: p.price, type: 'unit' })),
        ...bulkProducts.map(p => ({ id: p.id, name: `${p.name} (por Kg)`, price: p.pricePerKg, type: 'bulk' }))
    ];

    const filtered = search ? allProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase())) : allProducts;

    const getProductNames = (ids: string[]) => {
        return ids.map(id => {
            const p = products.find(x => x.id === id) || bulkProducts.find(x => x.id === id);
            return p?.name || id;
        }).join(' + ');
    };

    const cardStyle: React.CSSProperties = {
        background: '#ffffff', border: '1px solid #000000', borderRadius: '16px', padding: '20px'
    };
    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '10px 12px', background: '#f8fafc',
        border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '14px'
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }} className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={22} style={{ color: '#6366f1' }} /> Promociones
                </h2>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={16} /> Nueva Promo
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div style={{ ...cardStyle, marginBottom: '20px' }} className="animate-fadeIn">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000' }}>{editingId ? 'Editar' : 'Nueva'} Promoción</h3>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder='Ej: "Combo Mateada"' style={inputStyle} autoFocus />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Precio Promo ($)</label>
                            <input type="number" value={promoPrice} onChange={e => setPromoPrice(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontWeight: '600' }} />
                        </div>
                    </div>

                    {/* Product selector */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>
                            Productos incluidos ({selectedIds.length} seleccionados)
                        </label>
                        <div style={{ position: 'relative', marginBottom: '8px' }}>
                            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..."
                                style={{ ...inputStyle, paddingLeft: '32px', fontSize: '13px' }} />
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {filtered.slice(0, 20).map(p => (
                                <button key={p.id} onClick={() => toggleProduct(p.id)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                                        background: selectedIds.includes(p.id) ? 'rgba(99,102,241,0.1)' : 'transparent',
                                        border: `1px solid ${selectedIds.includes(p.id) ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                                        borderRadius: '8px', cursor: 'pointer', color: '#000000', fontSize: '13px', textAlign: 'left', width: '100%'
                                    }}>
                                    {selectedIds.includes(p.id) ? <CheckSquare size={14} style={{ color: '#6366f1' }} /> : <Square size={14} style={{ color: '#000000' }} />}
                                    <span style={{ flex: 1 }}>{p.name}</span>
                                    <span style={{ color: '#6366f1', fontWeight: '600', fontSize: '12px' }}>${p.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Save size={16} /> {editingId ? 'Actualizar' : 'Guardar'}
                    </button>
                </div>
            )}

            {/* Promotions List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {promotions.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: '#000000' }}>
                        <Tag size={40} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: '14px' }}>No hay promociones creadas</p>
                    </div>
                ) : promotions.map(promo => (
                    <div key={promo.id} style={{ ...cardStyle, position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{promo.name}</h3>
                                <p style={{ fontSize: '12px', color: '#000000', marginTop: '2px' }}>
                                    {promo.triggerProductIds.length} productos
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleEdit(promo)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}>
                                    <Pencil size={14} />
                                </button>
                                <button onClick={() => { if (confirm('¿Eliminar?')) { deletePromotion(promo.id); toast.success('Eliminada'); } }}
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        <p style={{ fontSize: '12px', color: '#000000', marginBottom: '12px' }} className="truncate">
                            {getProductNames(promo.triggerProductIds)}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>${promo.promoPrice.toLocaleString()}</span>
                            <span style={{
                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600',
                                background: promo.active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                color: promo.active ? '#22c55e' : '#ef4444'
                            }}>
                                {promo.active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
