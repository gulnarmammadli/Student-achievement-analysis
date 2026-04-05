// Small collection of helpers used for the statistical tests
function contingencyTable(catA, catB) {
  const aVals = Array.from(new Set(catA));
  const bVals = Array.from(new Set(catB));
  const table = Array(aVals.length)
    .fill(0)
    .map(() => Array(bVals.length).fill(0));
  for (let i = 0; i < catA.length; i++) {
    const a = catA[i],
      b = catB[i];
    const ai = aVals.indexOf(a),
      bi = bVals.indexOf(b);
    table[ai][bi] += 1;
  }
  return { table, aVals, bVals };
}

function chiSquareTest(table) {
  const r = table.length,
    c = table[0].length;
  const rowSums = table.map((row) => row.reduce((s, x) => s + x, 0));
  const colSums = Array(c)
    .fill(0)
    .map((_, j) => table.reduce((s, row) => s + row[j], 0));
  const total = rowSums.reduce((a, b) => a + b, 0);
  let chi2 = 0;
  for (let i = 0; i < r; i++) {
    for (let j = 0; j < c; j++) {
      const expected = (rowSums[i] * colSums[j]) / total;
      const obs = table[i][j];
      if (expected > 0) chi2 += Math.pow(obs - expected, 2) / expected;
    }
  }
  const dof = (r - 1) * (c - 1);
  const p = chiSquarePValue(chi2, dof);
  return { chi2, dof, p };
}

function chiSquarePValue(chi2, dof) {
  if (dof <= 0) return 1;
  function gammaLn(x) {
    const cof = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.001208650973866179, -0.000005395239384953,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.00000000019001;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
  }

  function incompletaGamma(a, x) {
    if (x < 0 || a <= 0) return 0;
    if (x === 0) return 0;
    if (x < a + 1) {
      let sum = 1 / a;
      let term = 1 / a;
      for (let n = 1; n < 100; n++) {
        term *= x / (a + n);
        sum += term;
        if (Math.abs(term) < 1e-10) break;
      }
      return sum * Math.exp(-x + a * Math.log(x) - gammaLn(a));
    } else {
      let b = x + 1 - a;
      let c = 1 / 1e-30;
      let d = 1 / b;
      let h = d;
      for (let i = 1; i < 100; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < 1e-30) d = 1e-30;
        c = b + an / c;
        if (Math.abs(c) < 1e-30) c = 1e-30;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-10) break;
      }
      return 1 - h * Math.exp(-x + a * Math.log(x) - gammaLn(a));
    }
  }
  return 1 - incompletaGamma(dof / 2, chi2 / 2);
}

function oneWayANOVA(groups) {
  const validGroups = groups.filter((g) => g && g.length > 0);
  if (validGroups.length < 2) return null;

  const allData = validGroups.flat();
  const n = allData.length;
  const k = validGroups.length;

  const grandMean = allData.reduce((a, b) => a + b, 0) / n;

  let ssBetween = 0;
  let ssWithin = 0;

  validGroups.forEach((g) => {
    const groupMean = g.reduce((a, b) => a + b, 0) / g.length;
    ssBetween += g.length * Math.pow(groupMean - grandMean, 2);
    g.forEach((val) => {
      ssWithin += Math.pow(val - groupMean, 2);
    });
  });

  const dfBetween = k - 1;
  const dfWithin = n - k;
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  const F = msBetween / msWithin;

  const p = fTestPValue(F, dfBetween, dfWithin);

  return {
    F: parseFloat(F.toFixed(4)),
    dfBetween,
    dfWithin,
    p: parseFloat(p.toFixed(4)),
    groupMeans: validGroups.map((g) => g.reduce((a, b) => a + b, 0) / g.length),
  };
}

function fTestPValue(F, df1, df2) {
  if (F <= 0 || df1 <= 0 || df2 <= 0) return 1;

  const x = df2 / (df2 + df1 * F);

  return betaIncomplete(df2 / 2, df1 / 2, x);
}

function betaIncomplete(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  function gammaLn(z) {
    const cof = [
      76.18009172947146, -86.50532032941677, 24.01409824083091,
      -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = z;
    let tmp = z + 5.5;
    tmp -= (z + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++) ser += cof[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / z);
  }

  const bt = Math.exp(
    gammaLn(a + b) -
      gammaLn(a) -
      gammaLn(b) +
      a * Math.log(x) +
      b * Math.log(1 - x),
  );

  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betaContinuedFraction(a, b, x)) / a;
  } else {
    return 1 - (bt * betaContinuedFraction(b, a, 1 - x)) / b;
  }
}

function betaContinuedFraction(a, b, x) {
  const maxIterations = 200;
  const epsilon = 1e-14;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    let m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    let del = d * c;
    h *= del;
    if (Math.abs(del - 1) < epsilon) break;
  }
  return h;
}
function pearson(x, y) {
  if (x.length !== y.length || x.length < 2) return null;
  return ss.sampleCorrelation(x, y);
}

function spearman(x, y) {
  if (x.length !== y.length || x.length < 2) return null;
  function rank(arr) {
    const sorted = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
    const ranks = [];
    for (let i = 0; i < sorted.length; i++) ranks[sorted[i][1]] = i + 1;
    return ranks;
  }
  return pearson(rank(x), rank(y));
}

// Simple k-means for 2D points (used for exploratory clustering)
function kMeans2D(points, k = 3, maxIter = 30) {
  if (!points.length || k <= 1) return null;
  if (points.length < k) k = points.length;

  const centroids = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor((i * points.length) / k);
    centroids.push({ x: points[idx].x, y: points[idx].y });
  }

  let assignments = new Array(points.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;

    // assignment step
    for (let i = 0; i < points.length; i++) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let c = 0; c < k; c++) {
        const dx = points[i].x - centroids[c].x;
        const dy = points[i].y - centroids[c].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = c;
        }
      }
      if (assignments[i] !== bestIdx) {
        assignments[i] = bestIdx;
        changed = true;
      }
    }

    // recompute centroids
    const sums = Array(k)
      .fill(0)
      .map(() => ({ x: 0, y: 0, count: 0 }));
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      sums[c].x += points[i].x;
      sums[c].y += points[i].y;
      sums[c].count++;
    }
    for (let c = 0; c < k; c++) {
      if (sums[c].count > 0) {
        centroids[c].x = sums[c].x / sums[c].count;
        centroids[c].y = sums[c].y / sums[c].count;
      }
    }

    if (!changed) break;
  }

  return { centroids, assignments, k };
}
