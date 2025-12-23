"use client";
import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { AlertCircle, CheckCircle2, Zap, Code2, Cpu, Timer, Share2, Copy } from "lucide-react";

export default function ReviewBotDashboard() {
  const [code, setCode] = useState("// Paste your C++ or Java code here...");
  const [report, setReport] = useState<any>(null);
  const [optCode, setOptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Cooldown state for rate limits

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://review-bot-backend.onrender.com";

  // Countdown logic: Automatically resets the UI after 60 seconds
  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  // handleShare: Uses native mobile share menu OR copies text to clipboard
  const handleShare = async () => {
    if (!report) return;

    const shareContent = {
      title: "ReviewBot AI Audit",
      text: `Code Status: ${report.status}\nComplexity: ${report.complexity}\nAI Suggestion: ${report.hint}`,
      url: window.location.href,
    };

    if (navigator.share) { // Web Share API for mobile/modern browsers
      try {
        await navigator.share(shareContent);
      } catch (err) {
        console.error("Share failed", err);
      }
    } else { // Fallback for desktop: Copy to Clipboard
      try {
        await navigator.clipboard.writeText(`${shareContent.text}\nShared via: ${shareContent.url}`);
        alert("Report summary copied to clipboard!");
      } catch (err) {
        alert("Clipboard access failed.");
      }
    }
  };

  const handleAudit = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setOptCode(""); 
    try {
      const res = await fetch(`${API_BASE_URL}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      
      // 429 Error: Quota Exhausted
      if (res.status === 429) {
        setReport({
          status: 'ERROR',
          errors: ["AI Quota Reached. The free tier limits requests to 15 per minute."],
          hint: "Please wait 60 seconds for the cooldown to finish."
        });
        setCooldown(60); 
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setReport(data);
    } catch (error) {
      console.error("Connection failed:", error);
      alert("Backend not responding. Render may be waking up (wait 30s).");
      setReport(null);
    }
    setLoading(false);
  };

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.status === 429) {
        setCooldown(60);
        alert("Rate limit reached. Try again shortly.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOptCode(data.optimized_code);
    } catch (error) {
      console.error("Optimization failed:", error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8 font-sans">
      <header className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-2 rounded-lg"><Cpu className="text-white" size={24} /></div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          ReviewBot <span className="text-blue-500 font-mono">AI</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <div className="flex justify-between items-center bg-[#161b22] p-3 rounded-t-lg border border-gray-800 border-b-0">
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><Code2 size={14} /> Source Code</span>
            <button 
              onClick={handleAudit} 
              disabled={loading || cooldown > 0}
              className={`px-6 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${
                loading || cooldown > 0 ? "bg-gray-700 cursor-not-allowed text-gray-400" : "bg-blue-600 hover:bg-blue-500 text-white"
              }`}
            >
              {loading ? "Analyzing..." : cooldown > 0 ? <><Timer size={14}/> {cooldown}s Wait</> : "Run AI Audit"}
            </button>
          </div>
          <div className="border border-gray-800 rounded-b-lg overflow-hidden shadow-2xl">
            <Editor height="65vh" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={(v) => setCode(v || "")} options={{ fontSize: 14, minimap: { enabled: false } }} />
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-lg p-6 flex flex-col gap-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-gray-800 pb-4">
            <Zap className="text-yellow-400" size={18} /> AI Insight Dashboard
          </h2>
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic py-20 text-center">
              <p>Paste code and click Audit to begin.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className={`flex items-center gap-3 p-4 rounded-md border ${report.status === 'ERROR' ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-green-950/20 border-green-900/50 text-green-400'}`}>
                {report.status === 'ERROR' ? <AlertCircle /> : <CheckCircle2 />}
                <span className="font-bold">{report.status === 'ERROR' ? "Attention Required" : "Code Validated"}</span>
              </div>
              
              {report.status === 'ERROR' ? (
                <div className="space-y-3">
                  <ul className="space-y-2 text-sm text-gray-400">
                    {report.errors.map((err: string, i: number) => (<li key={i} className="bg-black/30 p-3 rounded border-l-4 border-red-600 italic">"{err}"</li>))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-black/40 rounded-lg border border-gray-800">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Complexity</p>
                      <p className="text-2xl font-mono text-blue-400">{report.complexity}</p>
                    </div>
                    <div className="p-4 bg-black/40 rounded-lg border border-gray-800">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">AI Suggestion</p>
                      <p className="text-xs italic text-gray-300">"{report.hint}"</p>
                    </div>
                  </div>

                  {/* BUTTON GROUP: Optimize and Share */}
                  <div className="flex gap-2">
                    <button 
                      onClick={handleOptimize} 
                      disabled={cooldown > 0} 
                      className={`flex-1 py-3 border rounded font-bold transition-all ${cooldown > 0 ? "border-gray-700 text-gray-500" : "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"}`}
                    >
                      {cooldown > 0 ? `Quota Limit Active` : "Optimize Code"}
                    </button>
                    <button 
                      onClick={handleShare}
                      className="px-4 py-3 border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                      title="Share Audit Report"
                    >
                      <Share2 size={16} /> <span className="hidden md:inline">Share</span>
                    </button>
                  </div>

                  {optCode && (
                    <div className="mt-4 animate-in zoom-in-95 duration-300">
                       <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Optimized Code</p>
                       <pre className="p-4 bg-black rounded-lg text-xs overflow-x-auto text-green-400 border border-green-900/30 font-mono">{optCode}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}