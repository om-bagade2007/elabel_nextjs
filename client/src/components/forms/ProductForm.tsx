import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { z } from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { operatorTypeOptions, wineTypeOptions } from '@/lib/mock-data';
import type { Product } from '@shared/schema';
import { insertProductSchema } from '@shared/schema';
import { apiFetch, apiRequest } from '@/lib/queryClient';
import { Label } from '../ui/label';
import IngredientPicker from './IngredientPicker';
import {
  MapPin,
  LocateFixed,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { detectAutomaticLocation, searchCoordinatesFromAddress } from '@/lib/geolocation';

const productFormSchema = insertProductSchema;
type ProductFormData = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  product?: Product;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormProps) {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Manufacturing location state
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSearchingCoordinates, setIsSearchingCoordinates] = useState(false);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [locationStatus, setLocationStatus] = useState<{
    type: 'idle' | 'detecting' | 'success' | 'fallback' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    // null -> undefined so optional zod fields accept stored values; unknown keys are stripped
    defaultValues: product
      ? ({
          ...Object.fromEntries(Object.entries(product).map(([k, v]) => [k, v ?? undefined])),
          manufacturingLatitude: product.manufacturingLatitude || product.latitude || undefined,
          manufacturingLongitude: product.manufacturingLongitude || product.longitude || undefined,
          latitude: product.latitude || product.manufacturingLatitude || undefined,
          longitude: product.longitude || product.manufacturingLongitude || undefined,
        } as ProductFormData)
      : {
          name: '',
          organic: false,
          vegetarian: false,
          vegan: false,
          manufacturingLocation: '',
          manufacturingAddress: '',
          manufacturingCity: '',
          manufacturingState: '',
          manufacturingCountry: '',
          manufacturingPostalCode: '',
          manufacturingLatitude: '',
          manufacturingLongitude: '',
          latitude: '',
          longitude: '',
        },
  });

  const handleFetchAutoLocation = async (isManual = false) => {
    setIsDetectingLocation(true);
    setLocationStatus({
      type: 'detecting',
      message: 'Automatically fetching manufacturing location...',
    });

    try {
      const loc = await detectAutomaticLocation();
      if (loc.latitude) {
        form.setValue('latitude', loc.latitude, { shouldDirty: true });
        form.setValue('manufacturingLatitude', loc.latitude, { shouldDirty: true });
      }
      if (loc.longitude) {
        form.setValue('longitude', loc.longitude, { shouldDirty: true });
        form.setValue('manufacturingLongitude', loc.longitude, { shouldDirty: true });
      }
      if (loc.manufacturingAddress) {
        form.setValue('manufacturingAddress', loc.manufacturingAddress, { shouldDirty: true });
      }
      if (loc.manufacturingCity) {
        form.setValue('manufacturingCity', loc.manufacturingCity, { shouldDirty: true });
      }
      if (loc.manufacturingState) {
        form.setValue('manufacturingState', loc.manufacturingState, { shouldDirty: true });
      }
      if (loc.manufacturingCountry) {
        form.setValue('manufacturingCountry', loc.manufacturingCountry, { shouldDirty: true });
      }
      if (loc.manufacturingPostalCode) {
        form.setValue('manufacturingPostalCode', loc.manufacturingPostalCode, { shouldDirty: true });
      }
      if (loc.manufacturingLocation) {
        form.setValue('manufacturingLocation', loc.manufacturingLocation, { shouldDirty: true });
      }

      setLocationStatus({
        type: loc.source === 'gps' ? 'success' : 'fallback',
        message:
          loc.source === 'gps'
            ? 'Manufacturing location automatically fetched via GPS. You can edit or add details manually.'
            : 'Approximate location detected via network. You can modify any details manually below.',
      });
    } catch (err: any) {
      console.warn('Auto location detection failed:', err);
      setLocationStatus({
        type: 'error',
        message:
          'Automatic location detection unavailable. You can enter or search manufacturing details manually.',
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Automatically fetch manufacturing location on initial load when adding a new product
  useEffect(() => {
    if (!product) {
      handleFetchAutoLocation(false);
    }
  }, [product]);

  const handleSearchCoordinates = async () => {
    const query =
      addressSearchQuery.trim() ||
      form.getValues('manufacturingAddress') ||
      form.getValues('manufacturingLocation') ||
      [
        form.getValues('manufacturingCity'),
        form.getValues('manufacturingState'),
        form.getValues('manufacturingCountry'),
      ]
        .filter(Boolean)
        .join(', ');

    if (!query) {
      setLocationStatus({
        type: 'error',
        message: 'Please enter an address, city, or facility name to look up coordinates.',
      });
      return;
    }

    setIsSearchingCoordinates(true);
    try {
      const result = await searchCoordinatesFromAddress(query);
      if (result) {
        form.setValue('latitude', result.latitude, { shouldDirty: true });
        form.setValue('manufacturingLatitude', result.latitude, { shouldDirty: true });
        form.setValue('longitude', result.longitude, { shouldDirty: true });
        form.setValue('manufacturingLongitude', result.longitude, { shouldDirty: true });
        setLocationStatus({
          type: 'success',
          message: `Coordinates found: ${result.latitude}, ${result.longitude}`,
        });
      } else {
        setLocationStatus({
          type: 'error',
          message: 'No coordinates found for this query. You can enter them manually.',
        });
      }
    } catch {
      setLocationStatus({
        type: 'error',
        message: 'Coordinate search failed. Please enter coordinates manually.',
      });
    } finally {
      setIsSearchingCoordinates(false);
    }
  };

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Chateau Margaux" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        This is the name of the product as you have it on your bottle, without the
                        vintage.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Margaux Estate" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Brand, producer or product marketing name.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="netVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Net Volume</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 750ml" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Enter the volume of the liquid in liters.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/*<FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. WIN-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ean"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EAN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 1234567890123" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />*/}
              </div>
            </CardContent>
          </Card>

          {/* Wine Details */}
          <Card>
            <CardHeader>
              <CardTitle>Wine Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vintage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vintage</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2019" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        The year that the wine was produced. Do not fill for non-vintage wines.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="wineType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wine Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select wine type" />
                          </SelectTrigger>
                        </FormControl>
                        <Label className="text-xs text-muted-foreground">
                          Wine classification by vinification process. Sometimes refered as wine
                          'colour'.
                        </Label>
                        <SelectContent>
                          {wineTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sugarContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugar Content</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Dry, Brut" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Sugar content of the wine product, according to EU Regulation No 2019/33,
                        ANNEX III.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="appellation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Appellation</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Bordeaux AOC" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Wine legally defined and protected geographical indication.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alcoholContent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alcohol Content</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 13.5%" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Alcohol on label (% vol.)
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/*<FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. France" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />*/}
              </div>
            </CardContent>
          </Card>

          {/* Ingredients */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
              <CardDescription>
                Tick ingredients in the order they should appear on the label. Allergens are printed in
                bold.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="ingredientIds"
                render={({ field }) => (
                  <FormItem>
                    <IngredientPicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="packagingGases"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging Gases</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">None</option>
                        <option value="may_happen">
                          Bottling may happen in a protective atmosphere
                        </option>
                        <option value="bottled">Bottled in a protective atmosphere</option>
                      </select>
                    </FormControl>
                    <Label className="text-xs text-muted-foreground">
                      Select an option for bottling atmosphere.
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Nutrition Information */}
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="portionSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Portion Size</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 100ml" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Volume of a portion (ml)
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/*<FormField
                  control={form.control}
                  name="kcal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories (kcal)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 85" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />*/}
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="kcal"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Energy (kcal)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="e.g. 85"
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value);
                              form.setValue(
                                'kj',
                                value ? (parseFloat(value) * 4.184).toFixed(2) : '',
                              );
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="kj"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Energy (kJ)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="Auto calculated" readOnly />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fat</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 0g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Fat (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="carbohydrates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carbohydrates</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2.6g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Carbohydrates (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="saturates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saturates</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2.6g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Saturated fat (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sugar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sugar</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2.6g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Sugar (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="protein"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Protein</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2.6g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Protein (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salt</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 2.6g" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">Salt (g)</Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Responsible Consumption */}
          <Card>
            <CardHeader>
              <CardTitle>Responsible Consumption</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="pregnancyWarning"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-6">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Warning against drinking during pregnancy</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Don&apos;t drink during pregnancy and breastfeeding
                          </p>
                        </div>
                      </div>
                      <img src="/pregnancy.svg" alt="Pregnancy warning" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ageWarning"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-6">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Warning against drinking below legal age</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Don&apos;t drink when below legal drinking age
                          </p>
                        </div>
                      </div>
                      <img src="/below18.svg" alt="Age warning" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drivingWarning"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-6">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Warning against drinking when driving</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Don&apos;t drink when driving a car, motorbike or operating machinery
                          </p>
                        </div>
                      </div>
                      <img src="/nocar.svg" alt="Driving warning" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="organic"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Organic</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Certified organic based on EU-Guidelines
                          </p>
                        </div>
                      </div>
                      <img src="/organic.svg" alt="Organic logo" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vegetarian"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Vegetarian</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Certified Vegetarian by V-Label
                          </p>
                        </div>
                      </div>
                      <img src="/veg.svg" alt="Vegetarian logo" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vegan"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-4">
                      <div className="flex items-center space-x-4">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Vegan</FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Certified Vegan by V-Label
                          </p>
                        </div>
                      </div>
                      <img src="/vegan.svg" alt="Vegan logo" className="w-10 h-10" />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Manufacturing Location Details */}
          <Card className="border-verified/30 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50/60 via-slate-50/40 to-transparent border-b border-verified/30/60 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-verified/10 text-verified rounded-lg">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Manufacturing Location Details</CardTitle>
                      <CardDescription className="mt-1">
                        Physical facility and GPS coordinates where this product was produced or bottled.
                      </CardDescription>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleFetchAutoLocation(true)}
                  disabled={isDetectingLocation}
                  className="flex items-center gap-2 border-verified/30 hover:bg-verified/10 text-verified self-start sm:self-auto"
                >
                  {isDetectingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-verified" />
                      <span>Fetching Location...</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-4 h-4 text-verified" />
                      <span>Auto-Fetch Location</span>
                    </>
                  )}
                </Button>
              </div>

              {/* Status Banner */}
              {locationStatus.message && (
                <div
                  className={`mt-4 p-3 rounded-lg flex items-start gap-3 text-sm transition-all ${
                    locationStatus.type === 'success'
                      ? 'bg-verified/10 text-verified border border-verified/30'
                      : locationStatus.type === 'fallback'
                        ? 'bg-primary/5 text-primary border border-primary/20'
                        : locationStatus.type === 'detecting'
                          ? 'bg-muted text-foreground border border-border'
                          : 'bg-muted text-foreground border border-border'
                  }`}
                >
                  {locationStatus.type === 'detecting' ? (
                    <Loader2 className="w-4 h-4 mt-0.5 animate-spin flex-shrink-0 text-verified" />
                  ) : locationStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-verified" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1">
                    <p>{locationStatus.message}</p>
                  </div>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              {/* Address / Estate Coordinate Search Helper */}
              <div className="bg-muted border border-border rounded-lg p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-verified" />
                  <span>Address / Estate Coordinate Search</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={addressSearchQuery}
                    onChange={(e) => setAddressSearchQuery(e.target.value)}
                    placeholder="Search address or estate name to find coordinates (e.g. Bordeaux, France)..."
                    className="bg-white text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearchCoordinates();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleSearchCoordinates}
                    disabled={isSearchingCoordinates}
                    className="whitespace-nowrap"
                  >
                    {isSearchingCoordinates ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Search className="w-4 h-4 mr-1" />
                    )}
                    Find Coordinates
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="manufacturingLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturing Facility / Estate Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. Château Margaux Cellars & Bottling"
                        />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Name or descriptor of the winery, cellar, or packaging plant.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. 12 Route des Châteaux"
                        />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Physical manufacturing address.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Town</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. Margaux-Cantenac"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Region / Province</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. Gironde / Nouvelle-Aquitaine"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. France"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturingPostalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal / ZIP Code</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="e.g. 33460"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Coordinates Section */}
              <div className="rounded-xl border border-border bg-muted/50 p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-white border-border text-foreground/80">
                      GPS Coordinates
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Decimal degrees format (WGS 84)
                    </span>
                  </div>

                  {form.watch('latitude') && form.watch('longitude') && (
                    <div className="flex items-center gap-2 text-xs">
                      <a
                        href={`https://www.google.com/maps?q=${form.watch('latitude')},${form.watch('longitude')}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-verified hover:text-verified font-medium underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Preview on Map
                      </a>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span>Latitude</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            -90.0 to 90.0
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val);
                              form.setValue('manufacturingLatitude', val);
                            }}
                            placeholder="e.g. 45.044167"
                            className="bg-white font-mono text-sm"
                          />
                        </FormControl>
                        <Label className="text-xs text-muted-foreground">
                          Latitude of the manufacturing or production facility.
                        </Label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="longitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span>Longitude</span>
                          <span className="text-xs text-muted-foreground font-normal">
                            -180.0 to 180.0
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val);
                              form.setValue('manufacturingLongitude', val);
                            }}
                            placeholder="e.g. -0.668889"
                            className="bg-white font-mono text-sm"
                          />
                        </FormControl>
                        <Label className="text-xs text-muted-foreground">
                          Longitude of the manufacturing or production facility.
                        </Label>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food Business Operator */}
          <Card>
            <CardHeader>
              <CardTitle>Food Business Operator</CardTitle>
              <CardDescription>
                Operator under whose name or business name the food is marketed or, if that operator
                is not established in the Union, the importer into the Union market.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="operatorType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator type" />
                          </SelectTrigger>
                        </FormControl>
                        <Label className="text-xs text-muted-foreground">
                          Indication of the bottler, producer, importer or vendor.
                        </Label>
                        <SelectContent>
                          {operatorTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="operatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Operator Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. Wine Company Ltd." />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Food business operator name.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="operatorAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Address</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Full business address..."
                        className="h-20"
                      />
                    </FormControl>
                    <Label className="text-xs text-muted-foreground">
                      Food business operator address.
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatorInfo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Operator Information</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional business information..."
                        className="h-20"
                      />
                    </FormControl>
                    <Label className="text-xs text-muted-foreground">
                      Optional indications, like a code, VAT number or additional Impressum
                      information.
                    </Label>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Logistics */}
          <Card>
            <CardHeader>
              <CardTitle>Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Origin</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. France" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Enter the ISO 3166-1 two-letter contry code.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. WIN-001" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Enter your internal Stock Keeping Unit (SKU) text code.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ean"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EAN/GTIN</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 1234567890123" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Enter your European Article Number (EAN) or Global Trade Item Number (GTIN)
                        of your product.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Portability */}
          <Card>
            <CardHeader>
              <CardTitle>Portability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="externalLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>External Link</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" placeholder="https://example.com/product" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Current link already printed in your label from an external URL shortening
                        service, like Bitly, so you can manage all QR Codes in Open E-Label.
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="redirectLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redirect Link</FormLabel>
                      <FormControl>
                        <Input {...field} type="url" placeholder="https://redirect.com/product" />
                      </FormControl>
                      <Label className="text-xs text-muted-foreground">
                        Redirect/forward this label page to a different e-label site (for
                        portability).
                      </Label>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingImage}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            setIsUploadingImage(true);
                            setImageUploadError(null);
                            const formData = new FormData();
                            formData.append('file', file);

                            try {
                              const response = await apiFetch('/api/get-url', {
                                method: 'POST',
                                body: formData,
                              });

                              const data = await response.json().catch(() => ({}));
                              if (!response.ok) {
                                throw new Error(data.error || `Image upload failed (${response.status})`);
                              }
                              if (typeof data.url !== 'string' || !data.url) {
                                throw new Error('Image upload returned no image URL.');
                              }

                              field.onChange(data.url);
                            } catch (error) {
                              console.error('Upload failed:', error);
                              setImageUploadError(
                                error instanceof Error ? error.message : 'Image upload failed. Please try again.',
                              );
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }}
                        />
                      </FormControl>

                      {field.value && (
                        <div className="mt-2">
                          <img
                            src={field.value}
                            alt="Uploaded"
                            className="w-32 h-32 object-cover rounded-md border"
                          />
                        </div>
                      )}
                      {isUploadingImage && (
                        <p className="text-sm text-muted-foreground">Uploading image…</p>
                      )}
                      {imageUploadError && (
                        <p role="alert" className="text-sm text-destructive">
                          {imageUploadError}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>
              {isUploadingImage
                ? 'Uploading image...'
                : isLoading
                  ? 'Saving…'
                  : product
                    ? 'Save changes'
                    : 'Create product'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
