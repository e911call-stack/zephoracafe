import React, { useEffect, useRef, useState } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2, Send, Utensils, ShoppingBag as BagIcon, Clock, AlertCircle, Banknote, CreditCard, Truck, Ticket, CheckCircle } from 'lucide-react';
import { CartItem, Language, OrderType, Coupon } from '../types';
import { RESTAURANT_CONFIG, TRANSLATIONS } from '../constants';
import { supabase } from '../lib/supabase';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onClear: () => void;
  language: Language;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  user?: any; 
}

type PaymentMethod = 'cod' | 'cliq';

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onRemove,
  onUpdateQuantity,
  onClear,
  language,
  orderType,
  setOrderType,
  user
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [tableNumber, setTableNumber] = useState('');
  const [address, setAddress] = useState('');
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Promo State
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [promoError, setPromoError] = useState('');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  
  const t = TRANSLATIONS[language];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
      if (appliedCoupon.discount_type === 'percentage') {
          discountAmount = subtotal * (appliedCoupon.discount_value / 100);
      } else {
          discountAmount = appliedCoupon.discount_value;
      }
      // Ensure discount doesn't exceed subtotal
      if (discountAmount > subtotal) discountAmount = subtotal;
  }

  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * RESTAURANT_CONFIG.taxRate;
  const total = taxableAmount + tax;

  useEffect(() => {
    if (user && user.user_metadata) {
      if (user.user_metadata.full_name) setCustomerName(user.user_metadata.full_name);
    }
  }, [user]);

  useEffect(() => {
    const checkWorkingHours = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const { openingHour, closingHour } = RESTAURANT_CONFIG;
      const isOpen = currentHour >= openingHour && currentHour < closingHour;
      setIsStoreOpen(isOpen);
    };
    checkWorkingHours();
    const interval = setInterval(checkWorkingHours, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const handleApplyPromo = async () => {
      if (!promoCode.trim()) return;
      setIsValidatingPromo(true);
      setPromoError('');
      setAppliedCoupon(null);

      try {
          const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', promoCode.toUpperCase().trim())
            .single();
          
          if (error || !data) {
              setPromoError(t.invalidCode);
          } else {
              if (data.is_active) {
                  setAppliedCoupon(data as Coupon);
              } else {
                  setPromoError(t.invalidCode);
              }
          }
      } catch (err) {
          setPromoError('Error checking code');
      } finally {
          setIsValidatingPromo(false);
      }
  };

  const handleWhatsAppOrder = async () => {
    if (!isStoreOpen) return;

    if (!customerName.trim()) {
      alert(language === 'ar' ? "الرجاء إدخال الاسم" : "Please enter your name");
      return;
    }
    if (orderType === 'dine-in' && !tableNumber.trim()) {
      alert(language === 'ar' ? "الرجاء إدخال رقم الطاولة" : "Please enter your table number");
      return;
    }
    if (orderType === 'delivery' && !address.trim()) {
      alert(language === 'ar' ? "الرجاء إدخال العنوان" : "Please enter delivery address");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. STOCK CHECK (Optimistic but safer)
      // Fetch latest stock for items in cart
      const itemIds = cartItems.map(i => i.id);
      const { data: stockData } = await supabase.from('menu_items').select('id, stock_quantity, name').in('id', itemIds);
      
      let outOfStockError = '';
      if (stockData) {
          for (const item of cartItems) {
              const dbItem = stockData.find(i => i.id === item.id);
              if (dbItem && dbItem.stock_quantity !== null && dbItem.stock_quantity < item.quantity) {
                  outOfStockError += `\n- ${dbItem.name} (Only ${dbItem.stock_quantity} left)`;
              }
          }
      }

      if (outOfStockError) {
          alert((language === 'ar' ? "عذراً، بعض العناصر غير متوفرة بالكمية المطلوبة:" : "Sorry, some items are out of stock:") + outOfStockError);
          setIsSubmitting(false);
          return;
      }

      // 2. Insert Order
      const { error } = await supabase.from('orders').insert({
        customer_name: customerName,
        user_id: user?.id || null, 
        type: orderType,
        table_number: tableNumber,
        address: address,
        payment_method: paymentMethod,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total_amount: total,
        discount_amount: discountAmount,
        promo_code: appliedCoupon?.code || null,
        status: 'pending'
      });

      if (error) throw error;

      // 3. Update Inventory (Decrement Stock)
      // Ideally this would be a single RPC call, but loop update works for MVP
      for (const item of cartItems) {
          // Only decrement if not infinite (null)
          // We use RPC 'decrement_stock' if possible, but here we do simple update
          // Fetch current again to be safe-ish or just simple update
          const { error: stockError } = await supabase.rpc('decrement_stock', { 
             row_id: item.id, 
             quantity_to_subtract: item.quantity 
          });
          
          // Fallback if RPC doesn't exist (User needs to add RPC or use direct update)
          if (stockError) {
               // Direct update fallback (Race condition prone but acceptable for low volume)
               const dbItem = stockData?.find(i => i.id === item.id);
               if(dbItem && dbItem.stock_quantity !== null) {
                   await supabase.from('menu_items')
                     .update({ stock_quantity: Math.max(0, dbItem.stock_quantity - item.quantity) })
                     .eq('id', item.id);
               }
          }
      }

      // 4. Construct WhatsApp Message
      const orderTypeIcon = orderType === 'dine-in' ? '🍽️' : orderType === 'takeaway' ? '🥡' : '🛵';
      const orderTypeLabel = orderType === 'dine-in' ? t.dineIn : orderType === 'takeaway' ? t.takeaway : t.delivery;
      const paymentLabel = paymentMethod === 'cod' ? t.cod : t.cliq;

      let message = `*${t.messageNewOrder} @ ${RESTAURANT_CONFIG.name}*\n`;
      message += `👤 ${customerName}\n`;
      message += `📋 ${t.messageType}: ${orderTypeIcon} ${orderTypeLabel}\n`;
      
      if (orderType === 'dine-in') message += `🪑 ${t.messageTable}: ${tableNumber}\n`;
      if (orderType === 'delivery') message += `📍 ${t.addressLabel}: ${address}\n`;

      message += `💳 ${t.paymentMethod}: ${paymentLabel}\n`;
      
      message += `\n*${t.messageDetails}:*\n`;
      cartItems.forEach(item => {
        const itemName = language === 'ar' ? (item.name_ar || item.name) : item.name;
        message += `• ${item.quantity}x ${itemName} (${RESTAURANT_CONFIG.currency}${(item.price * item.quantity).toFixed(3)})\n`;
      });
      
      message += `\n${t.subtotal}: ${RESTAURANT_CONFIG.currency}${subtotal.toFixed(3)}\n`;
      
      if (discountAmount > 0) {
          message += `🎟️ ${t.discount} (${appliedCoupon?.code}): -${RESTAURANT_CONFIG.currency}${discountAmount.toFixed(3)}\n`;
      }

      if (tax > 0) message += `${t.tax}: ${RESTAURANT_CONFIG.currency}${tax.toFixed(3)}\n`;
      message += `*${t.total}: ${RESTAURANT_CONFIG.currency}${total.toFixed(3)}*\n\n`;
      message += `${t.messageSentVia}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}?text=${encodedMessage}`;
      
      onClear();
      setAppliedCoupon(null);
      setPromoCode('');
      onClose();
      
      window.open(whatsappUrl, '_blank');

    } catch (e) {
      console.error(e);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[2000] transition-visibility duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      
      <div ref={drawerRef} className={`absolute ${language === 'ar' ? 'left-0' : 'right-0'} top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : (language === 'ar' ? '-translate-x-full' : 'translate-x-full')}`}>
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-black" />
            <h2 className="text-lg font-bold text-black uppercase tracking-wider">{t.yourOrder}</h2>
            <span className="bg-black text-white text-xs font-bold px-2 py-0.5 rounded-none">{cartItems.length} {t.items}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-black transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-grow overflow-y-auto p-5 space-y-4">
          {!isStoreOpen && cartItems.length > 0 && (
            <div className="bg-gray-50 border border-black rounded-none p-3 flex items-start gap-3">
              <Clock className="w-5 h-5 text-black shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-black text-sm">{t.restaurantClosed}</h4>
                <p className="text-gray-600 text-xs mt-0.5">{t.openingHours}: <span dir="ltr">{t.openingHoursRange}</span></p>
              </div>
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center"><ShoppingBag className="w-8 h-8 text-gray-400" /></div>
              <div>
                <p className="text-black font-medium text-lg font-serif">{t.emptyCart}</p>
                <p className="text-gray-500 text-sm mt-1">{t.emptyCartDesc}</p>
              </div>
              <button onClick={onClose} className="px-6 py-2 bg-black text-white rounded-none text-sm font-medium hover:bg-gray-800 transition-colors uppercase tracking-widest border border-black">{t.startOrdering}</button>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-3 mb-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3 p-2.5 border border-gray-200 rounded-none hover:border-black transition-colors bg-white">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover bg-gray-50 grayscale" />
                    <div className="flex-grow flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm text-black line-clamp-1 uppercase tracking-wide">{language === 'ar' ? (item.name_ar || item.name) : item.name}</h3>
                        <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-black transition-colors p-0.5"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-bold text-sm text-black">{RESTAURANT_CONFIG.currency}{(item.price * item.quantity).toFixed(3)}</span>
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-0.5">
                          <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-white text-black hover:bg-black hover:text-white disabled:opacity-50 transition-colors" disabled={item.quantity <= 1}><Minus className="w-3 h-3" /></button>
                          <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-white text-black hover:bg-black hover:text-white transition-colors"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Form */}
              <div className={`bg-white p-4 border border-black space-y-4 ${!isStoreOpen ? 'opacity-50 pointer-events-none' : ''}`}>
                <h3 className="font-bold text-black text-xs uppercase tracking-widest border-b border-gray-200 pb-2">{t.messageDetails}</h3>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.nameLabel}</label>
                  <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder={t.namePlaceholder} disabled={!isStoreOpen} className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.serviceType}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ type: 'dine-in', icon: Utensils, label: t.dineIn }, { type: 'takeaway', icon: BagIcon, label: t.takeaway }, { type: 'delivery', icon: Truck, label: t.delivery }].map((opt) => (
                      <button key={opt.type} onClick={() => setOrderType(opt.type as OrderType)} disabled={!isStoreOpen} className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-none text-[10px] font-medium transition-all border ${orderType === opt.type ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-black'}`}>
                        <opt.icon className="w-4 h-4" />
                        <span className="truncate w-full text-center">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {orderType === 'dine-in' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.tableLabel}</label>
                    <input type="text" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder={t.tablePlaceholder} disabled={!isStoreOpen} className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black text-sm bg-white" />
                  </div>
                )}
                {orderType === 'delivery' && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.addressLabel}</label>
                    <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} disabled={!isStoreOpen} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-none focus:outline-none focus:border-black text-sm bg-white resize-none" />
                  </div>
                )}
                <div>
                   <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.paymentMethod}</label>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => setPaymentMethod('cod')} disabled={!isStoreOpen} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-none text-xs font-bold transition-all border ${paymentMethod === 'cod' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black'}`}><Banknote className="w-4 h-4" />{t.cod}</button>
                     <button onClick={() => setPaymentMethod('cliq')} disabled={!isStoreOpen} className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-none text-xs font-bold transition-all border ${paymentMethod === 'cliq' ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black'}`}><CreditCard className="w-4 h-4" />{t.cliq}</button>
                   </div>
                </div>
              </div>
            </>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-5 border-t border-gray-200 bg-white">
            {/* Promo Code Input */}
            <div className="mb-4">
                 <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t.promoCode}</label>
                 <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={promoCode}
                       onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
                       placeholder="SUMMER20"
                       className="flex-1 px-3 py-2 border border-gray-300 rounded-none text-sm uppercase focus:outline-none focus:border-black"
                       disabled={!!appliedCoupon}
                     />
                     {appliedCoupon ? (
                         <button onClick={() => { setAppliedCoupon(null); setPromoCode(''); }} className="bg-red-500 text-white px-3 py-2"><X className="w-4 h-4"/></button>
                     ) : (
                         <button onClick={handleApplyPromo} disabled={isValidatingPromo} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase disabled:opacity-50">{t.apply}</button>
                     )}
                 </div>
                 {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
                 {appliedCoupon && <p className="text-green-600 text-xs mt-1 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Coupon Applied!</p>}
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-gray-600 text-sm font-serif">
                <span>{t.subtotal}</span>
                <span>{RESTAURANT_CONFIG.currency}{subtotal.toFixed(3)}</span>
              </div>
              
              {appliedCoupon && (
                 <div className="flex justify-between text-green-600 text-sm font-serif">
                    <span>{t.discount} ({appliedCoupon.code})</span>
                    <span>-{RESTAURANT_CONFIG.currency}{discountAmount.toFixed(3)}</span>
                 </div>
              )}

              {tax > 0 && (
                 <div className="flex justify-between text-gray-600 text-sm font-serif">
                  <span>{t.tax} ({(RESTAURANT_CONFIG.taxRate * 100).toFixed(0)}%)</span>
                  <span>{RESTAURANT_CONFIG.currency}{tax.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-black font-bold text-xl pt-2 border-t border-gray-200 mt-2 font-serif">
                <span>{t.total}</span>
                <span>{RESTAURANT_CONFIG.currency}{total.toFixed(3)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                className={`w-full py-3.5 rounded-none font-bold flex items-center justify-center gap-2 transition-colors uppercase tracking-widest border border-black ${isStoreOpen && !isSubmitting ? 'bg-black text-white hover:bg-white hover:text-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed border-none'}`}
                onClick={handleWhatsAppOrder}
                disabled={!isStoreOpen || isSubmitting}
              >
                {isSubmitting ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>Sending...</> : isStoreOpen ? <><Send className="w-5 h-5" />{t.checkout}</> : <><AlertCircle className="w-5 h-5" />{t.restaurantClosed}</>}
              </button>
              <button onClick={onClear} className="text-gray-400 text-xs font-medium hover:text-black transition-colors text-center mt-1 uppercase tracking-widest">{t.clearCart}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};