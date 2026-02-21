import { nanoid } from "nanoid";
import fs from "fs";

// Read existing questions (extract question texts and categories)
const existingFile = fs.readFileSync(
  new URL("../src/data/questions.js", import.meta.url),
  "utf-8"
);

// Parse out existing questions using regex
const questionRegex =
  /question:\s*"((?:[^"\\]|\\.)*)"|question:\s*'((?:[^'\\]|\\.)*)'/g;
const categoryRegex = /category:\s*"([^"]*)"/g;

const existingQuestions = [];
const categories = [];

let m;
while ((m = questionRegex.exec(existingFile)) !== null) {
  existingQuestions.push(m[1] || m[2]);
}
while ((m = categoryRegex.exec(existingFile)) !== null) {
  categories.push(m[1]);
}

// Build a set of existing question texts for dedup
const existingSet = new Set(existingQuestions.map((q) => q.trim()));

// Missing questions to insert, with their category and position hint (after which question text)
const missing = [
  // Page 1 - Principes et valeurs
  {
    category: "Principes et valeurs de la République",
    question:
      'Que signifie le mot "fraternité" dans la devise française ?',
    after: "Que porte Marianne sur la tête ?",
  },
  {
    category: "Principes et valeurs de la République",
    question: "Selon la Constitution, la France est une République...",
    after: "Qu'est-ce qu'une liberté ?",
  },
  {
    category: "Principes et valeurs de la République",
    question:
      "Selon le principe de laïcité, que signifie la neutralité de l'État ?",
    after:
      "Une personne peut-elle changer librement de religion en France ?",
  },
  // Page 4 - Système institutionnel
  {
    category: "Système institutionnel et politique",
    question:
      "Quel est le dernier État à avoir intégré l'Union Européenne en 2013 ?",
    after:
      "En quelle année la citoyenneté européenne a-t-elle été créée ?",
  },
  {
    category: "Système institutionnel et politique",
    question:
      "Les citoyens de l'Union européenne peuvent-ils voter aux élections locales dans un autre État de l'Union ?",
    after: "Qui siège au Parlement européen ?",
  },
  {
    category: "Système institutionnel et politique",
    question: "Quelle est la devise de l'Union européenne ?",
    after: "Quel État a quitté l'Union Européenne en 2020 ?",
  },
  // Page 6 - Droits et devoirs
  {
    category: "Droits et devoirs",
    question:
      "Qui peut être appelé à faire partie d'un jury d'assises en France ?",
    after: "Qu'est-ce que le devoir de mémoire ?",
  },
  // Page 7 - Histoire
  {
    category: "Histoire, géographie et culture",
    question:
      "Quel est l'objectif des lois scolaires de la IIIe République ?",
    after: "Qui a été président de la Ve République ?",
  },
  {
    category: "Histoire, géographie et culture",
    question: "Pourquoi l'année 1958 est importante pour la France ?",
    after:
      "Quel est l'objectif des lois scolaires de la IIIe République ?",
  },
  {
    category: "Histoire, géographie et culture",
    question:
      "Simone Veil est une figure importante de l'histoire française. Elle a notamment :",
    after:
      "Lequel de ces pays est un pays fondateur de l'Union Européenne ?",
  },
  {
    category: "Histoire, géographie et culture",
    question:
      "Qui a rendu l'école gratuite, laïque et obligatoire ?",
    after: "Quel pays a été une colonie française ?",
  },
  // Page 8 - Histoire
  {
    category: "Histoire, géographie et culture",
    question: "Quelle œuvre a été écrite par Victor Hugo ?",
    after:
      "Quel célèbre philosophe des Lumières a dénoncé l'esclavage ?",
  },
  // Page 9 - Histoire/geo
  {
    category: "Histoire, géographie et culture",
    question:
      "Quelle mer se situe entre la France et l'Angleterre ?",
    after:
      "Quelle mer ou océan borde la France métropolitaine ?",
  },
  {
    category: "Histoire, géographie et culture",
    question:
      "Quelle chaîne de montagnes est située entre la France et l'Espagne ?",
    after: "Combien y a-t-il de régions en France métropolitaine ?",
  },
  // Page 10 - Vivre dans la société
  {
    category: "Vivre dans la société française",
    question:
      "Qu'est-ce que le principe de confidentialité dans le domaine de la santé ?",
    after: "La contraception :",
  },
];

// Build full question list as objects
let allQuestions = existingQuestions.map((q, i) => ({
  category: categories[i],
  question: q,
}));

// Insert missing questions after their "after" targets
const existingTexts = new Set(allQuestions.map((q) => q.question));
for (const mq of missing) {
  // Skip if already present (idempotent)
  const mqEscaped = mq.question.replace(/"/g, '\\"');
  if (existingTexts.has(mq.question) || existingTexts.has(mqEscaped)) {
    continue;
  }
  existingTexts.add(mq.question);
  const afterIdx = allQuestions.findIndex(
    (q) => q.question === mq.after
  );
  if (afterIdx === -1) {
    console.error(`Could not find "after" question: ${mq.after}`);
    // Append at end of category
    const lastIdx = allQuestions.findLastIndex(
      (q) => q.category === mq.category
    );
    allQuestions.splice(lastIdx + 1, 0, {
      category: mq.category,
      question: mq.question,
      isNew: true,
    });
  } else {
    allQuestions.splice(afterIdx + 1, 0, {
      category: mq.category,
      question: mq.question,
      isNew: true,
    });
  }
}

// Generate output
const escapeStr = (s) =>
  s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

let currentCategory = "";
let output = "const questions = [\n";

for (const q of allQuestions) {
  if (q.category !== currentCategory) {
    currentCategory = q.category;
    output += `\n  // ===== ${currentCategory} =====\n`;
  }
  const id = nanoid(10);
  // Existing questions already have escapes from regex; new ones are marked
  const qText = q.isNew ? escapeStr(q.question) : q.question;
  output += `  {\n`;
  output += `    id: "${id}",\n`;
  output += `    category: "${currentCategory}",\n`;
  output += `    question: "${qText}",\n`;
  output += `    choices: [],\n`;
  output += `    correctIndex: 0,\n`;
  output += `    explanation: "",\n`;
  output += `  },\n`;
}

output += "];\n\nexport default questions;\n";

fs.writeFileSync(
  new URL("../src/data/questions.js", import.meta.url),
  output
);

console.log(`Total questions: ${allQuestions.length}`);

// Show categories breakdown
const catCounts = {};
for (const q of allQuestions) {
  catCounts[q.category] = (catCounts[q.category] || 0) + 1;
}
for (const [cat, count] of Object.entries(catCounts)) {
  console.log(`  ${cat}: ${count}`);
}
