import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductTypeEditor } from '@/components/product-type-editor'

// Mock the DatabaseService
jest.mock('@/lib/database', () => ({
  DatabaseService: {
    updateProductType: jest.fn().mockResolvedValue({
      id: '1',
      product_type: 'table',
      title: 'Test Product'
    })
  }
}))

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
      { id: 'lamp', name: 'Lamp', keywords: [] },
      { id: 'other', name: 'Other', keywords: [] }
    ])
  }
}))

describe('ProductTypeEditor', () => {
  const mockOnTypeChange = jest.fn()

  beforeEach(() => {
    mockOnTypeChange.mockClear()
  })

  it('should render current product type with edit button', () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    expect(screen.getByText('Sofa')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should show dropdown when edit button is clicked', () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    expect(screen.getByText('Sofa')).toBeInTheDocument()
    expect(screen.getByText('Table')).toBeInTheDocument()
    expect(screen.getByText('Chair')).toBeInTheDocument()
  })

  it('should show save and cancel buttons when editing', () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    // Look for save and cancel buttons
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(3) // edit, save, cancel
  })

  it('should call onTypeChange when save is clicked', async () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    // Click edit button
    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    // Select a different type
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    const tableOption = screen.getByText('Table')
    fireEvent.click(tableOption)

    // Click save button
    const saveButton = screen.getAllByRole('button')[1] // save button
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnTypeChange).toHaveBeenCalledWith('table')
    })
  })

  it('should not call onTypeChange when cancel is clicked', () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    // Click edit button
    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    // Click cancel button
    const cancelButton = screen.getAllByRole('button')[2] // cancel button
    fireEvent.click(cancelButton)

    expect(mockOnTypeChange).not.toHaveBeenCalled()
  })

  it('should not call onTypeChange when same type is selected', async () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    // Click edit button
    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    // Click save button without changing type
    const saveButton = screen.getAllByRole('button')[1] // save button
    fireEvent.click(saveButton)

    expect(mockOnTypeChange).not.toHaveBeenCalled()
  })

  it('should show loading state when saving', async () => {
    render(
      <ProductTypeEditor
        productId="1"
        currentType="sofa"
        onTypeChange={mockOnTypeChange}
      />
    )

    // Click edit button
    const editButton = screen.getByRole('button')
    fireEvent.click(editButton)

    // Select a different type
    const select = screen.getByRole('combobox')
    fireEvent.click(select)
    
    const tableOption = screen.getByText('Table')
    fireEvent.click(tableOption)

    // Click save button
    const saveButton = screen.getAllByRole('button')[1] // save button
    fireEvent.click(saveButton)

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByRole('button', { name: '' })).toBeDisabled()
    })
  })
}) 