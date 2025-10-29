import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  try {
    const { filename } = await params

    // Forward the download request to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000"
    const response = await fetch(`${fastApiUrl}/api/download/${filename}`)

    if (!response.ok) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Stream the file back to the client
    const blob = await response.blob()

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
