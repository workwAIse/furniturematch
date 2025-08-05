import { Badge } from "@/components/ui/badge"
import { ProductTypeDetector } from "@/lib/product-type-detector"

interface ProductTypeBadgeProps {
  productType: string;
  variant?: 'default' | 'compact';
  className?: string;
}

export function ProductTypeBadge({ 
  productType, 
  variant = 'default',
  className = ""
}: ProductTypeBadgeProps) {
  const typeName = ProductTypeDetector.getProductTypeName(productType);
  
  if (!typeName || typeName === 'Other') return null;
  
  const baseClasses = "text-xs font-medium";
  const variantClasses = variant === 'compact' 
    ? "bg-blue-50 text-blue-700 border-blue-200" 
    : "bg-blue-100 text-blue-800 border-blue-300";
  
  return (
    <Badge 
      variant="outline" 
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {typeName}
    </Badge>
  );
} 