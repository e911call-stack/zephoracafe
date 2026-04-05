import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  UtensilsCrossed, 
  Salad, 
  IceCream, 
  Coffee, 
  LayoutGrid,
  Sandwich,
  Soup,
  GlassWater,
  PartyPopper,
  Instagram,
  Facebook,
  Twitter,
  Phone,
  MapPin,
  Clock,
  Utensils,
  ShoppingBag,
  Truck,
  MessageCircle,
  Pizza,
  X,
  Lock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Header } from './components/Header';
import { MenuGrid } from './components/MenuGrid';
import { CartDrawer } from './components/CartDrawer';
import { InstallPrompt } from './components/InstallPrompt';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { ProductModal } from './components/ProductModal';
import { MenuItem, CartItem, Language, OrderType } from './types';
import { MENU_ITEMS as FALLBACK_MENU, TRANSLATIONS, RESTAURANT_CONFIG } from './constants';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  // Initialize Cart from LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('zephora_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [language, setLanguage] = useState<Language>('ar');
  const [isScrolled, setIsScrolled] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Auth States
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // Product View State
  const [viewingProduct, setViewingProduct] = useState<MenuItem | null>(null);

  // Notification State
  const [notification, setNotification] = useState<string | null>(null);
  
  // Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [dbCategories, setDbCategories] = useState<{id: string; name_en: string; name_ar: string; sort_order: number}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for admin flag in URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setIsAdmin(true);
    }

    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  // Handle Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('zephora_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('LocalStorage error');
    }
  }, [cart]);

  // Notification Timer
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch categories from DB
  const fetchCategories = React.useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .order('name_en');
    if (data && data.length > 0) {
      setDbCategories(data);
    }
  }, []);

  // Fetch Menu from Supabase
  const fetchMenu = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.error('Supabase error:', error.message);
        setMenuItems(FALLBACK_MENU);
        setIsUsingFallback(true);
      } else {
        setMenuItems(data || []);
        setIsUsingFallback(false);
      }
    } catch (err) {
      console.error('Network error:', err);
      setMenuItems(FALLBACK_MENU);
      setIsUsingFallback(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    fetchCategories();

    // Realtime: update instantly when admin changes menu or categories
    const channel = supabase
      .channel('menu-public')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        fetchMenu();
        fetchCategories();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMenu, fetchCategories]);

  // Handle Scroll Effect on the scrollable container
  useEffect(() => {
    const container = scrollContainerRef.current;
    const handleScroll = () => {
      if (container) {
        setIsScrolled(container.scrollTop > 50); 
      }
    };
    
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((i) => i.id === item.id);
      if (existingItem) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
    
    // Show notification instead of opening cart immediately
    const itemName = language === 'ar' ? (item.name_ar || item.name) : item.name;
    setNotification(`${itemName} ${language === 'ar' ? 'أضيف للسلة' : 'added to cart'}`);
  };

  const removeFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => setCart([]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Reset search when category is changed
  };

  const handleAuthClick = () => {
    if (user) {
      setIsProfileOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileOpen(false);
  };

  const handleProductClick = (item: MenuItem) => {
    setViewingProduct(item);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Build bilingual categories — prefer DB categories table, fall back to menu_items data
  const categories = useMemo(() => {
    if (dbCategories.length > 0) {
      // Use dedicated categories table (most reliable, admin-managed)
      return dbCategories.filter(c => c.name_en && c.name_en.length > 1);
    }
    // Fallback: derive from menu items when categories table is empty
    const catMap = new Map<string, {id: string; name_en: string; name_ar: string; sort_order: number}>();
    menuItems.forEach(item => {
      if (item.category && typeof item.category === 'string' && item.category.length > 1 && isNaN(parseFloat(item.category))) {
        catMap.set(item.category, {
          id: item.category,
          name_en: item.category,
          name_ar: item.category_ar || item.category,
          sort_order: 0
        });
      }
    });
    return Array.from(catMap.values()).sort((a, b) => a.name_en.localeCompare(b.name_en));
  }, [dbCategories, menuItems]);

  // Auto-select first valid category
  useEffect(() => {
    if (categories.length > 0) {
      const currentIsValid = categories.some(c => c.name_en === selectedCategory);
      if (selectedCategory === 'All' || !currentIsValid) {
        setSelectedCategory(categories[0].name_en);
      }
    }
  }, [categories, selectedCategory]);

  // Filter items based on search query OR category
  const filteredItems = useMemo(() => {
    // 1. Base Filter: Exclude Inactive Items AND Out of Stock Items (0 quantity)
    // Note: stock_quantity === null/undefined implies infinite stock
    let items = menuItems.filter(item => {
       const isActive = item.is_available !== false;
       const hasStock = item.stock_quantity === undefined || item.stock_quantity === null || item.stock_quantity > 0;
       return isActive && hasStock;
    });

    // 2. Filter by category (Since "All" is gone, we always filter unless categories are empty)
    if (categories.length > 0 && selectedCategory !== 'All') {
      // Always filter by English category name (internal key)
      items = items.filter(item => item.category === selectedCategory);
    }

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        (item.name_ar && item.name_ar.toLowerCase().includes(query)) ||
        item.description.toLowerCase().includes(query) ||
        (item.description_ar && item.description_ar.toLowerCase().includes(query))
      );
    }
    return items;
  }, [selectedCategory, searchQuery, menuItems, categories]);

  const t = TRANSLATIONS[language];

  // If in Admin Mode, render the Dashboard
  if (isAdmin) {
    return <AdminDashboard onExit={() => {
      setIsAdmin(false);
      try {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({path:newUrl},'',newUrl);
      } catch (e) {
        console.warn("History update restricted");
      }
    }} />;
  }

  return (
    <div className={`min-h-screen flex bg-white text-black overflow-hidden ${language === 'ar' ? 'font-[Cairo]' : 'font-[Playfair_Display]'}`}>
      
      {/* LEFT SIDE: Desktop Sidebar with Branding & Controls (50% width) */}
      <div className="hidden xl:flex xl:w-[50%] h-screen sticky top-0 overflow-hidden relative flex-col items-center justify-center text-white shadow-2xl z-20 transition-all duration-300">
        <div className="absolute inset-0 z-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://ik.imagekit.io/g7p1qn7or/AQPpQaXQwKKyeSk-K2LoWHrD3JroWh5yZNW5JpxtAJSUB4gtCdLodXsC04Oxv2GlRQRlkq2ZD2i-H2ay5Jk0X75W5M7TDzgq.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-2xl w-full h-full justify-center">
            <img 
              src="https://ik.imagekit.io/g7p1qn7or/favicon.png" 
              alt="Zephora Logo" 
              className="w-40 h-40 object-contain mb-6 drop-shadow-2xl"
            />
            
            <p className="text-xl text-gray-100 leading-relaxed font-light mb-12 drop-shadow-md">
              Experience the finest flavors in town. From gourmet burgers to artisanal coffee, we serve passion in every bite.
            </p>

            <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mb-16">
              <button 
                onClick={() => setOrderType('dine-in')}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-none border transition-all duration-300 group hover:scale-105 ${
                  orderType === 'dine-in' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white border-white/50 hover:border-white hover:bg-white/10'
                }`}
              >
                <Utensils className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.dineIn}</span>
              </button>

              <button 
                onClick={() => setOrderType('delivery')}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-none border transition-all duration-300 group hover:scale-105 ${
                  orderType === 'delivery' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white border-white/50 hover:border-white hover:bg-white/10'
                }`}
              >
                <Truck className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.delivery}</span>
              </button>

              <button 
                onClick={() => setOrderType('takeaway')}
                className={`flex flex-col items-center justify-center py-3 px-1 rounded-none border transition-all duration-300 group hover:scale-105 ${
                  orderType === 'takeaway' 
                  ? 'bg-white text-black border-white' 
                  : 'bg-transparent text-white border-white/50 hover:border-white hover:bg-white/10'
                }`}
              >
                <ShoppingBag className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{t.takeaway}</span>
              </button>
            </div>

            <div className="w-full flex flex-col items-center justify-center gap-y-4 border-t border-white/20 pt-6 mt-auto">
               <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
                   <div className="flex gap-3">
                      <a 
                        href={`https://wa.me/${RESTAURANT_CONFIG.whatsappNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a 
                        href={RESTAURANT_CONFIG.instagramUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                   </div>
                   
                   <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-100">
                     <a href={`tel:${RESTAURANT_CONFIG.whatsappNumber}`} className="flex items-center gap-2 hover:text-white transition-colors group">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr" className="font-medium tracking-wide">{RESTAURANT_CONFIG.whatsappNumber}</span>
                     </a>
                     
                     <a href={RESTAURANT_CONFIG.locationUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors group">
                        <MapPin className="w-4 h-4" />
                        <span className="max-w-[150px] truncate">{t.addressText}</span>
                     </a>

                     <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className="max-w-[150px] truncate">{t.openingHoursText}</span>
                     </div>
                   </div>
               </div>
               
               <button 
                 onClick={() => setIsAdmin(true)}
                 className="flex items-center gap-2 text-[10px] text-white/30 hover:text-white transition-colors uppercase tracking-widest"
               >
                 <Lock className="w-3 h-3" />
                 Admin Access
               </button>
            </div>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative bg-gray-50/50 pb-24"
      >
        <Header 
          cartItemCount={totalItems} 
          onOpenCart={() => setIsCartOpen(true)}
          language={language}
          setLanguage={setLanguage}
          isScrolled={isScrolled}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAuth={handleAuthClick}
          isLoggedIn={!!user}
        />
        
        <div className="xl:hidden relative h-64 w-full bg-black flex items-center justify-center overflow-hidden shrink-0">
          <div className="absolute inset-0 opacity-70">
             <img 
               src="https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80" 
               alt="Background" 
               className="w-full h-full object-cover"
             />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <img 
             src="https://ik.imagekit.io/g7p1qn7or/favicon.png" 
             alt="Logo" 
             className="relative z-10 w-40 h-40 object-contain drop-shadow-2xl"
          />
        </div>
        
        {isUsingFallback && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 m-4" role="alert">
            <div className="flex items-center gap-2">
               <AlertTriangle className="w-5 h-5" />
               <p className="font-bold">Demo Mode</p>
            </div>
            <p className="text-sm mt-1">
               Unable to connect to the database. Showing demo data.
            </p>
          </div>
        )}
        {!isUsingFallback && !isLoading && menuItems.length === 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 m-4" role="alert">
            <div className="flex items-center gap-2">
               <CheckCircle className="w-5 h-5 text-blue-500" />
               <p className="font-bold">Database Connected</p>
            </div>
            <p className="text-sm mt-1">
               Menu is empty. Add items via the Admin panel to display them here.
            </p>
          </div>
        )}

        {/* Simplified Mobile Menu - Sticky at top-16 */}
        <div 
          className="sticky top-16 z-[490] bg-white/95 backdrop-blur-sm border-b border-gray-200 py-3 shadow-sm transition-all duration-300"
        >
          <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 min-w-max pb-1">
              {categories.map((cat) => (
                <button
                  key={cat.name_en}
                  onClick={() => handleCategorySelect(cat.name_en)}
                  className={`px-4 py-2 rounded-full border transition-all duration-300 text-sm font-bold uppercase tracking-wide whitespace-nowrap ${
                    selectedCategory === cat.name_en && !searchQuery
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-500 hover:text-black hover:border-black border-gray-200'
                  }`}
                >
                  {language === 'ar' ? cat.name_ar : cat.name_en}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="container mx-auto px-1.5 md:px-6 py-4 md:py-8 max-w-4xl min-h-[500px]">
          {isLoading && (
            <div className="flex justify-center py-20">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
          )}

          {!isLoading && searchQuery && (
              <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 border border-gray-200 animate-in fade-in duration-300">
                  <p className="text-sm text-gray-600">
                      {t.searchResults}: <span className="font-bold text-black">"{searchQuery}"</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="text-xs">{filteredItems.length} {t.items}</span>
                  </p>
                  <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider flex items-center gap-1 bg-white border border-gray-200 px-2 py-1 rounded-sm hover:bg-gray-50"
                  >
                      <X className="w-3 h-3" />
                      {t.clearSearch}
                  </button>
              </div>
          )}

          {!isLoading && searchQuery && filteredItems.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-center">
               <p className="text-gray-500 text-lg">
                 {t.noResults}
               </p>
             </div>
          ) : !isLoading && (
            <MenuGrid 
              items={filteredItems} 
              onAddToCart={addToCart} 
              language={language} 
              onProductClick={handleProductClick}
            />
          )}

          <div className="mt-12 mb-8 flex justify-center xl:hidden opacity-30 hover:opacity-100">
             <button onClick={() => setIsAdmin(true)} className="flex items-center gap-2 text-xs text-gray-400">
                <Lock className="w-3 h-3" />
                Admin Access
             </button>
          </div>
        </main>

        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cartItems={cart}
          onRemove={removeFromCart}
          onUpdateQuantity={updateQuantity}
          onClear={clearCart}
          language={language}
          orderType={orderType}
          setOrderType={setOrderType}
          user={user}
        />
        
        <InstallPrompt language={language} />
        
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
          language={language}
        />

        <UserProfile
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          user={user}
          onLogout={handleLogout}
          language={language}
        />

        <ProductModal 
           isOpen={!!viewingProduct}
           product={viewingProduct}
           onClose={() => setViewingProduct(null)}
           language={language}
           onAddToCart={addToCart}
        />
        
        {/* Toast Notification */}
        {notification && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[80] animate-in slide-in-from-bottom-5 fade-in duration-300">
             <div className="bg-black/90 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-bold text-sm">{notification}</span>
             </div>
          </div>
        )}

        <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
           <div className="grid grid-cols-3 gap-2 container mx-auto max-w-lg">
              <button 
                onClick={() => setOrderType('dine-in')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-none border transition-all duration-300 ${
                  orderType === 'dine-in' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                }`}
              >
                <Utensils className={`w-4 h-4 mb-1 ${orderType === 'dine-in' ? 'text-white' : 'text-black'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.dineIn}</span>
              </button>

              <button 
                onClick={() => setOrderType('delivery')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-none border transition-all duration-300 ${
                  orderType === 'delivery' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                }`}
              >
                <Truck className={`w-4 h-4 mb-1 ${orderType === 'delivery' ? 'text-white' : 'text-black'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.delivery}</span>
              </button>

              <button 
                onClick={() => setOrderType('takeaway')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-none border transition-all duration-300 ${
                  orderType === 'takeaway' 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-black'
                }`}
              >
                <ShoppingBag className={`w-4 h-4 mb-1 ${orderType === 'takeaway' ? 'text-white' : 'text-black'}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{t.takeaway}</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
export default App;
