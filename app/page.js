"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Zap, Shield, Puzzle, Download, Chrome, Check, Play, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("install");
  const [mockActive, setMockActive] = useState(false);
  const [mockMessage, setMockMessage] = useState("Waiting for response data...");
  const [mockLastSentTime, setMockLastSentTime] = useState("—");

  useEffect(() => {
    if (!mockActive) {
      setMockMessage("Waiting for response data...");
      setMockLastSentTime("—");
      return;
    }

    const messages = [
      "Hello everyone! Welcome to the livestream.",
      "How are you doing today?",
      "Feel free to ask questions in the chat.",
      "Did you check out our website yet?",
      "Next API sequence item triggered automatically!",
    ];
    let currentIndex = 0;

    const simulateMessage = () => {
      setMockMessage(messages[currentIndex]);
      setMockLastSentTime(new Date().toLocaleTimeString());
      currentIndex = (currentIndex + 1) % messages.length;
    };

    simulateMessage();

    const interval = setInterval(simulateMessage, 6000);
    return () => clearInterval(interval);
  }, [mockActive]);

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      {/* Header */}
      <header className="absolute top-0 w-full flex items-center justify-between px-8 py-6 z-10">
        <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity">
          Chat System
        </Link>
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

        {/* Extension Section */}
        <section className="relative mt-32 pb-16 max-w-5xl w-full z-10 px-4">
          <div className="text-center mb-16">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              Companion Tool
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              YouTube Live Chat Assistant
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Automate live streams by feeding sequential Q&As directly into YouTube Live Chat using our companion browser extension.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: CSS Mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-[320px] bg-gradient-to-br from-[#090d16] to-[#111322] border border-gray-800/80 rounded-2xl p-5 shadow-2xl relative select-none">
                {/* Window controls representation */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-800/50 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-indigo-450 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.6)]"></div>
                    <span className="text-[14px] font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">
                      YouTube Assistant
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    v1.0
                  </span>
                </div>

                <div className="space-y-4">
                  {/* API URL Group */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                      Message Fetch API URL
                    </label>
                    <input
                      type="text"
                      disabled
                      className="w-full bg-gray-950/60 border border-gray-850 rounded-lg px-3 py-2 text-xs text-gray-400 outline-none"
                      value="https://chat-system.vercel.app/api/public/..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-1 gap-2">
                    <div className="w-full text-center bg-indigo-600/10 border border-indigo-500/25 text-indigo-300 font-semibold py-2 rounded-lg text-xs">
                      Config Saved
                    </div>

                    <button
                      onClick={() => setMockActive(!mockActive)}
                      className={`w-full flex items-center justify-center gap-2 font-semibold py-2.5 rounded-lg text-xs transition-all duration-300 cursor-pointer ${
                        mockActive 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]" 
                          : "bg-gray-800/50 text-gray-300 border border-gray-700/50 hover:bg-gray-800"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${mockActive ? "bg-emerald-400 shadow-[0_0_6px_#10b981] animate-pulse" : "bg-red-400"}`}></span>
                      {mockActive ? "Deactivate Automation" : "Activate Automation"}
                    </button>
                  </div>

                  {/* Status Panel */}
                  <div className="bg-gray-950/40 border border-gray-850 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Automation Status:</span>
                      <span className={`font-semibold flex items-center gap-1.5 ${mockActive ? "text-emerald-400" : "text-red-400"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${mockActive ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-red-400"}`}></span>
                        {mockActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs border-t border-gray-900/60 pt-2">
                      <span className="text-gray-500">Last Action Sent:</span>
                      <span className="text-gray-300 font-medium">
                        {mockActive ? mockLastSentTime : "—"}
                      </span>
                    </div>

                    <div className="space-y-1.5 border-t border-gray-900/60 pt-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">
                        Latest Response Message
                      </label>
                      <div className="font-mono text-[10px] text-gray-300 bg-gray-950/85 border border-gray-900/80 rounded-lg p-2.5 min-h-[44px] break-all leading-normal flex items-center">
                        {mockActive ? mockMessage : "Waiting for response data..."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Steps & Tabs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tab Selector */}
              <div className="flex gap-2 p-1 bg-gray-900/60 border border-gray-800/80 rounded-xl max-w-xs">
                <button
                  onClick={() => setActiveTab("install")}
                  className={`flex-grow py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "install"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  How to Install
                </button>
                <button
                  onClick={() => setActiveTab("use")}
                  className={`flex-grow py-2 px-4 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    activeTab === "use"
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  How to Use
                </button>
              </div>

              {/* Tab Contents */}
              <div className="space-y-6 min-h-[380px]">
                {activeTab === "install" ? (
                  <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Chrome className="text-indigo-400" size={20} />
                      Install Unpacked Extension
                    </h3>
                    
                    <div className="relative border-l border-gray-800 pl-6 ml-3 space-y-6">
                      {/* Step 1 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white border border-gray-950">
                          1
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Download the Extension</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Click the button below to download the extension ZIP file containing the source files.
                          </p>
                          <div className="mt-3">
                            <a
                              href="https://github.com/khateeb816/chat-system/releases/download/v1.1/extension.zip"
                              className="inline-flex items-center gap-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md"
                            >
                              <Download size={14} /> Download extension.zip
                            </a>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          2
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Extract the Zip Archive</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Unzip the downloaded <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-300">extension.zip</code> file into a dedicated directory on your computer (e.g., <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[11px] text-gray-300">d:/youtube-chat-assistant</code>).
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          3
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Open Browser Extensions Page</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Open your web browser (Chrome, Edge, or Brave) and navigate to the Extensions page:
                          </p>
                          <ul className="mt-2 space-y-1 text-xs text-gray-400 list-disc pl-4">
                            <li>Chrome: <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">chrome://extensions/</code></li>
                            <li>Edge: <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[10px] text-gray-300">edge://extensions/</code></li>
                          </ul>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          4
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Enable Developer Mode</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Locate and toggle on the <strong>Developer mode</strong> switch, which is typically found in the top-right corner of the Extensions dashboard.
                          </p>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          5
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Upload Unpacked Extension</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Click the <strong>Load unpacked</strong> button in the top-left, navigate to the folder where you extracted the extension, and select the folder (the folder must contain the <code className="bg-gray-900 px-1 py-0.5 rounded font-mono text-[11px] text-indigo-300">manifest.json</code> file).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                      <Play className="text-indigo-400" size={20} />
                      Automation &amp; Usage Guide
                    </h3>

                    <div className="relative border-l border-gray-800 pl-6 ml-3 space-y-6">
                      {/* Step 1 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-xs font-bold text-white border border-gray-950">
                          1
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Get your App API Endpoint</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Create an app in your <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 underline font-medium">Dashboard</Link>, add your sequence of questions, and copy the <strong>Next Question/Answer API</strong> URL from the app details panel.
                          </p>
                        </div>
                      </div>

                      {/* Step 2 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          2
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Configure the Extension</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Click the extension icon in your browser's toolbar, paste your API URL into the <strong>Message Fetch API URL</strong> input box, and press the <strong>Save Config</strong> button.
                          </p>
                        </div>
                      </div>

                      {/* Step 3 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          3
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Navigate to YouTube Live Chat</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Open the YouTube livestream or Premier containing a Live Chat (or Chat Replay) page where you want automation to run. Make sure the chat widget is visible.
                          </p>
                        </div>
                      </div>

                      {/* Step 4 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          4
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Start the Automation</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            Open the extension popup in that active YouTube tab and click <strong>Activate Automation</strong>. The button will turn green to confirm active mode.
                          </p>
                        </div>
                      </div>

                      {/* Step 5 */}
                      <div className="relative">
                        <span className="absolute -left-9 top-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/40 text-xs font-bold text-indigo-300 border border-gray-950">
                          5
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-200">Live Typing Autopilot</h4>
                          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                            The extension will fetch sequential questions/answers from your API at random intervals (30-50 seconds) and simulate natural human typing into the chat box before sending it.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
