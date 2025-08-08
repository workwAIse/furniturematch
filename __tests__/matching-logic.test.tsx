import { describe, it, expect } from '@jest/globals'

// Test the matching logic without React components
describe('Matching Logic', () => {
  it('should correctly identify matches when both users like the same product', () => {
    const products = [
      {
        id: '1',
        uploaded_by: 'user1',
        product_type: 'sofa',
        swipes: {
          'user1': true,  // Creator automatically likes their own product
          'user2': true   // Partner also likes it
        }
      },
      {
        id: '2',
        uploaded_by: 'user2',
        product_type: 'table',
        swipes: {
          'user1': true,  // User1 likes partner's product
          'user2': true   // Partner automatically likes their own product
        }
      },
      {
        id: '3',
        uploaded_by: 'user1',
        product_type: 'chair',
        swipes: {
          'user1': true,  // Creator automatically likes their own product
          'user2': false  // Partner dislikes it
        }
      }
    ]

    // Test getMatchedProducts logic
    const getMatchedProducts = (currentUserId: string) => {
      const otherUserId = currentUserId === 'user1' ? 'user2' : 'user1'
      
      return products.filter((product) => {
        // Case 1: You uploaded it and your partner liked it
        if (product.uploaded_by === currentUserId) {
          return product.swipes[otherUserId as keyof typeof product.swipes] === true
        }
        // Case 2: Your partner uploaded it and you liked it
        else if (product.uploaded_by === otherUserId) {
          return product.swipes[currentUserId as keyof typeof product.swipes] === true
        }
        
        return false
      })
    }

    // Test from user1's perspective
    const user1Matches = getMatchedProducts('user1')
    expect(user1Matches).toHaveLength(2) // Should match products 1 and 2
    expect(user1Matches.map(p => p.id)).toEqual(['1', '2'])

    // Test from user2's perspective
    const user2Matches = getMatchedProducts('user2')
    expect(user2Matches).toHaveLength(2) // Should match products 1 and 2
    expect(user2Matches.map(p => p.id)).toEqual(['1', '2'])

    // Product 3 should not be a match because user2 disliked it
    expect(user1Matches.find(p => p.id === '3')).toBeUndefined()
    expect(user2Matches.find(p => p.id === '3')).toBeUndefined()
  })

  it('should correctly identify pending items waiting for review', () => {
    const products = [
      {
        id: '1',
        uploaded_by: 'user1',
        product_type: 'sofa',
        swipes: {
          'user1': true  // Creator automatically likes their own product
          // user2 hasn't swiped yet
        }
      },
      {
        id: '2',
        uploaded_by: 'user2',
        product_type: 'table',
        swipes: {
          'user2': true  // Partner automatically likes their own product
          // user1 hasn't swiped yet
        }
      }
    ]

    // Test getProductsToSwipe logic
    const getProductsToSwipe = (currentUserId: string) => {
      return products.filter((product) => 
        product.uploaded_by !== currentUserId && 
        product.swipes[currentUserId as keyof typeof product.swipes] === undefined
      )
    }

    // Test from user1's perspective
    const user1ToSwipe = getProductsToSwipe('user1')
    expect(user1ToSwipe).toHaveLength(1) // Should only see product 2
    expect(user1ToSwipe[0].id).toBe('2')

    // Test from user2's perspective
    const user2ToSwipe = getProductsToSwipe('user2')
    expect(user2ToSwipe).toHaveLength(1) // Should only see product 1
    expect(user2ToSwipe[0].id).toBe('1')
  })

  it('should correctly identify user\'s own products', () => {
    const products = [
      {
        id: '1',
        uploaded_by: 'user1',
        swipes: {
          'user1': true,
          'user2': true
        }
      },
      {
        id: '2',
        uploaded_by: 'user2',
        swipes: {
          'user1': true,
          'user2': true
        }
      }
    ]

    const getYourProducts = (currentUserId: string) => {
      return products.filter((product) => product.uploaded_by === currentUserId)
    }

    const user1Products = getYourProducts('user1')
    expect(user1Products).toHaveLength(1)
    expect(user1Products[0].id).toBe('1')

    const user2Products = getYourProducts('user2')
    expect(user2Products).toHaveLength(1)
    expect(user2Products[0].id).toBe('2')
  })

  it('should correctly determine status badge for matches', () => {
    const products = [
      {
        id: '1',
        uploaded_by: 'user1',
        swipes: {
          'user2': true  // user2 liked user1's item = match
        }
      },
      {
        id: '2',
        uploaded_by: 'user2',
        swipes: {
          'user1': true  // user1 liked user2's item = match
        }
      },
      {
        id: '3',
        uploaded_by: 'user1',
        swipes: {
          'user2': false  // user2 disliked user1's item = not a match
        }
      },
      {
        id: '4',
        uploaded_by: 'user1',
        swipes: {
          // user2 hasn't swiped yet = waiting for review
        }
      }
    ]

    // Test status badge logic
    const getStatusBadge = (product: any, currentUserId: string) => {
      const otherUserId = currentUserId === 'user1' ? 'user2' : 'user1'
      const isMatch = (product.uploaded_by === currentUserId && product.swipes[otherUserId] === true) ||
                     (product.uploaded_by === otherUserId && product.swipes[currentUserId] === true)
      const hasSwiped = product.swipes[currentUserId] !== undefined
      const liked = product.swipes[currentUserId] === true
      
      if (isMatch) {
        return 'Match! ❤️'
      }
      if (hasSwiped) {
        return `You: ${liked ? '❤️' : '❌'}`
      }
      return 'Waiting for review'
    }

    // Test product 1 (user2 liked user1's item) from user1's perspective
    expect(getStatusBadge(products[0], 'user1')).toBe('Match! ❤️')
    
    // Test product 1 (user2 liked user1's item) from user2's perspective  
    expect(getStatusBadge(products[0], 'user2')).toBe('Match! ❤️')
    
    // Test product 2 (user1 liked user2's item) from user1's perspective
    expect(getStatusBadge(products[1], 'user1')).toBe('Match! ❤️')
    
    // Test product 2 (user1 liked user2's item) from user2's perspective
    expect(getStatusBadge(products[1], 'user2')).toBe('Match! ❤️')
    
    // Test product 3 (user2 disliked user1's item) from user1's perspective
    expect(getStatusBadge(products[2], 'user1')).toBe('You: ❤️') // user1 uploaded, so they "like" it
    
    // Test product 3 (user2 disliked user1's item) from user2's perspective
    expect(getStatusBadge(products[2], 'user2')).toBe('You: ❌') // user2 disliked it
    
    // Test product 4 (waiting for user2 to swipe) from user1's perspective
    expect(getStatusBadge(products[3], 'user1')).toBe('You: ❤️') // user1 uploaded, so they "like" it
    
    // Test product 4 (waiting for user2 to swipe) from user2's perspective
    expect(getStatusBadge(products[3], 'user2')).toBe('Waiting for review') // user2 hasn't swiped yet
  })
}) 