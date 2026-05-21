import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState, ErrorState, LoadingState } from '@/components/Status';
import { api } from '@/lib/api';
import type { Order, OrderStatus } from '@/lib/types';
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils';

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [draftStatuses, setDraftStatuses] = useState<Record<number, OrderStatus>>({});
  const [error, setError] = useState('');
  const orders = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get<Order[]>('/orders')).data,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: OrderStatus }) => api.patch(`/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setError('');
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  if (orders.isLoading) return <LoadingState label="Loading orders..." />;
  if (orders.isError) return <ErrorState message={getErrorMessage(orders.error)} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Orders Management</h1>
        <p className="text-sm text-muted-foreground">Review orders and update fulfillment status.</p>
      </div>
      {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
      {!orders.data?.length ? <EmptyState title="No orders yet" description="Customer checkouts will appear here." /> : null}
      {orders.data?.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.data.map((order) => {
                const draft = draftStatuses[order.id] ?? order.status;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.id}</TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.items.length}</TableCell>
                    <TableCell>{formatCurrency(order.total)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge>{order.status}</Badge>
                        <Select
                          value={draft}
                          onChange={(event) => setDraftStatuses((current) => ({ ...current, [order.id]: event.target.value as OrderStatus }))}
                          className="w-40"
                        >
                          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                        </Select>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        disabled={updateStatus.isPending || draft === order.status}
                        onClick={() => updateStatus.mutate({ id: order.id, status: draft })}
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
