import { type NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import path from "path"
import fs from "fs"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API route: Starting file processing")
    console.log("[v0] Current working directory:", process.cwd())

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.error("[v0] API route: No file provided")
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] API route: File received:", file.name, "Size:", file.size, "bytes")

    let buffer: Buffer
    try {
      const arrayBuffer = await file.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
      console.log("[v0] Buffer created successfully, size:", buffer.length)
    } catch (error) {
      console.error("[v0] Error creating buffer:", error)
      throw new Error("Failed to read uploaded file")
    }

    let inputWorkbook: ExcelJS.Workbook
    let inputSheet: ExcelJS.Worksheet
    try {
      inputWorkbook = new ExcelJS.Workbook()
      await inputWorkbook.xlsx.load(buffer)
      inputSheet = inputWorkbook.worksheets[0]
      console.log("[v0] Input workbook loaded, sheet name:", inputSheet.name)
    } catch (error) {
      console.error("[v0] Error loading input workbook:", error)
      throw new Error("Failed to read input Excel file. Make sure it's a valid Excel file.")
    }

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

    const possiblePaths = [
      path.join(process.cwd(), "backend", "Bespoke Model - US - v2.xlsm"),
      path.join(process.cwd(), "Bespoke Model - US - v2.xlsm"),
      path.join(__dirname, "..", "..", "..", "backend", "Bespoke Model - US - v2.xlsm"),
    ]

    console.log("[v0] Checking for template file in possible locations:")
    let templatePath: string | null = null
    for (const p of possiblePaths) {
      console.log("[v0] Checking:", p, "Exists:", fs.existsSync(p))
      if (fs.existsSync(p)) {
        templatePath = p
        break
      }
    }

    if (!templatePath) {
      console.error("[v0] Template file not found in any location")
      console.error("[v0] Checked paths:", possiblePaths)
      return NextResponse.json(
        {
          error: "Template file not found",
          details: "Bespoke Model - US - v2.xlsm must be in the backend folder",
          checkedPaths: possiblePaths,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Loading template from:", templatePath)

    let templateWorkbook: ExcelJS.Workbook
    let outputSheet: ExcelJS.Worksheet
    try {
      templateWorkbook = new ExcelJS.Workbook()
      await templateWorkbook.xlsx.readFile(templatePath)
      outputSheet = templateWorkbook.worksheets[0]
      console.log("[v0] Template loaded successfully, sheet name:", outputSheet.name)
    } catch (error) {
      console.error("[v0] Error loading template:", error)
      throw new Error("Failed to load template file. The file may be corrupted or in an unsupported format.")
    }

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

    let outputBuffer: Buffer
    try {
      outputBuffer = (await templateWorkbook.xlsx.writeBuffer()) as Buffer
      console.log("[v0] Output buffer created, size:", outputBuffer.length)
    } catch (error) {
      console.error("[v0] Error writing output file:", error)
      throw new Error("Failed to generate output file")
    }

    console.log("[v0] Success! Generated file:", outputFilename)

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel.sheet.macroEnabled.12",
        "Content-Disposition": `attachment; filename="${outputFilename}"`,
      },
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
