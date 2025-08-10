from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil
from pathlib import Path

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = "app/static/uploads"
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


# POST / — Handles image file uploads with validation and storage
# Validates file type against allowed extensions, checks file size limits,
# generates unique filename using UUID, saves file to uploads directory,
# and returns metadata including the accessible URL path
@router.post("/")
async def upload_image(file: UploadFile = File(...)):
  # Validate file type
  file_extension = os.path.splitext(file.filename)[1].lower()
  if file_extension not in ALLOWED_EXTENSIONS:
    raise HTTPException(
      status_code=400,
      detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    )

  # Validate file size
  file.file.seek(0, 2)  # Seek to end of file
  file_size = file.file.tell()  # Get current position (file size)
  file.file.seek(0)  # Reset to beginning

  if file_size > MAX_FILE_SIZE:
    raise HTTPException(
      status_code=400,
      detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024 * 1024)}MB"
    )

  # Generate unique filename
  file_id = str(uuid.uuid4())
  filename = f"{file_id}{file_extension}"
  filepath = os.path.join(UPLOAD_DIR, filename)

  try:
    # Save file
    with open(filepath, "wb") as buffer:
      shutil.copyfileobj(file.file, buffer)

    # Return URL relative to static files
    image_url = f"/static/uploads/{filename}"

    return {
      "url": image_url,
      "filename": filename,
      "size": file_size,
      "type": file.content_type
    }

  except Exception as e:
    # Clean up file if it was partially created
    if os.path.exists(filepath):
      os.remove(filepath)
    raise HTTPException(
      status_code=500,
      detail=f"Failed to save file: {str(e)}"
    )
