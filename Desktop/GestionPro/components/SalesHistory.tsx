
import React, { useState, useMemo } from 'react';
import { Sale, User } from '../types';
import { Filter, Calendar, CreditCard, Search, ChevronDown, Download } from 'lucide-react';

interface SalesHistoryProps {
  sales: Sale[];
  users: User[];
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'all';

export const SalesHistory: React.FC<SalesHistoryProps> = ({ sales, users }) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // --- 4. SALES HISTORY: DYNAMIC QUERY BUILDER ---
  const filteredSales = useMemo(() => {
    return (sales || []).filter(sale => {
      const saleDate = new Date(sale.date);
      const today = new Date();

      // 1. Time Filter
      let dateMatch = true;
      if (dateFilter === 'today') {
        dateMatch = saleDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'yesterday') {
        const yest = new Date(today);
        yest.setDate(yest.getDate() - 1);
        dateMatch = saleDate.toDateString() === yest.toDateString();
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateMatch = saleDate >= weekAgo;
      } else if (dateFilter === 'month') {
        dateMatch = saleDate.getMonth() === today.getMonth() && saleDate.getFullYear() === today.getFullYear();
      }

      // 2. User Filter (Assuming sales could track userID, currently simulated)
      const userMatch = selectedUser === 'all' || true; // In real app, check sale.userId

      // 3. Payment Filter
      const paymentMatch = paymentFilter === 'all' || sale.paymentMethodName === paymentFilter;

      // 4. Product Content Filter (Search)
      const contentMatch = searchTerm === '' || sale.items.some(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

      return dateMatch && userMatch && paymentMatch && contentMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, dateFilter, selectedUser, paymentFilter, searchTerm]);

  const totalFiltered = filteredSales.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Sidebar Filters */}
      <div className="w-full lg:w-64 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-6 shrink-0 h-fit">
        <div className="flex items-center gap-2 text-gray-800 font-bold border-b pb-2">
          <Filter className="w-5 h-5 text-blue-600" /> Filtros Dinámicos
        </div>

        {/* Date Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Periodo
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDateFilter('today')} className={`px-2 py-1.5 text-xs rounded border ${dateFilter === 'today' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50'}`}>Hoy</button>
            <button onClick={() => setDateFilter('yesterday')} className={`px-2 py-1.5 text-xs rounded border ${dateFilter === 'yesterday' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50'}`}>Ayer</button>
            <button onClick={() => setDateFilter('week')} className={`px-2 py-1.5 text-xs rounded border ${dateFilter === 'week' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50'}`}>7 Días</button>
            <button onClick={() => setDateFilter('month')} className={`px-2 py-1.5 text-xs rounded border ${dateFilter === 'month' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50'}`}>Este Mes</button>
          </div>
          <button onClick={() => setDateFilter('all')} className={`w-full px-2 py-1.5 text-xs rounded border ${dateFilter === 'all' ? 'bg-blue-100 border-blue-300 text-blue-700 font-bold' : 'bg-gray-50'}`}>Todo el Historial</button>
        </div>

        {/* Payment Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <CreditCard className="w-3 h-3" /> Medio de Pago
          </label>
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value)}
            className="w-full text-sm border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none"
          >
            <option value="all">Todos</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Mercado Pago">Mercado Pago</option>
            <option value="Débito">Débito</option>
            <option value="Crédito (Visa/Master)">Crédito</option>
          </select>
        </div>

        {/* Search Filter */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
            <Search className="w-3 h-3" /> Producto
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full text-sm border p-2 rounded bg-gray-50 focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-800">Resultados de la Búsqueda</h2>
            <p className="text-xs text-gray-500">{filteredSales.length} operaciones encontradas</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Filtrado</p>
            <p className="text-2xl font-black text-blue-600">${totalFiltered.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-600 sticky top-0 z-10">
              <tr>
                <th className="p-3">ID / Hora</th>
                <th className="p-3">Productos</th>
                <th className="p-3">Pago</th>
                <th className="p-3 text-right">Monto</th>
                <th className="p-3 text-center">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 group">
                  <td className="p-3">
                    <div className="font-mono text-xs text-gray-400">#{sale.id.slice(0, 6)}</div>
                    <div className="text-gray-800 font-medium">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-[10px] text-gray-400">{new Date(sale.date).toLocaleDateString()}</div>
                  </td>
                  <td className="p-3 max-w-xs">
                    <div className="truncate text-gray-800" title={sale.items.map(i => i.name).join(', ')}>
                      {sale.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </div>
                    <div className="text-[10px] text-gray-400">{sale.items.length} items</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs font-medium">
                      {sale.paymentMethodName}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-gray-900">
                    ${sale.total.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <button className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors" title="Ver Ticket">
                      <Download className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
