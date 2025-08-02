import { NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/database'

export async function GET() {
  try {
    // Test getting products
    const products = await DatabaseService.getProducts()
    
    if (products.length === 0) {
      return NextResponse.json({
        status: 'success',
        message: 'No products found to test comments with',
        products: []
      })
    }

    const firstProduct = products[0]
    
    // Test getting comments for the first product
    const comments = await DatabaseService.getComments(firstProduct.id)
    
    return NextResponse.json({
      status: 'success',
      message: 'Comments database connection working',
      product: {
        id: firstProduct.id,
        title: firstProduct.title
      },
      comments: comments,
      commentCount: comments.length
    })
  } catch (error) {
    console.error('Error testing comments:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to test comments functionality',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { productId, userId, content } = await request.json()
    
    if (!productId || !userId || !content) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields: productId, userId, content'
        },
        { status: 400 }
      )
    }

    // Test adding a comment
    const comment = await DatabaseService.addComment({
      product_id: productId,
      user_id: userId,
      content: content
    })

    return NextResponse.json({
      status: 'success',
      message: 'Comment added successfully',
      comment: comment
    })
  } catch (error) {
    console.error('Error adding test comment:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to add test comment',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 