import { useEffect } from "react";

const BASE_TITLE = "Coach Civique";

export default function useDocumentTitle(subtitle) {
  useEffect(() => {
    document.title = subtitle ? `${subtitle} — ${BASE_TITLE}` : `${BASE_TITLE} — Préparation à l'examen de naturalisation française`;
    return () => {
      document.title = `${BASE_TITLE} — Préparation à l'examen de naturalisation française`;
    };
  }, [subtitle]);
}
