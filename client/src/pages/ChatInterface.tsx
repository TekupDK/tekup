import { useAuth } from "@/_core/hooks/useAuth";
import ChatPanel from "@/components/ChatPanel";
import InboxPanel from "@/components/InboxPanel";
import { MobileUserMenuSheet } from "@/components/MobileUserMenuSheet";
import { SettingsDialog } from "@/components/SettingsDialog";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getLoginUrl } from "@/const";
import { Bot, LogOut, Menu, Settings, User } from "lucide-react";
import { memo, useCallback, useMemo, useState } from "react";

/**
 * Friday Chat Interface - Main Layout
 * Split-panel design inspired by Shortwave.ai:
 * - Desktop: Split view (60% chat, 40% inbox)
 * - Mobile: Single column with drawer navigation
 */
function ChatInterface() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeInboxTab, setActiveInboxTab] = useState<
    "email" | "invoices" | "calendar" | "leads" | "tasks"
  >("email");
  const [showMobileInbox, setShowMobileInbox] = useState(false);

  // Dialog and Sheet state management
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showMobileUserMenu, setShowMobileUserMenu] = useState(false);

  // Memoize user display data
  const userInitial = useMemo(() => user?.name?.charAt(0) || "U", [user?.name]);

  const handleTabChange = useCallback(
    (tab: "email" | "invoices" | "calendar" | "leads" | "tasks") => {
      setActiveInboxTab(tab);
    },
    []
  );

  const handleLogout = useCallback(() => {
    window.location.href = getLoginUrl();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-6 sm:p-8 space-y-6 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl font-bold">Friday</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Din intelligente AI assistent til TekupDK
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="w-full">
            <a href={getLoginUrl()}>Log ind for at fortsætte</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">Friday</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Din AI assistent
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="gap-1.5 hidden sm:flex">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Online
          </Badge>
        </div>

        {/* Desktop User Info */}
        <div className="hidden md:flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-lg px-2 py-1 -mx-2 -my-1">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border-2 border-transparent hover:border-primary/20 transition-colors">
                  <span className="text-primary font-semibold text-sm">
                    {userInitial}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowProfileDialog(true)}>
                <User className="w-4 h-4 mr-2" />
                Min profil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSettingsDialog(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Indstillinger
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log ud
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Inbox Toggle */}
        <Sheet open={showMobileInbox} onOpenChange={setShowMobileInbox}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <div className="h-full">
              <InboxPanel
                activeTab={activeInboxTab}
                onTabChange={handleTabChange}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile User Avatar - Clickable */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 p-0"
          onClick={() => setShowMobileUserMenu(true)}
        >
          <span className="text-primary font-semibold text-sm">
            {userInitial}
          </span>
        </Button>
      </header>

      {/* Dialogs and Sheets */}
      <UserProfileDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
      <SettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
      />
      <MobileUserMenuSheet
        open={showMobileUserMenu}
        onOpenChange={setShowMobileUserMenu}
        onProfileClick={() => setShowProfileDialog(true)}
        onSettingsClick={() => setShowSettingsDialog(true)}
      />

      {/* Main Content */}
      {/* Desktop: Split Panel */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Chat Panel (Left - 60%) */}
          <ResizablePanel defaultSize={60} minSize={40}>
            <ChatPanel />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Inbox Panel (Right - 40%) */}
          <ResizablePanel defaultSize={40} minSize={30}>
            <InboxPanel
              activeTab={activeInboxTab}
              onTabChange={handleTabChange}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile: Single Column */}
      <div className="flex md:hidden flex-1 overflow-hidden min-h-0">
        <ChatPanel />
      </div>
    </div>
  );
}

export default memo(ChatInterface);
