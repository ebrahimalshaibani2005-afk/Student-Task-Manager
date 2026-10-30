// ===== Student 1 =====
let tasks = [];

function displayTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(function (task) {
        const li = document.createElement("li");
        li.dataset.id = task.id;

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text;
        if (task.deadline) {
            span.textContent += " (Due: " + task.deadline + ")";
        }
        li.appendChild(span);

        list.appendChild(li);
    });
}
    input.value = "";
    displayTasks();
}
}

// ===== Student 2 =====
function deleteTask(button) {
    button.parentElement.remove();
}

let completedTasks = 0;

function completeTask(button) {
    let task = button.parentElement;

    if (task.style.textDecoration !== "line-through") {
        task.style.textDecoration = "line-through";
        completedTasks++;

        document.getElementById("counter").innerText =
            completedTasks;
    }
}

function getDeadline() {
    let deadline = document.getElementById("deadline").value;

    return deadline;
}

function searchTasks() {
    let search = document.getElementById("searchInput").value.toLowerCase();

    let tasks = document.querySelectorAll("#taskList li");

    tasks.forEach(function(task) {
        let text = task.textContent.toLowerCase();

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



































    
