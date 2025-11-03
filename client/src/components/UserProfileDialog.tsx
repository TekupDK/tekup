import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { User } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface UserProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProfileFormData {
  name: string;
}

export function UserProfileDialog({
  open,
  onOpenChange,
}: UserProfileDialogProps) {
  const { user, refresh } = useAuth();
  const t = useI18n();

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t.profile.saved);
      refresh();
      onOpenChange(false);
    },
    onError: error => {
      toast.error(t.profile.error + ": " + error.message);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const userInitial = useMemo(() => user?.name?.charAt(0) || "U", [user?.name]);

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open && user) {
      reset({
        name: user.name || "",
      });
    }
  }, [open, user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfileMutation.mutateAsync({ name: data.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.profile.title}</DialogTitle>
          <DialogDescription>{t.profile.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 py-4">
            {/* User Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <span className="text-primary font-semibold text-2xl">
                  {userInitial}
                </span>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.profile.name}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    {...register("name", {
                      required: true,
                      minLength: 1,
                      maxLength: 255,
                    })}
                    className="pl-9"
                    placeholder={t.profile.name}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.profile.email}</Label>
                <Input
                  id="email"
                  value={user?.email || t.profile.notSpecified}
                  disabled
                  className="bg-muted/50 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  E-mail kan ikke redigeres
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t.profile.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? t.profile.saving : t.profile.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
