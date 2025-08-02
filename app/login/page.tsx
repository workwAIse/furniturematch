"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { USER_MAPPING } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      router.push('/')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (userEmail: string) => {
    setEmail(userEmail)
    setPassword('')
    setError('')
    // Note: In a real app, you'd want to prompt for password
    // For demo purposes, we'll show the email is set
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">
              Welcome to FurnitureMatch
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Sign in to start matching furniture with your partner
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Login Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Quick Login:</p>
              {Object.entries(USER_MAPPING).map(([userEmail, userInfo]) => (
                <Button
                  key={userEmail}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => quickLogin(userEmail)}
                >
                  <span className="mr-2">{userInfo.avatar}</span>
                  <span className="flex-1 text-left">{userInfo.name}</span>
                </Button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Or sign in manually</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <p>Don't have an account? Contact your administrator.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 