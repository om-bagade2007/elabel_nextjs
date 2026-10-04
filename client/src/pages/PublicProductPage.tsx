import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Product } from '@shared/schema';
import { useEffect, useState } from 'react';
import { useParams } from 'wouter';

const PublicProductPage = () => {
  const params = useParams();
  const id = params?.id ? Number.parseInt(params.id, 10) : Number.NaN;
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      if (!Number.isInteger(id) || id < 1) {
        setLoadError('Product not found');
        return;
      }

      try {
        const res = await apiRequest(`/api/public/products/${id}`);
        if (!cancelled) setProduct(res.data || res);
      } catch {
        if (!cancelled) setLoadError('This product could not be loaded. Please try again later.');
      }
    };

    void fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        {loadError}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg my-10 space-y-8">
      <h1 className="text-3xl font-bold text-center">{product.name}</h1>

      {/* Product Image */}
      <div className="w-full max-w-4xl h-[min(60vh,32rem)] mx-auto bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden p-2">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="block max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-gray-500">No Image Available</span>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-2 gap-4">
        <Info label="Brand" value={product.brand} />
        <Info label="Net Volume" value={product.netVolume} />
        <Info label="Vintage" value={product.vintage} />
        <Info label="Wine Type" value={product.wineType} />
      </div>

      <Separator />

      {/* Nutrition Declaration */}
      <Section title="Nutrition Declaration">
        <div className="grid grid-cols-2 gap-4">
          <Info
            label="Energy"
            value={
              product.kcal
                ? `${product.kcal} kcal${product.kj ? ` / ${product.kj} kJ` : ''}`
                : undefined
            }
          />
          <Info label="Fat" value={product.fat} />
          <Info label="Carbohydrates" value={product.carbohydrates} />
          <Info label="Sugar Content" value={product.sugarContent} />
          <Info label="Alcohol Content" value={product.alcoholContent} />
          <Info label="Portion Size" value={product.portionSize} />
        </div>
      </Section>

      <Separator />

      {/* Certifications */}
      <Section title="Certifications">
        <div className="flex flex-wrap gap-2">
          {product.organic && <Badge variant="secondary">Organic</Badge>}
          {product.vegetarian && <Badge variant="secondary">Vegetarian</Badge>}
          {product.vegan && <Badge variant="secondary">Vegan</Badge>}
          {!product.organic && !product.vegetarian && !product.vegan && (
            <span className="text-gray-500">No certifications specified</span>
          )}
        </div>
      </Section>

      <Separator />

      {/* FBO Details */}
      <Section title="Food Business Operator (FBO) Details">
        <Info label="Operator Type" value={product.operatorType} />
        <Info label="Operator Name" value={product.operatorName} />
        <Info label="Address" value={product.operatorAddress} />
        <Info label="Additional Info" value={product.operatorInfo} />
      </Section>

      <Separator />

      {/* Additional Details */}
      <Section title="Additional Details">
        <div className="grid grid-cols-2 gap-4">
          <Info label="Country of Origin" value={product.countryOfOrigin} />
          <Info label="Appellation" value={product.appellation} />
          <Info label="SKU" value={product.sku} />
          <Info label="EAN" value={product.ean} />
          <Info label="Packaging Gases" value={product.packagingGases} />
        </div>
      </Section>
    </div>
  );
};

const Info = ({ label, value }: { label: string; value?: string | null }) => (
  <div>
    <h4 className="font-medium mb-1">{label}</h4>
    <p className="text-sm text-gray-600">{value || 'Not specified'}</p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    {children}
  </div>
);

export default PublicProductPage;
