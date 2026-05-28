from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.config import get_settings
from app.database import SessionLocal
from app.routers import enrollments, payments, roles, users


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="API para gestion de matriculas, mensualidades y pagos de un colegio privado.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(roles.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(enrollments.router, prefix="/api")
app.include_router(payments.router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    try:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError:
        return {"status": "degraded", "database": "unavailable"}
