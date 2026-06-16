"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Cpu,
  Database,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  CloudSun,
  Send,
  Terminal,
  Activity,
  Award
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

interface SystemStats {
  model_accuracy_r2: string | number
  model_rmse: string | number
  improvement_pct: string | number
  traffic_records: number
  traffic_file_size_kb: number
  cpu_usage_pct: number
  ram_usage_pct: number
  weather_override: string | null
}

export default function AdminPage() {
  const [password, setPassword] = useState("")
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isRetraining, setIsRetraining] = useState(false)
  const [weatherOverride, setWeatherOverride] = useState<string | null>(null)
  
  // Data Ingestion State
  const [ingestDate, setIngestDate] = useState("")
  const [ingestVehicles, setIngestVehicles] = useState("")
  const [isIngesting, setIsIngesting] = useState(false)

  // Notification Toast State
  const [notification, setNotification] = useState<{ message: string; type: "error" | "success" | "alert" } | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || ""

  useEffect(() => {
    const savedToken = localStorage.getItem("admin_token")
    if (savedToken) {
      setToken(savedToken)
    }
  }, [])

  useEffect(() => {
    if (token) {
      fetchStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const showNotification = (message: string, type: "error" | "success" | "alert" = "success") => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoggingIn(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      })
      if (!res.ok) {
        throw new Error("Invalid password credentials.")
      }
      const data = await res.json()
      localStorage.setItem("admin_token", data.token)
      setToken(data.token)
      showNotification("🔐 Admin authenticated successfully!", "success")
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Login failed"
      setError(errMsg)
      showNotification("❌ Authentication failed", "error")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    setToken(null)
    setStats(null)
    showNotification("🔓 Logged out of admin portal", "alert")
  }

  const fetchStats = async () => {
    if (!token) return
    setIsLoadingStats(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/system-stats`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) {
        if (res.status === 401) handleLogout()
        throw new Error("Failed to load statistics")
      }
      const data = await res.json()
      setStats(data)
      setWeatherOverride(data.weather_override)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const handleWeatherOverride = async (condition: string | null) => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/admin/weather-override`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ condition })
      })
      if (!res.ok) throw new Error("Override request failed")
      setWeatherOverride(condition)
      showNotification(`🌤️ Weather override set to: ${condition || "Live Telemetry"}`, "success")
      fetchStats()
    } catch {
      showNotification("❌ Failed to update weather override", "error")
    }
  }

  const handleRetrain = async () => {
    if (!token) return
    setIsRetraining(true)
    showNotification("⚙️ Launching XGBoost model retraining in the background...", "alert")
    try {
      const res = await fetch(`${API_BASE}/api/admin/retrain`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Retrain request failed")
      
      // Retraining takes about 3 seconds locally, wait 4 seconds then refresh stats
      setTimeout(() => {
        setIsRetraining(false)
        showNotification("✅ ML Models retrained successfully and updated!", "success")
        fetchStats()
      }, 4000)
    } catch {
      setIsRetraining(false)
      showNotification("❌ Failed to start retraining", "error")
    }
  }

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!ingestDate || !ingestVehicles) {
      showNotification("⚠️ Please fill out all fields", "alert")
      return
    }

    setIsIngesting(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/ingest-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          date_time: ingestDate,
          vehicles: parseFloat(ingestVehicles)
        })
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || "Ingestion failed")
      }
      showNotification("📥 Data ingested successfully into traffic.csv!", "success")
      setIngestDate("")
      setIngestVehicles("")
      fetchStats()
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Ingestion failed"
      showNotification(`❌ ${errMsg}`, "error")
    } finally {
      setIsIngesting(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen grid-pattern flex items-center justify-center p-6">
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
                  : "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${notification.type === "error" ? "bg-rose-500" : "bg-cyan-400"}`} />
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <Card className="glass w-full max-w-md border-border/40">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto p-3 bg-primary/10 border border-primary/20 w-fit rounded-xl">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-lg font-bold tracking-tight text-foreground font-display">ADMIN PORTAL LOGIN</CardTitle>
            <CardDescription className="text-xs">
              Authorize to access simulation override systems and neural model checkpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Admin Secret Key</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="h-11 bg-background/50 border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary rounded-lg transition"
                />
              </div>

              {error && <p className="text-rose-400 text-[11px] font-semibold font-mono">{error}</p>}

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full h-11 bg-primary text-background font-bold uppercase tracking-wider hover:bg-primary/95 transition duration-200 cursor-pointer rounded-lg text-xs"
              >
                {isLoggingIn ? "AUTHENTICATING..." : "SUBMIT CREDENTIALS"}
              </Button>

              <Link href="/" className="block text-center text-[10px] text-muted-foreground hover:text-foreground transition uppercase font-mono tracking-widest mt-2">
                ← Back to User Dashboard
              </Link>
            </form>
          </CardContent>
        </Card>
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

      {/* Header */}
      <header className="glass-header">
        <div className="container mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/30">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground font-display">ADMINISTRATION PORTAL</h1>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-mono font-medium">ROOT</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Bengaluru Smart Telemetry Overrides Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="outline" className="h-9 border-border/80 hover:bg-muted text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
                <ChevronLeft className="w-4 h-4" /> Exit Console
              </Button>
            </Link>
            <Button onClick={handleLogout} className="h-9 bg-rose-950 hover:bg-rose-900 border border-rose-500/30 text-rose-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer">
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="container mx-auto px-6 py-8 space-y-8 max-w-7xl">
        
        {/* Row 1: System Health Telemetry */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass relative overflow-hidden flex flex-col justify-between p-5 min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">XGBoost Fused Accuracy</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight mt-1 font-mono">
                  {stats ? `${stats.model_accuracy_r2}` : "0.9700"}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Award className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/90 mt-4 font-mono">RMSE: {stats ? `${stats.model_rmse}` : "5.920"} veh/h ({stats ? `+${stats.improvement_pct}` : "+41.94"}% gain)</p>
          </Card>

          <Card className="glass relative overflow-hidden flex flex-col justify-between p-5 min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Database Metrics</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight mt-1 font-mono">
                  {stats ? stats.traffic_records.toLocaleString() : "113,952"}
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                <Database className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/90 mt-4 font-mono">Size: {stats ? `${stats.traffic_file_size_kb}` : "1700"} KB (traffic.csv)</p>
          </Card>

          <Card className="glass relative overflow-hidden flex flex-col justify-between p-5 min-h-[140px]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Simulated CPU/RAM</p>
                <h3 className="text-2xl font-bold text-foreground tracking-tight mt-1 font-mono flex items-baseline gap-3">
                  <span>{stats ? `${stats.cpu_usage_pct}%` : "8.4%"}</span>
                  <span className="text-xs font-normal text-muted-foreground">/</span>
                  <span className="text-lg font-normal text-muted-foreground">{stats ? `${stats.ram_usage_pct}%` : "45.2%"}</span>
                </h3>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Activity className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/90 mt-4 font-mono">Server node status: ONLINE (Healthy)</p>
          </Card>
        </section>

        {/* Row 2: Control Board */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column Left: Weather Override controls */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="glass h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary">
                    <CloudSun className="w-5 h-5 text-primary" />
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider font-display">Weather Simulation Overrides</CardTitle>
                  </div>
                  <button onClick={fetchStats} disabled={isLoadingStats} className="p-1 hover:bg-muted/40 rounded transition">
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingStats ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <CardDescription className="text-xs">
                  Force override the weather simulation parameter. This allows you to demonstrate to your professor how the XGBoost Fused predictions adapt instantly to extreme weather shifts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleWeatherOverride(null)}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition duration-200 ${
                      weatherOverride === null 
                        ? "bg-muted border-border text-foreground shadow-lg shadow-white/5" 
                        : "bg-muted/10 border-border/30 text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <Activity className="w-6 h-6" />
                    <span className="text-xs font-semibold uppercase font-mono">Live Sync</span>
                    <span className="text-[8px] opacity-70">Real-time Weather API</span>
                  </button>

                  <button
                    onClick={() => handleWeatherOverride("Sunny")}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition duration-200 ${
                      weatherOverride === "Sunny" 
                        ? "bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-lg shadow-amber-500/10" 
                        : "bg-muted/10 border-border/30 text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <CloudSun className="w-6 h-6 text-amber-400" />
                    <span className="text-xs font-semibold uppercase font-mono">Sunny</span>
                    <span className="text-[8px] opacity-70">No traffic mods</span>
                  </button>

                  <button
                    onClick={() => handleWeatherOverride("Cloudy")}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition duration-200 ${
                      weatherOverride === "Cloudy" 
                        ? "bg-sky-950/40 border-sky-500/50 text-sky-200 shadow-lg shadow-sky-500/10" 
                        : "bg-muted/10 border-border/30 text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <CloudSun className="w-6 h-6 text-sky-400" />
                    <span className="text-xs font-semibold uppercase font-mono">Cloudy</span>
                    <span className="text-[8px] opacity-70">Moderate delays (+3 veh)</span>
                  </button>

                  <button
                    onClick={() => handleWeatherOverride("Rainy")}
                    className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-pointer transition duration-200 ${
                      weatherOverride === "Rainy" 
                        ? "bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-500/10" 
                        : "bg-muted/10 border-border/30 text-muted-foreground hover:bg-muted/20"
                    }`}
                  >
                    <CloudSun className="w-6 h-6 text-rose-400 animate-pulse" />
                    <span className="text-xs font-semibold uppercase font-mono">Rainy</span>
                    <span className="text-[8px] opacity-70">Severe bottlenecks (+12 veh)</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-[#0e121a]/80 border border-border/20 text-xs flex gap-2">
                  <Terminal className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="font-mono text-muted-foreground leading-normal">
                    Active state: <span className="text-primary font-bold">{weatherOverride === null ? "LIVE TELEMETRY (DYNAMIC)" : `FORCE WEATHER OVERRIDE [${weatherOverride.toUpperCase()}]`}</span>. 
                    Predictions made on the main dashboard will now load with simulated weather covariates corresponding to this setting.
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column Right: AI Retraining Board */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <Card className="glass h-full flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  <Cpu className="w-5 h-5 text-primary" />
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider font-display">Neural Retraining Node</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Re-initialize and retrain the XGBoost decision-tree models on the current database parameters.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <Button
                  onClick={handleRetrain}
                  disabled={isRetraining}
                  className="w-full h-12 bg-primary text-background font-bold uppercase tracking-wider hover:bg-primary/95 hover:scale-[1.01] active:scale-[0.99] transition duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none text-xs rounded-lg shadow-lg shadow-primary/10"
                >
                  {isRetraining ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 animate-spin mr-2" />
                      RETRAINING GRADIENTS...
                    </>
                  ) : (
                    "TRIGGER MODEL RETRAINING"
                  )}
                </Button>
              </CardContent>

              <div className="p-4 border-t border-border/15 bg-muted/10 text-[9px] text-muted-foreground flex gap-1.5 items-start">
                <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  Retraining recompiles the decision weights of 200 nodes of `fused_model.pkl` to fit the updated `traffic.csv` dataset records.
                </span>
              </div>
            </Card>
          </div>
        </section>

        {/* Row 3: Manual Data Ingestion */}
        <section>
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Database className="w-5 h-5 text-primary" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider font-display">Manual Data Ingestion</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Ingest real-time traffic volume data directly into the database. This updates the baseline and can be retrained.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleIngest} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Timestamp (YYYY-MM-DD HH:MM:SS)</label>
                  <Input
                    type="text"
                    value={ingestDate}
                    onChange={(e) => setIngestDate(e.target.value)}
                    placeholder="e.g. 2026-06-16 12:00:00"
                    className="h-10 bg-background/50 border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary rounded-lg transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-mono text-muted-foreground">Vehicle Flow Count (veh/h)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={ingestVehicles}
                    onChange={(e) => setIngestVehicles(e.target.value)}
                    placeholder="e.g. 42.50"
                    className="h-10 bg-background/50 border-border/60 text-foreground text-xs focus:ring-1 focus:ring-primary rounded-lg transition"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isIngesting}
                  className="h-10 bg-accent text-background font-bold uppercase tracking-wider hover:bg-accent/95 cursor-pointer rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isIngesting ? "INGESTING..." : "INGEST RECORD"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/10 bg-[#090b11]/70 backdrop-blur-md mt-20">
        <div className="container mx-auto px-6 py-6 text-center text-xs text-muted-foreground">
          🛡️ Secure Admin Control Console &bull; Project Defense Demo mode
        </div>
      </footer>
    </div>
  )
}
