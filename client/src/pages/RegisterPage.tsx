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

const passwordSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

function getRegistrationErrorMessage(error?: string) {
  if (error?.toLowerCase().includes('rate limit')) {
    return 'Supabase has temporarily limited signup emails for this project. Wait for the limit to reset before retrying. If you already completed signup, log in instead. For regular testing, configure custom SMTP in Supabase under Authentication > Emails > SMTP Settings.';
  }

  return error || 'Please try again';
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { loginWithMagicLink, register } = useAuth();
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
      confirmPassword: '',
    },
  });

  const onMagicLinkSubmit = async (data: MagicLinkFormData) => {
    setIsLoading(true);
    try {
      const result = await loginWithMagicLink(data.email);
      if (result.success) {
        setEmailSent(true);
        toast({
          title: 'Magic link sent!',
          description: 'Please check your email to complete your registration.',
        });
      } else {
        toast({
          title: 'Failed to send magic link',
          description: getRegistrationErrorMessage(result.error),
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      console.log('Starting registration process with:', {
        email: data.email,
        passwordLength: data.password.length,
        passwordValid: passwordSchema.safeParse(data).success,
      });

      const result = await register(data.email, data.password);
      console.log('Registration result:', result);

      if (result.success) {
        toast({
          title: 'Registration successful! 🎉',
          description:
            "Please check your email to verify your account. If you don't see it, check your spam folder.",
          duration: 6000,
        });
        setLocation('/login');
      } else {
        console.error('Registration failed:', result.error);
        toast({
          title: 'Registration failed',
          description: getRegistrationErrorMessage(result.error),
          variant: 'destructive',
          duration: 6000,
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
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
          <CardTitle>Create Account</CardTitle>
          <CardDescription>Choose how you want to register</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password">
            {' '}
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Register
              </TabsTrigger>
              <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
            </TabsList>
            <TabsContent value="magic-link">
              {emailSent ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-medium">Check your email</h3>
                  <p className="text-muted-foreground">
                    We've sent you a magic link to complete your registration.
                  </p>
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
                            <Input placeholder="Enter your email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Sending...' : 'Register with Magic Link'}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
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
                          <Input placeholder="Enter your email" type="email" {...field} />
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
                          <Input placeholder="Enter your password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-muted-foreground">
                          Password must contain at least 8 characters, one uppercase letter, one
                          lowercase letter, one number, and one special character.
                        </p>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input placeholder="Confirm your password" type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />{' '}
                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
