import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = [
  { url: "/", title: "Coach Civique — Préparez l'examen civique 2026 gratuitement" },
  { url: "/faq", title: "Questions fréquentes — Examen civique 2026 — Coach Civique" },
  { url: "/revision", title: "Révision QCM civique 2026 par catégorie — Coach Civique" },
  { url: "/examen/nouveau", title: "Examen blanc — QCM civique 2026 — Coach Civique" },
];

async function prerender() {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  try {
    const template = fs.readFileSync(path.resolve(__dirname, "dist/index.html"), "utf-8");
    const { render } = await vite.ssrLoadModule("/src/entry-server.jsx");

    for (const { url, title } of routes) {
      const appHtml = render(url);

      let html = template
        .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
        .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);

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
