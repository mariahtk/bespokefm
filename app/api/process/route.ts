import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Forward the file to FastAPI backend
    const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000"
    const apiFormData = new FormData()
    apiFormData.append("file", file)

    const response = await fetch(`${fastApiUrl}/api/process`, {
      method: "POST",
      body: apiFormData,
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ error: error.detail || "Failed to process file" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error processing file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
