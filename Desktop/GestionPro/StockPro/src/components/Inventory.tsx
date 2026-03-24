import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Product, InventoryBatch, BulkProduct } from '../types';
import {
    Package, Plus, Search, Trash2, Pencil, X, Save,
    AlertTriangle, Scale, ChevronDown, BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

type InventoryTab = 'products' | 'bulk' | 'batches';

export const Inventory: React.FC = () => {
    const products = useStore(s => s.products);
    const batches = useStore(s => s.batches);
    const bulkProducts = useStore(s => s.bulkProducts);
    const suppliers = useStore(s => s.suppliers);
    const addProduct = useStore(s => s.addProduct);
    const updateProduct = useStore(s => s.updateProduct);
    const deleteProduct = useStore(s => s.deleteProduct);
    const addBatch = useStore(s => s.addBatch);
    const addBulkProduct = useStore(s => s.addBulkProduct);
    const updateBulkProduct = useStore(s => s.updateBulkProduct);
    const deleteBulkProduct = useStore(s => s.deleteBulkProduct);

    const [tab, setTab] = useState<InventoryTab>('products');
    const [search, setSearch] = useState('');
    const [showProductModal, setShowProductModal] = useState(false);
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Product form
    const [pName, setPName] = useState('');
    const [pBarcode, setPBarcode] = useState('');
    const [pCost, setPCost] = useState('');
    const [pMargin, setPMargin] = useState('30');
    const [pSupplier, setPSupplier] = useState('');
    const [pManualPrice, setPManualPrice] = useState(false);
    const [pPrice, setPPrice] = useState('');

    // Batch form
    const [bProductId, setBProductId] = useState('');
    const [bQuantity, setBQuantity] = useState('');
    const [bExpiry, setBExpiry] = useState('');

    // Bulk form
    const [bkName, setBkName] = useState('');
    const [bkCostBulk, setBkCostBulk] = useState('');
    const [bkWeightBulk, setBkWeightBulk] = useState('');
    const [bkPriceKg, setBkPriceKg] = useState('');
    const [bkStockKg, setBkStockKg] = useState('');
    const [bkSupplier, setBkSupplier] = useState('');

    const getTotalStock = (productId: string) =>
        batches.filter(b => b.productId === productId).reduce((s, b) => s + b.quantity, 0);

    const calculatedPrice = pManualPrice
        ? parseFloat(pPrice) || 0
        : (parseFloat(pCost) || 0) * (1 + (parseFloat(pMargin) || 0) / 100);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return products.filter(p =>
            !q || p.name.toLowerCase().includes(q) || p.barcode.includes(q)
        );
    }, [products, search]);

    const filteredBulk = useMemo(() => {
        const q = search.toLowerCase();
        return bulkProducts.filter(p => !q || p.name.toLowerCase().includes(q));
    }, [bulkProducts, search]);

    const resetProductForm = () => {
        setPName(''); setPBarcode(''); setPCost(''); setPMargin('30'); setPSupplier(''); setPManualPrice(false); setPPrice(''); setEditingId(null);
    };

    const handleSaveProduct = () => {
        if (!pName) return;
        const product: Product = {
            id: editingId || crypto.randomUUID(),
            name: pName, barcode: pBarcode, cost: parseFloat(pCost) || 0,
            profitMargin: parseFloat(pMargin) || 0, price: calculatedPrice,
            supplierId: pSupplier, isManualPrice: pManualPrice, isPack: false
        };
        if (editingId) { updateProduct(product); toast.success('Producto actualizado'); }
        else { addProduct(product); toast.success('Producto creado'); }
        setShowProductModal(false); resetProductForm();
    };

    const handleEditProduct = (p: Product) => {
        setEditingId(p.id); setPName(p.name); setPBarcode(p.barcode); setPCost(String(p.cost));
        setPMargin(String(p.profitMargin)); setPSupplier(p.supplierId || '');
        setPManualPrice(p.isManualPrice || false); setPPrice(String(p.price));
        setShowProductModal(true);
    };

    const handleSaveBatch = () => {
        if (!bProductId || !bQuantity || !bExpiry) return;
        const batch: InventoryBatch = {
            id: crypto.randomUUID(), productId: bProductId,
            batchNumber: `LOT-${Date.now()}`, quantity: parseInt(bQuantity),
            expiryDate: bExpiry, dateAdded: new Date().toISOString()
        };
        addBatch(batch);
        toast.success('Lote registrado');
        setShowBatchModal(false); setBProductId(''); setBQuantity(''); setBExpiry('');
    };

    const handleSaveBulk = () => {
        if (!bkName) return;
        const bp: BulkProduct = {
            id: editingId || crypto.randomUUID(), name: bkName,
            costPerBulk: parseFloat(bkCostBulk) || 0, weightPerBulk: parseFloat(bkWeightBulk) || 1,
            pricePerKg: parseFloat(bkPriceKg) || 0, stockKg: parseFloat(bkStockKg) || 0,
            supplierId: bkSupplier
        };
        if (editingId) { updateBulkProduct(bp); toast.success('Actualizado'); }
        else { addBulkProduct(bp); toast.success('Producto a granel creado'); }
        setShowBulkModal(false); setEditingId(null); setBkName(''); setBkCostBulk(''); setBkWeightBulk(''); setBkPriceKg(''); setBkStockKg(''); setBkSupplier('');
    };

    const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid #000000', borderRadius: '16px', padding: '20px' };
    const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #000000', borderRadius: '10px', color: '#000000', fontSize: '14px' };
    const modalOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
    const modalBox: React.CSSProperties = { background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', border: '1px solid #000000', maxHeight: '90vh', overflowY: 'auto' };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#000000', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={22} style={{ color: '#6366f1' }} /> Inventario
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { resetProductForm(); setShowProductModal(true); }}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#6366f1', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Producto
                    </button>
                    <button onClick={() => setShowBatchModal(true)}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#22c55e', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        <Plus size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Lote
                    </button>
                    <button onClick={() => { setEditingId(null); setShowBulkModal(true); }}
                        style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#f59e0b', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                        <Scale size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> Granel
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                {([['products', `Productos (${products.length})`], ['bulk', `Granel (${bulkProducts.length})`], ['batches', `Lotes (${batches.length})`]] as const).map(([k, label]) => (
                    <button key={k} onClick={() => setTab(k as InventoryTab)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                            border: `1px solid ${tab === k ? '#6366f1' : '#ffffff'}`,
                            background: tab === k ? 'rgba(99,102,241,0.15)' : 'transparent',
                            color: tab === k ? '#818cf8' : '#475569', cursor: 'pointer'
                        }}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#000000' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..."
                    style={{ ...inputStyle, paddingLeft: '36px' }} />
            </div>

            {/* Products Tab */}
            {tab === 'products' && (
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Producto</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Código</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Costo</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Precio</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Stock</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#000000', fontSize: '11px', fontWeight: '500' }}>Acc.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const stock = getTotalStock(p.id);
                                const supplier = suppliers.find(s => s.id === p.supplierId);
                                return (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #ffffff' }}>
                                        <td style={{ padding: '10px 16px' }}>
                                            <p style={{ color: '#000000', fontWeight: '500' }}>{p.name}</p>
                                            {supplier && <p style={{ color: '#000000', fontSize: '11px' }}>{supplier.name}</p>}
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#000000', fontFamily: 'monospace', fontSize: '12px' }}>{p.barcode || '-'}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#000000' }}>${p.cost.toLocaleString()}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'right', color: '#000000', fontWeight: '600' }}>${p.price.toLocaleString()}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                                color: stock === 0 ? '#ef4444' : stock <= 5 ? '#f59e0b' : '#22c55e',
                                                background: stock === 0 ? 'rgba(239,68,68,0.1)' : stock <= 5 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'
                                            }}>{stock}</span>
                                        </td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                                <button onClick={() => handleEditProduct(p)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}>
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => { if (confirm(`¿Eliminar ${p.name}?`)) { deleteProduct(p.id); toast.success('Eliminado'); } }}
                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#000000' }}>Sin productos</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Bulk Tab */}
            {tab === 'bulk' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    {filteredBulk.map(bp => (
                        <div key={bp.id} style={cardStyle}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#000000' }}>{bp.name}</h3>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button onClick={() => {
                                        setEditingId(bp.id); setBkName(bp.name); setBkCostBulk(String(bp.costPerBulk));
                                        setBkWeightBulk(String(bp.weightPerBulk)); setBkPriceKg(String(bp.pricePerKg));
                                        setBkStockKg(String(bp.stockKg)); setBkSupplier(bp.supplierId || ''); setShowBulkModal(true);
                                    }} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer', padding: '4px' }}><Pencil size={12} /></button>
                                    <button onClick={() => { if (confirm('¿Eliminar?')) { deleteBulkProduct(bp.id); } }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={12} /></button>
                                </div>
                            </div>
                            <p style={{ fontSize: '22px', fontWeight: '700', color: '#6366f1' }}>${bp.pricePerKg}/kg</p>
                            <p style={{ fontSize: '13px', color: '#000000', marginTop: '4px' }}>Stock: <strong style={{ color: bp.stockKg < 1 ? '#ef4444' : '#22c55e' }}>{bp.stockKg.toFixed(1)} kg</strong></p>
                        </div>
                    ))}
                    {filteredBulk.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#000000', padding: '40px' }}>Sin productos a granel</p>}
                </div>
            )}

            {/* Batches Tab */}
            {tab === 'batches' && (
                <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px' }}>Producto</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px' }}>Lote</th>
                                <th style={{ padding: '12px 16px', textAlign: 'center', color: '#000000', fontSize: '11px' }}>Cantidad</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px' }}>Vencimiento</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#000000', fontSize: '11px' }}>Ingreso</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()).map(b => {
                                const product = products.find(p => p.id === b.productId);
                                const daysToExpiry = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
                                return (
                                    <tr key={b.id} style={{ borderBottom: '1px solid #ffffff' }}>
                                        <td style={{ padding: '10px 16px', color: '#000000', fontWeight: '500' }}>{product?.name || 'Desconocido'}</td>
                                        <td style={{ padding: '10px 16px', color: '#000000', fontFamily: 'monospace', fontSize: '11px' }}>{b.batchNumber}</td>
                                        <td style={{ padding: '10px 16px', textAlign: 'center', fontWeight: '600', color: b.quantity === 0 ? '#ef4444' : '#ffffff' }}>{b.quantity}</td>
                                        <td style={{ padding: '10px 16px' }}>
                                            <span style={{
                                                fontSize: '12px', fontWeight: '500',
                                                color: daysToExpiry < 0 ? '#ef4444' : daysToExpiry < 7 ? '#f59e0b' : '#475569'
                                            }}>
                                                {b.expiryDate.split('-').reverse().join('/')}
                                                {daysToExpiry < 0 && ' (VENCIDO)'}
                                                {daysToExpiry >= 0 && daysToExpiry < 7 && ` (${daysToExpiry}d)`}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 16px', color: '#000000', fontSize: '12px' }}>
                                            {new Date(b.dateAdded).toLocaleDateString('es-AR')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
                            <button onClick={() => { setShowProductModal(false); resetProductForm(); }} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                                <input value={pName} onChange={e => setPName(e.target.value)} style={inputStyle} autoFocus /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Código de barras</label>
                                <input value={pBarcode} onChange={e => setPBarcode(e.target.value)} style={inputStyle} /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Costo ($)</label>
                                    <input type="number" value={pCost} onChange={e => setPCost(e.target.value)} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Margen (%)</label>
                                    <input type="number" value={pMargin} onChange={e => setPMargin(e.target.value)} style={inputStyle} disabled={pManualPrice} /></div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" checked={pManualPrice} onChange={e => setPManualPrice(e.target.checked)} id="manualPrice" />
                                <label htmlFor="manualPrice" style={{ fontSize: '12px', color: '#000000' }}>Precio manual</label>
                            </div>
                            {pManualPrice && (
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Precio ($)</label>
                                    <input type="number" value={pPrice} onChange={e => setPPrice(e.target.value)} style={inputStyle} /></div>
                            )}
                            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#000000', fontSize: '13px' }}>Precio final:</span>
                                <span style={{ color: '#6366f1', fontWeight: '700', fontSize: '16px' }}>${calculatedPrice.toFixed(2)}</span>
                            </div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Proveedor</label>
                                <select value={pSupplier} onChange={e => setPSupplier(e.target.value)} style={inputStyle}>
                                    <option value="">Sin proveedor</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div>
                            <button onClick={handleSaveProduct} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#6366f1', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                {editingId ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Modal */}
            {showBatchModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>Agregar Lote</h3>
                            <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Producto</label>
                                <select value={bProductId} onChange={e => setBProductId(e.target.value)} style={inputStyle}>
                                    <option value="">Seleccionar...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Cantidad</label>
                                <input type="number" value={bQuantity} onChange={e => setBQuantity(e.target.value)} style={inputStyle} /></div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Fecha de vencimiento</label>
                                <input type="date" value={bExpiry} onChange={e => setBExpiry(e.target.value)} style={inputStyle} /></div>
                            <button onClick={handleSaveBatch} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#22c55e', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                Registrar Lote
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Modal */}
            {showBulkModal && (
                <div style={modalOverlay}>
                    <div style={modalBox}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#000000' }}>{editingId ? 'Editar' : 'Nuevo'} Producto a Granel</h3>
                            <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', color: '#000000', cursor: 'pointer' }}><X size={18} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Nombre</label>
                                <input value={bkName} onChange={e => setBkName(e.target.value)} style={inputStyle} autoFocus /></div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Costo por bulto ($)</label>
                                    <input type="number" value={bkCostBulk} onChange={e => setBkCostBulk(e.target.value)} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Peso por bulto (kg)</label>
                                    <input type="number" value={bkWeightBulk} onChange={e => setBkWeightBulk(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Precio por Kg ($)</label>
                                    <input type="number" value={bkPriceKg} onChange={e => setBkPriceKg(e.target.value)} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Stock actual (kg)</label>
                                    <input type="number" value={bkStockKg} onChange={e => setBkStockKg(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div><label style={{ display: 'block', fontSize: '11px', fontWeight: '500', color: '#000000', marginBottom: '4px' }}>Proveedor</label>
                                <select value={bkSupplier} onChange={e => setBkSupplier(e.target.value)} style={inputStyle}>
                                    <option value="">Sin proveedor</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select></div>
                            <button onClick={handleSaveBulk} style={{ padding: '12px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                {editingId ? 'Guardar' : 'Crear'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
