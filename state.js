let rawQuestions = [];
let students = [];
let charts = {};

const uid = () => Math.random().toString(36).slice(2, 9);
const show = (id) => document.getElementById(id).classList.remove("hidden");
const hide = (id) => document.getElementById(id).classList.add("hidden");

function loadFromStorage() {
  students = JSON.parse(localStorage.getItem("students_v1") || "[]");
  renderStudentsTable();
  renderAllCharts();
  computeQuickSummary();
}
loadFromStorage();

// Basic controls around the test section
document.getElementById("startTest").addEventListener("click", () => {
  if (!rawQuestions.length) {
    alert("Please load the questions first.");
    return;
  }
  document
    .getElementById("questionsContainer")
    .scrollIntoView({ behavior: "smooth" });
});

document.getElementById("clearResponses").addEventListener("click", () => {
  rawQuestions.forEach((q) => {
    const radios = document.getElementsByName("q-" + q.id);
    radios.forEach((r) => (r.checked = false));
  });
});
