import json
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text

from app.database import Base, SessionLocal, engine
from app.models import Product, User
from app.routers.agent import router as agent_router
from app.routers.auth import router as auth_router
from app.routers.orders import router as orders_router
from app.routers.dashboard import router as dashboard_router
from app.routers.admin import router as admin_router

app = FastAPI(title="Cross-App Comparison Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_tables() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_comparison_category()
    ensure_orders_schema()
    seed_catalog()


def ensure_comparison_category() -> None:
    with engine.begin() as connection:
        columns = connection.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'comparison_sessions'
                  AND column_name = 'category'
                """
            )
        ).all()
        if columns:
            return

        connection.execute(
            text("ALTER TABLE comparison_sessions ADD COLUMN category VARCHAR(100)")
        )
        connection.execute(
            text(
                """
                UPDATE comparison_sessions AS sessions
                SET category = COALESCE(
                    (
                        SELECT products.category
                        FROM products
                        WHERE products.product_id IN (
                            SELECT jsonb_array_elements_text(
                                sessions.product_ids::jsonb
                            )
                        )
                        LIMIT 1
                    ),
                    'Unknown'
                )
                WHERE sessions.category IS NULL
                """
            )
        )
        connection.execute(
            text(
                "ALTER TABLE comparison_sessions ALTER COLUMN category SET NOT NULL"
            )
        )


def ensure_orders_schema() -> None:
    """Ensure orders table has all required columns for payment workflow."""
    with engine.begin() as connection:
        # Check if razorpay_payment_id column exists
        razorpay_payment_id_exists = connection.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'orders'
                  AND column_name = 'razorpay_payment_id'
                """
            )
        ).all()
        
        if not razorpay_payment_id_exists:
            connection.execute(
                text(
                    """
                    ALTER TABLE orders
                    ADD COLUMN razorpay_payment_id VARCHAR(100) NULL
                    """
                )
            )
        
        # Check if checkout_at column exists
        checkout_at_exists = connection.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'orders'
                  AND column_name = 'checkout_at'
                """
            )
        ).all()
        
        if not checkout_at_exists:
            connection.execute(
                text(
                    """
                    ALTER TABLE orders
                    ADD COLUMN checkout_at TIMESTAMP WITH TIME ZONE NULL
                    """
                )
            )
        
        # Check if payment_at column exists
        payment_at_exists = connection.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'orders'
                  AND column_name = 'payment_at'
                """
            )
        ).all()
        
        if not payment_at_exists:
            connection.execute(
                text(
                    """
                    ALTER TABLE orders
                    ADD COLUMN payment_at TIMESTAMP WITH TIME ZONE NULL
                    """
                )
            )
        
        # Check if payment_status column exists
        payment_status_exists = connection.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'orders'
                  AND column_name = 'payment_status'
                """
            )
        ).all()
        
        if not payment_status_exists:
            connection.execute(
                text(
                    """
                    ALTER TABLE orders
                    ADD COLUMN payment_status VARCHAR(50) NOT NULL DEFAULT 'PAYMENT_PENDING'
                    """
                )
            )


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
app.include_router(orders_router)
app.include_router(dashboard_router)
app.include_router(admin_router)