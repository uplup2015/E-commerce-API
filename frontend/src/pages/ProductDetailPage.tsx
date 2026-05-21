import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function ProductDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const product = useQuery({
    queryKey: ['product', id],
    queryFn: async () => (await api.get<Product>(`/products/${id}`)).data,
    enabled: Boolean(id),
  });

  const addToCart = useMutation({
    mutationFn: async () => api.post('/cart/items', { productId: Number(id), quantity }),
    onSuccess: () => {
      setNotice('Added to cart.');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => setNotice(getErrorMessage(error)),
  });

  function handleAddToCart() {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    addToCart.mutate();
  }

  if (product.isLoading) return <LoadingState label="Loading product..." />;
  if (product.isError) return <ErrorState message={getErrorMessage(product.error)} />;
  if (!product.data) return <EmptyState title="Product not found" />;

  const item = product.data;
  const images = item.images.length ? item.images : [undefined];

  return (
    <div className="space-y-5">
      <Button variant="ghost" asChild>
        <Link to="/products"><ArrowLeft className="h-4 w-4" /> Back to products</Link>
      </Button>
      {notice ? <div className="rounded-md border bg-card px-4 py-3 text-sm">{notice}</div> : null}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {images.map((src, index) => (
            <ProductImage key={`${src ?? 'placeholder'}-${index}`} src={src} alt={item.title} className="aspect-[4/3] w-full" />
          ))}
        </div>
        <div className="rounded-lg border bg-card p-5">
          <Badge>{item.category?.name ?? 'Uncategorized'}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-normal">{item.title}</h1>
          <p className="mt-3 text-2xl font-semibold text-primary">{formatCurrency(item.price)}</p>
          <p className="mt-2 text-sm text-muted-foreground">{item.stock} units available</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              type="number"
              min={1}
              max={Math.max(item.stock, 1)}
              value={quantity}
              onChange={(event) => setQuantity(Math.min(Math.max(Number(event.target.value), 1), Math.max(item.stock, 1)))}
              className="sm:w-28"
            />
            <Button disabled={addToCart.isPending || item.stock < 1 || quantity > item.stock} onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4" />
              {item.stock < 1 ? 'Out of stock' : 'Add to cart'}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
