import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { z } from 'zod';

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { loginWithMagicLink, loginWithPassword } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const magicLinkForm = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);
    try {
      console.log('Attempting magic link login for:', data.email);
      const result = await loginWithMagicLink(data.email);

      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'Magic link sent!',
          description: 'Please check your email for the login link.',
          duration: 6000,
        });
      } else {
        console.error('Magic link failed:', result.error);
        toast({
          title: 'Failed to send magic link',
          description: result.error || 'Please try again',
          variant: 'destructive',
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Magic link error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      console.log('Attempting password login for:', data.email);
      const result = await loginWithPassword(data.email, data.password);
      console.log('Login result:', result);

      if (result.success) {
        toast({
          title: 'Login successful!',
          description: 'Welcome back!',
        });
        // Redirect to the products page or dashboard
        setLocation('/products');
      } else {
        console.error('Login failed:', result.error);
        toast({
          title: 'Login failed',
          description: result.error || 'Please check your credentials and try again',
          variant: 'destructive',
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Log In</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            {' '}
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Log In
              </TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your email"
                            type="email"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your password"
                            type="password"
                            {...field}
                            disabled={isLoading}
                            className="h-11"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Log in'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="magic-link">
              {emailSent ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">Check your email</h3>
                  <p className="text-muted-foreground">
                    We've sent you a magic link to log in. If you don't see it, check your spam
                    folder.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => setEmailSent(false)}>
                    Try again
                  </Button>
                </div>
              ) : (
                <Form {...magicLinkForm}>
                  <form
                    onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={magicLinkForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                              disabled={isLoading}
                              className="h-11"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full h-11 text-base font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Magic Link'}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </p>
            <Link href="/reset-password" className="text-primary hover:underline block font-medium">
              Forgot password?
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
