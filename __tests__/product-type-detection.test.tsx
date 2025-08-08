import { ProductTypeDetector, FURNITURE_TYPES } from '@/lib/product-type-detector'

describe('ProductTypeDetector', () => {
  describe('detectProductType', () => {
    it('should detect sofa from title and description', () => {
      const url = 'https://example.com/sofa'
      const title = 'Comfortable Sofa for Living Room'
      const description = 'A beautiful couch that fits perfectly in any space'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('sofa')
    })

    it('should detect table from German keywords', () => {
      const url = 'https://example.com/couchtisch'
      const title = 'Couchtisch im Vintage-Stil aus Mangoholz'
      const description = 'Ein schöner Tisch für das Wohnzimmer'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('table')
    })

    it('should detect chair from multiple keywords', () => {
      const url = 'https://example.com/chair'
      const title = 'Ergonomic Office Chair'
      const description = 'A comfortable stuhl for your workspace'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('chair')
    })

    it('should detect lamp from various lamp types', () => {
      const url = 'https://example.com/lamp'
      const title = 'Modern Table Lamp'
      const description = 'A beautiful tischlampe for your desk'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('lamp')
    })

    it('should return "other" when no keywords match', () => {
      const url = 'https://example.com/decoration'
      const title = 'Wall Decoration'
      const description = 'A beautiful decoration piece'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('other')
    })

    it('should prioritize higher scoring matches', () => {
      const url = 'https://example.com/furniture'
      const title = 'Sofa with Couch'
      const description = 'A sofa that is also a couch'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      // Should detect sofa since it appears multiple times
      expect(result).toBe('sofa')
    })

    it('should handle empty strings gracefully', () => {
      const result = ProductTypeDetector.detectProductType('', '', '')
      expect(result).toBe('other')
    })

    it('should be case insensitive', () => {
      const url = 'https://example.com/SOFA'
      const title = 'COUCH FOR SALE'
      const description = 'A beautiful CANAPÉ'
      
      const result = ProductTypeDetector.detectProductType(url, title, description)
      expect(result).toBe('sofa')
    })
  })

  describe('getProductTypeName', () => {
    it('should return correct name for valid product type', () => {
      expect(ProductTypeDetector.getProductTypeName('sofa')).toBe('Sofa')
      expect(ProductTypeDetector.getProductTypeName('table')).toBe('Table')
      expect(ProductTypeDetector.getProductTypeName('chair')).toBe('Chair')
    })

    it('should return "Other" for unknown product type', () => {
      expect(ProductTypeDetector.getProductTypeName('unknown')).toBe('Other')
    })

    it('should handle case variations', () => {
      expect(ProductTypeDetector.getProductTypeName('SOFA')).toBe('Sofa')
      expect(ProductTypeDetector.getProductTypeName('Sofa')).toBe('Sofa')
    })
  })

  describe('getAllProductTypes', () => {
    it('should return all product types', () => {
      const types = ProductTypeDetector.getAllProductTypes()
      expect(types).toHaveLength(Object.keys(FURNITURE_TYPES).length)
    })

    it('should include all required fields', () => {
      const types = ProductTypeDetector.getAllProductTypes()
      types.forEach(type => {
        expect(type).toHaveProperty('id')
        expect(type).toHaveProperty('name')
        expect(type).toHaveProperty('keywords')
        expect(Array.isArray(type.keywords)).toBe(true)
      })
    })

    it('should include the "other" type', () => {
      const types = ProductTypeDetector.getAllProductTypes()
      const otherType = types.find(type => type.id === 'other')
      expect(otherType).toBeDefined()
      expect(otherType?.name).toBe('Other')
    })
  })

  describe('FURNITURE_TYPES', () => {
    it('should have unique IDs', () => {
      const ids = Object.values(FURNITURE_TYPES).map(type => type.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })

    it('should have non-empty names', () => {
      Object.values(FURNITURE_TYPES).forEach(type => {
        expect(type.name).toBeTruthy()
        expect(typeof type.name).toBe('string')
      })
    })

    it('should have keywords arrays', () => {
      Object.values(FURNITURE_TYPES).forEach(type => {
        expect(Array.isArray(type.keywords)).toBe(true)
      })
    })

    it('should include German keywords for major categories', () => {
      const tableType = FURNITURE_TYPES.TABLE
      expect(tableType.keywords).toContain('tisch')
      expect(tableType.keywords).toContain('couchtisch')
      
      const chairType = FURNITURE_TYPES.CHAIR
      expect(chairType.keywords).toContain('stuhl')
      expect(chairType.keywords).toContain('sessel')
    })
  })
}) 