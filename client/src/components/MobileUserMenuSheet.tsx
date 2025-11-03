import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getLoginUrl } from "@/const";
import { useI18n } from "@/lib/i18n";
import { LogOut, Settings, User } from "lucide-react";
import { useMemo } from "react";

interface MobileUserMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileClick: () => void;
  onSettingsClick: () => void;
}

export function MobileUserMenuSheet({
  open,
  onOpenChange,
  onProfileClick,
  onSettingsClick,
}: MobileUserMenuSheetProps) {
  const { user } = useAuth();
  const t = useI18n();

  const userInitial = useMemo(() => user?.name?.charAt(0) || "U", [user?.name]);

  const handleLogout = () => {
    window.location.href = getLoginUrl();
  };

  const handleProfileClick = () => {
    onProfileClick();
    onOpenChange(false);
  };

  const handleSettingsClick = () => {
    onSettingsClick();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>{t.menu.title}</SheetTitle>
          <SheetDescription>{t.menu.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* User Info Section */}
          <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <span className="text-primary font-semibold text-lg">
                {userInitial}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleProfileClick}
            >
              <User className="w-5 h-5" />
              <span>{t.menu.profile}</span>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3"
              onClick={handleSettingsClick}
            >
              <Settings className="w-5 h-5" />
              <span>{t.menu.settings}</span>
            </Button>
          </div>

          {/* Separator */}
          <div className="border-t pt-4 mt-4">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>{t.menu.logout}</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
