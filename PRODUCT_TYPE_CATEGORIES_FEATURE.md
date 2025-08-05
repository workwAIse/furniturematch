# Product Type Categories Feature

## 📋 Overview

Add product type categorization to the furniture matching app to enable filtering, better matching insights, and improved user experience. Products will be automatically categorized into types like "sofa", "table", "chair", "lamp", etc.

## 🎯 Goals

- **Automatic Categorization**: Detect product types from URLs, titles, and descriptions
- **Enhanced Filtering**: Allow users to filter products by type
- **Better Insights**: Show matching statistics by product type
- **Improved UX**: Display product type badges on cards
- **Type-based Matching**: Provide insights like "You both like tables and lamps"

## 🔍 Current State Analysis

### Example Product
- **URL**: `https://www.maisonsdumonde.com/DE/de/p/couchtisch-im-vintage-stil-aus-mangoholz-l108-janeiro-155738.htm`
- **Title**: "Couchtisch im Vintage-Stil aus Mangoholz L108 Janeiro"
- **Current**: No categorization
- **Target**: Automatically detect as "table" type

## 🏗️ Implementation Plan

### Phase 1: Foundation & Database Schema

#### 1.1 Product Type Definitions
```typescript
const FURNITURE_TYPES = {
  SOFA: {
    id: 'sofa',
    name: 'Sofa',
    keywords: ['sofa', 'couch', 'sofa', 'canapé', 'sofa bed', 'sofabett']
  },
  TABLE: {
    id: 'table', 
    name: 'Table',
    keywords: ['table', 'tisch', 'coffee table', 'couchtisch', 'dining table', 'esstisch', 'side table', 'beistelltisch']
  },
  CHAIR: {
    id: 'chair',
    name: 'Chair', 
    keywords: ['chair', 'stuhl', 'armchair', 'sessel', 'dining chair', 'esstuhl']
  },
  BED: {
    id: 'bed',
    name: 'Bed',
    keywords: ['bed', 'bett', 'bed frame', 'bettgestell', 'mattress', 'matratze']
  },
  LAMP: {
    id: 'lamp',
    name: 'Lamp',
    keywords: ['lamp', 'lampe', 'ceiling lamp', 'deckenlampe', 'table lamp', 'tischlampe', 'floor lamp', 'stehlampe']
  },
  SHELF: {
    id: 'shelf',
    name: 'Shelf',
    keywords: ['shelf', 'regal', 'bookshelf', 'bücherregal', 'wall shelf', 'wandregal']
  },
  CABINET: {
    id: 'cabinet',
    name: 'Cabinet',
    keywords: ['cabinet', 'schrank', 'wardrobe', 'kleiderschrank', 'dresser', 'kommode']
  },
  DESK: {
    id: 'desk',
    name: 'Desk',
    keywords: ['desk', 'schreibtisch', 'writing desk', 'computer desk']
  },
  MIRROR: {
    id: 'mirror',
    name: 'Mirror',
    keywords: ['mirror', 'spiegel', 'wall mirror', 'wandspiegel']
  },
  RUG: {
    id: 'rug',
    name: 'Rug',
    keywords: ['rug', 'teppich', 'carpet', 'area rug']
  }
}
```

#### 1.2 Database Schema Updates
```sql
-- Add product_type to products table
ALTER TABLE products ADD COLUMN product_type VARCHAR(50) DEFAULT 'other';

-- Create product_types table for reference
CREATE TABLE product_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  keywords TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert predefined product types
INSERT INTO product_types (id, name, keywords) VALUES
('sofa', 'Sofa', ARRAY['sofa', 'couch', 'canapé', 'sofa bed', 'sofabett']),
('table', 'Table', ARRAY['table', 'tisch', 'coffee table', 'couchtisch', 'dining table', 'esstisch']),
('chair', 'Chair', ARRAY['chair', 'stuhl', 'armchair', 'sessel', 'dining chair', 'esstuhl']),
('bed', 'Bed', ARRAY['bed', 'bett', 'bed frame', 'bettgestell', 'mattress', 'matratze']),
('lamp', 'Lamp', ARRAY['lamp', 'lampe', 'ceiling lamp', 'deckenlampe', 'table lamp', 'tischlampe']),
('shelf', 'Shelf', ARRAY['shelf', 'regal', 'bookshelf', 'bücherregal', 'wall shelf', 'wandregal']),
('cabinet', 'Cabinet', ARRAY['cabinet', 'schrank', 'wardrobe', 'kleiderschrank', 'dresser', 'kommode']),
('desk', 'Desk', ARRAY['desk', 'schreibtisch', 'writing desk', 'computer desk']),
('mirror', 'Mirror', ARRAY['mirror', 'spiegel', 'wall mirror', 'wandspiegel']),
('rug', 'Rug', ARRAY['rug', 'teppich', 'carpet', 'area rug']),
('other', 'Other', ARRAY[]);
```

### Phase 2: Detection Logic Implementation

#### 2.1 Product Type Detection Service
```typescript
// lib/product-type-detector.ts
export class ProductTypeDetector {
  private static FURNITURE_TYPES = { /* ... */ };
  
  static detectProductType(url: string, title: string, description: string): string {
    const content = `${url} ${title} ${description}`.toLowerCase();
    
    // Score each product type based on keyword matches
    const typeScores = Object.entries(this.FURNITURE_TYPES).map(([id, type]) => {
      const score = type.keywords.reduce((total, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        return total + matches;
      }, 0);
      return { id, score };
    });
    
    // Return type with highest score (if above threshold)
    const bestMatch = typeScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestMatch.score > 0 ? bestMatch.id : 'other';
  }
}
```

#### 2.2 Integration with Product Extraction
```typescript
// Update extractProductInfo function in app/page.tsx
async function extractProductInfo(url: string): Promise<Partial<Product>> {
  // Existing extraction logic...
  const productInfo = await extractProductInfoFromUrl(url);
  
  // Add product type detection
  const productType = ProductTypeDetector.detectProductType(
    url, 
    productInfo.title, 
    productInfo.description
  );
  
  return {
    ...productInfo,
    product_type: productType
  };
}
```

### Phase 3: UI/UX Implementation

#### 3.1 Product Type Filtering
```typescript
// Add to main page state
const [selectedProductType, setSelectedProductType] = useState<string | null>(null);

// Filter functions
const getFilteredProducts = () => {
  if (!selectedProductType) return products;
  return products.filter(product => product.product_type === selectedProductType);
};

const getFilteredMatches = () => {
  const matches = getMatchedProducts();
  if (!selectedProductType) return matches;
  return matches.filter(product => product.product_type === selectedProductType);
};
```

#### 3.2 Product Type Badges
```typescript
// components/product-type-badge.tsx
interface ProductTypeBadgeProps {
  productType: string;
  variant?: 'default' | 'compact';
}

export function ProductTypeBadge({ productType, variant = 'default' }: ProductTypeBadgeProps) {
  const typeInfo = FURNITURE_TYPES[productType];
  
  if (!typeInfo) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`text-xs ${
        variant === 'compact' 
          ? 'bg-blue-50 text-blue-700' 
          : 'bg-blue-100 text-blue-800'
      }`}
    >
      {typeInfo.name}
    </Badge>
  );
}
```

#### 3.3 Product Type Statistics
```typescript
// Add to main page
const getProductTypeStats = () => {
  const stats: Record<string, number> = {};
  const matches = getMatchedProducts();
  
  matches.forEach(product => {
    stats[product.product_type] = (stats[product.product_type] || 0) + 1;
  });
  
  return stats;
};

const getMatchingProductTypes = () => {
  const user1Types = getYourProducts().map(p => p.product_type);
  const user2Types = getPartnerProducts().map(p => p.product_type);
  return user1Types.filter(type => user2Types.includes(type));
};
```

### Phase 4: Advanced Features

#### 4.1 Product Type Preferences
```typescript
interface UserPreferences {
  preferredProductTypes: string[];
  productTypeWeights: Record<string, number>;
}

// Allow users to set preferences for specific product types
const ProductTypePreferences = () => {
  // Implementation for user preference settings
};
```

#### 4.2 Type-Based Matching Insights
```typescript
// Show insights like "You both like tables and lamps"
const MatchingInsights = () => {
  const matchingTypes = getMatchingProductTypes();
  const typeStats = getProductTypeStats();
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Matching Insights</h3>
      {matchingTypes.length > 0 && (
        <p className="text-xs text-gray-600">
          You both like: {matchingTypes.map(type => 
            FURNITURE_TYPES[type]?.name
          ).join(', ')}
        </p>
      )}
      <div className="flex gap-1 flex-wrap">
        {Object.entries(typeStats).map(([type, count]) => (
          <Badge key={type} variant="outline" className="text-xs">
            {FURNITURE_TYPES[type]?.name}: {count}
          </Badge>
        ))}
      </div>
    </div>
  );
};
```

## 📋 Implementation Tasks

### Task 1: Database Schema Setup
- [ ] Create database migration for product_type column
- [ ] Create product_types table
- [ ] Insert predefined product types
- [ ] Update Product interface in TypeScript

**Estimated Time**: 1-2 hours

### Task 2: Product Type Detection Logic
- [ ] Create ProductTypeDetector class
- [ ] Implement keyword-based detection algorithm
- [ ] Add confidence scoring
- [ ] Create unit tests for detection logic

**Estimated Time**: 2-3 hours

### Task 3: Integration with Product Extraction
- [ ] Update extractProductInfo function
- [ ] Modify addProduct function to include product_type
- [ ] Update database service to handle product_type
- [ ] Test with real product URLs

**Estimated Time**: 1-2 hours

### Task 4: UI Components
- [ ] Create ProductTypeBadge component
- [ ] Add product type filtering to main page
- [ ] Update product cards to show type badges
- [ ] Create product type filter dropdown

**Estimated Time**: 2-3 hours

### Task 5: Statistics and Insights
- [ ] Implement product type statistics
- [ ] Create matching insights component
- [ ] Add type-based filtering to all views
- [ ] Update matches view with type information

**Estimated Time**: 2-3 hours

### Task 6: Testing and Polish
- [ ] Test with various product URLs
- [ ] Validate detection accuracy
- [ ] Add error handling for edge cases
- [ ] Performance optimization
- [ ] Update documentation

**Estimated Time**: 2-3 hours

## 🎯 Success Metrics

### Functional Metrics
- [ ] 90%+ accuracy in product type detection
- [ ] All product cards display type badges
- [ ] Filtering works across all views
- [ ] No performance degradation

### User Experience Metrics
- [ ] Users can easily filter by product type
- [ ] Type badges are visually appealing
- [ ] Insights provide valuable information
- [ ] Interface remains clean and uncluttered

## 🚨 Potential Challenges

### Technical Challenges
1. **Detection Accuracy**: Some products might be miscategorized
2. **Language Support**: Need German keywords for German retailers
3. **Edge Cases**: Products that fit multiple categories
4. **Performance**: Category detection adds processing time

### Mitigation Strategies
1. **Confidence Scoring**: Only assign types above certain threshold
2. **Manual Override**: Allow users to correct types
3. **Machine Learning**: Train models on categorized data
4. **Caching**: Cache detection results

## 🔄 Future Enhancements

### Phase 2 Features
- [ ] Product type preferences for users
- [ ] Type-based matching algorithms
- [ ] Advanced filtering (multiple types, exclusions)
- [ ] Type-based recommendations

### Phase 3 Features
- [ ] Machine learning for better detection
- [ ] User feedback for improving accuracy
- [ ] Custom product type definitions
- [ ] Type-based analytics and insights

## 📝 Notes

- Product types should be language-agnostic (support both German and English)
- Detection should be fast and not impact product loading time
- UI should gracefully handle products without detected types
- Consider adding a "suggest type" feature for users
- Plan for easy addition of new product types in the future 