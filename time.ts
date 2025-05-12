// Find busiest periods
const findBusiestPeriod = (distribution: { [key: number]: number }) => {
  let maxCount = 0;
  let busiestPeriod = 0;

  Object.entries(distribution).forEach(([period, count]) => {
    if (count > maxCount) {
      maxCount = count;
      busiestPeriod = Number(period);
    }
  });

  return { period: busiestPeriod, count: maxCount };
};

// Find busiest and least busy 6-hour timeframes
const find6HourTimeframes = (hourlyDist: { [hour: number]: number }) => {
  let maxCount = 0;
  let maxStartHour = 0;
  let minCount = Infinity;
  let minStartHour = 0;

  // Check all possible 6-hour windows
  for (let startHour = 0; startHour < 24; startHour++) {
    let windowCount = 0;
    for (let i = 0; i < 6; i++) {
      const hour = (startHour + i) % 24;
      windowCount += hourlyDist[hour] || 0;
    }

    if (windowCount > maxCount) {
      maxCount = windowCount;
      maxStartHour = startHour;
    }
    if (windowCount < minCount) {
      minCount = windowCount;
      minStartHour = startHour;
    }
  }

  return {
    busiest: { startHour: maxStartHour, count: maxCount },
    leastBusy: { startHour: minStartHour, count: minCount },
  };
};

type Region = "Americas" | "Europe" | "Asia";

const TIMEZONE_OFFSETS: Record<Region, number[]> = {
  Americas: [-8, -7, -6, -5, -4, -3],
  Europe: [0, 1, 2, 3],
  Asia: [5, 6, 7, 8, 9],
};

const IDEAL_SLEEP_START = 1; // Midnight local time
const IDEAL_SLEEP_END = 7;

// Shift with 0–23 wrapping
function shiftHour(hour: number, offset: number): number {
  return (hour + offset + 24) % 24;
}

function getHourlyHistogram(timestampsUTC: Date[]): number[] {
  const histogram = new Array(24).fill(0);
  for (const date of timestampsUTC) {
    const hourUTC = date.getUTCHours();
    histogram[hourUTC]++;
  }
  return histogram;
}

function findLeastActiveWindow(histogram: number[], windowSize = 6): number {
  let minSum = Infinity;
  let startHour = 0;

  for (let i = 0; i < 24; i++) {
    let sum = 0;
    for (let j = 0; j < windowSize; j++) {
      sum += histogram[(i + j) % 24];
    }
    if (sum < minSum) {
      minSum = sum;
      startHour = i;
    }
  }

  return startHour; // UTC hour where sleep likely begins
}

function scoreSleepAlignment(sleepStartUTC: number, offset: number): number {
  const localSleepStart = shiftHour(sleepStartUTC, offset);
  const diff = Math.min(
    Math.abs(localSleepStart - IDEAL_SLEEP_START),
    24 - Math.abs(localSleepStart - IDEAL_SLEEP_START)
  );
  return 1 - diff / 12; // Score from 0 to 1 (closer = better)
}

function inferTimezoneRegion(timestampsUTC: Date[]): {
  region: Region;
  confidence: number;
} {
  const histogram = getHourlyHistogram(timestampsUTC);
  const sleepStartUTC = findLeastActiveWindow(histogram);

  let bestRegion: Region = "Europe";
  let bestScore = -1;

  for (const region of Object.keys(TIMEZONE_OFFSETS) as Region[]) {
    const offsets = TIMEZONE_OFFSETS[region];
    const regionScores = offsets.map((offset) =>
      scoreSleepAlignment(sleepStartUTC, offset)
    );
    const avgScore =
      regionScores.reduce((a, b) => a + b, 0) / regionScores.length;

    if (avgScore > bestScore) {
      bestScore = avgScore;
      bestRegion = region;
    }
  }

  return {
    region: bestRegion,
    confidence: bestScore,
  };
}

export { findBusiestPeriod, find6HourTimeframes, inferTimezoneRegion };
