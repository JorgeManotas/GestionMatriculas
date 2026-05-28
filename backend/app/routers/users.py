from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("", response_model=list[schemas.UserRead])
def get_users(db: Session = Depends(get_db)) -> list[schemas.UserRead]:
    return crud.list_users(db)


@router.post("", response_model=schemas.UserRead, status_code=201)
def post_user(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> schemas.UserRead:
    return crud.create_user(db, payload)
