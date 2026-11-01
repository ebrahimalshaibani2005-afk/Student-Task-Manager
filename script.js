
// Student Task Manager

let tasks = [];
let currentFilter = "all";

// Load saved tasks
try {
    let saved = localStorage.getItem("tasks");

    if (saved) {
        tasks = JSON.parse(saved);
    }

    if (!Array.isArray(tasks)) {
        tasks = [];
    }
} catch (error) {
    tasks = [];
}

// Save tasks
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add Task
function addTask() {
    let name = document.getElementById("taskInput").value.trim();
    let priority = document.getElementById("priority").value;
    let deadline = document.getElementById("deadline").value;
    let error = document.getElementById("error");

    if (name.length < 3) {
        error.innerText = "Please enter at least 3 characters.";
        return;
    }

    error.innerText = "";

    tasks.push({
        name: name,
        priority: priority,
        deadline: deadline,
        done: false
    });

    document.getElementById("taskInput").value = "";
    document.getElementById("deadline").value = "";

    saveTasks();
    showTasks();
}

// Complete Task
function completeTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
    showTasks();
}

// Delete Task
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    showTasks();
}

// Edit Task
function editTask(index) {
    let name = prompt("Edit task:", tasks[index].name);

    if (name === null) {
        return;
    }

    if (name.trim().length < 3) {
        alert("Please enter at least 3 characters.");
        return;
    }

    tasks[index].name = name.trim();

    saveTasks();
    showTasks();
}

// Filter Tasks
function filterTasks(type) {
    currentFilter = type;
    showTasks();
}

// Dark Mode
function darkMode() {
    document.body.classList.toggle("dark");
}

// Display Tasks
function showTasks() {
    let list = document.getElementById("taskList");
    let search = document.getElementById("search").value.toLowerCase();

    list.innerHTML = "";
    let visible = 0;

    tasks.forEach(function(task, index) {
        if (!task.name.toLowerCase().includes(search)) {
            return;
        }

        if (currentFilter === "completed" && !task.done) {
            return;
        }

        if (currentFilter === "pending" && task.done) {
            return;
        }

        visible++;

        let li = document.createElement("li");

        if (task.done) {
            li.className = "finished";
        }

        // Task name
        let label = document.createElement("span");
        label.className = "task-label";
        label.textContent = task.name;
        li.appendChild(label);

        // Priority and deadline
        let extra = document.createElement("small");
        extra.textContent = task.priority;

        if (task.deadline) {
            extra.textContent += " - Due: " + task.deadline;
        }

        li.appendChild(extra);

        // Buttons
        let actions = document.createElement("div");
        actions.className = "actions";

        let complete = document.createElement("button");
        complete.textContent = task.done ? "Undo" : "Complete";
        complete.onclick = function() {
            completeTask(index);
        };

        let edit = document.createElement("button");
        edit.textContent = "Edit";
        edit.onclick = function() {
            editTask(index);
        };

        let remove = document.createElement("button");
        remove.textContent = "Delete";
        remove.onclick = function() {
            deleteTask(index);
        };

        actions.appendChild(complete);
        actions.appendChild(edit);
        actions.appendChild(remove);

        li.appendChild(actions);
        list.appendChild(li);
    });

    // Empty message
    document.getElementById("emptyMessage").style.display =
        visible === 0 ? "block" : "none";

    // Statistics
    let completed = tasks.filter(function(task) {
        return task.done;
    }).length;

    document.getElementById("totalCount").innerText = tasks.length;
    document.getElementById("completedCount").innerText = completed;
    document.getElementById("pendingCount").innerText =
        tasks.length - completed;

    // Progress Percentage
    let percent = 0;

    if (tasks.length > 0) {
        percent = Math.round(completed * 100 / tasks.length);
    }

    document.getElementById("progressText").innerText =
        percent + "%";

    document.getElementById("progressBar").style.width =
        percent + "%";

    // Today's Tasks
    let today = new Date();

    let todayText =
        today.getFullYear() + "-" +
        String(today.getMonth() + 1).padStart(2, "0") + "-" +
        String(today.getDate()).padStart(2, "0");

    let todayList = document.getElementById("todayList");
    todayList.innerHTML = "";

    tasks.forEach(function(task) {
        if (task.deadline === todayText && !task.done) {
            let item = document.createElement("li");
            item.textContent = task.name;
            todayList.appendChild(item);
        }
    });

    if (todayList.children.length === 0) {
        let item = document.createElement("li");
        item.textContent = "No tasks due today";
        todayList.appendChild(item);
    }
}

// Start the application
showTasks();
