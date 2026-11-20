// Tasker: JavaScript for the student dashboard
const $ = id => document.getElementById(id);
let tasks = [], subjects = [], editingId = null;
let signup = false, month = new Date(), selectedDay = "";

// 1. Send requests to our Express server
async function api(url, method = "GET", data) {
  const response = await fetch("/api" + url, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw Error(result.error || "Server error");
  }
  return response.status === 204 ? null : response.json();
}

function today(d = new Date()) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}
function message(error) { alert(error.message); }

// 2. Login and Sign Up (confirm password is checked in the browser)
$("switchAuth").onclick = e => {
  e.preventDefault();
  signup = !signup;
  $("authTitle").textContent = signup ? "Create Account" : "Welcome back!";
  $("authButton").textContent = signup ? "Sign Up" : "Login";
  $("switchAuth").textContent = signup ? "Back to Login" : "Create an account";
  $("confirmBox").hidden = !signup;
  $("confirmPassword").required = signup;
  $("confirmPassword").value = "";
  $("password").autocomplete = signup ? "new-password" : "current-password";
  $("authError").textContent = "";
};

$("authForm").onsubmit = async e => {
  e.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  const password = $("password").value;
  if (signup && password !== $("confirmPassword").value) {
    $("authError").textContent = "Passwords do not match!";
    return;
  }
  $("authError").textContent = "";
  $("authButton").disabled = true;
  try {
    await api(signup ? "/auth/signup" : "/auth/login", "POST", { email, password });
    $("authForm").reset();
    await openApp(email);
  } catch (error) {
    $("authError").textContent = error.message;
  } finally {
    $("authButton").disabled = false;
  }
};

async function openApp(email) {
  $("welcomeName").textContent = email.split("@")[0];
  $("authPage").hidden = true;
  $("app").hidden = false;
  try { await loadData(); } catch (error) { message(error); }
}
$("logoutBtn").onclick = async () => {
  try {
    await api("/auth/logout", "POST");
    tasks = []; subjects = [];
    $("app").hidden = true;
    $("authPage").hidden = false;
  } catch (error) { message(error); }
};
api("/me").then(data => openApp(data.user.email)).catch(() => {
  $("app").hidden = true;
  $("authPage").hidden = false;
});

// 3. Get tasks and subjects from database
async function loadData() {
  [tasks, subjects] = await Promise.all([api("/tasks"), api("/subjects")]);
  showSubjects();
  showTasks();
  showReminders();
  showCalendar();
  if (selectedDay) showDay(selectedDay);
}

// 4. Manage study subjects
$("subjectForm").onsubmit = async e => {
  e.preventDefault();
  const name = $("subjectName").value.trim();
  if (!name) return;
  try {
    await api("/subjects", "POST", { name });
    $("subjectName").value = "";
    await loadData();
  } catch (error) { message(error); }
};

function showSubjects() {
  const filter = $("subjectFilter").value;
  const chosen = $("taskSubject").value;
  $("subjectList").replaceChildren();
  $("subjectFilter").replaceChildren(new Option("All Subjects", "all"));
  $("taskSubject").replaceChildren(new Option("General", "General"));

  subjects.forEach(s => {
    const row = document.createElement("div");
    row.className = "subject";
    const name = document.createElement("span");
    name.textContent = "📚 " + s.name;
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "small-btn delete-btn";
    del.setAttribute("aria-label", "Delete " + s.name);
    del.onclick = async () => {
      if (!confirm("Delete this subject?")) return;
      try { await api("/subjects/" + s.id, "DELETE"); await loadData(); }
      catch (error) { message(error); }
    };
    row.append(name, del);
    $("subjectList").append(row);
    $("subjectFilter").add(new Option(s.name, s.name));
    $("taskSubject").add(new Option(s.name, s.name));
  });
  $("subjectFilter").value = subjects.some(s => s.name === filter) ? filter : "all";
  $("taskSubject").value = subjects.some(s => s.name === chosen) ? chosen : "General";
}

// 5. Add or edit a task
$("taskFormElement").onsubmit = async e => {
  e.preventDefault();
  const task = {
    name: $("taskName").value.trim(),
    date: $("taskDate").value,
    subject: $("taskSubject").value,
    repeat: $("taskRepeat").value
  };
  if (!task.name || !task.date) return;
  try {
    await api(editingId === null ? "/tasks" : "/tasks/" + editingId,
      editingId === null ? "POST" : "PATCH", task);
    cancelEdit();
    await loadData();
  } catch (error) { message(error); }
};

function editTask(t) {
  editingId = t.id;
  $("taskName").value = t.name;
  $("taskDate").value = t.date;
  $("taskSubject").value = t.subject;
  $("taskRepeat").value = t.repeat;
  $("formTitle").textContent = "Edit Task";
  $("saveTaskBtn").textContent = "Save Changes";
  $("cancelEdit").hidden = false;
  $("taskForm").scrollIntoView({ behavior: "smooth" });
}
function cancelEdit() {
  editingId = null;
  $("taskFormElement").reset();
  $("formTitle").textContent = "✏️ Create a Task";
  $("saveTaskBtn").textContent = "+ Add Task";
  $("cancelEdit").hidden = true;
}
$("cancelEdit").onclick = cancelEdit;

async function completeTask(t) {
  try {
    await api("/tasks/" + t.id, "PATCH", { done: !t.done });
    await loadData(); // The server creates the next daily/weekly task
  } catch (error) { message(error); }
}
async function deleteTask(t) {
  if (!confirm("Delete this task?")) return;
  try {
    await api("/tasks/" + t.id, "DELETE");
    cancelEdit();
    await loadData();
  } catch (error) { message(error); }
}

// 6. Search, filters, task cards and progress
function showTasks() {
  const search = $("search").value.toLowerCase();
  const status = $("filter").value;
  const subject = $("subjectFilter").value;
  const list = $("taskList");
  list.replaceChildren();

  tasks.filter(t =>
    t.name.toLowerCase().includes(search) &&
    (subject === "all" || t.subject === subject) &&
    (status === "all" ||
      (status === "completed" && t.done) ||
      (status === "pending" && !t.done) ||
      (status === "overdue" && !t.done && t.date < today()))
  ).forEach(t => {
    const row = document.createElement("div");
    row.className = "task" + (t.done ? " done" : "");
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = t.done;
    check.setAttribute("aria-label", "Complete " + t.name);
    check.onchange = () => completeTask(t);
    const info = document.createElement("div");
    info.className = "task-info";
    const title = document.createElement("strong");
    title.textContent = t.name;
    const details = document.createElement("small");
    details.textContent = t.subject + " • " + t.date +
      (t.repeat !== "none" ? " • " + t.repeat : "");
    info.append(title, details);
    const edit = document.createElement("button");
    edit.className = "small-btn";
    edit.textContent = "Edit";
    edit.onclick = () => editTask(t);
    const del = document.createElement("button");
    del.className = "small-btn delete-btn";
    del.textContent = "Delete";
    del.onclick = () => deleteTask(t);
    row.append(check, info, edit, del);
    list.append(row);
  });
  if (!list.children.length) list.textContent = "No tasks found.";

  const done = tasks.filter(t => t.done).length;
  $("total").textContent = tasks.length;
  $("completed").textContent = done;
  $("pending").textContent = tasks.length - done;
  $("progress").textContent = (tasks.length ?
    Math.round(done / tasks.length * 100) : 0) + "%";
}
["search", "filter", "subjectFilter"].forEach(id => {
  $(id).addEventListener("input", showTasks);
});

// 7. Remind about tasks within two days
function showReminders() {
  const list = $("reminders");
  list.replaceChildren();
  tasks.forEach(t => {
    if (t.done) return;
    const days = Math.round((new Date(t.date + "T12:00:00") -
      new Date(today() + "T12:00:00")) / 86400000);
    if (days > 2) return;
    const item = document.createElement("div");
    item.className = "reminder" + (days < 0 ? " overdue" : "");
    item.textContent = (days < 0 ? "⚠ Overdue: " :
      days === 0 ? "🔔 Today: " : "🔔 Coming soon: ") + t.name;
    list.append(item);
  });
  if (!list.children.length) list.textContent = "No reminders 🎉";
}

// 8. Monthly calendar
function showCalendar() {
  const grid = $("calendar");
  const y = month.getFullYear(), m = month.getMonth();
  $("monthTitle").textContent =
    month.toLocaleString("en", { month: "long", year: "numeric" });
  grid.replaceChildren();

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(day => {
    const cell = document.createElement("div");
    cell.className = "weekday";
    cell.textContent = day;
    grid.append(cell);
  });
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++) grid.append(document.createElement("div"));
  const count = new Date(y, m + 1, 0).getDate();

  for (let d = 1; d <= count; d++) {
    const date = today(new Date(y, m, d));
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day";
    btn.textContent = d;
    btn.setAttribute("aria-label", date);
    if (tasks.some(t => t.date === date)) btn.classList.add("has-task");
    btn.onclick = () => showDay(date);
    grid.append(btn);
  }
}
function showDay(date) {
  selectedDay = date;
  $("selectedDate").textContent = date;
  $("dayTasks").replaceChildren();
  tasks.filter(t => t.date === date).forEach(t => {
    const p = document.createElement("p");
    p.textContent = (t.done ? "✓ " : "○ ") + t.name;
    $("dayTasks").append(p);
  });
  if (!$("dayTasks").children.length)
    $("dayTasks").textContent = "No tasks on this date.";
}
function changeMonth(n) {
  month.setDate(1);
  month.setMonth(month.getMonth() + n);
  showCalendar();
}
$("prevMonth").onclick = () => changeMonth(-1);
$("nextMonth").onclick = () => changeMonth(1);
