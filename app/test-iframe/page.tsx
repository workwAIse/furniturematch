"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { IframeModal } from "@/components/iframe-modal"

export default function TestIframePage() {
  const [iframeState, setIframeState] = useState({
    isOpen: false,
    url: null as string | null,
    productTitle: null as string | null,
  })

  const testUrls = [
    {
      url: "https://www.ikea.com/us/en/p/revskaer-3-seat-conversation-set-outdoor-anthracite-froesoen-duvholmen-dark-gray-s99584437/",
      title: "IKEA REVSKÄR 3-Seat Conversation Set"
    },
    {
      url: "https://www.wayfair.com/furniture/pdp/mercury-row-abbott-30-w-armchair-w000123456.html",
      title: "Wayfair Abbott Armchair"
    },
    {
      url: "https://www.amazon.com/dp/B08N5WRWNW",
      title: "Amazon Furniture Item"
    },
    {
      url: "https://www.google.com",
      title: "Google (should be blocked)"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Iframe Modal Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test URLs</h2>
          <p className="text-gray-600 mb-6">
            Click on any of the buttons below to test the iframe modal functionality.
            Some sites may block iframe embedding and show the fallback.
          </p>
          
          <div className="space-y-3">
            {testUrls.map((testUrl, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h3 className="font-medium">{testUrl.title}</h3>
                  <p className="text-sm text-gray-500">{testUrl.url}</p>
                </div>
                <Button
                  onClick={() => openIframe(testUrl.url, testUrl.title)}
                  variant="outline"
                >
                  Open in Iframe
                </Button>
              </div>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Test Instructions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Open in Iframe" to test the modal</li>
              <li>• Try the back button to return to this page</li>
              <li>• Try the close button to close the modal</li>
              <li>• Test keyboard navigation (Escape to close)</li>
              <li>• IKEA and other sites may show fallback due to X-Frame-Options</li>
              <li>• The IKEA REVSKÄR set is a real $655 outdoor furniture product</li>
            </ul>
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