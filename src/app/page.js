"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEC0T6Bju3iW-YY4zMMPDYPl1foU7lYalltZ-TxMOvm9rDcjSEKaWxSHYixEM-Ptub/exec';

export default function Dashboard() {
  const [data, setData] = useState({ laptops: [], peminjaman: [], pengembalian: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ show: false, type: '', payload: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getAllData&t=${Date.now()}`);
      const result = await res.json();
      if (result.success && result.data) {
        setData({
          laptops: result.data.data_laptop || [],
          peminjaman: result.data.data_peminjaman || [],
          pengembalian: result.data.data_pengembalian || []
        });
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const normalizeStatus = (status) => {
    const s = String(status || '').trim().toLowerCase();
    if (s === 'dipinjam') return 'dipinjam';
    if (s === 'rusak berat' || s === 'rusak') return 'rusak';
    // Rusak ringan tetap bisa dipinjam / dianggap tersedia secara sistem
    return 'tersedia';
  };

  const laptops = data.laptops;
  const tersedia = laptops.filter(l => normalizeStatus(l.STATUS) === 'tersedia').length;
  const dipinjam = laptops.filter(l => normalizeStatus(l.STATUS) === 'dipinjam').length;
  const rusak = laptops.filter(l => normalizeStatus(l.STATUS) === 'rusak').length;

  const getActionTime = (item) => {
    if (item.ID && typeof item.ID === 'string' && item.ID.startsWith('PEM-')) {
      const ts = parseInt(item.ID.split('-')[1]);
      if (!isNaN(ts)) return ts;
    }
    
    if (item.Timestamp) {
      let tsStr = String(item.Timestamp);
      const dmM = tsStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
      if (dmM) {
        tsStr = `${dmM[3]}-${dmM[2]}-${dmM[1]}T${dmM[4]}:${dmM[5]}:${dmM[6]}`;
      }
      const parsed = new Date(tsStr).getTime();
      if (!isNaN(parsed)) return parsed;
    }
    
    return new Date(item.TGL_PINJAM || 0).getTime() || 0;
  };

  // Process history
  // Remove duplicates by ID, filter out empty rows, and sort by latest action
  const seen = new Set();
  let history = [...data.peminjaman].filter(item => {
    // Skip empty rows (no Laptop ID or Borrower Name)
    if (!item.LAPTOP_ID || !item.NAMA_PEMINJAM) return false;
    
    if (!item.ID) return true;
    if (seen.has(item.ID)) return false;
    seen.add(item.ID);
    return true;
  }).sort((a, b) => getActionTime(b) - getActionTime(a)).slice(0, 5);

  // Data for Charts
  const aktif = data.peminjaman.filter(p => (p.STATUS || '').toLowerCase() === 'aktif').length;
  const selesai = data.peminjaman.filter(p => (p.STATUS || '').toLowerCase() === 'selesai').length;

  const laptopCount = {};
  data.peminjaman.forEach(p => {
    if (p.LAPTOP_ID) laptopCount[p.LAPTOP_ID] = (laptopCount[p.LAPTOP_ID] || 0) + 1;
  });
  const sortedTopLaptops = Object.entries(laptopCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard Inventaris</h1>
          <p className="text-slate-500 mt-1">Ringkasan status laptop operasional saat ini.</p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          <span className="font-medium text-sm">{loading ? 'Memperbarui...' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => setModal({ show: true, type: 'status', payload: 'tersedia' })} className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div></div>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-600 mb-1 uppercase tracking-wider">Tersedia</p>
              <h3 className="text-4xl font-bold text-slate-800">{loading ? '-' : tersedia}</h3>
            </div>
            <div className="h-14 w-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-100 transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
        </div>

        <div onClick={() => setModal({ show: true, type: 'status', payload: 'dipinjam' })} className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600 mb-1 uppercase tracking-wider">Dipinjam</p>
              <h3 className="text-4xl font-bold text-slate-800">{loading ? '-' : dipinjam}</h3>
            </div>
            <div className="h-14 w-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </div>
        </div>

        <div onClick={() => setModal({ show: true, type: 'status', payload: 'rusak' })} className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all cursor-pointer group relative overflow-hidden">
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center"><div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div></div>}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-rose-600 mb-1 uppercase tracking-wider">Rusak</p>
              <h3 className="text-4xl font-bold text-slate-800">{loading ? '-' : rusak}</h3>
            </div>
            <div className="h-14 w-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 group-hover:scale-110 group-hover:bg-rose-100 transition-all">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/peminjaman" className="relative overflow-hidden flex items-center justify-between p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all group">
          <div className="relative z-10 flex items-center space-x-4">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Form Peminjaman</h3>
              <p className="text-blue-100 text-sm mt-1">Ajukan peminjaman laptop baru</p>
            </div>
          </div>
          <svg className="relative z-10 w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </Link>

        <Link href="/pengembalian" className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-2xl text-slate-800 hover:shadow-lg hover:border-indigo-300 transition-all group">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Form Pengembalian</h3>
              <p className="text-slate-500 text-sm mt-1">Kembalikan laptop yang dipinjam</p>
            </div>
          </div>
          <svg className="w-6 h-6 text-slate-400 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </Link>
      </div>

      {/* Analytics Charts Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
            Analitik & Visualisasi Penggunaan
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart 1: Status Laptop */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Status Laptop</h3>
            <div className="w-full h-64 relative">
              <Doughnut 
                data={{
                  labels: ['Tersedia', 'Dipinjam', 'Rusak'],
                  datasets: [{
                    data: [tersedia, dipinjam, rusak],
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
                    borderColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 2,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>

          {/* Chart 2: Top Laptops */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Top 5 Laptop Dipinjam</h3>
            <div className="w-full h-64 relative">
              <Bar 
                data={{
                  labels: sortedTopLaptops.length > 0 ? sortedTopLaptops.map(i => i[0]) : ['-'],
                  datasets: [{
                    label: 'Jumlah Peminjaman',
                    data: sortedTopLaptops.length > 0 ? sortedTopLaptops.map(i => i[1]) : [0],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderRadius: 4,
                  }]
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } }
                }}
              />
            </div>
          </div>

          {/* Chart 3: Status Peminjaman */}
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase tracking-wider">Status Peminjaman</h3>
            <div className="w-full h-64 relative">
              <Pie 
                data={{
                  labels: ['Aktif', 'Selesai'],
                  datasets: [{
                    data: [aktif, selesai],
                    backgroundColor: ['rgba(139, 92, 246, 0.8)', 'rgba(99, 102, 241, 0.8)'],
                    borderColor: ['#8b5cf6', '#6366f1'],
                    borderWidth: 2,
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Riwayat Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[300px]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Riwayat Peminjaman Terakhir</h2>
        </div>
        <div className="px-6 py-3 border-b border-slate-100 flex flex-wrap gap-x-6 gap-y-2 text-xs font-medium text-slate-600 bg-white items-center">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></span> Dikembalikan</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></span> Belum kembali (H-1)</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></span> Belum kembali di hari terakhir</div>
        </div>
        
        {loading ? (
          <div className="absolute inset-0 top-[70px] bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-sm font-medium text-slate-500">Memuat data dari Spreadsheet...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
            </div>
            <p className="text-slate-500">Belum ada riwayat peminjaman</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-[11px] text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 text-center">NO</th>
                  <th className="px-6 py-4">NAMA LAPTOP</th>
                  <th className="px-6 py-4">NAMA PEMINJAM</th>
                  <th className="px-6 py-4">TGL PINJAM</th>
                  <th className="px-6 py-4">TGL PENGEMBALIAN</th>
                  <th className="px-6 py-4">TGL REALISASI PENGEMBALIAN</th>
                  <th className="px-6 py-4 text-center">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((item, idx) => {
                  const laptop = laptops.find(l => l.ID === item.LAPTOP_ID);
                  const laptopName = laptop ? `[${laptop.NUP || item.LAPTOP_ID}] ${laptop.MERK} ${laptop.TYPE}` : item.LAPTOP_ID;
                  
                  const kembali = data.pengembalian.find(k => k.PEMINJAMAN_ID === item.ID);
                  const isReturned = !!kembali;
                  
                  let dotClass = '';
                  if (isReturned) {
                    dotClass = 'bg-emerald-500';
                  } else if (item.TGL_KEMBALI_RENCANA) {
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const dueDate = new Date(item.TGL_KEMBALI_RENCANA);
                    dueDate.setHours(0, 0, 0, 0);

                    if (!isNaN(dueDate.getTime())) {
                      const diffDays = Math.round((dueDate - now) / (1000 * 60 * 60 * 24));

                      if (diffDays <= 0) {
                        dotClass = 'bg-rose-500';
                      } else if (diffDays === 1) {
                        dotClass = 'bg-amber-400';
                      }
                    }
                  }

                  const formatDateStr = (dateStr) => {
                    if (!dateStr || dateStr === '-') return '-';
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    return d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'});
                  };

                  return (
                    <tr onClick={() => setModal({ show: true, type: 'laptop', payload: item.LAPTOP_ID })} key={item.ID || idx} className="hover:bg-slate-50/80 transition-colors group cursor-pointer text-[13px]">
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{laptopName}</td>
                      <td className="px-6 py-4 text-slate-600">{item.NAMA_PEMINJAM || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateStr(item.TGL_PINJAM)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDateStr(item.TGL_KEMBALI_RENCANA)}</td>
                      <td className="px-6 py-4 text-slate-600">{kembali ? formatDateStr(kembali.TGL_REALISASI_PENGEMBALIAN) : '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {dotClass && <span className={`inline-block w-3.5 h-3.5 rounded-full shadow-sm ${dotClass}`}></span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Modals */}
      {modal.show && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 text-center relative">
              <h3 className="text-xl font-bold text-slate-800">
                {modal.type === 'status' 
                  ? `Riwayat Laptop - ${modal.payload.charAt(0).toUpperCase() + modal.payload.slice(1)}` 
                  : `Riwayat Peminjam Laptop - ${modal.payload} (${laptops.find(l => l.ID === modal.payload)?.MERK || ''} ${laptops.find(l => l.ID === modal.payload)?.TYPE || ''})`}
              </h3>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
              <div className="overflow-x-auto bg-white rounded-xl border border-slate-100 shadow-sm">
                <table className="w-full text-sm text-left text-slate-600 whitespace-nowrap">
                  <thead className="text-[10px] font-bold text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100 tracking-wider">
                    {modal.type === 'status' ? (
                      <tr>
                        <th className="px-6 py-4 text-center">NO</th>
                        <th className="px-6 py-4">KODE LAPTOP</th>
                        <th className="px-6 py-4">MERK</th>
                        <th className="px-6 py-4">TYPE</th>
                        <th className="px-6 py-4 text-center">NUP</th>
                        <th className="px-6 py-4">STATUS</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="px-6 py-4 text-center">NO</th>
                        <th className="px-6 py-4">NAMA PEMINJAM</th>
                        <th className="px-6 py-4">TGL PINJAM</th>
                        <th className="px-6 py-4">RENCANA KEMBALI</th>
                        <th className="px-6 py-4">REALISASI KEMBALI</th>
                        <th className="px-6 py-4">KONDISI</th>
                        <th className="px-6 py-4">CATATAN</th>
                        <th className="px-6 py-4 text-center">STATUS</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {modal.type === 'status' ? (
                      laptops.filter(l => normalizeStatus(l.STATUS) === modal.payload).map((l, i) => (
                        <tr 
                          key={i} 
                          className="hover:bg-indigo-50/80 cursor-pointer transition-colors group"
                          onClick={() => setModal({ show: true, type: 'laptop', payload: l.ID })}
                        >
                          <td className="px-6 py-4 text-center font-medium text-blue-600 group-hover:text-indigo-700">{i + 1}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{l.ID}</td>
                          <td className="px-6 py-4">{l.MERK}</td>
                          <td className="px-6 py-4">{l.TYPE}</td>
                          <td className="px-6 py-4 text-center">{l.NUP || '-'}</td>
                          <td className="px-6 py-4 capitalize">{l.STATUS}</td>
                        </tr>
                      ))
                    ) : (
                      data.peminjaman.filter(p => p.LAPTOP_ID === modal.payload)
                        .sort((a,b) => new Date(b.TGL_PINJAM).getTime() - new Date(a.TGL_PINJAM).getTime())
                        .map((p, i) => {
                          const kem = data.pengembalian.find(k => k.PEMINJAMAN_ID === p.ID);
                          const isReturned = !!kem;
                          return (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="px-6 py-4 text-center font-medium text-blue-600">{i + 1}</td>
                              <td className="px-6 py-4 font-medium text-slate-800">{p.NAMA_PEMINJAM}</td>
                              <td className="px-6 py-4">{p.TGL_PINJAM ? new Date(p.TGL_PINJAM).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}</td>
                              <td className="px-6 py-4">{p.TGL_KEMBALI_RENCANA ? new Date(p.TGL_KEMBALI_RENCANA).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}</td>
                              <td className="px-6 py-4">{isReturned && kem.TGL_REALISASI_PENGEMBALIAN ? new Date(kem.TGL_REALISASI_PENGEMBALIAN).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'}) : '-'}</td>
                              <td className="px-6 py-4">{isReturned ? kem.KONDISI_PENGEMBALIAN || kem.KONDISI || '-' : '-'}</td>
                              <td className="px-6 py-4">{isReturned ? kem.CATATAN_PENGEMBALIAN || kem.CATATAN || '-' : '-'}</td>
                              <td className="px-6 py-4 text-center font-medium">{isReturned ? 'Selesai' : 'Aktif'}</td>
                            </tr>
                          );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-white">
              <button onClick={() => setModal({ show: false, type: '', payload: null })} className="w-full py-3 bg-slate-50 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
