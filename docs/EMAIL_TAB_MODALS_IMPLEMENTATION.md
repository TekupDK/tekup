# Email Tab - Modals Implementation Guide

**Dato:** 2. november 2025
**Status:** ✅ Priority 1 Modals Implementeret

---

## 📋 Oversigt

### ✅ Implementeret:

1. **EmailConfirmationDialog** - Generisk confirmation dialog
2. **EmailPreviewModal** - Quick preview af emails
3. **Integration** - Begge modals integreret i EmailTab og EmailActions

---

## 🎨 EmailConfirmationDialog

### Features:

- Generisk confirmation dialog
- Destructive variant for delete actions
- Loading states med spinner
- Customizable title, description, og button labels

### Props:

```typescript
interface EmailConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string; // Default: "Bekræft"
  cancelLabel?: string; // Default: "Annuller"
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "default" | "destructive";
}
```

### Eksempel Brug:

```typescript
<EmailConfirmationDialog
  open={showDeleteConfirm}
  onOpenChange={setShowDeleteConfirm}
  title="Slet email?"
  description="Er du sikker på, at du vil slette denne email? Denne handling kan ikke fortrydes."
  confirmLabel="Slet"
  cancelLabel="Annuller"
  onConfirm={() => deleteMutation.mutate({ threadId })}
  isLoading={deleteMutation.isPending}
  variant="destructive"
/>
```

---

## 🎨 EmailPreviewModal

### Features:

- Quick preview af email content
- Viser latest message i thread
- Quick actions: Reply, Forward, Archive, Delete
- "Åbn fuld view" knap til thread view
- Viser antal beskeder hvis multiple messages
- Loading state mens email loader

### Props:

```typescript
interface EmailPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  onReply?: (replyTo: any) => void;
  onForward?: (forwardFrom: any) => void;
  onOpenFull?: () => void;
}
```

### Eksempel Brug:

```typescript
<EmailPreviewModal
  open={previewModalOpen}
  onOpenChange={setPreviewModalOpen}
  threadId={previewThreadId}
  onReply={(replyToData) => {
    setComposerMode("reply");
    setComposerReplyTo(replyToData);
    setComposerOpen(true);
  }}
  onForward={(forwardFromData) => {
    setComposerMode("forward");
    setComposerForwardFrom(forwardFromData);
    setComposerOpen(true);
  }}
  onOpenFull={() => {
    setSelectedThreadId(previewThreadId);
  }}
/>
```

### Trigger:

- **Double-click** på email card i EmailTab liste
- Åbner preview modal med email content

---

## 🔌 Integration

### EmailTab Integration:

- ✅ State for preview modal (`previewModalOpen`, `previewThreadId`)
- ✅ Double-click handler på email cards
- ✅ Preview modal component

### EmailActions Integration:

- ✅ State for confirmation dialogs (`showDeleteConfirm`, `showArchiveConfirm`)
- ✅ Delete og Archive buttons trigger confirmation dialogs
- ✅ Confirmation dialogs integreret

---

## 🎯 Næste Modals at Implementere

### Priority 2 (Foreslået):

1. **Snooze Email Modal**
   - Date/time picker
   - Preset durations (1 time, 3 timer, i morgen, næste uge)
   - Custom date/time

2. **Bulk Actions Modal**
   - Checkbox selection
   - Bulk operations (Archive, Delete, Label, Mark as Read/Unread)
   - Progress indicator

3. **Label Management Modal**
   - Liste af alle labels
   - Apply/Remove labels
   - Opret nyt label

---

## 📝 Notes

- Alle modals bruger Radix UI (Dialog/AlertDialog)
- Consistent styling med eksisterende EmailComposer
- Accessibility: Keyboard navigation, focus trap, ARIA labels
- Loading states for async operations
- Error handling via toast notifications

---

**Status:** ✅ Priority 1 Modals Implementeret og Integreret
**Next:** Priority 2 Modals (Snooze, Bulk Actions, Label Management)
