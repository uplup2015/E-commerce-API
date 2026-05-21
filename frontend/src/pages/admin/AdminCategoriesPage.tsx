import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Category } from '@/lib/types';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({ name: z.string().min(2).max(100) });
type CategoryValues = z.infer<typeof schema>;

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const form = useForm<CategoryValues>({ resolver: zodResolver(schema), defaultValues: { name: '' } });

  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get<Category[]>('/categories')).data,
  });

  useEffect(() => {
    if (open) form.reset({ name: editing?.name ?? '' });
  }, [open, editing, form]);

  const saveCategory = useMutation({
    mutationFn: async (values: CategoryValues) => editing ? api.patch(`/categories/${editing.id}`, values) : api.post('/categories', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
    onError: (err) => setError(getErrorMessage(err)),
  });

  function startCreate() {
    setEditing(null);
    setError('');
    setOpen(true);
  }

  function startEdit(category: Category) {
    setEditing(category);
    setError('');
    setOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Categories Management</h1>
          <p className="text-sm text-muted-foreground">Maintain the categories used by products.</p>
        </div>
        <Button onClick={startCreate}><Plus className="h-4 w-4" /> New category</Button>
      </div>
      {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {categories.isLoading ? <LoadingState label="Loading categories..." /> : null}
      {categories.isError ? <ErrorState message={getErrorMessage(categories.error)} /> : null}
      {categories.data?.length === 0 ? <EmptyState title="No categories yet" description="Create a category before adding products." /> : null}
      {categories.data?.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.id}</TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEdit(category)}><Edit className="h-4 w-4" /> Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => window.confirm('Delete this category?') && deleteCategory.mutate(category.id)}>
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
            <DialogTitle>{editing ? 'Edit category' : 'Create category'}</DialogTitle>
            <DialogDescription>Category names must be unique.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveCategory.mutate(values))}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} />
              {form.formState.errors.name?.message ? <p className="text-sm text-destructive">{form.formState.errors.name.message}</p> : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button disabled={saveCategory.isPending}>{saveCategory.isPending ? 'Saving...' : 'Save category'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
