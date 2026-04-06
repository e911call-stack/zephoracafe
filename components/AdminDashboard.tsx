import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  LogOut,
  Package,
  BarChart3,
  ShoppingBag,
  RefreshCcw,
  Loader2,
  Image as ImageIcon,
  Terminal,
  Wifi,
  WifiOff,
  Search,
  Ticket,
  TrendingUp,
  Clock,
  Calendar,
  Award,
  PieChart,
  TrendingDown
} from 'lucide-react';
import { MenuItem, Order, Coupon } from '../types';
import { supabase } from '../lib/supabase';
import { AdminLogin } from './AdminLogin';

// Helper function to generate UUID
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface AdminDashboardProps {
  onExit: () => void;
}

// Types for enhanced analytics
interface ProductSales {
  productId: string;
  name: string;
  name_ar: string;
  category: string;
  category_ar: string;
  quantity: number;
  revenue: number;
}

interface CategoryPerformance {
  category: string;
  category_ar: string;
  revenue: number;
  orders: number;
}

interface TimePeriodSales {
  daily: number;
  weekly: number;
  monthly: number;
  dailyOrders: number;
  weeklyOrders: number;
  monthlyOrders: number;
  dailyAvg: number;
  weeklyAvg: number;
  monthlyAvg: number;
}

// Translations
const translations = {
  en: {
    // Header
    admin: "ZEPHORA ADMIN",
    live: "LIVE",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    logout: "Logout",
    
    // Sidebar
    orders: "orders",
    products: "products",
    coupons: "coupons",
    stats: "stats",
    setupSql: "Setup SQL",
    
    // Orders Tab
    searchOrders: "Search orders...",
    all: "All",
    pending: "Pending",
    completed: "Completed",
    cancelled: "Cancelled",
    customer: "Customer",
    total: "Total",
    promo: "Promo",
    status: "Status",
    noOrders: "No orders found",
    
    // Products Tab
    menuItems: "Menu Items",
    searchProducts: "Search products...",
    export: "Export",
    import: "Import",
    addProduct: "Add Product",
    img: "Img",
    product: "Product",
    category: "Category",
    categoryAr: "Category (Arabic)",
    idSku: "ID / SKU",
    price: "Price",
    stock: "Stock",
    on: "On",
    off: "Off",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    noProducts: 'No products found matching "{search}"',
    outOfStock: "Out of stock",
    lowStock: "Low stock",
    
    // Coupons Tab
    promoCodes: "Promo Codes",
    addCoupon: "Add Coupon",
    active: "ACTIVE",
    inactive: "INACTIVE",
    percentage: "% OFF",
    fixed: "KWD OFF",
    couponPerformance: "Coupon Performance",
    used: "Used",
    times: "times",
    totalDiscount: "Total Discount",
    
    // Stats Tab
    day: "Day",
    week: "Week",
    month: "Month",
    revenue: "Revenue",
    orders_count: "Orders",
    averageOrder: "Average Order",
    conversion: "Conversion",
    today: "Today",
    thisWeek: "This Week",
    thisMonth: "This Month",
    perOrder: "Per Order",
    completedRate: "Completed Rate",
    topSelling: "Top Selling Products",
    categoryPerformance: "Category Performance",
    quickStats: "Quick Stats",
    totalProducts: "Total Products",
    activeCoupons: "Active Coupons",
    categories: "Categories",
    lowStock: "Low Stock",
    sold: "sold",
    noSales: "No sales data for this period",
    noCategoryData: "No category data available",
    
    // Modals
    editCoupon: "Edit Coupon",
    newCoupon: "New Coupon",
    code: "Code",
    type: "Type",
    value: "Value",
    cancel: "Cancel",
    save: "Save",
    editProduct: "Edit Product",
    newProduct: "Add Product",
    productNameEn: "Product Name (English)",
    productNameAr: "Product Name (Arabic)",
    descriptionEn: "Description (English)",
    descriptionAr: "Description (Arabic)",
    skuOptional: "SKU (Optional)",
    inventoryStatus: "Inventory & Status",
    stockQuantity: "Stock Quantity",
    activeVisible: "Active (Visible on Menu)",
    productImage: "Product Image",
    imageUrl: "Or Image URL",
    selectCategory: "Select a Category",
    selectCategoryAr: "Select Category (Arabic)",
    createNewCategory: "+ Create New Category",
    createNewCategoryAr: "+ إنشاء فئة جديدة",
    enterNewCategory: "Enter new category name...",
    enterNewCategoryAr: "أدخل اسم الفئة الجديدة...",
    
    // Confirmations
    deleteConfirm: "Are you sure you want to delete this product?",
    deleteCouponConfirm: "Delete this coupon?",
    
    // Errors
    dbSchemaError: "Database Schema Error: Your database is missing columns. Please click the 'Setup SQL' button.",
    saveFailed: "Save failed: ",
    deleteFailed: "Delete failed: ",
    importFailed: "Import failed: ",
    importSuccess: "Successfully imported ",
    items: "items!",
    readingFile: "Reading file...",
    importing: "Importing ",
    
    // Placeholders
    cheeseBurger: "e.g. Cheese Burger",
    cheeseBurgerAr: "مثال: تشيز برجر",
    enterDetails: "Enter details...",
    enterDetailsAr: "أدخل التفاصيل...",
    skuPlaceholder: "e.g. BGR-001",
    couponPlaceholder: "SUMMER20",
    search: "Search...",
    categoryPlaceholder: "e.g. Burgers",
    categoryPlaceholderAr: "مثال: برجر"
  },
  ar: {
    // Header
    admin: "زيفورا إدارة",
    live: "مباشر",
    refresh: "تحديث",
    refreshing: "جاري التحديث...",
    logout: "تسجيل خروج",
    
    // Sidebar
    orders: "الطلبات",
    products: "المنتجات",
    coupons: "كوبونات",
    stats: "إحصائيات",
    setupSql: "إعداد SQL",
    
    // Orders Tab
    searchOrders: "بحث في الطلبات...",
    all: "الكل",
    pending: "قيد الانتظار",
    completed: "مكتمل",
    cancelled: "ملغي",
    customer: "العميل",
    total: "الإجمالي",
    promo: "خصم",
    status: "الحالة",
    noOrders: "لا توجد طلبات",
    
    // Products Tab
    menuItems: "عناصر القائمة",
    searchProducts: "بحث في المنتجات...",
    export: "تصدير",
    import: "استيراد",
    addProduct: "إضافة منتج",
    img: "صورة",
    product: "المنتج",
    category: "الفئة",
    categoryAr: "الفئة (عربي)",
    idSku: "المعرف / الرمز",
    price: "السعر",
    stock: "المخزون",
    on: "نشط",
    off: "غير نشط",
    actions: "إجراءات",
    edit: "تعديل",
    delete: "حذف",
    noProducts: 'لا توجد منتجات تطابق "{search}"',
    outOfStock: "نفذ من المخزون",
    lowStock: "مخزون منخفض",
    
    // Coupons Tab
    promoCodes: "رموز الخصم",
    addCoupon: "إضافة كوبون",
    active: "نشط",
    inactive: "غير نشط",
    percentage: "٪ خصم",
    fixed: "د.ك خصم",
    couponPerformance: "أداء الكوبونات",
    used: "استخدم",
    times: "مرات",
    totalDiscount: "إجمالي الخصم",
    
    // Stats Tab
    day: "يوم",
    week: "أسبوع",
    month: "شهر",
    revenue: "الإيرادات",
    orders_count: "الطلبات",
    averageOrder: "متوسط الطلب",
    conversion: "معدل الإنجاز",
    today: "اليوم",
    thisWeek: "هذا الأسبوع",
    thisMonth: "هذا الشهر",
    perOrder: "لكل طلب",
    completedRate: "نسبة المكتمل",
    topSelling: "الأكثر مبيعاً",
    categoryPerformance: "أداء الفئات",
    quickStats: "إحصائيات سريعة",
    totalProducts: "إجمالي المنتجات",
    activeCoupons: "كوبونات نشطة",
    categories: "فئات",
    lowStock: "مخزون منخفض",
    sold: "مباع",
    noSales: "لا توجد مبيعات لهذه الفترة",
    noCategoryData: "لا توجد بيانات للفئات",
    
    // Modals
    editCoupon: "تعديل الكوبون",
    newCoupon: "كوبون جديد",
    code: "الرمز",
    type: "النوع",
    value: "القيمة",
    cancel: "إلغاء",
    save: "حفظ",
    editProduct: "تعديل المنتج",
    newProduct: "إضافة منتج",
    productNameEn: "اسم المنتج (إنجليزي)",
    productNameAr: "اسم المنتج (عربي)",
    descriptionEn: "الوصف (إنجليزي)",
    descriptionAr: "الوصف (عربي)",
    skuOptional: "رمز SKU (اختياري)",
    inventoryStatus: "المخزون والحالة",
    stockQuantity: "كمية المخزون",
    activeVisible: "نشط (ظاهر في القائمة)",
    productImage: "صورة المنتج",
    imageUrl: "أو رابط الصورة",
    selectCategory: "اختر فئة",
    selectCategoryAr: "اختر الفئة (عربي)",
    createNewCategory: "+ إنشاء فئة جديدة",
    createNewCategoryAr: "+ إنشاء فئة جديدة",
    enterNewCategory: "أدخل اسم الفئة الجديدة...",
    enterNewCategoryAr: "أدخل اسم الفئة الجديدة...",
    
    // Confirmations
    deleteConfirm: "هل أنت متأكد من حذف هذا المنتج؟",
    deleteCouponConfirm: "حذف هذا الكوبون؟",
    
    // Errors
    dbSchemaError: "خطأ في قاعدة البيانات: الرجاء النقر على زر 'إعداد SQL'",
    saveFailed: "فشل الحفظ: ",
    deleteFailed: "فشل الحذف: ",
    importFailed: "فشل الاستيراد: ",
    importSuccess: "تم استيراد ",
    items: "عناصر بنجاح!",
    readingFile: "جاري قراءة الملف...",
    importing: "جاري استيراد ",
    
    // Placeholders
    cheeseBurger: "مثال: تشيز برجر",
    cheeseBurgerAr: "مثال: تشيز برجر",
    enterDetails: "أدخل التفاصيل...",
    enterDetailsAr: "أدخل التفاصيل...",
    skuPlaceholder: "مثال: BGR-001",
    couponPlaceholder: "SUMMER20",
    search: "بحث...",
    categoryPlaceholder: "مثال: برجر",
    categoryPlaceholderAr: "مثال: برجر"
  }
};

// Updated SQL to include category_ar column
const SETUP_SQL = `
-- RUN THIS IN SUPABASE SQL EDITOR TO ADD CATEGORY ARABIC COLUMN

-- Add category_ar column to menu_items if it doesn't exist
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS category_ar text;

-- Update existing categories to have Arabic versions (you can modify these)
UPDATE menu_items SET category_ar = category WHERE category_ar IS NULL;

-- Enable RLS
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public Read Menu" ON menu_items;
DROP POLICY IF EXISTS "Admin Insert Menu" ON menu_items;
DROP POLICY IF EXISTS "Admin Update Menu" ON menu_items;
DROP POLICY IF EXISTS "Admin Delete Menu" ON menu_items;

-- Create policies
CREATE POLICY "Public Read Menu" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Admin Insert Menu" ON menu_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin Update Menu" ON menu_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Delete Menu" ON menu_items FOR DELETE TO authenticated USING (true);

-- Storage Policies
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-assets', 'menu-assets', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Images" ON storage.objects;
CREATE POLICY "Public Read Images" ON storage.objects FOR SELECT USING (bucket_id = 'menu-assets');

DROP POLICY IF EXISTS "Admin All Images" ON storage.objects;
CREATE POLICY "Admin All Images" ON storage.objects FOR ALL USING (bucket_id = 'menu-assets' AND auth.role() = 'authenticated');
`;

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'manager'>('admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'coupons' | 'stats'>('orders');
  const [statsTimeframe, setStatsTimeframe] = useState<'day' | 'week' | 'month'>('day');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Data State
  const [products, setProducts] = useState<MenuItem[]>([]); 
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  
  // UI State
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingCategoryAr, setIsCreatingCategoryAr] = useState(false);
  
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);

  // Category Management State
  const [dbCategories, setDbCategories] = useState<{id: string; name_en: string; name_ar: string; sort_order: number}[]>([]);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{id: string; name_en: string; name_ar: string; sort_order: number} | null>(null);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [userEmail, setUserEmail] = useState<string>('');
  
  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Other States
  const [orderSearch, setOrderSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [orderSort, setOrderSort] = useState<{ key: keyof Order; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });
  const [isImporting, setIsImporting] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current translations
  const t = translations[language];

  // Add a flag to prevent multiple simultaneous refreshes
  const isRefreshing = useRef(false);

  // Initialize audio without blocking
  useEffect(() => {
    const timer = setTimeout(() => {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Check user on mount
  useEffect(() => { 
    checkUser(); 
  }, []);

  // Handle new orders with sound
  const handleNewOrder = useCallback((payload: any) => {
    const newOrder = payload.new as Order;
    setOrders(prev => [newOrder, ...prev]);
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio autoplay blocked:", e));
    }
  }, [soundEnabled]);

  // Realtime subscription
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('admin-dashboard')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' }, 
        handleNewOrder
      )
      // FIXED: Subscribe to menu_items changes so admin sees immediate updates
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => { fetchData(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAuthenticated, handleNewOrder]);

  const checkUser = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUserEmail(session.user.email || '');
        const role = session.user.user_metadata?.role === 'manager' ? 'manager' : 'admin';
        setUserRole(role);
        setIsAuthenticated(true);
        
        setTimeout(() => {
          fetchData();
        }, 100);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // OPTIMIZED REFRESH FUNCTION
  const handleRefresh = useCallback(async () => {
    if (isRefreshing.current) return;
    
    isRefreshing.current = true;
    setIsLoading(true);

    try {
      const [productsResult, ordersResult, couponsResult] = await Promise.all([
        supabase.from('menu_items').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false })
      ]);

      if (!productsResult.error && productsResult.data) {
        setProducts(productsResult.data);
      }

      if (!ordersResult.error && ordersResult.data) {
        setOrders(ordersResult.data as Order[]);
      }

      if (!couponsResult.error && couponsResult.data) {
        setCoupons(couponsResult.data as Coupon[]);
      }

      setIsDbConnected(true);
    } catch (error: any) {
      console.error("Refresh Error:", error);
      setIsDbConnected(false);
    } finally {
      setIsLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  // Fetch categories from DB
  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order').order('name_en');
    if (data) setDbCategories(data);
  }, []);

  // Category CRUD handlers
  const handleSaveCategory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCategory(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const catData = {
      name_en: (formData.get('name_en') as string).trim(),
      name_ar: (formData.get('name_ar') as string).trim(),
      sort_order: parseInt(formData.get('sort_order') as string) || 0,
    };
    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(catData).eq('id', editingCategory.id);
        if (error) throw error;
        // Also update all menu_items with this category name
        await supabase.from('menu_items')
          .update({ category: catData.name_en, category_ar: catData.name_ar })
          .eq('category', editingCategory.name_en);
      } else {
        const { error } = await supabase.from('categories').insert([catData]);
        if (error) throw error;
      }
      await fetchCategories();
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
    } catch (err: any) {
      alert(t.saveFailed + err.message);
    } finally {
      setIsSavingCategory(false);
    }
  }, [editingCategory, fetchCategories, t]);

  const handleDeleteCategory = useCallback(async (cat: {id: string; name_en: string}) => {
    const itemCount = products.filter(p => p.category === cat.name_en).length;
    const confirmMsg = itemCount > 0
      ? `Delete category "${cat.name_en}"? It has ${itemCount} product(s). They will become uncategorised.`
      : `Delete category "${cat.name_en}"?`;
    if (!confirm(confirmMsg)) return;
    const { error } = await supabase.from('categories').delete().eq('id', cat.id);
    if (error) { alert(t.deleteFailed + error.message); return; }
    setDbCategories(prev => prev.filter(c => c.id !== cat.id));
  }, [products, t]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsResult, ordersResult, couponsResult] = await Promise.all([
        supabase.from('menu_items').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('coupons').select('*').order('created_at', { ascending: false })
      ]);

      if (!productsResult.error) {
        setProducts(productsResult.data || []);
      }

      if (!ordersResult.error && ordersResult.data) {
        setOrders(ordersResult.data as Order[]);
      }

      if (!couponsResult.error && couponsResult.data) {
        setCoupons(couponsResult.data as Coupon[]);
      }

      setIsDbConnected(true);
      fetchCategories();
    } catch (error: any) {
      console.error("Critical Fetch Error:", error);
      setIsDbConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Language toggle handler
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  }, []);

  // Optimized tab change handler
  const handleTabChange = useCallback((tab: 'products' | 'orders' | 'coupons' | 'stats') => {
    requestAnimationFrame(() => {
      setActiveTab(tab);
    });
  }, []);

  // Order status update
  const handleStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    requestAnimationFrame(() => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
    });
    
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) {
      alert(t.saveFailed + error.message);
      handleRefresh();
    }
  }, [handleRefresh, t]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    onExit();
  }, [onExit]);

  // MEMOIZED FILTERS
  const filteredOrders = useMemo(() => {
    if (orders.length === 0) return [];
    
    let result = [...orders];
    
    if (orderStatusFilter !== 'all') {
      result = result.filter(o => o.status === orderStatusFilter);
    }
    
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start).getTime();
      result = result.filter(o => new Date(o.created_at).getTime() >= startDate);
    }
    
    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);
      const endTime = endDate.getTime();
      result = result.filter(o => new Date(o.created_at).getTime() <= endTime);
    }
    
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      result = result.filter(o => 
        o.customer_name?.toLowerCase().includes(q) || 
        o.id.toLowerCase().includes(q)
      );
    }
    
    result.sort((a, b) => {
      const aValue = a[orderSort.key];
      const bValue = b[orderSort.key];
      if (!aValue || !bValue) return 0;
      return orderSort.direction === 'asc' 
        ? (aValue > bValue ? 1 : -1) 
        : (aValue < bValue ? 1 : -1);
    });
    
    return result;
  }, [orders, orderStatusFilter, orderSearch, orderSort.key, orderSort.direction, dateFilter.start, dateFilter.end]);

  const filteredProducts = useMemo(() => {
    if (!productSearch || products.length === 0) return products;
    
    const q = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.name_ar && p.name_ar.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q) ||
      (p.category_ar && p.category_ar.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  // Get unique categories with both languages
  const uniqueCategories = useMemo(() => {
    const categoryMap = new Map();
    
    products.forEach(p => {
      if (p.category && p.category.trim().length >= 2) {
        categoryMap.set(p.category, {
          en: p.category,
          ar: p.category_ar || p.category
        });
      }
    });
    
    return Array.from(categoryMap.values()).sort((a, b) => a.en.localeCompare(b.en));
  }, [products]);

  // ENHANCED ANALYTICS
  const timePeriodSales = useMemo((): TimePeriodSales => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    
    let dailyTotal = 0;
    let weeklyTotal = 0;
    let monthlyTotal = 0;
    let dailyCount = 0;
    let weeklyCount = 0;
    let monthlyCount = 0;
    
    orders.forEach(o => {
      if (o.status === 'cancelled') return;
      
      const orderTime = new Date(o.created_at).getTime();
      
      if (orderTime >= startOfDay) {
        dailyTotal += o.total_amount;
        dailyCount++;
      }
      if (orderTime >= startOfWeek) {
        weeklyTotal += o.total_amount;
        weeklyCount++;
      }
      if (orderTime >= startOfMonth) {
        monthlyTotal += o.total_amount;
        monthlyCount++;
      }
    });
    
    return {
      daily: dailyTotal,
      weekly: weeklyTotal,
      monthly: monthlyTotal,
      dailyOrders: dailyCount,
      weeklyOrders: weeklyCount,
      monthlyOrders: monthlyCount,
      dailyAvg: dailyCount > 0 ? dailyTotal / dailyCount : 0,
      weeklyAvg: weeklyCount > 0 ? weeklyTotal / weeklyCount : 0,
      monthlyAvg: monthlyCount > 0 ? monthlyTotal / monthlyCount : 0
    };
  }, [orders]);

  // Top selling products with bilingual categories
  const topSellingProducts = useMemo((): ProductSales[] => {
    const productSalesMap = new Map<string, ProductSales>();
    
    // Initialize with all products
    products.forEach(p => {
      productSalesMap.set(p.id, {
        productId: p.id,
        name: p.name,
        name_ar: p.name_ar || p.name,
        category: p.category,
        category_ar: p.category_ar || p.category,
        quantity: 0,
        revenue: 0
      });
    });
    
    // Calculate sales from orders (only completed orders)
    orders.forEach(order => {
      if (order.status === 'cancelled' || !order.items) return;
      
      // Check if within selected timeframe
      const orderTime = new Date(order.created_at).getTime();
      const now = new Date();
      let include = false;
      
      switch (statsTimeframe) {
        case 'day':
          const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime();
          include = orderTime >= startOfDay;
          break;
        case 'week':
          const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
          include = orderTime >= startOfWeek;
          break;
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          include = orderTime >= startOfMonth;
          break;
      }
      
      if (!include) return;
      
      // Parse items if it's a string
      let items = order.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          return;
        }
      }
      
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const productId = item.id || item.productId;
          if (productId && productSalesMap.has(productId)) {
            const current = productSalesMap.get(productId)!;
            const qty = item.quantity || 1;
            const price = item.price || 0;
            current.quantity += qty;
            current.revenue += qty * price;
          }
        });
      }
    });
    
    // Convert to array, filter out zero sales, and sort by quantity
    return Array.from(productSalesMap.values())
      .filter(p => p.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10); // Top 10
  }, [orders, products, statsTimeframe]);

  // Category performance with bilingual support
  const categoryPerformance = useMemo((): CategoryPerformance[] => {
    const categoryMap = new Map<string, CategoryPerformance>();
    
    orders.forEach(order => {
      if (order.status === 'cancelled' || !order.items) return;
      
      // Parse items if needed
      let items = order.items;
      if (typeof items === 'string') {
        try {
          items = JSON.parse(items);
        } catch {
          return;
        }
      }
      
      if (Array.isArray(items)) {
        items.forEach((item: any) => {
          const product = products.find(p => p.id === (item.id || item.productId));
          if (product) {
            const categoryKey = product.category || 'Uncategorized';
            const current = categoryMap.get(categoryKey) || { 
              category: categoryKey,
              category_ar: product.category_ar || categoryKey,
              revenue: 0, 
              orders: 0 
            };
            const qty = item.quantity || 1;
            const price = item.price || 0;
            current.revenue += qty * price;
            current.orders += 1;
            categoryMap.set(categoryKey, current);
          }
        });
      }
    });
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.revenue - a.revenue);
  }, [orders, products]);

  // Coupon usage stats
  const couponStats = useMemo(() => {
    const stats = new Map<string, { usage: number; totalDiscount: number }>();
    
    orders.forEach(order => {
      if (order.promo_code && order.discount_amount > 0) {
        const current = stats.get(order.promo_code) || { usage: 0, totalDiscount: 0 };
        current.usage += 1;
        current.totalDiscount += order.discount_amount;
        stats.set(order.promo_code, current);
      }
    });
    
    return Array.from(stats.entries())
      .map(([code, data]) => ({ code, ...data }))
      .sort((a, b) => b.usage - a.usage);
  }, [orders]);

  // Basic analytics
  const analyticsData = useMemo(() => {
    return {
      allTime: timePeriodSales.monthly,
      count: orders.filter(o => o.status !== 'cancelled').length,
      ...timePeriodSales
    };
  }, [timePeriodSales, orders]);

  // Coupon handlers
  const handleSaveCoupon = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const couponData = {
        code: (formData.get('code') as string).toUpperCase().trim(),
        discount_type: formData.get('discount_type') as 'percentage' | 'fixed',
        discount_value: parseFloat(formData.get('discount_value') as string),
        is_active: formData.get('is_active') === 'on'
    };

    const { error } = await supabase.from('coupons').upsert(couponData);
    if (error) {
        alert(t.saveFailed + error.message);
    } else {
        await handleRefresh();
        setIsCouponFormOpen(false);
        setEditingCoupon(null);
    }
  }, [handleRefresh, t]);
  
  const handleDeleteCoupon = useCallback(async (code: string) => {
    if(confirm(t.deleteCouponConfirm)) {
        const { error } = await supabase.from('coupons').delete().eq('code', code);
        if(!error) {
          requestAnimationFrame(() => {
            setCoupons(prev => prev.filter(c => c.code !== code));
          });
        }
    }
  }, [t]);

  // CSV Export with bilingual categories
  const handleExportCSV = useCallback(() => {
    requestAnimationFrame(() => {
      const headers = ['id', 'sku', 'name', 'name_ar', 'description', 'description_ar', 'price', 'category', 'category_ar', 'stock_quantity', 'is_available', 'image'];
      
      const csvContent = [
        headers.join(','),
        ...products.map(p => [
          p.id,
          p.sku || '',
          `"${(p.name || '').replace(/"/g, '""')}"`,
          `"${(p.name_ar || '').replace(/"/g, '""')}"`,
          `"${(p.description || '').replace(/"/g, '""')}"`,
          `"${(p.description_ar || '').replace(/"/g, '""')}"`,
          p.price,
          `"${(p.category || '').replace(/"/g, '""')}"`,
          `"${(p.category_ar || p.category || '').replace(/"/g, '""')}"`,
          p.stock_quantity ?? 100,
          p.is_available ?? true,
          `"${(p.image || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `menu_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  }, [products]);

  // CSV Import with bilingual categories
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setMigrationProgress(t.readingFile);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        let text = evt.target?.result as string;
        text = text.replace(/^\uFEFF/, '').replace(/\r/g, '');
        
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        
        const productsToUpsert: any[] = [];
        
        const parseRow = (row: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              if (i < row.length - 1 && row[i+1] === '"') {
                current += '"';
                i++;
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const values = parseRow(rows[i]);
          const rowData: any = {};
          
          headers.forEach((header, index) => {
             let value: any = values[index]?.replace(/^"|"$/g, '') || '';
             
             if (header === 'price') value = parseFloat(value) || 0;
             if (header === 'stock_quantity') value = parseInt(value) || 100;
             // Default to TRUE when blank/missing — never import products as hidden
             if (header === 'is_available') value = (value === '' || value === undefined || value === null) ? true : (value === 'true' || value === true);
             
             rowData[header] = value;
          });

          if (rowData.name) {
            // FIXED: Preserve existing ID if present so re-importing updates rather than duplicates.
            // Only generate a new UUID when the row has no ID (truly new items).
            if (!rowData.id || rowData.id.trim() === '') {
              rowData.id = generateUUID();
            }
            if (!rowData.sku || rowData.sku === '') {
              rowData.sku = `AUTO-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
            }
            // Ensure category_ar exists
            if (!rowData.category_ar) {
              rowData.category_ar = rowData.category || '';
            }
            productsToUpsert.push(rowData);
          }
        }

        setMigrationProgress(t.importing + productsToUpsert.length + '...');
        
        // FIXED: upsert on 'id' column — existing rows are updated, new rows are inserted
        const { error } = await supabase
          .from('menu_items')
          .upsert(productsToUpsert, { onConflict: 'id' });
        if (error) throw error;
        
        alert(t.importSuccess + productsToUpsert.length + t.items);
        await handleRefresh();

      } catch (err: any) {
        alert(t.importFailed + err.message);
      } finally {
        setIsImporting(false);
        setMigrationProgress('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Product handlers with bilingual categories
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    let imageUrl = formData.get('image_url') as string;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('menu-assets').upload(fileName, imageFile, { upsert: true });
        
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('menu-assets').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      // Fix #4: Validate that an image URL exists before saving
      if (!imageUrl || imageUrl.trim() === '') {
        throw new Error('An image is required. Please upload a file or paste an image URL.');
      }

      const productData = {
        name: formData.get('name') as string,
        name_ar: formData.get('name_ar') as string,
        description: formData.get('description') as string,
        description_ar: formData.get('description_ar') as string,
        price: parseFloat(formData.get('price') as string),
        category: formData.get('category') as string,
        category_ar: formData.get('category_ar') as string || formData.get('category') as string,
        stock_quantity: parseInt(formData.get('stock_quantity') as string) || 0,
        is_available: formData.get('is_available') === 'on',
        sku: formData.get('sku') as string,
        image: imageUrl, 
      };

      const { error } = editingProduct 
        ? await supabase.from('menu_items').upsert({ ...productData, id: editingProduct.id })
        : await supabase.from('menu_items').insert([{ ...productData, id: generateUUID() }]);

      if (error) throw error;
      await handleRefresh();
      setIsProductFormOpen(false);
      setEditingProduct(null);
      setImageFile(null);
      setIsCreatingCategory(false);
      setIsCreatingCategoryAr(false);
    } catch (error: any) {
      console.error("Save Error:", error);
      if (error.message?.includes("column") || error.message?.includes("is_available") || error.message?.includes("sku")) {
         alert(t.dbSchemaError);
      } else {
         alert(t.saveFailed + (error.message || "Unknown error"));
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDeleteProduct = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(t.deleteConfirm)) return;

    const previousProducts = [...products];
    requestAnimationFrame(() => {
      setProducts(prev => prev.filter(p => p.id !== id));
    });

    try {
      const { error, count } = await supabase
          .from('menu_items')
          .delete({ count: 'exact' })
          .eq('id', id);

      if (error) throw error;

      if (count === 0) {
          const { count: retryCount } = await supabase
            .from('menu_items')
            .delete({ count: 'exact' })
            .eq('id', id.trim());

          if (retryCount === 0) {
             throw new Error(t.deleteFailed);
          }
      }

      const productToDelete = previousProducts.find(p => p.id === id);
      if (productToDelete?.image && productToDelete.image.includes('menu-assets')) {
        try {
          const url = new URL(productToDelete.image);
          const pathSegments = url.pathname.split('/menu-assets/');
          const filePath = pathSegments[1]?.split('?')[0]; // strip any query params
          if (filePath) supabase.storage.from('menu-assets').remove([filePath]);
        } catch {
          // If URL parsing fails, skip deletion — don't crash
        }
      }

    } catch (err: any) {
      console.error("Delete Failed:", err);
      alert(t.deleteFailed + err.message);
      setProducts(previousProducts);
      handleRefresh();
    }
  }, [products, handleRefresh, t]);

  const handleEdit = useCallback((product: MenuItem) => {
    setEditingProduct(product);
    setImagePreview(product.image);
    setIsProductFormOpen(true);
    setImageFile(null); 
    setIsCreatingCategory(false);
    setIsCreatingCategoryAr(false);
  }, []);

  // Loading state
  if (isLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <AdminLogin onSuccess={() => { checkUser(); }} onCancel={onExit} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-900" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header with Language Toggle */}
      <div className="bg-black text-white p-4 flex justify-between items-center">
         <h1 className="font-bold flex items-center gap-2">
           {t.admin}
           {isDbConnected && <span className="bg-green-600 text-[10px] px-1 rounded">{t.live}</span>}
         </h1>
         <div className="flex gap-2">
            {/* Language Toggle Button */}
            <button 
              onClick={toggleLanguage}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
              aria-label="Toggle language"
            >
              {language === 'en' ? 'عربي' : 'English'}
            </button>
            
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-800 rounded transition-colors flex items-center gap-2 text-xs text-gray-400"
              aria-label="Refresh data"
              disabled={isRefreshing.current}
            >
                <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? t.refreshing : t.refresh}
            </button>
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-gray-800 rounded transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
         </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <nav className="p-4 space-y-2">
            {(['orders', 'products', 'coupons', 'stats'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab 
                      ? 'bg-black text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-current={activeTab === tab ? 'page' : undefined}
                >
                  {tab === 'coupons' && <Ticket className="w-5 h-5"/>}
                  {tab === 'products' && <Package className="w-5 h-5"/>}
                  {tab === 'stats' && <BarChart3 className="w-5 h-5"/>}
                  {tab === 'orders' && <ShoppingBag className="w-5 h-5"/>}
                  {t[tab]}
                </button>
            ))}
             <button 
               onClick={() => setShowSqlModal(true)} 
               className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 mt-auto transition-colors"
             >
               <Terminal className="w-5 h-5"/> {t.setupSql}
             </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-4">
                     <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                          <input 
                            type="text" 
                            placeholder={t.searchOrders} 
                            className="pl-10 pr-4 py-2 border rounded w-full"
                            value={orderSearch} 
                            onChange={e => setOrderSearch(e.target.value)} 
                          />
                        </div>
                        <select 
                          className="border p-2 rounded min-w-[120px]" 
                          value={orderStatusFilter} 
                          onChange={e => setOrderStatusFilter(e.target.value)}
                        >
                            <option value="all">{t.all}</option>
                            <option value="pending">{t.pending}</option>
                            <option value="completed">{t.completed}</option>
                            <option value="cancelled">{t.cancelled}</option>
                        </select>
                     </div>
                     <div className="bg-white shadow rounded overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                              <thead className="bg-gray-50 border-b">
                                  <tr>
                                      <th className="p-3">{t.idSku}</th>
                                      <th className="p-3">{t.customer}</th>
                                      <th className="p-3">{t.total}</th>
                                      <th className="p-3">{t.promo}</th>
                                      <th className="p-3">{t.status}</th>
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredOrders.map(o => (
                                      <tr key={o.id} className="border-b hover:bg-gray-50">
                                          <td className="p-3 font-mono text-xs">#{o.id.slice(0,6)}</td>
                                          <td className="p-3">
                                            {o.customer_name}
                                            <div className="text-xs text-gray-400">{o.type}</div>
                                          </td>
                                          <td className="p-3 font-bold">{o.total_amount.toFixed(3)} KWD</td>
                                          <td className="p-3 text-xs">
                                            {o.promo_code ? (
                                              <span className="bg-green-100 text-green-800 px-1 rounded">
                                                {o.promo_code} (-{o.discount_amount})
                                              </span>
                                            ) : '-'}
                                          </td>
                                          <td className="p-3">
                                              <select 
                                                value={o.status} 
                                                onChange={(e) => handleStatusUpdate(o.id, e.target.value)} 
                                                className="border rounded p-1 text-xs"
                                                aria-label={`Update status for order ${o.id}`}
                                              >
                                                  <option value="pending">{t.pending}</option>
                                                  <option value="completed">{t.completed}</option>
                                                  <option value="cancelled">{t.cancelled}</option>
                                              </select>
                                          </td>
                                      </tr>
                                  ))}
                                  {filteredOrders.length === 0 && (
                                    <tr>
                                      <td colSpan={5} className="p-8 text-center text-gray-500">
                                        {t.noOrders}
                                      </td>
                                    </tr>
                                  )}
                              </tbody>
                          </table>
                        </div>
                     </div>
                </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">{t.promoCodes}</h2>
                        <button 
                          onClick={() => { 
                            setEditingCoupon(null); 
                            setIsCouponFormOpen(true); 
                          }} 
                          className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800 transition-colors"
                        >
                          <Plus className="w-4 h-4"/> {t.addCoupon}
                        </button>
                    </div>
                    
                    {/* Coupon Statistics */}
                    {couponStats.length > 0 && (
                      <div className="bg-white p-4 rounded shadow border">
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                          <Award className="w-4 h-4" /> {t.couponPerformance}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {couponStats.slice(0, 5).map(stat => (
                            <div key={stat.code} className="bg-gray-50 p-3 rounded border">
                              <div className="font-bold text-sm">{stat.code}</div>
                              <div className="text-xs text-gray-600">{t.used}: {stat.usage} {t.times}</div>
                              <div className="text-xs text-gray-600">{t.totalDiscount}: {stat.totalDiscount.toFixed(3)} KWD</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {coupons.map(coupon => (
                            <div key={coupon.code} className="bg-white p-4 rounded shadow border border-gray-200 flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-lg tracking-wider">{coupon.code}</div>
                                    <div className="text-sm text-gray-500">
                                        {coupon.discount_type === 'percentage' 
                                          ? `${coupon.discount_value}${t.percentage}` 
                                          : `${coupon.discount_value} ${t.fixed}`}
                                    </div>
                                    <div className={`text-xs mt-1 font-bold ${
                                      coupon.is_active ? 'text-green-600' : 'text-red-500'
                                    }`}>
                                        {coupon.is_active ? t.active : t.inactive}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                      onClick={() => { 
                                        setEditingCoupon(coupon); 
                                        setIsCouponFormOpen(true); 
                                      }} 
                                      className="p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                      aria-label={`Edit coupon ${coupon.code}`}
                                    >
                                      <Edit2 className="w-4 h-4"/>
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCoupon(coupon.code)} 
                                      className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                      aria-label={`Delete coupon ${coupon.code}`}
                                    >
                                      <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
                <div className="space-y-4">

                     {/* ── CATEGORY MANAGEMENT PANEL ── */}
                     <div className="bg-white border border-gray-200 rounded-lg p-4">
                       <div className="flex items-center justify-between mb-3">
                         <h3 className="font-bold text-sm uppercase tracking-wider">{language === 'ar' ? 'إدارة الفئات' : 'Category Management'}</h3>
                         <button
                           onClick={() => { setEditingCategory(null); setIsCategoryFormOpen(true); }}
                           className="flex items-center gap-1 bg-black text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-gray-800 transition-colors"
                         >
                           <Plus className="w-3 h-3" />
                           {language === 'ar' ? 'فئة جديدة' : 'New Category'}
                         </button>
                       </div>
                       {dbCategories.length === 0 ? (
                         <p className="text-xs text-gray-400 text-center py-2">
                           {language === 'ar' ? 'لا توجد فئات بعد' : 'No categories yet. Create one or import products first.'}
                         </p>
                       ) : (
                         <div className="flex flex-wrap gap-2">
                           {dbCategories.map(cat => (
                             <div key={cat.id} className="flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-full px-3 py-1">
                               <span className="text-xs font-medium">{cat.name_en}</span>
                               <span className="text-xs text-gray-400 mx-1">|</span>
                               <span className="text-xs font-medium" dir="rtl">{cat.name_ar}</span>
                               <button
                                 onClick={() => { setEditingCategory(cat); setIsCategoryFormOpen(true); }}
                                 className="ml-1 text-gray-400 hover:text-black transition-colors"
                                 title="Edit"
                               >
                                 <Edit2 className="w-3 h-3" />
                               </button>
                               <button
                                 onClick={() => handleDeleteCategory(cat)}
                                 className="text-gray-400 hover:text-red-500 transition-colors"
                                 title="Delete"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>

                     <div className="flex flex-col md:flex-row justify-between gap-4">
                        <h2 className="text-xl font-bold">{t.menuItems}</h2>
                        <div className="flex gap-2 flex-1 flex-wrap justify-end">
                            <div className="relative w-full md:w-auto">
                                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder={t.searchProducts} 
                                    className="pl-8 pr-4 py-2 border rounded w-full md:w-64" 
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                  onClick={handleExportCSV} 
                                  className="border border-gray-300 px-3 py-2 rounded bg-white hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
                                >
                                  <Download className="w-4 h-4" /> {t.export}
                                </button>
                                <button 
                                  onClick={() => fileInputRef.current?.click()} 
                                  className="border border-gray-300 px-3 py-2 rounded bg-white hover:bg-gray-50 flex items-center gap-2 text-sm transition-colors"
                                >
                                  <Upload className="w-4 h-4" /> 
                                  {isImporting ? migrationProgress : t.import}
                                </button>
                                <input 
                                  type="file" 
                                  ref={fileInputRef} 
                                  onChange={handleImportCSV} 
                                  className="hidden" 
                                  accept=".csv" 
                                />
                            </div>

                            <button 
                              onClick={() => { 
                                setEditingProduct(null); 
                                setImagePreview(''); 
                                setIsProductFormOpen(true); 
                                setIsCreatingCategory(false);
                                setIsCreatingCategoryAr(false);
                              }} 
                              className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 shrink-0 hover:bg-gray-800 transition-colors"
                            >
                              <Plus className="w-4 h-4"/> {t.addProduct}
                            </button>
                        </div>
                     </div>
                     <div className="bg-white shadow rounded overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 w-12">{t.img}</th>
                                    <th className="p-3">{t.product}</th>
                                    <th className="p-3">{t.category}</th>
                                    <th className="p-3">{t.idSku}</th>
                                    <th className="p-3">{t.price}</th>
                                    <th className="p-3">{t.stock}</th>
                                    <th className="p-3">{t.status}</th>
                                    <th className="p-3 text-right">{t.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(p => (
                                    <tr 
                                      key={p.id} 
                                      onClick={() => handleEdit(p)} 
                                      className="border-b hover:bg-blue-50 cursor-pointer transition-colors group"
                                    >
                                        <td className="p-3">
                                            <img 
                                              src={p.image} 
                                              className="w-8 h-8 rounded object-cover border border-gray-200" 
                                              alt={p.name}
                                              loading="lazy"
                                              onError={(e) => {
                                                const target = e.currentTarget;
                                                if (!target.dataset.errored) {
                                                  target.dataset.errored = 'true';
                                                  target.src = 'https://placehold.co/64x64/f5f5f5/999999?text=N/A';
                                                }
                                              }}
                                            />
                                        </td>
                                        <td className="p-3 font-medium">
                                            {language === 'en' ? p.name : (p.name_ar || p.name)}
                                            {language === 'ar' && p.name && <div className="text-xs text-gray-400">{p.name}</div>}
                                        </td>
                                        <td className="p-3 text-xs">
                                            {language === 'en' ? p.category : (p.category_ar || p.category)}
                                        </td>
                                        <td className="p-3 text-xs font-mono text-gray-500">
                                            <div className="font-bold">{p.sku || '-'}</div>
                                            <div className="text-[10px] opacity-70 truncate max-w-[80px]" title={p.id}>{p.id}</div>
                                        </td>
                                        <td className="p-3 font-bold">{p.price.toFixed(3)} KWD</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${
                                              p.stock_quantity && p.stock_quantity < 5 
                                                ? 'bg-red-50 border-red-200 text-red-700' 
                                                : 'bg-green-50 border-green-200 text-green-700'
                                            }`}>
                                                {p.stock_quantity ?? '∞'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {p.is_available 
                                              ? <span className="text-green-600 flex items-center gap-1"><Wifi className="w-3 h-3"/> {t.on}</span> 
                                              : <span className="text-gray-400 flex items-center gap-1"><WifiOff className="w-3 h-3"/> {t.off}</span>
                                            }
                                        </td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <button 
                                              onClick={(e) => { e.stopPropagation(); handleEdit(p); }} 
                                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                              aria-label={t.edit}
                                            >
                                              <Edit2 className="w-4 h-4"/>
                                            </button>
                                            <button 
                                              onClick={(e) => handleDeleteProduct(p.id, e)} 
                                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                                              aria-label={t.delete}
                                            >
                                              <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-8 text-center text-gray-500">
                                          {t.noProducts.replace('{search}', productSearch)}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                     </div>
                </div>
            )}
            
            {/* Enhanced Stats Tab - FIXED VERSION */}
            {activeTab === 'stats' && (
                <div className="space-y-6">
                  {/* Timeframe Selector */}
                  <div className="flex gap-2 bg-white p-2 rounded-lg shadow inline-flex">
                    <button
                      onClick={() => setStatsTimeframe('day')}
                      className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                        statsTimeframe === 'day' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      {t.day}
                    </button>
                    <button
                      onClick={() => setStatsTimeframe('week')}
                      className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                        statsTimeframe === 'week' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      {t.week}
                    </button>
                    <button
                      onClick={() => setStatsTimeframe('month')}
                      className={`px-4 py-2 rounded flex items-center gap-2 transition-colors ${
                        statsTimeframe === 'month' 
                          ? 'bg-black text-white' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                      {t.month}
                    </button>
                  </div>

                  {/* Revenue Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded shadow border">
                      <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {t.revenue}
                      </h3>
                      <p className="text-2xl font-bold mt-1">
                        {statsTimeframe === 'day' && timePeriodSales.daily.toFixed(3)}
                        {statsTimeframe === 'week' && timePeriodSales.weekly.toFixed(3)}
                        {statsTimeframe === 'month' && timePeriodSales.monthly.toFixed(3)} KWD
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {statsTimeframe === 'day' && t.today}
                        {statsTimeframe === 'week' && t.thisWeek}
                        {statsTimeframe === 'month' && t.thisMonth}
                      </p>
                    </div>

                    <div className="bg-white p-6 rounded shadow border">
                      <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1">
                        <ShoppingBag className="w-3 h-3" /> {t.orders_count}
                      </h3>
                      <p className="text-2xl font-bold mt-1">
                        {statsTimeframe === 'day' && timePeriodSales.dailyOrders}
                        {statsTimeframe === 'week' && timePeriodSales.weeklyOrders}
                        {statsTimeframe === 'month' && timePeriodSales.monthlyOrders}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t.orders_count}</p>
                    </div>

                    <div className="bg-white p-6 rounded shadow border">
                      <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" /> {t.averageOrder}
                      </h3>
                      <p className="text-2xl font-bold mt-1">
                        {statsTimeframe === 'day' && timePeriodSales.dailyAvg.toFixed(3)}
                        {statsTimeframe === 'week' && timePeriodSales.weeklyAvg.toFixed(3)}
                        {statsTimeframe === 'month' && timePeriodSales.monthlyAvg.toFixed(3)} KWD
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t.perOrder}</p>
                    </div>

                    <div className="bg-white p-6 rounded shadow border">
                      <h3 className="text-gray-500 text-xs font-bold uppercase flex items-center gap-1">
                        <PieChart className="w-3 h-3" /> {t.conversion}
                      </h3>
                      <p className="text-2xl font-bold mt-1">
                        {orders.length > 0 
                          ? ((filteredOrders.filter(o => o.status === 'completed').length / orders.length) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{t.completedRate}</p>
                    </div>
                  </div>

                  {/* Top Selling Products */}
                  <div className="bg-white p-6 rounded shadow border">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5" /> 
                      {t.topSelling}
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        {statsTimeframe === 'day' && `(${t.today})`}
                        {statsTimeframe === 'week' && `(${t.thisWeek})`}
                        {statsTimeframe === 'month' && `(${t.thisMonth})`}
                      </span>
                    </h3>
                    
                    {topSellingProducts.length > 0 ? (
                      <div className="space-y-3">
                        {topSellingProducts.map((product, index) => (
                          <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-400' :
                                index === 1 ? 'bg-gray-300' :
                                index === 2 ? 'bg-orange-300' : 'bg-gray-200'
                              }`}>
                                {index + 1}
                              </span>
                              <div>
                                <div className="font-medium">
                                  {language === 'en' ? product.name : (product.name_ar || product.name)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {language === 'en' ? product.category : (product.category_ar || product.category)}
                                </div>
                                {language === 'ar' && product.name && (
                                  <div className="text-xs text-gray-400">{product.name}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{product.quantity} {t.sold}</div>
                              <div className="text-xs text-gray-600">{product.revenue.toFixed(3)} KWD</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">{t.noSales}</p>
                    )}
                  </div>

                  {/* Category Performance with Bilingual Support */}
                  <div className="bg-white p-6 rounded shadow border">
                    <h3 className="font-bold mb-4 flex items-center gap-2 text-lg">
                      <PieChart className="w-5 h-5" /> {t.categoryPerformance}
                    </h3>
                    
                    {categoryPerformance.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryPerformance.map(cat => (
                          <div key={cat.category} className="p-3 bg-gray-50 rounded">
                            <div className="font-medium">
                              {language === 'en' ? cat.category : (cat.category_ar || cat.category)}
                            </div>
                            {language === 'ar' && cat.category !== cat.category_ar && (
                              <div className="text-xs text-gray-500 mb-2">{cat.category}</div>
                            )}
                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-gray-600">{t.revenue}:</span>
                              <span className="font-bold">{cat.revenue.toFixed(3)} KWD</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">{t.orders_count}:</span>
                              <span className="font-bold">{cat.orders}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">{t.noCategoryData}</p>
                    )}
                  </div>

                  {/* Quick Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded border border-green-200">
                      <div className="text-green-700 text-xs font-bold uppercase">{t.totalProducts}</div>
                      <div className="text-2xl font-bold text-green-800">{products.length}</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded border border-blue-200">
                      <div className="text-blue-700 text-xs font-bold uppercase">{t.activeCoupons}</div>
                      <div className="text-2xl font-bold text-blue-800">{coupons.filter(c => c.is_active).length}</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded border border-purple-200">
                      <div className="text-purple-700 text-xs font-bold uppercase">{t.categories}</div>
                      <div className="text-2xl font-bold text-purple-800">{uniqueCategories.length}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded border border-orange-200">
                      <div className="text-orange-700 text-xs font-bold uppercase">{t.lowStock}</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {products.filter(p => p.stock_quantity && p.stock_quantity < 5).length}
                      </div>
                    </div>
                  </div>
                </div>
            )}
        </main>
      </div>

      {/* SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-white p-6 rounded max-w-2xl w-full">
                <h3 className="font-bold text-lg mb-4">{t.setupSql}</h3>
                <textarea 
                  readOnly 
                  value={SETUP_SQL} 
                  className="w-full h-64 bg-gray-900 text-green-400 p-4 text-xs font-mono rounded mb-4 focus:outline-none" 
                />
                <button 
                  onClick={() => setShowSqlModal(false)} 
                  className="bg-black text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition-colors"
                >
                  {t.cancel}
                </button>
            </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="bg-white p-6 rounded shadow-xl max-w-sm w-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{editingCoupon ? t.editCoupon : t.newCoupon}</h3>
                    <button onClick={() => setIsCouponFormOpen(false)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleSaveCoupon} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold uppercase mb-1">{t.code}</label>
                          <input 
                            name="code" 
                            defaultValue={editingCoupon?.code} 
                            required 
                            className="w-full border p-2 uppercase rounded focus:ring-2 focus:ring-black focus:outline-none" 
                            placeholder={t.couponPlaceholder} 
                            disabled={!!editingCoupon} 
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold uppercase mb-1">{t.type}</label>
                              <select 
                                name="discount_type" 
                                defaultValue={editingCoupon?.discount_type || 'percentage'} 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none"
                              >
                                  <option value="percentage">{t.percentage}</option>
                                  <option value="fixed">{t.fixed}</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold uppercase mb-1">{t.value}</label>
                              <input 
                                name="discount_value" 
                                type="number" 
                                step="0.1" 
                                defaultValue={editingCoupon?.discount_value} 
                                required 
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
                              />
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            name="is_active" 
                            defaultChecked={editingCoupon?.is_active ?? true} 
                            id="activeCheck" 
                            className="w-4 h-4 cursor-pointer" 
                          />
                          <label htmlFor="activeCheck" className="text-sm cursor-pointer">{t.active}</label>
                      </div>
                      <div className="flex gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setIsCouponFormOpen(false)} 
                            className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300 transition-colors"
                          >
                            {t.cancel}
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800 transition-colors"
                          >
                            {t.save}
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Product Modal with Bilingual Categories */}
      {isProductFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold">{editingProduct ? t.editProduct : t.newProduct}</h3>
              <button onClick={() => setIsProductFormOpen(false)} className="p-1 hover:bg-gray-200 rounded transition-colors">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-bold uppercase mb-1">{t.productNameEn}</label>
                   <input 
                     name="name" 
                     defaultValue={editingProduct?.name} 
                     required 
                     placeholder={t.cheeseBurger} 
                     className="border p-2 w-full rounded focus:ring-2 focus:ring-black focus:outline-none" 
                   />
                </div>
                <div>
                   <label className="block text-xs font-bold uppercase mb-1">{t.productNameAr}</label>
                   <input 
                     name="name_ar" 
                     defaultValue={editingProduct?.name_ar} 
                     placeholder={t.cheeseBurgerAr} 
                     className="border p-2 text-right w-full rounded focus:ring-2 focus:ring-black focus:outline-none" 
                     dir="rtl" 
                   />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-xs font-bold uppercase mb-1">{t.descriptionEn}</label>
                      <textarea 
                        name="description" 
                        defaultValue={editingProduct?.description} 
                        placeholder={t.enterDetails} 
                        className="w-full border p-2 h-24 text-sm rounded focus:ring-2 focus:ring-black focus:outline-none" 
                      />
                  </div>
                  <div>
                      <label className="block text-xs font-bold uppercase mb-1">{t.descriptionAr}</label>
                      <textarea 
                        name="description_ar" 
                        defaultValue={editingProduct?.description_ar} 
                        placeholder={t.enterDetailsAr} 
                        className="w-full border p-2 h-24 text-sm text-right rounded focus:ring-2 focus:ring-black focus:outline-none" 
                        dir="rtl" 
                      />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">{t.price}</label>
                    <input 
                      name="price" 
                      type="number" 
                      step="0.05" 
                      defaultValue={editingProduct?.price} 
                      required 
                      placeholder="0.000" 
                      className="border p-2 w-full rounded focus:ring-2 focus:ring-black focus:outline-none" 
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">{t.skuOptional}</label>
                    <input 
                      name="sku" 
                      defaultValue={editingProduct?.sku} 
                      placeholder={t.skuPlaceholder} 
                      className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
                    />
                 </div>
              </div>

              {/* Bilingual Category Section */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">{t.category}</label>
                    {isCreatingCategory ? (
                        <div className="flex gap-2">
                            <input 
                                name="category" 
                                required 
                                placeholder={t.enterNewCategory} 
                                defaultValue={editingProduct?.category || ''}
                                className="border p-2 w-full rounded focus:ring-2 focus:ring-black focus:outline-none"
                                autoFocus
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsCreatingCategory(false)}
                                className="px-3 bg-gray-200 hover:bg-gray-300 text-black text-xs font-bold uppercase rounded transition-colors"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <select 
                                name="category" 
                                required 
                                defaultValue={editingProduct?.category || ''}
                                onChange={(e) => {
                                    if(e.target.value === '__NEW__') {
                                        setIsCreatingCategory(true);
                                        e.target.value = editingProduct?.category || '';
                                    }
                                }}
                                className="border p-2 w-full bg-white appearance-none pr-8 cursor-pointer rounded focus:ring-2 focus:ring-black focus:outline-none"
                            >
                                <option value="" disabled>{t.selectCategory}</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat.en} value={cat.en}>{cat.en}</option>
                                ))}
                                <option value="__NEW__" className="font-bold bg-gray-100 text-blue-600">{t.createNewCategory}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    )}
                 </div>

                 <div>
                    <label className="block text-xs font-bold uppercase mb-1">{t.categoryAr}</label>
                    {isCreatingCategoryAr ? (
                        <div className="flex gap-2">
                            <input 
                                name="category_ar" 
                                required 
                                placeholder={t.enterNewCategoryAr} 
                                defaultValue={editingProduct?.category_ar || editingProduct?.category || ''}
                                className="border p-2 w-full rounded focus:ring-2 focus:ring-black focus:outline-none text-right"
                                dir="rtl"
                                autoFocus
                            />
                            <button 
                                type="button" 
                                onClick={() => setIsCreatingCategoryAr(false)}
                                className="px-3 bg-gray-200 hover:bg-gray-300 text-black text-xs font-bold uppercase rounded transition-colors"
                            >
                                {t.cancel}
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            <select 
                                name="category_ar" 
                                required 
                                defaultValue={editingProduct?.category_ar || editingProduct?.category || ''}
                                onChange={(e) => {
                                    if(e.target.value === '__NEW__') {
                                        setIsCreatingCategoryAr(true);
                                        e.target.value = editingProduct?.category_ar || '';
                                    }
                                }}
                                className="border p-2 w-full bg-white appearance-none pr-8 cursor-pointer rounded focus:ring-2 focus:ring-black focus:outline-none text-right"
                                dir="rtl"
                            >
                                <option value="" disabled>{t.selectCategoryAr}</option>
                                {uniqueCategories.map(cat => (
                                    <option key={cat.ar} value={cat.ar}>{cat.ar}</option>
                                ))}
                                <option value="__NEW__" className="font-bold bg-gray-100 text-blue-600">{t.createNewCategoryAr}</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                                </svg>
                            </div>
                        </div>
                    )}
                 </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <h4 className="font-bold text-xs uppercase mb-3 text-yellow-800">{t.inventoryStatus}</h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold uppercase mb-1">{t.stockQuantity}</label>
                          <input 
                            name="stock_quantity" 
                            type="number" 
                            defaultValue={editingProduct?.stock_quantity ?? 100} 
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none" 
                          />
                      </div>
                      <div className="flex items-center gap-2 pt-6">
                          <input 
                            type="checkbox" 
                            name="is_available" 
                            defaultChecked={editingProduct?.is_available ?? true} 
                            id="availCheck" 
                            className="w-4 h-4 cursor-pointer" 
                          />
                          <label htmlFor="availCheck" className="text-sm font-medium cursor-pointer">{t.activeVisible}</label>
                      </div>
                  </div>
              </div>

              <div className="border p-4 rounded bg-gray-50 flex gap-4 items-center">
                  <div className="w-16 h-16 bg-white border flex items-center justify-center overflow-hidden rounded">
                      {imagePreview 
                        ? <img src={imagePreview} className="w-full h-full object-cover" alt="Preview"/> 
                        : <ImageIcon className="text-gray-300 w-8 h-8"/>
                      }
                  </div>
                  <div className="flex-1 space-y-2">
                       <label className="block text-xs font-bold uppercase mb-1">{t.productImage}</label>
                       <input 
                         type="file" 
                         accept="image/*" 
                         onChange={(e) => { 
                           const f = e.target.files?.[0]; 
                           if(f){ 
                             setImageFile(f); 
                             setImagePreview(URL.createObjectURL(f)); 
                           }
                         }} 
                         className="text-sm"
                       />
                       <input 
                         name="image_url" 
                         defaultValue={editingProduct?.image} 
                         placeholder={t.imageUrl} 
                         className="w-full border p-2 text-xs rounded focus:ring-2 focus:ring-black focus:outline-none" 
                       />
                  </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsProductFormOpen(false)} 
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                >
                  {t.cancel}
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading} 
                  className="px-6 py-2 bg-black text-white font-bold rounded flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isUploading && <Loader2 className="animate-spin w-4 h-4"/>} 
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CATEGORY FORM MODAL ── */}
      {isCategoryFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-lg shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-lg uppercase tracking-wider">
                {editingCategory
                  ? (language === 'ar' ? 'تعديل الفئة' : 'Edit Category')
                  : (language === 'ar' ? 'فئة جديدة' : 'New Category')}
              </h3>
              <button onClick={() => { setIsCategoryFormOpen(false); setEditingCategory(null); }} className="p-1 hover:bg-gray-200 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Category Name (English)</label>
                <input
                  name="name_en"
                  required
                  defaultValue={editingCategory?.name_en || ''}
                  placeholder="e.g. Burgers"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">اسم الفئة (عربي)</label>
                <input
                  name="name_ar"
                  required
                  defaultValue={editingCategory?.name_ar || ''}
                  placeholder="مثال: برجر"
                  dir="rtl"
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Sort Order (0 = first)</label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={editingCategory?.sort_order ?? 0}
                  className="w-full border p-2 rounded focus:ring-2 focus:ring-black focus:outline-none"
                />
              </div>
              {editingCategory && (
                <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 p-2 rounded">
                  ⚠️ Renaming will update all products in this category automatically.
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => { setIsCategoryFormOpen(false); setEditingCategory(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                  {t.cancel}
                </button>
                <button type="submit" disabled={isSavingCategory} className="px-6 py-2 bg-black text-white font-bold rounded flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {isSavingCategory && <Loader2 className="animate-spin w-4 h-4" />}
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
