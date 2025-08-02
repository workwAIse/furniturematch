import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import FurnitureMatcher from '../app/page'

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveClass(...classNames: string[]): R
      toHaveTextContent(text: string): R
    }
  }
}

// Mock the auth context
jest.mock('../lib/auth-context', () => ({
  useAuth: () => ({
    user: { email: 'alexander.buechel@posteo.de' },
    signOut: jest.fn(),
  }),
}))

// Mock the database service with products that will show in swipe view
jest.mock('../lib/database', () => ({
  DatabaseService: {
    getProducts: jest.fn().mockResolvedValue([
      {
        id: '1',
        url: 'https://example.com/chair',
        image: '/test-chair.jpg',
        title: 'Test Chair',
        description: 'A comfortable chair',
        price: '$299',
        retailer: 'IKEA',
        uploaded_by: 'user2', // Partner uploaded it
        swipes: {}, // No swipes yet, so it will show in swipe view
      },
    ]),
    addProduct: jest.fn(),
    updateProductSwipes: jest.fn(),
    deleteProduct: jest.fn(),
  },
}))

// Mock the iframe modal component
jest.mock('../components/iframe-modal', () => ({
  IframeModal: ({ isOpen, url, productTitle, onClose }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="iframe-modal">
        <div data-testid="modal-url">{url}</div>
        <div data-testid="modal-title">{productTitle}</div>
        <button onClick={onClose} data-testid="close-modal">Close</button>
      </div>
    )
  },
}))

// Mock the protected route component
jest.mock('../components/protected-route', () => ({
  ProtectedRoute: ({ children }: any) => <div>{children}</div>,
}))

// Mock the product comments component
jest.mock('../components/product-comments', () => ({
  ProductComments: () => <div data-testid="product-comments">Comments</div>,
}))

describe('Modal Functionality', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  it('should open modal when clicking on furniture item image', async () => {
    render(<FurnitureMatcher />)
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Chair')).toBeInTheDocument()
    })

    // Find the image
    const chairImage = screen.getByAltText('Test Chair')
    expect(chairImage).toBeInTheDocument()

    // Click on the image
    fireEvent.click(chairImage)

    // Check that the modal opens with correct URL and title
    await waitFor(() => {
      expect(screen.getByTestId('iframe-modal')).toBeInTheDocument()
      expect(screen.getByTestId('modal-url')).toHaveTextContent('https://example.com/chair')
      expect(screen.getByTestId('modal-title')).toHaveTextContent('Test Chair')
    })
  })

  it('should close modal when clicking close button', async () => {
    render(<FurnitureMatcher />)
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Chair')).toBeInTheDocument()
    })

    // Click on image to open modal
    const chairImage = screen.getByAltText('Test Chair')
    fireEvent.click(chairImage)

    // Verify modal is open
    await waitFor(() => {
      expect(screen.getByTestId('iframe-modal')).toBeInTheDocument()
    })

    // Click close button
    const closeButton = screen.getByTestId('close-modal')
    fireEvent.click(closeButton)

    // Verify modal is closed
    await waitFor(() => {
      expect(screen.queryByTestId('iframe-modal')).not.toBeInTheDocument()
    })
  })

  it('should have cursor pointer and hover effects on images', async () => {
    render(<FurnitureMatcher />)
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Test Chair')).toBeInTheDocument()
    })

    // Find the image
    const chairImage = screen.getByAltText('Test Chair')
    
    // Check that the image has the correct CSS classes for clickability
    expect(chairImage).toHaveClass('cursor-pointer', 'hover:opacity-90', 'transition-opacity')
  })
}) 