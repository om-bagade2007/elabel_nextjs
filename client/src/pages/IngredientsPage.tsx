import { useState, useRef } from 'react';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import IngredientsTable from '@/components/tables/IngredientsTable';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import type { Ingredient } from '@shared/schema';

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['/api/ingredients'],
    queryFn: async () => {
      const response = await apiFetch('/api/ingredients');
      if (!response.ok) throw new Error('Failed to fetch ingredients');
      return response.json() as Promise<Ingredient[]>;
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      toast({
        title: 'Ingredient deleted successfully',
        description: 'The ingredient has been removed from your inventory.',
      });
    },
    onError: () => {
      toast({
        title: 'Error deleting ingredient',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const duplicateIngredientMutation = useMutation({
    mutationFn: async (ingredient: Ingredient) => {
      const duplicateData = {
        name: `${ingredient.name} (Copy)`,
        category: ingredient.category,
        eNumber: ingredient.eNumber,
        allergens: ingredient.allergens,
        details: ingredient.details,
      };
      return apiRequest('/api/ingredients', { method: 'POST', data: duplicateData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      toast({
        title: 'Ingredient duplicated successfully',
        description: 'A copy has been created.',
      });
    },
    onError: () => {
      toast({
        title: 'Error duplicating ingredient',
        description: 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const importIngredientsMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch('/api/ingredients/import', {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) throw new Error('Failed to import ingredients');
        return res.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingredients'] });
      toast({
        title: 'Import completed',
        description: `Imported ${data.imported} ingredients${data.errors.length > 0 ? ` with ${data.errors.length} errors` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to import ingredients',
        variant: 'destructive',
      });
    },
  });

  const exportIngredientsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/ingredients/export')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to export ingredients');
          return res.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'ingredients.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }),
    onSuccess: () => {
      toast({
        title: 'Export completed',
        description: 'Ingredients exported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export ingredients',
        variant: 'destructive',
      });
    },
  });

  const filteredIngredients = ingredients.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.eNumber?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (ingredient: Ingredient) => {
    setLocation(`/ingredients/${ingredient.id}/edit`);
  };

  const handleDelete = (ingredient: Ingredient) => {
    deleteIngredientMutation.mutate(ingredient.id);
  };

  const handleDuplicate = (ingredient: Ingredient) => {
    duplicateIngredientMutation.mutate(ingredient);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importIngredientsMutation.mutate(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    exportIngredientsMutation.mutate();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Ingredients</h1>
        <p className="text-gray-600">Manage ingredients and allergen information</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setLocation('/ingredients/create')}
            className="bg-accent hover:bg-accent/90 text-white font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search ingredients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Ingredients Table */}
      <IngredientsTable
        ingredients={filteredIngredients}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onDuplicate={handleDuplicate}
      />

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />
    </div>
  );
}
