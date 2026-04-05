import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, ShoppingBag, MapPin, LogOut, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Language, Order } from '../types';
import { RESTAURANT_CONFIG } from '../constants';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onLogout: () => void;
  language: Language;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user, onLogout, language }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchOrderHistory();
    }
  }, [isOpen, user]);

  const fetchOrderHistory = async () => {
    setLoadingOrders(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) setOrders(data as Order[]);
    setLoadingOrders(false);
  };

  if (!isOpen) return null;

  const t = {
    en: {
      title: "My Profile",
      orders: "Order History",
      noOrders: "No orders found.",
      logout: "Logout",
      items: "Items",
      total: "Total",
      date: "Date"
    },
    ar: {
      title: "ملفي الشخصي",
      orders: "سجل الطلبات",
      noOrders: "لا توجد طلبات سابقة.",
      logout: "تسجيل خروج",
      items: "عناصر",
      total: "المجموع",
      date: "التاريخ"
    }
  }[language];

  return (
    <div className="fixed inset-0 z-[2000] flex justify-end">
       <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
       
       <div className={`relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ${language === 'ar' ? 'animate-in slide-in-from-left' : 'animate-in slide-in-from-right'}`}>
          
          {/* Header */}
          <div className="p-6 bg-black text-white flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                   <User className="w-5 h-5" /> {t.title}
                </h2>
                <p className="text-sm text-gray-300 mt-1">{user.user_metadata?.full_name || user.email}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
             </div>
             <button onClick={onClose} className="text-white/70 hover:text-white">
                <X className="w-6 h-6" />
             </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
             {/* Order History */}
             <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> {t.orders}
             </h3>

             {loadingOrders ? (
                <div className="flex justify-center py-8">
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
             ) : orders.length > 0 ? (
                <div className="space-y-3">
                   {orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-sm overflow-hidden">
                         <div 
                           onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                           className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                         >
                            <div>
                               <p className="font-bold text-sm">#{order.id.slice(0,6)}</p>
                               <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <span className="font-bold text-sm">{RESTAURANT_CONFIG.currency} {order.total_amount.toFixed(3)}</span>
                               {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                         </div>
                         
                         {expandedOrder === order.id && (
                            <div className="p-3 bg-gray-50 border-t border-gray-100 text-sm">
                               <div className="space-y-1 mb-2">
                                  {order.items.map((item, idx) => (
                                     <div key={idx} className="flex justify-between text-gray-600">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>{item.price.toFixed(3)}</span>
                                     </div>
                                  ))}
                               </div>
                               <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
                                  <span className="text-xs text-gray-400 uppercase tracking-wider">{order.type}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                     {order.status}
                                  </span>
                               </div>
                            </div>
                         )}
                      </div>
                   ))}
                </div>
             ) : (
                <p className="text-center text-gray-400 py-8 italic">{t.noOrders}</p>
             )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-gray-200 bg-white">
             <button 
               onClick={onLogout}
               className="w-full flex items-center justify-center gap-2 bg-gray-100 text-red-600 font-bold py-3 hover:bg-red-50 transition-colors uppercase tracking-widest"
             >
                <LogOut className="w-4 h-4" /> {t.logout}
             </button>
          </div>
       </div>
    </div>
  );
};