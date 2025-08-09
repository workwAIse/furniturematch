import { supabase, type Product, type Comment, type DatabaseComment } from './supabase'
import { ProductTypeDetector } from './product-type-detector'

export class DatabaseService {
  // Get all products
  static async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error('Failed to fetch products')
    }

    return data || []
  }

  // Favorites API (per-user)
  static async getFavorites(userId: string): Promise<Array<{ category: string; product_id: string }>> {
    const { data, error } = await (supabase as any)
      .from('favorites')
      .select('category, product_id')
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching favorites:', error)
      throw new Error('Failed to fetch favorites')
    }
    return (data || []) as Array<{ category: string; product_id: string }>
  }

  static async setFavorite(userId: string, category: string, productId: string): Promise<void> {
    // Upsert unique (user_id, category)
    const { error } = await (supabase as any)
      .from('favorites')
      .upsert({ user_id: userId, category, product_id: productId }, { onConflict: 'user_id,category' })

    if (error) {
      console.error('Error setting favorite:', error)
      throw new Error('Failed to set favorite')
    }
  }

  static async clearFavorite(userId: string, category: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('category', category)

    if (error) {
      console.error('Error clearing favorite:', error)
      throw new Error('Failed to clear favorite')
    }
  }

  // Compare state API (per-user)
  static async getCompareState(userId: string, category: string): Promise<{ current_winner_id: string | null; queue: string[] } | null> {
    const { data, error } = await (supabase as any)
      .from('compare_states')
      .select('current_winner_id, queue')
      .eq('user_id', userId)
      .eq('category', category)
      .single()

    if (error && error.code !== 'PGRST116' && error.details !== 'Results contain 0 rows') {
      console.error('Error fetching compare state:', error)
      throw new Error('Failed to fetch compare state')
    }
    return (data as any) || null
  }

  static async upsertCompareState(userId: string, category: string, state: { current_winner_id: string | null; queue: string[] }): Promise<void> {
    const { error } = await (supabase as any)
      .from('compare_states')
      .upsert({ user_id: userId, category, current_winner_id: state.current_winner_id, queue: state.queue }, { onConflict: 'user_id,category' })

    if (error) {
      console.error('Error upserting compare state:', error)
      throw new Error('Failed to upsert compare state')
    }
  }

  static async clearCompareState(userId: string, category: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('compare_states')
      .delete()
      .eq('user_id', userId)
      .eq('category', category)

    if (error) {
      console.error('Error clearing compare state:', error)
      throw new Error('Failed to clear compare state')
    }
  }

  // Add a new product
  static async addProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()

    if (error) {
      console.error('Error adding product:', error)
      throw new Error('Failed to add product')
    }

    return data
  }

  // Update product swipes
  static async updateProductSwipes(productId: string, swipes: { [userId: string]: boolean }): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ swipes })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product swipes:', error)
      throw new Error('Failed to update product swipes')
    }

    return data
  }

  // Delete a product
  static async deleteProduct(productId: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      throw new Error('Failed to delete product')
    }
  }

  // Get products by user
  static async getProductsByUser(userId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products by user:', error)
      throw new Error('Failed to fetch products by user')
    }

    return data || []
  }

  // Get matched products (products that both users like)
  static async getMatchedProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('swipes', 'eq', '{}')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching matched products:', error)
      throw new Error('Failed to fetch matched products')
    }

    return data || []
  }

  // Get products by product type
  static async getProductsByType(productType: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('product_type', productType)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products by type:', error)
      throw new Error('Failed to fetch products by type')
    }

    return data || []
  }

  // Update product type for existing products (one-time migration)
  static async updateProductTypes(): Promise<void> {
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .is('product_type', null)

    if (fetchError) {
      console.error('Error fetching products for type update:', fetchError)
      throw new Error('Failed to fetch products for type update')
    }

    if (!products || products.length === 0) {
      console.log('No products need type updates')
      return
    }

    console.log(`Updating product types for ${products.length} products`)

    for (const product of products) {
      const productType = ProductTypeDetector.detectProductType(
        product.url,
        product.title,
        product.description
      )

      const { error: updateError } = await supabase
        .from('products')
        .update({ product_type: productType })
        .eq('id', product.id)

      if (updateError) {
        console.error(`Error updating product ${product.id}:`, updateError)
      }
    }

    console.log('Product type update completed')
  }

  // Update a single product's type
  static async updateProductType(productId: string, productType: string): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ product_type: productType })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product type:', error)
      throw new Error('Failed to update product type')
    }

    return data
  }

  // Update a single product's price (nullable)
  static async updateProductPrice(productId: string, price: string | null): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({ price })
      .eq('id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product price:', error)
      throw new Error('Failed to update product price')
    }

    return data
  }

  // Comment methods
  // Get comments for a product
  static async getComments(productId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      throw new Error('Failed to fetch comments')
    }

    return data || []
  }

  // Add a new comment
  static async addComment(comment: Omit<DatabaseComment, 'id' | 'created_at' | 'updated_at'>): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert([comment])
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      throw new Error('Failed to add comment')
    }

    return data
  }

  // Update a comment
  static async updateComment(commentId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .update({ content })
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating comment:', error)
      throw new Error('Failed to update comment')
    }

    return data
  }

  // Delete a comment
  static async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)

    if (error) {
      console.error('Error deleting comment:', error)
      throw new Error('Failed to delete comment')
    }
  }

  // AI Suggestions methods
  // Save a new AI suggestion
  static async saveAISuggestion(suggestion: {
    user_id: string
    category: string
    suggested_product: any
    reasoning: string
    confidence_score: number
  }): Promise<any> {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .insert([suggestion])
      .select()
      .single()

    if (error) {
      console.error('Error saving AI suggestion:', error)
      throw new Error('Failed to save AI suggestion')
    }

    return data
  }

  // Update AI suggestion status
  static async updateAISuggestionStatus(suggestionId: string, status: 'accepted' | 'rejected'): Promise<void> {
    const updateData = {
      status,
      ...(status === 'accepted' ? { accepted_at: new Date().toISOString() } : { rejected_at: new Date().toISOString() })
    }

    const { error } = await supabase
      .from('ai_suggestions')
      .update(updateData)
      .eq('id', suggestionId)

    if (error) {
      console.error('Error updating AI suggestion status:', error)
      throw new Error('Failed to update suggestion status')
    }
  }

  // Get AI suggestions for a user
  static async getAISuggestions(userId: string, status?: string): Promise<any[]> {
    let query = supabase
      .from('ai_suggestions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching AI suggestions:', error)
      throw new Error('Failed to fetch AI suggestions')
    }
    return data || []
  }
} 