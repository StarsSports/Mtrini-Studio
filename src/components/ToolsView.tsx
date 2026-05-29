import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Play, Terminal, ArrowRight, Activity, Cpu, Sparkles, AlertCircle, 
  CheckCircle2, RefreshCw, Layers, ShieldCheck, Zap, Globe, Gauge
} from 'lucide-react';
import { ThemeColors, UserProfile } from '../types';

interface ToolsViewProps {
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  darkMode?: boolean;
  onOpenPreferences?: () => void;
}

interface ConsoleLog {
  timestamp: string;
  type: 'info' | 'success' | 'warn' | 'error' | 'input';
  text: string;
}

export default function ToolsView({ userProfile, themeColors, darkMode = true, onOpenPreferences }: ToolsViewProps) {
  // Parsed tools from configuration
  const [tools, setTools] = useState<any[]>([]);
  const [selectedTool, setSelectedTool] = useState<any | null>(null);
  const [toolInputs, setToolInputs] = useState<Record<string, string>>({});
  
  // Custom interactive panel states
  const [logs, setLogs] = useState<ConsoleLog[]>([
    { timestamp: '11:32:01', type: 'info', text: 'Mtrini Sandbox Client initialized on host port 3000' },
    { timestamp: '11:32:02', type: 'success', text: 'Local routing engine synced' }
  ]);
  const [isPlayingTerminal, setIsPlayingTerminal] = useState(false);
  const [mockLatency, setMockLatency] = useState(104);
  const [pingStatus, setPingStatus] = useState<'stable' | 'calibrating'>('stable');
  const [totalExecutions, setTotalExecutions] = useState(14);
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Parse registered tools on mount
  useEffect(() => {
    let parsedTools = [];
    if (userProfile?.mcpConfig) {
      try {
        parsedTools = JSON.parse(userProfile.mcpConfig);
      } catch (e) {
        console.warn("Could not parse mcpConfig JSON directly:", e);
      }
    }
    
    // Fallback default mock schemas for testing if empty
    if (!parsedTools || parsedTools.length === 0) {
      parsedTools = [
        { 
          name: 'mcp_dir_scan', 
          description: 'Scan directories for workspace files, logs, and compiled assets.', 
          inputSchema: { 
            type: 'object', 
            properties: { 
              path: { type: 'string', description: 'Absolute or relative workspace directory path to analyze.', default: '/workspace/src' },
              depth: { type: 'string', description: 'Level of folder recursion depth to extract.', default: '2' }
            } 
          } 
        },
        { 
          name: 'mcp_file_write', 
          description: 'Securely write output buffers, Markdown summaries, or JSON reports to storage.', 
          inputSchema: { 
            type: 'object', 
            properties: { 
              filename: { type: 'string', description: 'Name of the output script/file to populate.', default: 'mtrini_report.md' },
              charset: { type: 'string', description: 'Encoding format of target file stream.', default: 'utf-8' },
              content: { type: 'string', description: 'Raw textual document/data content to register.', default: '# Automated System Report\nEverything compiles perfectly.' }
            } 
          } 
        },
        { 
          name: 'mtrini_net_probe', 
          description: 'Test API communication pathways, fetch raw external web bodies, or probe endpoints.', 
          inputSchema: { 
            type: 'object', 
            properties: { 
              target_url: { type: 'string', description: 'External target URL endpoint to verify.', default: 'https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app' },
              method: { type: 'string', description: 'HTTP method used in route request.', default: 'GET' }
            } 
          } 
        }
      ];
    }
    setTools(parsedTools);
    setSelectedTool(parsedTools[0]);
  }, [userProfile?.mcpConfig]);

  // Handle auto input properties registration on tool change
  useEffect(() => {
    if (selectedTool) {
      const inputs: Record<string, string> = {};
      const properties = selectedTool.inputSchema?.properties || {};
      Object.keys(properties).forEach(key => {
        inputs[key] = properties[key].default || '';
      });
      setToolInputs(inputs);
    }
  }, [selectedTool]);

  // Terminal scroll helper
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Voice / Waveform animation speed simulations 
  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' | 'input' = 'info') => {
    const now = new Date();
    const ts = now.toLocaleTimeString([], { hour12: false });
    setLogs(prev => [...prev, { timestamp: ts, type, text }]);
  };

  // Recalibrate API connection pathway 
  const handleRecalibrate = () => {
    if (pingStatus === 'calibrating') return;
    setPingStatus('calibrating');
    addLog('Initiating cloud route recalibration sequence...', 'info');
    
    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      if (stage === 1) {
        addLog('Probing edge nodes across 3 geographic Cloud Run regions...', 'info');
        setMockLatency(Math.floor(Math.random() * 40) + 180);
      } else if (stage === 2) {
        addLog('Verifying Firebase Authentication & session synchronization tokens', 'success');
        setMockLatency(Math.floor(Math.random() * 30) + 70);
      } else if (stage === 3) {
        addLog('Recalibration complete. Network telemetry stable. Best path assigned!', 'success');
        setMockLatency(Math.floor(Math.random() * 15) + 38);
        setPingStatus('stable');
        clearInterval(interval);
      }
    }, 800);
  };

  // Trigger Mock Tool Execution Sequence in Sandbox Console
  const executeToolCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPlayingTerminal || !selectedTool) return;
    setIsPlayingTerminal(true);

    addLog(`Running verification test on tool command [${selectedTool.name}]`, 'input');
    addLog(`Reading parameterized arguments: ${JSON.stringify(toolInputs)}`, 'info');

    let stage = 0;
    const interval = setInterval(() => {
      stage += 1;
      
      if (stage === 1) {
        addLog('Connecting to Sandbox Bridge compiler host...', 'info');
      } else if (stage === 2) {
        addLog('Sending request payload with signed credentials token...', 'info');
      } else if (stage === 3) {
        if (selectedTool.name === 'mcp_dir_scan') {
          addLog('Scanning directories... Found 6 critical core folder nodes.', 'success');
          addLog('STDOUT: [\n  "src/App.tsx",\n  "src/types.ts",\n  "src/components/RightDrawer.tsx",\n  "src/components/ToolsView.tsx"\n]', 'success');
        } else if (selectedTool.name === 'mcp_file_write') {
          addLog(`Success writing output stream to storage file: ${toolInputs.filename || 'mtrini_report.md'} (size: ${Math.floor(Math.random() * 300) + 120} bytes)`, 'success');
          addLog(`FS_CONFIRM: Operation fully persisted inside Firestore database sync layer.`, 'success');
        } else if (selectedTool.name === 'mtrini_net_probe') {
          addLog(`Ping successful [HTTP 200 OK] from remote host. Route responded in 43ms.`, 'success');
          addLog(`BODY_SNIP: {"status":"success","activeModules":["chat","notes","tools"]}`, 'success');
        } else {
          addLog(`Tool completed. Formulated schemas resolved successfully. Check model context buffers.`, 'success');
        }
      } else if (stage === 4) {
        setTotalExecutions(prev => prev + 1);
        addLog(`Execution of tool [${selectedTool.name}] completed, results flushed.`, 'success');
        setIsPlayingTerminal(false);
        clearInterval(interval);
      }
    }, 700);
  };

  const handleInputChange = (key: string, value: string) => {
    setToolInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden font-sans transition-all duration-200 ${
      darkMode ? 'bg-neutral-950 text-neutral-100' : 'bg-[#fafaf8] text-neutral-900'
    }`}>
      
      {/* 1. Left Selection Column: Tool Schemas & Custom Inputs */}
      <div className={`w-full md:w-85 border-b md:border-b-0 md:border-r flex flex-col h-1/2 md:h-full shrink-0 transition-all duration-200 ${
        darkMode ? 'border-neutral-900 bg-[#0d0d0f]' : 'border-neutral-200 bg-neutral-100'
      }`}>
        {/* Title Block */}
        <div className={`p-4 border-b shrink-0 flex items-center justify-between transition-all duration-200 ${
          darkMode ? 'border-neutral-900 bg-neutral-950/40' : 'border-neutral-250 bg-neutral-200/40'
        }`}>
          <div className="flex items-center gap-2 select-none">
            <Layers className={`w-4 h-4 ${themeColors.text}`} />
            <span className={`text-xs font-extrabold uppercase tracking-wider ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
              Sandbox Console
            </span>
          </div>
          <span className={`text-[9.5px] font-bold tracking-tight px-2 py-0.5 rounded border ${
            darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-400' : 'bg-white border-neutral-300 text-neutral-600'
          }`}>
            v1.1 Sandbox
          </span>
        </div>

        {/* Tools Selector Block */}
        <div className="p-3 border-b border-dashed border-neutral-800 shrink-0">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-500 block mb-2 select-none">
            Active Debugger Tools ({tools.length})
          </span>
          <div className="space-y-1 max-h-[140px] overflow-y-auto custom-scrollbar">
            {tools.map(t => {
              const active = selectedTool?.name === t.name;
              return (
                <button
                  type="button"
                  key={t.name}
                  onClick={() => setSelectedTool(t)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer ${
                    active 
                      ? (darkMode ? 'bg-neutral-900 text-white border border-neutral-800' : 'bg-white text-neutral-950 border border-neutral-300 shadow-3xs') 
                      : (darkMode ? 'text-neutral-400 hover:bg-neutral-900/40 hover:text-white' : 'text-neutral-600 hover:bg-neutral-250/50 hover:text-neutral-900')
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  <Database className="w-3 h-3 text-neutral-500" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Tool Details & Form Parameter inputs */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between">
          {selectedTool ? (
            <form onSubmit={executeToolCall} className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1 select-none">
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-bold leading-none ${darkMode ? 'text-neutral-250' : 'text-neutral-900'}`}>
                      {selectedTool.name}
                    </span>
                    <span className="text-[8px] font-mono bg-violet-500/10 text-violet-400 px-1.5 py-0.2 rounded border border-violet-900/30">SCHEMA</span>
                  </div>
                  <p className="text-[10px] text-neutral-500 leading-normal">
                    {selectedTool.description}
                  </p>
                </div>

                {/* Parameters inputs mapping */}
                <div className="space-y-2.5 border-t border-dashed border-neutral-800 pt-3">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-neutral-400 block select-none">
                    Schema Arguments
                  </span>
                  
                  {Object.keys(selectedTool.inputSchema?.properties || {}).length === 0 ? (
                    <span className="text-[10.5px] text-neutral-500 italic block">This tool does not require input properties.</span>
                  ) : (
                    Object.keys(selectedTool.inputSchema.properties).map(key => {
                      const prop = selectedTool.inputSchema.properties[key];
                      return (
                        <div key={key} className="space-y-1.5">
                          <label className={`text-[10px] font-bold block ${darkMode ? 'text-neutral-450' : 'text-neutral-650'}`}>
                            {key} <span className="text-[8px] text-neutral-500 font-mono">({prop.type || 'string'})</span>
                          </label>
                          <input 
                            type="text"
                            value={toolInputs[key] || ''}
                            onChange={(e) => handleInputChange(key, e.target.value)}
                            placeholder={prop.description || `value for ${key}`}
                            className={`w-full px-2.5 py-1.5 text-[11px] font-mono rounded-lg border focus:outline-none transition-all ${
                              darkMode 
                                ? 'bg-neutral-900 placeholder-neutral-650 border-neutral-850 focus:border-neutral-700 text-neutral-100' 
                                : 'bg-white placeholder-neutral-400 border-neutral-250 focus:border-cyan-500 text-neutral-900 shadow-3xs'
                            }`}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-dashed border-neutral-850 mt-4">
                <button
                  type="submit"
                  disabled={isPlayingTerminal}
                  className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    isPlayingTerminal 
                      ? 'bg-neutral-900 text-zinc-500 cursor-not-allowed border border-neutral-850'
                      : (darkMode ? 'bg-white text-neutral-950 hover:bg-neutral-200' : 'bg-neutral-900 text-white hover:bg-neutral-800')
                  }`}
                >
                  {isPlayingTerminal ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Simulating Execution...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Execute Sandbox Test</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="h-full flex items-center justify-center p-4 text-center text-neutral-500 text-[10px] select-none">
              Please write and configure any sandbox schema tool to begin.
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Stage Console Area: Latency graph, stats, and real-time logs terminal */}
      <div className="flex-1 flex flex-col h-1/2 md:h-full overflow-hidden p-4 space-y-4">
        
        {/* Metrics Deck Panel grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 select-none">
          {/* Performance ping metric card */}
          <div 
            onClick={handleRecalibrate}
            onMouseEnter={() => setHoveredMetric('ping')}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden h-24 ${
              darkMode 
                ? 'bg-neutral-950 border-neutral-900 hover:border-neutral-800' 
                : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-3xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-neutral-500 uppercase block tracking-wider">Network Ping</span>
              <Activity className={`w-4 h-4 ${pingStatus === 'calibrating' ? 'text-amber-400 animate-bounce' : 'text-emerald-400'}`} />
            </div>
            
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-extrabold leading-none ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                {mockLatency}
              </span>
              <span className="text-[10px] font-bold text-neutral-500">ms</span>
            </div>

            <div className="flex items-center gap-1 text-[8.5px] mt-1.5 text-neutral-450">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>{pingStatus === 'calibrating' ? 'recalibrating node...' : 'Click to Recalibrate'}</span>
            </div>
          </div>

          {/* Sandbox executions metric */}
          <div 
            onMouseEnter={() => setHoveredMetric('exec')}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between h-24 relative overflow-hidden ${
              darkMode ? 'bg-neutral-955 border-neutral-900' : 'bg-white border-neutral-200 shadow-3xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-neutral-500 uppercase block tracking-wider">Executions</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-baseline mt-1">
              <span className={`text-xl font-extrabold leading-none ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                {totalExecutions}
              </span>
            </div>

            <span className="text-[8.5px] text-neutral-500 mt-1 block">Active sandbox compiler calls</span>
          </div>

          {/* Core Tokens Balance indicator */}
          <div 
            onMouseEnter={() => setHoveredMetric('credits')}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`border rounded-xl p-3.5 transition-all flex flex-col justify-between h-24 relative overflow-hidden ${
              darkMode ? 'bg-neutral-955 border-neutral-900' : 'bg-white border-neutral-200 shadow-3xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-extrabold text-neutral-500 uppercase block tracking-wider font-sans">Available Credits</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-extrabold leading-none ${darkMode ? 'text-white' : 'text-neutral-900'}`}>
                Infinite (∞)
              </span>
            </div>

            {/* Custom linear HTML/CSS bar for design polish */}
            <div className="mt-2 text-right">
              <div className="w-full bg-neutral-850 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Console Terminal Panel Column */}
        <div className="flex-1 flex flex-col border border-neutral-900 rounded-2xl overflow-hidden shadow-sm bg-[#08080a]">
          {/* Console headers */}
          <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-neutral-400" />
              <span className="text-[10px] font-mono font-bold tracking-tight text-neutral-300">SANDBOX_TRACER_SHELL</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setLogs([
                  { timestamp: new Date().toLocaleTimeString([], { hour12: false }), type: 'info', text: 'Console buffer cleared. Connection path refreshed.' }
                ])}
                className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
              >
                Clear Screen
              </button>
            </div>
          </div>

          {/* Log Outputs Container */}
          <div className="flex-1 overflow-y-auto p-4 font-mono text-[10.5px] leading-relaxed custom-scrollbar space-y-1.5 max-h-[500px]">
            {logs.map((log, idx) => {
              let typeColor = 'text-neutral-250';
              if (log.type === 'success') typeColor = 'text-emerald-400';
              if (log.type === 'warn') typeColor = 'text-amber-500';
              if (log.type === 'error') typeColor = 'text-rose-500';
              if (log.type === 'input') typeColor = 'text-cyan-400';

              return (
                <div key={idx} className="flex items-start gap-1.5 font-mono select-text">
                  <span className="text-neutral-600 font-mono text-[9px] pt-0.5 select-none font-medium">{log.timestamp}</span>
                  <span className="text-neutral-500 select-none">::</span>
                  <p className={`whitespace-pre-wrap font-mono ${typeColor}`}>
                    {log.text}
                  </p>
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
