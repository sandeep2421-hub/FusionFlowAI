# app/config.py
import os

ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")  # Default password is admin123
WEATHER_OVERRIDE = None  # Can be "Sunny", "Cloudy", "Rainy", or None
