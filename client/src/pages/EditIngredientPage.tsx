import { useLocation } from 'wouter';
import { useParams } from 'wouter';
import IngredientForm from '@/components/forms/IngredientForm';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import type { Ingredient } from '@shared/schema';

export default function EditIngredientPage() {
  const params = useParams();
  const ingredientId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!ingredientId) {
    setLocation('/ingredients');
    return null;
  }

  const { data: ingredient, isLoading } = useQuery({
    queryKey: ['/api/ingredients', ingredientId],
    queryFn: async () => {
      const response = await apiFetch(`/api/ingredients/${ingredientId}`);
      if (!response.ok) throw new Error('Failed to fetch ingredient');
      return response.json() as Promise<Ingredient>;
    },
    enabled: !!ingredientId,
  });

  const updateIngredientMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest(`/api/ingredients/${ingredientId}`, { method: 'PUT', data }),
    onSuccess: (updatedIngredient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients', ingredientId] });
      toast({
        title: 'Ingredient updated successfully!',
        description: `${updatedIngredient.name} has been updated.`,
      });
      setLocation('/ingredients');
    },
    onError: () => {
      toast({
        title: 'Error updating ingredient',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: any) => {
    updateIngredientMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/ingredients');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading ingredient...</div>
        </div>
      </div>
    );
  }

  if (!ingredient) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Ingredient not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl">Edit Ingredient</h1>
        <p className="text-muted-foreground">Update ingredient information</p>
      </div>

      <IngredientForm
        ingredient={ingredient}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateIngredientMutation.isPending}
      />
    </div>
  );
}
