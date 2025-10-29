import os
import re
import shutil
import tempfile
import subprocess
import win32com.client as win32
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import FileResponse

# --- CONFIG: Private GitHub repo ---
GITHUB_REPO = "https://github.com/username/private-model-repo.git"
GITHUB_PAT = "<YOUR_PERSONAL_ACCESS_TOKEN>"  # read-only is enough
MODEL_FILENAME_IN_REPO = "Bespoke Model - US - v2.xlsm"

app = FastAPI()

def clone_private_repo(tmp_dir):
    repo_url = GITHUB_REPO.replace("https://", f"https://{GITHUB_PAT}@")
    repo_path = os.path.join(tmp_dir, "repo")
    subprocess.run(["git", "clone", repo_url, repo_path], check=True)
    return os.path.join(repo_path, MODEL_FILENAME_IN_REPO)

@app.post("/generate-model/")
async def generate_model(
    file: UploadFile,
    address_raw: str = Form(...),
    additional_info: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    sqft: float = Form(...),
    market_rent: float = Form(...),
    yes_no_value: str = Form(...),
    num_floors: int = Form(...),
):
    try:
        tmp_dir = tempfile.mkdtemp()

        # Save uploaded input workbook
        input_file_path = os.path.join(tmp_dir, file.filename)
        with open(input_file_path, "wb") as f:
            f.write(await file.read())

        # Clone private repo
        model_file_path = clone_private_repo(tmp_dir)

        # Copy model to temp dir
        model_filename_clean = f"{address_raw.replace(' ', '_')}.xlsm"
        working_model_path = os.path.join(tmp_dir, model_filename_clean)
        shutil.copy2(model_file_path, working_model_path)

        # Start Excel
        excel = win32.Dispatch("Excel.Application")
        excel.Visible = False
        excel.DisplayAlerts = False

        # Open input workbook
        wb_input = excel.Workbooks.Open(input_file_path)
        ws_input = wb_input.Worksheets("Sales Team Input Sheet")

        # --- Original Excel logic ---
        address_raw_input = str(ws_input.Range("F7").Value or address_raw).strip()
        additional_info_input = str(ws_input.Range("F9").Value or additional_info).strip()
        latitude_input = ws_input.Range("F13").Value or latitude
        longitude_input = ws_input.Range("F15").Value or longitude
        sqft_input = ws_input.Range("F29").Value or sqft
        brand_input = ws_input.Range("F23").Value
        market_rent_input = ws_input.Range("F37").Value or market_rent
        yes_no_value_input = ws_input.Range("F54").Value or yes_no_value
        num_floors_input = ws_input.Range("F56").Value or num_floors

        wb_model = excel.Workbooks.Open(working_model_path)
        ws_model = wb_model.Worksheets("Sales Team Input Sheet")

        address_clean = address_raw_input.replace("Dr", "Drive").replace("Blvd", "Boulevard")

        ws_model.Range("E6").Value = address_clean
        ws_model.Range("E12").Value = latitude_input
        ws_model.Range("E14").Value = longitude_input
        if sqft_input is not None:
            ws_model.Range("E34").Value = sqft_input

        # Market rent dropdown logic
        if market_rent_input is not None:
            try:
                market_rent_float = float(market_rent_input)
                if market_rent_float == 15:
                    ws_model.Range("K10").Value = "15 - 20"
                elif market_rent_float == 20:
                    ws_model.Range("K10").Value = "20 - 25"
                else:
                    ws_model.Range("K10").Value = market_rent_input
            except ValueError:
                ws_model.Range("K10").Value = market_rent_input

        if yes_no_value_input is not None:
            ws_model.Range("K34").Value = str(yes_no_value_input).strip()
        if num_floors_input is not None:
            ws_model.Range("K36").Value = num_floors_input

        wb_model.Save()
        wb_model.Close(SaveChanges=True)
        wb_input.Close(SaveChanges=False)
        excel.Quit()

        return FileResponse(working_model_path, filename=model_filename_clean)

    except Exception as e:
        return {"error": str(e)}
