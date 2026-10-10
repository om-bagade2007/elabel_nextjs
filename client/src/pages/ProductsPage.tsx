import { useState, useRef } from 'react';
import { Plus, Upload, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import ProductsTable from '@/components/tables/ProductsTable';
import ProductPreviewModal from '@/components/modals/ProductPreviewModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import type { Product, ProductWithPermissions } from '@shared/schema';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products = [], isLoading } = useQuery<ProductWithPermissions[]>({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest('/api/products'),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product deleted',
        description: 'Product has been successfully deleted',
      });
      setShowDeleteModal(false);
      setSelectedProduct(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    },
  });

  const duplicateProductMutation = useMutation({
    mutationFn: (productData: any) =>
      apiRequest('/api/products', {
        method: 'POST',
        data: { ...productData, name: `${productData.name} (Copy)` },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product duplicated',
        description: 'Product has been successfully duplicated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate product',
        variant: 'destructive',
      });
    },
  });

  const importProductsMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return apiFetch('/api/products/import', {
        method: 'POST',
        body: formData,
      }).then(async (res) => {
        if (!res.ok) throw new Error('Failed to import products');
        return res.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Import completed',
        description: `Imported ${data.imported} products${data.errors.length > 0 ? ` with ${data.errors.length} errors` : ''}`,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to import products',
        variant: 'destructive',
      });
    },
  });

  const exportProductsMutation = useMutation({
    mutationFn: () =>
      apiFetch('/api/products/export')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to export products');
          return res.blob();
        })
        .then((blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'products.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }),
    onSuccess: () => {
      toast({
        title: 'Export completed',
        description: 'Products exported successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to export products',
        variant: 'destructive',
      });
    },
  });

  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (product: Product) => {
    setLocation(`/products/edit/${product.id}`);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  const handleDuplicate = (product: Product) => {
    const { id, createdAt, updatedAt, ...productData } = product;
    duplicateProductMutation.mutate(productData);
  };

  const handlePreview = (product: Product) => {
    setSelectedProduct(product);
    setShowPreview(true);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importProductsMutation.mutate(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExport = () => {
    exportProductsMutation.mutate();
  };

  const confirmDelete = () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl">Products</h1>
        <p className="mt-2 text-muted-foreground">Each product has its own label and public passport.</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setLocation('/products/create')}
          >
            <Plus className="w-4 h-4 mr-2" />
            New product
          </Button>
          <Button variant="outline" onClick={handleImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export Excel
          </Button>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products"
            aria-label="Search products"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading products">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div role="status" className="rounded-[10px] border border-dashed bg-card px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No products yet</h2>
          <p className="mt-1 text-muted-foreground">Create your first wine, or import a list from Excel.</p>
          <Button className="mt-6" onClick={() => setLocation('/products/create')}>
            <Plus className="mr-2 h-4 w-4" />
            New product
          </Button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <p role="status" className="rounded-[10px] border bg-card px-6 py-12 text-center text-muted-foreground">
          No products match &ldquo;{searchTerm}&rdquo;.
        </p>
      ) : (
        <ProductsTable
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onPreview={handlePreview}
        />
      )}

      {/* Hidden file input for Excel import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        style={{ display: 'none' }}
      />

      {/* Modals */}
      <ProductPreviewModal
        product={selectedProduct}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />

      <DeleteConfirmationModal
        product={selectedProduct}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
