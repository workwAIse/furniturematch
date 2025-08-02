"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ScrapedData {
  title: string
  description: string
  image: string
  price?: string
  retailer: string
}

const TEST_URLS = [
  "https://www.ikea.com/us/en/p/ektorp-sofa-nordvalla-dark-gray-s79218639/",
  "https://www.target.com/p/brightroom-storage-ottoman/-/A-54643007",
  "https://www.segmueller.de/produkte/bigsofa-marsala-m034554-00000?attribute%5BFARBE%5D=Beige"
]

export default function DebugScraper() {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ScrapedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rawResponse, setRawResponse] = useState<string>("")

  const testScrape = async (testUrl?: string) => {
    const urlToTest = testUrl || url
    if (!urlToTest.trim()) return

    setIsLoading(true)
    setError(null)
    setResult(null)
    setRawResponse("")

    try {
      console.log("Testing URL:", urlToTest)

      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToTest }),
      })

      const responseText = await response.text()
      setRawResponse(responseText)

      console.log("Raw response:", responseText)

      let data
      try {
        data = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Failed to parse response: ${parseError}`)
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      console.log("Parsed data:", data)
      setResult(data)
    } catch (err) {
      console.error("Scraping error:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Product Scraper</CardTitle>
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
              <h3 className="font-semibold mb-2">Test URLs:</h3>
              <div className="space-y-2">
                {TEST_URLS.map((testUrl, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testScrape(testUrl)}
                      disabled={isLoading}
                      className="text-xs"
                    >
                      Test
                    </Button>
                    <span className="text-sm text-gray-600 truncate flex-1">{testUrl}</span>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Scraped Result
                  <Badge variant="outline">{result.retailer}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{result.title}</h3>
                  {result.price && <p className="text-lg font-bold text-green-600 mb-2">{result.price}</p>}
                  <p className="text-gray-600 text-sm mb-4">{result.description}</p>
                </div>

                {result.image && (
                  <div>
                    <h4 className="font-medium mb-2">Image:</h4>
                    <img
                      src={result.image || "/placeholder.svg"}
                      alt={result.title}
                      className="w-full max-w-sm h-64 object-contain rounded-lg border bg-gray-50"
                      onError={(e) => {
                        console.error("Image failed to load:", result.image)
                        e.currentTarget.src = "/placeholder.svg?height=256&width=256"
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1 break-all">{result.image}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Raw API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">{rawResponse}</pre>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
