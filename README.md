# 🚦 FusionFlowAI - Traffic Congestion Predictor

**FusionFlowAI** is a smart city urban intelligence platform designed to predict traffic volume (measured in **vehicles per hour**) at major high-variance bottlenecks, specifically focusing on the **Silk Board Junction in Bengaluru, KA**. 

The platform merges temporal patterns with real-time weather observations (temperature, humidity, condition) and utilizes an **XGBoost Regressor** model to achieve high-accuracy traffic flow predictions.

---

## 🌟 Key Features

1.  **Dual Machine Learning Architecture**:
    *   *Historic Baseline Model*: Traditional forecasting relying strictly on time-based cycles.
    *   *Fused XGBoost Model*: Advanced predictive modeling integrating live weather telemetry.
2.  **Interactive Live Dashboard**:
    *   **24-Hour Comparative Line Chart**: Side-by-side comparison of temporal baselines, weather-calibrated forecasts, and actual data.
    *   **Hour-by-Hour Congestion Heatmap**: Colored grid layout representing traffic density thresholds (Low, Moderate, High, Critical).
    *   **Model Validation Table**: Compares RMSE and $R^2$ accuracy metrics with literature baselines showing error bounds reduction.
3.  **🎓 Professor Presentation Explainer**: Collapsible card directly on the homepage explaining the math, variables, and regression formulas.
4.  **🔒 Secure Admin Panel**:
    *   **Live Weather Simulation**: Override the weather parameter in real-time (Sunny, Cloudy, Rainy) to show how predictions adapt.
    *   **On-Demand Model Retraining**: Trigger asynchronous training of the XGBoost models directly from the browser.
    *   **Database Ingestion**: Manually append new traffic logging records directly into the database.

---

## 🛠️ Local Installation & Run

We provide simple scripts to install dependencies, generate datasets, train the models, and launch both services.

### Prerequisites
*   Python 3.10+ (Python 3.13 recommended)
*   Node.js 18+

### Execution Instructions
Simply run the startup script from the root folder in your terminal:

*   **Windows (PowerShell)**:
    ```powershell
    ./run_app.ps1
    ```
*   **Windows (Command Prompt)**:
    ```cmd
    run_app.bat
    ```

The script will automatically configure virtual environments, compile Next.js assets, and open the dashboard at `http://localhost:3000`.

---

## 🔒 Accessing the Admin Console
*   **Route**: `http://localhost:3000/admin`
*   **Default Password**: `admin123` *(configurable via environment variables)*

---

## ☁️ Cloud Deployment Guidelines (24/7 Hosting)

To run the application 24/7 on the internet, you can deploy the frontend and backend separately for free:

### 1. Backend FastAPI Service (Render)
1.  Sign up on [Render](https://render.com/).
2.  Create a new **Web Service** and connect your GitHub repository.
3.  Configure these settings:
    *   **Root Directory**: `server`
    *   **Runtime**: `Python`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4.  Add an **Environment Variable**:
    *   `ADMIN_PASSWORD` = `[Your_Secret_Password]` (to secure your admin panel)

### 2. Frontend Next.js Client (Vercel)
1.  Sign up on [Vercel](https://vercel.com/).
2.  Create a new **Project** and import your GitHub repository.
3.  Configure these settings:
    *   **Root Directory**: `client`
    *   **Framework Preset**: `Next.js`
4.  Add the **Environment Variable**:
    *   `NEXT_PUBLIC_API_BASE` = `[URL_of_your_Render_Backend_Service]`
5.  Click **Deploy**. Vercel will build the frontend assets and host it online.

---

## 📐 Mathematical Metrics & Formulations

*   **Root Mean Square Error (RMSE)**:
    $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (y_i - \hat{y}_i)^2}$$
*   **Coefficient of Determination ($R^2$ Score)**:
    $$R^2 = 1 - \frac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$$
*   **Weather categorical Label Encoding**:
    $$\text{Sunny} \rightarrow 0, \quad \text{Cloudy} \rightarrow 1, \quad \text{Rainy} \rightarrow 2$$
