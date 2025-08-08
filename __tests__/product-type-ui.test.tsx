import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProductTypeBadge } from '@/components/product-type-badge'
import { ProductTypeFilter } from '@/components/product-type-filter'
import { MatchingInsights } from '@/components/matching-insights'

// Mock the ProductTypeDetector
jest.mock('@/lib/product-type-detector', () => ({
  ProductTypeDetector: {
    getProductTypeName: jest.fn((type: string) => {
      const names: { [key: string]: string } = {
        'sofa': 'Sofa',
        'table': 'Table',
        'chair': 'Chair',
        'lamp': 'Lamp',
        'other': 'Other'
      }
      return names[type] || 'Other'
    }),
    getAllProductTypes: jest.fn(() => [
      { id: 'sofa', name: 'Sofa', keywords: [] },
      { id: 'table', name: 'Table', keywords: [] },
      { id: 'chair', name: 'Chair', keywords: [] },
      { id: 'lamp', name: 'Lamp', keywords: [] }
    ])
  }
}))

describe('ProductTypeBadge', () => {
  it('should render product type name', () => {
    render(<ProductTypeBadge productType="sofa" />)
    expect(screen.getByText('Sofa')).toBeInTheDocument()
  })

  it('should not render for "other" type', () => {
    render(<ProductTypeBadge productType="other" />)
    expect(screen.queryByText('Other')).not.toBeInTheDocument()
  })

  it('should apply compact variant styles', () => {
    render(<ProductTypeBadge productType="table" variant="compact" />)
    const badge = screen.getByText('Table')
    expect(badge).toHaveClass('bg-blue-50', 'text-blue-700')
  })

  it('should apply custom className', () => {
    render(<ProductTypeBadge productType="chair" className="custom-class" />)
    const badge = screen.getByText('Chair')
    expect(badge).toHaveClass('custom-class')
  })
})

describe('ProductTypeFilter', () => {
  const mockOnTypeChange = jest.fn()

  beforeEach(() => {
    mockOnTypeChange.mockClear()
  })

  it('should render filter dropdown', () => {
    render(
      <ProductTypeFilter 
        selectedType={null} 
        onTypeChange={mockOnTypeChange} 
      />
    )
    expect(screen.getByText('Filter by type:')).toBeInTheDocument()
    expect(screen.getByText('All types')).toBeInTheDocument()
  })

  it('should show selected type', () => {
    render(
      <ProductTypeFilter 
        selectedType="sofa" 
        onTypeChange={mockOnTypeChange} 
      />
    )
    expect(screen.getByText('Sofa')).toBeInTheDocument()
  })

  it('should call onTypeChange when selection changes', () => {
    render(
      <ProductTypeFilter 
        selectedType={null} 
        onTypeChange={mockOnTypeChange} 
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    const sofaOption = screen.getByText('Sofa')
    fireEvent.click(sofaOption)
    
    expect(mockOnTypeChange).toHaveBeenCalledWith('sofa')
  })

  it('should call onTypeChange with null when "All types" is selected', () => {
    render(
      <ProductTypeFilter 
        selectedType="sofa" 
        onTypeChange={mockOnTypeChange} 
      />
    )
    
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    const allTypesOption = screen.getByText('All types')
    fireEvent.click(allTypesOption)
    
    expect(mockOnTypeChange).toHaveBeenCalledWith(null)
  })
})

describe('MatchingInsights', () => {
  it('should render matching types', () => {
    const matchingTypes = ['sofa', 'table']
    const typeStats = { 'sofa': 2, 'table': 1 }
    
    render(
      <MatchingInsights 
        matchingTypes={matchingTypes} 
        typeStats={typeStats} 
      />
    )
    
    expect(screen.getByText('Matching Insights')).toBeInTheDocument()
    expect(screen.getByText('You both like: Sofa, Table')).toBeInTheDocument()
    expect(screen.getByText('Sofa: 2')).toBeInTheDocument()
    expect(screen.getByText('Table: 1')).toBeInTheDocument()
  })

  it('should not render when no insights available', () => {
    render(
      <MatchingInsights 
        matchingTypes={[]} 
        typeStats={{}} 
      />
    )
    
    expect(screen.queryByText('Matching Insights')).not.toBeInTheDocument()
  })

  it('should filter out "other" type from stats', () => {
    const matchingTypes = ['sofa']
    const typeStats = { 'sofa': 2, 'other': 5 }
    
    render(
      <MatchingInsights 
        matchingTypes={matchingTypes} 
        typeStats={typeStats} 
      />
    )
    
    expect(screen.getByText('Sofa: 2')).toBeInTheDocument()
    expect(screen.queryByText('Other: 5')).not.toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const matchingTypes = ['sofa']
    const typeStats = { 'sofa': 1 }
    
    render(
      <MatchingInsights 
        matchingTypes={matchingTypes} 
        typeStats={typeStats} 
        className="custom-class"
      />
    )
    
    const container = screen.getByText('Matching Insights').parentElement
    expect(container).toHaveClass('custom-class')
  })
}) 