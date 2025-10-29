# FastAPI Backend for Bespoke Financial Model

## Setup Instructions

### 1. Add Template File

**IMPORTANT**: Place the `Bespoke Model - US - v2.xlsm` template file in the `backend/` directory.

The backend requires this template file to generate the output models.

### 2. Install Python Dependencies

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

### 3. Run the FastAPI Server

\`\`\`bash
python main.py
\`\`\`

The API will be available at `http://localhost:8000`

### 4. Configure Next.js Environment Variable

Create a `.env.local` file in the root directory:

\`\`\`
FASTAPI_URL=http://localhost:8000
\`\`\`

## API Endpoints

- `GET /` - Health check (shows if template file exists)
- `POST /api/process` - Upload and process Bespoke Input Sheet
- `GET /api/download/{filename}` - Download generated model file

## Input File Format

Upload a **Bespoke Input Sheet** (.xlsx or .xlsm) with a "Sales Team Input Sheet" worksheet containing:

- **F7** - Building Address
- **F9** - Additional Info
- **F13** - Latitude
- **F15** - Longitude
- **F23** - Brand
- **F29** - Square Footage
- **F37** - Market Rent
- **F54** - Yes/No Value
- **F56** - Number of Floors

## Output

The API generates a completed **Bespoke Model - US - v2** file with:

- Building address mapped to E6
- Coordinates mapped to E12 and E14
- Square footage mapped to E34
- Market rent logic mapped to K10
- Yes/No value mapped to K34
- Floor count mapped to K36

The output filename will be: `Bespoke Model - US - v2_{timestamp}.xlsm`
