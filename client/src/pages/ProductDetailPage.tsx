import { useState, useRef } from 'react';
import { ArrowLeft, Download, Copy, Edit, Trash2, Eye, QrCode, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation, useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import ProductPreviewModal from '@/components/modals/ProductPreviewModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import type { ProductWithPermissions } from '@shared/schema';

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute('/products/:id');
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<ProductWithPermissions>({
    queryKey: ['/api/products', params?.id],
    queryFn: () => apiRequest(`/api/products/${params?.id}`),
    enabled: !!params?.id,
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({
        title: 'Product deleted',
        description: 'Product has been successfully deleted',
      });
      setLocation('/products');
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
      setLocation('/products');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate product',
        variant: 'destructive',
      });
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiFetch(`/api/products/${params?.id}/image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', params?.id] });
      toast({
        title: 'Image uploaded',
        description: 'Product image has been uploaded successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to upload image',
        variant: 'destructive',
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => apiRequest(`/api/products/${params?.id}/image`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', params?.id] });
      toast({
        title: 'Image deleted',
        description: 'Product image has been deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    },
  });

  const handleEditProduct = () => {
    setLocation(`/products/edit/${params?.id}`);
  };

  const handleDuplicateProduct = () => {
    if (product) {
      const { id, createdAt, updatedAt, ...productData } = product;
      duplicateProductMutation.mutate(productData);
    }
  };

  const handleDeleteProduct = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (product) {
      deleteProductMutation.mutate(product.id);
      setShowDeleteModal(false);
    }
  };

  const generateQRCode = () => {
    if (product?.externalLink) {
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(product.externalLink)}`;
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${product.name}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'QR Code Downloaded',
        description: 'QR code has been downloaded successfully',
      });
    } else {
      toast({
        title: 'No External Link',
        description: 'Please add an external link to generate QR code',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Link has been copied to clipboard',
    });
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImageMutation.mutate(file);
    }
    // Reset the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteImage = () => {
    deleteImageMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p>Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Button onClick={() => setLocation('/products')} className="mt-4" variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between mb-8">
        <Button
          onClick={() => setLocation('/products')}
          variant="ghost"
          className="text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowPreview(true)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          {/* <Button onClick={handleEditProduct} variant="outline">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button> */}
          {product.canEdit && (
            <Button onClick={handleDeleteProduct} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          <Button onClick={handleDuplicateProduct} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="image">Product Image</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="fbo">FBO Details</TabsTrigger>
          <TabsTrigger value="digital">Digital Assets</TabsTrigger>
        </TabsList>

        {/* Product Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <p className="text-gray-900">{product.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <p className="text-gray-900">{product.brand || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Net Volume</label>
                  <p className="text-gray-900">{product.netVolume || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vintage</label>
                  <p className="text-gray-900">{product.vintage || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wine Type</label>
                  <p className="text-gray-900">{product.wineType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sugar Content
                  </label>
                  <p className="text-gray-900">{product.sugarContent || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Appellation
                  </label>
                  <p className="text-gray-900">{product.appellation || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alcohol Content
                  </label>
                  <p className="text-gray-900">{product.alcoholContent || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country of Origin
                  </label>
                  <p className="text-gray-900">{product.countryOfOrigin || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <p className="text-gray-900">{product.sku || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EAN</label>
                  <p className="text-gray-900">{product.ean || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packaging Gases
                  </label>
                  <p className="text-gray-900">{product.packagingGases || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Image Tab */}
        <TabsContent value="image" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500">Product Image Placeholder</span>
                  )}
                </div>
                {product.canEdit && (
                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={handleImageUpload}
                      disabled={uploadImageMutation.isPending}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {product.imageUrl ? 'Change Image' : 'Upload Image'}
                    </Button>
                    {product.imageUrl && (
                      <Button
                        variant="destructive"
                        onClick={handleDeleteImage}
                        disabled={deleteImageMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Image
                      </Button>
                    )}
                  </div>
                )}
                {!product.canEdit && (
                  <p className="text-sm text-gray-500">Only the product owner can change its image.</p>
                )}
                {(uploadImageMutation.isPending || deleteImageMutation.isPending) && (
                  <p className="text-sm text-blue-600">
                    {uploadImageMutation.isPending ? 'Uploading...' : 'Deleting...'}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  Supported formats: JPG, PNG. Recommended dimensions: 1000x750px. Max file size:
                  5MB
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Nutrition Information Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portion Size
                  </label>
                  <p className="text-gray-900">{product.portionSize || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Energy (kcal)
                  </label>
                  <p className="text-gray-900">{product.kcal || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Energy (kJ)
                  </label>
                  <p className="text-gray-900">{product.kj || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fat</label>
                  <p className="text-gray-900">{product.fat || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Carbohydrates
                  </label>
                  <p className="text-gray-900">{product.carbohydrates || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.organic && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Organic
                  </Badge>
                )}
                {product.vegetarian && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Vegetarian
                  </Badge>
                )}
                {product.vegan && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Vegan
                  </Badge>
                )}
                {!product.organic && !product.vegetarian && !product.vegan && (
                  <span className="text-gray-500">No certifications specified</span>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FBO Details Tab */}
        <TabsContent value="fbo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Business Operator Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator Type
                  </label>
                  <p className="text-gray-900">{product.operatorType || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Operator Name
                  </label>
                  <p className="text-gray-900">{product.operatorName || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <p className="text-gray-900">{product.operatorAddress || 'Not specified'}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information
                  </label>
                  <p className="text-gray-900">{product.operatorInfo || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Digital Assets Tab */}
        <TabsContent value="digital" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Digital Assets (QR Code)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="text-center">
                  {product.externalLink ? (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(product.externalLink)}`}
                      alt="QR Code for product"
                      className="w-48 h-48 mx-auto border rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 mx-auto border rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">No QR Code Available</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">QR Code generated from External Link</p>
                </div>

                {/* Download QR Code */}
                <div className="text-center">
                  <Button
                    onClick={generateQRCode}
                    variant="outline"
                    disabled={!product.externalLink}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download QR Code
                  </Button>
                </div>

                {/* External Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    External Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={product.externalLink || 'No external link specified'}
                      readOnly
                      className="flex-1 text-sm bg-gray-50"
                    />
                    {product.externalLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(product.externalLink!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Redirect Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Redirect Link
                  </label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={product.redirectLink || 'No redirect link specified'}
                      readOnly
                      className="flex-1 text-sm bg-gray-50"
                    />
                    {product.redirectLink && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(product.redirectLink!)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit All Details */}
          {product.canEdit && (
            <Card>
              <CardHeader>
                <CardTitle>Edit All Details</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Edit all product details including images, information, ingredients, nutrition,
                  certifications, and FBO details.
                </p>
                <Button onClick={handleEditProduct} className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit All Product Details
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProductPreviewModal
        product={product}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />

      <DeleteConfirmationModal
        product={product}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
