// Admin modal logic
document.getElementById("btnAdmin").addEventListener("click", () => {
  document.getElementById("adminModal").classList.remove("hidden");
  document.getElementById("adminModal").classList.add("flex");
});
document.getElementById("closeAdmin").addEventListener("click", () => {
  document.getElementById("adminModal").classList.add("hidden");
});
document.getElementById("adminCancel").addEventListener("click", () => {
  document.getElementById("adminModal").classList.add("hidden");
});
document.getElementById("adminLoginBtn").addEventListener("click", () => {
  const pw = document.getElementById("adminPassword").value;
  if (pw === "12345") {
    document.getElementById("adminModal").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    activateTab("tab-list");
    populateAdminStudents();
    runStatTests(false);
  } else alert("Hatalı şifre");
});
document.getElementById("adminClose").addEventListener("click", () => {
  document.getElementById("adminPanel").classList.add("hidden");
});
document.getElementById("adminExport").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ students, rawQuestions }, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "class_report.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("clearStorageBtn").addEventListener("click", () => {
  if (
    !confirm(
      "Are you sure you want to delete all student data from localStorage? This action cannot be undone.",
    )
  )
    return;
  localStorage.removeItem("students_v1");
  students = [];
  renderStudentsTable();
  populateAdminStudents();
  renderAllCharts();
  computeQuickSummary();
  document.getElementById("statOutput").innerText =
    "All student data has been cleared. No statistics are available.";
  alert("All student data in localStorage has been cleared.");
});

document.querySelectorAll(".tabBtn").forEach((btn) => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tab));
});
function activateTab(tabId) {
  document
    .querySelectorAll(".tabContent")
    .forEach((s) => s.classList.add("hidden"));
  document.getElementById(tabId).classList.remove("hidden");
}

// Admin populators
function populateAdminStudents() {
  const el = document.getElementById("adminStudents");
  if (!students.length) {
    el.innerHTML = '<div class="muted">No students yet.</div>';
    return;
  }
  let html =
    '<table class="min-w-full text-sm"><thead><tr><th>Name</th><th>GPA</th><th>VARK</th><th>KOLB</th><th>Delete</th></tr></thead><tbody>';
  students.forEach((s) => {
    html += `<tr class="border-t"><td>${s.meta.name}</td><td>${
      s.meta.gpa === null ? "-" : s.meta.gpa.toFixed(2)
    }</td><td>${s.dominant.vark || "-"}</td><td>${
      s.dominant.kolb || "-"
    }</td><td><button onclick="deleteAdminStudent('${s.id}')" class="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button></td></tr>`;
  });
  html += "</tbody></table>";
  el.innerHTML = html;
}

function deleteAdminStudent(id) {
  students = students.filter((s) => s.id !== id);
  localStorage.setItem("students_v1", JSON.stringify(students));

  populateAdminStudents();
  renderStudentsTable();
  renderAllCharts();
  computeQuickSummary();
  runStatTests(false);
}

function populateAdminVarkDetails(chi, table, aVals, bVals) {
  const el = document.getElementById("adminVark");
  if (!students.length) {
    el.innerHTML = '<div class="muted">No students yet.</div>';
    return;
  }
  const fixedOrder = ["V", "A", "R", "K", "Multimodal"];
  const totals = { V: 0, A: 0, R: 0, K: 0 };
  const dom = { V: 0, A: 0, R: 0, K: 0, Multimodal: 0 };
  students.forEach((s) => {
    if (s.scores && s.scores.VARK)
      Object.keys(totals).forEach((k) => (totals[k] += s.scores.VARK[k] || 0));
    if (s.dominant && s.dominant.vark)
      dom[s.dominant.vark] = (dom[s.dominant.vark] || 0) + 1;
  });

  const total = students.length;
  const classified = dom.V + dom.A + dom.R + dom.K + dom.Multimodal;
  const getPercentage = (n) =>
    classified > 0 ? ((n / classified) * 100).toFixed(1) : 0;

  let html = `<div class="card p-3">
                <b>Total VARK Scores (all students)</b><br>
                Visual: ${totals.V}<br>
                Aural: ${totals.A}<br>
                Read/Write: ${totals.R}<br>
                Kinesthetic: ${totals.K}<br>
              </div>`;

  html += `<div class="card p-3">
                <b>Dominant VARK Distribution (students)</b><br>
                 Total Participation: <span class="font-bold"> ${total} </span> students<br>
                V: ${dom.V} (${getPercentage(dom.V)}%) | A: ${dom.A} (${getPercentage(dom.A)}%) | R: ${dom.R} (${getPercentage(dom.R)}%) | K: ${dom.K} (${getPercentage(dom.K)}%) | Multimodal: ${dom.Multimodal} (${getPercentage(dom.Multimodal)}%)
              </div>`;

  html += `<div class="card p-3 col-span-2">
                <b>Chi-square Test (Course Type × Dominant VARK)</b><br>
                χ² = ${chi.chi2.toFixed(4)}, df = ${chi.dof}, p = ${chi.p.toFixed(4)}<br>
                <span class="text-xs ${chi.p < 0.05 ? "text-green-600" : "text-gray-500"}">
                  ${chi.p < 0.05 ? "✓ Significant association (p < 0.05)" : "No significant association"}
                </span>
              </div>`;

  html +=
    '<div class="card p-3 col-span-2"><b>Contingency Table (Course Type × Dominant VARK)</b><br>';
  html +=
    '<table class="min-w-full text-sm mt-2"><thead><tr><th>Course type</th>';
  const activeColumns = fixedOrder.filter((type) => bVals.includes(type));
  activeColumns.forEach((b) => (html += `<th>${b}</th>`));
  html += "</tr></thead><tbody>";
  for (let i = 0; i < aVals.length; i++) {
    html += `<tr class="border-t"><td class="font-medium">${aVals[i]}</td>`;

    activeColumns.forEach((type) => {
      const colIndex = bVals.indexOf(type);
      const value = table[i][colIndex] || 0;
      html += `<td class="text-center">${value}</td>`;
    });

    html += "</tr>";
  }
  html += "</tbody></table></div>";

  el.innerHTML = html;
}

function populateAdminKolbDetails(anova, groups, types) {
  const el = document.getElementById("adminKolb");
  if (!students.length) {
    el.innerHTML = '<div class="muted">No students yet.</div>';
    return;
  }

  const typeCounts = {
    Diverger: 0,
    Assimilator: 0,
    Converger: 0,
    Accommodator: 0,
  };

  students.forEach((s) => {
    if (s.dominant.kolb) {
      typeCounts[s.dominant.kolb]++;
    }
  });

  const totalStudents = students.length;
  const classifiedCount =
    typeCounts.Diverger +
    typeCounts.Assimilator +
    typeCounts.Converger +
    typeCounts.Accommodator;

  const undefinedStudentCount = totalStudents - classifiedCount;

  let html = `<div class="card p-3">
    <b>KOLB Analysis Summary</b><br>
    Total Participation: <span class="font-bold"> ${totalStudents} </span> students<br>
     ${undefinedStudentCount > 0 ? `<span class="text-green-600 font-bold">${classifiedCount}</span> students in dominant styles, <span class="text-red-600 font-bold">${undefinedStudentCount}</span> students with undefined profile.` : ""}
   <br>
    Diverger: ${typeCounts.Diverger} (${((typeCounts.Diverger / totalStudents) * 100).toFixed(1)}%)<br>
    Assimilator: ${typeCounts.Assimilator} (${((typeCounts.Assimilator / totalStudents) * 100).toFixed(1)}%)<br>
    Converger: ${typeCounts.Converger} (${((typeCounts.Converger / totalStudents) * 100).toFixed(1)}%)<br>
    Accommodator: ${typeCounts.Accommodator} (${((typeCounts.Accommodator / totalStudents) * 100).toFixed(1)}%)
</div>`;

  if (anova) {
    html += `<div class="card p-3">
                  <b>ANOVA (KOLB Type × GPA)</b><br>
                  F(${anova.dfBetween}, ${anova.dfWithin}) = ${anova.F.toFixed(4)}<br>
                  p-value = ${anova.p.toFixed(4)}<br>
                  <span class="text-xs ${anova.p < 0.05 ? "text-green-600" : "text-gray-500"}">
                    ${anova.p < 0.05 ? "✓ Significant differences between groups (p < 0.05)" : "No statistically significant differences between groups"}
                  </span>
                </div>`;

    html +=
      '<div class="card p-3 col-span-2"><b>Group Means (GPA by KOLB Type)</b><br>';
    html +=
      '<table class="min-w-full text-sm mt-2"><thead><tr><th>KOLB Type</th><th>n</th><th>Mean GPA</th></tr></thead><tbody>';
    types.forEach((type, i) => {
      if (groups[i].length > 0) {
        html += `<tr class="border-t"><td>${type}</td><td class="text-center">${
          groups[i].length
        }</td><td class="text-center">${anova.groupMeans[i].toFixed(2)}</td></tr>`;
      }
    });
    html += "</tbody></table></div>";
  } else {
    html += `<div class="card p-3"><b>ANOVA</b><br>Not enough data (less than 2 groups with valid GPA).</div>`;
  }

  el.innerHTML = html;
}
