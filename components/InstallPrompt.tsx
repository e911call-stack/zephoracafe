import React, { useState, useEffect } from 'react';
import { Share2, Download, X, Smartphone } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface InstallPromptProps {
  language: Language;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ language }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  
  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Check if user has already dismissed the prompt
    let hasDismissed = null;
    try {
      hasDismissed = localStorage.getItem('installPromptDismissed');
    } catch (e) {
      console.warn('LocalStorage access restricted');
    }
    
    if (hasDismissed) return;

    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) return;

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // For Android/Chrome: Capture the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a small delay to let the app load first
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS: Show prompt anyway after delay since there is no event
    if (isIosDevice) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // For iOS, we can't programmatically install, so we might show a tooltip or just keep the prompt open
      // The UI already shows instructions for iOS
      alert(t.iosInstructions);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Wajabat',
          text: t.installDesc,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'ar' ? "تم نسخ الرابط" : "Link copied to clipboard");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    try {
      localStorage.setItem('installPromptDismissed', 'true');
    } catch (e) {
      console.warn('LocalStorage access restricted');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-none shadow-2xl border border-black p-4 max-w-md mx-auto relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-black p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex gap-4">
          <div className="bg-gray-100 p-3 h-fit flex-shrink-0 border border-gray-200">
             <img src="https://ik.imagekit.io/g7p1qn7or/favicon.png" alt="Icon" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex-grow">
            <h3 className="font-bold text-black uppercase tracking-wide">{t.installApp}</h3>
            <p className="text-sm text-gray-500 mt-1 leading-snug font-light">
              {t.installDesc}
            </p>
            
            {isIOS && (
              <p className="text-xs text-black mt-2 font-medium bg-gray-50 p-2 border border-gray-200">
                <span className="block mb-1">📱 {t.howToInstall}:</span>
                {t.iosInstructions}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleInstallClick}
                className="flex-1 bg-black text-white py-2 px-3 rounded-none text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors uppercase tracking-wider"
              >
                <Download className="w-4 h-4" />
                {t.install}
              </button>
              <button 
                onClick={handleShare}
                className="flex-1 bg-white text-black border border-black py-2 px-3 rounded-none text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                <Share2 className="w-4 h-4" />
                {t.shareApp}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};