/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  TrendingUp,
  Activity,
  CloudSun,
  Wind,
  ShieldCheck,
  Database,
  Award,
  Clock,
  MapPin,
  RefreshCw,
  Download,
  Info,
  TrendingDown,
  Terminal,
  HelpCircle
} from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

// Custom Components
import { KPICard } from "@/components/KPICard"
import { CongestionBadge } from "@/components/CongestionBadge"
import { WeeklyChart } from "@/components/WeeklyChart"
import { HeatmapGrid } from "@/components/HeatmapGrid"
import { AIInsights } from "@/components/AIInsights"

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [predictionData, setPredictionData] = useState<any>(null)
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "alert" } | null>(null)
  
  // Weather state
  const [weatherData, setWeatherData] = useState<any>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  // Backend Health & API stats states
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null)
  const [isCheckingHealth, setIsCheckingHealth] = useState(false)
  const [modelStats, setModelStats] = useState<any>(null)
  const [weeklyForecast, setWeeklyForecast] = useState<any>(null)
  const [congestionToday, setCongestionToday] = useState<any>(null)
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(false)
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState<"chart" | "heatmap" | "metrics">("chart")
  const [currentTime, setCurrentTime] = useState("")
  const [currentSlotLabel, setCurrentSlotLabel] = useState("")
  const [isExplainerOpen, setIsExplainerOpen] = useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

  // Live Clock & Current Time Slot
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
      
      const hour = now.getHours()
      if (hour <= 5) setCurrentSlotLabel("Night Flow")
      else if (hour <= 9) setCurrentSlotLabel("Morning Rush 🌅")
      else if (hour <= 11) setCurrentSlotLabel("Late Morning Flow")
      else if (hour <= 13) setCurrentSlotLabel("Noon Buffer")
      else if (hour <= 16) setCurrentSlotLabel("Afternoon Flow")
      else if (hour <= 20) setCurrentSlotLabel("Evening Rush 🌇")
      else setCurrentSlotLabel("Night Flow")
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  // Page intro animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => setIsLoading(false), 800)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Fetch API Health & Performance Stats
  const checkHealthAndStats = async () => {
    setIsCheckingHealth(true)
    try {
      const resHealth = await fetch(`${API_BASE}/api/health`)
      const dataHealth = await resHealth.json()
      if (dataHealth.status === "ok") {
        setIsBackendHealthy(true)
      } else {
        setIsBackendHealthy(false)
      }
    } catch {
      setIsBackendHealthy(false)
    } finally {
      setIsCheckingHealth(false)
    }

    try {
      const resStats = await fetch(`${API_BASE}/api/stats`)
      const dataStats = await resStats.json()
      setModelStats(dataStats)
    } catch (err) {
      console.error("Failed to load model stats:", err)
    }
  }

  // Fetch Live Weather & Today's Congestion
  const fetchWeatherAndCongestion = async () => {
    setIsLoadingWeather(true)
    try {
      const response = await fetch(`${API_BASE}/api/weather`)
      const data = await response.json()
      setWeatherData(data)
    } catch (err) {
      console.error("Failed to fetch weather:", err)
    } finally {
      setIsLoadingWeather(false)
    }

    try {
      const resCongestion = await fetch(`${API_BASE}/api/congestion`)
      const dataCongestion = await resCongestion.json()
      setCongestionToday(dataCongestion)
    } catch (err) {
      console.error("Failed to fetch current congestion:", err)
    }
  }

  // Fetch Weekly Forecast (Trend Chart)
  const fetchWeeklyForecastData = async () => {
    setIsLoadingWeekly(true)
    try {
      const resWeekly = await fetch(`${API_BASE}/api/weekly`)
      const dataWeekly = await resWeekly.json()
      setWeeklyForecast(dataWeekly.weekly)
    } catch (err) {
      console.error("Failed to fetch weekly forecast:", err)
    } finally {
      setIsLoadingWeekly(false)
    }
  }

  useEffect(() => {
    checkHealthAndStats()
    fetchWeatherAndCongestion()
    fetchWeeklyForecastData()
    // Poll health every 30 seconds
    const interval = setInterval(checkHealthAndStats, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showNotification = (
    message: string,
    type: "error" | "success" | "alert" = "success"
  ) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  // Predict Traffic with Retry Logic
  const handlePredictTraffic = async (isRetry = false) => {
    if (!selectedDate) {
      showNotification("⚠️ Please select a date", "error")
      return
    }

    // Date range validation
    const yr = new Date(selectedDate).getFullYear()
    if (yr < 2015 || yr > 2027) {
      showNotification("❌ Selected date must be between 2015 and 2027", "error")
      return
    }

    setIsLoadingPrediction(true)
    try {
      const response = await fetch(`${API_BASE}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      })

      if (!response.ok) {
        throw new Error("HTTP request failed")
      }

      const data = await response.json()

      if (data.error) {
        showNotification(`❌ ${data.error}`, "error")
        setPredictionData(null)
        return
      }

      if (!data || !Array.isArray(data.predictions)) {
        showNotification("❌ Received invalid prediction response from server.", "error")
        setPredictionData(null)
        return
      }

      setPredictionData(data)
      if (!data.metrics) {
        showNotification("⚠️ Historical data missing — showcasing predictions only.", "alert")
      } else {
        showNotification("✅ Traffic predictions generated successfully!", "success")
      }
    } catch (err) {
      if (!isRetry) {
        // Auto-retry once after 1 second
        showNotification("⚠️ Fetching timed out. Retrying in 1s...", "alert")
        setTimeout(() => handlePredictTraffic(true), 1000)
      } else {
        showNotification("❌ Failed to predict traffic. Check backend service.", "error")
      }
    } finally {
      setIsLoadingPrediction(false)
    }
  }

  // Export Report to CSV
  const handleExportCSV = () => {
    if (!predictionData || !predictionData.predictions) return

    const headers = ["Hour", "Historical Prediction (veh/h)", "Fused Prediction (veh/h)", "Actual Count (veh/h)"]
    const rows = predictionData.predictions.map((p: any) => [
      p.hour,
      p.historical.toFixed(1),
      p.fused.toFixed(1),
      p.actual !== undefined && p.actual !== null ? p.actual.toFixed(1) : "N/A"
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `FusionFlow_Report_${predictionData.date}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotification("📥 Report downloaded successfully!", "success")
  }

  if (isLoading) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#090b11] transition-opacity duration-800 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="text-center space-y-6 animate-pulse">
          <div className="relative w-16 h-16 mx-auto">
            <TrendingUp className="w-16 h-16 text-primary absolute animate-bounce" />
            <Activity className="w-16 h-16 text-accent absolute opacity-40 animate-ping" />
          </div>
          <h1 className="text-3xl font-bold tracking-wider text-foreground font-display">FUSIONFLOW AI</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono">Loading Urban Intelligent Systems...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid-pattern">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`fixed top-6 right-6 px-5 py-3 rounded-lg shadow-xl z-[9999] text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border ${
              notification.type === "error" 
                ? "bg-rose-950/90 border-rose-500/50 text-rose-200" 
                : notification.type === "success" 
                  ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-200" 
                  : "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              notification.type === "error" 
                ? "bg-rose-500" 
                : notification.type === "success" 
                  ? "bg-emerald-400" 
                  : "bg-cyan-400"
            }`} />
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SECTION 1: HERO HEADER */}
      <header className="glass-header">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground font-display">FUSIONFLOW AI</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/20 text-foreground/80 font-mono font-medium">v2.1</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Bengaluru Smart Traffic Intelligence Platform</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <nav className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/20">
              <Link href="/" className="px-3 py-1.5 rounded-md bg-muted text-foreground text-xs font-semibold">
                Dashboard
              </Link>
              <Link href="/about" className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground text-xs">
                About Model
              </Link>
              <Link href="/admin" className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground text-xs">
                Admin Panel
              </Link>
            </nav>

            <div className="flex items-center gap-3 bg-muted/20 border border-border/20 px-3 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span className="font-mono text-foreground">{currentTime || "00:00:00 AM"}</span>
            </div>

            <button 
              onClick={checkHealthAndStats} 
              disabled={isCheckingHealth}
              className="flex items-center gap-2 bg-muted/20 hover:bg-muted/40 border border-border/20 px-3 py-1.5 rounded-lg transition"
            >
              {isCheckingHealth ? (
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground animate-spin" />
              ) : (
                <span className={`status-dot ${isBackendHealthy ? "status-dot-active" : "status-dot-inactive"}`} />
              )}
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                {isBackendHealthy === null ? "CHECKING..." : isBackendHealthy ? "API ONLINE" : "API OFFLINE"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        
        {/* SECTION 2: KPI STATS BAR (Always Visible) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Model Accuracy (R²)"
            value={modelStats ? `${modelStats.fused_model.r2.toFixed(3)}` : "0.970"}
            subtext="Fused XGBoost Accuracy Score"
            glowColor="var(--primary)"
            icon={<Award className="w-5 h-5 text-primary" />}
          />
          <KPICard 
            title="Fused Model RMSE"
            value={modelStats ? `${modelStats.fused_model.rmse.toFixed(3)}` : "5.920"}
            subtext="Lower is better (Residual Error)"
            glowColor="var(--primary)"
            icon={<TrendingDown className="w-5 h-5 text-primary" />}
          />
          <KPICard 
            title="Improvement vs Base"
            value={modelStats ? `+${modelStats.improvement_pct.toFixed(2)}%` : "+41.94%"}
            subtext="Compared to temporal baseline"
            glowColor="var(--accent)"
            icon={<TrendingUp className="w-5 h-5 text-accent" />}
          />
          <KPICard 
            title="Dataset Records"
            value={modelStats ? modelStats.total_records.toLocaleString() : "113,952"}
            subtext="Hourly Bengaluru Traffic Records"
            glowColor="var(--primary)"
            icon={<Database className="w-5 h-5 text-primary" />}
          />
        </section>

        {/* SECTION 3: LIVE CONDITIONS STRIP */}
        <section className="glass rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-6 border-l-4 border-l-primary">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-primary shrink-0" />
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Current Telemetry Scope</span>
              <p className="text-xs font-bold text-foreground">Silk Board Junction, Bengaluru, KA</p>
            </div>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center">
            {isLoadingWeather ? (
              <span className="text-xs text-muted-foreground animate-pulse">Synchronizing weather satellite...</span>
            ) : weatherData ? (
              <>
                <div className="flex items-center gap-2">
                  <CloudSun className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Condition:</span>
                  <span className="text-xs font-semibold text-foreground capitalize">{weatherData.condition}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Temp:</span>
                  <span className="text-xs font-semibold text-primary">{weatherData.temperature}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Wind:</span>
                  <span className="text-xs font-semibold text-foreground">{weatherData.windSpeed} km/h</span>
                </div>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Weather telemetry unavailable</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Active Time Slot</span>
              <p className="text-xs font-bold text-accent">{currentSlotLabel}</p>
            </div>
            
            {congestionToday && congestionToday.hourly && (
              <div className="flex items-center gap-1.5 pl-4 border-l border-border/25">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Live Level</span>
                {(() => {
                  const currHour = new Date().getHours()
                  const currLevel = congestionToday.hourly[currHour]?.level || "Low"
                  return <CongestionBadge level={currLevel} />
                })()}
              </div>
            )}
          </div>
        </section>

        {/* ACADEMIC EXPLAINER EXPANDABLE CARD */}
        <section className="glass rounded-xl border border-primary/20 overflow-hidden">
          <button 
            onClick={() => setIsExplainerOpen(!isExplainerOpen)}
            className="w-full px-5 py-4 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition cursor-pointer text-left border-none outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary font-display">🎓 Project Defense & Methodology Explainer (For Professor Presentation)</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Quick guide to explaining the machine learning formulas, weather fusion, and model metrics.</p>
              </div>
            </div>
            <span className="text-xs font-mono text-primary font-bold uppercase tracking-wider">
              {isExplainerOpen ? "Collapse [−]" : "Expand [+]"}
            </span>
          </button>
          
          <AnimatePresence>
            {isExplainerOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-border/15 bg-muted/5"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-muted-foreground">
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Core Thesis
                    </h4>
                    <p>
                      Standard traffic models are strictly <strong>temporal</strong> (predicting traffic only from hour, day of week, and month). They fail during anomaly conditions like rainfall. 
                    </p>
                    <p>
                      <strong>FusionFlowAI</strong> solves this by using a <strong>Feature Fusion</strong> approach: it merges real-time weather indicators as active variables, predicting with <strong>XGBoost Gradient Boosting</strong> trees.
                    </p>
                  </div>
                  
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Mathematical Formulations
                    </h4>
                    <div className="space-y-2 font-mono text-[10px] bg-[#0e121a]/60 p-3 rounded-lg border border-border/10">
                      <div>
                        <span className="text-primary font-bold">1. Root Mean Square Error (RMSE):</span>
                        <p className="pl-2 mt-0.5 text-muted-foreground/80">RMSE = √[(1/N) * Σ(y - ŷ)²]</p>
                      </div>
                      <div>
                        <span className="text-primary font-bold">2. Coefficient of Determination (R²):</span>
                        <p className="pl-2 mt-0.5 text-muted-foreground/80">R² = 1 - (Total prediction error (SS_res) / Total variation present in traffic data (SS_tot))</p>
                      </div>
                      <div>
                        <span className="text-primary font-bold">3. Error Reduction % (Gain):</span>
                        <p className="pl-2 mt-0.5 text-muted-foreground/80">Gain % = [(RMSE_hist - RMSE_fused) / RMSE_hist] * 100</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="font-bold text-foreground font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> XGBoost Node Parameters
                    </h4>
                    <p>
                      The models are built using <strong>200 trees (`n_estimators`)</strong> with a learning rate of <strong>0.1</strong>.
                    </p>
                    <p>
                      Weather category inputs are parsed via <strong>Label Encoding</strong>: <code>Sunny = 0</code>, <code>Cloudy = 1</code>, and <code>Rainy = 2</code>.
                    </p>
                    <p>
                      Precipitation (Rainy condition) acts as a high-density multiplier in the decision nodes, triggering an automated baseline volume shift.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* SECTION 4: PREDICTION CONTROL + 7-DAY FORECAST */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* CONTROL BOX (Left) */}
          <div className="lg:col-span-4 flex flex-col justify-between h-full">
            <Card className="glass h-full flex flex-col justify-between">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <Terminal className="w-4 h-4" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider font-display">Target Prediction</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Query the Fused Neural & XGBoost models for a 24-hour traffic prediction load list.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="date-input" className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
                    Select Query Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="date-input"
                      type="date"
                      min="2015-01-01"
                      max="2027-12-31"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary rounded-lg transition"
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 block">Scope: Jan 1, 2015 – Dec 31, 2027</span>
                </div>

                <Button
                  onClick={() => handlePredictTraffic(false)}
                  disabled={isLoadingPrediction || !isBackendHealthy}
                  className="w-full h-11 bg-primary text-background font-bold uppercase tracking-wider hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-xs rounded-lg shadow-lg shadow-primary/10"
                >
                  {isLoadingPrediction ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin mr-2" />
                      SIMULATING MODELS...
                    </>
                  ) : (
                    "RUN TRAFFIC SIMULATION"
                  )}
                </Button>
              </CardContent>

              <div className="p-4 border-t border-border/15 bg-muted/10 text-[9px] text-muted-foreground flex gap-1.5 items-start">
                <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  Querying the model computes the fused predictions by merging temporal patterns and meteorological variables.
                </span>
              </div>
            </Card>
          </div>

          {/* 7-DAY FORECAST PREVIEW (Right) */}
          <div className="lg:col-span-8">
            <Card className="glass h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-foreground font-display">
                      7-Day Forecast Average
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Predictive weekly trend starting from today.
                    </CardDescription>
                  </div>
                  <span className="text-[10px] text-muted-foreground/75 font-mono uppercase bg-muted/40 px-2 py-1 rounded border border-border/20">
                    Next 7 Days
                  </span>
                </div>
              </CardHeader>
              <CardContent className="h-[210px] flex items-center justify-center p-4">
                {isLoadingWeekly ? (
                  <div className="text-xs text-muted-foreground animate-pulse flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                    Computing 7-day projection maps...
                  </div>
                ) : weeklyForecast ? (
                  <WeeklyChart data={weeklyForecast} />
                ) : (
                  <div className="text-xs text-muted-foreground">Unable to project weekly flow. Connect backend service.</div>
                )}
              </CardContent>
            </Card>
          </div>

        </section>

        {/* SECTION 5: MAIN ANALYSIS (Conditional render after prediction) */}
        <AnimatePresence>
          {predictionData && predictionData.predictions && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              
              {/* Tabs Selector */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-2 rounded-xl border border-border/30">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setActiveTab("chart")}
                    className={`dashboard-tab ${
                      activeTab === "chart" ? "dashboard-tab-active" : "dashboard-tab-inactive"
                    }`}
                  >
                    24-Hour Comparative Line
                  </button>
                  <button
                    onClick={() => setActiveTab("heatmap")}
                    className={`dashboard-tab ${
                      activeTab === "heatmap" ? "dashboard-tab-active" : "dashboard-tab-inactive"
                    }`}
                  >
                    Congestion Heatmap
                  </button>
                  <button
                    onClick={() => setActiveTab("metrics")}
                    className={`dashboard-tab ${
                      activeTab === "metrics" ? "dashboard-tab-active" : "dashboard-tab-inactive"
                    }`}
                  >
                    Model Comparison Detailed
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    className="w-full sm:w-auto h-9 border-border/80 hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-primary" />
                    Export Simulation CSV
                  </Button>
                </div>
              </div>

              {/* Tab Content 1: Line Chart */}
              {activeTab === "chart" && (
                <Card className="glass overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary font-display flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5" /> 24-Hour Predictive Flow comparison
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Visual comparison between temporal baseline, meteorology-fused XGBoost, and actual values (if archived) for {predictionData.date}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={predictionData?.predictions || []} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
                        <XAxis 
                          dataKey="hour" 
                          tick={{ fill: "var(--muted-foreground)" }} 
                          fontSize={11}
                          tickFormatter={(h) => `${h.toString().padStart(2, "0")}:00`}
                        />
                        <YAxis tick={{ fill: "var(--muted-foreground)" }} fontSize={11} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="glass p-3 rounded-lg border border-border/80 text-xs space-y-1">
                                  <p className="font-bold text-foreground">Hour: {payload[0].payload.hour}:00</p>
                                  <p className="text-chart-3">Historical Baseline: <span className="font-semibold">{payload[0].payload.historical.toFixed(1)} veh/h</span></p>
                                  <p className="text-primary">Fused XGBoost: <span className="font-semibold">{payload[0].payload.fused.toFixed(1)} veh/h</span></p>
                                  {payload[0].payload.actual !== undefined && payload[0].payload.actual !== null && (
                                    <p className="text-accent">Actual Traffic: <span className="font-bold">{payload[0].payload.actual.toFixed(1)} veh/h</span></p>
                                  )}
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36} 
                          iconType="circle"
                          iconSize={8}
                          wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="historical"
                          stroke="var(--chart-3)"
                          strokeWidth={2}
                          dot={false}
                          name="Historical Pattern Only"
                        />
                        <Line
                          type="monotone"
                          dataKey="fused"
                          stroke="var(--chart-1)"
                          strokeWidth={2.5}
                          dot={false}
                          name="XGBoost Fused (Weather + Time)"
                        />
                        {predictionData?.predictions?.[0]?.actual !== undefined && predictionData?.predictions?.[0]?.actual !== null && (
                          <Line
                            type="monotone"
                            dataKey="actual"
                            stroke="var(--chart-2)"
                            strokeWidth={2}
                            strokeDasharray="3 3"
                            dot={{ r: 3, fill: "var(--accent)" }}
                            name="Actual Flow Count"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Tab Content 2: Congestion Heatmap Grid */}
              {activeTab === "heatmap" && (
                <Card className="glass p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary font-display flex items-center gap-2">
                      <Clock className="w-4.5 h-4.5" /> Hour-by-Hour Congestion Mapping
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Spatial congestion intensity index mapped for {predictionData.date}. LOW (green), MODERATE (yellow), HIGH (orange), CRITICAL (red).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    {(() => {
                      const hourlyFormatted = (predictionData?.predictions || []).map((p: any) => {
                        let level: "Low" | "Moderate" | "High" | "Critical" = "Low"
                        let color = "#22c55e"
                        let intensity = 1
                        
                        if (p.fused >= 45) {
                          level = "Critical"
                          color = "#ef4444"
                          intensity = 4
                        } else if (p.fused >= 30) {
                          level = "High"
                          color = "#f97316"
                          intensity = 3
                        } else if (p.fused >= 15) {
                          level = "Moderate"
                          color = "#eab308"
                          intensity = 2
                        }

                        const period = p.hour <= 5 ? "Night"
                          : p.hour <= 9 ? "Morning Rush"
                          : p.hour <= 11 ? "Late Morning"
                          : p.hour <= 13 ? "Noon"
                          : p.hour <= 16 ? "Afternoon"
                          : p.hour <= 20 ? "Evening Rush"
                          : "Night"

                        return {
                          hour: p.hour,
                          predicted_vehicles: p.fused,
                          level,
                          color,
                          intensity,
                          period
                        }
                      })

                      return <HeatmapGrid hourlyData={hourlyFormatted} />
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Tab Content 3: Model Comparison Table */}
              {activeTab === "metrics" && (
                <Card className="glass p-5">
                  <CardHeader className="px-0 pt-0">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary font-display flex items-center gap-2">
                      <Award className="w-4.5 h-4.5" /> Model Validation Parameters & Metrics
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Compare RMSE, R² scores, and calculations against literature baselines.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 space-y-6">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border border-border/20 rounded-lg overflow-hidden">
                        <thead className="bg-[#0e121a] text-foreground font-mono uppercase tracking-wider">
                          <tr>
                            <th className="p-4 border-b border-border/30">Evaluation Model System</th>
                            <th className="p-4 border-b border-border/30 text-center">R² Score</th>
                            <th className="p-4 border-b border-border/30 text-center">RMSE (veh/h)</th>
                            <th className="p-4 border-b border-border/30 text-center">Status vs. Baseline</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/15 font-medium">
                          <tr className="hover:bg-muted/10">
                            <td className="p-4 flex items-center gap-2 font-semibold text-foreground">
                              <span>Literature Base Model</span>
                            </td>
                            <td className="p-4 text-center font-mono">0.8500</td>
                            <td className="p-4 text-center text-accent font-mono">20.645</td>
                            <td className="p-4 text-center text-muted-foreground">—</td>
                          </tr>
                          <tr className="hover:bg-muted/10">
                            <td className="p-4 font-semibold text-foreground">Historical Baseline Model</td>
                            <td className="p-4 text-center font-mono">0.8710</td>
                            <td className="p-4 text-center text-accent/80 font-mono">
                              {predictionData.metrics ? predictionData.metrics.historical_rmse.toFixed(3) : "10.200"}
                            </td>
                            <td className="p-4 text-center text-emerald-400 font-bold font-mono">
                              {predictionData.metrics 
                                ? `+${((20.645 - predictionData.metrics.historical_rmse) / 20.645 * 100).toFixed(2)}%` 
                                : "+50.59%"}
                            </td>
                          </tr>
                          <tr className="hover:bg-muted/10 bg-primary/5">
                            <td className="p-4 font-bold text-primary flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              Proposed Fused XGBoost Model
                            </td>
                            <td className="p-4 text-center font-mono font-bold text-foreground">0.9700</td>
                            <td className="p-4 text-center text-primary font-bold font-mono">
                              {predictionData.metrics ? predictionData.metrics.fused_rmse.toFixed(3) : "5.920"}
                            </td>
                            <td className="p-4 text-center text-emerald-400 font-bold font-mono">
                              {predictionData.metrics 
                                ? `+${((20.645 - predictionData.metrics.fused_rmse) / 20.645 * 100).toFixed(2)}%` 
                                : "+71.32%"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-muted/20 border border-border/30 rounded-xl p-4 space-y-2">
                      <h4 className="text-xs font-bold text-foreground font-mono uppercase tracking-wider">Operational Calculation (RMSE Reduction Formula)</h4>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        Improvement % = ((Literature RMSE &minus; Proposed RMSE) / Literature RMSE) &times; 100
                      </p>
                      {predictionData.metrics ? (
                        <p className="font-mono text-xs text-foreground">
                          Improvement = ((20.645 &minus; {predictionData.metrics.fused_rmse.toFixed(3)}) / 20.645) &times; 100 ={" "}
                          <span className="text-emerald-400 font-bold">{((20.645 - predictionData.metrics.fused_rmse) / 20.645 * 100).toFixed(2)}%</span> reduction in model error bounds.
                        </p>
                      ) : (
                        <p className="font-mono text-xs text-foreground">
                          Improvement = ((20.645 &minus; 5.92) / 20.645) &times; 100 ={" "}
                          <span className="text-emerald-400 font-bold">71.32%</span> reduction in model error bounds.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* SECTION 6: AI INSIGHTS PANEL */}
              <Card className="glass border-l-4 border-l-accent overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-accent font-display flex items-center gap-2">
                    <Info className="w-4.5 h-4.5" /> AI Traffic Dispatch & Forecast Insights
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Dynamic operations analysis compiled automatically from simulation records.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <AIInsights 
                    date={predictionData.date} 
                    predictions={predictionData?.predictions || []} 
                    metrics={predictionData.metrics ? {
                      historical_rmse: predictionData.metrics.historical_rmse,
                      fused_rmse: predictionData.metrics.fused_rmse,
                      improvement: predictionData.metrics.improvement
                    } : undefined}
                  />
                </CardContent>
              </Card>

            </motion.section>
          )}
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/10 bg-[#090b11]/70 backdrop-blur-md mt-20">
        <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            🚦 <span>Smart City Traffic Intelligence Management Console</span>
          </div>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-foreground transition">Methodology & Paper citation</Link>
            <span>&bull;</span>
            <span>Government and Conference Demo Sandbox</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
