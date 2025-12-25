"use client";
import React, { useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { AlertCircle, CheckCircle2, Zap, Code2, Cpu, Timer, Share2, Copy, Check, Loader2, User, Mail, ShieldCheck } from "lucide-react";

export default function ReviewBotDashboard() {
  // Authentication & Visitor States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [visitor, setVisitor] = useState({ name: "", email: "" });
  const [authLoading, setAuthLoading] = useState(false);

  // AI & Dashboard States
  const [code, setCode] = useState("// Paste your C, C++, or Java code here...");
  const [report, setReport] = useState<any>(null);
  const [optCode, setOptCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [copied, setCopied] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://review-bot-backend.onrender.com";

  useEffect(() => {
    if (cooldown > 0) {
      const interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [cooldown]);

  // Handle User Registration/Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitor),
      });
      if (res.ok) setIsLoggedIn(true);
    } catch (err) {
      alert("System is waking up. Please wait 30 seconds and try again.");
    }
    setAuthLoading(false);
  };

  const handleCopyCode = () => {
    if (!optCode) return;
    navigator.clipboard.writeText(optCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = async () => {
    if (!report) return;
    const shareContent = {
      title: "ReviewBot AI Audit",
      text: `Code Status: ${report.status}\nComplexity: ${report.complexity}\nAI Suggestion: ${report.hint}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareContent); } catch (err) { console.error(err); }
    } else {
      navigator.clipboard.writeText(`${shareContent.text}\nLink: ${shareContent.url}`);
      alert("Report summary copied!");
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
      if (res.status === 429) {
        setReport({ status: 'ERROR', errors: ["Quota Reached"], hint: "Wait 60s" });
        setCooldown(60); 
        setLoading(false);
        return;
      }
      const data = await res.json();
      setReport(data);
    } catch (error) { setReport(null); }
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
      const data = await res.json();
      setOptCode(data.optimized_code);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  // --- LOGIN OVERLAY VIEW ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center p-6">
        <div className="bg-[#161b22] p-8 rounded-xl border border-gray-800 w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
             <div className="bg-blue-600 p-3 rounded-full"><ShieldCheck className="text-white" size={32} /></div>
          </div>
          <h2 className="text-2xl font-bold text-white text-center mb-2 tracking-tight">ReviewBot AI</h2>
          <p className="text-gray-400 text-center text-sm mb-8">Secure access to the Code Auditor</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-500" size={18} />
              <input required type="text" placeholder="Full Name" 
                className="w-full bg-black border border-gray-800 rounded p-2.5 pl-10 text-white outline-none focus:border-blue-500 transition-all"
                onChange={(e) => setVisitor({...visitor, name: e.target.value})}
              />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
              <input required type="email" placeholder="Email Address" 
                className="w-full bg-black border border-gray-800 rounded p-2.5 pl-10 text-white outline-none focus:border-blue-500 transition-all"
                onChange={(e) => setVisitor({...visitor, email: e.target.value})}
              />
            </div>
            <button disabled={authLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all flex items-center justify-center gap-2">
              {authLoading ? <Loader2 className="animate-spin" size={20} /> : "Unlock Dashboard"}
            </button>
          </form>
          <p className="mt-6 text-[10px] text-gray-600 text-center uppercase tracking-widest">Authorized Access Only</p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
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
            <button onClick={handleAudit} disabled={loading || cooldown > 0}
              className={`px-6 py-1.5 rounded text-sm font-bold transition-all flex items-center gap-2 ${loading || cooldown > 0 ? "bg-gray-700 text-gray-400" : "bg-blue-600 hover:bg-blue-500 text-white"}`}>
              {loading ? <><Loader2 className="animate-spin" size={14}/> Analyzing...</> : cooldown > 0 ? <><Timer size={14}/> {cooldown}s Wait</> : "Run AI Audit"}
            </button>
          </div>
          <div className="border border-gray-800 rounded-b-lg overflow-hidden shadow-2xl">
            <Editor height="65vh" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={(v) => setCode(v || "")} options={{ fontSize: 14, minimap: { enabled: false } }} />
          </div>
        </section>

        <section className="bg-[#161b22] border border-gray-800 rounded-lg p-6 flex flex-col gap-6 shadow-xl">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 border-b border-gray-800 pb-4"><Zap className="text-yellow-400" size={18} /> AI Insight Dashboard</h2>
          {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic py-20 text-center"><p>Welcome, {visitor.name.split(' ')[0]}! Paste code to begin.</p></div>
          ) : (
            <div className="space-y-6">
              <div className={`flex items-center gap-3 p-4 rounded-md border ${report.status === 'ERROR' ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-green-950/20 border-green-900/50 text-green-400'}`}>
                {report.status === 'ERROR' ? <AlertCircle /> : <CheckCircle2 />}
                <span className="font-bold">{report.status === 'ERROR' ? "Attention Required" : "Code Validated"}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black/40 rounded-lg border border-gray-800"><p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Complexity</p><p className="text-2xl font-mono text-blue-400">{report.complexity}</p></div>
                <div className="p-4 bg-black/40 rounded-lg border border-gray-800"><p className="text-[10px] text-gray-500 uppercase font-bold mb-1">AI Suggestion</p><p className="text-xs italic text-gray-300">"{report.hint}"</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleOptimize} disabled={loading || cooldown > 0} className={`flex-1 py-3 border rounded font-bold transition-all ${cooldown > 0 ? "border-gray-700 text-gray-500" : "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"}`}>
                  {loading ? "Optimizing..." : "Optimize Code"}
                </button>
                <button onClick={handleShare} className="px-4 py-3 border border-gray-600 text-gray-400 rounded hover:bg-gray-800 transition-all flex items-center justify-center gap-2"><Share2 size={16} /></button>
              </div>
              {optCode && (
                <div className="mt-4 animate-in zoom-in-95 duration-300">
                   <div className="flex justify-between items-center mb-1">
                     <p className="text-[10px] text-gray-500 uppercase font-bold">Optimized Code</p>
                     <button onClick={handleCopyCode} className="text-[10px] flex items-center gap-1 text-blue-400 hover:text-blue-300 uppercase font-bold">
                       {copied ? <Check size={12} /> : <Copy size={12} />} {copied ? "Copied!" : "Copy"}
                     </button>
                   </div>
                   <pre className="p-4 bg-black rounded-lg text-xs overflow-x-auto text-green-400 border border-green-900/30 font-mono leading-relaxed">{optCode}</pre>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}