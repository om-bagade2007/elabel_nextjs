import { useLocation } from 'wouter';
import ProductForm from '@/components/forms/ProductForm';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
      toast({
        title: 'Error creating product',
        description: error instanceof Error ? error.message : 'Please try again.',
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Product</h1>
        <p className="text-gray-600">Add a new wine product to your inventory</p>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createProductMutation.isPending}
      />
    </div>
  );
}
