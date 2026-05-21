import { Link, useLocation, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof schema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const form = useForm<LoginValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/products';

  async function onSubmit(values: LoginValues) {
    setError('');
    try {
      await login(values.email, values.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue shopping or managing the catalog.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button className="w-full" disabled={form.formState.isSubmitting}>
          <LogIn className="h-4 w-4" />
          {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Need an account? <Link className="font-medium text-primary hover:underline" to="/register">Create one</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <LogIn className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}
