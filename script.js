//Student 1// 
let tasks = [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
    }
}

function addTask() {
    const input = document.getElementById("taskInput");
    const priority = document.getElementById("priority").value;
    const deadline = getDeadline();
    const errorMsg = document.getElementById("errorMsg");
    const text = input.value.trim();

   
    if (text === "") {
        errorMsg.textContent = "Please enter a task.";
        return;
    }
    if (text.length < 3) {
        errorMsg.textContent = "Task must be at least 3 characters.";
        return;
    }
    const exists = tasks.some(function (t) {
        return t.text.toLowerCase() === text.toLowerCase();
    });
    if (exists) {
        errorMsg.textContent = "This task already exists.";
        return;
    }
    errorMsg.textContent = "";

    tasks.push({
        id: Date.now(),
        text: text,
        priority: priority,
        deadline: deadline,
        completed: false
    });

    saveTasks();
    displayTasks();
    input.value = "";
}

function displayTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    let completedCount = 0;

    tasks.forEach(function (task) {
        const li = document.createElement("li");
        li.dataset.id = task.id;
        li.classList.add(task.priority.toLowerCase());

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text + " [" + task.priority + "]";
        if (task.deadline) {
            span.textContent += " (Due: " + task.deadline + ")";
        }
        li.appendChild(span);

        if (task.completed) {
            li.style.textDecoration = "line-through";
            completedCount++;
        }

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = function () {
            editTask(task.id);
        };

        const completeBtn = document.createElement("button");
        completeBtn.textContent = "Complete";
        completeBtn.onclick = function () {
            completeTask(completeBtn);
        };

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.onclick = function () {
            deleteTask(deleteBtn);
        };

        li.appendChild(editBtn);
        li.appendChild(completeBtn);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });

    document.getElementById("totalCount").textContent = tasks.length;
    document.getElementById("counter").textContent = completedCount;
}

function editTask(id) {
    const task = tasks.find(function (t) {
        return t.id === id;
    });
    const newText = prompt("Edit your task:", task.text);

    if (newText === null) return;
    if (newText.trim() === "") {
        alert("Task cannot be empty.");
        return;
    }

    task.text = newText.trim();
    saveTasks();
    displayTasks();
}


//Student 2//


function deleteTask(button) {
    const id = Number(button.parentElement.dataset.id);
    tasks = tasks.filter(function (t) {
        return t.id !== id;
    });
    saveTasks();
    displayTasks();
}

function completeTask(button) {
    const id = Number(button.parentElement.dataset.id);
    const task = tasks.find(function (t) {
        return t.id === id;
    });
    task.completed = true;
    saveTasks();
    displayTasks();
}

function getDeadline() {
    let deadline = document.getElementById("deadline").value;

    return deadline;
}

function searchTasks() {
    let search = document.getElementById("searchInput").value.toLowerCase();

    let tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(function(task) {
       
        let text = task.querySelector(".task-text").textContent.toLowerCase();

        if (text.includes(search)) {
            task.style.display = "list-item";
        } else {
            task.style.display = "none";
        }
    });
}

function filterTasks(status) {
    let tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(function(task) {
        let completed =
            task.style.textDecoration === "line-through";

        if (status === "all" ||
            (status === "completed" && completed) ||
            (status === "pending" && !completed)) {

            task.style.display = "list-item";
        } else {
            task.style.display = "none";
        }
    });
}


loadTasks();
displayTasks();



































    
