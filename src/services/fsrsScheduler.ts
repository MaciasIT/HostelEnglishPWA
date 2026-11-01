export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewItem {
  id: string;
  dueDate: Date;
  difficulty: number; // 1..10
  stability: number;  // days
  retrievability: number; // 0..1
  lapses: number;
  reps: number;
  state: 'new' | 'learning' | 'review' | 'relearning';
}

export interface ReviewResult {
  item: ReviewItem;
  nextDueDate: Date;
  nextDifficulty: number;
  nextStability: number;
  nextRetrievability: number;
}

const DEFAULT_W = [
  0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
  1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
  0.0, 0.0, 0.0, 0.0,
];

const DEFAULT_REQUEST_RETENTION = 0.9;
const DEFAULT_MAXIMUM_INTERVAL = 36500;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

function meanRevert(init: number, current: number): number {
  return 0.01 * init + 0.99 * current;
}

function nextInterval(stability: number, requestRetention: number, maximumInterval: number): number {
  const interval = stability * 9 * (1 / requestRetention - 1);
  return clamp(Math.round(interval), 1, maximumInterval);
}

function computeNextDifficulty(
  difficulty: number,
  rating: Rating,
  w4: number,
  _w5: number,
  w6: number
): number {
  const delta = rating === 'again' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4;
  const nextD = difficulty - w6 * (delta - 3);
  return clamp(meanRevert(w4, nextD), 1, 10);
}

function hardPenalty(rating: Rating, w15: number): number {
  return rating === 'hard' ? w15 : 1;
}

function easyBonus(rating: Rating, w16: number): number {
  return rating === 'easy' ? w16 : 1;
}

function nextRecallStability(
  difficulty: number,
  stability: number,
  retrievability: number,
  rating: Rating,
  w: number[]
): number {
  const w8 = w[8];
  const w9 = w[9];
  const w10 = w[10];
  const w15 = w[15];
  const w16 = w[16];

  const hp = hardPenalty(rating, w15);
  const eb = easyBonus(rating, w16);

  return (
    stability *
    (1 +
      Math.exp(w8) *
        (11 - difficulty) *
        Math.pow(stability, -w9) *
        (Math.exp((1 - retrievability) * w10) - 1) *
        hp *
        eb)
  );
}

function nextForgetStability(
  difficulty: number,
  stability: number,
  retrievability: number,
  w: number[]
): number {
  const w11 = w[11];
  const w12 = w[12];
  const w13 = w[13];
  const w14 = w[14];

  return (
    w11 *
    Math.pow(difficulty, -w12) *
    (Math.pow(stability + 1, w13) - 1) *
    Math.exp((1 - retrievability) * w14)
  );
}

function initStability(rating: Rating, w: number[]): number {
  const idx = rating === 'again' ? 0 : rating === 'hard' ? 1 : rating === 'good' ? 2 : 3;
  return Math.max(w[idx], 0.1);
}

function initDifficulty(rating: Rating, w: number[]): number {
  const w4 = w[4];
  const w5 = w[5];
  const delta = rating === 'again' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4;
  const nextD = w4 - w5 * (delta - 3);
  return clamp(meanRevert(w4, nextD), 1, 10);
}

export function computeRetrievability(stability: number, elapsedDays: number): number {
  return Math.pow(1 + elapsedDays / (9 * stability), -1);
}

export function scheduleNextReview(
  item: ReviewItem,
  rating: Rating,
  now: Date = new Date(),
  w: number[] = DEFAULT_W,
  requestRetention = DEFAULT_REQUEST_RETENTION,
  maximumInterval = DEFAULT_MAXIMUM_INTERVAL
): ReviewResult {
  const elapsedDays =
    item.state === 'new'
      ? 0
      : (now.getTime() - item.dueDate.getTime()) / 86400000;

  const retrievability = computeRetrievability(item.stability, elapsedDays);
  let nextDifficulty: number;
  let nextStability: number;

  if (item.reps === 0) {
    nextDifficulty = initDifficulty(rating, w);
    nextStability = initStability(rating, w);
  } else if (rating === 'again') {
    nextDifficulty = computeNextDifficulty(item.difficulty, rating, w[4], w[5], w[6]);
    nextStability = nextForgetStability(item.difficulty, item.stability, retrievability, w);
  } else {
    nextDifficulty = computeNextDifficulty(item.difficulty, rating, w[4], w[5], w[6]);
    nextStability = nextRecallStability(
      item.difficulty,
      item.stability,
      retrievability,
      rating,
      w
    );
  }

  const nextIntervalDays = nextInterval(nextStability, requestRetention, maximumInterval);
  const nextDueDate = new Date(now.getTime() + nextIntervalDays * 86400000);

  const newState =
    rating === 'again' ? 'relearning' : 'review';

  return {
    item: {
      ...item,
      reps: item.reps + 1,
      lapses: rating === 'again' ? item.lapses + 1 : item.lapses,
      dueDate: nextDueDate,
      difficulty: nextDifficulty,
      stability: nextStability,
      retrievability,
      state: newState,
    },
    nextDueDate,
    nextDifficulty,
    nextStability,
    nextRetrievability: retrievability,
  };
}

export function migrateFromProgress(
  phraseId: string,
  oldLevel: number
): ReviewItem {
  const now = new Date();
  const state: ReviewItem['state'] =
    oldLevel >= 3 ? 'review' : oldLevel === 1 ? 'learning' : 'new';

  if (oldLevel >= 3) {
    return {
      id: phraseId,
      dueDate: now,
      difficulty: 5,
      stability: 21,
      retrievability: 0.9,
      lapses: 0,
      reps: 3,
      state,
    };
  }

  if (oldLevel === 1) {
    return {
      id: phraseId,
      dueDate: now,
      difficulty: 5,
      stability: 0.1,
      retrievability: 0,
      lapses: 0,
      reps: 1,
      state,
    };
  }

  return {
    id: phraseId,
    dueDate: now,
    difficulty: 5,
    stability: 0.1,
    retrievability: 0,
    lapses: 0,
    reps: 0,
    state,
  };
}
