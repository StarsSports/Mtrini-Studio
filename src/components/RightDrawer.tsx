import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Settings, Trash2, Download, Code, FileCode, Cpu, Shield, Key, Eye, EyeOff, 
  Terminal, RefreshCw, Check, Layout, Clipboard, Sliders, Palette, Info, HelpCircle, Smartphone, Globe,
  Plus, FileJson
} from 'lucide-react';
import { UserProfile, ThemeColors, Message } from '../types';
import { parseMessageArtifacts } from '../utils';

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  themeColors: ThemeColors;
  messages: Message[];
  selectedArtifactMessageId: string | null;
  onSelectArtifactMessageId: (msgId: string | null) => void;
  onResetChat: () => void;
  onExportChat: () => void;
  darkMode?: boolean;
  onUpdatePreferences: (updates: Partial<UserProfile>) => void;
  localApiKey: string;
  onUpdateApiKey: (key: string) => void;
}

export default function RightDrawer({
  isOpen,
  onClose,
  userProfile,
  themeColors,
  messages,
  selectedArtifactMessageId,
  onSelectArtifactMessageId,
  onResetChat,
  onExportChat,
  darkMode = true,
  onUpdatePreferences,
  localApiKey,
  onUpdateApiKey
}: RightDrawerProps) {
  const [activeTab, setActiveTab] = useState<'scripts' | 'config' | 'integrations'>('scripts');

  // Input states
  const [preferredName, setPreferredName] = useState(userProfile?.preferredName || userProfile?.displayName || '');
  const [aboutMe, setAboutMe] = useState(userProfile?.aboutMe || '');
  const [shortcutsEnabled, setShortcutsEnabled] = useState(userProfile?.shortcutsEnabled !== false);
  const [apiKeyInput, setApiKeyInput] = useState(localApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeySavedStatus, setApiKeySavedStatus] = useState(false);

  // MCP Setup
  const [mcpUrl, setMcpUrl] = useState(userProfile?.mcpServer || '');
  const [mcpStatus, setMcpStatus] = useState<'idle' | 'scanning' | 'connected' | 'error'>('idle');
  const [mcpTools, setMcpTools] = useState<any[]>([]);
  const [mcpMessage, setMcpMessage] = useState('');
  const [jsonToolsInput, setJsonToolsInput] = useState('[]');
  const [jsonToolsError, setJsonToolsError] = useState<string | null>(null);
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  // JSON Multi-MCP servers Setup
  const defaultMcpServersJson = JSON.stringify({
    "mcpServers": {
      "sqlite": {
        "url": "https://mcp-sqlite-demo.netlify.app/api"
      },
      "weather": {
        "url": "https://mcp-weather-server.netlify.app"
      }
    }
  }, null, 2);

  const [mcpServersJsonString, setMcpServersJsonString] = useState(userProfile?.mcpServersJson || defaultMcpServersJson);
  const [showMcpJsonCodeEditor, setShowMcpJsonCodeEditor] = useState(false);
  const [mcpServerStatusMap, setMcpServerStatusMap] = useState<Record<string, 'idle' | 'scanning' | 'connected' | 'error'>>({});
  
  // Custom Visual Form for Adding a Server
  const [newServerName, setNewServerName] = useState('');
  const [newServerUrl, setNewServerUrl] = useState('');
  const [isAddingServer, setIsAddingServer] = useState(false);

  const getApiUrl = (endpoint: string) => {
    if (userProfile?.bridgeUrl) {
      return `${userProfile.bridgeUrl.replace(/\/$/, '')}${endpoint}`;
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('netlify.app')) {
      return `https://ais-pre-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app${endpoint}`;
    }
    return endpoint;
  };

  const parsedServers = React.useMemo(() => {
    try {
      const parsed = JSON.parse(mcpServersJsonString);
      if (!parsed) return [];
      
      if (parsed.mcpServers && typeof parsed.mcpServers === 'object') {
        return Object.entries(parsed.mcpServers)
          .map(([name, config]: [string, any]) => {
            const url = config?.url || config?.mcpUrl || '';
            return { name, url };
          })
          .filter(s => s.url);
      }
      
      if (Array.isArray(parsed)) {
        return parsed
          .map((s: any) => ({
            name: s.name || s.id || 'unnamed',
            url: s.url || s.mcpUrl || ''
          }))
          .filter(s => s.url);
      }
      
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([name, val]) => {
            const url = typeof val === 'string' ? val : (val as any)?.url || (val as any)?.mcpUrl || '';
            return { name, url };
          })
          .filter(s => s.url);
      }
    } catch (e) {
      // Return parsed list gracefully
    }
    return [];
  }, [mcpServersJsonString]);

  // Roblox Sync
  const [robloxHistory, setRobloxHistory] = useState<any[]>([]);
  const [isCopiedLua, setIsCopiedLua] = useState(false);

  const themeOptions = [
    { value: 'cyan' as const, label: 'Cyan', color: 'bg-cyan-500' },
    { value: 'emerald' as const, label: 'Emerald', color: 'bg-emerald-500' },
    { value: 'crimson' as const, label: 'Crimson', color: 'bg-rose-500' },
    { value: 'amber' as const, label: 'Amber', color: 'bg-amber-500' },
    { value: 'violet' as const, label: 'Violet', color: 'bg-violet-500' }
  ];

  // Load message artifacts
  const artifactMessages = messages.filter(m => {
    const parsed = parseMessageArtifacts(m.content || '');
    return parsed.hasArtifact;
  });

  // Keep internal values aligned with prop changes
  useEffect(() => {
    if (userProfile) {
      setPreferredName(userProfile.preferredName || userProfile.displayName || '');
      setAboutMe(userProfile.aboutMe || '');
      setShortcutsEnabled(userProfile.shortcutsEnabled !== false);
      setMcpUrl(userProfile.mcpServer || '');
      if (userProfile.mcpServersJson) {
        setMcpServersJsonString(userProfile.mcpServersJson);
      }
    }
  }, [userProfile]);

  // Load and hydrate cached tools from Cloud database json profile configuration
  useEffect(() => {
    if (userProfile?.mcpConfig) {
      try {
        const parsed = JSON.parse(userProfile.mcpConfig);
        if (Array.isArray(parsed)) {
          setMcpTools(parsed);
          setJsonToolsInput(JSON.stringify(parsed, null, 2));
          setMcpStatus('connected');
          setMcpMessage('Restored tools database from cloud user profile configuration JSON.');
        }
      } catch (e) {
        // Hydration error bypassed safely
      }
    }
  }, [userProfile?.mcpConfig]);

  useEffect(() => {
    setApiKeyInput(localApiKey);
  }, [localApiKey]);

  // Handle active settings updates
  const triggerPrefUpdate = (updates: Partial<UserProfile>) => {
    onUpdatePreferences(updates);
  };

  // Multiple MCP Server Scanner trigger - netlify-compliant
  const handleScanAllMcp = async () => {
    if (parsedServers.length === 0) {
      setMcpStatus('idle');
      setMcpMessage('No configured MCP servers found in JSON schema.');
      return;
    }

    setMcpStatus('scanning');
    setMcpMessage('Compiling and probing multiple JSON MCP servers...');

    const activeTools: any[] = [];
    let successCount = 0;
    const nextStatusMap: Record<string, 'idle' | 'scanning' | 'connected' | 'error'> = {};

    // Put all servers in scanning state
    parsedServers.forEach(s => {
      nextStatusMap[s.name] = 'scanning';
    });
    setMcpServerStatusMap({ ...nextStatusMap });

    for (const server of parsedServers) {
      try {
        const resp = await fetch(getApiUrl('/api/mcp/scan'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: server.url })
        });

        if (resp.ok) {
          const data = await resp.json();
          const tools = data.tools || [];
          
          // Map each tool and tag with its source server url so model can direct it
          const routedTools = tools.map((t: any) => ({
            ...t,
            mcpUrl: server.url,
            sourceServer: server.name
          }));
          
          activeTools.push(...routedTools);
          nextStatusMap[server.name] = 'connected';
          successCount++;
        } else {
          nextStatusMap[server.name] = 'error';
        }
      } catch (e) {
        nextStatusMap[server.name] = 'error';
      }
      setMcpServerStatusMap({ ...nextStatusMap });
    }

    setMcpTools(activeTools);
    setMcpStatus(successCount > 0 ? 'connected' : 'error');
    setMcpMessage(`Connect result: Online: ${successCount}/${parsedServers.length} JSON-schema servers. Registered ${activeTools.length} total tools.`);

    // Update global preferences
    triggerPrefUpdate({
      mcpConfig: JSON.stringify(activeTools)
    });
  };

  // Fallback Add/Delete Form Helpers for visual server listing
  const handleAddNewServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServerName.trim() || !newServerUrl.trim()) return;

    try {
      let currentObj: any = {};
      try {
        currentObj = JSON.parse(mcpServersJsonString);
      } catch (e) {
        currentObj = { mcpServers: {} };
      }

      if (!currentObj || typeof currentObj !== 'object') {
        currentObj = { mcpServers: {} };
      }

      if (!currentObj.mcpServers || typeof currentObj.mcpServers !== 'object') {
        currentObj.mcpServers = {};
      }

      currentObj.mcpServers[newServerName.trim()] = {
        url: newServerUrl.trim()
      };

      const updatedStr = JSON.stringify(currentObj, null, 2);
      setMcpServersJsonString(updatedStr);
      setNewServerName('');
      setNewServerUrl('');
      setIsAddingServer(false);
      
      triggerPrefUpdate({
        mcpServersJson: updatedStr
      });
      
      // Auto-scan to register new endpoints instantly
      setTimeout(() => {
        handleScanAllMcp();
      }, 300);
    } catch (err) {
      console.error('Failed to add new server:', err);
    }
  };

  const handleDeleteServer = (nameToDelete: string) => {
    try {
      let currentObj: any = {};
      try {
        currentObj = JSON.parse(mcpServersJsonString);
      } catch (e) {
        return;
      }

      if (currentObj && currentObj.mcpServers && typeof currentObj.mcpServers === 'object') {
        delete currentObj.mcpServers[nameToDelete];
      } else if (Array.isArray(currentObj)) {
        currentObj = currentObj.filter((s: any) => (s.name !== nameToDelete && s.id !== nameToDelete));
      } else if (currentObj && typeof currentObj === 'object') {
        delete currentObj[nameToDelete];
      }

      const updatedStr = JSON.stringify(currentObj, null, 2);
      setMcpServersJsonString(updatedStr);
      
      triggerPrefUpdate({
        mcpServersJson: updatedStr
      });

      // Recalculate registered tools list smoothly on delete
      setTimeout(() => {
        handleScanAllMcp();
      }, 300);
    } catch (err) {
      console.error('Failed to delete server:', err);
    }
  };

  // Fallback single scanner for backward compatibility
  const handleScanMcp = async () => {
    if (!mcpUrl.trim()) {
      setMcpStatus('idle');
      return;
    }
    setMcpStatus('scanning');
    setMcpMessage('Probing HTTP MCP Handshake...');
    
    try {
      const resp = await fetch(getApiUrl('/api/mcp/scan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mcpUrl.trim() })
      });

      if (resp.ok) {
        const data = await resp.json();
        setMcpStatus(data.status === 'connected' ? 'connected' : 'error');
        
        const toolsFound = data.tools || [];
        setMcpTools(toolsFound);
        setJsonToolsInput(JSON.stringify(toolsFound, null, 2));
        setMcpMessage(data.message || 'Sinks connected.');
        setJsonToolsError(null);

        // Update preferences in the Firebase Cloud database using JSON tools payload
        triggerPrefUpdate({ 
          mcpServer: mcpUrl.trim(),
          mcpConfig: JSON.stringify(toolsFound)
        });
      } else {
        throw new Error('Remote host rejected scanning request.');
      }
    } catch (err: any) {
      setMcpStatus('error');
      setMcpMessage('Failed to scan MCP Server. Initiated fallback simulation tools.');
      const fallbackTools = [
        { name: 'mcp_dir_scan', description: 'Scan Local Node Directories (Simulated)', inputSchema: { type: 'object', properties: { path: { type: 'string' } } } },
        { name: 'mcp_file_write', description: 'Write Sandbox Files (Simulated)', inputSchema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } } } }
      ];
      setMcpTools(fallbackTools);
      setJsonToolsInput(JSON.stringify(fallbackTools, null, 2));
      setJsonToolsError(null);
      triggerPrefUpdate({
        mcpServer: mcpUrl.trim(),
        mcpConfig: JSON.stringify(fallbackTools)
      });
    }
  };

  // Handle applying manuals tools array input directly as JSON payload
  const handleApplyJsonTools = () => {
    try {
      setJsonToolsError(null);
      const parsed = JSON.parse(jsonToolsInput);
      if (!Array.isArray(parsed)) {
        throw new Error('MCP custom tools must be defined inside a valid JSON Array []');
      }
      
      setMcpTools(parsed);
      setMcpStatus('connected');
      setMcpMessage('Successfully loaded and applied manual JSON tools configuration.');
      
      triggerPrefUpdate({
        mcpConfig: JSON.stringify(parsed)
      });
    } catch (e: any) {
      setJsonToolsError(e.message || 'Invalid JSON syntax. Please check braces and format.');
    }
  };

  // On mount if mcp server exists, check connectivity
  useEffect(() => {
    if (userProfile?.mcpServer) {
      handleScanMcp();
    }
  }, []);

  // Poll Roblox sync history
  const fetchRobloxHistory = async () => {
    try {
      const res = await fetch('/api/roblox/history');
      if (res.ok) {
        const data = await res.json();
        setRobloxHistory(data || []);
      }
    } catch (e) {
      // Ignore poll failures in clean static setups
    }
  };

  useEffect(() => {
    fetchRobloxHistory();
    const interval = setInterval(fetchRobloxHistory, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateApiKeyInternal = () => {
    onUpdateApiKey(apiKeyInput.trim());
    setApiKeySavedStatus(true);
    setTimeout(() => setApiKeySavedStatus(false), 2000);
  };

  const copyLuaConnector = () => {
    const luaScript = `-- Mtrini Studio Live Roblox Connector Link
local HttpService = game:GetService("HttpService")
local ServerUrl = "https://ais-dev-2lec2iqt6rhwokfedcy24v-429842933088.europe-west2.run.app" -- Current workspace backend URL

print("[Mtrini Link] Commencing poller thread...")
while true do
    pcall(function()
        local response = HttpService:GetAsync(ServerUrl .. "/api/roblox/commands")
        local commands = HttpService:JSONDecode(response)
        for _, cmd in ipairs(commands) do
            print("[Mtrini Exec] Running tool " .. cmd.name)
            -- Dynamic Roblox Workspace actions are processed here live on command
            if cmd.name == "SpawnBlock" or cmd.name == "mcp_file_write" then
                local block = Instance.new("Part")
                block.Parent = workspace
                block.Position = Vector3.new(0, 10, 0)
                block.Size = Vector3.new(4, 4, 4)
                block.Material = Enum.Material.Neon
                block.BrickColor = BrickColor.new("Cyan")
            end
        end
    end)
    task.wait(1.5)
end`;
    navigator.clipboard.writeText(luaScript);
    setIsCopiedLua(true);
    setTimeout(() => setIsCopiedLua(false), 2000);
  };

  return (
    <motion.div 
      initial={{ x: '100%', opacity: 0.95 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0.95 }}
      transition={{ type: 'spring', damping: 26, stiffness: 220 }}
      className={`fixed inset-y-0 right-0 w-[350px] border-l z-50 flex flex-col font-sans shadow-2xl h-full transition-all duration-200 ${
        darkMode 
          ? 'bg-[#0b0b0d] border-neutral-900 text-neutral-200' 
          : 'bg-white border-neutral-200 text-neutral-800'
      }`}
    >
      {/* Drawer Header */}
      <div className={`p-4 border-b flex items-center justify-between select-none transition-all duration-200 ${
        darkMode ? 'border-neutral-900 bg-neutral-950/70' : 'border-neutral-200 bg-neutral-50'
      }`}>
        <div className="flex items-center gap-2">
          <Settings className={`w-4 h-4 ${darkMode ? 'text-neutral-300' : 'text-neutral-750'}`} />
          <span className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-neutral-900'}`}>Control Desk</span>
        </div>
        <button 
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors cursor-pointer ${
            darkMode ? 'hover:bg-neutral-900 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-550 hover:text-neutral-900'
          }`}
          id="btn-close-drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs navigation */}
      <div className={`flex border-b text-xs select-none ${darkMode ? 'border-neutral-900 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50/50'}`}>
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex-1 py-3 text-center font-bold relative transition-all cursor-pointer ${
            activeTab === 'scripts' 
              ? (darkMode ? 'text-white' : 'text-neutral-900') 
              : 'text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Scripts
          {activeTab === 'scripts' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${themeColors.text}`} />
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 text-center font-bold relative transition-all cursor-pointer ${
            activeTab === 'config' 
              ? (darkMode ? 'text-white' : 'text-neutral-900') 
              : 'text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Settings
          {activeTab === 'config' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${themeColors.text}`} />
          )}
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex-1 py-3 text-center font-bold relative transition-all cursor-pointer ${
            activeTab === 'integrations' 
              ? (darkMode ? 'text-white' : 'text-neutral-900') 
              : 'text-neutral-500 hover:text-neutral-400'
          }`}
        >
          Integrations
          {activeTab === 'integrations' && (
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${themeColors.text}`} />
          )}
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div className={`flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-transparent`}>
        
        {activeTab === 'scripts' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Tools Section */}
            <div className={`space-y-3 pb-5 border-b ${darkMode ? 'border-neutral-900/80' : 'border-neutral-200'}`}>
              <label className={`text-[10px] font-bold uppercase tracking-widest block select-none ${darkMode ? 'text-neutral-450' : 'text-neutral-500'}`}>
                Workspace Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onResetChat}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border text-rose-500 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-98 shadow-sm ${
                    darkMode 
                      ? 'bg-red-955/20 hover:bg-red-955/45 border-red-900/40 hover:border-red-900' 
                      : 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300'
                  }`}
                  title="Reset conversation thread"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset Chat</span>
                </button>
                <button
                  onClick={onExportChat}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 border rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-98 shadow-sm ${
                    darkMode 
                      ? 'bg-neutral-900 hover:bg-neutral-850 border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white' 
                      : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-250 hover:border-neutral-350 text-neutral-700 hover:text-neutral-905'
                  }`}
                  title="Export session markdown"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Script Viewer Container */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={`text-[10px] font-bold uppercase tracking-widest block select-none ${darkMode ? 'text-neutral-450' : 'text-neutral-500'}`}>
                  Script Viewer
                </label>
                <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded font-mono ${
                  darkMode ? 'bg-neutral-900 border-neutral-800 text-neutral-400' : 'bg-neutral-100 border-neutral-200 text-neutral-600'
                }`}>
                  {artifactMessages.length} files
                </span>
              </div>
              
              <p className="text-[11px] text-neutral-500 leading-normal select-none">
                All compiled files, web designs, algorithms, or executable codes built in this workspace. Direct click compiles and opens the file side-by-side.
              </p>

              <div className="space-y-2 pt-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                {artifactMessages.length === 0 ? (
                  <div className={`py-12 p-4 text-center border border-dashed rounded-xl text-xs italic select-none ${
                    darkMode ? 'border-neutral-900 bg-neutral-950 text-neutral-550' : 'border-neutral-200 bg-neutral-50 text-neutral-500'
                  }`}>
                    <FileCode className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                    No custom scripts compiled yet in this session.
                  </div>
                ) : (
                  artifactMessages.map(m => {
                    const parsed = parseMessageArtifacts(m.content || '');
                    const isSelected = selectedArtifactMessageId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectArtifactMessageId(isSelected ? null : m.id);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected 
                            ? (darkMode 
                                ? 'bg-neutral-900 border-neutral-800 ring-1 ring-neutral-700 shadow-sm' 
                                : 'bg-neutral-50 border-neutral-350 ring-1 ring-neutral-300 shadow-sm'
                              )
                            : (darkMode 
                                ? 'bg-neutral-900/40 border-neutral-900 hover:border-neutral-800' 
                                : 'bg-neutral-50 border-neutral-150 hover:border-neutral-250'
                              )
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 flex items-center justify-center h-8 w-8 border ${
                          isSelected 
                            ? (darkMode ? 'bg-neutral-950 border-neutral-805 text-cyan-450' : 'bg-white border-neutral-300 text-indigo-655') 
                            : (darkMode ? 'bg-neutral-950 border-neutral-900 text-neutral-500' : 'bg-white border-neutral-200 text-neutral-500')
                        }`}>
                          <Code className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-bold text-xs truncate block leading-snug ${darkMode ? 'text-neutral-200' : 'text-neutral-850'}`}>{parsed.artifactTitle || 'unnamed_script'}</span>
                          <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block mt-0.5">{parsed.artifactLanguage || 'code'}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'config' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Preferred Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest block text-neutral-500 select-none">Preferred Name</label>
              <input
                type="text"
                value={preferredName}
                onChange={(e) => {
                  setPreferredName(e.target.value);
                  triggerPrefUpdate({ preferredName: e.target.value.trim(), displayName: e.target.value.trim() });
                }}
                placeholder="Name display..."
                className={`w-full text-xs font-semibold p-2.5 px-3 border rounded-xl focus:outline-none transition-all ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-850 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 text-white placeholder-neutral-600' 
                    : 'bg-white border-neutral-250 focus:border-neutral-350 focus:ring-1 focus:ring-neutral-350 text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>

            {/* User prompt bio */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest block text-neutral-500 select-none">System Context / About Me</label>
              <textarea
                value={aboutMe}
                onChange={(e) => {
                  setAboutMe(e.target.value);
                  triggerPrefUpdate({ aboutMe: e.target.value.trim() });
                }}
                placeholder="Provide Mtrini with context about you or instructions... Adhere to modular TypeScript, etc..."
                rows={3}
                className={`w-full text-xs p-2.5 px-3 border rounded-xl focus:outline-none transition-all resize-none leading-relaxed ${
                  darkMode 
                    ? 'bg-neutral-900 border-neutral-850 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700 text-white placeholder-neutral-650' 
                    : 'bg-white border-neutral-250 focus:border-neutral-350 focus:ring-1 focus:ring-neutral-350 text-neutral-900 placeholder-neutral-400'
                }`}
              />
            </div>

            {/* Accent Theme Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest block text-neutral-500 select-none">Color Accent Vibe</label>
              <div className="grid grid-cols-5 gap-1.5">
                {themeOptions.map(opt => {
                  const isActive = userProfile?.themeColor === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => triggerPrefUpdate({ themeColor: opt.value })}
                      className={`h-9 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 text-[10px] font-bold ${
                        isActive 
                          ? (darkMode ? 'border-white bg-[#151518]' : 'border-neutral-900 bg-neutral-100')
                          : (darkMode ? 'border-neutral-850 bg-neutral-900/40 hover:border-neutral-7c' : 'border-neutral-200 bg-white hover:bg-neutral-50')
                      }`}
                      title={`${opt.label} color theme accent`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${opt.color} shadow-3xs border border-white/10`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bridge Credentials Key */}
            <div className="space-y-1.5 border-t pt-4 mt-2 border-dashed border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest block text-neutral-500 select-none">Tunnel Bridge API Override</label>
                <HelpCircle className="w-3.5 h-3.5 text-neutral-500 cursor-help" title="Input custom key here to execute direct calls locally in proxy bypass state. Base64 triggers automatic offline decoding." />
              </div>
              <p className="text-[10px] text-neutral-505 leading-relaxed pb-1 select-none">
                Direct browser bypass. Paste your browser key to maintain offline compiling capabilities if sandbox servers freeze up.
              </p>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Enter custom Gemini API Key..."
                  className={`w-full text-xs font-mono p-2.5 pl-3 pr-10 border rounded-xl focus:outline-none transition-all ${
                    darkMode 
                      ? 'bg-neutral-900 border-neutral-850 focus:border-neutral-700 text-white placeholder-neutral-600' 
                      : 'bg-white border-neutral-250 focus:border-neutral-350 text-neutral-900 placeholder-neutral-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-300 cursor-pointer"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleUpdateApiKeyInternal}
                className={`w-full py-2 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs hover:scale-[1.01] active:scale-[0.99] ${
                  apiKeySavedStatus 
                    ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-500 border-emerald-500' 
                    : (darkMode 
                        ? 'bg-white text-neutral-950 border-white hover:bg-neutral-200' 
                        : 'bg-neutral-900 text-white border-neutral-900 hover:bg-neutral-800'
                      )
                }`}
              >
                {apiKeySavedStatus ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span>Credentials Saved!</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5" />
                    <span>Configure Overrides</span>
                  </>
                )}
              </button>
            </div>

            {/* Keyboard Shortcuts Toggle */}
            <div className="flex items-center justify-between pt-3 border-t border-dashed border-neutral-800">
              <div className="space-y-0.5 max-w-[80%] select-none">
                <span className={`text-xs font-bold block ${darkMode ? 'text-neutral-200' : 'text-neutral-800'}`}>Alt Hotkeys</span>
                <span className="text-[10px] text-neutral-500 leading-normal block">Enable hotkeys (Alt+N: Chat, Alt+S: Settings)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShortcutsEnabled(!shortcutsEnabled);
                  triggerPrefUpdate({ shortcutsEnabled: !shortcutsEnabled });
                }}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                  shortcutsEnabled ? (darkMode ? 'bg-cyan-500' : 'bg-neutral-900') : 'bg-neutral-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                    shortcutsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </motion.div>
        )}

        {activeTab === 'integrations' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Multi-MCP System integration Desk */}
            <div className={`space-y-3.5 border rounded-xl p-3.5 shadow-3xs sm:p-4 bg-neutral-950/25 border-neutral-900`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 select-none">
                  <Globe className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <span className="text-xs font-extrabold tracking-tight">Multi-MCP Configuration</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-md font-bold ${
                    mcpStatus === 'connected' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : mcpStatus === 'scanning'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {mcpStatus}
                  </span>
                </div>
              </div>

              <p className="text-[10.5px] text-neutral-500 leading-relaxed select-none">
                Connect multiple HTTP model context protocol servers dynamically. Advanced tools are combined automatically.
              </p>

              {/* Action desk buttons bar */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => handleScanAllMcp()}
                  disabled={mcpStatus === 'scanning'}
                  className={`py-2 px-2.5 border rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                    mcpStatus === 'scanning'
                      ? 'bg-neutral-905 border-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-cyan-500 text-neutral-950 border-cyan-500 hover:bg-cyan-400'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${mcpStatus === 'scanning' ? 'animate-spin' : ''}`} />
                  <span>Scan & Sync All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMcpJsonCodeEditor(!showMcpJsonCodeEditor)}
                  className={`py-2 px-2.5 border rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-[0.99] ${
                    showMcpJsonCodeEditor
                      ? 'bg-neutral-805 text-white border-neutral-700'
                      : 'bg-[#151518]/80 text-neutral-200 border-neutral-800 hover:bg-neutral-850'
                  }`}
                >
                  <FileJson className="w-3 h-3" />
                  <span>{showMcpJsonCodeEditor ? 'Form View' : 'Raw JSON Schema'}</span>
                </button>
              </div>

              {/* Status banner */}
              {mcpMessage && (
                <div className={`p-2 rounded-lg border text-[9.5px] leading-relaxed select-none ${
                  mcpStatus === 'error'
                    ? 'bg-rose-500/5 border-rose-500/10 text-rose-400'
                    : 'bg-cyan-500/5 border-cyan-500/10 text-cyan-400'
                }`}>
                  {mcpMessage}
                </div>
              )}

              {/* Raw JSON Input Panel */}
              {showMcpJsonCodeEditor ? (
                <div className="space-y-2 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none">Standard Claude Configuration</span>
                    <span className="text-[8px] text-neutral-550 leading-none">Auto-Syncs on changes</span>
                  </div>
                  <textarea
                    value={mcpServersJsonString}
                    onChange={(e) => {
                      setMcpServersJsonString(e.target.value);
                      try {
                        JSON.parse(e.target.value);
                        triggerPrefUpdate({ mcpServersJson: e.target.value });
                      } catch(err) {
                        // Keep typing text-mode without firing DB save until correct syntax
                      }
                    }}
                    placeholder={`{\n  "mcpServers": {\n    "name": { "url": "..." }\n  }\n}`}
                    rows={6}
                    className="w-full font-mono text-[10px] p-2.5 border rounded-xl bg-[#09090b] border-[#151518] text-emerald-450 focus:outline-none transition-all leading-normal focus:border-neutral-700"
                  />
                  <div className="bg-[#09090b]/40 rounded-lg p-2 border border-neutral-900/65 leading-normal text-[9px] text-neutral-500 select-none">
                    💡 Custom ports, custom schema handles, and direct Claude Desktop system file configurations are mapped instantly.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-neutral-505 uppercase tracking-widest select-none">Configured Endpoints ({parsedServers.length})</span>
                    {!isAddingServer && (
                      <button
                        type="button"
                        onClick={() => setIsAddingServer(true)}
                        className="text-[9.5px] font-bold transition-all flex items-center gap-1 shrink-0 text-cyan-455 hover:text-cyan-350"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Server</span>
                      </button>
                    )}
                  </div>

                  {/* Form to visual add endpoint */}
                  {isAddingServer && (
                    <form onSubmit={handleAddNewServer} className="p-2.5 border border-neutral-805 bg-[#09090b]/80 rounded-xl space-y-2">
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          required
                          value={newServerName}
                          onChange={(e) => setNewServerName(e.target.value.replace(/[^a-zA-Z0-9_\-]/g, ''))}
                          placeholder="server-handle (e.g. weather)"
                          className="text-[10px] p-1.5 border rounded-lg focus:outline-none focus:ring-1 bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:ring-neutral-700"
                        />
                        <input
                          type="url"
                          required
                          value={newServerUrl}
                          onChange={(e) => setNewServerUrl(e.target.value)}
                          placeholder="https://mcp-server/api"
                          className="text-[10px] p-1.5 border rounded-lg focus:outline-none focus:ring-1 bg-neutral-900 border-neutral-800 text-white placeholder-neutral-600 focus:ring-neutral-700"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setIsAddingServer(false)}
                          className="px-2 py-1 text-[9.5px] font-bold text-neutral-500 hover:text-neutral-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-[9.5px] font-bold rounded-lg cursor-pointer bg-white text-neutral-950 hover:bg-neutral-200"
                        >
                          Add Endpoint
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Visual listing of parsed endpoints */}
                  <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                    {parsedServers.length === 0 ? (
                      <div className="text-center py-5 italic text-[10px] text-neutral-550 select-none">
                        No active MCP servers. Click Add Server to start.
                      </div>
                    ) : (
                      parsedServers.map((server) => {
                        const sStatus = mcpServerStatusMap[server.name] || 'idle';
                        return (
                          <div
                            key={server.name}
                            className="flex items-center justify-between p-2 rounded-xl border bg-[#09090b]/40 border-neutral-900"
                          >
                            <div className="flex-1 min-w-0 pr-2">
                              <div className="flex items-center gap-1.5 select-none">
                                <span className="font-extrabold text-[11px] truncate block text-neutral-200">{server.name}</span>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  sStatus === 'connected'
                                    ? 'bg-emerald-500 shadow-3xs'
                                    : sStatus === 'scanning'
                                      ? 'bg-cyan-500 animate-pulse'
                                      : sStatus === 'error'
                                        ? 'bg-rose-500'
                                        : 'bg-neutral-600'
                                }`} />
                              </div>
                              <span className="text-[9px] font-mono text-neutral-500 truncate block mt-0.5">{server.url}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteServer(server.name)}
                              className="p-1 text-neutral-500 hover:text-rose-500 cursor-pointer transition-all active:scale-[0.85]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Native Local Network Connection Detector */}
              {(() => {
                const isLocalhostApp = typeof window !== 'undefined' && 
                  (window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.startsWith('192.168.'));

                if (isLocalhostApp) {
                  return (
                    <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20 text-emerald-400 select-none text-[10px]">
                      <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        🟢 Native Desktop Mode Active
                      </span>
                      <span className="block mt-1.5 text-neutral-450 leading-relaxed font-sans">
                        Running locally on this computer. Your requests can pair with any <strong>direct local backend servers</strong> (e.g. <code className="bg-black/35 px-1 py-0.5 rounded text-emerald-350">http://localhost:8000</code>) straight through this client safely!
                      </span>
                    </div>
                  );
                }

                return (
                  <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/15 text-amber-500 select-none text-[10px] space-y-2">
                    <span className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider">
                      🌐 Cloud Sandboxed Preview Mode
                    </span>
                    <p className="text-neutral-400 leading-normal font-sans">
                      Because this live preview is hosted remotely on Google Cloud Run, it can't reach address <code>localhost</code> inside your house directly without a proxy tunnel.
                    </p>
                    
                    {/* Native Desktop Executable Downloads */}
                    <div className="pt-2 border-t border-amber-500/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[9px] uppercase tracking-wide text-amber-400 block">📥 Download Native 1-Click Desktop App:</span>
                      </div>
                      
                      <div className="bg-amber-500/5 rounded-lg p-2 border border-amber-500/10 text-[9px] text-amber-500/80 leading-snug font-sans">
                        ⚠️ <strong>Tip:</strong> If your browser blocks downloading inside the preview pane, click the <strong className="text-amber-400">"Open in New Tab"</strong> button (icon at the top right of this preview), then download flawlessly in 1 click!
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        <a 
                          href="/api/download/mtrini?platform=windows" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/45 rounded-lg text-amber-350 font-bold transition text-[9px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                            Windows App (.zip)
                          </span>
                          <span className="bg-black/35 px-1 py-0.5 rounded text-[8px] font-mono text-amber-350 whitespace-nowrap">Win 10/11</span>
                        </a>
                        <a 
                          href="/api/download/mtrini?platform=mac-silicon" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/45 rounded-lg text-amber-350 font-bold transition text-[9px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-amber-400" />
                            macOS Apple Silicon (.zip)
                          </span>
                          <span className="bg-black/35 px-1 py-0.5 rounded text-[8px] font-mono text-amber-350 whitespace-nowrap">Mac Arm64</span>
                        </a>
                        <a 
                          href="/api/download/mtrini?platform=mac-intel" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-neutral-800/40 hover:bg-neutral-800/70 border border-neutral-700/30 hover:border-neutral-700/60 rounded-lg text-neutral-400 font-bold transition text-[9px]"
                        >
                          <span className="flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-neutral-500" />
                            macOS Old Intel Wrapper (.zip)
                          </span>
                          <span className="bg-black/35 px-1 py-0.5 rounded text-[8px] font-mono text-neutral-500 whitespace-nowrap">Mac x64</span>
                        </a>
                      </div>
                      <p className="text-[8px] text-neutral-500 leading-normal font-sans select-text">
                        Extract the ZIP archive and double-click the launcher to open Mtrini Studio in your browser, enabling <strong>instant direct local connections with local MCP tools and servers!</strong>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-500/10 space-y-1.5 text-left">
                      <span className="font-extrabold text-[9px] uppercase tracking-wide text-neutral-300 block">⚡ Alternative: Boot Entirely Locally via Node:</span>
                      <ol className="list-decimal pl-4 text-neutral-400 text-[9px] space-y-1 font-sans">
                        <li>Download or export this project folder as a ZIP file.</li>
                        <li>Open your terminal in this directory and run <code className="bg-black/45 px-1 py-0.5 text-amber-300 rounded font-mono">npm install</code>.</li>
                        <li>Add your <code className="bg-black/45 px-1 py-0.5 text-amber-300 rounded font-mono">GEMINI_API_KEY</code> environment variable.</li>
                        <li>Type <code className="bg-black/45 px-1 py-0.5 text-amber-300 rounded font-mono font-bold">npm run dev</code> to boot up on <code className="text-amber-300 font-mono">localhost:3000</code>.</li>
                      </ol>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Roblox Command Sync poller */}
            <div className={`space-y-2 border border-neutral-900 rounded-xl p-3 bg-neutral-950/20 shadow-3xs sm:p-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 select-none">
                  <Layout className={`w-4 h-4 text-rose-500`} />
                  <span className="text-xs font-extrabold tracking-tight">Roblox Studio Poller</span>
                </div>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Ready for connections" />
              </div>
              
              <p className="text-[10px] text-neutral-500 leading-relaxed select-none">
                Spawn code artifacts, models, blocks, or interface layouts straight to Roblox Studio using Mtrini polling.
              </p>

              <button
                onClick={copyLuaConnector}
                className={`w-full py-2 border rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                  isCopiedLua 
                    ? 'bg-emerald-500 text-neutral-950 border-emerald-500' 
                    : (darkMode ? 'bg-[#151518]/80 hover:bg-neutral-850 text-neutral-300 border-neutral-805' : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-250')
                }`}
              >
                {isCopiedLua ? (
                  <>
                    <Check className="w-3 h-3 stroke-[2.5px]" />
                    <span>LUA Hook Copied!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span>Copy LUA command bar hook</span>
                  </>
                )}
              </button>

              {/* Commands poll history */}
              <div className="space-y-1.5 mt-2.5- pt-2 select-none">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-neutral-450 uppercase tracking-widest font-mono">Poll Pipeline Registry</span>
                  <span className="text-[9px] font-mono text-neutral-500 select-none">polling active</span>
                </div>
                <div className={`max-h-24 overflow-y-auto custom-scrollbar space-y-1 rounded-lg border font-mono text-[9.5px] p-2 ${
                  darkMode ? 'bg-[#09090b] border-[#151518]' : 'bg-neutral-50 border-neutral-200'
                }`}>
                  {robloxHistory.length === 0 ? (
                    <span className="text-neutral-550 italic text-[9px] block text-center py-4">
                      Waiting for active poller commands queue...
                    </span>
                  ) : (
                    robloxHistory.map((cmd) => (
                      <div key={cmd.id} className="flex items-start justify-between border-b pb-1 last:border-b-0 last:pb-0 border-neutral-900/60 leading-relaxed">
                        <div className="flex flex-col">
                          <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{cmd.name}</span>
                          <span className="text-[7.5px] text-neutral-500 max-w-[130px] truncate">{JSON.stringify(cmd.arguments || {})}</span>
                        </div>
                        <span className="text-[7.5px] text-neutral-555">{new Date(cmd.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Simplified Footer */}
      <div className={`p-4 border-t mt-auto text-center text-[10px] text-neutral-500 font-sans select-none transition-all duration-200 ${
        darkMode ? 'border-neutral-900 bg-[#070708]' : 'border-neutral-200 bg-neutral-100'
      }`}>
        <span>Mtrini Studio Workspace</span>
      </div>
    </motion.div>
  );
}
