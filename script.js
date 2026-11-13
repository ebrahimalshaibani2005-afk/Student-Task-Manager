
// Tasker - Simple Student Project

let user = localStorage.getItem("taskerUser");
let tasks = [];
let subjects = [];
let month = new Date();
let signup = false;

// Save and load data for each username
function save() {
  localStorage.setItem("tasks_" + user, JSON.stringify(tasks));
  localStorage.setItem("subjects_" + user, JSON.stringify(subjects));
}

function start() {
  document.getElementById("loginPage").hidden = !!user;
  document.getElementById("app").hidden = !user;
  if (!user) return;

  tasks = JSON.parse(localStorage.getItem("tasks_" + user) || "[]");
  subjects = JSON.parse(localStorage.getItem("subjects_" + user) || "[]");
  document.getElementById("welcomeName").textContent = user;
  refresh();
}

// Demo Sign Up and Login (not secure authentication)
function switchLogin() {
  signup = !signup;
  document.getElementById("loginTitle").textContent =
    signup ? "Create Account" : "Welcome Back!";
  document.getElementById("loginSwitch").textContent =
    signup ? "Back to Login" : "Create an account";
}

function login() {
  let name = document.getElementById("username").value.trim();
  let users = JSON.parse(localStorage.getItem("taskerUsers") || "[]");
  let error = document.getElementById("loginError");

  if (!name) {
    error.textContent = "Please enter a username";
    return;
  }

  if (signup) {
    if (users.includes(name)) {
      error.textContent = "Username already exists";
      return;
    }
    users.push(name);
    localStorage.setItem("taskerUsers", JSON.stringify(users));
  } else if (!users.includes(name)) {
    error.textContent = "Account not found. Please sign up.";
    return;
  }

  user = name;
  localStorage.setItem("taskerUser", user);
  error.textContent = "";
  start();
}

function logout() {
  localStorage.removeItem("taskerUser");
  user = null;
  tasks = [];
  subjects = [];
  start();
}

// Add a subject
function addSubject() {
  let name = prompt("Subject name:");
  if (!name || !name.trim()) return;

  name = name.trim();
  if (subjects.includes(name)) return alert("Subject exists!");

  subjects.push(name);
  save();
  refresh();
}

// Add a task
function addTask() {
  let name = prompt("Task name:");
  if (!name || !name.trim()) return;

  let date = prompt("Due date (YYYY-MM-DD):", "");
  if (date === null) return;

  if (date && !validDate(date)) {
    return alert("Use a valid date: YYYY-MM-DD");
  }

  let subject = "General";
  if (subjects.length) {
    subject = prompt("Subject: " + subjects.join(", "), subjects[0]);
    if (subject === null) return;
    if (!subjects.includes(subject)) return alert("Unknown subject");
  }

  let repeat = prompt("Repeat: none, daily, weekly", "none");
  if (repeat === null) return;
  repeat = repeat.toLowerCase().trim();

  if (!["none", "daily", "weekly"].includes(repeat)) {
    return alert("Invalid repeat option");
  }
  if (repeat !== "none" && !date) {
    return alert("Repeating tasks need a date");
  }

  tasks.push({
    name: name.trim(),
    date: date,
    subject: subject,
    repeat: repeat,
    done: false
  });

  save();
  refresh();
}

function validDate(value) {
  let d = new Date(value + "T12:00:00");
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(d) && dateText(d) === value;
}

function dateText(d) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// Complete task and create next recurring task
function completeTask(i) {
  let t = tasks[i];
  t.done = !t.done;

  if (t.done && t.repeat !== "none" && !t.nextCreated) {
    let next = new Date(t.date + "T12:00:00");
    next.setDate(next.getDate() + (t.repeat === "daily" ? 1 : 7));

    tasks.push({
      name: t.name,
      date: dateText(next),
      subject: t.subject,
      repeat: t.repeat,
      done: false
    });
    t.nextCreated = true;
  }

  save();
  refresh();
}

function editTask(i) {
  let name = prompt("Edit task:", tasks[i].name);
  if (!name || !name.trim()) return;
  tasks[i].name = name.trim();
  save();
  refresh();
}

function deleteTask(i) {
  if (!confirm("Delete this task?")) return;
  tasks.splice(i, 1);
  save();
  refresh();
}

// Show tasks, search and filters
function showTasks() {
  let list = document.getElementById("taskList");
  let search = document.getElementById("search").value.toLowerCase();
  let filter = document.getElementById("filter").value;
  let subject = document.getElementById("subjectFilter").value;
  let today = dateText(new Date());

  list.replaceChildren();

  tasks.forEach((t, i) => {
    if (!t.name.toLowerCase().includes(search)) return;
    if (subject !== "all" && t.subject !== subject) return;
    if (filter === "completed" && !t.done) return;
    if (filter === "pending" && t.done) return;
    if (filter === "overdue" &&
        (t.done || !t.date || t.date >= today)) return;

    let row = document.createElement("div");
    row.className = "task" + (t.done ? " done" : "");

    let check = document.createElement("input");
    check.type = "checkbox";
    check.checked = t.done;
    check.onchange = () => completeTask(i);

    let info = document.createElement("div");
    info.className = "task-info";

    let title = document.createElement("strong");
    title.textContent = t.name;

    let details = document.createElement("small");
    details.textContent =
      t.subject + " • " + (t.date || "No date") +
      (t.repeat !== "none" ? " • " + t.repeat : "");

    info.append(title, details);

    let edit = document.createElement("button");
    edit.className = "small-btn";
    edit.textContent = "Edit";
    edit.onclick = () => editTask(i);

    let del = document.createElement("button");
    del.className = "small-btn delete-btn";
    del.textContent = "Delete";
    del.onclick = () => deleteTask(i);

    row.append(check, info, edit, del);
    list.appendChild(row);
  });

  if (!list.children.length) list.textContent = "No tasks found.";

  let done = tasks.filter(t => t.done).length;
  document.getElementById("total").textContent = tasks.length;
  document.getElementById("completed").textContent = done;
  document.getElementById("pending").textContent = tasks.length - done;
  document.getElementById("progress").textContent =
    (tasks.length ? Math.round(done / tasks.length * 100) : 0) + "%";
}

// Show subjects
function showSubjects() {
  let list = document.getElementById("subjectList");
  let select = document.getElementById("subjectFilter");
  let selected = select.value;

  list.replaceChildren();
  select.replaceChildren(new Option("All Subjects", "all"));

  subjects.forEach(s => {
    let row = document.createElement("div");
    row.className = "subject";
    row.textContent = "📚 " + s;
    list.appendChild(row);
    select.add(new Option(s, s));
  });

  select.value = subjects.includes(selected) ? selected : "all";
  if (!subjects.length) list.textContent = "No subjects yet.";
}

// Reminders: overdue or due within 2 days
function showReminders() {
  let list = document.getElementById("reminders");
  let today = new Date(dateText(new Date()) + "T12:00:00");
  list.replaceChildren();

  tasks.forEach(t => {
    if (t.done || !t.date) return;

    let days = Math.round(
      (new Date(t.date + "T12:00:00") - today) / 86400000
    );

    if (days > 2) return;

    let row = document.createElement("div");
    row.className = "reminder" + (days < 0 ? " overdue" : "");
    row.textContent = (days < 0 ? "⚠ Overdue: " :
      days === 0 ? "🔔 Today: " : "🔔 Soon: ") + t.name;
    list.appendChild(row);
  });

  if (!list.children.length) list.textContent = "No reminders 🎉";
}

// Calendar
function changeMonth(n) {
  month.setMonth(month.getMonth() + n, 1);
  showCalendar();
}

function showCalendar() {
  let grid = document.getElementById("calendar");
  let year = month.getFullYear();
  let m = month.getMonth();
  let first = (new Date(year, m, 1).getDay() + 6) % 7;
  let count = new Date(year, m + 1, 0).getDate();

  grid.replaceChildren();
  document.getElementById("monthTitle").textContent =
    month.toLocaleString("en", { month: "long", year: "numeric" });

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
    let cell = document.createElement("div");
    cell.className = "weekday";
    cell.textContent = d;
    grid.appendChild(cell);
  });

  for (let i = 0; i < first; i++) {
    grid.appendChild(document.createElement("div"));
  }

  for (let day = 1; day <= count; day++) {
    let date = dateText(new Date(year, m, day));
    let button = document.createElement("button");
    button.className = "day";
    button.textContent = day;

    if (tasks.some(t => t.date === date)) {
      button.classList.add("has-task");
    }

    button.onclick = () => showDay(date);
    grid.appendChild(button);
  }
}

function showDay(date) {
  document.getElementById("selectedDate").textContent = date;
  let list = document.getElementById("dayTasks");
  list.replaceChildren();

  tasks.filter(t => t.date === date).forEach(t => {
    let p = document.createElement("p");
    p.textContent = (t.done ? "✓ " : "○ ") + t.name;
    list.appendChild(p);
  });

  if (!list.children.length) list.textContent = "No tasks.";
}

// Update everything
function refresh() {
  showSubjects();
  showTasks();
  showReminders();
  showCalendar();
}

start();
