import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductTypeDetector } from "@/lib/product-type-detector"

interface ProductTypeFilterProps {
  selectedType: string | null;
  onTypeChange: (type: string | null) => void;
  className?: string;
}

export function ProductTypeFilter({ 
  selectedType, 
  onTypeChange, 
  className = "" 
}: ProductTypeFilterProps) {
  const productTypes = ProductTypeDetector.getAllProductTypes()
    .filter(type => type.id !== 'other') // Don't show "Other" as a filter option

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Filter by type:</label>
      <Select 
        value={selectedType || "all"} 
        onValueChange={(value) => onTypeChange(value === "all" ? null : value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {productTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 