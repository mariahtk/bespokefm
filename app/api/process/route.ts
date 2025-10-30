import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import path from "path"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route: Receiving file upload request")

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] API route: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] API route: File received:", file.name, "Size:", file.size, "bytes")

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Load the input workbook
    const inputWorkbook = new ExcelJS.Workbook()
    await inputWorkbook.xlsx.load(buffer)
    const inputSheet = inputWorkbook.worksheets[0]

    console.log("[v0] Reading input values from cells...")

    // Read values from input sheet (matching original Python script)
    const address = inputSheet.getCell("F7").value?.toString() || ""
    const additionalInfo = inputSheet.getCell("F9").value?.toString() || ""
    const latitude = inputSheet.getCell("F13").value?.toString() || ""
    const longitude = inputSheet.getCell("F15").value?.toString() || ""
    const sqft = inputSheet.getCell("F29").value?.toString() || ""
    const marketRent = inputSheet.getCell("F37").value?.toString() || ""
    const yesNoValue = inputSheet.getCell("F54").value?.toString() || ""
    const numFloors = inputSheet.getCell("F56").value?.toString() || ""

    console.log("[v0] Input values:", {
      address,
      additionalInfo,
      latitude,
      longitude,
      sqft,
      marketRent,
      yesNoValue,
      numFloors,
    })

    // Load the template model
    const templatePath = path.join(process.cwd(), "backend", "Bespoke Model - US - v2.xlsm")

    if (!fs.existsSync(templatePath)) {
      console.error("[v0] Template file not found at:", templatePath)
      return NextResponse.json(
        {
          error: "Template file not found",
          details: "Bespoke Model - US - v2.xlsm must be in the backend folder",
        },
        { status: 500 },
      )
    }

    console.log("[v0] Loading template from:", templatePath)

    const templateWorkbook = new ExcelJS.Workbook()
    await templateWorkbook.xlsx.readFile(templatePath)
    const outputSheet = templateWorkbook.worksheets[0]

    console.log("[v0] Mapping values to output cells...")

    // Map values to output sheet (matching original Python script)
    outputSheet.getCell("E6").value = address
    outputSheet.getCell("E12").value = latitude
    outputSheet.getCell("E14").value = longitude
    outputSheet.getCell("E34").value = sqft

    // Special logic for market rent (K10)
    if (marketRent) {
      const rentValue = Number.parseFloat(marketRent.replace(/[^0-9.-]/g, ""))
      if (!isNaN(rentValue)) {
        outputSheet.getCell("K10").value = rentValue
      }
    }

    outputSheet.getCell("K34").value = yesNoValue
    outputSheet.getCell("K36").value = numFloors

    console.log("[v0] Saving output file...")

    // Generate output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
    const outputFilename = `Bespoke Model - US - v2_${timestamp}.xlsm`

    // Save to buffer
    const outputBuffer = await templateWorkbook.xlsx.writeBuffer()

    console.log("[v0] Success! Generated file:", outputFilename)

    return NextResponse.json({
      success: true,
      download_filename: outputFilename,
      message: "File processed successfully",
    })
  } catch (error) {
    console.error("[v0] API route: Error processing file:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
