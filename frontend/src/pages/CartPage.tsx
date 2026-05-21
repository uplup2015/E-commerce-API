import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Trash2, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Cart } from '@/lib/types';
import { formatCurrency, getErrorMessage } from '@/lib/utils';

export function CartPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [notice, setNotice] = useState('');
  const cart = useQuery({
    queryKey: ['cart'],
    queryFn: async () => (await api.get<Cart>('/cart')).data,
  });

  const updateItem = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.patch(`/cart/items/${productId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (error) => setNotice(getErrorMessage(error)),
  });

  const removeItem = useMutation({
    mutationFn: async (productId: number) => api.delete(`/cart/items/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
    onError: (error) => setNotice(getErrorMessage(error)),
  });

  const checkout = useMutation({
    mutationFn: async () => (await api.post('/orders')).data,
    onSuccess: (order: { id: number }) => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/orders/${order.id}`);
    },
    onError: (error) => setNotice(getErrorMessage(error)),
  });

  if (cart.isLoading) return <LoadingState label="Loading cart..." />;
  if (cart.isError) return <ErrorState message={getErrorMessage(cart.error)} />;

  const items = cart.data?.items ?? [];
  const total = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Cart</h1>
          <p className="text-sm text-muted-foreground">Review quantities before checkout.</p>
        </div>
        {notice ? <div className="rounded-md border bg-card px-4 py-3 text-sm">{notice}</div> : null}
        {items.length === 0 ? <EmptyState title="Your cart is empty" description="Add products from the storefront." /> : null}
        {items.map((item) => (
          <article key={item.productId} className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-center">
            <ProductImage src={item.product.images[0]} alt={item.product.title} className="aspect-[4/3] w-full sm:h-24 sm:w-32" />
            <div className="flex-1">
              <Link to={`/products/${item.productId}`} className="font-semibold hover:text-primary">{item.product.title}</Link>
              <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(item.product.price)} each</p>
              <p className="text-sm text-muted-foreground">{item.product.stock} in stock</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={item.quantity <= 1 || updateItem.isPending}
                onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
              <Button
                variant="outline"
                size="icon"
                disabled={item.quantity >= item.product.stock || updateItem.isPending}
                onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" disabled={removeItem.isPending} onClick={() => removeItem.mutate(item.productId)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </article>
        ))}
      </section>
      <aside className="h-fit rounded-lg border bg-card p-5">
        <h2 className="font-semibold">Order summary</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between"><span>Items</span><span>{items.length}</span></div>
          <div className="flex justify-between border-t pt-3 text-base font-semibold"><span>Total</span><span>{formatCurrency(total)}</span></div>
        </div>
        <Button className="mt-5 w-full" disabled={!items.length || checkout.isPending} onClick={() => checkout.mutate()}>
          <CreditCard className="h-4 w-4" />
          {checkout.isPending ? 'Checking out...' : 'Checkout'}
        </Button>
      </aside>
    </div>
  );
}
