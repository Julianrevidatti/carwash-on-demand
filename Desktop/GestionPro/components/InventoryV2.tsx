import React, { useState, useEffect } from 'react';
import { Product, Supplier, InventoryBatch, SystemSettings } from '../types';
import { getTotalStock } from '../services/inventoryService';
import { AlertTriangle, Plus, X, Package, Layers, AlertCircle, Search, Calendar, FileText, ArrowDownCircle, Save, History as HistoryIcon, Scan, Clock, Trash2, Lock } from 'lucide-react';

import { usePlanPermissions } from '../hooks/usePlanPermissions';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { PERMISSIONS } from '../config/permissions';
import { parseProductCSV } from '../src/utils/csvParser';
import { useStore } from '../src/store/useStore';
import { toast } from 'sonner';
import { expenseService } from '../src/services/expenseService';
import { supabase } from '../src/lib/supabase';
import { compressImage } from '../src/utils/imageUtils';  // CLIENT-SIDE COMPRESSION
import { ImageIcon, UploadCloud } from 'lucide-react';


interface InventoryProps {
    products: Product[];
    batches: InventoryBatch[];
    suppliers: Supplier[];
    onUpdateProduct: (product: Product) => void;
    onAddProduct: (product: Product) => void;
    onAddBatch: (batch: InventoryBatch) => void;
    onMassUpdate: (supplierId: string, percent: number) => void;
    onImportCSV: (products: Product[], batches: InventoryBatch[]) => void;
    onDeleteProduct: (productId: string) => void;
    settings: SystemSettings;
    initialTab?: 'catalog' | 'logistics' | 'history' | 'bulk';
    stockMovements: any[]; // StockMovement[]
    onAddStockMovement: (movement: any) => void;
    onUpdateBatches: (batches: InventoryBatch[]) => void;
    onAddSupplier: (supplier: Supplier) => void;
    // Bulk Props
    bulkProducts?: any[];
    onAddBulkProduct?: (product: any) => void;
    onUpdateBulkProduct?: (product: any) => void;
    onDeleteBulkProduct?: (id: string) => void;
}

export const InventoryV2: React.FC<InventoryProps> = ({ products = [], batches = [], suppliers = [], onUpdateProduct, onAddProduct, onAddBatch, onMassUpdate, onImportCSV, onDeleteProduct, settings, initialTab = 'catalog', stockMovements = [], onAddStockMovement, onUpdateBatches, onAddSupplier, bulkProducts = [], onAddBulkProduct, onUpdateBulkProduct, onDeleteBulkProduct }) => {

    const { canAddProduct, limits } = usePlanPermissions();
    const { hasPermission } = useUserPermissions();
    const canManageCatalog = hasPermission(PERMISSIONS.CATALOG_MANAGE);
    const canViewCost = hasPermission(PERMISSIONS.CATALOG_VIEW_COST);

    const [activeTab, setActiveTab] = useState<'catalog' | 'logistics' | 'history' | 'bulk'>(initialTab);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplierId, setSelectedSupplierId] = useState('');

    // Stock Entry State
    const [logisticsMode, setLogisticsMode] = useState<'entry' | 'exit'>('entry');
    const [selectedProductId, setSelectedProductId] = useState('');
    const [entryQuantity, setEntryQuantity] = useState('');
    const [entryBatchNumber, setEntryBatchNumber] = useState('');
    const [entryExpiry, setEntryExpiry] = useState('');

    // Stock Exit State
    const [exitProductId, setExitProductId] = useState('');
    const [exitQuantity, setExitQuantity] = useState('');
    const [exitReason, setExitReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Product State
    const [newProd, setNewProd] = useState<Partial<Product>>({
        name: '', barcode: '', cost: 0, profitMargin: 0, price: 0, supplierId: '', isPack: false
    });
    const [isManualPrice, setIsManualPrice] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false); // NEW: Image Upload State


    // History Filters State
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');
    const [historySupplierFilter, setHistorySupplierFilter] = useState('');
    const [historyTypeFilter, setHistoryTypeFilter] = useState(''); // NEW: IN, OUT, or '' for all
    const [historyReasonFilter, setHistoryReasonFilter] = useState(''); // NEW: Venta, Consumo Interno, etc.
    const [historyProductSearch, setHistoryProductSearch] = useState(''); // NEW: Search by product name
    const [historyUserFilter, setHistoryUserFilter] = useState(''); // NEW: Filter by user
    const [historyPage, setHistoryPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setNewProd({
            name: product.name,
            barcode: product.barcode,
            cost: product.cost,
            profitMargin: product.profitMargin,
            price: product.price,
            supplierId: product.supplierId,
            isPack: product.isPack,
            childProductId: product.childProductId,
            childQuantity: product.childQuantity,
            image_url: product.image_url // Load existing image
        });

        // Detect Manual Price: If stored price != calculated price, assume it was manual.
        const calculatedPrice = product.cost * (1 + (product.profitMargin / 100));
        // Use a small epsilon for float comparison or just strict inequality if we used Math.ceil
        // Our system uses Math.ceil for auto-calc.
        const autoPrice = Math.ceil(calculatedPrice);

        if (product.price !== autoPrice) {
            console.log(`Manual Price Detected: ${product.price} vs Auto ${autoPrice}`);
            setIsManualPrice(true);
        } else {
            setIsManualPrice(false);
        }

        setShowAddForm(true);
    };

    const LOW_STOCK_THRESHOLD = settings?.alertStockMinDefault || 5;
    const ALERT_DAYS = settings?.alertDaysBeforeExpiration || 30;

    // Auto-Calculate Price
    useEffect(() => {
        if (!isManualPrice && newProd.cost !== undefined && newProd.profitMargin !== undefined) {
            const calculatedPrice = newProd.cost * (1 + (newProd.profitMargin / 100));
            setNewProd(prev => ({ ...prev, price: Math.ceil(calculatedPrice) }));
        }
    }, [newProd.cost, newProd.profitMargin, isManualPrice]);

    // Recalculate Margin if Manual Price is set
    useEffect(() => {
        if (isManualPrice && newProd.price !== undefined && newProd.cost !== undefined && newProd.cost > 0) {
            const margin = ((newProd.price - newProd.cost) / newProd.cost) * 100;
            setNewProd(prev => ({ ...prev, profitMargin: parseFloat(margin.toFixed(2)) }));
        }
    }, [newProd.price, isManualPrice]);

    // Set default expiry to 30 days from now
    useEffect(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        setEntryExpiry(date.toISOString().split('T')[0]);
    }, []);

    // Auto Scan in Add Modal
    useEffect(() => {
        if (!showAddForm) return;

        const handleModalScan = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return; // Ignore if typing in an input
            // Simple simulation: keys are usually sent fast by scanner.
            // Here we assume if Enter is hit, the value in a buffer (not implemented here for simplicity) would be used.
            // For this demo, we rely on the user focusing the barcode input or the scanner typing into it.
        };
        window.addEventListener('keydown', handleModalScan);
        return () => window.removeEventListener('keydown', handleModalScan);
    }, [showAddForm]);

    // NEW: Fetch full history when tab is opened
    useEffect(() => {
        if (activeTab === 'history') {
            useStore.getState().fetchStockMovements(true);
        }
    }, [activeTab]);

    const handleCreateProduct = () => {
        if (!newProd.name || !newProd.barcode) {
            alert("Por favor complete los campos obligatorios (Nombre, Código).");
            return;
        }

        if (editingProduct) {
            const updatedProduct: Product = {
                ...editingProduct,
                name: newProd.name!,
                barcode: newProd.barcode!,
                cost: Number(newProd.cost),
                profitMargin: Number(newProd.profitMargin),
                price: Number(newProd.price),
                supplierId: newProd.supplierId!,
                isPack: newProd.isPack || false,
                childProductId: newProd.childProductId,
                childQuantity: newProd.childQuantity ? Number(newProd.childQuantity) : undefined,
                isManualPrice: isManualPrice, // NEW: Persist manual price flag
                image_url: newProd.image_url
            };
            onUpdateProduct(updatedProduct);
            setEditingProduct(null);
        } else {
            const product: Product = {
                id: crypto.randomUUID(),
                name: newProd.name!,
                barcode: newProd.barcode!,
                cost: Number(newProd.cost),
                profitMargin: Number(newProd.profitMargin),
                price: Number(newProd.price),
                supplierId: newProd.supplierId!,
                isPack: newProd.isPack || false,
                childProductId: newProd.childProductId,
                childQuantity: newProd.childQuantity ? Number(newProd.childQuantity) : undefined,
                isManualPrice: isManualPrice, // NEW: Persist manual price flag
                image_url: newProd.image_url
            };
            onAddProduct(product);
        }

        setShowAddForm(false);
        // Reset form
        setNewProd({ name: '', barcode: '', cost: 0, profitMargin: 0, price: 0, supplierId: '', isPack: false, image_url: undefined });
    };

    const handleStockEntry = async () => {
        if (!selectedProductId || !entryQuantity || !entryBatchNumber || !entryExpiry) {
            alert("Todos los campos son obligatorios para el ingreso de stock.");
            return;
        }
        setIsSubmitting(true);
        try {
            const qty = parseInt(entryQuantity);
            const newBatch: InventoryBatch = {
                id: crypto.randomUUID(),
                productId: selectedProductId,
                quantity: qty,
                originalQuantity: qty, // Set original quantity
                batchNumber: entryBatchNumber,
                expiryDate: entryExpiry,
                dateAdded: new Date().toISOString()
            };

            // Await the addBatch so if it fails we don't proceed
            await useStore.getState().addBatch(newBatch);

            // Register movement for traceability
            const product = products.find(p => p.id === selectedProductId);
            const movement = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                productId: selectedProductId,
                productName: product?.name || 'Desconocido',
                quantity: qty,
                reason: `Lote ${entryBatchNumber}`,
                detail: `Lote ${entryBatchNumber}`,
                type: 'IN' as const,
                userId: useStore.getState().currentUser?.id || 'unknown' // Use real user
            };
            onAddStockMovement(movement);

            setEntryQuantity('');
            setEntryBatchNumber('');
            const date = new Date();
            date.setDate(date.getDate() + 30);
            setEntryExpiry(date.toISOString().split('T')[0]);
            toast.success("Stock ingresado correctamente (Lote registrado).");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStockExit = async () => {
        if (!exitProductId || !exitQuantity || !exitReason) {
            alert("Todos los campos son obligatorios para el egreso.");
            return;
        }

        setIsSubmitting(true);
        const qty = parseInt(exitQuantity);
        if (qty <= 0) {
            alert("La cantidad debe ser mayor a 0.");
            return;
        }

        // Find product name
        const product = products.find(p => p.id === exitProductId);
        const productName = product?.name || 'Desconocido';

        // Use DB-FIRST approach to prevent race conditions
        try {
            const success = await useStore.getState().exitBatchStock(
                exitProductId,
                qty,
                exitReason,
                productName
            );

            if (success) {
                setExitQuantity('');
                setExitReason('');
                setExitProductId('');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- HANDLE IMAGE UPLOAD ---
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploadingImage(true);

            // 1. Client-Side Compression (Max 800px, WebP, 0.6 quality)
            const compressedBlob = await compressImage(file, 800, 0.6);
            const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", { type: 'image/webp' });

            // 2. Upload to Supabase Storage
            const tenantId = useStore.getState().currentTenant?.id || 'unknown';
            const fileName = `${tenantId}/${crypto.randomUUID()}.webp`; // Path: tenantId/randomId.webp

            const { data, error } = await supabase.storage
                .from('product-images')
                .upload(fileName, compressedFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            // 4. Update State
            setNewProd(prev => ({ ...prev, image_url: publicUrl }));
            toast.success("Imagen subida y comprimida correctamente");

        } catch (error) {
            console.error("Error uploading image:", error);
            toast.error("Error al subir la imagen");
        } finally {
            setIsUploadingImage(false);
        }
    };

    // Barcode Scanner Helper for Stock Entry
    const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const scannedCode = (e.target as HTMLInputElement).value;
            const product = products.find(p => p.barcode === scannedCode);
            if (product) {
                setSelectedProductId(product.id);
                (e.target as HTMLInputElement).value = ''; // clear scanner buffer
                setSearchTerm(''); // clear visual search if any
            } else {
                alert("Producto no encontrado con ese código.");
            }
        }
    };

    const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
                const { products, batches } = parseProductCSV(text);
                if (products.length > 0) {
                    onImportCSV(products, batches);
                    alert(`Se importaron ${products.length} productos y ${batches.length} lotes correctamente.`);
                } else {
                    alert("No se encontraron productos válidos en el archivo CSV.");
                }
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const filteredProducts = (products || []).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.barcode.includes(searchTerm);
        const matchesSupplier = selectedSupplierId ? p.supplierId === selectedSupplierId : true;
        return matchesSearch && matchesSupplier;
    });

    // Combine Batches (IN) and StockMovements (OUT) for History
    const safeMovements = Array.isArray(stockMovements) ? stockMovements : [];

    const historyData = [
        ...safeMovements.map(m => ({
            id: m.id,
            date: m.date,
            type: m.type,
            productId: m.productId,
            productName: m.productName,
            detail: m.reason || m.detail,
            quantity: m.quantity,
            isBulk: false, // Regular products
            userId: m.userId
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Get unique users from history for filter
    const uniqueUsers = Array.from(new Set(historyData.map(item => item.userId).filter(Boolean)));
    const systemUsers = useStore(state => state.systemUsers) || [];

    // Filter History
    const filteredHistory = (historyData || []).filter(item => {
        // Fix Date Filtering: Compare YYYY-MM-DD strings to avoid Timezone/Time headaches
        const itemDateObj = new Date(item.date);
        // 'en-CA' gives YYYY-MM-DD format in local time
        const itemDateStr = itemDateObj.toLocaleDateString('en-CA');

        const matchesStartDate = !historyStartDate || itemDateStr >= historyStartDate;
        const matchesEndDate = !historyEndDate || itemDateStr <= historyEndDate;

        const matchesDate = matchesStartDate && matchesEndDate;

        let matchesSupplier = true;
        if (historySupplierFilter) {
            const product = products.find(p => p.id === item.productId);
            matchesSupplier = product?.supplierId === historySupplierFilter;
        }

        // Filter by type (IN/OUT)
        let matchesType = true;
        if (historyTypeFilter) {
            matchesType = item.type === historyTypeFilter;
        }

        // Filter by reason/detail
        let matchesReason = true;
        if (historyReasonFilter) {
            matchesReason = item.detail?.toLowerCase().includes(historyReasonFilter.toLowerCase()) || false;
        }

        // NEW: Filter by product name (search)
        let matchesProduct = true;
        if (historyProductSearch) {
            matchesProduct = item.productName?.toLowerCase().includes(historyProductSearch.toLowerCase()) || false;
        }

        // NEW: Filter by user
        let matchesUser = true;
        if (historyUserFilter) {
            matchesUser = item.userId === historyUserFilter;
        }

        return matchesDate && matchesSupplier && matchesType && matchesReason && matchesProduct && matchesUser;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
    const paginatedHistory = filteredHistory.slice((historyPage - 1) * ITEMS_PER_PAGE, historyPage * ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => {
        setHistoryPage(1);
    }, [historyStartDate, historyEndDate, historySupplierFilter, historyTypeFilter, historyReasonFilter, historyProductSearch, historyUserFilter]);

    return (
        <div className="space-y-6">

            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Gestión de Inventario</h2>
                    <p className="text-gray-500 text-sm">Administre el catálogo y la logística de stock.</p>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'catalog' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Package className="w-4 h-4" /> Catálogo
                    </button>
                    <button
                        onClick={() => setActiveTab('logistics')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'logistics' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layers className="w-4 h-4" /> Logística
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <HistoryIcon className="w-4 h-4" /> Historial Ingresos
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'bulk' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Layers className="w-4 h-4" /> Granel / Pesables
                    </button>
                </div>
            </div>

            {/* --- VIEW: CATALOG --- */}
            {activeTab === 'catalog' && (
                <div className="space-y-4 animate-in fade-in">
                    {/* Filters Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, SKU o código de barras..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="relative w-full md:w-64">
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-900"
                                value={selectedSupplierId}
                                onChange={e => setSelectedSupplierId(e.target.value)}
                            >
                                <option value="">Todos los Proveedores</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative group/btn">
                            <button
                                onClick={() => {
                                    if (!canAddProduct() || !canManageCatalog) return;
                                    setNewProd({ name: '', barcode: '', cost: 0, profitMargin: 0, price: 0, supplierId: '', isPack: false });
                                    setIsManualPrice(false);
                                    setEditingProduct(null);
                                    setShowAddForm(true);
                                }}
                                disabled={!canAddProduct() || !canManageCatalog}
                                className={`w-full md:w-auto px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-sm
                                    ${(!canAddProduct() || !canManageCatalog)
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            >
                                {!canAddProduct() || !canManageCatalog ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                Nuevo Producto
                            </button>
                            {/* Priority Message: Plan Limit vs No Permission */}
                            {!canManageCatalog ? (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity z-50 text-center pointer-events-none">
                                    No tienes permisos para crear productos.
                                </div>
                            ) : !canAddProduct() && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/btn:opacity-100 transition-opacity z-50 text-center pointer-events-none">
                                    Límite de {limits.maxProducts} productos alcanzado. Actualiza tu plan.
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="w-full md:w-auto bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <FileText className="w-4 h-4" /> Importar CSV
                        </button>
                    </div>

                    {/* Products Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* ... table content ... */}
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                                <tr>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Código</th>
                                    <th className="p-4">Proveedor</th>
                                    {canViewCost && <th className="p-4">Costo Base</th>}
                                    <th className="p-4">Precio Venta</th>
                                    <th className="p-4 text-center">Disponibilidad</th>
                                    {canManageCatalog && <th className="p-4 text-center">Acciones</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredProducts.map(p => {
                                    const totalStock = getTotalStock(batches, p.id);
                                    const isLowStock = totalStock < LOW_STOCK_THRESHOLD;

                                    // Check for expiring batches
                                    const today = new Date();
                                    const warningDate = new Date();
                                    warningDate.setDate(today.getDate() + ALERT_DAYS);

                                    const hasExpiringBatches = batches.some(b => {
                                        if (b.productId !== p.id || b.quantity <= 0) return false;
                                        const expiry = new Date(b.expiryDate);
                                        return expiry <= warningDate;
                                    });

                                    // Priority: Low Stock (Red) > Expiring (Orange/Yellow)
                                    const rowClass = isLowStock
                                        ? 'bg-red-50 hover:bg-red-100 border-red-500'
                                        : hasExpiringBatches
                                            ? 'bg-orange-50 hover:bg-orange-100 border-orange-400'
                                            : 'hover:bg-gray-50 border-transparent';

                                    return (
                                        <tr key={p.id} className={`group transition-colors border-l-4 ${rowClass}`}>
                                            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                                                {p.name}
                                                {isLowStock && (
                                                    <span title="Stock Bajo">
                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                    </span>
                                                )}
                                                {!isLowStock && hasExpiringBatches && (
                                                    <span title={`Lote vence en menos de ${ALERT_DAYS} días`}>
                                                        <span className="cursor-help" title="Vencimiento Cercano">
                                                            <Clock className="w-4 h-4 text-orange-500" />
                                                        </span>
                                                    </span>
                                                )}
                                                {p.isPack && (
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-200">PACK</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-gray-500 font-mono text-xs">{p.barcode}</td>
                                            <td className="p-4 text-gray-500 text-xs">
                                                {suppliers.find(s => s.id === p.supplierId)?.name || '-'}
                                            </td>
                                            {canViewCost && <td className="p-4 text-gray-500">${p.cost}</td>}
                                            <td className="p-4 font-bold text-gray-800">${p.price}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${isLowStock ? 'bg-white text-red-600 border-red-200' : hasExpiringBatches ? 'bg-white text-orange-600 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                    {totalStock} un.
                                                </span>
                                            </td>
                                            {canManageCatalog && (
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleEditProduct(p)}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mr-1"
                                                        title="Editar Producto"
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm(`¿Estás seguro de eliminar "${p.name}"? Esta acción no se puede deshacer.`)) {
                                                                onDeleteProduct(p.id);
                                                            }
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Eliminar Producto"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VIEW: LOGISTICS (STOCK ENTRY) --- */}
            {activeTab === 'logistics' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">

                    {/* Stock Operations Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-1 h-fit">

                        {/* Toggle Mode */}
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button
                                onClick={() => setLogisticsMode('entry')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${logisticsMode === 'entry' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ArrowDownCircle className="w-4 h-4" /> Ingreso
                            </button>
                            <button
                                onClick={() => setLogisticsMode('exit')}
                                className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${logisticsMode === 'exit' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ArrowDownCircle className="w-4 h-4 rotate-180" /> Egreso
                            </button>
                        </div>

                        {logisticsMode === 'entry' ? (
                            <div className="space-y-5 animate-in fade-in">
                                <div className="flex items-center gap-2 mb-2 text-blue-800">
                                    <h3 className="font-bold">Ingreso de Mercadería</h3>
                                </div>
                                {/* Scanner Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                        <span>Escanear Código</span>
                                        <Scan className="w-4 h-4 text-blue-500" />
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Haga clic y escanee..."
                                        className="w-full border-2 border-blue-100 p-3 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-gray-900 bg-white"
                                        onKeyDown={handleBarcodeScan}
                                        autoFocus
                                    />
                                </div>

                                <div className="border-t border-gray-100 pt-4">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto Seleccionado</label>
                                    <select
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                                        value={selectedProductId}
                                        onChange={e => setSelectedProductId(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad a Ingresar</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold bg-white text-gray-900"
                                        placeholder="0"
                                        value={entryQuantity}
                                        onChange={e => setEntryQuantity(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nro. de Lote</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900"
                                            placeholder="L-000"
                                            value={entryBatchNumber}
                                            onChange={e => setEntryBatchNumber(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vencimiento</label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 text-xs"
                                                value={entryExpiry}
                                                onChange={e => setEntryExpiry(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleStockEntry}
                                    disabled={isSubmitting}
                                    className={`w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" /> Confirmar Ingreso
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-5 animate-in fade-in">
                                <div className="flex items-center gap-2 mb-2 text-red-800">
                                    <h3 className="font-bold">Egreso / Ajuste de Stock</h3>
                                </div>
                                <p className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                                    Esto descontará stock del inventario (FIFO). No afecta a la caja ni ventas.
                                </p>

                                {/* Scanner Input for Exit */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex justify-between">
                                        <span>Escanear Código</span>
                                        <Scan className="w-4 h-4 text-red-500" />
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Haga clic y escanee..."
                                        className="w-full border-2 border-red-100 p-3 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-gray-900 bg-white"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const scannedCode = (e.currentTarget as HTMLInputElement).value;
                                                const product = products.find(p => p.barcode === scannedCode);
                                                if (product) {
                                                    setExitProductId(product.id);
                                                    (e.currentTarget as HTMLInputElement).value = '';
                                                } else {
                                                    alert("Producto no encontrado con ese código.");
                                                }
                                            }
                                        }}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Producto</label>
                                    <select
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                                        value={exitProductId}
                                        onChange={e => setExitProductId(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad a Retirar</label>
                                    <input
                                        type="number"
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-lg font-bold bg-white text-gray-900"
                                        placeholder="0"
                                        value={exitQuantity}
                                        onChange={e => setExitQuantity(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Motivo / Razón</label>
                                    <select
                                        className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-red-500 outline-none bg-white text-gray-900"
                                        value={exitReason}
                                        onChange={e => setExitReason(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar Motivo --</option>
                                        <option value="Merma">Merma</option>
                                        <option value="Vencimiento">Vencimiento</option>
                                        <option value="Rotura/Daño">Rotura / Daño</option>
                                        <option value="Robo/Pérdida">Robo / Pérdida</option>
                                        <option value="Consumo Interno">Consumo Interno</option>
                                        <option value="Ajuste de Inventario">Ajuste de Inventario</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>

                                <button
                                    onClick={handleStockExit}
                                    disabled={isSubmitting}
                                    className={`w-full bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-5 h-5" /> Confirmar Egreso
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Current Stock Snapshot */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden flex flex-col">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-500" /> Stock Actual por Lotes
                        </h3>
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600 sticky top-0">
                                    <tr>
                                        <th className="p-3">Producto</th>
                                        <th className="p-3">Lote</th>
                                        <th className="p-3">Vencimiento</th>
                                        <th className="p-3 text-right">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(batches || []).filter(b => b.quantity > 0).map(b => {
                                        const product = products.find(p => p.id === b.productId);
                                        return (
                                            <tr key={b.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-900">{product?.name || 'Producto Eliminado'}</td>
                                                <td className="p-3 font-mono text-gray-500 text-xs">{b.batchNumber}</td>
                                                <td className="p-3 text-gray-500">{new Date(b.expiryDate).toLocaleDateString()}</td>
                                                <td className="p-3 text-right font-bold text-gray-800">{b.quantity}</td>
                                            </tr>
                                        );
                                    })}
                                    {(batches || []).filter(b => b.quantity > 0).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-gray-400">No hay stock disponible.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: HISTORY --- */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800">Historial de Movimientos de Stock</h3>
                                    <p className="text-xs text-gray-500">Registro de todos los lotes ingresados y movimientos.</p>
                                </div>
                                {/* Results Counter */}
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-700">
                                        {filteredHistory.length} {filteredHistory.length === 1 ? 'resultado' : 'resultados'}
                                    </p>
                                    <p className="text-xs text-gray-500 mb-1">de {historyData.length} total</p>
                                    <div className="bg-blue-50 px-2 py-1 rounded border border-blue-100 mt-1">
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Costo Total</p>
                                        <p className="text-sm font-bold text-blue-700">
                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return sum + (item.quantity * (product?.cost || 0));
                                            }, 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="bg-green-50 px-2 py-1 rounded border border-green-100 mt-1">
                                        <p className="text-[10px] text-green-600 font-bold uppercase">Suma Venta</p>
                                        <p className="text-sm font-bold text-green-700">
                                            ${filteredHistory.reduce((sum, item) => {
                                                const product = products.find(p => p.id === item.productId);
                                                return sum + (item.quantity * (product?.price || 0));
                                            }, 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Filters Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                {/* Product Search */}
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Buscar Producto</label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full border border-gray-300 rounded pl-7 pr-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            placeholder="Nombre..."
                                            value={historyProductSearch}
                                            onChange={e => setHistoryProductSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Date Range */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historyStartDate}
                                        onChange={e => setHistoryStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historyEndDate}
                                        onChange={e => setHistoryEndDate(e.target.value)}
                                    />
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historyTypeFilter}
                                        onChange={e => setHistoryTypeFilter(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="IN">Ingreso</option>
                                        <option value="OUT">Egreso</option>
                                    </select>
                                </div>

                                {/* Supplier Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historySupplierFilter}
                                        onChange={e => setHistorySupplierFilter(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {suppliers.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Reason Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Motivo</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historyReasonFilter}
                                        onChange={e => setHistoryReasonFilter(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        <option value="Venta">Venta</option>
                                        <option value="Consumo Interno">Consumo Interno</option>
                                        <option value="Merma">Merma</option>
                                        <option value="Vencimiento">Vencimiento</option>
                                        <option value="Rotura">Rotura / Daño</option>
                                        <option value="Robo">Robo / Pérdida</option>
                                        <option value="Ajuste">Ajuste de Inventario</option>
                                        <option value="Lote">Ingreso de Lote</option>
                                        <option value="Granel">Venta (Granel)</option>
                                    </select>
                                </div>

                                {/* User Filter */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Usuario</label>
                                    <select
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                        value={historyUserFilter}
                                        onChange={e => setHistoryUserFilter(e.target.value)}
                                    >
                                        <option value="">Todos</option>
                                        {systemUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                {(historyStartDate || historyEndDate || historySupplierFilter || historyTypeFilter || historyReasonFilter || historyProductSearch || historyUserFilter) && (
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => {
                                                setHistoryStartDate('');
                                                setHistoryEndDate('');
                                                setHistorySupplierFilter('');
                                                setHistoryTypeFilter('');
                                                setHistoryReasonFilter('');
                                                setHistoryProductSearch('');
                                                setHistoryUserFilter('');
                                            }}
                                            className="w-full px-3 py-1 text-xs text-white bg-red-500 hover:bg-red-600 rounded font-medium transition-colors"
                                        >
                                            Limpiar Filtros
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4">Producto</th>
                                    <th className="p-4">Proveedor</th>
                                    <th className="p-4">Detalle / Motivo</th>
                                    <th className="p-4">Usuario</th>
                                    <th className="p-4 text-right">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedHistory.length > 0 ? (
                                    paginatedHistory.map(item => {
                                        const product = products.find(p => p.id === item.productId);
                                        const supplier = suppliers.find(s => s.id === product?.supplierId);
                                        const user = systemUsers.find(u => u.id === item.userId);
                                        const isOut = item.type === 'OUT';
                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4 text-gray-500">
                                                    {new Date(item.date).toLocaleDateString()} <span className="text-[10px] ml-1 text-gray-400">{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${isOut ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                                        {isOut ? 'EGRESO' : 'INGRESO'}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-gray-900">
                                                    {item.productName || product?.name || 'Producto Desconocido'}
                                                    {item.isBulk && <span className="ml-2 text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">GRANEL</span>}
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs">{supplier?.name || '-'}</td>
                                                <td className="p-4 text-gray-600 text-xs">{item.detail}</td>
                                                <td className="p-4 text-gray-600 text-xs">
                                                    {user?.name || item.userId || '-'}
                                                </td>
                                                <td className={`p-4 text-right font-bold ${isOut ? 'text-red-600' : 'text-green-600'}`}>
                                                    {isOut ? '-' : '+'}{item.quantity}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400 italic">No se encontraron movimientos con los filtros seleccionados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                disabled={historyPage === 1}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${historyPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Anterior
                            </button>
                            <span className="text-xs text-gray-600 font-medium">
                                Página {historyPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setHistoryPage(p => Math.min(totalPages, p + 1))}
                                disabled={historyPage === totalPages}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${historyPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* --- VIEW: BULK PRODUCTS --- */}
            {activeTab === 'bulk' && (
                <BulkProductsManager
                    bulkProducts={bulkProducts || []}
                    suppliers={suppliers}
                    onAdd={onAddBulkProduct || (() => { })}
                    onUpdate={onUpdateBulkProduct || (() => { })}
                    onDelete={onDeleteBulkProduct || (() => { })}
                />
            )}

            {/* --- ADD/EDIT PRODUCT MODAL --- */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{editingProduct ? 'Editar Producto' : 'Nuevo Producto al Catálogo'}</h3>
                            <button onClick={() => { setShowAddForm(false); setEditingProduct(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">

                            {/* --- IMAGE UPLOAD SECTION --- */}
                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <div className="relative w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex items-center justify-center border border-gray-300">
                                    {isUploadingImage ? (
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    ) : newProd.image_url ? (
                                        <img src={newProd.image_url} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-gray-400" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen del Producto</label>
                                    <div className="flex gap-2">
                                        <label className="cursor-pointer bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-sm">
                                            <UploadCloud className="w-4 h-4" />
                                            {newProd.image_url ? 'Cambiar Imagen' : 'Subir Imagen'}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageUpload}
                                                disabled={isUploadingImage}
                                            />
                                        </label>
                                        {newProd.image_url && (
                                            <button
                                                onClick={() => setNewProd({ ...newProd, image_url: undefined })}
                                                className="text-red-500 hover:text-red-700 text-xs underline"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Recomendado: Formato cuadrado. Se comprimirá automáticamente a WebP.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Producto</label>
                                <input
                                    className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Ej: Coca Cola 2.25L"
                                    value={newProd.name}
                                    onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Barras</label>
                                    <div className="relative">
                                        <input
                                            className="w-full border border-gray-300 p-2 pl-8 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                            placeholder="779..."
                                            value={newProd.barcode}
                                            onChange={e => setNewProd({ ...newProd, barcode: e.target.value })}
                                        />
                                        <Scan className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                    <select
                                        className="w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        value={newProd.supplierId}
                                        onChange={e => setNewProd({ ...newProd, supplierId: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Base</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full border border-gray-300 p-2 pl-6 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={newProd.cost}
                                            onChange={e => setNewProd({ ...newProd, cost: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Margen %</label>
                                    <input
                                        type="number"
                                        className={`w-full border border-gray-300 p-2 rounded bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none ${isManualPrice ? 'bg-gray-100 text-gray-500' : ''}`}
                                        value={newProd.profitMargin}
                                        onChange={e => setNewProd({ ...newProd, profitMargin: parseFloat(e.target.value) || 0 })}
                                        disabled={isManualPrice}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Precio Final</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-blue-500 font-bold">$</span>
                                        <input
                                            type="number"
                                            className={`w-full border-2 border-blue-100 p-2 pl-6 rounded focus:border-blue-500 outline-none font-bold bg-white text-blue-800 ${isManualPrice ? '' : 'bg-blue-50 cursor-not-allowed'}`}
                                            value={newProd.price}
                                            onChange={e => setNewProd({ ...newProd, price: parseFloat(e.target.value) || 0 })}
                                            readOnly={!isManualPrice}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    id="manualPrice"
                                    checked={isManualPrice}
                                    onChange={e => setIsManualPrice(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label htmlFor="manualPrice" className="text-sm text-gray-600 select-none">Fijar Precio Manualmente (Ignorar Margen)</label>
                            </div>

                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                    <input
                                        type="checkbox"
                                        id="isPack"
                                        className="w-4 h-4 text-purple-600 rounded"
                                        checked={newProd.isPack}
                                        onChange={e => setNewProd({ ...newProd, isPack: e.target.checked })}
                                    />
                                    <label htmlFor="isPack" className="text-sm font-bold text-purple-800 select-none">¿Es un Pack / Bulto?</label>
                                </div>

                                {newProd.isPack && (
                                    <div className="grid grid-cols-2 gap-4 mt-3 animate-in fade-in">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contiene (Hijo)</label>
                                            <select
                                                className="w-full border border-gray-300 p-2 rounded text-xs bg-white text-gray-900"
                                                value={newProd.childProductId || ''}
                                                onChange={e => setNewProd({ ...newProd, childProductId: e.target.value })}
                                            >
                                                <option value="">Seleccionar Unidad...</option>
                                                {(products || []).filter(p => !p.isPack).map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad Unidades</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-300 p-2 rounded text-xs bg-white text-gray-900"
                                                placeholder="Ej: 6"
                                                value={newProd.childQuantity || ''}
                                                onChange={e => setNewProd({ ...newProd, childQuantity: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleCreateProduct}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                            >
                                {editingProduct ? 'Guardar Cambios' : 'Guardar Producto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* --- IMPORT CSV MODAL --- */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Importar Productos (CSV)</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                                <p className="font-bold mb-2">Instrucciones:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>El archivo debe ser formato <strong>.csv</strong></li>
                                    <li>Debe tener las siguientes columnas en este orden:</li>
                                </ul>
                                <div className="mt-3 bg-white p-3 rounded border border-blue-200 font-mono text-xs overflow-x-auto">
                                    Nombre, CodigoBarras, Costo, Precio, Cantidad, Proveedor
                                </div>
                                <p className="mt-2 text-xs text-blue-600">
                                    * La primera fila se ignora si contiene "Nombre".<br />
                                    * El separador debe ser coma (,).
                                </p>
                            </div>

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                <FileText className="w-10 h-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium text-gray-600">Haga clic para seleccionar archivo</p>
                                <p className="text-xs text-gray-400 mt-1">o arrastre y suelte aquí</p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        handleImportCSV(e);
                                        setShowImportModal(false);
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component for Bulk Products
const BulkProductsManager: React.FC<{
    bulkProducts: any[],
    suppliers: Supplier[],
    onAdd: (p: any) => void,
    onUpdate: (p: any) => void,
    onDelete: (id: string) => void
}> = ({ bulkProducts, suppliers, onAdd, onUpdate, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false); // NEW
    const [editing, setEditing] = useState<any | null>(null);
    const [selectedForStock, setSelectedForStock] = useState<any | null>(null); // NEW
    const [stockEntryKg, setStockEntryKg] = useState(''); // NEW
    const [form, setForm] = useState({ name: '', barcode: '', supplierId: '', costPerBulk: 0, weightPerBulk: 0, pricePerKg: 0, stockKg: 0 });

    const handleEdit = (p: any) => {
        setEditing(p);
        setForm({
            name: p.name,
            barcode: p.barcode || '',
            supplierId: p.supplierId || '',
            costPerBulk: p.costPerBulk,
            weightPerBulk: p.weightPerBulk,
            pricePerKg: p.pricePerKg,
            stockKg: p.stockKg
        });
        setShowModal(true);
    };

    const handleOpenStock = (p: any) => {
        setSelectedForStock(p);
        setStockEntryKg('');
        setShowStockModal(true);
    };

    const handleAddStock = () => {
        if (!selectedForStock || !stockEntryKg) return;
        const bulks = parseFloat(stockEntryKg);
        if (isNaN(bulks) || bulks <= 0) {
            alert("Ingrese una cantidad válida.");
            return;
        }

        const totalKgToAdd = bulks * selectedForStock.weightPerBulk;

        const updatedProduct = {
            ...selectedForStock,
            stockKg: selectedForStock.stockKg + totalKgToAdd
        };
        onUpdate(updatedProduct);

        // Register movement for traceability
        const movement = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            productId: selectedForStock.id,
            productName: selectedForStock.name,
            quantity: totalKgToAdd,
            reason: `Ingreso Granel (${stockEntryKg} bultos de ${selectedForStock.weightPerBulk} Kg)`,
            detail: `Ingreso Granel (${stockEntryKg} bultos de ${selectedForStock.weightPerBulk} Kg)`,
            type: 'IN' as const,
            userId: useStore.getState().currentUser?.id || 'unknown'
        };
        useStore.getState().addStockMovement(movement);

        setShowStockModal(false);
        setSelectedForStock(null);
        setStockEntryKg('');
        alert(`Se agregaron ${bulks} bultos (${totalKgToAdd.toFixed(3)} Kg) al stock de ${selectedForStock.name}.`);
    };

    const handleSave = () => {
        if (!form.name || form.costPerBulk <= 0 || form.weightPerBulk <= 0 || form.pricePerKg <= 0) {
            alert("Complete todos los campos correctamente.");
            return;
        }

        const product = {
            id: editing ? editing.id : crypto.randomUUID(),
            name: form.name,
            barcode: form.barcode,
            supplierId: form.supplierId,
            costPerBulk: form.costPerBulk,
            weightPerBulk: form.weightPerBulk,
            pricePerKg: form.pricePerKg,
            stockKg: editing ? form.stockKg : 0 // New products start with 0 stock
        };

        if (editing) onUpdate(product);
        else onAdd(product);

        setShowModal(false);
        setEditing(null);
        setForm({ name: '', barcode: '', supplierId: '', costPerBulk: 0, weightPerBulk: 0, pricePerKg: 0, stockKg: 0 });
    };

    // Calculate cost per kg for display
    const costPerKg = form.costPerBulk > 0 && form.weightPerBulk > 0 ? (form.costPerBulk / form.weightPerBulk) : 0;

    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h3 className="font-bold text-gray-800">Productos a Granel / Pesables</h3>
                    <p className="text-xs text-gray-500">Gestione productos que se venden por peso (Kg).</p>
                </div>
                <button
                    onClick={() => { setEditing(null); setForm({ name: '', barcode: '', supplierId: '', costPerBulk: 0, weightPerBulk: 0, pricePerKg: 0, stockKg: 0 }); setShowModal(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Nuevo Granel
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
                        <tr>
                            <th className="p-4">Producto</th>
                            <th className="p-4">Proveedor</th>
                            <th className="p-4">Costo Bulto</th>
                            <th className="p-4">Peso Bulto</th>
                            <th className="p-4">Costo x Kg</th>
                            <th className="p-4">Precio Venta x Kg</th>
                            <th className="p-4 text-center">Stock (Kg)</th>
                            <th className="p-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {bulkProducts.map(p => {
                            const supplier = suppliers.find(s => s.id === p.supplierId);
                            return (
                                <tr key={p.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{p.name}</td>
                                    <td className="p-4 text-gray-500 text-xs">{supplier?.name || '-'}</td>
                                    <td className="p-4 text-gray-500">${p.costPerBulk}</td>
                                    <td className="p-4 text-gray-500">{p.weightPerBulk} Kg</td>
                                    <td className="p-4 text-gray-500">${(p.costPerBulk / p.weightPerBulk).toFixed(2)}</td>
                                    <td className="p-4 font-bold text-gray-800">${p.pricePerKg}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${p.stockKg < 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                            {p.stockKg.toFixed(3)} Kg
                                        </span>
                                    </td>
                                    <td className="p-4 text-center flex items-center justify-center gap-1">
                                        <button onClick={() => handleOpenStock(p)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Ingresar Stock"><ArrowDownCircle className="w-4 h-4" /></button>
                                        <button onClick={() => handleEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Editar"><FileText className="w-4 h-4" /></button>
                                        <button onClick={() => { if (confirm('¿Eliminar?')) onDelete(p.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Eliminar"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit/Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Granel' : 'Nuevo Producto a Granel'}</h3>
                            <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                <input className="w-full border p-2 rounded" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                <select className="w-full border p-2 rounded bg-white text-gray-900" value={form.supplierId} onChange={e => setForm({ ...form, supplierId: e.target.value })}>
                                    <option value="">Seleccionar...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo del Bulto ($)</label>
                                <input type="number" className="w-full border p-2 rounded" value={form.costPerBulk} onChange={e => setForm({ ...form, costPerBulk: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Peso del Bulto (Kg)</label>
                                <input type="number" className="w-full border p-2 rounded" value={form.weightPerBulk} onChange={e => setForm({ ...form, weightPerBulk: parseFloat(e.target.value) || 0 })} />
                            </div>
                            <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                                Costo calculado por Kg: <b>${costPerKg.toFixed(2)}</b>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Precio Venta x Kg ($)</label>
                                <input type="number" className="w-full border-2 border-blue-100 p-2 rounded font-bold text-blue-800" value={form.pricePerKg} onChange={e => setForm({ ...form, pricePerKg: parseFloat(e.target.value) || 0 })} />
                            </div>
                            {editing && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Actual (Kg)</label>
                                    <input type="number" className="w-full border p-2 rounded" value={form.stockKg} onChange={e => setForm({ ...form, stockKg: parseFloat(e.target.value) || 0 })} />
                                </div>
                            )}
                            <button onClick={handleSave} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">Guardar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Entry Modal */}
            {showStockModal && selectedForStock && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Ingresar Stock (Bultos)</h3>
                            <button onClick={() => setShowStockModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">Producto: <b>{selectedForStock.name}</b></p>

                        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-xs text-blue-800">
                            <p>Peso por bulto configurado: <b>{selectedForStock.weightPerBulk} Kg</b></p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad de Bultos / Cajas</label>
                            <input
                                type="number"
                                autoFocus
                                className="w-full border-2 border-green-100 p-3 rounded-xl focus:border-green-500 outline-none text-xl font-bold text-center"
                                placeholder="0"
                                value={stockEntryKg} // We reuse this state variable for "quantity of bulks"
                                onChange={e => setStockEntryKg(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter') handleAddStock(); }}
                            />
                        </div>

                        {stockEntryKg && !isNaN(parseFloat(stockEntryKg)) && (
                            <div className="mb-4 text-center">
                                <p className="text-sm text-gray-600">
                                    Total a ingresar: <span className="font-bold text-green-600 text-lg">{(parseFloat(stockEntryKg) * selectedForStock.weightPerBulk).toFixed(3)} Kg</span>
                                </p>
                            </div>
                        )}

                        <button onClick={handleAddStock} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">Confirmar Ingreso</button>
                    </div>
                </div>
            )}
        </div>
    );
};
