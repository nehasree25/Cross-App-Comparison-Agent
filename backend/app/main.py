from fastapi import FastAPI
from sqlalchemy import text
from app.database import Base, engine
from app.models import Product, User
from app.routers.auth import router as auth_router

app = FastAPI(title="Cross-App Comparison Agent")


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Cross-App Comparison Agent API is running"
    }
@app.get("/db-test")
def database_test():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

    return {
        "database": "connected",
        "result": result.scalar()
    }