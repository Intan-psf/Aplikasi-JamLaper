"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEC0T6Bju3iW-YY4zMMPDYPl1foU7lYalltZ-TxMOvm9rDcjSEKaWxSHYixEM-Ptub/exec';

export default function PengembalianPage() {
  const router = useRouter();

  const [data, setData] = useState({ laptops: [], peminjaman: [], pengembalian: [], pegawai: [] });
  const [loadingData, setLoadingData] = useState(true);

  // Form states
  const [selectedPegawaiName, setSelectedPegawaiName] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [formData, setFormData] = useState({
    tglRealisasi: new Date().toISOString().split('T')[0],
    kondisi: '',
    catatan: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getAllData&t=${Date.now()}`);
        const result = await res.json();
        if (result.success && result.data) {
          setData({
            laptops: result.data.data_laptop || [],
            peminjaman: result.data.data_peminjaman || [],
            pengembalian: result.data.data_pengembalian || [],
            pegawai: result.data.data_pegawai || []
          });
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  // Mendapatkan daftar nama unik yang masih meminjam
  const activeBorrowers = new Set();
  data.peminjaman.forEach(p => {
    if ((p.STATUS || '').toLowerCase() === 'aktif') {
      activeBorrowers.add(p.NAMA_PEMINJAM);
    }
  });

  const activeLoans = selectedPegawaiName ? data.peminjaman.filter(p => 
    (p.STATUS || '').toLowerCase() === 'aktif' && p.NAMA_PEMINJAM === selectedPegawaiName
  ) : [];

  const handleSelectLoan = (loan) => {
    setSelectedLoan(loan);
    setFormData(prev => ({
      ...prev,
      tglRealisasi: new Date().toISOString().split('T')[0],
      kondisi: '',
      catatan: ''
    }));
    
    // Scroll smoothly to form
    setTimeout(() => {
      const el = document.getElementById('form-pengembalian-detail');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedLoan || !formData.tglRealisasi || !formData.kondisi) {
      showToast('Mohon lengkapi semua field yang wajib!', 'error');
      return;
    }
    setShowConfirm(true);
  };

  const processPengembalian = async () => {
    setSubmitting(true);
    setShowConfirm(false);

    try {
      const now = Date.now();
      const returnId = `KEM-${now}`;
      const formatter = new Date().toLocaleString('id-ID', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\./g, ':');

      const returnRow = {
        ID: returnId,
        PEMINJAMAN_ID: selectedLoan.ID,
        LAPTOP_ID: selectedLoan.LAPTOP_ID,
        NAMA_PEMINJAM: selectedLoan.NAMA_PEMINJAM,
        TGL_PINJAM: selectedLoan.TGL_PINJAM,
        TGL_KEMBALI_RENCANA: selectedLoan.TGL_KEMBALI_RENCANA,
        TGL_REALISASI_PENGEMBALIAN: formData.tglRealisasi,
        KONDISI: formData.kondisi,
        KONDISI_PENGEMBALIAN: formData.kondisi,
        CATATAN: formData.catatan,
        CATATAN_PENGEMBALIAN: formData.catatan,
        STATUS: 'Selesai',
        Timestamp: formatter
      };

      let newLaptopStatus = 'Tersedia';
      if (formData.kondisi === 'Rusak Ringan') newLaptopStatus = 'Rusak Ringan';
      if (formData.kondisi === 'Rusak Berat') newLaptopStatus = 'Rusak Berat';

      const processResult = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'processReturn',
          returnRow: returnRow,
          peminjamanId: selectedLoan.ID,
          tglRealisasi: formData.tglRealisasi,
          kondisi: formData.kondisi,
          laptopId: selectedLoan.LAPTOP_ID,
          newLaptopStatus: newLaptopStatus
        })
      }).then(r => r.json());

      if (!processResult.success) {
        throw new Error(processResult.error || 'Gagal memproses pengembalian di server');
      }

      showToast('Pengembalian berhasil diproses!', 'success');
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error(error);
      showToast('Gagal memproses pengembalian: ' + error.message, 'error');
      setSubmitting(false);
    }
  };

  const getLaptopName = (id) => {
    const l = data.laptops.find(x => x.ID === id);
    return l ? `${l.MERK} ${l.TYPE}` : id;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
      
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center space-x-3 transition-all ${toast.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {toast.type === 'error' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            )}
          </div>
          <p className="font-medium">{toast.message}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Pengembalian Laptop</h1>
          <p className="text-slate-500 mt-1">Kembalikan laptop dan perbarui status operasionalnya</p>
        </div>
        <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          <span>Kembali</span>
        </Link>
      </div>

      {loadingData && (
        <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-500 font-medium">Memuat data dari Spreadsheet...</p>
        </div>
      )}

      {!loadingData && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          
          {submitting && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <h3 className="mt-6 text-xl font-bold text-slate-800">Memproses Pengembalian...</h3>
              <p className="mt-2 text-slate-500 text-center max-w-sm">Sedang memperbarui riwayat dan status laptop.</p>
            </div>
          )}

          {/* Step 1: Cari Pegawai */}
          <div className="p-6 border-b border-slate-100 bg-slate-50">
            <label className="text-sm font-semibold text-slate-700 flex items-center mb-3"><svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg> 1. Cari Nama Peminjam</label>
            <select 
              className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 shadow-sm transition-colors"
              value={selectedPegawaiName} onChange={(e) => {
                setSelectedPegawaiName(e.target.value);
                setSelectedLoan(null);
              }}
            >
              <option value="">-- Ketik/Pilih Nama Peminjam --</option>
              {Array.from(activeBorrowers).sort().map((nama, idx) => (
                <option key={idx} value={nama}>{nama}</option>
              ))}
            </select>
          </div>

          {/* Step 2: Pilih Transaksi */}
          {selectedPegawaiName && (
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center mb-4"><svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> 2. Pilih Transaksi yang akan dikembalikan</h3>
              
              {activeLoans.length === 0 ? (
                <p className="text-sm text-slate-500 p-4 text-center bg-slate-50 rounded-lg">Tidak ada peminjaman aktif untuk nama ini.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Laptop</th>
                        <th className="px-4 py-3">Tgl Pinjam</th>
                        <th className="px-4 py-3">Tgl Kembali Rencana</th>
                        <th className="px-4 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeLoans.map((loan) => (
                        <tr key={loan.ID} className={`hover:bg-indigo-50/50 transition-colors ${selectedLoan?.ID === loan.ID ? 'bg-indigo-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{getLaptopName(loan.LAPTOP_ID)}</div>
                            <div className="text-xs text-slate-500">{loan.LAPTOP_ID}</div>
                          </td>
                          <td className="px-4 py-3">{new Date(loan.TGL_PINJAM).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3">{new Date(loan.TGL_KEMBALI_RENCANA).toLocaleDateString('id-ID')}</td>
                          <td className="px-4 py-3 text-right">
                            <button 
                              onClick={() => handleSelectLoan(loan)}
                              className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${selectedLoan?.ID === loan.ID ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                            >
                              {selectedLoan?.ID === loan.ID ? 'Dipilih' : 'Pilih'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Form Pengembalian */}
          {selectedLoan && (
            <form id="form-pengembalian-detail" onSubmit={handleSubmit} className="p-8 bg-white animate-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-3 text-sm">3</span> 
                Detail Kondisi Pengembalian
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Laptop yang dikembalikan</p>
                  <p className="font-semibold text-slate-800">{getLaptopName(selectedLoan.LAPTOP_ID)} ({selectedLoan.LAPTOP_ID})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 font-medium">Peminjam</p>
                  <p className="font-semibold text-slate-800">{selectedLoan.NAMA_PEMINJAM}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Tanggal Realisasi Pengembalian *</label>
                  <input type="date" required className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 shadow-sm"
                    value={formData.tglRealisasi} onChange={e => setFormData({...formData, tglRealisasi: e.target.value})}
                    min={selectedLoan.TGL_PINJAM}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Kondisi Laptop *</label>
                  <select required className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 shadow-sm"
                    value={formData.kondisi} onChange={e => setFormData({...formData, kondisi: e.target.value})}
                  >
                    <option value="">-- Pilih Kondisi --</option>
                    <option value="Baik">Baik</option>
                    <option value="Rusak Ringan">Rusak Ringan</option>
                    <option value="Rusak Berat">Rusak Berat</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Catatan Pengembalian</label>
                  <textarea rows="3" className="w-full bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-3 shadow-sm"
                    value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} placeholder="Opsional: Tuliskan kelengkapan (tas, charger) atau keterangan cacat fisik..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end space-x-4">
                <button type="button" onClick={() => setSelectedLoan(null)} className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                  Batal
                </button>
                <button type="submit" className="px-6 py-3 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  <span>Proses Pengembalian</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Konfirmasi Pengembalian</h3>
              <p className="text-slate-500 text-sm mt-1">Pastikan laptop beserta kelengkapannya sudah diperiksa.</p>
            </div>
            
            <div className="p-6 bg-slate-50 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Peminjam</div>
                <div className="col-span-2 font-semibold text-slate-800">{selectedLoan.NAMA_PEMINJAM}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Laptop</div>
                <div className="col-span-2 font-semibold text-slate-800">{getLaptopName(selectedLoan.LAPTOP_ID)}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Tgl Realisasi</div>
                <div className="col-span-2 font-semibold text-slate-800">{new Date(formData.tglRealisasi).toLocaleDateString('id-ID')}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Kondisi</div>
                <div className="col-span-2 font-semibold text-slate-800">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${formData.kondisi === 'Baik' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {formData.kondisi}
                  </span>
                </div>
              </div>
              {formData.catatan && (
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-slate-500">Catatan</div>
                  <div className="col-span-2 font-semibold text-slate-800 italic">"{formData.catatan}"</div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-100 flex space-x-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                Cek Ulang
              </button>
              <button onClick={processPengembalian} className="flex-1 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all">
                Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
