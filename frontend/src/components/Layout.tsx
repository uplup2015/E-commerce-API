import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, LogOut, Menu, Package, ShoppingCart, Tags, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const customerLinks = [
  { to: '/products', label: 'Products', icon: Package },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/orders', label: 'My Orders', icon: ClipboardList },
];

const adminLinks = [
  { to: '/admin/products', label: 'Products Management', icon: Package },
  { to: '/admin/categories', label: 'Categories Management', icon: Tags },
  { to: '/admin/orders', label: 'Orders Management', icon: ClipboardList },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : user ? customerLinks : customerLinks.slice(0, 1);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={user?.role === 'ADMIN' ? '/admin/products' : '/products'} className="flex items-center gap-2 font-semibold">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Boxes className="h-5 w-5" />
            </span>
            Commerce API
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden text-right text-sm sm:block">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{user.role}</div>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="border-t px-4 py-2 md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Menu className="h-4 w-4 shrink-0 text-muted-foreground" />
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn('shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground', isActive && 'bg-accent text-accent-foreground')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
