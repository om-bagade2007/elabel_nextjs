import { useState } from 'react';
import { Eye, Edit, MoreVertical, Copy, Trash2, FileText, QrCode, ExternalLink, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation } from 'wouter';
import type { ProductWithPermissions } from '@shared/schema';

interface ProductsTableProps {
  products: ProductWithPermissions[];
  onEdit?: (product: ProductWithPermissions) => void;
  onDelete?: (product: ProductWithPermissions) => void;
  onDuplicate?: (product: ProductWithPermissions) => void;
  onPreview?: (product: ProductWithPermissions) => void;
}

export default function ProductsTable({
  products,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
}: ProductsTableProps) {
  const [, setLocation] = useLocation();

  const handleViewDetails = (productId: number) => {
    setLocation(`/products/${productId}`);
  };

  const handleDownloadQR = async (product: ProductWithPermissions) => {
    const dppUrl = `${window.location.origin}/qr/product/${product.id}`;
    const qrDownloadUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(dppUrl)}`;
    try {
      const response = await fetch(qrDownloadUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = product.name ? product.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'product';
      link.download = `${safeName}-dpp-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(qrDownloadUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 border-b border-gray-200">
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Image
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Name
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Net Volume
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Vintage
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Type
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Sugar Content
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Appellation
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              SKU
            </TableHead>
            <TableHead className="text-left px-6 py-4 text-sm font-semibold text-gray-900">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-200">
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50 transition-colors">
              <TableCell className="px-6 py-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No Image</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-6 py-4">
                <div className="font-medium text-gray-900">{product.name}</div>
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-600">{product.netVolume || '-'}</TableCell>
              <TableCell className="px-6 py-4 text-gray-600">{product.vintage || '-'}</TableCell>
              <TableCell className="px-6 py-4 text-gray-600">{product.wineType || '-'}</TableCell>
              <TableCell className="px-6 py-4 text-gray-600">
                {product.sugarContent || '-'}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-600">
                {product.appellation || '-'}
              </TableCell>
              <TableCell className="px-6 py-4 text-gray-600">{product.sku || '-'}</TableCell>
              <TableCell className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(product.id)}
                    className="text-primary hover:text-primary/80 p-1"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {product.canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(product)}
                      className="text-gray-600 hover:text-primary p-1"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-primary p-1"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/qr/product/${product.id}`, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2 text-primary" />
                        Public DPP (e-Label)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadQR(product)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </DropdownMenuItem>
                      {product.canEdit && (
                        <>
                          <DropdownMenuItem onClick={() => onEdit?.(product)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete?.(product)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={() => onDuplicate?.(product)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPreview?.(product)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
