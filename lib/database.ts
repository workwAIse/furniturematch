import { supabase, type Product } from './supabase'

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
} 