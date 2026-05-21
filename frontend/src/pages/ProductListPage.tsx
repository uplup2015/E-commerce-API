import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ProductImage } from '@/components/ProductImage';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Category, Product, ProductPage } from '@/lib/types';
import { formatCurrency, getErrorMessage } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const LIMIT = 8;

export function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  const page = Number(params.get('page') ?? 1);
  const categoryId = params.get('categoryId') ?? '';
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const products = useQuery({
    queryKey: ['products', { search: params.get('search') ?? '', categoryId, page, limit: LIMIT }],
    queryFn: async () =>
      (
        await api.get<ProductPage>('/products', {
          params: { search: params.get('search') || undefined, categoryId: categoryId || undefined, page, limit: LIMIT },
        })
      ).data,
  });

  const addToCart = useMutation({
    mutationFn: async (productId: number) => api.post('/cart/items', { productId, quantity: 1 }),
    onSuccess: () => {
      setNotice('Added to cart.');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => setNotice(getErrorMessage(error)),
  });

  function handleAddToCart(productId: number) {
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    addToCart.mutate(productId);
  }

  function applyFilters(nextPage = 1) {
    const next = new URLSearchParams();
    if (search.trim()) next.set('search', search.trim());
    if (categoryId) next.set('categoryId', categoryId);
    next.set('page', String(nextPage));
    setParams(next);
  }

  function setCategory(value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set('categoryId', value);
    else next.delete('categoryId');
    next.set('page', '1');
    setParams(next);
  }

  const meta = products.data?.meta;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium" htmlFor="search">Search products</label>
          <div className="flex gap-2">
            <Input id="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by product title" />
            <Button type="button" onClick={() => applyFilters(1)}>
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
        <div className="space-y-2 sm:w-64">
          <label className="text-sm font-medium" htmlFor="category">Category</label>
          <Select id="category" value={categoryId} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.data?.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        </div>
      </section>

      {notice ? <div className="rounded-md border bg-card px-4 py-3 text-sm">{notice}</div> : null}
      {products.isLoading ? <LoadingState label="Loading products..." /> : null}
      {products.isError ? <ErrorState message={getErrorMessage(products.error)} /> : null}
      {products.data?.data.length === 0 ? <EmptyState title="No products found" description="Try another search or category." /> : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.data?.data.map((product) => (
          <ProductCard key={product.id} product={product} onAdd={() => handleAddToCart(product.id)} adding={addToCart.isPending} />
        ))}
      </section>

      {meta && meta.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">Page {meta.page} of {meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={meta.page <= 1} onClick={() => applyFilters(meta.page - 1)}>Previous</Button>
            <Button variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => applyFilters(meta.page + 1)}>Next</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProductCard({ product, onAdd, adding }: { product: Product; onAdd: () => void; adding: boolean }) {
  return (
    <article className="flex min-h-full flex-col rounded-lg border bg-card p-3 shadow-sm">
      <Link to={`/products/${product.id}`}>
        <ProductImage src={product.images[0]} alt={product.title} className="aspect-[4/3] w-full" />
      </Link>
      <div className="flex flex-1 flex-col gap-3 pt-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge>{product.category?.name ?? 'Uncategorized'}</Badge>
            <span className="text-sm text-muted-foreground">{product.stock} in stock</span>
          </div>
          <Link to={`/products/${product.id}`} className="line-clamp-2 font-semibold hover:text-primary">{product.title}</Link>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="font-semibold">{formatCurrency(product.price)}</span>
          <Button size="sm" disabled={adding || product.stock < 1} onClick={onAdd}>
            <ShoppingCart className="h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </article>
  );
}
