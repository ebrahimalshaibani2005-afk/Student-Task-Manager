
// Load saved data
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let subjects = JSON.parse(localStorage.getItem("subjects")) || [];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Get date as YYYY-MM-DD
function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let day = String(date.getDate()).padStart(2, "0");

  return year + "-" + month + "-" + day;
}

// Save data
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function saveSubjects() {
  localStorage.setItem("subjects", JSON.stringify(subjects));
}

// Add subject
function addSubject() {
  let name = prompt("Enter subject name:");

  if (name === null || name.trim() === "") {
    return;
  }

  name = name.trim();

  if (subjects.includes(name)) {
    alert("Subject already exists");
    return;
  }

  subjects.push(name);
  saveSubjects();
  showSubjects();
}

// Show subjects
function showSubjects() {
  let list = document.getElementById("subjectList");
  let filter = document.getElementById("subjectFilter");
  let selected = filter.value;

  list.innerHTML = "";
  filter.innerHTML = '<option value="all">All Subjects</option>';

  for (let i = 0; i < subjects.length; i++) {
    let row = document.createElement("div");
    row.className = "subject";
    row.textContent = "📚 " + subjects[i];

    list.appendChild(row);

    let option = document.createElement("option");
    option.value = subjects[i];
    option.textContent = subjects[i];
    filter.appendChild(option);
  }

  filter.value = subjects.includes(selected) ? selected : "all";
  showTasks();
}

// Add task
function addTask() {
  let name = prompt("Enter task name:");

  if (name === null || name.trim() === "") {
    return;
  }

  let date = prompt("Due date (YYYY-MM-DD):") || "";

  if (date !== "" && !isValidDate(date)) {
    alert("Please enter a valid date: YYYY-MM-DD");
    return;
  }

  let subject = "General";

  if (subjects.length > 0) {
    let answer = prompt(
      "Enter subject:\n" + subjects.join(", "),
      subjects[0]
    );

    if (answer === null) return;

    if (!subjects.includes(answer.trim())) {
      alert("Please choose an existing subject");
      return;
    }

    subject = answer.trim();
  }

  let repeat = prompt(
    "Repeat task: none, daily, weekly",
    "none"
  );

  if (repeat === null) return;

  repeat = repeat.toLowerCase().trim();

  if (!["none", "daily", "weekly"].includes(repeat)) {
    alert("Invalid repeat option");
    return;
  }

  tasks.push({
    name: name.trim(),
    date: date,
    subject: subject,
    repeat: repeat,
    completed: false
  });

  saveTasks();
  refresh();
}

// Validate date
function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  let date = new Date(value + "T12:00:00");
  return !isNaN(date.getTime()) && formatDate(date) === value;
}

// Show tasks
function showTasks() {
  let list = document.getElementById("taskList");
  let search = document.getElementById("search").value.toLowerCase();
  let filter = document.getElementById("filter").value;
  let subjectFilter = document.getElementById("subjectFilter").value;
  let today = formatDate(new Date());

  list.innerHTML = "";

  let completed = 0;

  for (let i = 0; i < tasks.length; i++) {
    let task = tasks[i];

    if (task.completed) completed++;

    if (!task.name.toLowerCase().includes(search)) continue;

    if (filter === "completed" && !task.completed) continue;
    if (filter === "pending" && task.completed) continue;

    if (filter === "overdue") {
      if (task.completed || !task.date || task.date >= today) {
        continue;
      }
    }

    if (subjectFilter !== "all" && task.subject !== subjectFilter) {
      continue;
    }

    let row = document.createElement("div");
    row.className = "task";

    let checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.onchange = function() {
      completeTask(i);
    };

    let title = document.createElement("span");
    title.textContent = task.name;

    if (task.completed) {
      title.style.textDecoration = "line-through";
    }

    let info = document.createElement("small");
    info.textContent =
      " | " + (task.subject || "General") +
      " | " + (task.date || "No date") +
      " | " + (task.repeat || "none");

    let edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.onclick = function() {
      editTask(i);
    };

    let remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.onclick = function() {
      deleteTask(i);
    };

    row.append(checkbox, title, info, edit, remove);
    list.appendChild(row);
  }

  let total = tasks.length;
  let pending = total - completed;

  let progress = total === 0
    ? 0
    : Math.round(completed / total * 100);

  document.getElementById("total").textContent = total;
  document.getElementById("completed").textContent = completed;
  document.getElementById("pending").textContent = pending;
  document.getElementById("progress").textContent = progress + "%";
}

// Complete task
function completeTask(index) {
  let task = tasks[index];

  if (task.repeat !== "none" && !task.completed && task.date) {
    // Finish this occurrence and create the next one
    let nextDate = new Date(task.date + "T12:00:00");

    if (task.repeat === "daily") {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    if (task.repeat === "weekly") {
      nextDate.setDate(nextDate.getDate() + 7);
    }

    let nextTask = {
      name: task.name,
      date: formatDate(nextDate),
      subject: task.subject,
      repeat: task.repeat,
      completed: false
    };

    task.completed = true;
    tasks.push(nextTask);
  } else {
    task.completed = !task.completed;
  }

  saveTasks();
  refresh();
}

// Edit task
function editTask(index) {
  let name = prompt("Edit task:", tasks[index].name);

  if (name !== null && name.trim() !== "") {
    tasks[index].name = name.trim();
    saveTasks();
    refresh();
  }
}

// Delete task
function deleteTask(index) {
  if (confirm("Delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    refresh();
  }
}

// Task reminders
function showReminders() {
  let list = document.getElementById("reminders");
  let today = new Date(formatDate(new Date()) + "T12:00:00");

  list.innerHTML = "";
  let count = 0;

  for (let task of tasks) {
    if (task.completed || !task.date || !isValidDate(task.date)) {
      continue;
    }

    let due = new Date(task.date + "T12:00:00");
    let days = Math.round((due - today) / 86400000);

    if (days <= 2) {
      let row = document.createElement("div");
      row.className = "reminder";

      if (days < 0) {
        row.classList.add("overdue");
        row.textContent = "⚠ Overdue: " + task.name;
      } else if (days === 0) {
        row.textContent = "🔔 Due today: " + task.name;
      } else {
        row.textContent =
          "🔔 Due in " + days + " day(s): " + task.name;
      }

      list.appendChild(row);
      count++;
    }
  }

  if (count === 0) {
    list.textContent = "No upcoming reminders 🎉";
  }
}

// Change calendar month
function changeMonth(amount) {
  currentMonth += amount;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  showCalendar();
}

// Show calendar
function showCalendar() {
  let calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  let firstDay = new Date(currentYear, currentMonth, 1);
  let daysInMonth = new Date(
    currentYear, currentMonth + 1, 0
  ).getDate();

  document.getElementById("monthTitle").textContent =
    firstDay.toLocaleString("en", {
      month: "long",
      year: "numeric"
    });

  let weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  for (let day of weekDays) {
    let label = document.createElement("div");
    label.className = "weekday";
    label.textContent = day;
    calendar.appendChild(label);
  }

  let start = (firstDay.getDay() + 6) % 7;

  for (let i = 0; i < start; i++) {
    calendar.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= daysInMonth; day++) {
    let date = formatDate(new Date(currentYear, currentMonth, day));

    let button = document.createElement("button");
    button.className = "day";
    button.textContent = day;

    if (tasks.some(task => task.date === date)) {
      button.classList.add("has-task");
      button.textContent = day + " •";
    }

    button.onclick = function() {
      showDayTasks(date);
    };

    calendar.appendChild(button);
  }
}

// Show tasks for selected day
function showDayTasks(date) {
  let list = document.getElementById("dayTasks");
  list.innerHTML = "";

  document.getElementById("selectedDateTitle").textContent =
    "Tasks for " + date;

  let found = false;

  for (let task of tasks) {
    if (task.date === date) {
      let row = document.createElement("p");
      row.textContent =
        (task.completed ? "✓ " : "○ ") + task.name;
      list.appendChild(row);
      found = true;
    }
  }

  if (!found) {
    list.textContent = "No tasks on this date";
  }
}

// Update everything
function refresh() {
  showTasks();
  showReminders();
  showCalendar();
}

// Start application
showSubjects();
refresh();
