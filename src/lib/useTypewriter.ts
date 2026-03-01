import { useEffect, useState } from "react";

export function useTypewriter(text: string, speedMs = 28, startDelayMs = 150) {
  const [out, setOut] = useState("");

  useEffect(() => {
    let i = 0;
    let t1: number | undefined;
    let t2: number | undefined;

    t1 = window.setTimeout(() => {
      t2 = window.setInterval(() => {
        i += 1;
        setOut(text.slice(0, i));
        if (i >= text.length && t2) window.clearInterval(t2);
      }, speedMs);
    }, startDelayMs);

    return () => {
      if (t1) window.clearTimeout(t1);
      if (t2) window.clearInterval(t2);
    };
  }, [text, speedMs, startDelayMs]);

  return out;
}
