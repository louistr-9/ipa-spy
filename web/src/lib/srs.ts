/**
 * Thuật toán Spaced Repetition (SRS) dựa trên SuperMemo-2 (SM-2)
 * Giúp tính toán thời điểm ôn tập tiếp theo tối ưu cho trí nhớ.
 */

export type ReviewQuality = 0 | 1 | 2; // 0: Again, 1: Hard, 2: Easy

export interface SRSStats {
  interval: number;
  ease_factor: number;
  next_review_date: string;
}

export function calculateSRS(quality: ReviewQuality, currentInterval: number, currentEase: number): SRSStats {
  let nextInterval = 0;
  let nextEase = currentEase;

  if (quality === 0) {
    // Quality: Again (Quên)
    nextInterval = 1; // Học lại vào ngày mai
    nextEase = Math.max(1.3, currentEase - 0.2);
  } else if (quality === 1) {
    // Quality: Hard (Gợi nhớ một chút)
    nextInterval = currentInterval === 0 ? 1 : Math.ceil(currentInterval * 1.2);
    nextEase = Math.max(1.3, currentEase - 0.15);
  } else {
    // Quality: Easy (Nhớ tốt)
    if (currentInterval === 0) {
      nextInterval = 1;
    } else if (currentInterval === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.ceil(currentInterval * currentEase);
    }
    nextEase = currentEase + 0.1;
  }

  // Tính toán ngày tiếp theo
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + nextInterval);

  return {
    interval: nextInterval,
    ease_factor: nextEase,
    next_review_date: nextDate.toISOString()
  };
}
