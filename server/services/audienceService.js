export function audienceSeries(initialPlatforms = [], snapshots = [], startDate, endDate, bucketCount = 4) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  const duration = endMs - startMs;
  const bucketSize = duration / bucketCount;

  const latest = new Map();
  for (const init of initialPlatforms) {
    if (init.platform) {
      latest.set(init.platform, { platform: init.platform, followers: init.followers || 0 });
    }
  }

  const buckets = Array.from({ length: bucketCount }, () => ({
    followers: 0,
    views: 0,
    interactions: 0,
    snapshots: [],
  }));

  const sortedSnapshots = snapshots
    .map((s) => ({ ...s, time: new Date(s.date).getTime() }))
    .sort((a, b) => a.time - b.time);

  for (const snap of sortedSnapshots) {
    if (snap.time < startMs || snap.time > endMs) continue;
    let bIdx = Math.floor((snap.time - startMs) / bucketSize);
    if (bIdx >= bucketCount) bIdx = bucketCount - 1;
    buckets[bIdx].snapshots.push(snap);
  }

  const series = [];

  for (let i = 0; i < bucketCount; i++) {
    const bucket = buckets[i];

    for (const snap of bucket.snapshots) {
      if (snap.platform && snap.followers !== undefined) {
        latest.set(snap.platform, { platform: snap.platform, followers: snap.followers });
      }
      if (snap.views) {
        bucket.views += snap.views;
        bucket.interactions += (snap.likes || 0) + (snap.comments || 0) + (snap.shares || 0);
      }
    }

    const currentTotalFollowers = Array.from(latest.values()).reduce((sum, f) => sum + (f.followers || 0), 0);
    const engagement = bucket.views > 0 ? (bucket.interactions / bucket.views) * 100 : 0;

    series.push({
      followers: currentTotalFollowers,
      views: bucket.views,
      engagement: Number(engagement.toFixed(2)),
    });
  }

  return { series, latest };
}
