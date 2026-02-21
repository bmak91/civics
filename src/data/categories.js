export const PRINCIPES_ET_VALEURS = "Principes et valeurs de la République";
export const SYSTEME_INSTITUTIONNEL = "Système institutionnel et politique";
export const DROITS_ET_DEVOIRS = "Droits et devoirs";
export const HISTOIRE_ET_GEOGRAPHIE = "Histoire, géographie et culture";
export const VIVRE_EN_SOCIETE = "Vivre dans la société française";

export const CATEGORY_COLORS = {
  [PRINCIPES_ET_VALEURS]: "#6366f1",
  [DROITS_ET_DEVOIRS]: "#14b8a6",
  [SYSTEME_INSTITUTIONNEL]: "#3b82f6",
  [HISTOIRE_ET_GEOGRAPHIE]: "#f59e0b",
  [VIVRE_EN_SOCIETE]: "#ec4899",
};

export const CATEGORY_SLUGS = {
  [PRINCIPES_ET_VALEURS]: "principes",
  [DROITS_ET_DEVOIRS]: "droits",
  [SYSTEME_INSTITUTIONNEL]: "institutions",
  [HISTOIRE_ET_GEOGRAPHIE]: "histoire",
  [VIVRE_EN_SOCIETE]: "societe",
};

export const SLUG_TO_CATEGORY = Object.fromEntries(
  Object.entries(CATEGORY_SLUGS).map(([name, slug]) => [slug, name])
);
