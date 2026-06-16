import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

export const metadata: Metadata = {
  title: "FusionFlowAI — Smart Urban Traffic Intelligence",
  description: "XGBoost Fused Neural & Spatial-Temporal Traffic Volume Predictor for Bengaluru Smart Cities",
}

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${inter.variable} antialiased`}>{children}</body>
    </html>
  )
}
