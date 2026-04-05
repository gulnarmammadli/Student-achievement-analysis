// Statistical tests
document.getElementById("runTests").addEventListener("click", () => {
  runStatTests(true);
});

function runStatTests(showAlert = false) {
  if (!students.length) {
    if (showAlert) {
      alert(
        "No students. Please add at least one student before running tests.",
      );
    }
    document.getElementById("statOutput").innerText =
      "No students in the dataset. Statistical tests cannot be computed.";
    return;
  }

  let output = "=== STATISTICAL TEST RESULTS ===\n\n";

  // 1. VARK model analyses
  output += "【 VARK MODEL ANALYSES 】\n";
  output += "─".repeat(50) + "\n\n";

  // 1.1 Course Type × Dominant VARK (Chi-square)
  const courseTypes = students.map((s) => s.meta.courseType || "Unknown");
  const varkDom = students.map((s) => s.dominant.vark || "Unknown");

  const {
    table: varkTable,
    aVals: courseVals,
    bVals: varkVals,
  } = contingencyTable(courseTypes, varkDom);
  const varkChi = chiSquareTest(varkTable);

  const multimodalCount = varkDom.filter((v) => v === "Multimodal").length;
  const multiPercent =
    varkDom.length > 0
      ? ((multimodalCount / varkDom.length) * 100).toFixed(1)
      : 0;

  let insightMsg = "";
  if (Number(multiPercent) > 15) {
    insightMsg =
      multiPercent +
      "% of your class is Multimodal. This suggests a strong need for varied instructional materials.";
  } else {
    insightMsg =
      "Only " +
      multiPercent +
      "% of your class is Multimodal. You can primarily focus on the dominant learning styles of the majority.";
  }

  output += `1.1 Chi-square (Course Type × Dominant VARK)\n`;
  output += `    χ² = ${varkChi.chi2.toFixed(4)}\n`;
  output += `    df = ${varkChi.dof}\n`;
  output += `    p-value = ${varkChi.p.toFixed(4)}\n`;
  output += `    Observation: ${
    varkChi.p < 0.05
      ? "There is a statistically significant association between course type and dominant VARK style (p < 0.05)."
      : "No statistically significant association was detected between course type and dominant VARK style (p ≥ 0.05)."
  }\n\n`;
  output += "    Insight: " + insightMsg + "\n\n";

  // 1.2 Preferred learning resource × Dominant VARK (Chi-square)
  const lrForVarkA = [];
  const lrForVarkB = [];
  students.forEach((s) => {
    if (s.meta.learningResource && s.dominant.vark) {
      lrForVarkA.push(s.meta.learningResource);
      lrForVarkB.push(s.dominant.vark);
    }
  });

  if (lrForVarkA.length > 0) {
    const { table: lrVarkTable } = contingencyTable(lrForVarkA, lrForVarkB);
    const lrVarkChi = chiSquareTest(lrVarkTable);

    output += `1.2 Chi-square (Learning Resource × Dominant VARK)\n`;
    output += `    n = ${lrForVarkA.length}\n`;
    output += `    χ² = ${lrVarkChi.chi2.toFixed(4)}\n`;
    output += `    df = ${lrVarkChi.dof}\n`;
    output += `    p-value = ${lrVarkChi.p.toFixed(4)}\n`;
    output += `    Observation: ${
      lrVarkChi.p < 0.05
        ? "Students’ preferred learning resources and their dominant VARK styles are related in a statistically significant way (p < 0.05)."
        : "No clear statistical link was found between preferred learning resource and dominant VARK style (p ≥ 0.05)."
    }\n\n`;
  } else {
    output += `1.2 Chi-square (Learning Resource × Dominant VARK)\n`;
    output += `    Not enough matched data (missing learning resource or VARK type).\n\n`;
  }

  // 1.3 VARK Scores × GPA correlation
  const gpas = students.map((s) => s.meta.gpa).filter((g) => g != null);

  if (gpas.length >= 3) {
    output += `1.3 VARK Styles × GPA Correlation Analysis\n`;
    output += "─".repeat(50) + "\n\n";

    const varkStyles = [
      { key: "V", label: "Visual" },
      { key: "A", label: "Aural" },
      { key: "R", label: "Read/Write" },
      { key: "K", label: "Kinesthetic" },
    ];

    varkStyles.forEach((style) => {
      const styleScores = students
        .filter((s) => s.meta.gpa != null)
        .map((s) => s.scores.VARK[style.key] || 0);

      const r = pearson(styleScores, gpas);
      const rho = spearman(styleScores, gpas);
      const absR = Math.abs(r);

      let varkNote = "";
      if (absR < 0.2) {
        varkNote = "Negligible or no linear relationship.";
      } else if (r >= 0.2) {
        varkNote = `Positive correlation: Higher ${style.label} scores tend to align with higher GPAs.`;
      } else {
        varkNote = `Negative correlation: Higher ${style.label} scores are associated with lower GPAs in this group.`;
      }

      output += `[${style.label} × GPA]:\n`;
      output += `    Pearson r = ${r.toFixed(4)}, Spearman ρ = ${rho.toFixed(4)}\n`;
      output += `    Analysis Note: ${varkNote}\n\n`;
    });
  } else {
    output += `1.3 VARK Styles × GPA Correlation\n`;
    output += `    Not enough data (n < 3 with valid GPA).\n\n`;
  }

  // 2. Kolb model analyses
  output += "【 KOLB MODEL ANALYSES 】\n";
  output += "─".repeat(50) + "\n\n";

  const kolbTypes = ["Diverger", "Assimilator", "Converger", "Accommodator"];
  const kolbGroups = kolbTypes.map((type) =>
    students
      .filter((s) => s.dominant.kolb === type && s.meta.gpa != null)
      .map((s) => s.meta.gpa),
  );

  const anovaGpaKolb = oneWayANOVA(kolbGroups);
  if (anovaGpaKolb) {
    output += `2.1 One-way ANOVA (KOLB Type × GPA)\n`;
    output += `    F(${anovaGpaKolb.dfBetween}, ${anovaGpaKolb.dfWithin}) = ${anovaGpaKolb.F.toFixed(4)}\n`;
    output += `    p-value = ${anovaGpaKolb.p.toFixed(4)}\n`;
    output += `    Observation: ${
      anovaGpaKolb.p < 0.05
        ? "Mean GPA differs significantly between at least two KOLB types (p < 0.05)."
        : "No statistically significant GPA differences were observed between KOLB types (p ≥ 0.05)."
    }\n\n`;
    output += `    Group means (GPA):\n`;
    kolbTypes.forEach((type, i) => {
      if (kolbGroups[i].length > 0) {
        const stdDevKolbGpa =
          kolbGroups[i].length > 1 ? ss.standardDeviation(kolbGroups[i]) : 0;
        output += `    - ${type}: μ = ${anovaGpaKolb.groupMeans[i].toFixed(
          2,
        )}, σ = ${stdDevKolbGpa.toFixed(2)}, (n = ${kolbGroups[i].length})\n`;
      }
    });
    output += "\n";
  } else {
    output += `2.1 One-way ANOVA (KOLB Type × GPA)\n`;
    output += `    Not enough data (need at least 2 KOLB groups with valid GPA).\n\n`;
  }

  // 2. Kolb axes analysis

  const kolbData = students.filter((s) => s.meta.gpa != null);
  const gpasForKolb = kolbData.map((s) => s.meta.gpa);

  const acMinusCE = kolbData.map(
    (s) => (s.scores.Kolb.AC || 0) - (s.scores.Kolb.CE || 0),
  );
  const aeMinusRO = kolbData.map(
    (s) => (s.scores.Kolb.AE || 0) - (s.scores.Kolb.RO || 0),
  );

  if (gpasForKolb.length >= 3) {
    // 2.2 AC–CE Axis Analysis
    const rAcCe = pearson(acMinusCE, gpasForKolb);
    const rhoAcCe = spearman(acMinusCE, gpasForKolb);
    const absRAcCe = Math.abs(rAcCe);
    let interpAcCe =
      absRAcCe < 0.1
        ? "No significant linear association was detected between the observed parameters."
        : `A ${absRAcCe < 0.3 ? "weak" : "moderate"} ${rAcCe > 0 ? "positive" : "negative"} correlation exists. ${
            rAcCe > 0
              ? "Abstract learners (AC) tend to have higher GPAs."
              : "Concrete learners (CE) perform better."
          }`;

    output += `2.2 Correlation (KOLB AC–CE Axis × GPA)\n`;
    output += `    n = ${gpasForKolb.length} | Pearson r = ${rAcCe.toFixed(4)}, Spearman ρ = ${rhoAcCe.toFixed(4)}\n`;
    output += `    Analysis Note: ${interpAcCe}\n\n`;

    // 2.3 AE–RO Axis Analysis
    const rAeRo = pearson(aeMinusRO, gpasForKolb);
    const rhoAeRo = spearman(aeMinusRO, gpasForKolb);
    const absRAeRo = Math.abs(rAeRo);
    let interpAeRo =
      absRAeRo < 0.1
        ? "No significant linear association was detected between the observed parameters."
        : `A ${absRAeRo < 0.3 ? "weak" : "moderate"} ${rAeRo > 0 ? "positive" : "negative"} correlation exists. ${
            rAeRo > 0
              ? "Active learners (AE) tend to have higher GPAs."
              : "Reflective learners (RO) perform better."
          }`;

    output += `2.3 Correlation (KOLB AE–RO Axis × GPA)\n`;
    output += `    n = ${gpasForKolb.length} | Pearson r = ${rAeRo.toFixed(4)}, Spearman ρ = ${rhoAeRo.toFixed(4)}\n`;
    output += `    Analysis Note: ${interpAeRo}\n\n`;
  } else {
    output += `2.2 & 2.3 KOLB Axes Analysis\n`;
    output += `    Not enough data (n < 3).\n\n`;
  }

  // 3. Weekly study hours analyses
  output += "【 WEEKLY STUDY HOURS ANALYSES 】\n";
  output += "─".repeat(50) + "\n\n";

  // 3.1 Weekly hours × GPA
  const whForGpa = [];
  const gpaForWh = [];
  students.forEach((s) => {
    if (s.meta.weeklyHours != null && s.meta.gpa != null) {
      whForGpa.push(s.meta.weeklyHours);
      gpaForWh.push(s.meta.gpa);
    }
  });

  if (whForGpa.length >= 3) {
    const pearsonWh = pearson(whForGpa, gpaForWh);
    const spearmanWh = spearman(whForGpa, gpaForWh);
    const r = pearsonWh;
    const absR = Math.abs(r);

    let strength = "";
    let direction = r > 0 ? "positive" : "negative";

    if (absR < 0.1) strength = "negligible (no relationship)";
    else if (absR < 0.3) strength = "small/weak";
    else if (absR < 0.5) strength = "medium/moderate";
    else strength = "large/strong";

    let interpWh = "";
    if (absR < 0.1) {
      interpWh =
        "There is no discernible linear relationship between study hours and GPA.";
    } else {
      interpWh = `There is a ${strength} ${direction} correlation. ${
        r > 0
          ? "Generally, more study hours align with higher academic performance."
          : "Surprisingly, increased study hours do not correlate with higher GPAs in this sample."
      }`;
    }

    output += `3.1 Correlation (Weekly Study Hours × GPA)\n`;
    output += `    n = ${whForGpa.length}\n`;
    output += `    Pearson r = ${r.toFixed(4)}\n`;
    output += `    Spearman ρ = ${spearmanWh.toFixed(4)}\n`;
    output += `    Analysis Note: ${interpWh}\n`;
    output += `    Observation: Results are descriptive for this sample (n=${whForGpa.length}).\n\n`;
  } else {
    output += `3.1 Correlation (Weekly Study Hours × GPA)\n`;
    output += `    Not enough data (n < 3).\n\n`;
  }

  // 3.2 Weekly hours × dominant VARK (ANOVA)
  const varkCats = ["V", "A", "R", "K", "Multimodal"];
  const varkHourGroups = varkCats.map((cat) =>
    students
      .filter((s) => s.dominant.vark === cat && s.meta.weeklyHours != null)
      .map((s) => s.meta.weeklyHours),
  );
  const anovaWhVark = oneWayANOVA(varkHourGroups);

  if (anovaWhVark) {
    output += `3.2 One-way ANOVA (Dominant VARK × Weekly Study Hours)\n`;
    output += `    F(${anovaWhVark.dfBetween}, ${anovaWhVark.dfWithin}) = ${anovaWhVark.F.toFixed(4)}\n`;
    output += `    p-value = ${anovaWhVark.p.toFixed(4)}\n`;
    output += `    Observation: ${
      anovaWhVark.p < 0.05
        ? "Average weekly study hours differ significantly between at least two VARK groups (p < 0.05)."
        : "No statistically significant differences in weekly study hours were found between VARK groups (p ≥ 0.05)."
    }\n`;
    output += `    Group means (hours):\n`;
    varkCats.forEach((cat, i) => {
      if (varkHourGroups[i].length > 0) {
        const stdDevVarkHours =
          varkHourGroups[i].length > 1
            ? ss.standardDeviation(varkHourGroups[i])
            : 0;
        output += `    - ${cat}: μ = ${anovaWhVark.groupMeans[i].toFixed(
          2,
        )}, σ = ${stdDevVarkHours.toFixed(2)}, (n = ${varkHourGroups[i].length})\n`;
      }
    });
    output += "\n";
  } else {
    output += `3.2 One-way ANOVA (Dominant VARK × Weekly Study Hours)\n`;
    output += `    Not enough data (need at least 2 VARK groups with weekly hours).\n\n`;
  }

  // 3.3 Weekly hours × KOLB type (ANOVA)
  const kolbHourGroups = kolbTypes.map((type) =>
    students
      .filter((s) => s.dominant.kolb === type && s.meta.weeklyHours != null)
      .map((s) => s.meta.weeklyHours),
  );
  const anovaWhKolb = oneWayANOVA(kolbHourGroups);

  if (anovaWhKolb) {
    output += `3.3 One-way ANOVA (KOLB Type × Weekly Study Hours)\n`;
    output += `    F(${anovaWhKolb.dfBetween}, ${anovaWhKolb.dfWithin}) = ${anovaWhKolb.F.toFixed(4)}\n`;
    output += `    p-value = ${anovaWhKolb.p.toFixed(4)}\n`;
    output += `    Observation: ${
      anovaWhKolb.p < 0.05
        ? "Average weekly study hours differ significantly between at least two KOLB types (p < 0.05)."
        : "No statistically significant differences in weekly study hours were found between KOLB types (p ≥ 0.05)."
    }\n`;
    output += `    Group means (hours):\n`;
    kolbTypes.forEach((type, i) => {
      if (kolbHourGroups[i].length > 0) {
        const stdDevKolbHours =
          kolbHourGroups[i].length > 1
            ? ss.standardDeviation(kolbHourGroups[i])
            : 0;
        output += `    - ${type}: μ = ${anovaWhKolb.groupMeans[i].toFixed(
          2,
        )}, σ = ${stdDevKolbHours.toFixed(2)}, (n = ${kolbHourGroups[i].length})\n`;
      }
    });
    output += "\n";
  } else {
    output += `3.3 One-way ANOVA (KOLB Type × Weekly Study Hours)\n`;
    output += `    Not enough data (need at least 2 KOLB groups with weekly hours).\n\n`;
  }

  // 4. Gender and learning style analyses
  output += "【 GENDER AND LEARNING STYLE ANALYSES 】\n";
  output += "─".repeat(50) + "\n\n";

  // 4.1 Gender × Dominant VARK (Chi-square)
  const genderForVarkA = [];
  const genderForVarkB = [];
  students.forEach((s) => {
    if (s.meta.gender && s.dominant.vark) {
      genderForVarkA.push(s.meta.gender);
      genderForVarkB.push(s.dominant.vark);
    }
  });

  if (genderForVarkA.length > 0) {
    const { table: genderVarkTable } = contingencyTable(
      genderForVarkA,
      genderForVarkB,
    );
    const genderVarkChi = chiSquareTest(genderVarkTable);

    output += `4.1 Chi-square (Gender × Dominant VARK)\n`;
    output += `    n = ${genderForVarkA.length}\n`;
    output += `    χ² = ${genderVarkChi.chi2.toFixed(4)}\n`;
    output += `    df = ${genderVarkChi.dof}\n`;
    output += `    p-value = ${genderVarkChi.p.toFixed(4)}\n`;
    output += `    Observation: ${
      genderVarkChi.p < 0.05
        ? "Learning style preferences (VARK) differ by gender in a statistically significant way (p < 0.05)."
        : "No statistically significant association was found between gender and dominant VARK style (p ≥ 0.05)."
    }\n\n`;
  } else {
    output += `4.1 Chi-square (Gender × Dominant VARK)\n`;
    output += `    Not enough data (gender or VARK type missing).\n\n`;
  }

  // 4.2 Gender × KOLB type (Chi-square)
  const genderForKolbA = [];
  const genderForKolbB = [];
  students.forEach((s) => {
    if (s.meta.gender && s.dominant.kolb) {
      genderForKolbA.push(s.meta.gender);
      genderForKolbB.push(s.dominant.kolb);
    }
  });

  if (genderForKolbA.length > 0) {
    const { table: genderKolbTable } = contingencyTable(
      genderForKolbA,
      genderForKolbB,
    );
    const genderKolbChi = chiSquareTest(genderKolbTable);

    output += `4.2 Chi-square (Gender × KOLB Type)\n`;
    output += `    n = ${genderForKolbA.length}\n`;
    output += `    χ² = ${genderKolbChi.chi2.toFixed(4)}\n`;
    output += `    df = ${genderKolbChi.dof}\n`;
    output += `    p-value = ${genderKolbChi.p.toFixed(4)}\n`;
    output += `    Observation: ${
      genderKolbChi.p < 0.05
        ? "KOLB learning types are distributed differently across genders (p < 0.05)."
        : "No statistically significant association was found between gender and KOLB type (p ≥ 0.05)."
    }\n\n`;
  } else {
    output += `4.2 Chi-square (Gender × KOLB Type)\n`;
    output += `    Not enough data (gender or KOLB type missing).\n\n`;
  }

  // 5. K-MEANS Clustering
  output += "【 STUDENT PROFILING: K-MEANS CLUSTERING 】\n";
  output += "Method: K-Means (Normalized GPA & Learning Styles)\n";
  output += "─".repeat(50) + "\n\n";

  // 5. VARK clustering analyses (with 1st and 2nd dominants)
  const varkOrder = ["V", "A", "R", "K", "Multimodal"];
  const clusterSource = students
    .filter(
      (s) =>
        s.meta.gpa != null &&
        s.dominant.vark &&
        varkOrder.includes(s.dominant.vark),
    )
    .map((s) => ({
      gpa: s.meta.gpa,
      vark: s.dominant.vark,
    }));

  if (clusterSource.length >= 4) {
    const gList = clusterSource.map((d) => d.gpa);
    const vNumList = clusterSource.map((d) => varkOrder.indexOf(d.vark));

    const gMean = ss.mean(gList);
    const vMean = ss.mean(vNumList);
    const gStd = ss.standardDeviation(gList) || 1;
    const vStd = ss.standardDeviation(vNumList) || 1;

    const normPoints = clusterSource.map((d, i) => ({
      x: (d.gpa - gMean) / gStd,
      y: (vNumList[i] - vMean) / vStd,
    }));

    const kCount = Math.min(3, normPoints.length);

    const km = kMeans2D(normPoints, kCount);

    if (km) {
      const clusters = Array.from({ length: km.k }, () => ({
        count: 0,
        gpaSum: 0,
        varkCounts: { V: 0, A: 0, R: 0, K: 0, Multimodal: 0 },
      }));

      km.assignments.forEach((cIdx, i) => {
        const c = clusters[cIdx];
        c.count++;
        c.gpaSum += clusterSource[i].gpa;
        const label = clusterSource[i].vark;
        if (label && c.varkCounts[label] !== undefined) {
          c.varkCounts[label]++;
        }
      });

      output += "【 MULTIVARIATE CLUSTERING: GPA & VARK MODELS 】\n";
      clusters.forEach((c, idx) => {
        if (c.count === 0) return;
        const meanG = c.gpaSum / c.count;

        const sortedStyles = Object.entries(c.varkCounts)
          .filter((entry) => entry[1] > 0)
          .sort((a, b) => b[1] - a[1]);

        const firstStyle = sortedStyles[0] ? sortedStyles[0][0] : "-";
        const secondStyle = sortedStyles[1] ? sortedStyles[1][0] : null;

        let styleOutput = firstStyle;
        if (secondStyle) styleOutput += `, then ${secondStyle}`;

        const details = Object.entries(c.varkCounts)
          .filter((entry) => entry[1] > 0)
          .sort((a, b) => b[1] - a[1])
          .map((entry) => `${entry[0]}: ${entry[1]}`)
          .join(", ");

        output += `Cluster ${idx + 1}: n = ${c.count}, mean GPA ≈ ${meanG.toFixed(2)}\n`;
        output += `   Distribution: [ ${details} ]\n`;
      });
      output += "\n";
    }
  }

  //  6. KOLB clustering analyses (with 1st and 2nd dominants)
  const kolbOrder = ["Diverger", "Assimilator", "Converger", "Accommodator"];
  const kolbClusterSource = students
    .filter((s) => s.meta.gpa != null && s.dominant.kolb)
    .map((s) => ({
      gpa: s.meta.gpa,
      kolb: s.dominant.kolb,
    }));

  if (kolbClusterSource.length >= 4) {
    const gListK = kolbClusterSource.map((d) => d.gpa);
    const kNumList = kolbClusterSource.map((d) => kolbOrder.indexOf(d.kolb));

    const gMeanK = ss.mean(gListK);
    const kMeanK = ss.mean(kNumList);
    const gStdK = ss.standardDeviation(gListK) || 1;
    const kStdK = ss.standardDeviation(kNumList) || 1;

    const normPointsK = kolbClusterSource.map((d, i) => ({
      x: (d.gpa - gMeanK) / gStdK,
      y: (kNumList[i] - kMeanK) / kStdK,
    }));

    const kCountK = Math.min(3, normPointsK.length);
    const kmK = kMeans2D(normPointsK, kCountK);

    if (kmK) {
      const kolbClusters = Array.from({ length: kmK.k }, () => ({
        count: 0,
        gpaSum: 0,
        kolbCounts: {
          Diverger: 0,
          Assimilator: 0,
          Converger: 0,
          Accommodator: 0,
        },
      }));

      kmK.assignments.forEach((cIdx, i) => {
        const c = kolbClusters[cIdx];
        c.count++;
        c.gpaSum += kolbClusterSource[i].gpa;
        const label = kolbClusterSource[i].kolb;
        if (label && c.kolbCounts[label] !== undefined) {
          c.kolbCounts[label]++;
        }
      });

      output += "【 MULTIVARIATE CLUSTERING: GPA & KOLB MODELS 】\n";
      kolbClusters.forEach((c, idx) => {
        if (c.count === 0) return;
        const meanG = c.gpaSum / c.count;

        const sortedK = Object.entries(c.kolbCounts)
          .filter((entry) => entry[1] > 0)
          .sort((a, b) => b[1] - a[1]);

        const firstK = sortedK[0] ? sortedK[0][0] : "-";
        const secondK = sortedK[1] ? sortedK[1][0] : null;

        let kolbOutput = firstK;
        if (secondK) kolbOutput += `, then ${secondK}`;

        const detailsK = Object.entries(c.kolbCounts)
          .filter((entry) => entry[1] > 0)
          .sort((a, b) => b[1] - a[1])
          .map((entry) => `${entry[0]}: ${entry[1]}`)
          .join(", ");

        output += `Cluster ${idx + 1}: n = ${c.count}, mean GPA ≈ ${meanG.toFixed(2)}\n`;
        output += `   Distribution: [ ${detailsK} ]\n`;
      });
      output += "\n";
    }
  }

  output += "=== END OF REPORT ===\n";

  document.getElementById("statOutput").innerText = output;
  populateAdminVarkDetails(varkChi, varkTable, courseVals, varkVals);
  populateAdminKolbDetails(anovaGpaKolb, kolbGroups, kolbTypes);

  if (showAlert)
    alert(
      "Statistical tests have been completed. Please check Admin → All Statistics tab.",
    );
}
