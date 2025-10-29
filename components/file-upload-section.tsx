"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FileUploadSectionProps {
  onProcessComplete?: (results: any) => void
  onProcessStart?: () => void
}

export function FileUploadSection({ onProcessComplete, onProcessStart }: FileUploadSectionProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ]

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xlsx, .xls) or CSV file")
      return false
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB")
      return false
    }

    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    setError(null)
    setUploadSuccess(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile)
      setUploadSuccess(true)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setUploadSuccess(false)
    const selectedFile = e.target.files?.[0]
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile)
      setUploadSuccess(true)
    }
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)
    setUploadSuccess(false)

    // Notify parent that processing has started
    if (onProcessStart) {
      onProcessStart()
    }

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process file")
      }

      const results = await response.json()
      console.log("[v0] Processing complete:", results)

      // Pass results to parent component
      if (onProcessComplete) {
        onProcessComplete(results)
      }
    } catch (err) {
      console.error("[v0] Error processing file:", err)
      const errorMessage = err instanceof Error ? err.message : "Failed to process file. Please try again."
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setError(null)
    setUploadSuccess(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Building Information</CardTitle>
          <CardDescription>
            Upload your input sheet containing building details, market data, and operational expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {uploadSuccess && !error && (
            <Alert className="border-accent/50 bg-accent/5">
              <CheckCircle2 className="h-4 w-4 text-accent" />
              <AlertDescription className="text-accent">File uploaded successfully! Ready to process.</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}
              ${file ? "bg-muted/30" : ""}
            `}
          >
            <input
              type="file"
              id="file-upload"
              className="sr-only"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />

            {!file ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-accent/10 p-4">
                    <Upload className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Drag and drop your file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">Supports Excel (.xlsx, .xls) and CSV files up to 10MB</p>
                </div>
                <Button asChild variant="outline" size="sm" disabled={isProcessing}>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select File
                  </label>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="rounded-full bg-accent/10 p-4">
                    <FileSpreadsheet className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={handleRemoveFile} variant="outline" size="sm" disabled={isProcessing}>
                    Remove
                  </Button>
                  <Button asChild variant="outline" size="sm" disabled={isProcessing}>
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Change File
                    </label>
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleProcess} disabled={!file || isProcessing} size="lg" className="min-w-[200px]">
              {isProcessing ? "Processing..." : "Generate Financial Model"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base">Required Input Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="font-medium text-foreground">Building Information</p>
              <p className="text-muted-foreground">Address, square footage, floor count</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Market Data</p>
              <p className="text-muted-foreground">Market rent rates, occupancy trends</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Operating Expenses</p>
              <p className="text-muted-foreground">Utilities, maintenance, staffing costs</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Financial Assumptions</p>
              <p className="text-muted-foreground">Growth rates, discount factors</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
