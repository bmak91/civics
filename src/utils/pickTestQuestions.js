const STORAGE_KEY = "civics-test-seen";
const TEST_SIZE = 40;
const PER_CATEGORY = 10;

/**
 * Pick questions for test mode, prioritizing least-seen questions
 * with balanced category representation.
 */
export default function pickTestQuestions(allQuestions) {
  // Load seen counts from localStorage
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    seen = {};
  }

  // Group questions by category
  const byCategory = {};
  for (const q of allQuestions) {
    const cat = q.category;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(q);
  }

  // For each category: sort by seen count, take top N least-seen
  const pool = [];
  for (const cat of Object.keys(byCategory)) {
    const questions = byCategory[cat];
    questions.sort((a, b) => (seen[a.id] || 0) - (seen[b.id] || 0));
    pool.push(...questions.slice(0, PER_CATEGORY));
  }

  // Shuffle the pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Pick final set
  const count = Math.min(TEST_SIZE, pool.length);
  const picked = pool.slice(0, count);

  // Update seen counts
  for (const q of picked) {
    seen[q.id] = (seen[q.id] || 0) + 1;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));

  return picked;
}
