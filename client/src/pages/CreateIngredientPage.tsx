import { useLocation } from 'wouter';
import IngredientForm from '@/components/forms/IngredientForm';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export default function CreateIngredientPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createIngredientMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/ingredients', { method: 'POST', data }),
    onSuccess: (newIngredient) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      toast({
        title: 'Ingredient created successfully!',
        description: `${newIngredient.name} has been added to your ingredients database.`,
      });
      setLocation('/ingredients');
    },
    onError: () => {
      toast({
        title: 'Error creating ingredient',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (data: any) => {
    createIngredientMutation.mutate(data);
  };

  const handleCancel = () => {
    setLocation('/ingredients');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-4xl">New ingredient</h1>
        <p className="text-muted-foreground">Add a new ingredient to your database</p>
      </div>

      <IngredientForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={createIngredientMutation.isPending}
      />
    </div>
  );
}
