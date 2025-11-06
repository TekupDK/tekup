/**
 * Email Context Provider
 *
 * Tracks user's current state in EmailTab:
 * - Selected emails
 * - Open thread
 * - Current folder/view
 * - Selected labels
 *
 * This context is sent to AI with every message for better understanding.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

export interface EmailContextState {
  // Selected emails (by thread ID)
  selectedThreads: Set<string>;

  // Currently open thread
  openThreadId: string | null;

  // Current view
  folder: "inbox" | "sent" | "archive" | "starred";
  viewMode: "list" | "pipeline" | "dashboard";

  // Selected labels
  selectedLabels: string[];

  // Search query
  searchQuery: string;

  // Draft count
  openDrafts: number;

  // Preview modal
  previewThreadId: string | null;
}

interface EmailContextValue {
  state: EmailContextState;
  updateState: (updates: Partial<EmailContextState>) => void;
  selectThread: (threadId: string, add?: boolean) => void;
  deselectThread: (threadId: string) => void;
  clearSelection: () => void;
  getContextForAI: () => string;
}

const EmailContext = createContext<EmailContextValue | null>(null);

export function EmailContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmailContextState>({
    selectedThreads: new Set(),
    openThreadId: null,
    folder: "inbox",
    viewMode: "list",
    selectedLabels: [],
    searchQuery: "",
    openDrafts: 0,
    previewThreadId: null,
  });

  const updateState = useCallback((updates: Partial<EmailContextState>) => {
    setState(prev => ({
      ...prev,
      ...updates,
      // Handle Set updates properly
      selectedThreads: updates.selectedThreads ?? prev.selectedThreads,
    }));
  }, []);

  const selectThread = useCallback((threadId: string, add = true) => {
    setState(prev => {
      const newSet = new Set(prev.selectedThreads);
      if (add) {
        newSet.add(threadId);
      } else {
        newSet.delete(threadId);
      }
      return { ...prev, selectedThreads: newSet };
    });
  }, []);

  const deselectThread = useCallback((threadId: string) => {
    setState(prev => {
      const newSet = new Set(prev.selectedThreads);
      newSet.delete(threadId);
      return { ...prev, selectedThreads: newSet };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({ ...prev, selectedThreads: new Set() }));
  }, []);

  const getContextForAI = useCallback(() => {
    const parts: string[] = [];

    // Current view
    parts.push(`User is viewing: ${state.folder} folder`);
    if (state.viewMode !== "list") {
      parts.push(`View mode: ${state.viewMode}`);
    }

    // Selected emails
    if (state.selectedThreads.size > 0) {
      parts.push(
        `User has ${state.selectedThreads.size} email thread(s) selected`
      );
      if (state.selectedThreads.size <= 5) {
        const threadIds = Array.from(state.selectedThreads);
        parts.push(`Selected thread IDs: ${threadIds.join(", ")}`);
      }
    }

    // Open thread
    if (state.openThreadId) {
      parts.push(`User is viewing thread: ${state.openThreadId}`);
    }

    // Preview modal
    if (state.previewThreadId) {
      parts.push(
        `User has preview modal open for thread: ${state.previewThreadId}`
      );
    }

    // Selected labels
    if (state.selectedLabels.length > 0) {
      parts.push(`Filtered by labels: ${state.selectedLabels.join(", ")}`);
    }

    // Search
    if (state.searchQuery) {
      parts.push(`Search query: "${state.searchQuery}"`);
    }

    // Drafts
    if (state.openDrafts > 0) {
      parts.push(`User has ${state.openDrafts} draft(s) open`);
    }

    return parts.length > 0 ? parts.join("\n") : "User is in email tab";
  }, [state]);

  return (
    <EmailContext.Provider
      value={{
        state,
        updateState,
        selectThread,
        deselectThread,
        clearSelection,
        getContextForAI,
      }}
    >
      {children}
    </EmailContext.Provider>
  );
}

export function useEmailContext() {
  const context = useContext(EmailContext);
  if (!context) {
    // Return a safe default if not within provider (prevents crashes)
    return {
      state: {
        selectedThreads: new Set(),
        openThreadId: null,
        folder: "inbox",
        viewMode: "list",
        selectedLabels: [],
        searchQuery: "",
        openDrafts: 0,
        previewThreadId: null,
      },
      updateState: () => {},
      selectThread: () => {},
      deselectThread: () => {},
      clearSelection: () => {},
      getContextForAI: () => "",
    };
  }
  return context;
}
