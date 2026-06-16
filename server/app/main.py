from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import predict, weather, stats, admin

app = FastAPI(title="Urban Traffic Predictor API")

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
