"use client";
import { PENALTIES, type Penalty } from "./solve";
const LABELS: Record<Penalty, string> = { none: "OK", "+2": "+2", DNF: "DNF" };
export function PenaltyControl({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: Penalty;
  disabled?: boolean;
  onChange: (penalty: Penalty) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {PENALTIES.map((penalty) => (
        <button
          key={penalty}
          type="button"
          aria-pressed={value === penalty}
          disabled={disabled}
          onClick={() => onChange(penalty)}
          className={`min-h-11 min-w-11 rounded-lg border px-3 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60 ${value === penalty ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground"}`}
        >
          {LABELS[penalty]}
        </button>
      ))}
    </div>
  );
}
