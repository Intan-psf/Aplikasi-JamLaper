import './globals.css';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import FaqWidget from './FaqWidget';
import AuthWrapper from './AuthWrapper';
import LogoutButton from './LogoutButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'JamLaper - BPS Kabupaten Boyolali',
  description: 'Aplikasi Peminjaman Laptop Operasional BPS Kabupaten Boyolali',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen flex flex-col`}>
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="flex items-center space-x-3">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/2/28/Lambang_Badan_Pusat_Statistik_%28BPS%29_Indonesia.svg" 
                  alt="BPS Logo" 
                  className="h-10 w-10 object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-xl font-bold text-blue-700 leading-tight">JamLaper</span>
                  <span className="text-xs text-slate-500 font-medium">BPS Kabupaten Boyolali</span>
                </div>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700">Online</span>
                </div>
                <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Refresh">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
                <LogoutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </main>
        
        {/* Floating FAQ */}
        <FaqWidget />
      </body>
    </html>
  );
}
