const daysContainer = document.getElementById("days");
const monthYear = document.getElementById("monthYear");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const weekdays = document.getElementById("weekdays");

const titleInput = document.getElementById("title");
const timeInput = document.getElementById("time");
const descInput = document.getElementById("desc");

const saveBtn = document.getElementById("save");
const deleteBtn = document.getElementById("delete");
const closeBtn = document.getElementById("close");

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const clearBtn = document.getElementById("clearDrawing");

/* ================= STATE ================= */

let currentView = "month";
let currentDate = new Date();
let selectedDate = null;
let selectedEventId = null;
let events = JSON.parse(localStorage.getItem("events")) || [];

/* ================= DRAWING ================= */

let drawing = false;

ctx.lineWidth = 2;
ctx.lineCap = "round";
ctx.strokeStyle = "#000";

canvas.addEventListener("pointerdown", e => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
});

canvas.addEventListener("pointerup", () => drawing = false);
canvas.addEventListener("pointerleave", () => drawing = false);

clearBtn.onclick = () => ctx.clearRect(0, 0, canvas.width, canvas.height);

/* ================= HELPERS ================= */

function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events));
}

/* ================= MODAL ================= */

function openModal(mode, event = null) {
  modal.classList.remove("hidden");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (mode === "create") {
    modalTitle.textContent = "Nouvel événement";
    selectedEventId = null;
    titleInput.value = "";
    timeInput.value = "";
    descInput.value = "";
    deleteBtn.classList.add("hidden");
  }

  if (mode === "edit") {
    modalTitle.textContent = "Modifier l’événement";
    selectedEventId = event.id;
    titleInput.value = event.title;
    timeInput.value = event.time;
    descInput.value = event.description;
    deleteBtn.classList.remove("hidden");

    if (event.drawing) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0);
      img.src = event.drawing;
    }
  }
}

function closeModal() {
  modal.classList.add("hidden");
}

closeBtn.onclick = closeModal;

/* ================= SAVE / DELETE ================= */

saveBtn.onclick = () => {
  if (!titleInput.value || !selectedDate) return;

  const drawingData = canvas.toDataURL();

  if (selectedEventId) {
    const event = events.find(e => e.id === selectedEventId);
    event.title = titleInput.value;
    event.time = timeInput.value;
    event.description = descInput.value;
    event.drawing = drawingData;
  } else {
    events.push({
      id: Date.now(),
      date: selectedDate,
      title: titleInput.value,
      time: timeInput.value,
      description: descInput.value,
      drawing: drawingData
    });
  }

  saveEvents();
  closeModal();
  renderCalendar();
};

deleteBtn.onclick = () => {
  events = events.filter(e => e.id !== selectedEventId);
  saveEvents();
  closeModal();
  renderCalendar();
};

/* ================= VIEWS ================= */

document.querySelectorAll(".views button").forEach(btn => {
  btn.onclick = () => {
    currentView = btn.dataset.view;
    document.querySelectorAll(".views button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderCalendar();
  };
});

/* ================= ROUTER ================= */

function renderCalendar() {
  daysContainer.innerHTML = "";
  if (currentView === "month") renderMonth();
  if (currentView === "week") renderWeek();
  if (currentView === "day") renderDay();
}

/* ================= MONTH ================= */

function renderMonth() {
  weekdays.style.display = "grid";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  monthYear.textContent = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric"
  });

  const firstDay = new Date(year, month, 1).getDay() || 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 1; i < firstDay; i++) {
    daysContainer.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayDiv = document.createElement("div");

    dayDiv.innerHTML = `<div class="day-number">${day}</div>`;

    events.filter(e => e.date === dateStr).forEach(event => {
      const ev = document.createElement("div");
      ev.className = "event";
      ev.textContent = event.title;
      ev.onclick = e => {
        e.stopPropagation();
        openModal("edit", event);
      };
      dayDiv.appendChild(ev);
    });

    dayDiv.onclick = () => {
      selectedDate = dateStr;
      openModal("create");
    };

    daysContainer.appendChild(dayDiv);
  }
}

/* ================= WEEK ================= */

function renderWeek() {
  weekdays.style.display = "grid";

  const start = new Date(currentDate);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);

  monthYear.textContent = "Semaine du " + start.toLocaleDateString();

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];

    const col = document.createElement("div");
    col.className = "week-day";
    col.innerHTML = `<strong>${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })}</strong>`;

    events.filter(e => e.date === dateStr).forEach(event => {
      const ev = document.createElement("div");
      ev.className = "event";
      ev.textContent = event.title;
      ev.onclick = e => {
        e.stopPropagation();
        openModal("edit", event);
      };
      col.appendChild(ev);
    });

    col.onclick = () => {
      selectedDate = dateStr;
      openModal("create");
    };

    daysContainer.appendChild(col);
  }
}

/* ================= DAY ================= */

function renderDay() {
  weekdays.style.display = "none";

  const dateStr = currentDate.toISOString().split("T")[0];
  monthYear.textContent = currentDate.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  for (let h = 8; h <= 20; h++) {
    const hour = document.createElement("div");
    hour.className = "hour";
    hour.innerHTML = `<span>${h}:00</span>`;

    events
      .filter(e => e.date === dateStr && e.time?.startsWith(String(h).padStart(2, "0")))
      .forEach(event => {
        const ev = document.createElement("div");
        ev.className = "event";
        ev.textContent = event.title;
        ev.onclick = e => {
          e.stopPropagation();
          openModal("edit", event);
        };
        hour.appendChild(ev);
      });

    hour.onclick = () => {
      selectedDate = dateStr;
      openModal("create");
    };

    daysContainer.appendChild(hour);
  }
}

/* ================= NAV ================= */

document.getElementById("prev").onclick = () => {
  if (currentView === "month") currentDate.setMonth(currentDate.getMonth() - 1);
  if (currentView === "week") currentDate.setDate(currentDate.getDate() - 7);
  if (currentView === "day") currentDate.setDate(currentDate.getDate() - 1);
  renderCalendar();
};

document.getElementById("next").onclick = () => {
  if (currentView === "month") currentDate.setMonth(currentDate.getMonth() + 1);
  if (currentView === "week") currentDate.setDate(currentDate.getDate() + 7);
  if (currentView === "day") currentDate.setDate(currentDate.getDate() + 1);
  renderCalendar();
};

renderCalendar();
