"use client";
import Link from "next/link";
import { ArrowRight, Layers, Zap, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Header */}
      <header className="absolute top-0 w-full flex items-center justify-between px-8 py-6 z-10">
        <div className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          Chat System
        </div>
        <nav className="flex items-center gap-6">
          {loading ? (
            <div className="h-8 w-20 bg-gray-800 rounded-full animate-pulse"></div>
          ) : user ? (
            <Link href="/dashboard" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition-colors">Dashboard</Link>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log in</Link>
              <Link href="/register" className="text-sm font-medium bg-white text-gray-950 px-4 py-2 rounded-full hover:bg-gray-200 transition-colors">Get Started</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative pt-32 pb-16 sm:pt-40 sm:pb-24 lg:pb-32 px-4 flex flex-col items-center justify-center min-h-screen text-center overflow-hidden">
        
        {/* Abstract shapes */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none"></div>

        <h1 className="relative text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl z-10">
          Build <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Sequential</span> API Experiences
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl relative z-10">
          The ultimate engine for delivering questions and answers sequentially via REST API. Set up in minutes, loop infinitely, scale globally.
        </p>
        
        <div className="mt-10 flex items-center gap-4 relative z-10">
          {loading ? (
            <div className="h-14 w-48 bg-indigo-600/50 rounded-full animate-pulse"></div>
          ) : user ? (
            <Link href="/dashboard" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-900/20">
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <Link href="/register" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-full font-medium hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-indigo-900/20">
              Start Building Free <ArrowRight size={18} />
            </Link>
          )}
        </div>

        {/* Features Preview */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl relative z-10 text-left px-4">
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 mb-4">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sequential Looping</h3>
            <p className="text-gray-400">Our engine perfectly maintains state, progressing through your Q&A flow one API call at a time.</p>
          </div>
          
          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-cyan-900/50 flex items-center justify-center text-cyan-400 mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Instant Public API</h3>
            <p className="text-gray-400">Every app generates a unique public API key immediately ready for production use.</p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 mb-4">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Admin Monitoring</h3>
            <p className="text-gray-400">Full visibility into API usage, sequence states, and activity logs across all your apps.</p>
          </div>
        </div>

      </main>
    </div>
  );
}
