import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center">
      <h3 className="font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Alert className="border-destructive/40 bg-destructive/5">
      <AlertTitle>Request failed</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
