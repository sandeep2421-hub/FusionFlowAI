from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, weather, stats, admin

app = FastAPI(title="Urban Traffic Predictor API")

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(predict.router, prefix="/api/predict", tags=["Predict"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(stats.router, prefix="/api", tags=["Stats"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def home():
    return {"message": "Urban Traffic Predictor Backend Running 🚦"}
