"use client"

import { useState } from "react"
import { FileUploadSection } from "@/components/file-upload-section"
import { ResultsDisplay } from "@/components/results-display"
import { ProcessingOverlay } from "@/components/processing-overlay"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function Home() {
  const [results, setResults] = useState<any>(null)
  const [downloadFilename, setDownloadFilename] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingFileName, setProcessingFileName] = useState<string>("")

  const handleProcessStart = () => {
    setIsProcessing(true)
  }

  const handleProcessComplete = (data: any) => {
    setResults(data.results)
    setDownloadFilename(data.download_filename)
    setIsProcessing(false)
  }

  const handleReset = () => {
    setResults(null)
    setDownloadFilename("")
    setIsProcessing(false)
    setProcessingFileName("")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="space-y-8">
          {!results ? (
            <>
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-balance">Co-Working Space Financial Modeling</h1>
                <p className="text-lg text-muted-foreground text-balance max-w-2xl mx-auto">
                  Upload your building information to generate comprehensive 10-year ROI projections and financial
                  models for landlord presentations
                </p>
              </div>

              <FileUploadSection onProcessComplete={handleProcessComplete} onProcessStart={handleProcessStart} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Button onClick={handleReset} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <ArrowLeft className="w-4 h-4" />
                  Upload New File
                </Button>
              </div>

              <ResultsDisplay results={results} downloadFilename={downloadFilename} />
            </>
          )}
        </div>
      </main>

      {isProcessing && <ProcessingOverlay fileName={processingFileName || "your file"} />}
    </div>
  )
}
