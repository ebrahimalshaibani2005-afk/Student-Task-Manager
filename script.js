
let tasks = [];
let filter = "all";

// Load saved tasks
let saved = localStorage.getItem("tasks");

if (saved) {
    tasks = JSON.parse(saved);
}

// Save tasks
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add task
function addTask() {
    let name = document.getElementById("taskInput").value.trim();
    let priority = document.getElementById("priority").value;
    let deadline = document.getElementById("deadline").value;

    if (name == "") {
        document.getElementById("error").innerText =
            "Please enter a task";
        return;
    }

    let task = {
        name: name,
        priority: priority,
        deadline: deadline,
        done: false
    };

    tasks.push(task);

    document.getElementById("taskInput").value = "";
    document.getElementById("deadline").value = "";
    document.getElementById("error").innerText = "";

    saveTasks();
    showTasks();
}

// Show tasks
function showTasks() {
    let list = document.getElementById("taskList");
    let search = document.getElementById("search").value.toLowerCase();

    list.innerHTML = "";

    tasks.forEach(function(task, index) {
        if (!task.name.toLowerCase().includes(search)) {
            return;
        }

        if (filter == "completed" && !task.done) {
            return;
        }

        if (filter == "pending" && task.done) {
            return;
        }

        let li = document.createElement("li");

        let text = document.createElement("span");
        text.innerText = task.name + " (" + task.priority + ")";

        if (task.deadline != "") {
            text.innerText += " - " + task.deadline;
        }

        if (task.done) {
            text.style.textDecoration = "line-through";
        }

        li.appendChild(text);

        let complete = document.createElement("button");
        complete.innerText = task.done ? "Undo" : "Complete";
        complete.onclick = function() {
            completeTask(index);
        };
        li.appendChild(complete);

        let edit = document.createElement("button");
        edit.innerText = "Edit";
        edit.onclick = function() {
            editTask(index);
        };
        li.appendChild(edit);

        let del = document.createElement("button");
        del.innerText = "Delete";
        del.onclick = function() {
            deleteTask(index);
        };
        li.appendChild(del);

        list.appendChild(li);
    });

    document.getElementById("total").innerText = tasks.length;

    let count = 0;
    tasks.forEach(function(task) {
        if (task.done) {
            count++;
        }
    });

    document.getElementById("completed").innerText = count;
}

// Complete task
function completeTask(index) {
    tasks[index].done = !tasks[index].done;
    saveTasks();
    showTasks();
}

// Delete task
function deleteTask(index) {
    tasks.splice(index, 1);
    saveTasks();
    showTasks();
}

// Edit task
function editTask(index) {
    let name = prompt("Edit task:", tasks[index].name);

    if (name != null && name.trim() != "") {
        tasks[index].name = name.trim();
        saveTasks();
        showTasks();
    }
}

// Filter tasks
function filterTasks(type) {
    filter = type;
    showTasks();
}

// Dark mode
function darkMode() {
    document.body.classList.toggle("dark");
}

// Show saved tasks
showTasks();
