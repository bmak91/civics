import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = [
  {
    url: "/",
    title: "Coach Civique — Préparez l'examen civique 2026 gratuitement",
    description: "QCM examen civique 2026 gratuit : révisez les 200+ questions officielles, entraînez-vous par catégorie et passez des examens blancs de 40 questions.",
  },
  {
    url: "/faq",
    title: "Questions fréquentes — Examen civique 2026 — Coach Civique",
    description: "Tout savoir sur l'examen civique 2026 : format, score requis, thèmes abordés, sources des questions et fonctionnement de Coach Civique.",
  },
  {
    url: "/revision",
    title: "Révision QCM civique 2026 par catégorie — Coach Civique",
    description: "Révisez les questions de l'examen civique 2026 par catégorie : principes de la République, institutions, droits et devoirs, histoire et vie en société.",
  },
  {
    url: "/examen/nouveau",
    title: "Examen blanc — QCM civique 2026 — Coach Civique",
    description: "Passez un examen blanc de 40 questions en conditions réelles. Score minimum pour réussir : 32/40. Questions aléatoires tirées de toutes les catégories.",
  },
];

async function prerender() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const template = fs.readFileSync(path.resolve(__dirname, "dist/index.html"), "utf-8");
    const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");

    for (const { url, title, description } of routes) {
      const appHtml = render(url);

      let html = template
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${description}"`)
        .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
        .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${description}"`)
        .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
        .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${description}"`);

      const outDir = url === "/" ? "dist" : `dist${url}`;
      const outPath = path.resolve(__dirname, outDir, "index.html");

      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      console.log(`  Prerendered: ${url} → ${path.relative(__dirname, outPath)}`);
    }

    console.log(`\n  ${routes.length} routes prerendered.`);
  } finally {
    await vite.close();
  }
}

prerender();
