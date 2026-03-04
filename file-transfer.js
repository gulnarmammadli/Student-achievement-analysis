//  Import JSON

document.getElementById("importJSON").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    const fileContent = e.target.result;
    try {
      const jsonObject = JSON.parse(fileContent);
      const students = jsonObject?.students;
      if (!students) return;

      const lsOldStudents = JSON.parse(
        localStorage.getItem("students_v1") ?? "[]",
      );
      localStorage.setItem(
        "students_v1",
        JSON.stringify([...lsOldStudents, ...students]),
      );
    } catch (error) {
      console.error("Error parsing JSON file:", error);
    }
  };
  reader.readAsText(file);
  window.location.reload();
});

// Export CSV / JSON

document.getElementById("exportCSV").addEventListener("click", () => {
  if (!students.length) {
    alert("No students. Please add at least one student before exporting CSV.");
    return;
  }
  const header = [
    "name",
    "gpa",
    "gender",
    "courseType",
    "weeklyHours",
    "learningResource",
    "varkV",
    "varkA",
    "varkR",
    "varkK",
    "varkDominant",
    "kolbCE",
    "kolbRO",
    "kolbAC",
    "kolbAE",
    "kolbType",
  ];
  const rows = students.map((s) => [
    s.meta.name,
    s.meta.gpa === null ? "" : s.meta.gpa,
    s.meta.gender || "",
    s.meta.courseType || "",
    s.meta.weeklyHours || "",
    s.meta.learningResource || "",
    s.scores.VARK.V,
    s.scores.VARK.A,
    s.scores.VARK.R,
    s.scores.VARK.K,
    s.dominant.vark || "",
    s.scores.Kolb.CE,
    s.scores.Kolb.RO,
    s.scores.Kolb.AC,
    s.scores.Kolb.AE,
    s.dominant.kolb || "",
  ]);
  let csv =
    header.join(",") +
    "\n" +
    rows.map((r) => r.map((v) => `"${String(v || "")}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students.csv";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("exportAll").addEventListener("click", () => {
  const payload = {
    students,
    questions: rawQuestions,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "report.json";
  a.click();
  URL.revokeObjectURL(url);
});
