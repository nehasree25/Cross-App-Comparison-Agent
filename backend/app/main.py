from fastapi import FastAPI
from sqlalchemy import text
from database import engine

app = FastAPI(title="Cross-App Comparison Agent")
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