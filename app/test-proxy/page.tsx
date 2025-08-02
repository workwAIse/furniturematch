"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IframeModal } from "@/components/iframe-modal"
import { CheckCircle, XCircle, AlertTriangle, Info, ExternalLink } from "lucide-react"

export default function TestProxyPage() {
  const [testUrl, setTestUrl] = useState("")
  const [testResults, setTestResults] = useState<{[key: string]: 'pending' | 'success' | 'blocked' | 'error'}>({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalUrl, setModalUrl] = useState("")

  const testUrls = [
    {
      id: "ikea",
      url: "https://www.ikea.com/us/en/p/revskaer-3-seat-conversation-set-outdoor-anthracite-froesoen-duvholmen-dark-gray-s99584437/",
      title: "IKEA REVSKÄR 3-Seat Conversation Set",
      retailer: "IKEA"
    },
    {
      id: "kare",
      url: "https://www.kare-design.com/en/product/chair-herman-miller-eames-dcm/",
      title: "Kare Design Herman Miller Chair",
      retailer: "Kare Design"
    },
    {
      id: "wayfair",
      url: "https://www.wayfair.com/furniture/pdp/mercury-row-ayden-3-seat-conversation-set-w000123456.html",
      title: "Wayfair Ayden 3-Seat Conversation Set",
      retailer: "Wayfair"
    },
    {
      id: "amazon",
      url: "https://www.amazon.com/dp/B08N5WRWNW",
      title: "Amazon Patio Furniture Set",
      retailer: "Amazon"
    }
  ]

  const runTest = async (testId: string) => {
    setTestResults(prev => ({ ...prev, [testId]: 'pending' }))
    
    try {
      const url = testUrls.find(t => t.id === testId)?.url
      if (!url) return

      // Test proxy approach
      const response = await fetch('/api/proxy-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTestResults(prev => ({ ...prev, [testId]: 'success' }))
      } else {
        setTestResults(prev => ({ ...prev, [testId]: 'blocked' }))
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testId]: 'error' }))
    }
  }

  const runAllTests = () => {
    testUrls.forEach(test => runTest(test.id))
  }

  const testCustomUrl = () => {
    if (testUrl) {
      setModalUrl(testUrl)
      setIsModalOpen(true)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'blocked': return <XCircle className="h-5 w-5 text-red-500" />
      case 'error': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default: return <Info className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Proxy Works'
      case 'blocked': return 'Blocked'
      case 'error': return 'Error'
      default: return 'Not Tested'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Server-Side Proxy Solution Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Enhanced Proxy Solution with Browser Automation</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">1. Regular Fetch</h3>
              <p className="text-sm text-gray-600">Try standard fetch with custom headers and user agents first</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">2. Puppeteer Fallback</h3>
              <p className="text-sm text-gray-600">Use headless browser automation for stubborn sites like IKEA and Kare</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">3. Content Processing</h3>
              <p className="text-sm text-gray-600">Remove X-Frame-Options and CSP headers that block iframe embedding</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">4. Iframe Display</h3>
              <p className="text-sm text-gray-600">Serve processed content through iframe using srcDoc attribute</p>
            </div>
          </div>
        </div>

        {/* Custom URL Test */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Custom URL</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="test-url">Enter a furniture website URL</Label>
                <Input
                  id="test-url"
                  type="url"
                  placeholder="https://www.ikea.com/us/en/p/..."
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={testCustomUrl} disabled={!testUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Test in Modal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predefined Tests */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {testUrls.map((test) => {
            const status = testResults[test.id] || 'pending'
            return (
              <Card key={test.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    {getStatusIcon(status)}
                    <p className="text-sm mt-2">{getStatusText(status)}</p>
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-sm">{test.title}</CardTitle>
                  <Badge variant="outline">{test.retailer}</Badge>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    <Button 
                      onClick={() => runTest(test.id)} 
                      disabled={status === 'pending'}
                      className="w-full"
                    >
                      Test Proxy
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setModalUrl(test.url)
                        setIsModalOpen(true)
                      }}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Modal
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-4 mb-8">
          <Button onClick={runAllTests} size="lg">
            Run All Tests
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setTestResults({})}
            size="lg"
          >
            Reset Tests
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Test Results Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {testUrls.map((test) => {
              const status = testResults[test.id] || 'pending'
              return (
                <div key={test.id} className="text-center">
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    status === 'success' ? 'bg-green-100 text-green-800' :
                    status === 'blocked' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {test.retailer}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {status === 'success' ? '✅ Works' :
                     status === 'blocked' ? '🚫 Blocked' :
                     status === 'error' ? '❌ Error' : '⏳ Loading'}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">What This Test Shows:</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Server-Side Proxy:</strong> Bypasses X-Frame-Options by fetching content server-side</p>
              <p>• <strong>Custom Headers:</strong> Uses different user agents and referrer policies</p>
              <p>• <strong>Content Processing:</strong> Removes blocking headers and makes content iframe-friendly</p>
              <p>• <strong>Fallback Strategy:</strong> Graceful degradation when proxy fails</p>
            </div>
          </div>
        </div>
      </div>

      {/* Iframe Modal */}
      <IframeModal
        isOpen={isModalOpen}
        url={modalUrl}
        productTitle="Test Product"
        onClose={() => setIsModalOpen(false)}
        onBack={() => setIsModalOpen(false)}
      />
    </div>
  )
} 