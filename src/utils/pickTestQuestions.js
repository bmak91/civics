const STORAGE_KEY = "civics-test-seen";
const TEST_SIZE = 40;

/**
 * Pick questions for test mode, prioritizing least-seen questions
 * so that over multiple sessions the user covers everything.
 */
export default function pickTestQuestions(allQuestions) {
  const count = Math.min(TEST_SIZE, allQuestions.length);

  // Load seen counts from localStorage
  let seen = {};
  try {
    seen = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    seen = {};
  }

  // Sort by times seen (ascending), then shuffle within same count
  const sorted = [...allQuestions].sort((a, b) => {
    const diff = (seen[a.id] || 0) - (seen[b.id] || 0);
    if (diff !== 0) return diff;
    return Math.random() - 0.5;
  });

  const picked = sorted.slice(0, count);

  // Shuffle the picked questions
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }

  // Update seen counts
  for (const q of picked) {
    seen[q.id] = (seen[q.id] || 0) + 1;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));

  return picked;
}
