export type Role = 'CUSTOMER' | 'ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  title: string;
  price: number | string;
  stock: number;
  images: string[];
  categoryId: number;
  category?: Category;
}

export interface ProductPage {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CartItem {
  cartId: number;
  productId: number;
  quantity: number;
  product: Pick<Product, 'id' | 'title' | 'price' | 'stock' | 'images'>;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number | string;
  product: Pick<Product, 'id' | 'title'>;
}

export interface Order {
  id: number;
  userId: number;
  total: number | string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}
