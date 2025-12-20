import type { LevelId } from "./opic";

export const ANALYSIS_DURATION_MS = 5000;

export const DEFAULT_TRANSCRIPT =
  "Oh, I really enjoy traveling. Recently, I went to Busan with my family and we had a great time by the beach.";

export const FEEDBACK_TIPS = [
  'Emphasize the correct stress in "famous" (FAY-mus).',
  'Use the past tense "ate" instead of "eat."',
  'Stretch the long "ee" in "beach" and shorten the "i" in "trip."',
];

export const SAMPLE_ANSWER =
  "That's a great question. I recently took a wonderful trip to Busan with my family. We stayed near the beach, enjoyed fresh seafood, and even rode a cable car for an amazing view. It was relaxing, beautiful, and a perfect short getaway.";

export type Question = {
  category: string;
  prompt: string;
  suggestedLevel?: LevelId;
};

export const QUESTION: Question = {
  category: "Random",
  prompt: "Tell me a little bit about yourself.",
  suggestedLevel: "IM2",
};
