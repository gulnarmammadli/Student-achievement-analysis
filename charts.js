// Charts rendering
function renderAllCharts() {
  const vTotals = { V: 0, A: 0, R: 0, K: 0 };
  const kolbTypeCounts = {
    Diverger: 0,
    Assimilator: 0,
    Converger: 0,
    Accommodator: 0,
  };

  students.forEach((s) => {
    if (s.scores && s.scores.VARK)
      Object.keys(vTotals).forEach(
        (k) => (vTotals[k] += s.scores.VARK[k] || 0),
      );
    if (s.dominant.kolb) {
      if (kolbTypeCounts.hasOwnProperty(s.dominant.kolb)) {
        kolbTypeCounts[s.dominant.kolb]++;
      }
    }
  });

  const dominantCounts = { V: 0, A: 0, R: 0, K: 0, Multimodal: 0 };

  students.forEach((s) => {
    if (s.dominant && s.dominant.vark) {
      dominantCounts[s.dominant.vark]++;
    }
  });
  // VARK bar
  const vb = document.getElementById("varkBar").getContext("2d");
  if (charts.varkBar) charts.varkBar.destroy();

  charts.varkBar = new Chart(vb, {
    type: "pie",
    data: {
      labels: ["Visual", "Aural", "Read/Write", "Kinesthetic", "Multimodal"],
      datasets: [
        {
          label: "Students",
          data: [
            dominantCounts.V,
            dominantCounts.A,
            dominantCounts.R,
            dominantCounts.K,
            dominantCounts.Multimodal,
          ],
          backgroundColor: [
            "#3b82f6",
            "#ef4444",
            "#10b981",
            "#f59e0b",
            "#a855f7",
          ],
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        title: {
          display: true,
          text: "VARK Style Distribution (Count & Percentage)",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              let value = context.parsed;
              let total = context.dataset.data.reduce(
                (acc, curr) => acc + curr,
                0,
              );
              let percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value} tələbə (${percentage}%)`;
            },
          },
        },
      },
    },
  });
  // KOLB bar
  const kb = document.getElementById("kolbBar").getContext("2d");
  if (charts.kolbBar) charts.kolbBar.destroy();

  charts.kolbBar = new Chart(kb, {
    type: "pie",
    data: {
      labels: ["Diverger", "Assimilator", "Converger", "Accommodator"],
      datasets: [
        {
          label: "Students",
          data: [
            kolbTypeCounts.Diverger,
            kolbTypeCounts.Assimilator,
            kolbTypeCounts.Converger,
            kolbTypeCounts.Accommodator,
          ],
          backgroundColor: ["#8b5cf6", "#06b6d4", "#920303", "#f97316"],
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "bottom",
        },
        title: {
          display: true,
          text: "KOLB Type Distribution (Count & Percentage)",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              let value = context.parsed;
              let total = context.dataset.data.reduce(
                (acc, curr) => acc + curr,
                0,
              );
              let percentage = ((value / total) * 100).toFixed(1);

              return `${label}: ${value} tələbə (${percentage}%)`;
            },
          },
        },
      },
    },
  });
}
