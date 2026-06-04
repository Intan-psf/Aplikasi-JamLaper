"use client";
import { useState, useEffect } from 'react';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyEC0T6Bju3iW-YY4zMMPDYPl1foU7lYalltZ-TxMOvm9rDcjSEKaWxSHYixEM-Ptub/exec';

export default function AuthWrapper({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if previously authenticated
    const auth = localStorage.getItem('jamlaper_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    setIsChecking(false);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setError('Masukkan kode akses terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Optimasi: Hanya mengambil data dari sheet Kode Akses saja agar jauh lebih cepat (tidak mengambil seluruh database)
      const res = await fetch(`${APPS_SCRIPT_URL}?action=getSheet&sheet=Kode Akses`);
      const result = await res.json();
      
      if (result.success && result.data) {
        const inputCode = accessCode.toLowerCase();
        // Karena pakai getSheet, data langsung berupa array di result.data
        const isValid = result.data.some(row => 
          String(row['KODE AKSES'] || row.KODE || '').toLowerCase() === inputCode
        );
        
        if (isValid) {
          localStorage.setItem('jamlaper_auth', 'true');
          setIsAuthenticated(true);
        } else {
          setError('Kode akses tidak valid. Periksa kembali di spreadsheet.');
        }
      } else {
        setError('Gagal mengambil data dari server. Coba lagi.');
      }
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan koneksi.');
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100 animate-in zoom-in-95 duration-500">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 border border-blue-100">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/28/Lambang_Badan_Pusat_Statistik_%28BPS%29_Indonesia.svg" 
                alt="BPS Logo" 
                className="h-12 w-12 object-contain"
              />
            </div>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 tracking-tight">JamLaper BPS</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sistem Peminjaman Laptop Operasional<br/>Badan Pusat Statistik Kabupaten Boyolali
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="kode-akses" className="sr-only">Kode Akses</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <input
                  id="kode-akses"
                  name="kode-akses"
                  type="text"
                  required
                  className="appearance-none rounded-xl relative block w-full px-3 py-4 pl-10 border border-slate-300 placeholder-slate-400 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-all"
                  placeholder="Masukkan Kode Akses"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium flex items-start">
                <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg className="h-5 w-5 text-blue-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path></svg>
                  </span>
                )}
                {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
