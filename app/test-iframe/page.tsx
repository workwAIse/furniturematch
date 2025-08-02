"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { IframeModal } from "@/components/iframe-modal"
import { IframeContent } from "@/components/iframe-modal"

export default function TestIframePage() {
  const [iframeState, setIframeState] = useState({
    isOpen: false,
    url: null as string | null,
    productTitle: null as string | null,
  })

  const [testResults, setTestResults] = useState<{[key: string]: 'loading' | 'success' | 'blocked' | 'error'}>({})
  const [timeouts, setTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({})

  const ikeaUrl = "https://www.ikea.com/us/en/p/revskaer-3-seat-conversation-set-outdoor-anthracite-froesoen-duvholmen-dark-gray-s99584437/"
  const ikeaTitle = "IKEA REVSKÄR 3-Seat Conversation Set"

  const iframeMethods = [
    {
      id: "standard",
      title: "Standard Iframe",
      description: "Basic iframe with standard sandbox and referrer policy",
      sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
      referrerPolicy: "no-referrer" as const
    },
    {
      id: "origin-referrer",
      title: "Origin Referrer",
      description: "Iframe with origin referrer policy",
      sandbox: "allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox",
      referrerPolicy: "origin" as const
    },
    {
      id: "minimal-sandbox",
      title: "Minimal Sandbox",
      description: "Iframe with minimal sandbox restrictions",
      sandbox: "allow-scripts allow-forms",
      referrerPolicy: "no-referrer" as const
    },
    {
      id: "no-sandbox",
      title: "No Sandbox",
      description: "Iframe without sandbox restrictions (less secure)",
      sandbox: "",
      referrerPolicy: "no-referrer" as const
    },
    {
      id: "unsafe-allow",
      title: "Unsafe Allow",
      description: "Iframe with unsafe-allow-scripts (experimental)",
      sandbox: "allow-scripts allow-forms allow-same-origin",
      referrerPolicy: "no-referrer" as const
    }
  ]

  const openIframe = (url: string, productTitle?: string) => {
    setIframeState({
      isOpen: true,
      url,
      productTitle: productTitle || null,
    })
  }

  const closeIframe = () => {
    setIframeState({
      isOpen: false,
      url: null,
      productTitle: null,
    })
  }

  const goBackFromIframe = () => {
    setIframeState({
      isOpen: false,
      url: null,
      productTitle: null,
    })
  }

  const handleIframeLoad = (methodId: string) => {
    console.log(`Iframe ${methodId} load event fired`)
    
    // Check if content is actually visible after a short delay
    setTimeout(() => {
      const iframe = document.querySelector(`iframe[data-method="${methodId}"]`) as HTMLIFrameElement
      if (iframe) {
        try {
          // Try to access iframe content - this will fail if blocked
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
          if (iframeDoc && iframeDoc.body && iframeDoc.body.innerHTML.length > 100) {
            console.log(`Iframe ${methodId} content is visible`)
            setTestResults(prev => ({ ...prev, [methodId]: 'success' }))
          } else {
            console.log(`Iframe ${methodId} content is blocked or empty`)
            setTestResults(prev => ({ ...prev, [methodId]: 'blocked' }))
          }
        } catch (error) {
          console.log(`Iframe ${methodId} access blocked by CORS:`, error)
          setTestResults(prev => ({ ...prev, [methodId]: 'blocked' }))
        }
      }
    }, 2000) // Wait 2 seconds to check content
  }

  const handleIframeError = (methodId: string, error: any) => {
    console.log(`Iframe ${methodId} error:`, error)
    setTestResults(prev => ({ ...prev, [methodId]: 'error' }))
  }

  const resetTests = () => {
    // Clear all timeouts
    Object.values(timeouts).forEach(timeout => clearTimeout(timeout))
    setTimeouts({})
    setTestResults({})
  }

  // Set up timeout for each iframe method
  const setupIframeTimeout = (methodId: string) => {
    const timeout = setTimeout(() => {
      console.log(`Iframe ${methodId} timeout - likely blocked`)
      setTestResults(prev => ({ ...prev, [methodId]: 'blocked' }))
    }, 8000) // 8 second timeout
    
    setTimeouts(prev => ({ ...prev, [methodId]: timeout }))
  }

  // Set up timeouts for all methods when component mounts
  useEffect(() => {
    iframeMethods.forEach(method => {
      setupIframeTimeout(method.id)
    })
    
    return () => {
      // Clean up timeouts on unmount
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Iframe Methods Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Testing IKEA Product: {ikeaTitle}</h2>
              <p className="text-gray-600 text-sm">{ikeaUrl}</p>
            </div>
            <Button onClick={resetTests} variant="outline" size="sm">
              Reset Tests
            </Button>
          </div>
          
          <p className="text-gray-600 mb-6">
            This page tests different iframe configurations to see which ones work with IKEA's blocking.
            Each iframe attempts to load the same IKEA product page with different settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {iframeMethods.map((method) => {
            const status = testResults[method.id] || 'loading'
            const statusColors = {
              loading: 'bg-gray-100 text-gray-600',
              success: 'bg-green-100 text-green-800',
              blocked: 'bg-yellow-100 text-yellow-800',
              error: 'bg-red-100 text-red-800'
            }
            const statusText = {
              loading: 'Loading...',
              success: '✅ Success',
              blocked: '🚫 Blocked',
              error: '❌ Error'
            }

            return (
              <div key={method.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[status]}`}>
                    {statusText[status]}
                  </div>
                </div>
                
                <div className="h-64 relative">
                  {status === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading...</p>
                        <p className="text-xs text-gray-400 mt-1">Checking if content is visible</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'blocked' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-yellow-50 z-10">
                      <div className="text-center p-4">
                        <div className="text-2xl mb-2">🚫</div>
                        <p className="text-sm text-yellow-700 font-medium">Blocked by IKEA</p>
                        <p className="text-xs text-yellow-600 mt-1">X-Frame-Options or CSP prevents embedding</p>
                        <p className="text-xs text-yellow-500 mt-1">Content not visible due to security policies</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                      <div className="text-center p-4">
                        <div className="text-2xl mb-2">❌</div>
                        <p className="text-sm text-red-700 font-medium">Error Loading</p>
                        <p className="text-xs text-red-600 mt-1">Connection or other error</p>
                      </div>
                    </div>
                  )}
                  
                  {status === 'success' && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        ✅ Content Visible
                      </div>
                    </div>
                  )}
                  
                  <iframe
                    src={ikeaUrl}
                    className="w-full h-full border-0"
                    title={`${method.title} - ${ikeaTitle}`}
                    data-method={method.id}
                    sandbox={method.sandbox}
                    referrerPolicy={method.referrerPolicy}
                    onLoad={() => handleIframeLoad(method.id)}
                    onError={() => handleIframeError(method.id, new Error('Iframe error'))}
                  />
                </div>
                
                <div className="p-3 bg-gray-50 text-xs">
                  <div className="font-medium mb-1">Configuration:</div>
                  <div className="space-y-1">
                    <div><span className="font-medium">Sandbox:</span> {method.sandbox || 'none'}</div>
                    <div><span className="font-medium">Referrer:</span> {method.referrerPolicy}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Test Results Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {iframeMethods.map((method) => {
              const status = testResults[method.id] || 'loading'
              const count = Object.values(testResults).filter(s => s === status).length
              return (
                <div key={method.id} className="text-center">
                  <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    status === 'success' ? 'bg-green-100 text-green-800' :
                    status === 'blocked' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'error' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {method.title}
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
              <p>• <strong>Standard Iframe:</strong> Usually blocked by X-Frame-Options</p>
              <p>• <strong>Different Referrer Policies:</strong> May affect blocking behavior</p>
              <p>• <strong>Sandbox Restrictions:</strong> Security vs functionality trade-off</p>
              <p>• <strong>IKEA's Blocking:</strong> Demonstrates why fallback is needed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Iframe Modal */}
      <IframeModal
        isOpen={iframeState.isOpen}
        url={iframeState.url}
        productTitle={iframeState.productTitle || undefined}
        onClose={closeIframe}
        onBack={goBackFromIframe}
      />
    </div>
  )
} 