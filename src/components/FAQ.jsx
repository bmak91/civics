import { useState, useEffect } from "react";
import useDocumentTitle from "../utils/useDocumentTitle";

const faqs = [
  {
    q: "Qu'est-ce que l'examen civique ?",
    a: "L'examen civique est un QCM obligatoire pour obtenir une carte de séjour pluriannuelle, une carte de résident ou la naturalisation française. Il est passé sur support numérique (tablette ou ordinateur) dans un centre agréé par la Chambre de Commerce et d'Industrie de Paris (CCIP) ou France Éducation International (FEI).",
  },
  {
    q: "Quel est le format de l'examen ?",
    a: "L'épreuve dure 45 minutes maximum et comporte 40 questions à choix multiples : 28 questions de connaissances et 12 mises en situation. Chaque question propose 4 réponses possibles, dont une seule est correcte.",
  },
  {
    q: "Quel score faut-il obtenir pour réussir ?",
    a: "Il faut obtenir au moins 32 bonnes réponses sur 40, soit 80 % de réussite. L'attestation de réussite n'a pas de date d'expiration. En cas d'échec, l'examen peut être repassé sans limite.",
  },
  {
    q: "Quels sont les thèmes abordés ?",
    a: "L'examen couvre cinq thématiques : les principes et valeurs de la République, le système institutionnel et politique, les droits et devoirs, l'histoire, la géographie et la culture, et la vie dans la société française. Les questions de connaissances sont publiées sur le site du ministère de l'Intérieur.",
  },
  {
    q: "D'où viennent les questions de Coach Civique ?",
    a: "Les questions sont issues de la liste officielle des questions de connaissance publiée par le ministère de l'Intérieur sur le site formation-civique.interieur.gouv.fr. Les explications ont été ajoutées pour faciliter l'apprentissage.",
  },
  {
    q: "Comment utiliser Coach Civique ?",
    a: "Deux modes sont disponibles : le mode Révision permet de parcourir les questions par catégorie à votre rythme avec des explications détaillées. Le mode Examen blanc simule les conditions de l'épreuve avec 40 questions aléatoires et un score final.",
  },
  {
    q: "Mes progrès sont-ils sauvegardés ?",
    a: "Oui, vos statistiques et votre historique sont sauvegardés localement dans votre navigateur. Aucun compte n'est nécessaire. Vous pouvez aussi exporter et importer vos données depuis le menu des statistiques.",
  },
  {
    q: "Coach Civique est-il gratuit ?",
    a: "Oui, Coach Civique est entièrement gratuit.",
  },
];

const faqJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
});

export default function FAQ() {
  useDocumentTitle("Questions fréquentes");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = faqJsonLd;
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div className="faq">
      <h1 className="faq-title">Questions fréquentes</h1>
      <div className="faq-list">
        {faqs.map((item, i) => (
          <div key={i} className={`faq-item${open === i ? " open" : ""}`}>
            <button className="faq-question" onClick={() => setOpen(open === i ? null : i)}>
              <span>{item.q}</span>
              <span className="faq-chevron">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="faq-answer">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
