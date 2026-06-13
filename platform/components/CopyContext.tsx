"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Copies an AI-ready text blob (markdown digest) to the clipboard.
 * navigator.clipboard first; hidden-textarea execCommand as the fallback for
 * non-secure contexts / older browsers.
 */
export default function CopyContext({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch {
        // fall through to the textarea fallback
      }
    }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      ta.remove();
    }
    if (ok) {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button type="button" className="btn btn-secondary btn-copy" onClick={copy}>
      {copied ? "Copied to clipboard ✓" : label}
    </button>
  );
}
