"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Building2, TrendingUp, DollarSign, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface BuildingInfo {
  address?: string
  square_footage?: number
  floor_count?: number
}

interface Projection {
  year: number
  revenue: number
  expenses: number
  net_income: number
  roi: number
}

interface Summary {
  total_10_year_revenue: number
  total_10_year_expenses: number
  total_10_year_net_income: number
  average_annual_roi: number
}

interface ResultsDisplayProps {
  results: {
    building_info: BuildingInfo
    projections: Projection[]
    summary: Summary
  }
  downloadFilename: string
}

export function ResultsDisplay({ results, downloadFilename }: ResultsDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadError(null)

    try {
      const response = await fetch(`/api/download/${downloadFilename}`)
      if (!response.ok) {
        throw new Error("Failed to download file. Please try again.")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = downloadFilename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
      setDownloadError(error instanceof Error ? error.message : "Failed to download file")
    } finally {
      setIsDownloading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Model Results</h2>
          <p className="text-muted-foreground">10-year ROI projections and analysis</p>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading} size="lg" className="gap-2">
          <Download className="w-4 h-4" />
          {isDownloading ? "Downloading..." : "Download Excel"}
        </Button>
      </div>

      {downloadError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{downloadError}</AlertDescription>
        </Alert>
      )}

      {/* Building Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Building Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-4">
            {results.building_info.address && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{results.building_info.address}</p>
              </div>
            )}
            {results.building_info.square_footage && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Square Footage</p>
                <p className="font-medium">{formatNumber(results.building_info.square_footage)} sq ft</p>
              </div>
            )}
            {results.building_info.floor_count && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Floor Count</p>
                <p className="font-medium">{results.building_info.floor_count} floors</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total 10-Year Revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-accent" />
              <p className="text-2xl font-bold">{formatCurrency(results.summary.total_10_year_revenue)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total 10-Year Expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-muted-foreground" />
              <p className="text-2xl font-bold">{formatCurrency(results.summary.total_10_year_expenses)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total 10-Year Net Income</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-2xl font-bold">{formatCurrency(results.summary.total_10_year_net_income)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Annual ROI</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <p className="text-2xl font-bold">{results.summary.average_annual_roi.toFixed(2)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year-by-Year Projections */}
      <Card>
        <CardHeader>
          <CardTitle>10-Year Financial Projections</CardTitle>
          <CardDescription>Detailed year-by-year breakdown of revenue, expenses, and ROI</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Year</th>
                  <th className="text-right py-3 px-4 font-medium">Revenue</th>
                  <th className="text-right py-3 px-4 font-medium">Expenses</th>
                  <th className="text-right py-3 px-4 font-medium">Net Income</th>
                  <th className="text-right py-3 px-4 font-medium">ROI</th>
                </tr>
              </thead>
              <tbody>
                {results.projections.map((projection, index) => (
                  <tr key={projection.year} className={index % 2 === 0 ? "bg-muted/30" : ""}>
                    <td className="py-3 px-4 font-medium">{projection.year}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(projection.revenue)}</td>
                    <td className="text-right py-3 px-4">{formatCurrency(projection.expenses)}</td>
                    <td className="text-right py-3 px-4 font-medium">{formatCurrency(projection.net_income)}</td>
                    <td className="text-right py-3 px-4">
                      <span className="inline-flex items-center gap-1">{projection.roi.toFixed(2)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
