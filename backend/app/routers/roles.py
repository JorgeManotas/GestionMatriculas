from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("", response_model=list[schemas.RoleRead])
def get_roles(db: Session = Depends(get_db)) -> list[schemas.RoleRead]:
    return crud.list_roles(db)
