import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

export function OrderDetailPage() {
  const { id } = useParams();
  const order = useQuery({
    queryKey: ['order', id],
    queryFn: async () => (await api.get<Order>(`/orders/${id}`)).data,
    enabled: Boolean(id),
  });

  if (order.isLoading) return <LoadingState label="Loading order..." />;
  if (order.isError) return <ErrorState message={getErrorMessage(order.error)} />;
  if (!order.data) return <EmptyState title="Order not found" />;

  return (
    <div className="space-y-5">
      <Button variant="ghost" asChild><Link to="/orders"><ArrowLeft className="h-4 w-4" /> Back to orders</Link></Button>
      <section className="rounded-lg border bg-card p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">Order #{order.data.id}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formatDate(order.data.createdAt)}</p>
          </div>
          <Badge>{order.data.status}</Badge>
        </div>
        <div className="mt-5 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.data.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.title}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(Number(item.price) * item.quantity)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex justify-end text-lg font-semibold">Total: {formatCurrency(order.data.total)}</div>
      </section>
    </div>
  );
}
