import { useEffect } from "react";

const BASE_TITLE = "Coach Civique";

export default function useDocumentTitle(subtitle) {
  useEffect(() => {
    document.title = subtitle ? `${subtitle} — ${BASE_TITLE}` : `${BASE_TITLE} — Préparez l'examen civique 2026 gratuitement`;
    return () => {
      document.title = `${BASE_TITLE} — Préparez l'examen civique 2026 gratuitement`;
    };
  }, [subtitle]);
}
