export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  credits: number;
  themeColor: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'violet';
  mcpServer: string;
  bridgeUrl?: string;
  isPremiumActive?: boolean;
  mcpConfig?: string;
  mcpServersJson?: string;
  streamingEnabled?: boolean;
  compilationSpeed?: 'fast' | 'balanced' | 'safe';
  shortcutsEnabled?: boolean;
  createdAt: Date;
  preferredName?: string;
  aboutMe?: string;
  setupCompleted?: boolean;
}

export type ViewType = 'chat' | 'notes' | 'tools';

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChatThread {
  id: string;
  title: string;
  userId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  code: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
  hasArtifact?: boolean;
  artifactTitle?: string;
  artifactCode?: string;
  artifactType?: string;
}

export interface ThemeColors {
  primary: string;
  glow: string;
  border: string;
  bg: string;
  text: string;
  glowClass: string;
  ring?: string;
  hoverBorder?: string;
}

export interface McpServerConfig {
  url: string;
  status: 'disconnected' | 'connected' | 'error';
  registeredTools: McpTool[];
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}
