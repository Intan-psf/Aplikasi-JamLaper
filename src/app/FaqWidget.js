"use client";
import { useState } from 'react';

export default function FaqWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 hover:scale-105 transition-all z-40"
        title="Tanya Jawab"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* FAQ Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200 max-h-[85vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/30">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Pertanyaan Umum (FAQ)
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto bg-white flex-1 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 text-lg mb-2">1. Bagaimana cara meminjam laptop?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Klik tombol "Form Peminjaman" di dashboard. Isi form dengan lengkap (Laptop, Nama, No. HP, Gmail, dll) lalu submit. Maksimal durasi peminjaman adalah 5 hari.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-lg mb-2">2. Apakah saya mendapat notifikasi email?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Ya, setelah peminjaman berhasil, sistem akan otomatis mengirimkan email konfirmasi ke alamat Gmail yang Anda masukkan di form peminjaman.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-lg mb-2">3. Bagaimana cara mengembalikan laptop?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Klik tombol "Form Pengembalian". Pilih nama Anda, klik pada laptop yang Anda pinjam, isi kondisi laptop dan catatan pengembalian, lalu klik "Proses Pengembalian".</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 text-lg mb-2">4. Apa yang terjadi jika saya terlambat mengembalikan?</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Status peminjaman Anda akan ditandai dengan warna merah (Belum kembali &gt; 5 hari) di riwayat peminjaman.</p>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setIsOpen(false)} className="w-full py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
