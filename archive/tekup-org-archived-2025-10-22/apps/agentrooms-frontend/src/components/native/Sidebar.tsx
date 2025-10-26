import { MessageCircle, Users, Settings, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { useAgentConfig } from "../../hooks/useAgentConfig";
import { SettingsModal } from "../SettingsModal";
import { AuthButton } from "../auth/AuthButton";

interface SidebarProps {
  activeAgentId: string | null;
  agentSessions: Record<string, { sessionId: string | null; messages: any[] }>;
  onAgentSelect: (agentId: string) => void;
  onNewAgentRoom: () => void;
  currentMode: "group" | "agent";
  onModeChange: (mode: "group" | "agent") => void;
}

const getAgentColor = (agentId: string) => {
  // Map agent IDs to CSS color variables, with fallback
  const colorMap: Record<string, string> = {
    "readymojo-admin": "var(--agent-admin)",
    "readymojo-api": "var(--agent-api)", 
    "readymojo-web": "var(--agent-web)",
    "peakmojo-kit": "var(--agent-kit)",
  };
  return colorMap[agentId] || "var(--claude-text-accent)";
};

export function Sidebar({ 
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-frontend-src-c');

  activeAgentId, 
  agentSessions, 
  onAgentSelect, 
  onNewAgentRoom,
  currentMode,
  onModeChange 
}: SidebarProps) {
  const [showSettings, setShowSettings] = useState(false);
  const { getWorkerAgents, syncFromBackend, isSyncing } = useAgentConfig();
  const agents = getWorkerAgents();

  const handleSyncClick = async () => {
    try {
      await syncFromBackend();
    } catch (e) {
      logger.warn("Sync failed", e);
    }
  };

  return (
    <div className="layout-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <MessageCircle size={14} />
          </div>
          <div className="sidebar-brand-text">
            <h1>Agentrooms</h1>
            <p>Multi-Agent Workspace</p>
          </div>
        </div>

        {/* Agent Room Button */}
        <button
          onClick={() => {
            onNewAgentRoom();
            onModeChange("group");
          }}
          className={`sidebar-button ${currentMode === "group" ? "active" : ""}`}
        >
          <Users className="sidebar-button-icon" />
          Agent Room
          {currentMode === "group" && <span className="sidebar-button-badge">•</span>}
        </button>
      </div>

      {/* Agents Section */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Agents</div>
        {isSyncing && (
          <div style={{ fontSize: 12, color: "var(--claude-text-subtle)" }}>Syncing…</div>
        )}
      </div>
      
      <div className="sidebar-agent-list">
        {agents.length === 0 ? (
          <div className="sidebar-empty">
            <div className="sidebar-empty-title">No worker agents yet</div>
            <div className="sidebar-empty-desc">Add agents to collaborate or sync from backend registry.</div>
            <div className="sidebar-empty-actions">
              <button className="sidebar-button" onClick={() => setShowSettings(true)}>
                <Settings className="sidebar-button-icon" />
                Open Settings
              </button>
              <button className="sidebar-button" onClick={handleSyncClick} disabled={isSyncing}>
                <RefreshCcw className="sidebar-button-icon" />
                {isSyncing ? "Syncing…" : "Sync from Backend"}
              </button>
            </div>
          </div>
        ) : (
          agents.map((agent) => {
            const isActive = activeAgentId === agent.id && currentMode === "agent";
            const hasMessages = agentSessions[agent.id]?.messages.length > 0;
            const messageCount = agentSessions[agent.id]?.messages.length || 0;
            
            return (
              <div
                key={agent.id}
                onClick={() => {
                  onAgentSelect(agent.id);
                  onModeChange("agent");
                }}
                className={`sidebar-agent-item ${isActive ? "active" : ""}`}
              >
                {/* Agent Indicator */}
                <div 
                  className="sidebar-agent-dot"
                  style={{ backgroundColor: getAgentColor(agent.id) }}
                />
                
                {/* Agent Info */}
                <div className="sidebar-agent-info">
                  <div className="sidebar-agent-name">{agent.name}</div>
                  <div className="sidebar-agent-desc">{agent.description}</div>
                </div>

                {/* Message Count */}
                {hasMessages && (
                  <div className="sidebar-agent-count">{messageCount}</div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-header" style={{ borderTop: "1px solid var(--claude-border)", borderBottom: "none" }}>
        {/* Authentication Section */}
        <AuthButton />
        
        {/* Settings Button */}
        <button 
          className="sidebar-button"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="sidebar-button-icon" />
          Settings
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}