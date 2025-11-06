import { AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface RateLimitBannerProps {
  retryAfter: Date | null;
  onClear?: () => void;
}

export default function RateLimitBanner({
  retryAfter,
  onClear,
}: RateLimitBannerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!retryAfter) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = retryAfter.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("Nu!");
        onClear?.();
        return;
      }

      const totalSeconds = Math.ceil(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      if (minutes > 0) {
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [retryAfter, onClear]);

  if (!retryAfter) return null;

  return (
    <div className="mx-4 mb-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
            Gmail API Rate Limit Nået
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Gmail API'et har nået sin rate limit. Emails opdateres automatisk
            når begrænsningen er løftet.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <div className="text-right">
            <div className="text-xs text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
              Prøv igen om
            </div>
            <div className="text-2xl font-mono font-bold text-yellow-900 dark:text-yellow-100 tabular-nums">
              {timeRemaining}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
