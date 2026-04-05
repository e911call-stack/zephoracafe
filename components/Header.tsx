import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Globe, Search, X, User } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface HeaderProps {
  cartItemCount: number;
  onOpenCart: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  isScrolled: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  cartItemCount, 
  onOpenCart, 
  language, 
  setLanguage,
  isScrolled,
  searchQuery,
  setSearchQuery,
  onOpenAuth,
  isLoggedIn
}) => {
  const t = TRANSLATIONS[language];
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    if (!searchQuery) {
        setIsSearchOpen(false);
    }
  };

  return (
    <header 
      className="sticky top-0 z-[500] bg-white border-b border-gray-200 h-16 transition-all duration-300"
    >
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 transition-all duration-300 flex-1">
          {/* Logo Area */}
          <div className={`flex items-center gap-2 transition-all duration-300 ${isSearchOpen ? 'hidden md:flex' : 'flex'}`}>
            <img 
                src="https://ik.imagekit.io/g7p1qn7or/favicon.png"
                alt="Zephora Logo"
                className="object-contain w-8 h-8"
            />
            <h1 className={`font-bold text-black text-lg ${language === 'ar' ? 'font-[Cairo]' : 'uppercase tracking-widest'}`}>
                {t.appTitle}
            </h1>
          </div>
          
          {/* Expandable Search Bar */}
          <div className={`flex items-center ml-auto rtl:ml-0 rtl:mr-auto transition-all duration-300 ${isSearchOpen ? 'w-full md:w-auto flex-1 md:flex-none md:ml-4 rtl:md:mr-4' : 'w-0 overflow-hidden'}`}>
            <div className="relative w-full">
                <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ar' ? "بحث..." : "Search..."}
                    className="w-full pl-3 pr-8 rtl:pr-3 rtl:pl-8 py-1.5 text-sm border border-black rounded-none focus:outline-none bg-gray-50 text-black placeholder-gray-500"
                />
                {searchQuery && (
                    <button 
                        onClick={handleClearSearch}
                        className="absolute right-2 rtl:right-auto rtl:left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 ml-2 rtl:ml-0 rtl:mr-2 shrink-0">
          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex items-center justify-center text-black hover:text-gray-600 transition-all duration-300"
          >
            {isSearchOpen && !searchQuery ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          </button>

          {/* User Auth Button */}
          <button 
            onClick={onOpenAuth}
            className="flex items-center justify-center text-black hover:text-gray-600 transition-all duration-300 w-5 h-5"
          >
            <User className={`w-5 h-5 ${isLoggedIn ? 'fill-black' : ''}`} />
          </button>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 border border-black text-black hover:bg-black hover:text-white font-bold transition-all duration-300 px-2 py-1 text-[10px]"
          >
            <Globe className="w-3 h-3" />
            <span>{language === 'en' ? 'AR' : 'EN'}</span>
          </button>

          <button 
            onClick={onOpenCart}
            className="relative hover:bg-gray-100 text-black transition-all duration-300 p-1.5"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-black border-2 border-white rounded-full">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};