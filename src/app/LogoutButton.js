"use client";
import { useEffect, useState } from 'react';

export default function LogoutButton() {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    // Show logout button only if logged in
    const auth = localStorage.getItem('jamlaper_auth');
    setIsAuth(auth === 'true');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('jamlaper_auth');
    window.location.reload();
  };

  if (!isAuth) return null;

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center justify-center p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors" 
      title="Keluar (Logout)"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
      </svg>
    </button>
  );
}
