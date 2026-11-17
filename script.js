apiKey: "YOUR_API_KEY",
authDomain: "YOUR_PROJECT.firebaseapp.com",
projectId: "YOUR_PROJECT_ID",
appId: "YOUR_APP_ID"
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

// 1. Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const auth = getAuth(initializeApp(firebaseConfig));
const $ = id => document.getElementById(id);

let user = null, tasks = [], subjects = [];
let signup = false, editIndex = -1;
let month = new Date();
let selectedDay = "";

// 2. Save data
function save() {
  localStorage.setItem("tasks_" + user, JSON.stringify(tasks));
  localStorage.setItem("subjects_" + user, JSON.stringify(subjects));
}

function today(d = new Date()) {
  return d.getFullYear() + "-" +
    String(d.getMonth() + 1).padStart(2, "0") + "-" +
    String(d.getDate()).padStart(2, "0");
}

// 3. Login and Sign Up
$("switchAuth").onclick = e => {
  e.preventDefault();
  signup = !signup;
  $("authTitle").textContent = signup ? "Create Account" : "Welcome back!";
  $("authButton").textContent = signup ? "Sign Up" : "Login";
  $("switchAuth").textContent = signup ? "Back to Login" : "Create an account";
  $("authError").textContent = "";
};

$("authForm").onsubmit = async e => {
  e.preventDefault();
  $("authError").textContent = "Please wait...";
  $("authButton").disabled = true;

  try {
    let email = $("email").value.trim();
    let password = $("password").value;

    if (signup)
      await createUserWithEmailAndPassword(auth, email, password);
    else
      await signInWithEmailAndPassword(auth, email, password);

    $("authError").textContent = "";
  } catch (error) {
    $("authError").textContent = error.code;
  } finally {
    $("authButton").disabled = false;
  }
};

$("logoutBtn").onclick = () => signOut(auth);

onAuthStateChanged(auth, account => {
  user = account?.uid || null;
  $("authPage").hidden = !!user;
  $("app").hidden = !user;

  if (!user) return;

  tasks = JSON.parse(localStorage.getItem("tasks_" + user) || "[]");
  subjects = JSON.parse(localStorage.getItem("subjects_" + user) || "[]");
  $("welcomeName").textContent = account.email.split("@")[0];
  refresh();
});

// 4. Subject Management
$("subjectForm").onsubmit = e => {
  e.preventDefault();
  let name = $("subjectName").value.trim();

  if (!name || subjects.includes(name)) return;

  subjects.push(name);
  $("subjectName").value = "";
  save();
  refresh();
};

function showSubjects() {
  $("subjectList").replaceChildren();
  let selected = $("subjectFilter").value;
  $("subjectFilter").replaceChildren(new Option("All Subjects", "all"));
  $("taskSubject").replaceChildren(new Option("General", "General"));

  subjects.forEach(name => {
    let row = document.createElement("div");
    row.className = "subject";
    row.textContent = "📚 " + name;
    $("subjectList").append(row);
    $("subjectFilter").add(new Option(name, name));
    $("taskSubject").add(new Option(name, name));
  });

  $("subjectFilter").value =
    subjects.includes(selected) ? selected : "all";
}

// 5. Add and Edit Task
$("taskFormElement").onsubmit = e => {
  e.preventDefault();

  let task = {
    name: $("taskName").value.trim(),
    date: $("taskDate").value,
    subject: $("taskSubject").value,
    repeat: $("taskRepeat").value,
    done: false
  };

  if (!task.name || !task.date) return;

  if (editIndex === -1) {
    tasks.push(task);
  } else {
    tasks[editIndex] = {
      ...tasks[editIndex], ...task,
      done: tasks[editIndex].done
    };
  }

  cancelEdit();
  save();
  refresh();
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

// 6. Complete, Repeat and Delete
function completeTask(i) {
  let t = tasks[i];
  t.done = !t.done;

  if (t.done && t.repeat !== "none" && !t.nextCreated) {
    let next = new Date(t.date + "T12:00:00");
    next.setDate(next.getDate() + (t.repeat === "daily" ? 1 : 7));

    tasks.push({
      ...t, date: today(next), done: false, nextCreated: false
    });
    t.nextCreated = true;
  }

  save();
  refresh();
}

function deleteTask(i) {
  if (!confirm("Delete this task?")) return;
  tasks.splice(i, 1);
  cancelEdit();
  save();
  refresh();
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
