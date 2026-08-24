from fastapi import FastAPI

app = FastAPI(title="Cross-App Comparison Agent")
@app.get("/")
def root():
    return {
        "message": "Cross-App Comparison Agent API is running"
    }