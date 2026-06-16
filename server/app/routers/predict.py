# app/routers/predict.py
from fastapi import APIRouter, Request
import joblib
import pandas as pd
import datetime
import numpy as np
from sklearn.metrics import mean_squared_error
from sklearn.preprocessing import LabelEncoder
import httpx

router = APIRouter()

# ---------------------------
# Load trained models
# ---------------------------
historic_model = joblib.load("app/models/historic_model.pkl")
fused_model = joblib.load("app/models/fused_model.pkl")

# ---------------------------
# Load datasets
# ---------------------------
traffic_df = pd.read_csv("app/data/traffic.csv", parse_dates=["DateTime"])
weather_df = pd.read_csv("app/data/weather.csv", parse_dates=["Date"])

# Normalize weather columns
weather_df.rename(columns={
    "Temperature": "temperature",
    "Humidity": "humidity",
    "WeatherCondition": "condition"
}, inplace=True)

# Encode condition if exists
if "condition" in weather_df.columns:
    le = LabelEncoder()
    weather_df["condition_encoded"] = le.fit_transform(weather_df["condition"].astype(str))
else:
    weather_df["condition_encoded"] = 0


# ---------------------------
# Helper: Fetch live weather
# ---------------------------
async def get_live_weather():
    """Fetch current weather for Bengaluru via Open-Meteo"""
    url = (
        "https://api.open-meteo.com/v1/forecast?"
        "latitude=12.9716&longitude=77.5946"
        "&current_weather=true"
    )
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=3.0)
            res.raise_for_status()
            data = res.json()
            cw = data["current_weather"]
            return {
                "temperature": cw["temperature"],
                "humidity": 55,  # humidity not directly provided by API
                "condition_encoded": 1 if cw["is_day"] else 0
            }
    except Exception as e:
        print("Weather API error:", e)
        # fallback defaults
        return {"temperature": 25, "humidity": 55, "condition_encoded": 0}


# ---------------------------
# Prediction route
# ---------------------------
@router.post("")
async def predict(request: Request):
    body = await request.json()
    date_str = body.get("date")

    if not date_str:
        return {"error": "Date is required in format YYYY-MM-DD"}

    try:
        date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return {"error": "Invalid date format. Use YYYY-MM-DD."}

    # Check if traffic data exists for that date
    actual_day = traffic_df[traffic_df["DateTime"].dt.date == date_obj].copy()
    has_actual = not actual_day.empty

    if has_actual:
        actual_day["hour"] = actual_day["DateTime"].dt.hour

    # Get weather for that date — check admin simulation override first
    from app import config
    if config.WEATHER_OVERRIDE is not None:
        cond_str = config.WEATHER_OVERRIDE
        if cond_str == "Sunny":
            temp, humidity, condition_encoded = 28.0, 50.0, 0
        elif cond_str == "Cloudy":
            temp, humidity, condition_encoded = 24.0, 65.0, 1
        else:  # Rainy
            temp, humidity, condition_encoded = 22.0, 90.0, 2
            
        live_weather = {
            "temperature": temp,
            "humidity": humidity,
            "condition_encoded": condition_encoded
        }
        weather_info = None
    else:
        live_weather = await get_live_weather()
        weather_day = weather_df[weather_df["Date"] == pd.to_datetime(date_obj)]
        weather_info = weather_day.iloc[0] if not weather_day.empty else None

    results = []
    actuals, hist_preds, fused_preds = [], [], []

    for hour in range(24):
        # Historical-only model
        X_hist = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month
        }])
        hist_pred = float(historic_model.predict(X_hist)[0])

        # Fused model (time + weather)
        temp = live_weather["temperature"] if live_weather else (
            weather_info["temperature"] if weather_info is not None else 25
        )
        humidity = live_weather["humidity"] if live_weather else (
            weather_info["humidity"] if weather_info is not None else 55
        )
        condition = live_weather["condition_encoded"] if live_weather else (
            weather_info["condition_encoded"] if weather_info is not None else 0
        )

        X_fused = pd.DataFrame([{
            "hour": hour,
            "dayofweek": date_obj.weekday(),
            "month": date_obj.month,
            "temperature": temp,
            "humidity": humidity,
            "condition_encoded": condition
        }])

        fused_pred = float(fused_model.predict(X_fused)[0])

        row = {"hour": hour, "historical": hist_pred, "fused": fused_pred}

        # Add actual values if available
        if has_actual and hour in actual_day["DateTime"].dt.hour.values:
            actual_val = float(actual_day.loc[actual_day["hour"] == hour, "Vehicles"].mean())
            row["actual"] = actual_val
            actuals.append(actual_val)
            hist_preds.append(hist_pred)
            fused_preds.append(fused_pred)

        results.append(row)

    # Compute metrics only if actuals exist
    metrics = {}
    if has_actual and actuals:
        hist_rmse = np.sqrt(mean_squared_error(actuals, hist_preds))
        fused_rmse = np.sqrt(mean_squared_error(actuals, fused_preds))
        improvement = ((hist_rmse - fused_rmse) / hist_rmse * 100) if hist_rmse > 0 else 0
        metrics = {
            "historical_rmse": round(hist_rmse, 3),
            "fused_rmse": round(fused_rmse, 3),
            "improvement": round(improvement, 2)
        }
    else:
        metrics = None

    response = {
        "date": date_str,
        "predictions": results,
        "metrics": metrics
    }

    return response
