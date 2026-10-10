import { useLocation } from 'wouter';
import ProductForm from '@/components/forms/ProductForm';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

function getCreateProductErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;

  if (error && typeof error === 'object') {
    const details = error as { message?: unknown; error?: unknown; details?: unknown };
    if (typeof details.message === 'string' && details.message.trim()) return details.message;
    if (typeof details.error === 'string' && details.error.trim()) return details.error;
    try {
      return JSON.stringify(error);
    } catch {
      // Use the generic message below for non-serializable error objects.
    }
  }

  return 'The product request failed without an error message. Check the server terminal for details.';
}

export default function CreateProductPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/products', { method: 'POST', data }),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product created successfully!',
        description: `${newProduct.name} has been added to your inventory.`,
      });
      setLocation('/products');
    },
    onError: (error) => {
      console.error('Product creation failed:', error);
      toast({
        title: 'Error creating product',
        description: getCreateProductErrorMessage(error),
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: any) => {
    createProductMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/products');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl">New product</h1>
        <p className="text-muted-foreground">Add a new wine product to your inventory</p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createProductMutation.isPending}
      />
    </div>
  );
}
