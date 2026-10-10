import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@shared/schema';
import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { ExternalLink, ShieldCheck } from 'lucide-react';

export default function PublicProductPage() {
  const params = useParams();
  const id = params?.id ? Number.parseInt(params.id, 10) : Number.NaN;
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      if (!Number.isInteger(id) || id < 1) {
        setLoadError('Invalid product ID');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/public/products/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setLoadError('Product not found');
          } else {
            setLoadError('This product could not be loaded.');
          }
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setProduct(data);
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError('Failed to load product details. Please check your connection.');
          setIsLoading(false);
        }
      }
    };

    void fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-gray-500">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Loading Digital Product Passport...</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Product Not Available</h2>
          <p className="text-sm text-gray-600 mb-6">{loadError || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-10 space-y-6">
        {/* Header / Title */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-sm font-medium text-gray-500 mt-1">{product.brand}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs px-2.5 py-1 font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              e-Label · DPP
            </Badge>
          </div>
        </div>

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
          <div>
            <h3 className="font-semibold mb-2">Brand</h3>
            <p className="text-gray-600">{product.brand || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Net Volume</h3>
            <p className="text-gray-600">{product.netVolume || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vintage</h3>
            <p className="text-gray-600">{product.vintage || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Wine Type</h3>
            <p className="text-gray-600">{product.wineType || 'Not specified'}</p>
          </div>
        </div>

        <Separator />

        {/* Nutrition Declaration */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Nutrition Declaration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Energy</h4>
              <p className="text-sm text-gray-600">
                {product.kcal ? `${product.kcal} kcal` : ''}
                {product.kcal && product.kj ? ' / ' : ''}
                {product.kj ? `${product.kj} kJ` : ''}
                {!product.kcal && !product.kj && 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Fat</h4>
              <p className="text-sm text-gray-600">{product.fat || '0g'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Carbohydrates</h4>
              <p className="text-sm text-gray-600">{product.carbohydrates || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Sugar Content</h4>
              <p className="text-sm text-gray-600">{product.sugarContent || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Alcohol Content</h4>
              <p className="text-sm text-gray-600">
                {product.alcoholContent
                  ? product.alcoholContent.includes('%')
                    ? product.alcoholContent
                    : `${product.alcoholContent}%`
                  : 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Portion Size</h4>
              <p className="text-sm text-gray-600">{product.portionSize || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Certifications */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Certifications</h3>
          <div className="flex flex-wrap gap-2">
            {product.organic && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Organic
              </Badge>
            )}
            {product.vegetarian && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Vegetarian
              </Badge>
            )}
            {product.vegan && (
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                Vegan
              </Badge>
            )}
            {!product.organic && !product.vegetarian && !product.vegan && (
              <span className="text-gray-500">No certifications specified</span>
            )}
          </div>
        </div>

        {/* Responsible Consumption Warnings */}
        {(product.pregnancyWarning || product.ageWarning || product.drivingWarning) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Responsible Consumption</h3>
              <div className="flex flex-wrap items-center gap-6">
                {product.pregnancyWarning && (
                  <div className="flex items-center gap-2.5">
                    <img src="/pregnancy.svg" alt="Pregnancy Warning" className="w-8 h-8" />
                    <span className="text-sm text-gray-600">Not recommended during pregnancy</span>
                  </div>
                )}
                {product.ageWarning && (
                  <div className="flex items-center gap-2.5">
                    <img src="/below18.svg" alt="Age Warning" className="w-8 h-8" />
                    <span className="text-sm text-gray-600">
                      Not for sale to persons under legal age
                    </span>
                  </div>
                )}
                {product.drivingWarning && (
                  <div className="flex items-center gap-2.5">
                    <img src="/nocar.svg" alt="Driving Warning" className="w-8 h-8" />
                    <span className="text-sm text-gray-600">Do not drive after drinking</span>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Food Business Operator Details */}
        {(product.operatorName ||
          product.operatorType ||
          product.operatorAddress ||
          product.operatorInfo) && (
          <>
            <Separator />
            <div>
              <h3 className="text-lg font-semibold mb-4">Food Business Operator (FBO) Details</h3>
              <div className="space-y-2">
                {product.operatorType && (
                  <div>
                    <h4 className="font-medium">Operator Type</h4>
                    <p className="text-sm text-gray-600">{product.operatorType}</p>
                  </div>
                )}
                {product.operatorName && (
                  <div>
                    <h4 className="font-medium">Operator Name</h4>
                    <p className="text-sm text-gray-600">{product.operatorName}</p>
                  </div>
                )}
                {product.operatorAddress && (
                  <div>
                    <h4 className="font-medium">Address</h4>
                    <p className="text-sm text-gray-600">{product.operatorAddress}</p>
                  </div>
                )}
                {product.operatorInfo && (
                  <div>
                    <h4 className="font-medium">Additional Info</h4>
                    <p className="text-sm text-gray-600">{product.operatorInfo}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Manufacturing Location Details */}
        {(product.manufacturingLocation ||
          product.manufacturingAddress ||
          product.manufacturingCity ||
          product.manufacturingCountry ||
          product.latitude ||
          product.manufacturingLatitude) && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h3 className="text-lg font-semibold">Manufacturing Location & Coordinates</h3>
                {(product.latitude || product.manufacturingLatitude) &&
                  (product.longitude || product.manufacturingLongitude) && (
                    <a
                      href={`https://www.google.com/maps?q=${product.latitude || product.manufacturingLatitude},${product.longitude || product.manufacturingLongitude}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open in Google Maps
                    </a>
                  )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {product.manufacturingLocation && (
                  <div>
                    <h4 className="font-medium">Facility / Estate</h4>
                    <p className="text-sm text-gray-600">{product.manufacturingLocation}</p>
                  </div>
                )}
                {product.manufacturingAddress && (
                  <div>
                    <h4 className="font-medium">Address</h4>
                    <p className="text-sm text-gray-600">{product.manufacturingAddress}</p>
                  </div>
                )}
                {product.manufacturingCity && (
                  <div>
                    <h4 className="font-medium">City / State</h4>
                    <p className="text-sm text-gray-600">
                      {[product.manufacturingCity, product.manufacturingState]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  </div>
                )}
                {product.manufacturingCountry && (
                  <div>
                    <h4 className="font-medium">Country / Postal Code</h4>
                    <p className="text-sm text-gray-600">
                      {[product.manufacturingCountry, product.manufacturingPostalCode]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  </div>
                )}
                {(product.latitude || product.manufacturingLatitude) && (
                  <div className="col-span-2">
                    <h4 className="font-medium">GPS Coordinates (Lat, Lon)</h4>
                    <p className="text-sm text-gray-600 font-mono">
                      {product.latitude || product.manufacturingLatitude},{' '}
                      {product.longitude || product.manufacturingLongitude}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Additional Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Additional Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Country of Origin</h4>
              <p className="text-sm text-gray-600">
                {product.countryOfOrigin || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Appellation</h4>
              <p className="text-sm text-gray-600">{product.appellation || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">SKU</h4>
              <p className="text-sm text-gray-600">{product.sku || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">EAN</h4>
              <p className="text-sm text-gray-600">{product.ean || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Packaging Gases</h4>
              <p className="text-sm text-gray-600">{product.packagingGases || 'Not specified'}</p>
            </div>
          </div>
        </div>

        {/* Regulatory Footer */}
        <div className="pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-gray-400">
            Official EU Digital Product Passport (e-Label) · Regulation (EU) 2021/2117 Compliant · No personal data tracked
          </p>
        </div>
      </div>
    </div>
  );
}
