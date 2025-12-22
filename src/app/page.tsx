"use client";
import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import { AlertCircle, CheckCircle2, Zap, Code2 } from "lucide-react";

export default function ReviewBotDashboard() {
  const [code, setCode] = useState("// Paste C++ or Java code here...");
  const [report, setReport] = useState<any>(null);
  const [optCode, setOptCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAudit = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:8000/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    setReport(await res.json());
    setLoading(false);
  };

  const handleOptimize = async () => {
    setLoading(true);
    const res = await fetch('http://localhost:8000/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setOptCode(data.optimized_code);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-300 p-8">
      <header className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-white">Review-Bot <span className="text-blue-500">v1.0</span></h1>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <button onClick={handleAudit} className="w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-500">
            {loading ? "Analyzing..." : "Run AI Audit"}
          </button>
          <div className="border border-gray-800 rounded-lg overflow-hidden">
            <Editor height="60vh" theme="vs-dark" defaultLanguage="cpp" value={code} onChange={(v) => setCode(v || "")} />
          </div>
        </section>
        <section className="bg-[#161b22] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">AI Audit Report</h2>
          {report && (
            <div className="space-y-4">
              <div className={`p-4 rounded border ${report.status === 'ERROR' ? 'border-red-900 text-red-400' : 'border-green-900 text-green-400'}`}>
                {report.status === 'ERROR' ? "❌ Bugs Found" : "✅ Code Clean"}
              </div>
              {report.status === 'SUCCESS' && (
                <>
                  <p className="text-blue-400 font-mono">Complexity: {report.complexity}</p>
                  <button onClick={handleOptimize} className="w-full py-2 border border-blue-600 text-blue-600 rounded">Optimize Code</button>
                  {optCode && <pre className="p-4 bg-black rounded text-green-400 text-xs mt-4">{optCode}</pre>}
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}