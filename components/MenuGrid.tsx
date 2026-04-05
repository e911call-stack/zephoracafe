import React from 'react';
import { MenuItem, Language } from '../types';
import { MenuItemCard } from './MenuItemCard';

interface MenuGridProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  language: Language;
  onProductClick: (item: MenuItem) => void;
}

export const MenuGrid: React.FC<MenuGridProps> = ({ items, onAddToCart, language, onProductClick }) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 text-lg">No items found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((item) => (
        <MenuItemCard 
            key={item.id} 
            item={item} 
            onAddToCart={onAddToCart} 
            language={language}
            onProductClick={onProductClick}
        />
      ))}
    </div>
  );
};