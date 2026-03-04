// Read questions from the uploaded Excel file
document
  .getElementById("btnLoadXLS")
  .addEventListener("click", () => document.getElementById("xlsInput").click());
document.getElementById("xlsInput").addEventListener("change", async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  document.getElementById("xlsInfo").innerText = "Loading...";
  const data = await f.arrayBuffer();
  const wb = XLSX.read(data);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  rawQuestions = json.map((r, idx) => {
    const qText =
      r.question ||
      r.soru ||
      r.Question ||
      Object.values(r)[0] ||
      "Question " + (idx + 1);
    const opts = [];
    ["A", "optionA", "a", "secenek1", "Option1", "opt1"].forEach((k) => {
      if (r[k]) opts.push(r[k]);
    });
    ["B", "optionB", "b", "secenek2", "Option2", "opt2"].forEach((k) => {
      if (r[k]) opts.push(r[k]);
    });
    ["C", "optionC", "c", "secenek3", "Option3", "opt3"].forEach((k) => {
      if (r[k]) opts.push(r[k]);
    });
    ["D", "optionD", "d", "secenek4", "Option4", "opt4"].forEach((k) => {
      if (r[k]) opts.push(r[k]);
    });
    if (opts.length === 0) {
      const vals = Object.values(r)
        .slice(1)
        .filter((v) => v !== "");
      for (let i = 0; i < Math.min(4, vals.length); i++) opts.push(vals[i]);
    }
    const cat = (r.category || r.kategori || r.Category || r.Kategori || "")
      .toString()
      .trim();
    return {
      id: uid(),
      q: qText,
      options: opts.length ? opts : ["A", "B", "C", "D"],
      category: cat || null,
      index: idx,
    };
  });

  const anyCat = rawQuestions.some((q) => q.category);
  if (!anyCat) {
    for (let i = 0; i < rawQuestions.length; i++) {
      if (i < 16) rawQuestions[i].category = "VARK";
      else if (i < 28) rawQuestions[i].category = "Kolb";
    }
  }

  document.getElementById("xlsInfo").innerText =
    `${rawQuestions.length} questions loaded`;
  renderQuestions();
});

// Show questions and options on the page
function renderQuestions() {
  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";
  if (!rawQuestions.length) {
    container.innerHTML =
      '<div class="muted">No questions yet. Please load an Excel file.</div>';
    return;
  }
  rawQuestions.forEach((q, idx) => {
    const div = document.createElement("div");
    div.className = "border rounded p-3";
    let optsHtml = "";
    q.options.forEach((opt, oi) => {
      const id = `q-${q.id}-o-${oi}`;
      optsHtml += `<label class="flex items-center gap-2"><input type="radio" name="q-${q.id}" value="${oi}" id="${id}" /> <span class="text-sm">${opt}</span></label>`;
    });
    div.innerHTML = `<div class="flex items-start justify-between"><div><div class="text-sm font-medium">#${
      idx + 1
    } <span class="muted">[${
      q.category || "Unknown"
    }]</span></div><div class="mt-1">${
      q.q
    }</div></div></div><div class="mt-3 space-y-2">${optsHtml}</div>`;
    container.appendChild(div);
  });
}
