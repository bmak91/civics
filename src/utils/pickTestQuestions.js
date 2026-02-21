const STORAGE_KEY = "civics-test-seen";
const TEST_SIZE = 40;
const POOL_SIZE = 55;

/**
 * Pick questions for test mode, prioritizing least-seen questions
 * so that over multiple sessions the user covers everything.
 */
export default function pickTestQuestions(allQuestions) {
  const count = Math.min(TEST_SIZE, allQuestions.length);
  const poolSize = Math.min(POOL_SIZE, allQuestions.length);

  // Load seen counts from localStorage
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    seen = {};
  }

  // Sort by times seen (ascending) to get least-seen pool
  const sorted = [...allQuestions].sort((a, b) => {
    return (seen[a.id] || 0) - (seen[b.id] || 0);
  });

  // Take a larger pool of least-seen, shuffle it, then pick final set
  const pool = sorted.slice(0, poolSize);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked = pool.slice(0, count);

  // Update seen counts
  for (const q of picked) {
    seen[q.id] = (seen[q.id] || 0) + 1;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));

  return picked;
}
