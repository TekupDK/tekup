import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getAllKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  open,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const shortcuts = getAllKeyboardShortcuts();

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  const categoryLabels: Record<string, string> = {
    navigation: "Navigation",
    action: "Handlinger",
    search: "Søgning",
    modal: "Vindue",
    help: "Hjælp",
  };

  const categoryOrder = ["navigation", "action", "search", "modal", "help"];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Keyboard className="w-5 h-5" />
            Keyboard Genveje
          </DialogTitle>
          <DialogDescription>
            Brug disse tastatur genveje til at navigere hurtigere i din inbox
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categoryOrder.map(category => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts || categoryShortcuts.length === 0) {
              return null;
            }

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div
                      key={shortcut.key}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm min-w-10 text-center">
                        {shortcut.key === "Escape"
                          ? "Esc"
                          : shortcut.key === "/"
                            ? "/"
                            : shortcut.key.toUpperCase()}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Keyboard className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>Tip:</strong> Keyboard genveje virker når du ikke skriver
              i et indtastningsfelt. Tryk{" "}
              <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted border border-border rounded">
                ?
              </kbd>{" "}
              for at åbne denne hjælp til enhver tid.
            </p>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={onClose} variant="outline">
            Luk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
