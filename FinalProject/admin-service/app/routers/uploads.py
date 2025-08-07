from fastapi import APIRouter, UploadFile, File
import os, uuid, shutil

router = APIRouter()
UPLOAD_DIR = "app/static/uploads"

@router.post("/")
async def upload_image(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"url": f"/static/uploads/{filename}"}
