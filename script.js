const $ = id => document.getElementById(id);
let user = null, tasks = [], subjects = [];
let signup = false, editIndex = -1;
let month = new Date();
let selectedDay = "";

async function api(url, method = "GET", body) {
  const options = { method, credentials: "same-origin" };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch("/api" + url, options);
  } catch {
    throw new Error("Cannot reach Tasker server. Start it with npm run dev.");
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Request failed (" + response.status + ")");
  }
  if (response.status === 204) return null;
  return response.json();
}

function today(d = new Date()) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

function errorMessage(error) {
  alert(error.message || "Something went wrong");
}
async function loadData() {
  [tasks, subjects] = await Promise.all([api("/tasks"), api("/subjects")]);
  refresh();
}
async function openDashboard(account) {
  user = account;
  $("welcomeName").textContent = account.email.split("@")[0];
  $("authPage").hidden = true;
  $("app").hidden = false;
  try { await loadData(); } catch (error) { errorMessage(error); }
}
$("switchAuth").onclick = event => {
  event.preventDefault();
  signup = !signup;
  $("authTitle").textContent = signup ? "Create Account" : "Welcome back!";
  $("authButton").textContent = signup ? "Sign Up" : "Login";
  $("switchAuth").textContent = signup ? "Back to Login" : "Create an account";
  $("authError").textContent = "";
};
$("authForm").onsubmit = async event => {
  event.preventDefault();
  $("authError").textContent = "";
  $("authButton").disabled = true;
  try {
    const email = $("email").value.trim().toLowerCase();
    const password = $("password").value;
    const result = await api(signup ? "/auth/signup" : "/auth/login", "POST", { email, password });
    $("authForm").reset();
    await openDashboard(result.user);
  } catch (error) {
    $("authError").textContent = error.message;
  } finally {
    $("authButton").disabled = false;
  }
};
$("logoutBtn").onclick = async () => {
  try {
    await api("/auth/logout", "POST");
    user = null;
    tasks = [];
    subjects = [];
    $("app").hidden = true;
    $("authPage").hidden = false;
  } catch (error) { errorMessage(error); }
};
api("/me").then(result => openDashboard(result.user)).catch(() => {
  $("app").hidden = true;
  $("authPage").hidden = false;
});

// 4. Subject Management
$("subjectForm").onsubmit = async e => {
  e.preventDefault();
  const name = $("subjectName").value.trim();
  if (!name || subjects.some(s => s.name === name)) return;
  try {
    await api("/subjects", "POST", { name });
    $("subjectName").value = "";
    await loadData();
  } catch (error) { errorMessage(error); }
};

function showSubjects() {
  $("subjectList").replaceChildren();
  const selected = $("subjectFilter").value;
  const taskSelection = $("taskSubject").value;
  $("subjectFilter").replaceChildren(new Option("All Subjects", "all"));
  $("taskSubject").replaceChildren(new Option("General", "General"));

  subjects.forEach(subject => {
    const row = document.createElement("div");
    row.className = "subject";
    const label = document.createElement("span");
    label.textContent = "📚 " + subject.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "small-btn delete-btn";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete " + subject.name);
    remove.onclick = async () => {
      if (!confirm("Delete this subject? Existing tasks keep their subject name.")) return;
      try { await api("/subjects/" + subject.id, "DELETE"); await loadData(); }
      catch (error) { errorMessage(error); }
    };
    row.append(label, remove);
    $("subjectList").append(row);
    $("subjectFilter").add(new Option(subject.name, subject.name));
    $("taskSubject").add(new Option(subject.name, subject.name));
  });

  const names = subjects.map(s => s.name);
  $("subjectFilter").value = names.includes(selected) ? selected : "all";
  $("taskSubject").value = names.includes(taskSelection) ? taskSelection : "General";
}

// 5. Add and Edit Task
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
    if (editIndex === -1)
      await api("/tasks", "POST", task);
    else
      await api("/tasks/" + tasks[editIndex].id, "PATCH", task);
    cancelEdit();
    await loadData();
  } catch (error) { errorMessage(error); }
};

function cancelEdit() {
  editIndex = -1;
  $("taskFormElement").reset();
  $("formTitle").textContent = "✏️ Create a Task";
  $("saveTaskBtn").textContent = "+ Add Task";
  $("cancelEdit").hidden = true;
}

$("cancelEdit").onclick = cancelEdit;

function editTask(i) {
  let t = tasks[i];
  editIndex = i;

  $("taskName").value = t.name;
  $("taskDate").value = t.date;
  $("taskSubject").value = t.subject;
  $("taskRepeat").value = t.repeat;

  $("formTitle").textContent = "Edit Task";
  $("saveTaskBtn").textContent = "Save Changes";
  $("cancelEdit").hidden = false;
  $("taskForm").scrollIntoView({ behavior: "smooth" });
}

// 6. Complete and Delete
async function completeTask(i) {
  try {
    const task = tasks[i];
    await api("/tasks/" + task.id, "PATCH", { done: !task.done });
    await loadData();
  } catch (error) { errorMessage(error); }
}
async function deleteTask(i) {
  if (!confirm("Delete this task?")) return;
  try {
    await api("/tasks/" + tasks[i].id, "DELETE");
    cancelEdit();
    await loadData();
  } catch (error) { errorMessage(error); }
}

// 7. Search, Filters and Progress
function showTasks() {
  let list = $("taskList");
  let search = $("search").value.toLowerCase();
  let filter = $("filter").value;
  let subject = $("subjectFilter").value;

  list.replaceChildren();

  tasks.forEach((t, i) => {
    if (!t.name.toLowerCase().includes(search)) return;
    if (subject !== "all" && t.subject !== subject) return;
    if (filter === "completed" && !t.done) return;
    if (filter === "pending" && t.done) return;
    if (filter === "overdue" && (t.done || t.date >= today())) return;

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
    details.textContent = t.subject + " • " + t.date +
      (t.repeat !== "none" ? " • " + t.repeat : "");
    info.append(title, details);

    let edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.className = "small-btn";
    edit.onclick = () => editTask(i);

    let del = document.createElement("button");
    del.textContent = "Delete";
    del.className = "small-btn delete-btn";
    del.onclick = () => deleteTask(i);

    row.append(check, info, edit, del);
    list.append(row);
  });

  if (!list.children.length) list.textContent = "No tasks found.";

  let done = tasks.filter(t => t.done).length;
  $("total").textContent = tasks.length;
  $("completed").textContent = done;
  $("pending").textContent = tasks.length - done;
  $("progress").textContent =
    (tasks.length ? Math.round(done / tasks.length * 100) : 0) + "%";
}

["search", "filter", "subjectFilter"].forEach(id => {
  $(id).addEventListener("input", showTasks);
});

// 8. Reminders
function showReminders() {
  let list = $("reminders");
  list.replaceChildren();

  tasks.forEach(t => {
    if (t.done || !t.date) return;

    let days = Math.round(
      (new Date(t.date + "T12:00:00") -
       new Date(today() + "T12:00:00")) / 86400000
    );

    if (days > 2) return;

    let row = document.createElement("div");
    row.className = "reminder" + (days < 0 ? " overdue" : "");
    row.textContent = (days < 0 ? "⚠ Overdue: " :
      days === 0 ? "🔔 Today: " : "🔔 Coming soon: ") + t.name;
    list.append(row);
  });

  if (!list.children.length) list.textContent = "No reminders 🎉";
}

// 9. Calendar
function showCalendar() {
  let grid = $("calendar");
  let y = month.getFullYear(), m = month.getMonth();

  $("monthTitle").textContent =
    month.toLocaleString("en", { month: "long", year: "numeric" });

  grid.replaceChildren();

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach(d => {
    let cell = document.createElement("div");
    cell.className = "weekday";
    cell.textContent = d;
    grid.append(cell);
  });

  let offset = (new Date(y, m, 1).getDay() + 6) % 7;
  for (let i = 0; i < offset; i++)
    grid.append(document.createElement("div"));

  let count = new Date(y, m + 1, 0).getDate();

  for (let d = 1; d <= count; d++) {
    let date = today(new Date(y, m, d));
    let btn = document.createElement("button");
    btn.className = "day";

    if (tasks.some(t => t.date === date))
      btn.classList.add("has-task");

    btn.textContent = d;
    btn.onclick = () => showDay(date);
    grid.append(btn);
  }
}

function showDay(date) {
  selectedDay = date;
  $("selectedDate").textContent = date;
  $("dayTasks").replaceChildren();

  tasks.filter(t => t.date === date).forEach(t => {
    let p = document.createElement("p");
    p.textContent = (t.done ? "✓ " : "○ ") + t.name;
    $("dayTasks").append(p);
  });

  if (!$("dayTasks").children.length)
    $("dayTasks").textContent = "No tasks on this date.";
}

$("prevMonth").onclick = () => changeMonth(-1);
$("nextMonth").onclick = () => changeMonth(1);

function changeMonth(n) {
  month.setDate(1);
  month.setMonth(month.getMonth() + n);
  showCalendar();
}

// 10. Update Dashboard
function refresh() {
  showSubjects();
  showTasks();
  showReminders();
  showCalendar();
  if (selectedDay) showDay(selectedDay);
}
