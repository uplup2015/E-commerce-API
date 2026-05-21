import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

export function OrdersPage() {
  const orders = useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await api.get<Order[]>('/orders')).data,
  });

  if (orders.isLoading) return <LoadingState label="Loading orders..." />;
  if (orders.isError) return <ErrorState message={getErrorMessage(orders.error)} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">My Orders</h1>
        <p className="text-sm text-muted-foreground">Track checkout history and order status.</p>
      </div>
      {!orders.data?.length ? <EmptyState title="No orders yet" description="Checkout from your cart to create an order." /> : null}
      {orders.data?.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell><Badge>{order.status}</Badge></TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild><Link to={`/orders/${order.id}`}><Eye className="h-4 w-4" /> View</Link></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
