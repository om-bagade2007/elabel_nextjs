import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
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
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: product
      ? {
          name: product.name,
          brand: product.brand || undefined,
          netVolume: product.netVolume || undefined,
          vintage: product.vintage || undefined,
          wineType: product.wineType || undefined,
          sugarContent: product.sugarContent || undefined,
          appellation: product.appellation || undefined,
          alcoholContent: product.alcoholContent || undefined,
          countryOfOrigin: product.countryOfOrigin || undefined,
          sku: product.sku || undefined,
          ean: product.ean || undefined,
          packagingGases: product.packagingGases || undefined,
          portionSize: product.portionSize || undefined,
          kcal: product.kcal || undefined,
          kj: product.kj || undefined,
          fat: product.fat || undefined,
          carbohydrates: product.carbohydrates || undefined,
          organic: product.organic || false,
          vegetarian: product.vegetarian || false,
          vegan: product.vegan || false,
          operatorType: product.operatorType || undefined,
          operatorName: product.operatorName || undefined,
          operatorAddress: product.operatorAddress || undefined,
          operatorInfo: product.operatorInfo || undefined,
          externalLink: product.externalLink || undefined,
          redirectLink: product.redirectLink || undefined,
          createdBy: product.createdBy || undefined,
        }
      : {
          name: '',
          organic: false,
          vegetarian: false,
          vegan: false,
        },
  });

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

          {/* Packaging */}
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                  ? 'Creating...'
                  : product
                    ? 'Update Product'
                    : 'Create Product'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
