import { useLocation } from 'wouter';
import { User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function Navigation() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation('/');
    toast({
      title: 'Logged out',
    });
  };

  const navItems = [
    { label: 'Home', path: '/', id: 'landing' },
    { label: 'Products', path: '/products', id: 'products', protected: true },
    { label: 'Ingredients', path: '/ingredients', id: 'ingredients', protected: true },
  ];

  const handleNavClick = (path: string, isProtected: boolean) => {
    if (isProtected && !isAuthenticated) {
      setLocation('/login');
      toast({
        title: 'Log in to continue',
        description: 'Products and ingredients are only visible to signed-in producers.',
        variant: 'destructive',
      });
      return;
    }
    setLocation(path);
  };

  const isActive = (path: string) => (path === '/' ? location === '/' : location.startsWith(path));

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur" aria-label="Main">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-8 sm:px-6 lg:px-8">
        <button onClick={() => setLocation('/')} className="shrink-0 font-display text-lg text-primary sm:text-xl">
          Open E-Label
        </button>

        <div className="flex min-w-0 flex-1 items-center sm:gap-2">
          {navItems.slice(1).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path, item.protected || false)}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`min-h-11 rounded-md px-2 text-sm sm:px-3 transition-colors hover:bg-muted ${
                isActive(item.path) ? 'font-semibold text-primary' : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden max-w-48 truncate text-sm text-muted-foreground lg:block">
                {user?.email || user?.id}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="sr-only sm:not-sr-only">Log out</span>
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setLocation('/login')}>
              <User className="h-4 w-4 sm:mr-2" />
              <span className="sr-only sm:not-sr-only">Log in</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
