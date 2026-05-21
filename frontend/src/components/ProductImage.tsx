import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductImage({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  if (!src) {
    return (
      <div className={cn('flex items-center justify-center rounded-md border bg-muted text-muted-foreground', className)}>
        <ImageOff className="h-8 w-8" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={cn('rounded-md border object-cover', className)} loading="lazy" />;
}
