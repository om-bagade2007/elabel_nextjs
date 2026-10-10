import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
      toast({
        title: 'Log in to continue',
        description: 'Products and ingredients are only visible to signed-in producers.',
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, setLocation, toast]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
