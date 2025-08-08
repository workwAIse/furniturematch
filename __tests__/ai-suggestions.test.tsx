import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AISuggestionsTab } from '@/components/ai-suggestions-tab'
import { AISuggestionCard } from '@/components/ai-suggestion-card'

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
    }
  }
}

// Mock the dependencies
jest.mock('@/lib/database', () => ({
  DatabaseService: {
    addProduct: jest.fn(),
    updateAISuggestionStatus: jest.fn(),
  }
}))

jest.mock('@/lib/auth-context', () => ({
  useAuth: () => ({
    user: { email: 'alexander.buechel@posteo.de' }
  })
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}))

jest.mock('@/lib/product-type-detector', () => ({
  ProductTypeDetector: {
    getAllProductTypes: () => [
      { id: 'sofa', name: 'Sofa' },
      { id: 'chair', name: 'Chair' },
      { id: 'table', name: 'Table' }
    ]
  }
}))

// Mock fetch
global.fetch = jest.fn()

describe('AI Suggestions Feature', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('AISuggestionsTab', () => {
    it('renders the AI suggestions tab with correct title and description', () => {
      render(<AISuggestionsTab />)
      
      expect(screen.getByText('AI Furniture Suggestions')).toBeInTheDocument()
      expect(screen.getByText(/Get personalized furniture recommendations/)).toBeInTheDocument()
    })

    it('shows category selector with furniture types', () => {
      render(<AISuggestionsTab />)
      
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      
      fireEvent.click(select)
      
      expect(screen.getByText('Sofa')).toBeInTheDocument()
      expect(screen.getByText('Chair')).toBeInTheDocument()
      expect(screen.getByText('Table')).toBeInTheDocument()
    })

    it('shows generate button disabled when no category selected', () => {
      render(<AISuggestionsTab />)
      
      const generateButton = screen.getByText('Generate Suggestions')
      expect(generateButton).toBeDisabled()
    })

    it('enables generate button when category is selected', () => {
      render(<AISuggestionsTab />)
      
      const select = screen.getByRole('combobox')
      fireEvent.click(select)
      fireEvent.click(screen.getByText('Sofa'))
      
      const generateButton = screen.getByText('Generate Suggestions')
      expect(generateButton).not.toBeDisabled()
    })

    it('shows loading state when generating suggestions', async () => {
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ suggestions: [] }) }), 100))
      )

      render(<AISuggestionsTab />)
      
      const select = screen.getByRole('combobox')
      fireEvent.click(select)
      fireEvent.click(screen.getByText('Sofa'))
      
      const generateButton = screen.getByText('Generate Suggestions')
      fireEvent.click(generateButton)
      
      expect(screen.getByText('Generating...')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Generating/ })).toBeDisabled()
    })

    it('shows empty state when no suggestions exist', () => {
      render(<AISuggestionsTab />)
      
      expect(screen.getByText('No Suggestions Yet')).toBeInTheDocument()
      expect(screen.getByText(/Select a furniture category/)).toBeInTheDocument()
    })

    it('displays suggestions when they exist', async () => {
      const mockSuggestions = [
        {
          id: '1',
          user_id: 'user1',
          category: 'sofa',
          suggested_product: {
            title: 'Modern Comfort Sofa',
            description: 'A comfortable modern sofa',
            image: 'https://example.com/sofa.jpg',
            price: '$599',
            retailer: 'IKEA',
            url: 'https://ikea.com/sofa'
          },
          reasoning: 'This sofa complements your existing modern style',
          confidence_score: 0.85,
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]

      // Mock the initial load and the generate suggestions call
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ suggestions: [] })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ suggestions: mockSuggestions })
        })

      render(<AISuggestionsTab />)
      
      // Wait for initial load to complete
      await waitFor(() => {
        expect(screen.getByText('No Suggestions Yet')).toBeInTheDocument()
      })

      // Select category and generate suggestions
      const select = screen.getByRole('combobox')
      fireEvent.click(select)
      fireEvent.click(screen.getByText('Sofa'))
      
      const generateButton = screen.getByText('Generate Suggestions')
      fireEvent.click(generateButton)
      
      await waitFor(() => {
        expect(screen.getByText('Modern Comfort Sofa')).toBeInTheDocument()
        expect(screen.getByText('$599')).toBeInTheDocument()
        expect(screen.getByText('IKEA')).toBeInTheDocument()
        expect(screen.getByText(/This sofa complements/)).toBeInTheDocument()
      })
    })
  })

  describe('AISuggestionCard', () => {
    const mockSuggestion = {
      id: '1',
      suggested_product: {
        title: 'Modern Comfort Sofa',
        description: 'A comfortable modern sofa with clean lines and premium fabric',
        image: 'https://example.com/sofa.jpg',
        price: '$599',
        retailer: 'IKEA',
        url: 'https://ikea.com/sofa'
      },
      reasoning: 'This sofa complements your existing modern style and color palette',
      confidence_score: 0.85
    }

    it('renders suggestion card with all product information', () => {
      const onAccept = jest.fn()
      const onReject = jest.fn()

      render(
        <AISuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
        />
      )

      expect(screen.getByText('Modern Comfort Sofa')).toBeInTheDocument()
      expect(screen.getByText('A comfortable modern sofa with clean lines and premium fabric')).toBeInTheDocument()
      expect(screen.getByText('$599')).toBeInTheDocument()
      expect(screen.getByText('IKEA')).toBeInTheDocument()
      expect(screen.getByText(/This sofa complements/)).toBeInTheDocument()
      expect(screen.getByText('85% match')).toBeInTheDocument()
    })

    it('calls onAccept when Add to Collection button is clicked', () => {
      const onAccept = jest.fn()
      const onReject = jest.fn()

      render(
        <AISuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
        />
      )

      const acceptButton = screen.getByText('Add to Collection')
      fireEvent.click(acceptButton)

      expect(onAccept).toHaveBeenCalledTimes(1)
    })

    it('calls onReject when reject button is clicked', () => {
      const onAccept = jest.fn()
      const onReject = jest.fn()

      render(
        <AISuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
        />
      )

      const rejectButton = screen.getByRole('button', { name: '' }) // X button
      fireEvent.click(rejectButton)

      expect(onReject).toHaveBeenCalledTimes(1)
    })

    it('disables buttons when loading', () => {
      const onAccept = jest.fn()
      const onReject = jest.fn()

      render(
        <AISuggestionCard
          suggestion={mockSuggestion}
          onAccept={onAccept}
          onReject={onReject}
          isLoading={true}
        />
      )

      const acceptButton = screen.getByText('Add to Collection')
      const rejectButton = screen.getByRole('button', { name: '' })

      expect(acceptButton).toBeDisabled()
      expect(rejectButton).toBeDisabled()
    })

    it('handles missing price gracefully', () => {
      const suggestionWithoutPrice = {
        ...mockSuggestion,
        suggested_product: {
          ...mockSuggestion.suggested_product,
          price: undefined
        }
      }

      const onAccept = jest.fn()
      const onReject = jest.fn()

      render(
        <AISuggestionCard
          suggestion={suggestionWithoutPrice}
          onAccept={onAccept}
          onReject={onReject}
        />
      )

      expect(screen.getByText('Price not available')).toBeInTheDocument()
    })
  })
}) 