export interface FurnitureType {
  id: string;
  name: string;
  keywords: string[];
}

export const FURNITURE_TYPES: Record<string, FurnitureType> = {
  SOFA: {
    id: 'sofa',
    name: 'Sofa',
    keywords: ['sofa', 'couch', 'canapé', 'sofa bed', 'sofabett', 'settee', 'divan']
  },
  TABLE: {
    id: 'table', 
    name: 'Table',
    keywords: ['table', 'tisch', 'coffee table', 'couchtisch', 'dining table', 'esstisch', 'side table', 'beistelltisch', 'end table', 'console table']
  },
  CHAIR: {
    id: 'chair',
    name: 'Chair', 
    keywords: ['chair', 'stuhl', 'armchair', 'sessel', 'dining chair', 'esstuhl', 'office chair', 'recliner', 'rocking chair']
  },
  BED: {
    id: 'bed',
    name: 'Bed',
    keywords: ['bed', 'bett', 'bed frame', 'bettgestell', 'mattress', 'matratze', 'platform bed', 'daybed']
  },
  LAMP: {
    id: 'lamp',
    name: 'Lamp',
    keywords: ['lamp', 'lampe', 'ceiling lamp', 'deckenlampe', 'table lamp', 'tischlampe', 'floor lamp', 'stehlampe', 'pendant lamp', 'wall lamp']
  },
  SHELF: {
    id: 'shelf',
    name: 'Shelf',
    keywords: ['shelf', 'regal', 'bookshelf', 'bücherregal', 'wall shelf', 'wandregal', 'floating shelf', 'corner shelf']
  },
  CABINET: {
    id: 'cabinet',
    name: 'Cabinet',
    keywords: ['cabinet', 'schrank', 'kitchen cabinet', 'bathroom cabinet', 'curio cabinet', 'display cabinet']
  },
  DESK: {
    id: 'desk',
    name: 'Desk',
    keywords: ['desk', 'schreibtisch', 'writing desk', 'computer desk', 'office desk', 'study desk']
  },
  MIRROR: {
    id: 'mirror',
    name: 'Mirror',
    keywords: ['mirror', 'spiegel', 'wall mirror', 'wandspiegel', 'floor mirror', 'dressing mirror']
  },
  RUG: {
    id: 'rug',
    name: 'Rug',
    keywords: ['rug', 'teppich', 'carpet', 'area rug', 'runner', 'doormat']
  },
  OTTOMAN: {
    id: 'ottoman',
    name: 'Ottoman',
    keywords: ['ottoman', 'footstool', 'pouf', 'hassock', 'footrest', 'hocker']
  },
  BENCH: {
    id: 'bench',
    name: 'Bench',
    keywords: ['bench', 'bank', 'sitzbank', 'garden bench', 'entry bench', 'storage bench']
  },
  STOOL: {
    id: 'stool',
    name: 'Stool',
    keywords: ['stool', 'bar stool', 'hocker', 'tabouret', 'kitchen stool', 'counter stool']
  },
  NIGHTSTAND: {
    id: 'nightstand',
    name: 'Nightstand',
    keywords: ['nightstand', 'bedside table', 'nachttisch', 'bedside cabinet', 'bedside drawer']
  },
  DRESSER: {
    id: 'dresser',
    name: 'Dresser',
    keywords: ['dresser', 'chest of drawers', 'kommode', 'commode', 'chest', 'drawer unit']
  },
  WARDROBE: {
    id: 'wardrobe',
    name: 'Wardrobe',
    keywords: ['wardrobe', 'armoire', 'kleiderschrank', 'garderobe', 'closet', 'clothes cabinet']
  },
  BOOKCASE: {
    id: 'bookcase',
    name: 'Bookcase',
    keywords: ['bookcase', 'bookshelf', 'bücherregal', 'library', 'book storage', 'display case']
  },
  TV_STAND: {
    id: 'tv_stand',
    name: 'TV Stand',
    keywords: ['tv stand', 'tv unit', 'fernsehschrank', 'entertainment center', 'media console', 'tv cabinet']
  },
  SIDEBOARD: {
    id: 'sideboard',
    name: 'Sideboard',
    keywords: ['sideboard', 'buffet', 'anrichte', 'credenza', 'server', 'dining storage']
  },
  PLANT_STAND: {
    id: 'plant_stand',
    name: 'Plant Stand',
    keywords: ['plant stand', 'flower stand', 'pflanzenständer', 'plant holder', 'flower pot stand']
  },
  COAT_RACK: {
    id: 'coat_rack',
    name: 'Coat Rack',
    keywords: ['coat rack', 'coat stand', 'garderobe', 'hall tree', 'hat stand', 'coat hanger']
  },
  WINE_RACK: {
    id: 'wine_rack',
    name: 'Wine Rack',
    keywords: ['wine rack', 'weinregal', 'wine storage', 'wine holder', 'bottle rack']
  },
  UMBRELLA_STAND: {
    id: 'umbrella_stand',
    name: 'Umbrella Stand',
    keywords: ['umbrella stand', 'schirmständer', 'umbrella holder', 'parasol stand']
  },
  MAGAZINE_RACK: {
    id: 'magazine_rack',
    name: 'Magazine Rack',
    keywords: ['magazine rack', 'zeitschriftenhalter', 'newspaper holder', 'magazine holder']
  },
  SHOE_RACK: {
    id: 'shoe_rack',
    name: 'Shoe Rack',
    keywords: ['shoe rack', 'schuhregal', 'shoe storage', 'shoe organizer', 'boot rack']
  },
  OTHER: {
    id: 'other',
    name: 'Other',
    keywords: []
  }
};

export class ProductTypeDetector {
  static detectProductType(url: string, title: string, description: string): string {
    const content = `${url} ${title} ${description}`.toLowerCase();
    
    // Score each product type based on keyword matches
    const typeScores = Object.values(FURNITURE_TYPES).map((type) => {
      const score = type.keywords.reduce((total, keyword) => {
        const matches = (content.match(new RegExp(keyword, 'gi')) || []).length;
        return total + matches;
      }, 0);
      return { id: type.id, score };
    });
    
    // Return type with highest score (if above threshold)
    const bestMatch = typeScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return bestMatch.score > 0 ? bestMatch.id : 'other';
  }

  static getProductTypeName(productType: string): string {
    if (!productType) return 'Other';
    return FURNITURE_TYPES[productType.toUpperCase()]?.name || 'Other';
  }

  static getAllProductTypes(): FurnitureType[] {
    return Object.values(FURNITURE_TYPES);
  }
} 