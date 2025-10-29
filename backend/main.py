from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import io
import os
from datetime import datetime
from typing import Dict, Any
import tempfile
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Co-Working Financial Model API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_financial_model(data: pd.DataFrame) -> Dict[str, Any]:
    """
    Process the input data and generate 10-year financial projections
    """
    try:
        # Extract key inputs from the uploaded data
        results = {
            "building_info": {},
            "projections": [],
            "summary": {}
        }
        
        # Extract building information with error handling
        if "Building Address" in data.columns:
            results["building_info"]["address"] = str(data["Building Address"].iloc[0])
        if "Square Footage" in data.columns:
            results["building_info"]["square_footage"] = float(data["Square Footage"].iloc[0])
        if "Floor Count" in data.columns:
            results["building_info"]["floor_count"] = int(data["Floor Count"].iloc[0])
        
        # Generate 10-year projections
        base_year = datetime.now().year
        
        # Extract base values with defaults
        base_revenue = float(data.get("Annual Revenue", pd.Series([500000])).iloc[0]) if "Annual Revenue" in data.columns else 500000
        base_expenses = float(data.get("Annual Expenses", pd.Series([300000])).iloc[0]) if "Annual Expenses" in data.columns else 300000
        growth_rate = float(data.get("Growth Rate", pd.Series([0.05])).iloc[0]) if "Growth Rate" in data.columns else 0.05
        
        # Validate inputs
        if base_revenue <= 0:
            raise ValueError("Annual Revenue must be greater than 0")
        if base_expenses < 0:
            raise ValueError("Annual Expenses cannot be negative")
        if growth_rate < -1 or growth_rate > 1:
            raise ValueError("Growth Rate must be between -1 and 1")
        
        for year in range(10):
            year_num = base_year + year
            revenue = base_revenue * ((1 + growth_rate) ** year)
            expenses = base_expenses * ((1 + growth_rate * 0.8) ** year)
            net_income = revenue - expenses
            
            results["projections"].append({
                "year": year_num,
                "revenue": round(revenue, 2),
                "expenses": round(expenses, 2),
                "net_income": round(net_income, 2),
                "roi": round((net_income / revenue) * 100, 2) if revenue > 0 else 0
            })
        
        # Calculate summary metrics
        total_revenue = sum(p["revenue"] for p in results["projections"])
        total_expenses = sum(p["expenses"] for p in results["projections"])
        total_net_income = sum(p["net_income"] for p in results["projections"])
        
        results["summary"] = {
            "total_10_year_revenue": round(total_revenue, 2),
            "total_10_year_expenses": round(total_expenses, 2),
            "total_10_year_net_income": round(total_net_income, 2),
            "average_annual_roi": round((total_net_income / total_revenue) * 100, 2) if total_revenue > 0 else 0
        }
        
        return results
    
    except Exception as e:
        logger.error(f"Error in calculate_financial_model: {str(e)}")
        raise

def generate_excel_output(results: Dict[str, Any]) -> bytes:
    """
    Generate an Excel file with the financial projections
    """
    try:
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            # Building Info Sheet
            building_df = pd.DataFrame([results["building_info"]])
            building_df.to_excel(writer, sheet_name='Building Info', index=False)
            
            # Projections Sheet
            projections_df = pd.DataFrame(results["projections"])
            projections_df.to_excel(writer, sheet_name='10-Year Projections', index=False)
            
            # Summary Sheet
            summary_df = pd.DataFrame([results["summary"]])
            summary_df.to_excel(writer, sheet_name='Summary', index=False)
        
        output.seek(0)
        return output.getvalue()
    
    except Exception as e:
        logger.error(f"Error in generate_excel_output: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "Co-Working Financial Model API", "status": "running"}

@app.post("/api/process")
async def process_file(file: UploadFile = File(...)):
    """
    Process uploaded Excel/CSV file and return financial projections
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
            
        valid_extensions = ('.xlsx', '.xls', '.xlsm', '.xlsb', '.xltx', '.xltm', '.csv')
        if not file.filename.lower().endswith(valid_extensions):
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Please upload an Excel file (.xlsx, .xls, .xlsm, .xlsb, .xltx, .xltm) or CSV file."
            )
        
        logger.info(f"Processing file: {file.filename}")
        
        # Read the uploaded file
        contents = await file.read()
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        try:
            if file.filename.lower().endswith('.csv'):
                data = pd.read_csv(io.BytesIO(contents))
            else:
                # openpyxl handles .xlsx, .xlsm, .xltx, .xltm
                # xlrd handles .xls, .xlsb (older formats)
                data = pd.read_excel(io.BytesIO(contents), engine=None)  # Auto-detect engine
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
        if data.empty:
            raise HTTPException(status_code=400, detail="The uploaded file contains no data")
        
        # Process the data and generate financial model
        try:
            results = calculate_financial_model(data)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Generate Excel output
        try:
            excel_bytes = generate_excel_output(results)
        except Exception as e:
            logger.error(f"Error generating Excel: {str(e)}")
            raise HTTPException(status_code=500, detail="Error generating Excel file")
        
        # Save to temporary file
        temp_dir = tempfile.gettempdir()
        output_filename = f"financial_model_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        output_path = os.path.join(temp_dir, output_filename)
        
        with open(output_path, 'wb') as f:
            f.write(excel_bytes)
        
        logger.info(f"Successfully processed file: {file.filename}")
        
        # Return results with download URL
        return {
            "success": True,
            "results": results,
            "download_filename": output_filename,
            "message": "Financial model generated successfully"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error processing file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/api/download/{filename}")
async def download_file(filename: str):
    """
    Download the generated Excel file
    """
    try:
        # Validate filename to prevent directory traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        temp_dir = tempfile.gettempdir()
        file_path = os.path.join(temp_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found or has expired")
        
        logger.info(f"Downloading file: {filename}")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error downloading file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
