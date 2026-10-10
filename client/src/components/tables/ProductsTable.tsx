import { Eye, Edit, MoreVertical, Copy, Trash2, FileText, ExternalLink, Download } from 'lucide-react';
import { downloadQrPng, useDppBase } from '@/components/label/WineLabel';
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
  const dppBase = useDppBase();
  const fileSafe = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  const handleViewDetails = (productId: number) => {
    setLocation(`/products/${productId}`);
  };

  return (
    <div className="overflow-x-auto rounded-[10px] border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className="w-16 px-4 py-3">
              <span className="sr-only">Image</span>
            </TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground">Name</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Volume</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden sm:table-cell">Vintage</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden md:table-cell">Type</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden lg:table-cell">Sugar</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden lg:table-cell">Appellation</TableHead>
            <TableHead className="px-4 py-3 font-semibold text-foreground hidden xl:table-cell">SKU</TableHead>
            <TableHead className="w-12 px-4 py-3">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="px-4 py-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {product.imageUrl && (
                    <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4 py-3">
                <button
                  onClick={() => handleViewDetails(product.id)}
                  className="text-left font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary"
                >
                  {product.name}
                </button>
                {product.brand && <div className="text-sm text-muted-foreground">{product.brand}</div>}
              </TableCell>
              <TableCell className="hidden sm:table-cell px-4 py-3 text-muted-foreground">{product.netVolume || '–'}</TableCell>
              <TableCell className="hidden sm:table-cell px-4 py-3 text-muted-foreground">{product.vintage || '–'}</TableCell>
              <TableCell className="hidden md:table-cell px-4 py-3 text-muted-foreground">{product.wineType || '–'}</TableCell>
              <TableCell className="hidden lg:table-cell px-4 py-3 text-muted-foreground">{product.sugarContent || '–'}</TableCell>
              <TableCell className="hidden lg:table-cell px-4 py-3 text-muted-foreground">{product.appellation || '–'}</TableCell>
              <TableCell className="hidden xl:table-cell px-4 py-3 text-muted-foreground">{product.sku || '–'}</TableCell>
              <TableCell className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${product.name}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => handleViewDetails(product.id)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Details and label
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onPreview?.(product)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(`/qr/product/${product.id}`, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Public passport
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        downloadQrPng(`${dppBase}/qr/product/${product.id}?src=qr`, `${fileSafe(product.name)}-dpp-qr.png`)
                      }
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download QR code (PNG)
                    </DropdownMenuItem>
                    {product.canEdit && (
                      <DropdownMenuItem onClick={() => onEdit?.(product)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDuplicate?.(product)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicate
                    </DropdownMenuItem>
                    {product.canEdit && (
                      <DropdownMenuItem
                        onClick={() => onDelete?.(product)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
