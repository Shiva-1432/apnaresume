'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useUser();
  const { logout } = useAuth();

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'My Resumes', href: '/my-resumes' },
    { label: 'Job Matcher', href: '/job-matcher' },
    { label: 'Fresher Mode', href: '/fresher-mode' },
  ];

  if (!isLoaded) return null;

  return (
    <nav ref={navRef} className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${isMenuOpen ? 'w-[95%] h-auto' : 'w-[90%] max-w-6xl'}`}>
      <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.10)] border border-neutral-200/80 px-8 py-4 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group shrink-0" onClick={() => setIsMenuOpen(false)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-200">A</div>
          <span className="text-xl font-black tracking-tight text-neutral-900 group-hover:text-indigo-600 transition-colors hidden sm:block font-syne">ApnaResume</span>
        </Link>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.15em]">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setIsMenuOpen(false)}
              className={`transition-colors ${
                pathname === link.href 
                  ? 'text-indigo-600' 
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Actions */}
        <div className="flex items-center gap-4 sm:gap-5">
          {!isSignedIn ? (
            <>
              <Link href="/sign-in" className="text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-indigo-600 transition-colors">
                Login
              </Link>
              <Link href="/sign-up" className="hidden sm:block px-7 py-3 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-red-500 transition-colors"
              >
                Logout
              </button>
              <Link href="/dashboard" className="hidden sm:block px-7 py-3 text-xs font-black uppercase tracking-widest text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">
                Go to App
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            className="lg:hidden w-10 h-10 flex items-center justify-center bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors border border-neutral-200"
          >
            <div className="relative w-5 h-4">
              <span className={`absolute left-0 w-full h-0.5 bg-neutral-700 transition-all ${isMenuOpen ? 'top-2 rotate-45' : 'top-0'}`} />
              <span className={`absolute left-0 top-2 w-full h-0.5 bg-neutral-700 transition-all ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`} />
              <span className={`absolute left-0 w-full h-0.5 bg-neutral-700 transition-all ${isMenuOpen ? 'top-2 -rotate-45' : 'top-4'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`lg:hidden mt-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] shadow-xl border border-neutral-200/80 overflow-hidden transition-all duration-300 ${isMenuOpen ? 'max-h-96 py-8 opacity-100' : 'max-h-0 py-0 opacity-0'}`}>
        <div className="flex flex-col items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em]">
          {navLinks.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={() => setIsMenuOpen(false)}
              className={`transition-colors ${pathname === link.href ? 'text-indigo-600' : 'text-neutral-600 hover:text-neutral-900'}`}
            >
              {link.label}
            </Link>
          ))}
          {!isSignedIn && (
            <Link 
              href="/sign-up" 
              onClick={() => setIsMenuOpen(false)}
              className="sm:hidden px-12 py-4 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200"
            >
              Sign Up
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
