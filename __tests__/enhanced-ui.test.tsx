import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { EnhancedProductCard } from '@/components/enhanced-product-card'
import { ProductComments } from '@/components/product-comments'

// Mock the database service
jest.mock('@/lib/database', () => ({
  DatabaseService: {
    getComments: jest.fn().mockResolvedValue([]),
    addComment: jest.fn().mockResolvedValue({ id: '1', content: 'Test comment', user_id: 'user1', created_at: new Date().toISOString() }),
    updateComment: jest.fn().mockResolvedValue({ id: '1', content: 'Updated comment', user_id: 'user1', created_at: new Date().toISOString() }),
    deleteComment: jest.fn().mockResolvedValue(true),
  }
}))

const mockProduct = {
  id: '1',
  title: 'Test Furniture Item',
  description: 'A beautiful test furniture item for testing purposes',
  price: '299.99 €',
  image: '/test-image.jpg',
  url: 'https://example.com/test-item',
  uploaded_by: 'user1',
  retailer: 'Test Store',
  swipes: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

describe('EnhancedProductCard', () => {
  const mockOnViewProduct = jest.fn()
  const mockOnDelete = jest.fn()
  const mockOnSwipe = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders product information correctly', () => {
    render(
      <EnhancedProductCard
        product={mockProduct}
        currentUserId="user1"
        onViewProduct={mockOnViewProduct}
        variant="compact"
      />
    )

    expect(screen.getByText('Test Furniture Item')).toBeInTheDocument()
    expect(screen.getByText('A beautiful test furniture item for testing purposes')).toBeInTheDocument()
    expect(screen.getByText('299.99 €')).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
  })

  it('calls onViewProduct when view button is clicked', () => {
    render(
      <EnhancedProductCard
        product={mockProduct}
        currentUserId="user1"
        onViewProduct={mockOnViewProduct}
        variant="compact"
      />
    )

    const viewButton = screen.getByText('View')
    fireEvent.click(viewButton)

    expect(mockOnViewProduct).toHaveBeenCalledWith(mockProduct.url, mockProduct.title)
  })

  it('shows delete button for owner', () => {
    render(
      <EnhancedProductCard
        product={mockProduct}
        currentUserId="user1"
        onViewProduct={mockOnViewProduct}
        onDelete={mockOnDelete}
        variant="compact"
      />
    )

    // Look for the trash icon button
    const deleteButton = screen.getByRole('button', { name: '' })
    expect(deleteButton).toBeInTheDocument()
  })

  it('shows swipe buttons for partner items', () => {
    const partnerProduct = { ...mockProduct, uploaded_by: 'user2' }
    
    render(
      <EnhancedProductCard
        product={partnerProduct}
        currentUserId="user1"
        onViewProduct={mockOnViewProduct}
        onSwipe={mockOnSwipe}
        variant="compact"
      />
    )

    // Look for the heart and X icons instead of text
    const likeButton = screen.getByRole('button', { name: '' })
    expect(likeButton).toBeInTheDocument()
  })
})

describe('ProductComments', () => {
  it('renders comments toggle button', async () => {
    render(
      <ProductComments
        productId="1"
        currentUserId="user1"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Comments')).toBeInTheDocument()
    })
  })

  it('shows comment input when expanded', async () => {
    render(
      <ProductComments
        productId="1"
        currentUserId="user1"
      />
    )

    await waitFor(() => {
      const toggleButton = screen.getByText('Comments')
      fireEvent.click(toggleButton)
    })

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Share your thoughts...')).toBeInTheDocument()
    })
  })
}) 