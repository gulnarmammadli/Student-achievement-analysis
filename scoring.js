// Decide which Kolb learning type is dominant
function calculateKolbType(CE, RO, AC, AE) {
  const ac_ce = AC - CE;
  const ae_ro = AE - RO;

  if (ac_ce > 0 && ae_ro > 0) {
    return "Converger";
  } else if (ac_ce > 0 && ae_ro <= 0) {
    return "Assimilator";
  } else if (ac_ce <= 0 && ae_ro > 0) {
    return "Accommodator";
  } else if (ac_ce <= 0 && ae_ro <= 0) {
    return "Diverger";
  }

  return "Diverger";
}

// Read answers, calculate scores and store the student
document
  .getElementById("saveStudent")
  .addEventListener("click", () => saveStudent());

function saveStudent() {
  const name = document.getElementById("studentName").value.trim();
  if (!name) {
    alert("Student name is required.");
    return;
  }

  const meta = {
    name,
    gpa: Number(document.getElementById("studentGPA").value) || null,
    gender: document.getElementById("studentGender").value || null,
    courseType: document.getElementById("courseType").value || null,
    weeklyHours: Number(document.getElementById("weeklyHours").value) || null,
    learningResource: document.getElementById("learningResource").value || null,
    savedAt: new Date().toISOString(),
  };

  const responses = {};
  rawQuestions.forEach((q) => {
    const radios = document.getElementsByName("q-" + q.id);
    let val = null;
    radios.forEach((r) => {
      if (r.checked) val = Number(r.value);
    });
    responses[q.index] = val;
  });

  const scores = {
    VARK: { V: 0, A: 0, R: 0, K: 0 },
    Kolb: { CE: 0, RO: 0, AC: 0, AE: 0 },
  };

  rawQuestions.forEach((q, i) => {
    const resp = responses[q.index];
    if (resp === null || resp === undefined) return;
    const cat = (q.category || "").toLowerCase();
    if (cat.includes("vark")) {
      const map = ["V", "A", "R", "K"];
      const key = map[resp] || map[resp % 4];
      scores.VARK[key] += 1;
    } else if (cat.includes("kolb")) {
      const map = ["CE", "RO", "AC", "AE"];
      const key = map[resp] || map[resp % 4];
      scores.Kolb[key] += 1;
    }
  });

  const entries = Object.entries(scores.VARK).sort((a, b) => b[1] - a[1]);
  const varkDom =
    entries.filter((e) => e[1] === entries[0][1]).length > 1
      ? "Multimodal"
      : entries[0][0];

  const { CE, RO, AC, AE } = scores.Kolb;
  const kolbType = calculateKolbType(CE, RO, AC, AE);

  const student = {
    id: uid(),
    meta,
    responses,
    scores,
    dominant: { vark: varkDom, kolb: kolbType },
  };

  students.push(student);
  localStorage.setItem("students_v1", JSON.stringify(students));
  renderStudentsTable();
  computeQuickSummary();
  renderAllCharts();

  alert("Student saved: " + meta.name);
  document.getElementById("studentName").value = "";
  document.getElementById("studentGPA").value = "";
  document.getElementById("clearResponses").click();
}

// Render students table
function renderStudentsTable() {
  const el = document.getElementById("studentsTable");
  if (!students.length) {
    el.innerHTML = '<div class="muted">No students yet.</div>';
    return;
  }
  let html =
    '<table class="min-w-full text-sm"><thead class="text-left text-xs text-slate-500"><tr><th>Name</th><th>GPA</th><th>VARK</th><th>KOLB</th><th>Saved at</th></tr></thead><tbody>';
  students.forEach((s) => {
    html += `<tr class="border-t"><td class="py-2">${s.meta.name}</td><td>${
      s.meta.gpa === null ? "-" : s.meta.gpa.toFixed(2)
    }</td><td>${s.dominant.vark || "-"}</td><td>${
      s.dominant.kolb || "-"
    }</td><td class="tiny">${new Date(
      s.meta.savedAt,
    ).toLocaleString()}</td></tr>`;
  });
  html += "</tbody></table>";
  el.innerHTML = html;
}

function computeQuickSummary(showAlert = false) {
  if (!students.length) {
    document.getElementById("quickSummary").innerText = "No students yet.";
    document.getElementById("autoSuggestion").innerText =
      "There are no students in the dataset yet.";
    return;
  }
  const gpas = students.map((s) =>
    s.meta.gpa === null || s.meta.gpa === undefined ? NaN : s.meta.gpa,
  );
  const present = gpas.filter((v) => !isNaN(v));
  const count = students.length;
  const missingGPA = gpas.filter((v) => isNaN(v)).length;
  const meanGPA = present.length ? ss.mean(present) : null;
  const medianGPA = present.length ? ss.median(present) : null;
  const stdGPA = present.length ? ss.standardDeviation(present) : null;

  const vTotals = { V: 0, A: 0, R: 0, K: 0 };
  const kolbTypeCounts = {
    Diverger: 0,
    Assimilator: 0,
    Converger: 0,
    Accommodator: 0,
  };

  students.forEach((s) => {
    const sv = s.scores.VARK;
    if (sv) Object.keys(vTotals).forEach((k) => (vTotals[k] += sv[k] || 0));
    if (s.dominant.kolb) {
      kolbTypeCounts[s.dominant.kolb]++;
    }
  });

  const quick = `Total students: ${count}
      Missing GPA: ${missingGPA}
      Mean GPA: ${meanGPA ? meanGPA.toFixed(2) : "-"}
      Median GPA: ${medianGPA ? medianGPA.toFixed(2) : "-"}
      Std GPA: ${stdGPA ? stdGPA.toFixed(2) : "-"}
      VARK totals: V=${vTotals.V}, A=${vTotals.A}, R=${vTotals.R}, K=${vTotals.K}
      KOLB types: Div=${kolbTypeCounts.Diverger}, Assim=${
        kolbTypeCounts.Assimilator
      }, Conv=${kolbTypeCounts.Converger}, Accom=${
        kolbTypeCounts.Accommodator
      }`;

  document.getElementById("quickSummary").innerText = quick;

  // Suggestion section

  const totalRaw = vTotals.V + vTotals.A + vTotals.R + vTotals.K;
  const total = totalRaw === 0 ? 1 : totalRaw;
  const vShare = vTotals.V / total;
  const aShare = vTotals.A / total;
  const rShare = vTotals.R / total;
  const kShare = vTotals.K / total;

  const lowGpaGroup = students.filter(
    (s) => s.meta.gpa !== null && s.meta.gpa < 60,
  );
  const hasRisk = lowGpaGroup.length > 0;

  const THRESHOLD = 0.4;
  const above = [];

  if (vShare >= THRESHOLD) above.push("V");
  if (aShare >= THRESHOLD) above.push("A");
  if (rShare >= THRESHOLD) above.push("R");
  if (kShare >= THRESHOLD) above.push("K");

  let finalSuggestion = "";

  if (above.length === 1) {
    const style = above[0];

    const styleFullNames = {
      V: "Visual",
      A: "Aural",
      R: "Read/Write",
      K: "Kinesthetic",
    };
    const messages = {
      V: "Most students in the class seem to learn better through visual materials. Using diagrams, charts, and simple visual explanations will likely make the lessons clearer.",
      A: "Many students prefer learning by listening. Including discussions, verbal explanations, and short peer conversations may improve their understanding.",
      R: "The group shows a noticeable tendency toward reading and writing. Providing written materials, structured notes, and short writing tasks can support learning.",
      K: "A large part of the class learns best by doing. Hands-on activities, simple simulations, and practice-based tasks are expected to be more effective.",
    };

    finalSuggestion = messages[style];

    if (hasRisk) {
      finalSuggestion += ` \n\n⚠️ Note: Although ${styleFullNames[style]} is dominant, clustering shows some students are struggling with low GPA. Supplement your lessons with additional practical support for this group.`;
    }
  } else {
    finalSuggestion =
      "The class demonstrates a multimodal learning pattern, indicating that a combination of instructional strategies is likely to be more appropriate than a single dominant approach.";
  }

  document.getElementById("autoSuggestion").innerText = finalSuggestion;

  if (showAlert)
    alert(
      "Analysis complete! You can check the details in the Quick Summary panel.",
    );
}
