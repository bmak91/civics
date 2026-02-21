import { readFileSync, writeFileSync } from "fs";
import { nanoid } from "nanoid";

const filePath = new URL("../src/data/questions.js", import.meta.url).pathname;
let content = readFileSync(filePath, "utf-8");

// Transform populated choices arrays: ["text1", "text2", ...] → [{ id: "xxx", text: "text1" }, ...]
// Also convert correctIndex to correctId

// Match each question block
const questionRegex = /\{[^{}]*?id:\s*"([^"]+)"[^{}]*?choices:\s*\[([\s\S]*?)\][^{}]*?correctIndex:\s*(\d+)[^{}]*?explanation:\s*"((?:[^"\\]|\\.)*)"/g;

let result = content;

for (const match of content.matchAll(questionRegex)) {
  const [fullMatch, qId, choicesContent, correctIndexStr, explanation] = match;
  const correctIndex = parseInt(correctIndexStr);

  // Check if choices are empty
  const trimmed = choicesContent.trim();
  if (!trimmed) {
    // Empty choices - just convert correctIndex to correctId with empty string
    const updated = fullMatch.replace(
      `correctIndex: ${correctIndexStr}`,
      `correctId: ""`
    );
    result = result.replace(fullMatch, updated);
    continue;
  }

  // Parse the choice strings
  const choiceStrings = [];
  const choiceRegex = /"((?:[^"\\]|\\.)*)"/g;
  for (const cm of trimmed.matchAll(choiceRegex)) {
    choiceStrings.push(cm[1]);
  }

  if (choiceStrings.length === 0) continue;

  // Generate IDs and build new choices array
  const choicesWithIds = choiceStrings.map((text) => ({
    id: nanoid(6),
    text,
  }));

  const correctId = choicesWithIds[correctIndex].id;

  // Build new choices string
  const newChoices = choicesWithIds
    .map((c) => `{ id: "${c.id}", text: "${c.text}" }`)
    .join(", ");

  // Replace in the match
  let updated = fullMatch;
  updated = updated.replace(
    `choices: [${choicesContent}]`,
    `choices: [${newChoices}]`
  );
  updated = updated.replace(
    `correctIndex: ${correctIndexStr}`,
    `correctId: "${correctId}"`
  );

  result = result.replace(fullMatch, updated);
}

writeFileSync(filePath, result, "utf-8");
console.log("Done! Added choice IDs and converted correctIndex to correctId.");
