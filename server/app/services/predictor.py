import pandas as pd
import joblib
import datetime

# Load datasets + models
traffic_df = pd.read_csv("app/data/traffic.csv", parse_dates=["DateTime"])
weather_df = pd.read_csv("app/data/weather.csv", parse_dates=["Date"])

historic_model = joblib.load("app/models/historic_model.pkl")
fused_model = joblib.load("app/models/fused_model.pkl")

def predict_traffic(date_str: str):
    """
    Predict traffic for all 24 hours of a given date.
    Returns list of {hour, historical, fused, actual}.
    """
    date_obj = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
    day = date_obj.weekday()
    month = date_obj.month

    # Filter traffic for that date
    actual_day = traffic_df[traffic_df["DateTime"].dt.date == date_obj].copy()
    actual_day["hour"] = actual_day["DateTime"].dt.hour

    # Get weather row for that date
    weather_info = weather_df[weather_df["Date"] == date_obj]
    if not weather_info.empty:
        weather_info = weather_info.iloc[0].to_dict()
    else:
        # Defaults if weather is missing
        weather_info = {"Temperature": 20, "Humidity": 50, "WeatherCondition": "Clear"}

    results = []
    for hour in range(24):
        # Historic prediction
        hist_features = [[hour, day, month]]
        hist_pred = historic_model.predict(hist_features)[0]

        # Fused prediction
        fused_features = [[
            hour,
            day,
            month,
            weather_info.get("Temperature", 20),
            weather_info.get("Humidity", 50),
            0  # condition_encoded placeholder (your model trained with this column)
        ]]
        fused_pred = fused_model.predict(fused_features)[0]

        # Actual traffic if available
        actual = None
        if hour in actual_day["hour"].values:
            actual = float(actual_day.loc[actual_day["hour"] == hour, "Vehicles"].mean())

        results.append({
            "hour": hour,
            "actual": actual,
            "historical": float(hist_pred),
            "fused": float(fused_pred),
        })

    return {
        "date": date_str,
        "predictions": results,
        "factors": {
            "dayOfWeek": date_obj.strftime("%A"),
            "month": month,
            "weather": weather_info.get("WeatherCondition", "Unknown")
        }
    }
