export type CategoryId =
  | 'all'
  | 'mens-wear'
  | 'hoodies'
  | 'shoes'
  | 'audio'
  | 'smart-watches'
  | 'mobiles'
  | 'accessories'
  | 'bags';

export interface CategoryItem {
  id: Exclude<CategoryId, 'all'>;
  label: string;
  image: string;
}

export interface ColorVariant {
  name: string;
  hex: string;
  imageFilter?: string;
}

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: Exclude<CategoryId, 'all'>;
  price: number;
  inStock: boolean;
  image: string;
  colors: ColorVariant[];
  specs: string[];
  featured?: boolean;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  selectedColor: string;
  quantity: number;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  quote: string;
  initials: string;
  avatarBg: string;
}

export type PaymentMethod = 'cod' | 'online';

export interface CustomerCheckoutForm {
  fullName: string;
  phone: string;
  city: string;
  address: string;
  paymentMethod: PaymentMethod;
  notes?: string;
}

export interface OrderConfirmation {
  orderNumber: string;
  customer: CustomerCheckoutForm;
  items: CartItem[];
  total: number;
  createdAt: string;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface BackendOrder {
  orderNumber: string;
  customer: CustomerCheckoutForm;
  items: Array<{
    productId: string;
    productName: string;
    image: string;
    price: number;
    selectedColor: string;
    quantity: number;
  }>;
  total: number;
  status: OrderStatus;
  createdAt: string;
}
