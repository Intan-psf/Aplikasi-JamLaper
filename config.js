// ==========================================
// KONFIGURASI INVENTRACK
// BPS Kabupaten Boyolali
// ==========================================

const CONFIG = {
    // URL Google Apps Script Web App
    // Ganti dengan URL hasil deploy Apps Script Anda:
    APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbyEC0T6Bju3iW-YY4zMMPDYPl1foU7lYalltZ-TxMOvm9rDcjSEKaWxSHYixEM-Ptub/exec',

    // Batas maksimal peminjaman laptop dalam hari kalender
    MAX_BORROW_DAYS: 5,

    // Nama sheet di Spreadsheet
    SHEETS: {
        DATA_LAPTOP: 'Data Laptop',
        DATA_PEGAWAI: 'DATA PEGAWAI',
        DATA_PEMINJAMAN: 'Data Peminjaman',
        DATA_PENGEMBALIAN: 'Data Pengembalian',
        KODE_AKSES: 'Kode Akses'
    },

    // Auto-refresh interval (ms) — 30 detik
    AUTO_REFRESH_MS: 3000
};
