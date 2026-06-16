import pandas as pd
import numpy as np
import joblib
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
import os

print("🚦 Starting model training...")

# ---------------------------
# 1. Load datasets
# ---------------------------
traffic_path = "app/data/traffic.csv"
weather_path = "app/data/weather.csv"

if not os.path.exists(traffic_path) or not os.path.exists(weather_path):
    raise FileNotFoundError("❌ Missing data files in app/data/. Ensure both traffic.csv and weather.csv exist.")

traffic_df = pd.read_csv(traffic_path, parse_dates=["DateTime"])
weather_df = pd.read_csv(weather_path, parse_dates=["Date"])

# Normalize columns
weather_df.rename(columns={
    "Temperature": "temperature",
    "Humidity": "humidity",
    "WeatherCondition": "condition"
}, inplace=True)

# Match date format
traffic_df["Date"] = traffic_df["DateTime"].dt.date
weather_df["Date"] = pd.to_datetime(weather_df["Date"]).dt.date

# Merge datasets
merged_df = traffic_df.merge(weather_df, on="Date", how="left")

# ---------------------------
# 2. Feature Engineering
# ---------------------------
for df in [traffic_df, merged_df]:
    df["hour"] = df["DateTime"].dt.hour
    df["dayofweek"] = df["DateTime"].dt.dayofweek
    df["month"] = df["DateTime"].dt.month

# Encode condition
if "condition" in merged_df.columns:
    le = LabelEncoder()
    merged_df["condition_encoded"] = le.fit_transform(merged_df["condition"].astype(str))
else:
    merged_df["condition_encoded"] = 0

# Fill missing values
for col in ["temperature", "humidity"]:
    merged_df[col] = merged_df[col].fillna(merged_df[col].mean())

merged_df["condition_encoded"] = merged_df["condition_encoded"].fillna(
    merged_df["condition_encoded"].mode()[0]
)

# ---------------------------
# 3. Historic-only model
# ---------------------------
X_hist = traffic_df[["hour", "dayofweek", "month"]]
y_hist = traffic_df["Vehicles"]

X_train, X_test, y_train, y_test = train_test_split(
    X_hist, y_hist, test_size=0.2, random_state=42
)

hist_model = XGBRegressor(
    n_estimators=200, learning_rate=0.1, max_depth=6, random_state=42
)
hist_model.fit(X_train, y_train)

y_pred_hist = hist_model.predict(X_test)
hist_r2 = r2_score(y_test, y_pred_hist)
hist_rmse = np.sqrt(mean_squared_error(y_test, y_pred_hist))

print(f"📊 Historic Model → R2: {hist_r2:.3f}, RMSE: {hist_rmse:.3f}")

joblib.dump(hist_model, "app/models/historic_model.pkl")

# ---------------------------
# 4. Fused model (with weather)
# ---------------------------
X_fused = merged_df[["hour", "dayofweek", "month", "temperature", "humidity", "condition_encoded"]]
y_fused = merged_df["Vehicles"]

X_train, X_test, y_train, y_test = train_test_split(
    X_fused, y_fused, test_size=0.2, random_state=42
)

fused_model = XGBRegressor(
    n_estimators=200, learning_rate=0.1, max_depth=6, random_state=42
)
fused_model.fit(X_train, y_train)

y_pred_fused = fused_model.predict(X_test)
fused_r2 = r2_score(y_test, y_pred_fused)
fused_rmse = np.sqrt(mean_squared_error(y_test, y_pred_fused))

print(f"🤖 Fused Model → R2: {fused_r2:.3f}, RMSE: {fused_rmse:.3f}")

# ---------------------------
# 5. Save models + summary
# ---------------------------
os.makedirs("app/models", exist_ok=True)
joblib.dump(fused_model, "app/models/fused_model.pkl")

summary = {
    "historic_model": {"r2": hist_r2, "rmse": hist_rmse},
    "fused_model": {"r2": fused_r2, "rmse": fused_rmse},
    "improvement_%": ((hist_rmse - fused_rmse) / hist_rmse * 100) if hist_rmse > 0 else 0
}

print("✅ Models trained and saved successfully!")
print(f"📈 RMSE Improvement: {summary['improvement_%']:.2f}%")

joblib.dump(summary, "app/models/training_summary.pkl")
