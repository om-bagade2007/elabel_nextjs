import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Product } from '@shared/schema';
import { ExternalLink } from 'lucide-react';

interface ProductPreviewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductPreviewModal({
  product,
  isOpen,
  onClose,
}: ProductPreviewModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          <div className="w-full max-w-4xl h-[min(60vh,32rem)] mx-auto bg-muted rounded-lg flex items-center justify-center overflow-hidden p-2">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="block max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-muted-foreground">No Image Available</span>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Brand</h3>
              <p className="text-muted-foreground">{product.brand || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Net Volume</h3>
              <p className="text-muted-foreground">{product.netVolume || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Vintage</h3>
              <p className="text-muted-foreground">{product.vintage || 'Not specified'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Wine Type</h3>
              <p className="text-muted-foreground">{product.wineType || 'Not specified'}</p>
            </div>
          </div>

          <Separator />

          {/* Nutrition Declaration */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Nutrition Declaration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Energy</h4>
                <p className="text-sm text-muted-foreground">
                  {product.kcal ? `${product.kcal} kcal` : ''}
                  {product.kcal && product.kj ? ' / ' : ''}
                  {product.kj ? `${product.kj} kJ` : ''}
                  {!product.kcal && !product.kj && 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Fat</h4>
                <p className="text-sm text-muted-foreground">{product.fat || '0g'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Carbohydrates</h4>
                <p className="text-sm text-muted-foreground">{product.carbohydrates || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Sugar Content</h4>
                <p className="text-sm text-muted-foreground">{product.sugarContent || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Alcohol Content</h4>
                <p className="text-sm text-muted-foreground">
                  {product.alcoholContent
                    ? product.alcoholContent.includes('%')
                      ? product.alcoholContent
                      : `${product.alcoholContent}%`
                    : 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Portion Size</h4>
                <p className="text-sm text-muted-foreground">{product.portionSize || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Certifications */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {product.organic && (
                <Badge variant="secondary" className="bg-verified/10 text-verified border-verified/30">
                  Organic
                </Badge>
              )}
              {product.vegetarian && (
                <Badge variant="secondary" className="bg-verified/10 text-verified border-verified/30">
                  Vegetarian
                </Badge>
              )}
              {product.vegan && (
                <Badge variant="secondary" className="bg-verified/10 text-verified border-verified/30">
                  Vegan
                </Badge>
              )}
              {!product.organic && !product.vegetarian && !product.vegan && (
                <span className="text-muted-foreground">No certifications specified</span>
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
                      <span className="text-sm text-muted-foreground">
                        Not recommended during pregnancy
                      </span>
                    </div>
                  )}
                  {product.ageWarning && (
                    <div className="flex items-center gap-2.5">
                      <img src="/below18.svg" alt="Age Warning" className="w-8 h-8" />
                      <span className="text-sm text-muted-foreground">
                        Not for sale to persons under legal age
                      </span>
                    </div>
                  )}
                  {product.drivingWarning && (
                    <div className="flex items-center gap-2.5">
                      <img src="/nocar.svg" alt="Driving Warning" className="w-8 h-8" />
                      <span className="text-sm text-muted-foreground">Do not drive after drinking</span>
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
                      <p className="text-sm text-muted-foreground">{product.operatorType}</p>
                    </div>
                  )}
                  {product.operatorName && (
                    <div>
                      <h4 className="font-medium">Operator Name</h4>
                      <p className="text-sm text-muted-foreground">{product.operatorName}</p>
                    </div>
                  )}
                  {product.operatorAddress && (
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-sm text-muted-foreground">{product.operatorAddress}</p>
                    </div>
                  )}
                  {product.operatorInfo && (
                    <div>
                      <h4 className="font-medium">Additional Info</h4>
                      <p className="text-sm text-muted-foreground">{product.operatorInfo}</p>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-verified bg-verified/10 hover:bg-verified/10 rounded-md border border-verified/30 transition-colors"
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
                      <p className="text-sm text-muted-foreground">{product.manufacturingLocation}</p>
                    </div>
                  )}
                  {product.manufacturingAddress && (
                    <div>
                      <h4 className="font-medium">Address</h4>
                      <p className="text-sm text-muted-foreground">{product.manufacturingAddress}</p>
                    </div>
                  )}
                  {product.manufacturingCity && (
                    <div>
                      <h4 className="font-medium">City / State</h4>
                      <p className="text-sm text-muted-foreground">
                        {[product.manufacturingCity, product.manufacturingState]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                  {product.manufacturingCountry && (
                    <div>
                      <h4 className="font-medium">Country / Postal Code</h4>
                      <p className="text-sm text-muted-foreground">
                        {[product.manufacturingCountry, product.manufacturingPostalCode]
                          .filter(Boolean)
                          .join(' ')}
                      </p>
                    </div>
                  )}
                  {(product.latitude || product.manufacturingLatitude) && (
                    <div className="col-span-2">
                      <h4 className="font-medium">GPS Coordinates (Lat, Lon)</h4>
                      <p className="text-sm text-muted-foreground font-mono">
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
                <p className="text-sm text-muted-foreground">
                  {product.countryOfOrigin || 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Appellation</h4>
                <p className="text-sm text-muted-foreground">{product.appellation || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">SKU</h4>
                <p className="text-sm text-muted-foreground">{product.sku || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">EAN</h4>
                <p className="text-sm text-muted-foreground">{product.ean || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Packaging Gases</h4>
                <p className="text-sm text-muted-foreground">{product.packagingGases || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
