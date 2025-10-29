# FastAPI Backend for Co-Working Financial Model

## Setup Instructions

### 1. Install Python Dependencies

\`\`\`bash
cd backend
pip install -r requirements.txt
\`\`\`

### 2. Run the FastAPI Server

\`\`\`bash
python main.py
\`\`\`

The API will be available at `http://localhost:8000`

### 3. Configure Next.js Environment Variable

Create a `.env.local` file in the root directory:

\`\`\`
FASTAPI_URL=http://localhost:8000
\`\`\`

## API Endpoints

- `GET /` - Health check
- `POST /api/process` - Upload and process Excel/CSV file
- `GET /api/download/{filename}` - Download generated Excel file

## Input File Format

Your Excel/CSV file should contain the following columns:

- **Building Address** - Full address of the property
- **Square Footage** - Total square footage
- **Floor Count** - Number of floors
- **Annual Revenue** - Base annual revenue
- **Annual Expenses** - Base annual expenses
- **Growth Rate** - Expected annual growth rate (e.g., 0.05 for 5%)

## Output

The API generates a comprehensive Excel file with three sheets:

1. **Building Info** - Property details
2. **10-Year Projections** - Year-by-year financial projections
3. **Summary** - Aggregate metrics and ROI calculations
