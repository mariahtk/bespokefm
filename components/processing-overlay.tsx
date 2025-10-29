"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2, FileSpreadsheet, Calculator, FileCheck } from "lucide-react"

interface ProcessingOverlayProps {
  fileName: string
}

export function ProcessingOverlay({ fileName }: ProcessingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <div className="rounded-full bg-accent/10 p-6">
                  <Calculator className="w-12 h-12 text-accent" />
                </div>
                <div className="absolute -bottom-1 -right-1">
                  <Loader2 className="w-6 h-6 text-accent animate-spin" />
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Processing Financial Model</h3>
              <p className="text-sm text-muted-foreground">Analyzing your data and generating projections...</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-accent" />
                <span className="text-muted-foreground">Reading file: {fileName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calculator className="w-4 h-4 text-accent animate-pulse" />
                <span className="text-muted-foreground">Calculating 10-year projections</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Generating Excel report</span>
              </div>
            </div>

            <div className="pt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent animate-pulse" style={{ width: "60%" }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
