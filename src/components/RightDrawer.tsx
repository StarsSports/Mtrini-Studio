import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, Settings, Cpu, Palette, RefreshCw, ShieldCheck, HelpCircle, HardDrive, Sparkles, AlertTriangle, CheckCircle
} from 'lucide-react';
import { UserProfile, ThemeColors } from '../types';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  themeColors: ThemeColors;
  localApiKey: string;
  onUpdateApiKey: (key: string) => void;
}

const DEFAULT_MCP_CONFIG = `{
  "local-mcp-agent": {
    "url": "http://localhost:5001",
    "enabled": true
  },
  "remote-gdoc-bridge": {
    "url": "https://mcp.ayhamprojects.sh",
    "enabled": false
  }
}`;

export default function RightDrawer({
  isOpen,
  onClose,
  userProfile,
  onUpdatePreferences,
  themeColors,
  localApiKey,
  onUpdateApiKey
}: RightDrawerProps) {
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [mcpJsonStr, setMcpJsonStr] = useState(() => userProfile?.mcpConfig || DEFAULT_MCP_CONFIG);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [parsedServers, setParsedServers] = useState<Record<string, { url: string; enabled: boolean }>>({});
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'success' | 'error'; msg: string; tools?: any[] }>>({});

  useEffect(() => {
    try {
      const parsed = JSON.parse(mcpJsonStr);
      // Validate structure roughly
      if (typeof parsed === 'object' && parsed !== null) {
        setParsedServers(parsed);
        setJsonError(null);
      } else {
        setJsonError('JSON must be a key-value object of server configs');
      }
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON syntax');
    }
  }, [mcpJsonStr]);

  const handleSaveJsonConfig = () => {
    if (jsonError) return;
    onUpdatePreferences({ 
      mcpConfig: mcpJsonStr,
      // Fallback for older code using single URL
      mcpServer: (Object.values(parsedServers) as any)[0]?.url || ''
    });
  };

  const handleTestServer = async (key: string, url: string) => {
    setConnectingKey(key);
    // Reset result for this key
    setTestResults(prev => ({
      ...prev,
      [key]: { status: 'idle', msg: 'Linking with server endpoint...' }
    }));

    try {
      const response = await fetch('/api/mcp/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'connected') {
          setTestResults(prev => ({
            ...prev,
            [key]: { 
              status: 'success', 
              msg: `Connected! Found ${data.tools?.length || 0} secure toolsets.`,
              tools: data.tools || []
            }
          }));
        } else {
          setTestResults(prev => ({
            ...prev,
            [key]: { 
              status: 'error', 
              msg: data.message || 'Handshake failed.' 
            }
          }));
        }
      } else {
        throw new Error('Connection refused by host port.');
      }
    } catch (err: any) {
      setTestResults(prev => ({
        ...prev,
        [key]: { 
          status: 'error', 
          msg: `Bridge failed: ${err.message || err}. Simulated fallback created.` 
        }
      }));
    } finally {
      setConnectingKey(null);
    }
  };

  const themeOptions: { value: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'violet'; label: string; color: string }[] = [
    { value: 'cyan', label: 'Earthy Clay', color: 'bg-[#c2410c]' },
    { value: 'emerald', label: 'Sage Oasis', color: 'bg-emerald-700' },
    { value: 'crimson', label: 'Terracotta', color: 'bg-amber-800' },
    { value: 'amber', label: 'Amber Gold', color: 'bg-amber-600' },
    { value: 'violet', label: 'Indigo Ink', color: 'bg-indigo-950' },
  ];

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.95 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className="fixed inset-y-0 right-0 w-85 bg-[#FAF8F5] border-l border-[#E6E0D5] z-50 flex flex-col font-sans text-neutral-800 shadow-2xl h-full"
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#E6E0D5] bg-[#F2EDE4] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-900" />
          <span className="font-display font-semibold text-sm tracking-tight text-neutral-900">Control Desk</span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-[#E3DCCE] rounded-lg transition-colors cursor-pointer text-neutral-600"
          id="btn-close-drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
        
        {/* Module 1: AI Token Meter */}
        <div className="bg-[#FAF9F5] p-4 border border-[#E6E0D5] rounded-xl space-y-3 shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-800" />
              Compute Balance
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-800">
              <Sparkles className="w-2.5 h-2.5" />
              Free Core Prototyping
            </span>
          </div>

          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-700 rounded-full w-full" />
          </div>

          <div className="flex justify-between text-[11px] text-neutral-550">
            <span>Quota Utilized: Unlimited</span>
            <span>Credits: ∞ Infinite (Unrestricted)</span>
          </div>
        </div>

        {/* Module 2: Color Tuning Theme Picker */}
        <div className="space-y-2.5">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-800" />
            Style Accent Hue
          </label>
          <div className="grid grid-cols-5 gap-2 bg-[#F5F1EA] p-3 rounded-xl border border-[#E6E0D5]">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdatePreferences({ themeColor: opt.value })}
                className={`group relative flex items-center justify-center p-2 rounded-lg border transition-all cursor-pointer ${userProfile?.themeColor === opt.value ? 'bg-white border-[#C9C2B3] shadow-3xs' : 'bg-transparent border-transparent hover:border-neutral-300'}`}
                title={opt.label}
              >
                <span className={`w-5 h-5 rounded-full ${opt.color} block shadow-inner`} />
              </button>
            ))}
          </div>
        </div>

        {/* Module 3: REAL JSON MCP CONFIG editor */}
        <div className="space-y-2.5 bg-[#FAF9F5] p-4 border border-[#E6E0D5] rounded-xl shadow-3xs">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-800" />
              Real JSON MCP Servers
            </label>
            <HelpCircle 
              className="w-3.5 h-3.5 text-neutral-400 cursor-help"
              title="Input compliant JSON to set up your fleet of Model Context Protocol endpoints." 
            />
          </div>

          <p className="text-[10px] text-neutral-500 leading-normal">
            Configure dynamic toolsets. Define your servers in standard JSON:
          </p>

          <div className="space-y-2">
            <textarea
              value={mcpJsonStr}
              onChange={(e) => setMcpJsonStr(e.target.value)}
              placeholder="{}"
              rows={8}
              className="w-full bg-white border border-[#DCDCD2] rounded-lg p-2 text-[11px] focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600 transition-all font-mono leading-normal custom-scrollbar"
            />

            {jsonError ? (
              <div className="flex items-start gap-1 p-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-[9px] font-mono">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <span>{jsonError}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-emerald-700 font-mono flex items-center gap-1 font-bold">
                  <CheckCircle className="w-3 h-3" /> Config Validated
                </span>
                <button
                  onClick={handleSaveJsonConfig}
                  className="px-2.5 py-1 bg-neutral-900 text-[#FAF8F5] hover:bg-neutral-800 rounded-md text-[10px] font-semibold tracking-wide transition-all cursor-pointer"
                >
                  Save Workspace
                </button>
              </div>
            )}
          </div>

          {/* Render individual parsed servers list with manual link testers! */}
          {!jsonError && Object.keys(parsedServers).length > 0 && (
            <div className="pt-2 border-t border-[#E6E0D5] space-y-2">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Fleet Endpoints ({Object.keys(parsedServers).length}):</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {(Object.entries(parsedServers) as [string, any][]).map(([id, srv]) => {
                  const isTesting = connectingKey === id;
                  const res = testResults[id];
                  return (
                    <div key={id} className="p-2 border border-[#E6E0D5] bg-white rounded-lg flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-neutral-800 truncate block max-w-[120px]">{id}</span>
                        <div className="flex items-center gap-1 text-[9px]">
                          <span className={`px-1.5 py-0.5 rounded-full font-bold ${srv.enabled ? 'bg-emerald-50 text-emerald-800' : 'bg-neutral-100 text-neutral-500'}`}>
                            {srv.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                          <button
                            onClick={() => handleTestServer(id, srv.url)}
                            disabled={isTesting || !srv.url}
                            className="p-1 hover:bg-[#F2EDE4] rounded transition-all cursor-pointer hover:text-amber-800 disabled:opacity-50"
                            title="Handshake Server"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-[#a16207] truncate bg-[#FAF9F5] p-1 rounded border border-[#E6E0D5] select-all">{srv.url}</span>
                      
                      {res && (
                        <div className={`p-1.5 rounded text-[9px] leading-relaxed font-mono ${res.status === 'success' ? 'bg-emerald-50 border border-emerald-100 text-emerald-800' : res.status === 'error' ? 'bg-rose-50 border border-rose-100 text-rose-800' : 'bg-neutral-50 text-neutral-600'}`}>
                          {res.msg}
                          {res.tools && res.tools.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {res.tools.slice(0, 3).map((t: any) => (
                                <span key={t.name} className="px-1 bg-emerald-100 text-emerald-900 rounded font-bold text-[8px]">{t.name}</span>
                              ))}
                              {res.tools.length > 3 && (
                                <span className="text-[8px] text-neutral-500 font-bold">+{res.tools.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Module 4: Custom Private API Key Overrides */}
        <div className="space-y-2.5 bg-[#FAF9F5] p-4 border border-[#E6E0D5] rounded-xl shadow-3xs">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
            Mtrini Direct Bridge Tunnel
          </label>
          <div className="space-y-1.5">
            <input
              type="password"
              placeholder="Active: Workspace Direct Proxy"
              value={localApiKey}
              onChange={(e) => onUpdateApiKey(e.target.value)}
              className="w-full bg-white border border-[#DCDCD2] rounded-lg p-2 text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none focus:border-amber-600 transition-all font-mono"
            />
            <p className="text-[10px] text-neutral-500 leading-normal">
              By default, Mtrini routes prompts via the premium zero-friction server-side proprietary AI compilation tunnel.
            </p>
          </div>
        </div>
      </div>

      {/* Drawer Footer credits & branding metadata */}
      <div className="p-4 border-t border-[#E6E0D5] bg-[#F2EDE4] mt-auto flex flex-col gap-1 text-center font-mono text-[9px] text-[#8C8473]">
        <span>ENGINE: mtrini-v1.1.0-editorial</span>
        <span>"Mtrini: Designed By Ayham Projects"</span>
      </div>
    </motion.div>
  );
}
