import { useState, useRef } from 'react';
import { ArrowLeft, Download, Copy, Edit, Trash2, Eye, QrCode, Upload, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation, useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import ProductPreviewModal from '@/components/modals/ProductPreviewModal';
import DeleteConfirmationModal from '@/components/modals/DeleteConfirmationModal';
import WineLabel, {
  downloadSvg,
  formatAbv,
  PACKAGING_GASES,
  qrPath,
  useDppUrl,
} from '@/components/label/WineLabel';
import type { ProductWithIngredients, ProductWithPermissions } from '@shared/schema';

type DetailProduct = ProductWithPermissions & ProductWithIngredients;

function Facts({ title, rows }: { title: string; rows: [string, React.ReactNode][] }) {
  return (
    <section className="rounded-[10px] border bg-card p-5 sm:p-6">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-0.5">{value || <span className="text-muted-foreground/70">Not set</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function ProductDetailPage() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/products/:id');
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery<DetailProduct>({
    queryKey: ['/api/products', params?.id],
    queryFn: () => apiRequest(`/api/products/${params?.id}`),
    enabled: !!params?.id,
  });
  const dppUrl = useDppUrl(product?.id);

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: 'Product deleted' });
      setLocation('/products');
    },
    onError: () => {
      toast({ title: 'Could not delete the product', description: 'Try again.', variant: 'destructive' });
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
      toast({ title: 'Product duplicated' });
      setLocation('/products');
    },
    onError: () => {
      toast({ title: 'Could not duplicate the product', description: 'Try again.', variant: 'destructive' });
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
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', params?.id] });
      toast({ title: 'Image uploaded' });
    },
    onError: () => {
      toast({ title: 'Image upload failed', description: 'Use a JPG or PNG under 5 MB.', variant: 'destructive' });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: () => apiRequest(`/api/products/${params?.id}/image`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', params?.id] });
      toast({ title: 'Image removed' });
    },
    onError: () => {
      toast({ title: 'Could not remove the image', variant: 'destructive' });
    },
  });

  const handleDuplicateProduct = () => {
    if (product) {
      const { id, createdAt, updatedAt, ...productData } = product;
      duplicateProductMutation.mutate(productData);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({ title: 'Link copied' });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadImageMutation.mutate(file);
    // Reset so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const downloadQr = () => {
    const { size, d } = qrPath(dppUrl);
    const svg = new DOMParser().parseFromString(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${size + 4} ${size + 4}" width="30mm" height="30mm"><rect x="-2" y="-2" width="${size + 4}" height="${size + 4}" fill="#fff"/><path d="${d}" fill="#000" shape-rendering="crispEdges"/></svg>`,
      'image/svg+xml',
    ).documentElement as unknown as SVGSVGElement;
    downloadSvg(svg, `${product?.name}-dpp-qr.svg`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading product">
        <Skeleton className="mb-6 h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl">Product not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been deleted, or the link is wrong.</p>
        <Button onClick={() => setLocation('/products')} className="mt-6" variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to products
        </Button>
      </div>
    );
  }

  const subtitle = [product.brand, product.wineType, product.vintage].filter(Boolean).join(', ');
  const ingredients = product.ingredients || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Button
        onClick={() => setLocation('/products')}
        variant="ghost"
        className="-ml-3 mb-4 text-muted-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Products
      </Button>

      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl leading-tight sm:text-5xl">{product.name}</h1>
          {subtitle && <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            Passport ID <span className="font-medium text-foreground">DPP-{product.id}</span>
            {product.ean && (
              <>
                {', '}EAN <span className="font-medium text-foreground">{product.ean}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.canEdit && (
            <Button onClick={() => setLocation(`/products/edit/${product.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button onClick={() => setShowPreview(true)} variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleDuplicateProduct} variant="outline" disabled={duplicateProductMutation.isPending}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          {product.canEdit && (
            <Button onClick={() => setShowDeleteModal(true)} variant="outline" className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Facts
            title="Wine"
            rows={[
              ['Net volume', product.netVolume],
              ['Alcohol', formatAbv(product.alcoholContent)],
              ['Sugar content', product.sugarContent],
              ['Appellation', product.appellation],
              ['Country of origin', product.countryOfOrigin],
              ['Packaging gases', product.packagingGases && (PACKAGING_GASES[product.packagingGases] || product.packagingGases)],
              ['SKU', product.sku],
              ['EAN', product.ean],
            ]}
          />

          <section className="rounded-[10px] border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold">Ingredients</h2>
            {ingredients.length ? (
              <p className="leading-relaxed">
                {ingredients.map((ing, i) => (
                  <span key={ing.id} className={ing.allergens?.length ? 'font-bold' : undefined}>
                    {ing.name}
                    {ing.eNumber && ` (${ing.eNumber})`}
                    {i < ingredients.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </p>
            ) : (
              <p className="text-muted-foreground">
                No ingredients linked. {product.canEdit && 'Edit the product to add them to the label.'}
              </p>
            )}
          </section>

          <Facts
            title="Nutrition per 100 ml"
            rows={[
              ['Energy', [product.kj && `${product.kj} kJ`, product.kcal && `${product.kcal} kcal`].filter(Boolean).join(' / ')],
              ['Fat', product.fat],
              ['of which saturates', product.saturates],
              ['Carbohydrates', product.carbohydrates],
              ['of which sugars', product.sugar],
              ['Protein', product.protein],
              ['Salt', product.salt],
              ['Portion size', product.portionSize],
            ]}
          />

          <Facts
            title="Food business operator"
            rows={[
              ['Role', product.operatorType],
              ['Name', product.operatorName],
              ['Address', product.operatorAddress],
              ['More information', product.operatorInfo],
            ]}
          />

          <section className="rounded-[10px] border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold">Certifications and warnings</h2>
            <div className="flex flex-wrap gap-2">
              {product.organic && <Badge className="bg-verified/10 text-verified hover:bg-verified/10">Organic</Badge>}
              {product.vegetarian && <Badge className="bg-verified/10 text-verified hover:bg-verified/10">Vegetarian</Badge>}
              {product.vegan && <Badge className="bg-verified/10 text-verified hover:bg-verified/10">Vegan</Badge>}
              {product.pregnancyWarning && <Badge variant="outline">Pregnancy warning</Badge>}
              {product.ageWarning && <Badge variant="outline">Under 18 warning</Badge>}
              {product.drivingWarning && <Badge variant="outline">Driving warning</Badge>}
              {!product.organic && !product.vegetarian && !product.vegan &&
                !product.pregnancyWarning && !product.ageWarning && !product.drivingWarning && (
                  <span className="text-muted-foreground">None set</span>
                )}
            </div>
          </section>

          <section className="rounded-[10px] border bg-card p-5 sm:p-6">
            <h2 className="mb-4 text-base font-semibold">Product image</h2>
            <div className="flex h-72 items-center justify-center overflow-hidden rounded-md bg-muted p-2">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="block max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-muted-foreground">No image yet</span>
              )}
            </div>
            {product.canEdit ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadImageMutation.isPending}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadImageMutation.isPending ? 'Uploading…' : product.imageUrl ? 'Replace image' : 'Upload image'}
                </Button>
                {product.imageUrl && (
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteImageMutation.mutate()}
                    disabled={deleteImageMutation.isPending}
                  >
                    Remove image
                  </Button>
                )}
                <span className="text-sm text-muted-foreground">JPG or PNG, up to 5 MB</span>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">Only the product owner can change its image.</p>
            )}
          </section>
        </div>

        <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-[10px] border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Bottle label</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              100 × 120 mm back label. The QR code opens this product's public passport.
            </p>
            <div className="mt-4 rounded-sm bg-muted p-4">
              <WineLabel
                ref={labelRef}
                product={product}
                qrUrl={dppUrl}
                className="mx-auto h-auto w-full max-w-[320px] shadow-[0_1px_3px_hsl(var(--foreground)/0.15)]"
              />
            </div>
            <div className="mt-4 grid gap-2">
              <Button onClick={() => labelRef.current && downloadSvg(labelRef.current, `${product.name}-label.svg`)}>
                <Download className="mr-2 h-4 w-4" />
                Download label (SVG)
              </Button>
              <Button variant="outline" onClick={downloadQr}>
                <QrCode className="mr-2 h-4 w-4" />
                Download QR code (SVG)
              </Button>
              <Button variant="outline" asChild>
                <a href={dppUrl.replace('?src=qr', '')} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open public passport
                </a>
              </Button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-md bg-muted px-3 py-2">
              <span className="flex-1 truncate text-sm text-muted-foreground">{dppUrl}</span>
              <Button variant="ghost" size="icon" onClick={() => handleCopyLink(dppUrl)} aria-label="Copy passport link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            {(product.externalLink || product.redirectLink) && (
              <dl className="mt-4 space-y-2 text-sm">
                {product.externalLink && (
                  <div>
                    <dt className="text-muted-foreground">External link</dt>
                    <dd className="truncate">{product.externalLink}</dd>
                  </div>
                )}
                {product.redirectLink && (
                  <div>
                    <dt className="text-muted-foreground">Redirects to</dt>
                    <dd className="truncate">{product.redirectLink}</dd>
                  </div>
                )}
              </dl>
            )}
          </section>
        </aside>
      </div>

      <ProductPreviewModal product={product} isOpen={showPreview} onClose={() => setShowPreview(false)} />
      <DeleteConfirmationModal
        product={product}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          deleteProductMutation.mutate(product.id);
          setShowDeleteModal(false);
        }}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
