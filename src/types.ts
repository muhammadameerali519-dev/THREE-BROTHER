export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  icon_name: string;
  featured: boolean;
  sort_order: number;
  product_count?: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  country: string;
  featured: boolean;
  product_count?: number;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand_id: string;
  brand_name: string;
  category_id: string;
  category_name: string;
  original_price: number;
  discount_price: number;
  discount_percent: number;
  stock: number;
  sku: string;
  short_description: string;
  description: string;
  warranty: string;
  images: string[];
  specifications: ProductSpec[];
  is_trending: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_featured_deal: boolean;
  rating_avg: number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  author_role: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  headline: string;
  description: string;
  cta_text: string;
  cta_target: string;
  image: string;
  placement: 'hero' | 'promo';
  active: boolean;
  sort_order: number;
}

export interface OrderItem {
  product_id: string;
  title: string;
  brand_name: string;
  sku: string;
  image: string;
  quantity: number;
  original_price: number;
  unit_price: number;
  line_total: number;
}

export type OrderStatus =
  | 'Pending Confirmation'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  country: string;
  city: string;
  address: string;
  instructions: string;
  items: OrderItem[];
  subtotal: number;
  discount_total: number;
  delivery_charges: number;
  grand_total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'new' | 'reviewed';
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PageRoute =
  | 'home'
  | 'shop'
  | 'products'
  | 'product'
  | 'categories'
  | 'brands'
  | 'deals'
  | 'wishlist'
  | 'cart'
  | 'checkout'
  | 'about'
  | 'contact'
  | 'faq'
  | 'track-order'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'account'
  | 'admin';
