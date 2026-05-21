import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { ProductImage } from '@/components/ProductImage';
import { api } from '@/lib/api';
import type { Category, Product, ProductPage } from '@/lib/types';
import { formatCurrency, getErrorMessage } from '@/lib/utils';

const productSchema = z.object({
  title: z.string().min(2).max(200),
  price: z.string().refine((value) => Number(value) > 0, 'Price must be greater than 0.'),
  stock: z.string().refine((value) => Number.isInteger(Number(value)) && Number(value) >= 0, 'Stock must be 0 or more.'),
  categoryId: z.string().refine((value) => Number(value) > 0, 'Category is required.'),
  imagesText: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const products = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => (await api.get<ProductPage>('/products', { params: { page: 1, limit: 100 } })).data,
  });

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { title: '', price: '1', stock: '0', categoryId: '0', imagesText: '' },
  });

  useEffect(() => {
    if (open && editing) {
      form.reset({
        title: editing.title,
        price: String(editing.price),
        stock: String(editing.stock),
        categoryId: String(editing.categoryId),
        imagesText: editing.images.join('\n'),
      });
    }
    if (open && !editing) {
      form.reset({ title: '', price: '1', stock: '0', categoryId: String(categories.data?.[0]?.id ?? 0), imagesText: '' });
    }
  }, [open, editing, categories.data, form]);

  const saveProduct = useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const payload = {
        title: values.title,
        price: Number(values.price),
        stock: Number(values.stock),
        categoryId: Number(values.categoryId),
        images: parseImageUrls(values.imagesText),
      };
      return editing ? api.patch(`/products/${editing.id}`, payload) : api.post('/products', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: number) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  function startCreate() {
    setEditing(null);
    setError('');
    setOpen(true);
  }

  function startEdit(product: Product) {
    setEditing(product);
    setError('');
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Products Management</h1>
          <p className="text-sm text-muted-foreground">Create products with URL-based image lists.</p>
        </div>
        <Button onClick={startCreate}><Plus className="h-4 w-4" /> New product</Button>
      </div>
      {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {products.isLoading ? <LoadingState label="Loading products..." /> : null}
      {products.isError ? <ErrorState message={getErrorMessage(products.error)} /> : null}
      {products.data?.data.length === 0 ? <EmptyState title="No products yet" description="Create a category first, then add products." /> : null}
      {products.data?.data.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.data.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage src={product.images[0]} alt={product.title} className="h-12 w-16" />
                      <span className="font-medium">{product.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{product.category?.name ?? '-'}</TableCell>
                  <TableCell>{formatCurrency(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(product)}><Edit className="h-4 w-4" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => window.confirm('Delete this product?') && deleteProduct.mutate(product.id)}>
                        <Trash2 className="h-4 w-4" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit product' : 'Create product'}</DialogTitle>
            <DialogDescription>Images are URL strings, one per line.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveProduct.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...form.register('title')} />
              <FieldError message={form.formState.errors.title?.message} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" step="0.01" min="0.01" {...form.register('price')} />
                <FieldError message={form.formState.errors.price?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" {...form.register('stock')} />
                <FieldError message={form.formState.errors.stock?.message} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select id="categoryId" {...form.register('categoryId')}>
                  <option value={0}>Select category</option>
                  {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
                <FieldError message={form.formState.errors.categoryId?.message} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imagesText">Image URLs</Label>
              <Textarea id="imagesText" placeholder="https://example.com/product.jpg" {...form.register('imagesText')} />
            </div>
            {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saveProduct.isPending}>{saveProduct.isPending ? 'Saving...' : 'Save product'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseImageUrls(value?: string) {
  return (value ?? '').split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}
