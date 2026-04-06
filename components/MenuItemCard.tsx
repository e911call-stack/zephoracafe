import React from 'react';
import { Plus, Ban } from 'lucide-react';
import { MenuItem, Language } from '../types';
import { TRANSLATIONS, RESTAURANT_CONFIG } from '../constants';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem) => void;
  language: Language;
  onProductClick: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onAddToCart, language, onProductClick }) => {
  const t = TRANSLATIONS[language];
  const name = language === 'ar' ? (item.name_ar || item.name) : item.name;
  const description = language === 'ar' ? (item.description_ar || item.description) : item.description;

  // Check availability
  const isOutOfStock = (item.stock_quantity !== undefined && item.stock_quantity <= 0);
  const isUnavailable = item.is_available === false;
  const isDisabled = isOutOfStock || isUnavailable;

  return (
    <div 
      onClick={() => onProductClick(item)}
      className={`group bg-white rounded-none shadow-sm transition-all duration-300 overflow-hidden border border-gray-200 flex flex-row h-full min-h-[140px] md:min-h-[160px] cursor-pointer ${isDisabled ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-lg'}`}
    >
      {/* Image Section - 40% Width */}
      <div className="relative w-[40%] bg-gray-50 border-r rtl:border-l rtl:border-r-0 border-gray-100 shrink-0">
        <img
          src={item.image}
          alt={name}
          loading="lazy"
          className="w-full h-full object-cover object-center absolute inset-0"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.dataset.errored) {
              target.dataset.errored = 'true';
              target.src = 'https://placehold.co/600x400/f5f5f5/999999?text=No+Image';
            }
          }}
        />
        
        {/* Out of Stock Overlay */}
        {isDisabled && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white font-bold text-xs uppercase border-2 border-white px-2 py-1 transform -rotate-12">
                    {t.outOfStock}
                </span>
            </div>
        )}

        <div className={`absolute top-2 ${language === 'ar' ? 'right-2' : 'left-2'} flex flex-wrap gap-1 max-w-[90%]`}>
          {item.dietary?.map((tag) => (
            <span 
              key={tag}
              className="text-[8px] md:text-[10px] uppercase font-bold px-1.5 py-0.5 border border-black bg-white text-black shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Content Section - 60% Width */}
      <div className="p-3 md:p-6 flex flex-col justify-between w-[60%]">
        <div>
           {/* Header */}
           <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1 md:mb-3">
             <h3 className="font-bold text-sm md:text-xl text-black leading-tight line-clamp-2 md:line-clamp-none uppercase tracking-wide">
               {name}
             </h3>
           </div>
           
           {/* Description */}
           <p className="text-gray-600 text-xs md:text-base mb-2 md:mb-4 line-clamp-3 font-light leading-relaxed max-w-xl">
             {description}
           </p>
        </div>
        
        {/* Price and Action - Stacked Vertical */}
        <div className="mt-auto flex flex-col items-end gap-2 w-full">
             {/* Price */}
             <div className="font-bold text-base md:text-lg text-black">
                 {item.price.toFixed(3)} {RESTAURANT_CONFIG.currency}
             </div>

             {/* Add Button */}
             <button
               onClick={(e) => { e.stopPropagation(); !isDisabled && onAddToCart(item); }}
               disabled={isDisabled}
               className={`rounded-full px-5 py-1.5 font-bold text-xs md:text-sm uppercase tracking-widest border transition-colors flex items-center gap-1.5 ${
                   isDisabled 
                   ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                   : 'bg-white text-black border-black hover:bg-black hover:text-white active:scale-95'
               }`}
             >
               {isDisabled ? <Ban className="w-3 h-3"/> : <Plus className="w-3 h-3 md:w-4 md:h-4" />}
               <span>{language === 'ar' ? 'أضف' : 'Add'}</span>
             </button>
        </div>
      </div>
    </div>
  );
};
