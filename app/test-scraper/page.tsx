"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const EXAMPLE_URLS = [
  "https://www.ikea.com/us/en/p/ektorp-sofa-nordvalla-dark-gray-s79218639/",
  "https://www.wayfair.com/furniture/pdp/andover-mills-serta-at-home-palisades-sofa-w001729814.html",
  "https://www.westelm.com/products/andes-sectional-sofa-h2025/",
  "https://www.cb2.com/paramount-sofa/s456789",
  "https://article.com/product/1234/sven-charme-tan-sofa",
]

interface ScrapedData {
  title: string
  description: string
  image: string
  price?: string
  retailer: string
}

export default function TestScraper() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const testScrape = async (testUrl?: string) => {
    const urlToTest = testUrl || url
    if (!urlToTest.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToTest }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to scrape")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Scraper Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="url"
                placeholder="Enter furniture product URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <Button onClick={() => testScrape()} disabled={!url.trim() || isLoading} className="w-full">
              {isLoading ? "Scraping..." : "Test Scrape"}
            </Button>

            <div>
              <h3 className="font-semibold mb-2">Example URLs:</h3>
              <div className="space-y-2">
                {EXAMPLE_URLS.map((exampleUrl, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testScrape(exampleUrl)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      Test
                    </Button>
                    <span className="text-sm text-gray-600 truncate flex-1">{exampleUrl}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="text-red-600">
                <strong>Error:</strong> {error}
              </div>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Scraped Result
                <Badge variant="outline">{result.retailer}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={result.image || "/placeholder.svg"}
                  alt={result.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
                  {result.price && <p className="text-lg font-bold text-green-600 mb-2">{result.price}</p>}
                  <p className="text-gray-600 text-sm">{result.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
