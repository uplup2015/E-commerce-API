import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/utils';
import { AuthShell, FieldError } from '@/pages/LoginPage';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type RegisterValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const form = useForm<RegisterValues>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '' } });

  async function onSubmit(values: RegisterValues) {
    setError('');
    try {
      await register(values);
      navigate('/products', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <AuthShell title="Create account" subtitle="Register as a customer and start using the storefront.">
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {error ? <Alert className="border-destructive/40 bg-destructive/5"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" autoComplete="name" {...form.register('name')} />
          <FieldError message={form.formState.errors.name?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
          <FieldError message={form.formState.errors.email?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          <FieldError message={form.formState.errors.password?.message} />
        </div>
        <Button className="w-full" disabled={form.formState.isSubmitting}>
          <UserPlus className="h-4 w-4" />
          {form.formState.isSubmitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account? <Link className="font-medium text-primary hover:underline" to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
