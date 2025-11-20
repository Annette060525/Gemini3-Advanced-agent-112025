
import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Theme, Language, AgentConfig, AgentOutput, RunMetric } from './types';
import { FLOWER_THEMES, TRANSLATIONS, DEFAULT_AGENTS } from './constants';
import { callGemini, geminiOcr } from './services/geminiService';
import { convertPdfToImages } from './services/pdfUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 flex flex-col items-center justify-center h-screen text-red-600 bg-red-50">
          <h1 className="text-3xl font-bold mb-4">Something went wrong.</h1>
          <pre className="bg-white p-4 rounded shadow text-sm overflow-auto max-w-2xl border border-red-200">
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Helpers ---
const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
  const pages = new Set<number>();
  try {
    if (!rangeStr.trim()) return [];
    const parts = rangeStr.replace(/，/g, ',').split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map(p => parseInt(p.trim()));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= totalPages) pages.add(i - 1);
          }
        }
      } else {
        const p = parseInt(trimmed);
        if (!isNaN(p) && p >= 1 && p <= totalPages) pages.add(p - 1);
      }
    }
  } catch (e) {
    console.error("Invalid range", e);
  }
  return Array.from(pages).sort((a, b) => a - b);
};

const getInitialApiKey = () => {
  try {
    return process.env.API_KEY || "";
  } catch {
    return "";
  }
};

// --- Main Component ---
const AppContent: React.FC = () => {
  // Global State
  const [themeName, setThemeName] = useState<string>("Cherry Blossom");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [lang, setLang] = useState<Language>(Language.ZH_TW);
  const [apiKey, setApiKey] = useState<string>(getInitialApiKey());
  
  // Data State
  const [ocrText, setOcrText] = useState<string>("");
  const [agents, setAgents] = useState<AgentConfig[]>(DEFAULT_AGENTS);
  const [agentOutputs, setAgentOutputs] = useState<AgentOutput[]>([]);
  const [metrics, setMetrics] = useState<RunMetric[]>([]);
  const [reviewNotes, setReviewNotes] = useState<string>("# 審查筆記\n\n在這裡記錄您的審查筆記。支援 Markdown 格式。\n\n使用 HTML 標籤改變文字顏色，例如：<span style='color:red'>紅色文字</span>");
  
  // OCR specific state
  const [pdfImages, setPdfImages] = useState<string[]>([]);
  const [ocrModel, setOcrModel] = useState<string>("gemini-2.5-flash");
  const [pageRange, setPageRange] = useState<string>("1-5");

  // Comparison Tab State
  const [cmpAgentIdx, setCmpAgentIdx] = useState<number>(0);
  const [cmpModel1, setCmpModel1] = useState<string>("gemini-2.5-flash");
  const [cmpModel2, setCmpModel2] = useState<string>("gemini-2.5-flash-lite");
  const [cmpResult1, setCmpResult1] = useState<string>("");
  const [cmpResult2, setCmpResult2] = useState<string>("");
  const [cmpTime1, setCmpTime1] = useState<number>(0);
  const [cmpTime2, setCmpTime2] = useState<number>(0);
  
  // UI State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(DEFAULT_AGENTS[0].id);

  const t = TRANSLATIONS[lang];
  const currentTheme = FLOWER_THEMES[themeName] || FLOWER_THEMES["Cherry Blossom"];

  // Apply Theme Styles
  useEffect(() => {
    const root = document.documentElement;
    const bg = darkMode ? currentTheme.bg_dark : currentTheme.bg_light;
    const text = darkMode ? '#f3f4f6' : '#1f2937'; 
    
    root.style.setProperty('--color-primary', currentTheme.primary);
    root.style.setProperty('--color-secondary', currentTheme.secondary);
    root.style.setProperty('--color-accent', currentTheme.accent);
    
    document.body.style.background = bg;
    document.body.style.color = text;
    
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [themeName, darkMode, currentTheme]);

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      try {
        const images = await convertPdfToImages(file, 30);
        setPdfImages(images);
        setPageRange(`1-${Math.min(5, images.length)}`);
      } catch (error) {
        alert("Error parsing PDF: " + error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStartOCR = async () => {
    if (pdfImages.length === 0) return alert("Please upload a PDF first");
    if (!apiKey) return alert("Please enter Gemini API Key in the sidebar");

    const selectedIndices = parsePageRange(pageRange, pdfImages.length);
    if (selectedIndices.length === 0) return alert("Invalid page range");

    const selectedImages = selectedIndices.map(i => pdfImages[i]);

    setIsProcessing(true);
    try {
      const text = await geminiOcr(apiKey, ocrModel, selectedImages);
      setOcrText(text);
      setActiveTab(1); // Switch to Preview tab
    } catch (e) {
      alert("OCR Failed: " + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteAgent = async (index: number) => {
    if (!apiKey) return alert("API Key required");
    const agent = agents[index];
    
    // Chain input from previous agent if available, else use OCR text
    let input = ocrText;
    if (index > 0 && agentOutputs[index - 1]?.output) {
       input = agentOutputs[index - 1].output;
    }

    if (!input) return alert("No input text available for this agent.");
    
    setIsProcessing(true);
    const startTime = performance.now();
    try {
      const fullPrompt = `${agent.user_prompt}\n\n---\nCONTEXT:\n${input}`;
      const response = await callGemini(apiKey, agent.model, agent.system_prompt, fullPrompt, {
        temperature: agent.temperature,
        topP: agent.top_p,
        maxTokens: agent.max_tokens
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; 

      const newOutput: AgentOutput = {
        agentId: agent.id,
        input: input.substring(0, 100) + "...",
        output: response.text,
        time: parseFloat(duration.toFixed(2)),
        tokens: response.tokens,
        model: agent.model
      };

      const newOutputs = [...agentOutputs];
      newOutputs[index] = newOutput;
      setAgentOutputs(newOutputs);

      setMetrics(prev => [...prev, {
        agent: agent.name,
        latency: newOutput.time,
        tokens: newOutput.tokens,
        model: agent.model
      }]);

    } catch (e) {
      alert(`Agent ${agent.name} failed: ` + e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunComparison = async () => {
    if (!apiKey) return alert("API Key required");
    if (!ocrText) return alert("No document text available. Please run OCR first.");
    
    const agent = agents[cmpAgentIdx];
    const fullPrompt = `${agent.user_prompt}\n\n---\nCONTEXT:\n${ocrText}`;

    setIsProcessing(true);
    try {
        // Model 1
        const t1 = performance.now();
        const r1 = await callGemini(apiKey, cmpModel1, agent.system_prompt, fullPrompt, {
            temperature: agent.temperature, topP: agent.top_p, maxTokens: agent.max_tokens
        });
        setCmpTime1((performance.now() - t1)/1000);
        setCmpResult1(r1.text);

        // Model 2
        const t2 = performance.now();
        const r2 = await callGemini(apiKey, cmpModel2, agent.system_prompt, fullPrompt, {
            temperature: agent.temperature, topP: agent.top_p, maxTokens: agent.max_tokens
        });
        setCmpTime2((performance.now() - t2)/1000);
        setCmpResult2(r2.text);

    } catch (e) {
        alert("Comparison failed: " + e);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleGenerateFollowUp = async () => {
      if (!apiKey) return alert("API Key required");
      setIsProcessing(true);
      try {
          const prompt = `Based on the following review notes, please generate exactly 20 comprehensive follow-up questions for the applicant. The questions should be numbered 1-20 and cover safety, efficacy, and quality aspects.\n\nNotes:\n${reviewNotes}`;
          const response = await callGemini(apiKey, "gemini-2.5-flash", "You are a rigorous FDA auditor.", prompt, {
              temperature: 0.7, topP: 0.95, maxTokens: 4000
          });
          setReviewNotes(prev => prev + "\n\n## 20 Follow-up Questions\n" + response.text);
      } catch(e) {
          alert("Failed to generate questions: " + e);
      } finally {
          setIsProcessing(false);
      }
  };

  // --- Render Helpers ---

  const renderTabButton = (idx: number, label: string) => (
    <button
      onClick={() => setActiveTab(idx)}
      className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap
        ${activeTab === idx ? 'text-white shadow-lg transform -translate-y-1' : 'text-gray-600 dark:text-gray-300 hover:bg-white/20'}
      `}
      style={{ 
        background: activeTab === idx ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})` : 'transparent',
        boxShadow: activeTab === idx ? `0 8px 16px -4px ${currentTheme.primary}80` : 'none'
      }}
    >
      {label}
    </button>
  );

  // --- Views ---

  const Sidebar = () => (
    <div className="w-80 p-6 flex flex-col gap-6 border-r glass-panel h-screen sticky top-0 overflow-y-auto z-20 transition-all duration-500 bg-white/40 dark:bg-black/40 backdrop-blur-xl border-r border-white/20">
      <div className="flex items-center gap-3 mb-4 animate-fade-in">
        <span className="text-4xl filter drop-shadow-lg">{currentTheme.icon}</span>
        <h1 className="text-xl font-bold leading-tight" style={{ color: currentTheme.accent }}>
          {lang === Language.ZH_TW ? "TFDA 審查系統" : "TFDA Review"}
        </h1>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-white/30 dark:bg-black/20 p-1 rounded-xl flex shadow-inner">
           <button onClick={() => setLang(Language.ZH_TW)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${lang === Language.ZH_TW ? 'bg-white shadow text-black' : 'text-gray-500'}`}>繁體中文</button>
           <button onClick={() => setLang(Language.EN)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${lang === Language.EN ? 'bg-white shadow text-black' : 'text-gray-500'}`}>English</button>
        </div>

        {/* Theme */}
        <div>
          <label className="text-xs font-bold uppercase opacity-60 mb-2 block tracking-wider">{t.theme_selector}</label>
          <div className="relative group">
            <select 
              value={themeName}
              onChange={(e) => setThemeName(e.target.value)}
              className="w-full p-3 rounded-xl bg-white/50 border border-gray-200 dark:bg-black/20 dark:border-gray-700 outline-none appearance-none cursor-pointer font-medium"
              style={{ borderColor: `${currentTheme.primary}40` }}
            >
              {Object.keys(FLOWER_THEMES).map(name => (
                <option key={name} value={name}>{FLOWER_THEMES[name].icon} {name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-3 pointer-events-none opacity-50">▼</div>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="flex items-center justify-between bg-white/30 dark:bg-black/20 p-3 rounded-xl">
            <label className="text-sm font-medium">{t.dark_mode}</label>
            <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}
            >
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : ''}`} />
            </button>
        </div>
        
        {/* API Key */}
        <div className="pt-6 border-t border-gray-500/10">
            <label className="text-xs font-bold uppercase opacity-60 mb-2 block tracking-wider">{t.providers}</label>
            <input 
                type="password" 
                placeholder={t.api_key_placeholder}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/50 border border-gray-200 dark:bg-black/20 dark:border-gray-700 text-sm font-mono focus:ring-2 outline-none transition-all"
                style={{ '--tw-ring-color': currentTheme.primary } as any}
            />
            <div className="flex gap-2 mt-3">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${apiKey ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {apiKey ? "● API Connected" : "○ No Key"}
                 </span>
            </div>
            <p className="text-[10px] opacity-50 mt-2">Key is stored locally in session memory only.</p>
        </div>

        {/* Mini Stats */}
        <div className="bg-gradient-to-br from-white/40 to-white/10 dark:from-white/10 dark:to-transparent p-4 rounded-xl border border-white/20 shadow-lg mt-auto">
            <h4 className="text-xs font-bold uppercase opacity-60 mb-2">Session Stats</h4>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-2xl font-bold" style={{color: currentTheme.accent}}>{metrics.length}</div>
                    <div className="text-xs opacity-70">Executions</div>
                </div>
                <div className="text-right">
                    <div className="text-xl font-bold" style={{color: currentTheme.secondary}}>{metrics.reduce((a,b) => a + b.tokens, 0).toLocaleString()}</div>
                    <div className="text-xs opacity-70">Tokens</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen font-sans selection:bg-pink-200 selection:text-pink-900 transition-colors duration-500">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-0" />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl opacity-30 mix-blend-overlay pointer-events-none z-0" 
             style={{ background: currentTheme.primary }} />
        <div className="absolute top-40 left-20 w-72 h-72 rounded-full blur-3xl opacity-20 mix-blend-overlay pointer-events-none z-0" 
             style={{ background: currentTheme.secondary }} />

        {/* Header */}
        <header className="p-8 pb-2 flex justify-between items-end z-10">
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight transition-colors duration-500" style={{ color: darkMode ? '#fff' : '#1a1a1a' }}>
                    {t.title}
                </h2>
                <p className="text-lg opacity-60 font-medium mt-1">{t.subtitle}</p>
            </div>
        </header>
        
        {/* Tabs Scroll Container */}
        <div className="px-8 py-4 overflow-x-auto flex gap-3 no-scrollbar z-10">
            {renderTabButton(0, t.upload_tab)}
            {renderTabButton(1, t.preview_tab)}
            {renderTabButton(2, t.config_tab)}
            {renderTabButton(3, t.execute_tab)}
            {renderTabButton(4, t.dashboard_tab)}
            {renderTabButton(5, t.notes_tab)}
            {renderTabButton(6, t.advanced_tab)}
        </div>

        {/* Main Content */}
        <main className="flex-1 p-8 pt-4 overflow-y-auto z-10 scroll-smooth">
            <div className="max-w-7xl mx-auto pb-20">
                
                {/* TAB 0: Upload & OCR */}
                {activeTab === 0 && (
                    <div className="glass-panel p-10 rounded-3xl shadow-xl backdrop-blur-md border border-white/30 animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-8 border-b border-gray-200/20 pb-4">
                            <span className="text-3xl p-3 rounded-2xl bg-white/50 shadow-sm">{currentTheme.icon}</span>
                            <div>
                                <h3 className="text-2xl font-bold">{t.upload_pdf}</h3>
                                <p className="opacity-60">Select a PDF document to analyze</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                             <div className="lg:col-span-1 space-y-6">
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center hover:bg-white/50 transition-all cursor-pointer relative group">
                                    <input type="file" accept=".pdf" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                    <div className="text-4xl mb-4 opacity-50 group-hover:scale-110 transition-transform">📄</div>
                                    <p className="font-bold">Click to Upload PDF</p>
                                    <p className="text-xs opacity-50 mt-2">Max 50MB</p>
                                </div>

                                {pdfImages.length > 0 && (
                                    <div className="bg-white/40 dark:bg-black/20 p-6 rounded-2xl space-y-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2">OCR Model</label>
                                            <select 
                                                value={ocrModel} 
                                                onChange={e => setOcrModel(e.target.value)}
                                                className="w-full p-3 rounded-xl bg-white/80 dark:bg-black/40 border-none shadow-sm outline-none"
                                            >
                                                <option value="gemini-2.5-flash">gemini-2.5-flash (Balanced)</option>
                                                <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite (Fast)</option>
                                                <option value="gemini-1.5-pro">gemini-1.5-pro (High Quality)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2">Page Range</label>
                                            <input 
                                                type="text" 
                                                value={pageRange}
                                                onChange={e => setPageRange(e.target.value)}
                                                className="w-full p-3 rounded-xl bg-white/80 dark:bg-black/40 border-none shadow-sm outline-none"
                                                placeholder="e.g., 1-5, 8"
                                            />
                                            <p className="text-xs opacity-50 mt-1">Total pages detected: {pdfImages.length}</p>
                                        </div>
                                        <button 
                                            onClick={handleStartOCR}
                                            disabled={isProcessing}
                                            className="w-full py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                                        >
                                            {isProcessing ? "Processing..." : t.start_ocr}
                                        </button>
                                    </div>
                                )}
                             </div>

                             <div className="lg:col-span-2 bg-black/5 dark:bg-white/5 rounded-2xl p-6 min-h-[400px]">
                                {pdfImages.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {pdfImages.map((img, idx) => (
                                            <div key={idx} className="relative group rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all">
                                                <img src={`data:image/png;base64,${img}`} alt={`Page ${idx + 1}`} className="w-full h-auto" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                <span className="absolute top-2 left-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                                    P{idx+1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                                        <div className="text-6xl mb-4">🖼️</div>
                                        <p>Page preview will appear here</p>
                                    </div>
                                )}
                             </div>
                        </div>
                    </div>
                )}

                {/* TAB 1: Preview/Edit OCR */}
                {activeTab === 1 && (
                    <div className="glass-panel p-8 rounded-3xl shadow-xl h-[75vh] flex flex-col animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-3">
                               <span className="text-3xl">{currentTheme.icon}</span>
                               OCR Result
                            </h3>
                            <div className="px-4 py-2 bg-white/50 rounded-full text-sm font-medium">
                                {ocrText.length} chars ≈ {Math.ceil(ocrText.length / 4)} tokens
                            </div>
                        </div>
                        <div className="relative flex-1">
                            <textarea 
                                value={ocrText}
                                onChange={(e) => setOcrText(e.target.value)}
                                className="w-full h-full p-6 rounded-2xl bg-white/60 dark:bg-black/30 border border-white/40 dark:border-white/10 focus:outline-none focus:ring-2 font-mono text-sm leading-relaxed resize-none shadow-inner"
                                style={{ '--tw-ring-color': currentTheme.primary } as any}
                                placeholder="OCR text extraction results..."
                            />
                            <div className="absolute bottom-4 right-4 flex gap-2">
                                <button className="p-2 bg-white shadow rounded-full hover:scale-110 transition-transform" title="Copy" onClick={() => navigator.clipboard.writeText(ocrText)}>📋</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: Config */}
                {activeTab === 2 && (
                    <div className="space-y-6 animate-fade-in-up">
                        {agents.map((agent, idx) => (
                            <div 
                                key={agent.id} 
                                className={`glass-panel rounded-2xl overflow-hidden transition-all duration-300 border border-white/40 shadow-lg ${expandedAgent === agent.id ? 'ring-2' : 'hover:bg-white/40'}`}
                                style={{ '--tw-ring-color': `${currentTheme.primary}50` } as any}
                            >
                                <div 
                                    className="p-6 cursor-pointer flex justify-between items-center bg-gradient-to-r from-white/20 to-transparent"
                                    onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md" style={{background: currentTheme.secondary}}>
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg">{agent.name}</h4>
                                            <p className="text-sm opacity-60 truncate max-w-md">{agent.description}</p>
                                        </div>
                                    </div>
                                    <div className={`transform transition-transform ${expandedAgent === agent.id ? 'rotate-180' : ''}`}>▼</div>
                                </div>

                                {expandedAgent === agent.id && (
                                    <div className="p-6 pt-0 border-t border-gray-200/10 bg-white/10">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            <div>
                                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">System Prompt</label>
                                                <textarea 
                                                    value={agent.system_prompt}
                                                    onChange={e => {
                                                        const newAgents = [...agents];
                                                        newAgents[idx].system_prompt = e.target.value;
                                                        setAgents(newAgents);
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/30 border-none h-32 text-sm focus:ring-2 outline-none"
                                                    style={{ '--tw-ring-color': currentTheme.primary } as any}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold uppercase opacity-60 mb-2 block">User Prompt Template</label>
                                                <textarea 
                                                    value={agent.user_prompt}
                                                    onChange={e => {
                                                        const newAgents = [...agents];
                                                        newAgents[idx].user_prompt = e.target.value;
                                                        setAgents(newAgents);
                                                    }}
                                                    className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/30 border-none h-32 text-sm focus:ring-2 outline-none"
                                                    style={{ '--tw-ring-color': currentTheme.primary } as any}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                                            <div>
                                                <label className="block text-xs font-bold mb-2">Model Selection</label>
                                                <select 
                                                    value={agent.model}
                                                    onChange={e => {
                                                        const newAgents = [...agents];
                                                        newAgents[idx].model = e.target.value;
                                                        setAgents(newAgents);
                                                    }}
                                                    className="w-full p-2 rounded-lg bg-white/50 dark:bg-black/30 outline-none"
                                                >
                                                    <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                                    <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                                                    <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-2">Max Tokens: {agent.max_tokens}</label>
                                                <input 
                                                    type="range" min="100" max="8192" step="100" 
                                                    value={agent.max_tokens}
                                                    onChange={e => {
                                                        const newAgents = [...agents];
                                                        newAgents[idx].max_tokens = parseInt(e.target.value);
                                                        setAgents(newAgents);
                                                    }}
                                                    className="w-full"
                                                    style={{ accentColor: currentTheme.accent }}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold mb-2">Temperature: {agent.temperature}</label>
                                                <input 
                                                    type="range" min="0" max="2" step="0.1" 
                                                    value={agent.temperature}
                                                    onChange={e => {
                                                        const newAgents = [...agents];
                                                        newAgents[idx].temperature = parseFloat(e.target.value);
                                                        setAgents(newAgents);
                                                    }}
                                                    className="w-full"
                                                    style={{ accentColor: currentTheme.accent }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 3: Execute */}
                {activeTab === 3 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="flex justify-end mb-4">
                            <button className="text-sm underline opacity-60 hover:opacity-100" onClick={() => setAgentOutputs([])}>Clear All Outputs</button>
                        </div>
                        {agents.map((agent, idx) => {
                            const output = agentOutputs[idx];
                            const hasOutput = !!output;
                            
                            return (
                                <div key={agent.id} className={`relative pl-8 border-l-4 transition-all duration-500 ${hasOutput ? 'border-green-500 opacity-100' : 'border-gray-300 dark:border-gray-700 opacity-80'}`}>
                                    <div className="absolute -left-[1.3rem] top-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-colors z-10 ring-4 ring-white dark:ring-black" style={{ background: hasOutput ? '#10B981' : currentTheme.secondary }}>
                                        {hasOutput ? '✓' : idx + 1}
                                    </div>
                                    
                                    <div className="mb-4 flex justify-between items-start">
                                        <div>
                                            <h3 className="text-xl font-bold">{agent.name}</h3>
                                            <p className="text-sm opacity-60">{agent.model}</p>
                                        </div>
                                        {!hasOutput && (
                                            <button 
                                                onClick={() => handleExecuteAgent(idx)}
                                                disabled={isProcessing}
                                                className="px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent})` }}
                                            >
                                                {isProcessing ? 'Running...' : '▶ Run Agent'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {hasOutput ? (
                                        <div className="glass-panel p-6 rounded-2xl shadow-sm border border-white/50 relative overflow-hidden group">
                                             <div className="absolute top-0 right-0 bg-green-500/10 text-green-600 px-3 py-1 rounded-bl-xl text-xs font-bold flex gap-3">
                                                <span>⏱ {output.time}s</span>
                                                <span>🎫 {output.tokens} tokens</span>
                                             </div>
                                            <div className="prose dark:prose-invert max-w-none text-sm">
                                                <pre className="whitespace-pre-wrap font-sans bg-transparent border-none p-0">{output.output}</pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-900/50 text-center opacity-50">
                                            Waiting to execute...
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* TAB 4: Dashboard */}
                {activeTab === 4 && (
                    <div className="space-y-8 animate-fade-in-up">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                             {[
                                 { label: "Total Runs", value: metrics.length, color: currentTheme.primary },
                                 { label: "Total Tokens", value: metrics.reduce((a,b) => a + b.tokens, 0).toLocaleString(), color: currentTheme.accent },
                                 { label: "Avg Latency", value: (metrics.reduce((a,b) => a + b.latency, 0) / (metrics.length || 1)).toFixed(2) + "s", color: currentTheme.secondary },
                                 { label: "Success Rate", value: "100%", color: "#10B981" }
                             ].map((stat, i) => (
                                 <div key={i} className="glass-panel p-6 rounded-2xl border-t-4 shadow-lg" style={{ borderTopColor: stat.color }}>
                                     <div className="text-4xl font-bold mb-1" style={{ color: stat.color }}>{stat.value}</div>
                                     <div className="text-sm font-bold uppercase opacity-50 tracking-wider">{stat.label}</div>
                                 </div>
                             ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-panel p-8 rounded-3xl shadow-xl h-96">
                                <h4 className="mb-6 font-bold text-lg opacity-80 flex items-center gap-2">
                                    <span className="w-2 h-6 rounded bg-pink-500" style={{background: currentTheme.primary}}></span>
                                    Latency per Agent
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#88888822" vertical={false} />
                                        <XAxis dataKey="agent" tick={false} axisLine={false} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }} 
                                        />
                                        <Bar dataKey="latency" fill={currentTheme.primary} radius={[6, 6, 0, 0]} barSize={40} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl shadow-xl h-96">
                                <h4 className="mb-6 font-bold text-lg opacity-80 flex items-center gap-2">
                                    <span className="w-2 h-6 rounded bg-pink-500" style={{background: currentTheme.secondary}}></span>
                                    Token Usage
                                </h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={metrics} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#88888822" horizontal={false} />
                                        <XAxis type="number" axisLine={false} tickLine={false} />
                                        <YAxis dataKey="agent" type="category" width={100} style={{fontSize: '10px'}} tickLine={false} axisLine={false} />
                                        <Tooltip 
                                             contentStyle={{ backgroundColor: darkMode ? '#333' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="tokens" fill={currentTheme.secondary} radius={[0, 6, 6, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 5: Notes & Questions */}
                {activeTab === 5 && (
                    <div className="h-[80vh] flex flex-col gap-6 animate-fade-in">
                        <div className="glass-panel p-1 rounded-2xl flex-1 flex flex-col shadow-xl overflow-hidden">
                            <div className="bg-white/30 dark:bg-black/20 p-4 flex justify-between items-center border-b border-white/10">
                                <h3 className="font-bold flex items-center gap-2">
                                    <span>📝</span> Review Notes
                                </h3>
                                <button 
                                    onClick={handleGenerateFollowUp}
                                    disabled={isProcessing}
                                    className="px-5 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-50"
                                    style={{ background: currentTheme.accent }}
                                >
                                    {isProcessing ? "Generating..." : "✨ Generate 20 Questions"}
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col lg:flex-row">
                                <textarea 
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    className="flex-1 p-6 bg-transparent border-none resize-none focus:outline-none font-mono text-sm leading-relaxed"
                                    placeholder="Type your markdown notes here..."
                                />
                                <div className="w-px bg-gray-200 dark:bg-gray-700 hidden lg:block"></div>
                                <div className="flex-1 p-8 bg-gray-50/50 dark:bg-black/20 overflow-y-auto prose dark:prose-invert max-w-none">
                                    <h4 className="uppercase tracking-widest opacity-40 text-xs font-bold mb-6">Preview</h4>
                                    {reviewNotes.split('\n').map((line, i) => {
                                        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mb-4 mt-6 pb-2 border-b">{line.replace('# ', '')}</h1>
                                        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mb-3 mt-5">{line.replace('## ', '')}</h2>
                                        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc my-1">{line.replace('- ', '')}</li>
                                        return <p key={i} className="mb-2 opacity-90" dangerouslySetInnerHTML={{__html: line}}></p>
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 6: Advanced / Comparison */}
                {activeTab === 6 && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="glass-panel p-8 rounded-3xl shadow-xl">
                             <div className="flex items-center gap-3 mb-6">
                                 <span className="text-3xl">⚖️</span>
                                 <div>
                                     <h3 className="text-2xl font-bold">Model Comparison</h3>
                                     <p className="opacity-60">Compare agent output across different Gemini models side-by-side</p>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                 <div>
                                     <label className="block text-xs font-bold uppercase opacity-60 mb-2">Select Agent</label>
                                     <select 
                                         className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/30 border-none shadow-sm outline-none"
                                         value={cmpAgentIdx}
                                         onChange={e => setCmpAgentIdx(parseInt(e.target.value))}
                                     >
                                         {agents.map((a, i) => <option key={a.id} value={i}>{a.name}</option>)}
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold uppercase opacity-60 mb-2">Model A</label>
                                     <select 
                                         className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/30 border-none shadow-sm outline-none"
                                         value={cmpModel1}
                                         onChange={e => setCmpModel1(e.target.value)}
                                     >
                                         <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                         <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                                         <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-xs font-bold uppercase opacity-60 mb-2">Model B</label>
                                     <select 
                                         className="w-full p-3 rounded-xl bg-white/50 dark:bg-black/30 border-none shadow-sm outline-none"
                                         value={cmpModel2}
                                         onChange={e => setCmpModel2(e.target.value)}
                                     >
                                         <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                                         <option value="gemini-2.5-flash-lite">gemini-2.5-flash-lite</option>
                                         <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                                     </select>
                                 </div>
                             </div>
                             
                             <button 
                                 onClick={handleRunComparison}
                                 disabled={isProcessing}
                                 className="w-full py-4 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                                 style={{ background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.secondary})` }}
                             >
                                 {isProcessing ? "Comparing Models..." : "🚀 Run Comparison"}
                             </button>
                        </div>

                        {(cmpResult1 || cmpResult2) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-blue-400 shadow-lg">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200/10">
                                        <h4 className="font-bold text-lg text-blue-500">{cmpModel1}</h4>
                                        <span className="text-xs font-mono opacity-60">{cmpTime1.toFixed(2)}s</span>
                                    </div>
                                    <div className="prose dark:prose-invert text-sm max-h-[500px] overflow-y-auto">
                                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{cmpResult1}</pre>
                                    </div>
                                </div>
                                <div className="glass-panel p-6 rounded-2xl border-t-4 border-purple-400 shadow-lg">
                                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200/10">
                                        <h4 className="font-bold text-lg text-purple-500">{cmpModel2}</h4>
                                        <span className="text-xs font-mono opacity-60">{cmpTime2.toFixed(2)}s</span>
                                    </div>
                                    <div className="prose dark:prose-invert text-sm max-h-[500px] overflow-y-auto">
                                        <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{cmpResult2}</pre>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
