interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
  className?: string;
}

/**
 * Animated progress bar.
 * value: 0–100 percentage.
 */
export function ProgressBar({ value, label, className = "" }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const barColor =
    clamped === 100
      ? "bg-emerald-500"
      : clamped >= 50
      ? "bg-primary"
      : "bg-amber-500";

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}
