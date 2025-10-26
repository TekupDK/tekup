import Link from 'next/link';
import { Bot, Home, Settings, LayoutDashboard } from 'lucide-react';

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/10 bg-neutral-950/60 backdrop-blur-md p-4 hidden md:block">
      <div className="flex items-center gap-2 mb-6">
        <Bot className="w-5 h-5 text-blue-400" />
        <span className="font-semibold">TekUp Agents Hub</span>
      </div>
      <nav className="space-y-1 text-sm">
        <Link className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5" href="/">
          <Home className="w-4 h-4" /> Oversigt
        </Link>
        <Link className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5" href="/mcp">
          <LayoutDashboard className="w-4 h-4" /> MCP Studio
        </Link>
        <Link className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5" href="/agents/voice-gemini">
          <LayoutDashboard className="w-4 h-4" /> Voice Agent
        </Link>
        <Link className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/5" href="/agents/inbox-openai">
          <Settings className="w-4 h-4" /> Inbox AI (OpenAI)
        </Link>
      </nav>
    </aside>
  );
}
