import { useState, useEffect } from "react";
import { getAgentsUrl } from "../config/api";

export interface Agent {
  id: string;
  name: string;
  workingDirectory: string;
  color: string;
  description: string;
  apiEndpoint: string;
  isOrchestrator?: boolean;
}

export interface AgentSystemConfig {
  agents: Agent[];
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: "orchestrator",
    name: "Orchestrator Agent",
    workingDirectory: "/tmp/orchestrator",
    color: "bg-gradient-to-r from-blue-500 to-purple-500",
    description: "Intelligent orchestrator that coordinates multi-agent workflows",
    apiEndpoint: "https://api.claudecode.run",
    isOrchestrator: true
  }
];

const DEFAULT_CONFIG: AgentSystemConfig = {
  agents: DEFAULT_AGENTS,
};

const STORAGE_KEY = "agent-system-config";
const SYNC_FLAG_KEY = "agent-system-synced";

export function useAgentConfig() {
import { createLogger } from '@tekup/shared';
const logger = createLogger('apps-agentrooms-frontend-src-h');

  const [config, setConfig] = useState<AgentSystemConfig>(DEFAULT_CONFIG);
  const [isInitialized, setIsInitialized] = useState(false);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initialize config on client side
    logger.info("🚀 useAgentConfig initializing...", { storageKey: STORAGE_KEY });
    
    // Check if running in Electron
    const isElectron = (window as any).electronAPI?.storage;
    
    if (isElectron) {
      // Use Electron's persistent storage
      (window as any).electronAPI!.storage.loadAgentConfig().then((result: any) => {
        if (result.success && result.data) {
          logger.info("📖 Loading from Electron storage:", result.data);
          setConfig(result.data);
        } else {
          logger.info("🆕 No saved Electron config, using defaults");
          setConfig(DEFAULT_CONFIG);
          (window as any).electronAPI!.storage.saveAgentConfig(DEFAULT_CONFIG);
        }
        setIsInitialized(true);
      }).catch((error: any) => {
        logger.warn("❌ Failed to load from Electron storage:", error);
        setConfig(DEFAULT_CONFIG);
        setIsInitialized(true);
      });
    } else {
      // Fallback to localStorage for web
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        logger.info("📖 Loading from localStorage:", saved);
      
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        logger.info("📝 Parsed config:", parsedConfig);
        
        // Simply use the saved config, merging with any new default agents
        const existingAgentIds = new Set(parsedConfig.agents?.map((a: Agent) => a.id) || []);
        const newDefaultAgents = DEFAULT_CONFIG.agents.filter(agent => !existingAgentIds.has(agent.id));
        
        const mergedConfig = {
          agents: [...(parsedConfig.agents || []), ...newDefaultAgents]
        };
        logger.info("🔀 Merged config:", mergedConfig);
        setConfig(mergedConfig);
        
        // Save the merged config if new agents were added
        if (newDefaultAgents.length > 0) {
          logger.info("💾 Saving merged config with new agents:", newDefaultAgents);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedConfig));
        }
      } else {
        // No saved config, use defaults
        logger.info("🆕 No saved config, using defaults");
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      }
      } catch (error) {
        logger.warn("❌ Failed to load agent configuration:", error);
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
      }
      setIsInitialized(true);
    }
  }, [updateTrigger]);

  // Listen for storage events and force refresh (important for Electron)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      logger.info("📡 Storage event detected:", e);
      if (e.key === STORAGE_KEY) {
        logger.info("🔄 Triggering config refresh due to storage change");
        setUpdateTrigger(prev => prev + 1);
      }
    };

    // Listen to custom config update events
    const handleCustomConfigUpdate = (e: CustomEvent) => {
      logger.info("🎯 Custom agentConfigUpdated event received:", e.detail);
      setUpdateTrigger(prev => prev + 1);
    };

    // Listen to storage events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('agentConfigUpdated', handleCustomConfigUpdate as unknown as EventListener);
    
    // For Electron, also listen to focus events to refresh config
    const handleFocus = () => {
      logger.info("👁️ Window focus - checking for config changes");
      const current = localStorage.getItem(STORAGE_KEY);
      const currentStringified = JSON.stringify(config);
      if (current && current !== currentStringified) {
        logger.info("🔄 Config changed while window was unfocused, refreshing");
        setUpdateTrigger(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('agentConfigUpdated', handleCustomConfigUpdate as unknown as EventListener);
      window.removeEventListener('focus', handleFocus);
    };
  }, [config]);

  const updateConfig = (newConfig: Partial<AgentSystemConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    logger.info("🔧 updateConfig called:", {
      currentConfig: config,
      newConfig,
      updatedConfig,
      storageKey: STORAGE_KEY
    });
    setConfig(updatedConfig);
    
    const isElectron = (window as any).electronAPI?.storage;
    
    if (isElectron) {
      // Use Electron's persistent storage
      (window as any).electronAPI!.storage.saveAgentConfig(updatedConfig).then((result: any) => {
        if (result.success) {
          logger.info("💾 Saved to Electron storage");
          
          // Force refresh of other hook instances
          logger.info("🔄 Triggering refresh for all hook instances");
          setUpdateTrigger(prev => prev + 1);
          
          // Dispatch a custom event to notify other components
          window.dispatchEvent(new CustomEvent('agentConfigUpdated', { 
            detail: updatedConfig 
          }));
        } else {
          logger.error("❌ Failed to save to Electron storage:", result.error);
        }
      });
    } else {
      // Fallback to localStorage for web
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedConfig));
        logger.info("💾 Saved to localStorage:", JSON.stringify(updatedConfig, null, 2));
        
        // Verify it was saved
        const verification = localStorage.getItem(STORAGE_KEY);
        logger.info("✅ Verification read:", verification);
        
        // Force refresh of other hook instances (important for Electron)
        logger.info("🔄 Triggering refresh for all hook instances");
        setUpdateTrigger(prev => prev + 1);
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('agentConfigUpdated', { 
          detail: updatedConfig 
        }));
        
      } catch (error) {
        logger.error("❌ Failed to save agent configuration:", error);
      }
    }
  };

  const addAgent = (agent: Agent) => {
    // Auto-assign orchestrator status if this is the first agent
    const isFirstAgent = config.agents.length === 0;
    const agentWithOrchestratorStatus = {
      ...agent,
      isOrchestrator: isFirstAgent
    };
    
    const updatedAgents = [...config.agents, agentWithOrchestratorStatus];
    updateConfig({ agents: updatedAgents });
  };

  const updateAgent = (agentId: string, updates: Partial<Agent>) => {
    const updatedAgents = config.agents.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    );
    updateConfig({ agents: updatedAgents });
  };

  const removeAgent = (agentId: string) => {
    const updatedAgents = config.agents.filter(agent => agent.id !== agentId);
    updateConfig({ agents: updatedAgents });
  };

  const resetConfig = () => {
    logger.info("🔄 resetConfig called - resetting to defaults");
    setConfig(DEFAULT_CONFIG);
    try {
      localStorage.removeItem(STORAGE_KEY);
      logger.info("🗑️ Removed config from localStorage");
      
      // Force refresh of other hook instances (important for Electron)
      setUpdateTrigger(prev => prev + 1);
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('agentConfigUpdated', { 
        detail: DEFAULT_CONFIG 
      }));
      
    } catch (error) {
      logger.error("❌ Failed to reset agent configuration:", error);
    }
  };

  const getAgentById = (id: string): Agent | undefined => {
    return config.agents.find(agent => agent.id === id);
  };

  const getWorkerAgents = (): Agent[] => {
    return config.agents.filter(agent => !agent.isOrchestrator);
  };

  const getOrchestratorAgent = (): Agent | undefined => {
    return config.agents.find(agent => agent.isOrchestrator);
  };

  // Backend sync + auto-seed
  const syncFromBackend = async (): Promise<number> => {
    if (isSyncing) return 0;
    setIsSyncing(true);
    try {
      const orchestrator = getOrchestratorAgent();
      const orchestratorEndpoint = orchestrator?.apiEndpoint || "https://api.claudecode.run";

      const response = await fetch(getAgentsUrl(orchestratorEndpoint));
      if (!response.ok) {
        throw new Error(`Failed to fetch agents: ${response.status} ${response.statusText}`);
      }
      const backendAgents: Array<{
        id: string;
        name: string;
        description: string;
        provider: string;
        apiEndpoint?: string;
        workingDirectory?: string;
        isOrchestrator?: boolean;
      }> = await response.json();

      const existingIds = new Set(config.agents.map(a => a.id));

      const mapped = backendAgents
        .filter(a => !a.isOrchestrator) // we already have orchestrator in defaults
        .map(a => {
          const endpoint = a.apiEndpoint || orchestratorEndpoint;
          const color = "bg-gradient-to-r from-emerald-500 to-teal-500"; // simple default
          return {
            id: a.id,
            name: a.name,
            description: a.description || "",
            workingDirectory: a.workingDirectory || "/",
            apiEndpoint: endpoint,
            color,
            isOrchestrator: false,
          } as Agent;
        })
        .filter(a => !existingIds.has(a.id));

      if (mapped.length > 0) {
        updateConfig({ agents: [...config.agents, ...mapped] });
      }

      // Mark as synced to avoid repeated auto-seed attempts
      try { localStorage.setItem(SYNC_FLAG_KEY, "true"); } catch {}

      return mapped.length;
    } catch (err) {
      logger.warn("⚠️ Backend sync failed, will keep local config.", err);
      return 0;
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-seed on first run if no worker agents
  useEffect(() => {
    if (!isInitialized) return;
    const hasWorkers = getWorkerAgents().length > 0;
    const alreadySynced = (() => { try { return localStorage.getItem(SYNC_FLAG_KEY) === "true"; } catch { return false; }})();
    if (!hasWorkers && !alreadySynced) {
      (async () => {
        const added = await syncFromBackend();
        // Fallback: ensure at least an Implementation agent exists
        if (added === 0) {
          const exists = config.agents.some(a => a.id === "implementation");
          if (!exists) {
            const orchestrator = getOrchestratorAgent();
            const orchestratorEndpoint = orchestrator?.apiEndpoint || "https://api.claudecode.run";
            addAgent({
              id: "implementation",
              name: "Implementation Agent",
              description: "Claude Code agent for implementing changes and capturing screenshots",
              workingDirectory: "/",
              apiEndpoint: orchestratorEndpoint,
              color: "bg-gradient-to-r from-amber-500 to-orange-500",
            });
          }
        }
      })();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized]);

  return {
    config,
    agents: config.agents, // Add this for compatibility
    updateConfig,
    addAgent,
    updateAgent,
    removeAgent,
    resetConfig,
    getAgentById,
    getWorkerAgents,
    getOrchestratorAgent,
    isInitialized,
    // New sync API
    syncFromBackend,
    isSyncing,
  };
}