"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEC0T6Bju3iW-YY4zMMPDYPl1foU7lYalltZ-TxMOvm9rDcjSEKaWxSHYixEM-Ptub/exec';
const MAX_BORROW_DAYS = 5;

export default function PeminjamanPage() {
  const router = useRouter();

  // Data Options from Spreadsheet
  const [laptops, setLaptops] = useState([]);
  const [pegawai, setPegawai] = useState([]);
  const [keperluanList, setKeperluanList] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    laptopId: '',
    nip: '',
    phone: '',
    email: '',
    tim: '',
    keperluan: '',
    deskripsi: '',
    tglPinjam: new Date().toISOString().split('T')[0],
    tglKembali: new Date().toISOString().split('T')[0]
  });

  // UI State
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    // Automatically set tglKembali max limit
    const tglPinjam = new Date(formData.tglPinjam);
    if (!isNaN(tglPinjam.getTime())) {
      const maxKembali = new Date(tglPinjam);
      // Hari peminjaman dihitung sebagai hari pertama, jadi max date adalah + (MAX_BORROW_DAYS - 1)
      maxKembali.setDate(maxKembali.getDate() + (MAX_BORROW_DAYS - 1));
      const maxStr = maxKembali.toISOString().split('T')[0];

      if (formData.tglKembali > maxStr || formData.tglKembali < formData.tglPinjam) {
        setFormData(prev => ({ ...prev, tglKembali: maxStr }));
      }
    }
  }, [formData.tglPinjam]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${APPS_SCRIPT_URL}?action=getAllData&t=${Date.now()}`);
        const result = await res.json();
        if (result.success && result.data) {
          setLaptops(result.data.data_laptop || []);
          setPegawai(result.data.data_pegawai || []);
          setKeperluanList(result.data.keperluan || []);
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

  const handlePegawaiChange = (e) => {
    const nip = e.target.value;
    const selected = pegawai.find(p => String(p.NIP) === String(nip));
    const tim = selected ? (selected['TIM (DIVISI)'] || selected.TIM || selected.DIVISI || selected['TIM/DIVISI'] || '').trim() : '';
    setFormData(prev => ({ ...prev, nip, tim }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.laptopId || !formData.nip || !formData.phone || !formData.email || !formData.keperluan || !formData.tglPinjam || !formData.tglKembali) {
      showToast('Mohon lengkapi semua field yang wajib!', 'error');
      return;
    }

    if (!/^62\d{8,15}$/.test(formData.phone)) {
        showToast('No. HP harus dalam format 62XXXXXXXXXXX tanpa tanda + atau spasi.', 'error');
        return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        showToast('Alamat Gmail tidak valid. Gunakan format nama@gmail.com.', 'error');
        return;
    }

    const tPinjam = new Date(formData.tglPinjam);
    const tKembali = new Date(formData.tglKembali);
    if (tKembali < tPinjam) {
      showToast('Tanggal kembali tidak boleh sebelum tanggal pinjam!', 'error');
      return;
    }

    // Hari peminjaman dihitung sebagai hari pertama (+1)
    const durasi = Math.floor((tKembali - tPinjam) / (1000 * 60 * 60 * 24)) + 1;
    if (durasi > MAX_BORROW_DAYS) {
      showToast(`Maksimal peminjaman adalah ${MAX_BORROW_DAYS} hari (terhitung sejak hari pinjam).`, 'error');
      return;
    }

    setShowConfirm(true);
  };

  const processPeminjaman = async () => {
    setSubmitting(true);
    setShowConfirm(false);

    try {
      const selectedPegawai = pegawai.find(p => String(p.NIP) === String(formData.nip));
      const namaPeminjam = selectedPegawai ? selectedPegawai.NAMA : formData.nip;

      const now = Date.now();
      const peminjamanId = `PEM-${now}`;
      const formatter = new Date().toLocaleString('id-ID', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }).replace(/\./g, ':');

      const row = {
        ID: peminjamanId,
        LAPTOP_ID: formData.laptopId,
        NAMA_PEMINJAM: namaPeminjam,
        NIP: formData.nip,
        NO_HP: formData.phone,
        EMAIL: formData.email,
        TIM: formData.tim,
        DIVISI: formData.tim,
        KEPERLUAN: formData.keperluan,
        DESKRIPSI_KEPERLUAN: formData.deskripsi,
        TGL_PINJAM: formData.tglPinjam,
        TGL_KEMBALI_RENCANA: formData.tglKembali,
        STATUS: 'Aktif',
        Timestamp: formatter
      };

      // 1. Append to Data Peminjaman
      const appendRes = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'appendRow', sheet: 'Data Peminjaman', row })
      }).then(r => r.json());

      if (!appendRes.success) throw new Error('Gagal menambah data peminjaman');

      // 2. Update laptop status
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateRow', sheet: 'Data Laptop',
          matchCol: 'ID', matchVal: formData.laptopId,
          row: { STATUS: 'Dipinjam' }
        })
      });

      showToast('Peminjaman berhasil disimpan!', 'success');
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error(error);
      showToast('Gagal menyimpan peminjaman: ' + error.message, 'error');
      setSubmitting(false);
    }
  };

  const getKeperluanText = (row) => {
    for (const key in row) {
      if (row[key] && typeof row[key] === 'string') return row[key].trim();
    }
    return '';
  };

  const availableLaptops = laptops.filter(l => {
    const st = String(l.STATUS || '').toLowerCase();
    return st === 'tersedia' || st === 'rusak ringan';
  });

  const activePegawai = pegawai.filter(p => {
    const st = String(p.AKTIF || p.STATUS || '').toLowerCase();
    return ['aktif', 'active', 'ya', 'yes', 'true', '1'].includes(st);
  });

  const getLaptopName = (id) => {
    const l = laptops.find(x => x.ID === id);
    return l ? `${l.MERK} ${l.TYPE}` : id;
  };

  const maxKembaliDate = new Date(formData.tglPinjam);
  if (!isNaN(maxKembaliDate.getTime())) {
    maxKembaliDate.setDate(maxKembaliDate.getDate() + (MAX_BORROW_DAYS - 1));
  }
  const maxKembaliStr = !isNaN(maxKembaliDate.getTime()) ? maxKembaliDate.toISOString().split('T')[0] : '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">

      {/* Toast Notification */}
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

      {/* Header Section */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Form Peminjaman Laptop</h1>
          <p className="text-slate-500 mt-1">Isi form berikut untuk meminjam laptop operasional</p>
        </div>
        <Link href="/" className="flex items-center space-x-2 text-slate-500 hover:text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          <span>Kembali</span>
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {loadingData && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-500 font-medium">Memuat data pilihan...</p>
          </div>
        )}

        {submitting && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <h3 className="mt-6 text-xl font-bold text-slate-800">Memproses Peminjaman...</h3>
            <p className="mt-2 text-slate-500 text-center max-w-sm">Sedang menyimpan data ke Google Spreadsheet dan memperbarui status laptop.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Pilih Laptop *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.laptopId} onChange={e => setFormData({ ...formData, laptopId: e.target.value })}
              >
                <option value="">-- Pilih Laptop Tersedia --</option>
                {availableLaptops.map(l => (
                  <option key={l.ID} value={l.ID}>{l.ID} - {l.MERK} {l.TYPE} {l.NUP ? `(NUP: ${l.NUP})` : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Nama Peminjam *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.nip} onChange={handlePegawaiChange}
              >
                <option value="">-- Pilih Pegawai --</option>
                {activePegawai.map(p => (
                  <option key={p.NIP} value={p.NIP}>{p.NAMA} (NIP: {p.NIP})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg> No. HP *</label>
              <input type="tel" required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="contoh: 6281234567890"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Gmail *</label>
              <input type="email" required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contoh: nama@gmail.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg> Tim / Divisi</label>
              <input type="text" readOnly className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-sm rounded-lg block p-3"
                value={formData.tim} placeholder="Otomatis dari data pegawai"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg> Keperluan *</label>
              <select required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.keperluan} onChange={e => setFormData({ ...formData, keperluan: e.target.value })}
              >
                <option value="">-- Pilih Keperluan --</option>
                {keperluanList.map((k, i) => {
                  const text = getKeperluanText(k);
                  return text ? <option key={i} value={text}>{text}</option> : null;
                })}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg> Deskripsi Keperluan Tambahan</label>
              <textarea rows="3" className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.deskripsi} onChange={e => setFormData({ ...formData, deskripsi: e.target.value })} placeholder="Jelaskan secara singkat rincian keperluan peminjaman..."
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Tanggal Pinjam *</label>
              <input type="date" required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.tglPinjam} onChange={e => setFormData({ ...formData, tglPinjam: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center"><svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Perkiraan Pengembalian *</label>
              <input type="date" required className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 transition-colors"
                value={formData.tglKembali} onChange={e => setFormData({ ...formData, tglKembali: e.target.value })}
                min={formData.tglPinjam} max={maxKembaliStr}
              />
              <p className="text-xs text-slate-500 mt-1">* Maksimal {MAX_BORROW_DAYS} hari dari tanggal pinjam</p>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <button type="button" onClick={() => router.push('/')} className="px-6 py-3 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
              Batal
            </button>
            <button type="submit" className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              <span>Ajukan Peminjaman</span>
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Konfirmasi Peminjaman</h3>
              <p className="text-slate-500 text-sm mt-1">Mohon pastikan data di bawah ini sudah benar sebelum meminjam.</p>
            </div>

            <div className="p-6 bg-slate-50 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Peminjam</div>
                <div className="col-span-2 font-semibold text-slate-800">{pegawai.find(p => String(p.NIP) === formData.nip)?.NAMA || formData.nip}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Laptop</div>
                <div className="col-span-2 font-semibold text-slate-800">{getLaptopName(formData.laptopId)}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">No. HP</div>
                <div className="col-span-2 font-semibold text-slate-800">{formData.phone}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Email</div>
                <div className="col-span-2 font-semibold text-slate-800">{formData.email}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Keperluan</div>
                <div className="col-span-2 font-semibold text-slate-800">{formData.keperluan}</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-slate-500">Periode</div>
                <div className="col-span-2 font-semibold text-slate-800">
                  {new Date(formData.tglPinjam).toLocaleDateString('id-ID')} - {new Date(formData.tglKembali).toLocaleDateString('id-ID')}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex space-x-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
                Kembali
              </button>
              <button onClick={processPeminjaman} className="flex-1 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all">
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
