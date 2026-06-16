import pandas as pd
import numpy as np
import datetime
import os

# Create directory for data if it doesn't exist
os.makedirs("app/data", exist_ok=True)

start_date = datetime.date(2015, 1, 1)
end_date = datetime.date(2027, 12, 31)
date_range = pd.date_range(start_date, end_date)

print(f"Generating data from {start_date} to {end_date}...")

# 1. Generate daily weather data
weather_records = []
np.random.seed(42)

for date in date_range:
    month = date.month
    # Bengaluru weather simulation
    # Summer (Mar-May): hotter, Monsoon (Jun-Sep): rainy/cloudy/humid, Winter (Oct-Feb): cooler
    if month in [3, 4, 5]:
        base_temp = 28.0
        rain_prob = 0.15
        base_humidity = 50.0
    elif month in [6, 7, 8, 9]:
        base_temp = 24.0
        rain_prob = 0.60
        base_humidity = 80.0
    else:
        base_temp = 22.0
        rain_prob = 0.20
        base_humidity = 60.0
        
    temp = base_temp + np.random.normal(0, 3.0)
    humidity = base_humidity + np.random.normal(0, 10.0)
    humidity = np.clip(humidity, 10.0, 100.0)
    
    # Conditions: Sunny, Cloudy, Rainy
    rand = np.random.rand()
    if rand < rain_prob:
        condition = "Rainy"
        humidity = np.clip(humidity + 15, 75, 100)
        temp -= 2.0
    elif rand < rain_prob + 0.3:
        condition = "Cloudy"
    else:
        condition = "Sunny"
        
    weather_records.append({
        "Date": date.strftime("%Y-%m-%d"),
        "Temperature": round(temp, 1),
        "Humidity": round(humidity, 1),
        "WeatherCondition": condition
    })

weather_df = pd.DataFrame(weather_records)
weather_df.to_csv("app/data/weather.csv", index=False)
print("Saved app/data/weather.csv")

# 2. Generate hourly traffic data
traffic_records = []

# Define standard hourly profiles
# Weekday peak hours: morning (8-10 AM) and evening (5-8 PM)
# Weekend peaks are more spread out in afternoon
def get_traffic_volume(hour, dayofweek, temp, humidity, condition):
    # Base pattern
    if dayofweek < 5:  # Weekday
        if 8 <= hour <= 10:
            base = 45.0
        elif 17 <= hour <= 20:
            base = 50.0
        elif 11 <= hour <= 16:
            base = 28.0
        elif 0 <= hour <= 5:
            base = 8.0
        else:
            base = 18.0
    else:  # Weekend
        if 12 <= hour <= 19:
            base = 35.0
        elif 0 <= hour <= 5:
            base = 12.0
        else:
            base = 20.0
            
    # Add weather effects (Rainy condition increases congestion/vehicles count)
    weather_mod = 0.0
    if condition == "Rainy":
        weather_mod += 12.0  # significant increase in traffic density/vehicles
    elif condition == "Cloudy":
        weather_mod += 3.0
        
    # Temperature effect
    if temp > 32.0:
        weather_mod += 2.0  # slightly more cars
        
    # Humidity effect
    if humidity > 85.0:
        weather_mod += 2.0
        
    # Random variation
    noise = np.random.normal(0, 3.0)
    
    val = base + weather_mod + noise
    return max(1.0, round(val, 2))

# We will generate hourly records
print("Generating hourly traffic records...")
for date in date_range:
    dayofweek = date.weekday()
    # Find matching weather record
    weather_info = weather_df[weather_df["Date"] == date.strftime("%Y-%m-%d")].iloc[0]
    temp = weather_info["Temperature"]
    humidity = weather_info["Humidity"]
    condition = weather_info["WeatherCondition"]
    
    for hour in range(24):
        dt = datetime.datetime(date.year, date.month, date.day, hour, 0, 0)
        vehicles = get_traffic_volume(hour, dayofweek, temp, humidity, condition)
        
        traffic_records.append({
            "DateTime": dt.strftime("%Y-%m-%d %H:%M:%S"),
            "Vehicles": vehicles
        })

traffic_df = pd.DataFrame(traffic_records)
traffic_df.to_csv("app/data/traffic.csv", index=False)
print("Saved app/data/traffic.csv")
print("Data generation complete!")
