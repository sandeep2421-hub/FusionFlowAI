# app/routers/weather.py
from fastapi import APIRouter
import httpx
import datetime

router = APIRouter()

BANGALORE_LAT = 12.9716
BANGALORE_LON = 77.5946

@router.get("")
async def get_weather():
    """
    Returns live weather data for Bengaluru using Open-Meteo.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={BANGALORE_LAT}&longitude={BANGALORE_LON}"
        f"&current_weather=true"
    )

    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(url, timeout=3.0)
            res.raise_for_status()
            data = res.json()

        cw = data["current_weather"]
        return {
            "city": "Bengaluru",
            "temperature": cw["temperature"],
            "windSpeed": cw["windspeed"],
            "condition": "Sunny" if cw["is_day"] else "Cloudy",
            "timestamp": datetime.datetime.now().isoformat()
        }
    except Exception as e:
        print("Weather API error:", e)
        # return fallback Bengaluru seasonal defaults if Open-Meteo times out or fails
        return {
            "city": "Bengaluru",
            "temperature": 25.0,
            "windSpeed": 10.0,
            "condition": "Sunny",
            "timestamp": datetime.datetime.now().isoformat(),
            "warning": "Telemetry connection timeout. Using seasonal defaults."
        }
