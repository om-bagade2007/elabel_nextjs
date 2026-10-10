import { useLocation, useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import ProductForm from '@/components/forms/ProductForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { insertProductSchema, type ProductWithPermissions } from '@shared/schema';
import { z } from 'zod';

type ProductFormData = z.infer<typeof insertProductSchema>;

export default function EditProductPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { id: productId } = useParams();

  const { data: product, isLoading: isLoadingProduct } = useQuery<ProductWithPermissions>({
    queryKey: ['/api/products', productId],
    queryFn: () => apiRequest(`/api/products/${productId}`),
    enabled: !!productId,
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      apiRequest(`/api/products/${productId}`, {
        method: 'PUT',
        data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', productId] });
      toast({
        title: 'Product updated',
        description: 'Product has been successfully updated',
      });
      setLocation('/products');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update product',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: ProductFormData) => {
    updateProductMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/products');
  };

  if (isLoadingProduct) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">The product you're trying to edit doesn't exist.</p>
          <Button onClick={() => setLocation('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  if (!product.canEdit) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl">You cannot edit this product</h1>
          <p className="text-muted-foreground mb-4">
            Only the account that created this product can change it.
          </p>
          <Button onClick={() => setLocation('/products')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="outline"
            onClick={() => setLocation('/products')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        <h1 className="mb-2 text-4xl">Edit Product</h1>
        <p className="text-muted-foreground">Update product information and details</p>
      </div>

      {/* Form */}
      <div>
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateProductMutation.isPending}
        />
      </div>
    </div>
  );
}
