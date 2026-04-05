import React from 'react';
import { X, Share2, Plus, Ban } from 'lucide-react';
import { MenuItem, Language } from '../types';
import { TRANSLATIONS, RESTAURANT_CONFIG } from '../constants';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MenuItem | null;
  language: Language;
  onAddToCart: (item: MenuItem) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, language, onAddToCart }) => {
  if (!isOpen || !product) return null;

  const t = TRANSLATIONS[language];
  const name = language === 'ar' ? (product.name_ar || product.name) : product.name;
  const description = language === 'ar' ? (product.description_ar || product.description) : product.description;
  const isRTL = language === 'ar';

  // Check availability
  const isOutOfStock = (product.stock_quantity !== undefined && product.stock_quantity <= 0);
  const isUnavailable = product.is_available === false;
  const isDisabled = isOutOfStock || isUnavailable;

  const handleShare = async () => {
    const shareData = {
      title: name,
      text: description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
    }
  };

  const handleAddToCart = () => {
    if (!isDisabled) {
        onAddToCart(product);
        onClose();
    }
  };

  // Dynamic positioning for Desktop Split View
  // LTR: Menu is on Right -> Modal should cover Right side.
  // RTL: Menu is on Left -> Modal should cover Left side.
  const desktopPosition = isRTL 
    ? 'xl:left-0 xl:right-auto' 
    : 'xl:right-0 xl:left-auto';

  return (
    <div className={`fixed inset-0 z-[2000] xl:w-[50%] xl:inset-y-0 ${desktopPosition} flex items-center justify-center p-0 sm:p-4`}>
      
      {/* Backdrop - Constrained to the container (Menu Split) */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-md shadow-2xl relative animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300 flex flex-col sm:max-h-[90vh]">
        
        {/* Close Button - Floating on top right/left of image/card depending on lang */}
        <button 
            onClick={onClose}
            className={`absolute top-4 z-20 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-transform hover:scale-105 ${isRTL ? 'left-4' : 'right-4'}`}
        >
            <X className="w-5 h-5 text-black" />
        </button>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
            {/* Image Container */}
            <div className="relative w-full aspect-square md:aspect-[4/3] bg-gray-100">
                <img 
                    src={product.image} 
                    alt={name} 
                    className={`w-full h-full object-cover object-center transition-transform duration-700 ${isDisabled ? 'grayscale opacity-90' : ''}`}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-20" />
                
                 {/* Out of Stock Overlay */}
                {isDisabled && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white font-bold text-xl uppercase border-2 border-white px-6 py-2 tracking-widest transform -rotate-6">
                            {t.outOfStock}
                        </span>
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="p-6 md:p-8 flex flex-col gap-4">
                 <div className="flex flex-col gap-2">
                     <div className="flex justify-between items-start gap-4">
                        <h2 className={`text-2xl md:text-3xl font-bold uppercase tracking-wide text-black leading-tight ${isRTL ? 'font-[Cairo]' : 'font-[Playfair_Display]'}`}>
                            {name}
                        </h2>
                     </div>
                     
                     <p className="text-gray-600 text-sm md:text-base leading-relaxed font-light mt-2">
                         {description}
                     </p>
                 </div>

                 {/* Dietary Tags */}
                 {product.dietary && product.dietary.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                         {product.dietary.map(tag => (
                             <span key={tag} className="text-[10px] uppercase font-bold px-2 py-1 bg-gray-50 text-gray-600 tracking-wider border border-gray-200">
                                 {tag}
                             </span>
                         ))}
                     </div>
                 )}
            </div>
        </div>

        {/* Fixed Footer for Action Buttons */}
        <div className="p-4 md:p-6 bg-white border-t border-gray-100 z-10 flex gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] items-center">
             <button 
                onClick={handleShare}
                className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-black hover:bg-black hover:text-white transition-colors hover:border-black shrink-0"
                aria-label="Share"
             >
                <Share2 className="w-5 h-5" />
             </button>
             
             <button
                onClick={handleAddToCart}
                disabled={isDisabled}
                className={`flex-1 h-12 font-bold text-sm md:text-base uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-none ${
                    isDisabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-100' 
                    : 'bg-black text-white hover:bg-gray-800 shadow-lg active:scale-[0.98]'
                }`}
             >
                {isDisabled ? (
                    <>
                        <Ban className="w-4 h-4"/> 
                        <span>{t.outOfStock}</span>
                    </>
                ) : (
                    <>
                         <span>{t.addToCart}</span>
                         <span className="mx-1 opacity-50">|</span>
                         <span>{product.price.toFixed(3)} {RESTAURANT_CONFIG.currency}</span>
                    </>
                )}
             </button>
        </div>
      </div>
    </div>
  );
};