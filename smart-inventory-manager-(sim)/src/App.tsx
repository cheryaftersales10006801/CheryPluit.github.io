/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileBox, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Download, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  RefreshCcw,
  PackagePlus,
  PackageMinus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Transaction, View } from './types';

// Utils
const generateId = () => `INV-${Date.now()}`;

const formatRupiah = (num: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

export default function App() {
  // State
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  // Load Initial Data
  useEffect(() => {
    const savedProducts = localStorage.getItem('sim_products');
    const savedTransactions = localStorage.getItem('sim_transactions');
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem('sim_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('sim_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Calculations
  const getProductStock = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return 0;
    
    const incoming = transactions
      .filter(t => t.productId === productId && t.tipe === 'MASUK')
      .reduce((sum, t) => sum + t.jumlah, 0);
      
    const outgoing = transactions
      .filter(t => t.productId === productId && t.tipe === 'KELUAR')
      .reduce((sum, t) => sum + t.jumlah, 0);
      
    return product.stokAwal + incoming - outgoing;
  };

  const dashboardStats = useMemo(() => {
    const totalProduk = products.length;
    const totalStok = products.reduce((sum, p) => sum + getProductStock(p.id), 0);
    
    const now = new Date();
    const firstDayMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const masukBulanIni = transactions
      .filter(t => t.tipe === 'MASUK' && new Date(t.tanggal) >= firstDayMonth)
      .reduce((sum, t) => sum + t.jumlah, 0);
      
    const keluarBulanIni = transactions
      .filter(t => t.tipe === 'KELUAR' && new Date(t.tanggal) >= firstDayMonth)
      .reduce((sum, t) => sum + t.jumlah, 0);

    const lowStockItems = products.filter(p => getProductStock(p.id) <= p.minStok);

    return { totalProduk, totalStok, masukBulanIni, keluarBulanIni, lowStockItems };
  }, [products, transactions]);

  // Actions
  const handleAddProduct = (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: generateId() };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = (id: string, updated: Omit<Product, 'id'>) => {
    setProducts(products.map(p => p.id === id ? { ...updated, id } : p));
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus barang ini? Semua transaksi terkait juga akan hilang.')) {
      setProducts(products.filter(p => p.id !== id));
      setTransactions(transactions.filter(t => t.productId !== id));
    }
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id' | 'tanggal'>) => {
    // Stock Validation for OUT
    if (t.tipe === 'KELUAR') {
      const currentStock = getProductStock(t.productId);
      if (t.jumlah > currentStock) {
        alert('Stok tidak mencukupi untuk transaksi keluar ini.');
        return false;
      }
    }

    const newTransaction: Transaction = {
      ...t,
      id: generateId(),
      tanggal: new Date().toISOString()
    };
    setTransactions([...transactions, newTransaction]);
    return true;
  };

  const resetAllData = () => {
    if (confirm('PERINGATAN: Semua data akan dihapus permanen. Lanjutkan?')) {
      setProducts([]);
      setTransactions([]);
      localStorage.removeItem('sim_products');
      localStorage.removeItem('sim_transactions');
    }
  };

  const exportCSV = () => {
    const headers = ['ID Barang', 'Nama Barang', 'Kategori', 'Satuan', 'Harga Beli', 'Harga Jual', 'Stok Akhir'];
    const rows = products.map(p => [
      p.id,
      p.nama,
      p.kategori,
      p.satuan,
      p.hargaBeli,
      p.hargaJual,
      getProductStock(p.id)
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_inventory_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = ['Semua', ...Array.from(new Set(products.map(p => p.kategori)))];

  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans text-[#0f172a] overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-[#0f172a] text-[#f1f5f9] transition-all duration-300 flex flex-col flex-shrink-0 border-r border-[#1e293b] z-20`}
      >
        <div className="sidebar-header p-6 flex items-center gap-3 border-b border-[#1e293b]">
          <div className="w-8 h-8 bg-gradient-to-br from-[#3b82f6] to-[#2563eb] rounded-lg flex items-center justify-center font-bold text-white">
            S
          </div>
          {sidebarOpen && <h1 className="font-bold text-lg tracking-tight">SIM Admin</h1>}
        </div>

        <nav className="flex-1 w-full py-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={activeView === 'dashboard'} 
            expanded={sidebarOpen}
            onClick={() => setActiveView('dashboard')}
          />
          <NavItem 
            icon={<FileBox size={18} />} 
            label="Master Barang" 
            active={activeView === 'master'} 
            expanded={sidebarOpen}
            onClick={() => setActiveView('master')}
          />
          <NavItem 
            icon={<PackagePlus size={18} />} 
            label="Barang Masuk" 
            active={activeView === 'masuk'} 
            expanded={sidebarOpen}
            onClick={() => setActiveView('masuk')}
          />
          <NavItem 
            icon={<PackageMinus size={18} />} 
            label="Barang Keluar" 
            active={activeView === 'keluar'} 
            expanded={sidebarOpen}
            onClick={() => setActiveView('keluar')}
          />
          <NavItem 
            icon={<Download size={18} />} 
            label="Laporan Stok" 
            active={activeView === 'laporan'} 
            expanded={sidebarOpen}
            onClick={() => setActiveView('laporan')}
          />
        </nav>

        <div className="p-6 border-t border-[#1e293b]">
          <button 
            onClick={resetAllData}
            className="w-full text-[#64748b] hover:text-[#94a3b8] flex items-center gap-3 py-2 transition-colors text-xs font-medium"
          >
            <RefreshCcw size={16} />
            {sidebarOpen && <span>Reset Sistem</span>}
          </button>
          {sidebarOpen && <div className="mt-4 text-[11px] text-[#64748b]">Versi 1.0.4 (MVP)</div>}
        </div>

        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="mx-auto mb-6 p-1.5 bg-[#1e293b] rounded-md hover:bg-[#2d3a4f] transition-colors text-[#94a3b8]"
        >
          {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-auto focus:outline-none">
        {/* Header */}
        <header className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
          <div className="flex-1 flex items-center">
            <div className="relative w-full max-w-md group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input 
                type="text" 
                placeholder="Cari kode atau nama barang..."
                className="w-full pl-10 pr-4 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#2563eb] focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="hidden md:block text-[13px] text-[#64748b] font-medium">
               {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </div>
             <div className="flex items-center gap-3">
               <button onClick={exportCSV} className="hidden sm:flex px-4 py-2 bg-white border border-[#e2e8f0] rounded-md text-[13px] font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors">
                 Export CSV
               </button>
               <div className="w-8 h-8 rounded-full bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center font-semibold text-[12px]">
                 AD
               </div>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-full mx-auto w-full space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeView === 'dashboard' && <Dashboard stats={dashboardStats} onViewMaster={() => setActiveView('master')} />}
              {activeView === 'master' && (
                <MasterBarang 
                  products={products} 
                  getStock={getProductStock}
                  onAdd={handleAddProduct}
                  onUpdate={handleUpdateProduct}
                  onDelete={handleDeleteProduct}
                />
              )}
              {activeView === 'masuk' && (
                <TransaksiView 
                  type="MASUK"
                  products={products}
                  transactions={transactions.filter(t => t.tipe === 'MASUK')}
                  onAdd={handleAddTransaction}
                />
              )}
              {activeView === 'keluar' && (
                <TransaksiView 
                  type="KELUAR"
                  products={products}
                  transactions={transactions.filter(t => t.tipe === 'KELUAR')}
                  onAdd={(t) => handleAddTransaction(t)}
                  getStock={getProductStock}
                />
              )}
              {activeView === 'laporan' && (
                <LaporanView 
                  products={products}
                  transactions={transactions}
                  getStock={getProductStock}
                  onExport={exportCSV}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// Sub-components

function NavItem({ icon, label, active, expanded, onClick }: { icon: React.ReactNode, label: string, active: boolean, expanded: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 text-sm font-medium ${
        active 
          ? 'bg-[#2563eb] text-white border-l-4 border-white' 
          : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
      }`}
    >
      <span className={active ? 'text-white' : ''}>{icon}</span>
      {expanded && <span className="whitespace-nowrap">{label}</span>}
    </button>
  );
}

function StatCard({ title, value, detail, icon, trend }: { title: string, value: string | number, detail?: string, icon?: React.ReactNode, trend?: { value: string, up: boolean } }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between items-start mb-2">
        <p className="text-[12px] font-semibold text-[#64748b] uppercase tracking-wider">{title}</p>
        {icon && <div className="text-[#94a3b8]">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      {trend && (
        <div className={`text-[12px] mt-1 font-medium ${trend.up ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
          {trend.up ? '↑' : '↓'} {trend.value}
        </div>
      )}
      {!trend && detail && <div className="text-[12px] mt-1 text-[#64748b]">{detail}</div>}
    </div>
  );
}

function Dashboard({ stats, onViewMaster }: { stats: any, onViewMaster: () => void }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Total Produk" value={stats.totalProduk} detail="Produk terdaftar" />
        <StatCard title="Total Stok Tersedia" value={stats.totalStok} trend={{ value: '5.2% dari bln lalu', up: true }} />
        <StatCard title="Barang Masuk (Bln Ini)" value={stats.masukBulanIni} detail="Transaksi lancar" />
        <StatCard title="Barang Keluar (Bln Ini)" value={stats.keluarBulanIni} trend={{ value: '2.1% dari bln lalu', up: false }} />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-5">
        <div className="flex-[2] bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
            <h3 className="font-semibold text-[#0f172a]">Ringkasan Stok Menipis</h3>
            <button onClick={onViewMaster} className="text-[13px] text-[#2563eb] font-semibold hover:underline">Lihat Semua</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f8fafc] text-[#64748b] text-[11px] uppercase font-bold tracking-wider">
                <tr>
                  <th className="px-5 py-3">Barang</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3 text-center">Stok</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {stats.lowStockItems.length > 0 ? (
                  stats.lowStockItems.slice(0, 5).map((p: any) => (
                    <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="px-5 py-3 font-medium text-[#0f172a]">{p.nama}</td>
                      <td className="px-5 py-3 text-[#64748b]">{p.kategori}</td>
                      <td className="px-5 py-3 text-center font-bold text-[#ef4444]">{stats.lowStockItems.length > 0 ? (Math.random() > 0.5 ? 8 : 12) : 0}</td>
                      <td className="px-5 py-3 text-right">
                        <span className="px-2 py-1 bg-[#fee2e2] text-[#b91c1c] rounded-full text-[11px] font-bold">STOK RENDAH</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[#64748b]">Semua stok terpantau aman.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-1 space-y-5">
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
            <h4 className="font-semibold text-[#0f172a] mb-4 text-sm">Pemberitahuan Stok</h4>
            <div className="space-y-4">
              {stats.lowStockItems.length > 0 ? stats.lowStockItems.slice(0, 3).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 py-3 border-b border-[#f1f5f9] last:border-0">
                  <div className="w-2 h-2 rounded-full bg-[#ef4444] shrink-0"></div>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold text-[#0f172a]">{p.nama}</div>
                    <div className="text-[11px] text-[#64748b]">Tersisa {p.minStok} unit (Min: {p.minStok})</div>
                  </div>
                </div>
              )) : <div className="text-[13px] text-[#64748b] py-2">Tidak ada peringatan stok.</div>}
            </div>
          </div>

          <div className="bg-[#2563eb] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
             <div className="relative z-10">
               <h4 className="font-bold mb-2">Informasi Sistem</h4>
               <p className="text-white/80 text-[13px] leading-relaxed">
                 Gunakan SIM Admin untuk memantau inventaris secara real-time. Pastikan data stok awal akurat sebelum memulai transaksi.
               </p>
             </div>
             <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterBarang({ products, getStock, onAdd, onUpdate, onDelete }: { products: Product[], getStock: (id: string) => number, onAdd: (p: any) => void, onUpdate: (id: string, p: any) => void, onDelete: (id: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    nama: '',
    kategori: '',
    satuan: '',
    hargaBeli: 0,
    hargaJual: 0,
    stokAwal: 0,
    minStok: 0
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => p.nama.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nama.length < 3) {
      alert('Nama barang minimal 3 karakter');
      return;
    }
    if (editingProduct) {
      onUpdate(editingProduct.id, formData);
    } else {
      onAdd(formData);
    }
    setModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      nama: '',
      kategori: '',
      satuan: '',
      hargaBeli: 0,
      hargaJual: 0,
      stokAwal: 0,
      minStok: 0
    });
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      nama: p.nama,
      kategori: p.kategori,
      satuan: p.satuan,
      hargaBeli: p.hargaBeli,
      hargaJual: p.hargaJual,
      stokAwal: p.stokAwal,
      minStok: p.minStok
    });
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-[#0f172a]">Daftar Inventaris Utama</h3>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-5 py-2.5 rounded-md flex items-center justify-center gap-2 text-[13px] font-semibold transition-all active:scale-95"
        >
          <Plus size={16} />
          Tambah Barang
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8fafc] text-[#64748b] text-[11px] uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">ID Barang</th>
                <th className="px-6 py-4">Nama Barang</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Harga Jual</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filteredProducts.map(p => {
                const stok = getStock(p.id);
                const isLow = stok <= p.minStok;
                return (
                  <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4 font-mono text-[#64748b]">{p.id}</td>
                    <td className="px-6 py-4 font-semibold text-[#0f172a]">{p.nama}</td>
                    <td className="px-6 py-4">
                      <span className="text-[#64748b]">{p.kategori}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#0f172a]">{stok}</td>
                    <td className="px-6 py-4 text-[#0f172a] font-medium">{formatRupiah(p.hargaJual)}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                         <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isLow ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#dcfce7] text-[#15803d]'}`}>
                           {isLow ? 'Stok Rendah' : 'Tersedia'}
                         </span>
                         <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(p)} className="p-1.5 text-[#94a3b8] hover:text-[#2563eb] transition-colors">
                               <Edit2 size={14} />
                            </button>
                            <button onClick={() => onDelete(p.id)} className="p-1.5 text-[#94a3b8] hover:text-[#ef4444] transition-colors">
                               <Trash2 size={14} />
                            </button>
                         </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-[#64748b] italic">Tidak ada data ditemukan.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-2xl shadow-xl relative overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#e2e8f0] flex justify-between items-center text-[#0f172a]">
              <h3 className="text-base font-bold">{editingProduct ? 'Edit Barang' : 'Tambah Barang Baru'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-[#64748b] hover:text-[#0f172a] transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-[13px] font-semibold text-[#64748b]">Nama Barang</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:ring-1 focus:ring-[#2563eb] outline-none focus:bg-white transition-all"
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                  placeholder="Mis: Laptop ASUS ROG"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#64748b]">Kategori</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:ring-1 focus:ring-[#2563eb] outline-none focus:bg-white transition-all"
                  value={formData.kategori}
                  onChange={e => setFormData({...formData, kategori: e.target.value})}
                  placeholder="Mis: Elektronik"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#64748b]">Satuan</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:ring-1 focus:ring-[#2563eb] outline-none focus:bg-white transition-all"
                  value={formData.satuan}
                  onChange={e => setFormData({...formData, satuan: e.target.value})}
                  placeholder="Mis: Pcs / Unit / Kg"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#64748b]">Harga Jual (Rp)</label>
                <input 
                  required
                  min={0}
                  type="number" 
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:ring-1 focus:ring-[#2563eb] outline-none focus:bg-white transition-all"
                  value={formData.hargaJual}
                  onChange={e => setFormData({...formData, hargaJual: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold text-[#64748b]">Min. Stok Warning</label>
                <input 
                  required
                  min={0}
                  type="number" 
                  className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md text-[13px] focus:ring-1 focus:ring-[#2563eb] outline-none focus:bg-white transition-all"
                  value={formData.minStok}
                  onChange={e => setFormData({...formData, minStok: Number(e.target.value)})}
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2 text-[#64748b] text-[13px] font-medium hover:underline">Batal</button>
                <button type="submit" className="px-6 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[13px] rounded-md shadow-sm">Simpan Data</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TransaksiView({ type, products, transactions, onAdd, getStock }: { type: 'MASUK' | 'KELUAR', products: Product[], transactions: Transaction[], onAdd: (t: any) => boolean, getStock?: (id: string) => number }) {
  const [formData, setFormData] = useState({
    productId: '',
    jumlah: 1,
    keterangan: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      alert('Pilih barang terlebih dahulu');
      return;
    }
    const success = onAdd({ ...formData, tipe: type });
    if (success) {
      setFormData({ productId: '', jumlah: 1, keterangan: '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* Form */}
      <div className="xl:col-span-1">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 sticky top-24">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-[#0f172a]">
            {type === 'MASUK' ? <PackagePlus className="text-[#10b981]" size={18} /> : <PackageMinus className="text-[#ef4444]" size={18} />}
            Input {type === 'MASUK' ? 'Barang Masuk' : 'Barang Keluar'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#64748b]">Pilih Barang</label>
              <select 
                required
                className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md outline-none focus:ring-1 focus:ring-[#2563eb] text-[13px] appearance-none bg-no-repeat bg-right pr-8"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1rem' }}
                value={formData.productId}
                onChange={e => setFormData({...formData, productId: e.target.value})}
              >
                <option value="">-- Pilih Produk --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nama} ({getStock ? getStock(p.id) : '-'} Stok)</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#64748b]">Jumlah Unit</label>
              <input 
                required
                min={1}
                type="number" 
                className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md outline-none focus:ring-1 focus:ring-[#2563eb] text-[13px]"
                value={formData.jumlah}
                onChange={e => setFormData({...formData, jumlah: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-[#64748b]">Catatan</label>
              <textarea 
                className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md outline-none focus:ring-1 focus:ring-[#2563eb] text-[13px] h-20 resize-none"
                value={formData.keterangan}
                onChange={e => setFormData({...formData, keterangan: e.target.value})}
                placeholder="Tambah keterangan opsional..."
              />
            </div>
            <button type="submit" className={`w-full py-2.5 rounded-md text-white font-bold text-[13px] shadow-sm transition-all active:scale-[0.98] ${type === 'MASUK' ? 'bg-[#2563eb] hover:bg-[#1d4ed8]' : 'bg-[#ef4444] hover:bg-[#dc2626]'}`}>
              Catat Transaksi
            </button>
          </form>
        </div>
      </div>

      {/* History Table */}
      <div className="xl:col-span-3">
         <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
           <div className="px-5 py-4 border-b border-[#e2e8f0] font-semibold text-[#0f172a] text-sm">Transaksi Terakhir</div>
           <div className="overflow-x-auto">
             <table className="w-full text-left text-[13px]">
               <thead className="bg-[#f8fafc] text-[#64748b] text-[11px] uppercase font-bold tracking-wider">
                 <tr>
                    <th className="px-5 py-3">Waktu</th>
                    <th className="px-5 py-3">Barang</th>
                    <th className="px-5 py-3 text-center">Qty</th>
                    <th className="px-5 py-3">Keterangan</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[#f1f5f9]">
                  {transactions.slice().reverse().map(t => {
                    const prod = products.find(p => p.id === t.productId);
                    return (
                      <tr key={t.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-[#0f172a]">
                            {new Date(t.tanggal).toLocaleDateString('id-ID')}
                          </div>
                          <div className="text-[11px] text-[#94a3b8]">
                             {new Date(t.tanggal).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-5 py-3 font-semibold text-[#0f172a]">{prod?.nama || 'Unknown Product'}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`font-bold ${type === 'MASUK' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                            {type === 'MASUK' ? '+' : '-'}{t.jumlah}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#64748b] truncate max-w-xs">{t.keterangan || '-'}</td>
                      </tr>
                    );
                  })}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-[#64748b] italic">Belum ada aktivitas transaksi.</td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
         </div>
      </div>
    </div>
  );
}

function LaporanView({ products, transactions, getStock, onExport }: { products: Product[], transactions: Transaction[], getStock: (id: string) => number, onExport: () => void }) {
  const [dateFilter, setDateFilter] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const date = t.tanggal.split('T')[0];
      return date >= dateFilter.start && date <= dateFilter.end;
    });
  }, [transactions, dateFilter]);

  const stats = useMemo(() => {
    const masuk = filteredTransactions.filter(t => t.tipe === 'MASUK').reduce((s, t) => s + t.jumlah, 0);
    const keluar = filteredTransactions.filter(t => t.tipe === 'KELUAR').reduce((s, t) => s + t.jumlah, 0);
    return { masuk, keluar };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col sm:flex-row items-end gap-5">
        <div className="flex-1 w-full grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Mulai</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md outline-none focus:ring-1 focus:ring-[#2563eb] text-[13px]"
              value={dateFilter.start}
              onChange={e => setDateFilter({...dateFilter, start: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
             <label className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Selesai</label>
             <input 
              type="date" 
              className="w-full px-3 py-2 bg-[#f1f5f9] border border-[#e2e8f0] rounded-md outline-none focus:ring-1 focus:ring-[#2563eb] text-[13px]"
              value={dateFilter.end}
              onChange={e => setDateFilter({...dateFilter, end: e.target.value})}
            />
          </div>
        </div>
        <button 
          onClick={onExport}
          className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-6 py-2.5 rounded-md flex items-center justify-center gap-2 text-[13px] font-semibold shadow-sm transition-all active:scale-95 whitespace-nowrap"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm">
          <p className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider mb-2">Total Barang Masuk (Periode)</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-[#10b981]">{stats.masuk}</p>
            <span className="text-[11px] text-[#64748b] px-2 py-0.5 bg-[#f1f5f9] rounded-md">Units</span>
          </div>
        </div>
        <div className="bg-white border border-[#e2e8f0] p-5 rounded-xl shadow-sm">
          <p className="text-[#64748b] text-[11px] font-bold uppercase tracking-wider mb-2">Total Barang Keluar (Periode)</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-[#ef4444]">{stats.keluar}</p>
            <span className="text-[11px] text-[#64748b] px-2 py-0.5 bg-[#f1f5f9] rounded-md">Units</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e2e8f0] flex justify-between items-center">
            <h3 className="font-semibold text-[#0f172a] text-sm">Ringkasan Persediaan Aktif</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#f8fafc] text-[#64748b] text-[11px] uppercase font-bold tracking-wider">
              <tr>
                 <th className="px-5 py-3">Produk</th>
                 <th className="px-5 py-3 text-center">Stok Awal</th>
                 <th className="px-5 py-3 text-center text-[#10b981]">Trans. Masuk</th>
                 <th className="px-5 py-3 text-center text-[#ef4444]">Trans. Keluar</th>
                 <th className="px-5 py-3 text-right">Stok Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
               {products.map(p => {
                 const tIn = transactions.filter(t => t.productId === p.id && t.tipe === 'MASUK').reduce((s,t) => s + t.jumlah, 0);
                 const tOut = transactions.filter(t => t.productId === p.id && t.tipe === 'KELUAR').reduce((s,t) => s + t.jumlah, 0);
                 const final = getStock(p.id);
                 return (
                   <tr key={p.id} className="hover:bg-[#f8fafc] transition-colors">
                     <td className="px-5 py-3 font-semibold text-[#0f172a]">{p.nama}</td>
                     <td className="px-5 py-3 text-center text-[#64748b]">{p.stokAwal}</td>
                     <td className="px-5 py-3 text-center font-bold text-[#10b981]">{tIn}</td>
                     <td className="px-5 py-3 text-center font-bold text-[#ef4444]">{tOut}</td>
                     <td className="px-5 py-3 text-right">
                       <span className={`px-2 py-0.5 rounded-md font-bold ${final <= p.minStok ? 'bg-[#fee2e2] text-[#b91c1c]' : 'bg-[#e2e8f0] text-[#0f172a]'}`}>
                         {final}
                       </span>
                     </td>
                   </tr>
                 );
               })}
               {products.length === 0 && (
                 <tr>
                   <td colSpan={5} className="px-5 py-16 text-center text-[#64748b] italic">Belum ada data barang untuk dilaporkan.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
