import json
from pathlib import Path

from fastapi import FastAPI
from sqlalchemy import select, text

from app.database import Base, SessionLocal, engine
from app.models import Product, User
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router

app = FastAPI(title="Cross-App Comparison Agent")


@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    seed_catalog()


def seed_catalog() -> None:
    data_dir = Path(__file__).resolve().parents[1] / "data"
    db = SessionLocal()
    try:
        existing_ids = set(db.scalars(select(Product.product_id)).all())
        new_products = []
        for catalog_path in sorted(data_dir.glob("*_products.json")):
            with catalog_path.open(encoding="utf-8") as catalog_file:
                records = json.load(catalog_file)
            new_products.extend(
                Product(**record)
                for record in records
                if record["product_id"] not in existing_ids
            )

        if new_products:
            db.add_all(new_products)
            db.commit()
    finally:
        db.close()


app.include_router(auth_router)
app.include_router(agent_router)


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