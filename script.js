
// Load saved tasks
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// Save tasks
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add new task
function addTask() {
  let name = prompt("Enter task name:");

  if (name === null || name.trim() === "") {
    return;
  }

  let date = prompt("Enter due date (YYYY-MM-DD):") || "";

  let task = {
    name: name.trim(),
    date: date,
    completed: false
  };

  tasks.push(task);
  saveTasks();
  showTasks();
}

// Show tasks
function showTasks() {
  let list = document.getElementById("taskList");
  let search = document.getElementById("search").value.toLowerCase();
  let filter = document.getElementById("filter").value;

  list.innerHTML = "";

  let completed = 0;

  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].completed) {
      completed++;
    }

    let task = tasks[i];

    if (!task.name.toLowerCase().includes(search)) {
      continue;
    }

    if (filter === "completed" && !task.completed) {
      continue;
    }

    if (filter === "pending" && task.completed) {
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

    let date = document.createElement("small");
    date.textContent = " | " + (task.date || "No due date");

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

    row.append(checkbox, title, date, edit, remove);
    list.appendChild(row);
  }

  document.getElementById("total").textContent = tasks.length;
  document.getElementById("completed").textContent = completed;
  document.getElementById("pending").textContent =
    tasks.length - completed;
}

// Complete task
function completeTask(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  showTasks();
}

// Edit task
function editTask(index) {
  let newName = prompt("Edit task:", tasks[index].name);

  if (newName !== null && newName.trim() !== "") {
    tasks[index].name = newName.trim();
    saveTasks();
    showTasks();
  }
}

// Delete task
function deleteTask(index) {
  if (confirm("Delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
    showTasks();
  }
}

// Run when page opens
showTasks();
