"use client";
// OtpInput — accessible 6-digit code entry. Supports per-box typing, pasting the full code into
// any box, Backspace/Arrow keyboard navigation, numeric input mode, and a labelled group. Calls
// onChange with the concatenated value and onComplete when all six digits are present.
import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export function OtpInput({ value, onChange, onComplete, disabled }: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  const set = (i: number, d: string) => {
    const next = digits.map((c, j) => (j === i ? d : c)).join("").replace(/ /g, "");
    onChange(next);
    if (next.length === 6 && onComplete) onComplete(next);
  };

  const handleChange = (i: number, raw: string) => {
    const d = raw.replace(/\D/g, "").slice(-1);
    if (!d) return;
    set(i, d);
    if (i < 5) refs.current[i + 1]?.focus();
  };
  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i].trim() === "" && i > 0) { refs.current[i - 1]?.focus(); set(i - 1, ""); }
      else set(i, "");
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    if (pasted.length === 6 && onComplete) onComplete(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div role="group" aria-label="6-digit verification code" className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          maxLength={1}
          disabled={disabled}
          value={d.trim()}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          className="h-14 w-12 rounded-lg border border-outline/40 bg-surface text-center font-display-md text-headline-md text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
        />
      ))}
    </div>
  );
}

// Resend countdown hook helper — returns seconds remaining until `until`.
export function secondsUntil(until?: string): number {
  if (!until) return 0;
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 1000));
}
