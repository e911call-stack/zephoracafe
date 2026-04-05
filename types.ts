
export interface MenuItem {
  id: string;
  sku?: string; // New: Stock Keeping Unit
  name: string;
  name_ar?: string;
  description: string;
  description_ar?: string;
  price: number;
  category: string;
  image: string;
  dietary?: string[];
  stock_quantity?: number; // New: Inventory tracking
  is_available?: boolean; // New: Master toggle
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Coupon {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  is_active: boolean;
  created_at?: string;
}

export interface Order {
  id: string;
  created_at: string;
  customer_name: string;
  user_id?: string;
  type: OrderType;
  table_number?: string;
  address?: string;
  payment_method: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  total_amount: number;
  discount_amount?: number; // New: Track discount
  promo_code?: string; // New: Track code used
  status: 'pending' | 'completed' | 'cancelled';
}

export type Language = 'en' | 'ar';

export type OrderType = 'dine-in' | 'takeaway' | 'delivery';

export type UserRole = 'admin' | 'manager' | 'customer';