import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          toast({
            title: 'Welcome!',
            description: 'You have been successfully logged in.',
          });
          setLocation('/products');
        } else {
          throw new Error('No session found');
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        toast({
          title: 'Authentication failed',
          description: error.message || 'Please try logging in again',
          variant: 'destructive',
        });
        setLocation('/login');
      }
    };

    handleAuthCallback();
  }, [setLocation, toast, setUser]);

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="mb-4 text-3xl">Completing authentication...</h1>
        <p className="text-muted-foreground dark:text-gray-400">Please wait while we log you in.</p>
      </div>
    </div>
  );
}
