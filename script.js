//Student 1//
let tasks = [];
function addTask() {
    const input = document.getElementById("taskInput");
    const priority = document.getElementById("priority").value;
    const deadline = getDeadline();
        const priority = document.getElementById("priority").value;

    tasks.push({
        id: Date.now(),
        text: input.value,
        priority: priority,
        deadline: deadline,
        completed: false
    });

    input.value = "";
    displayTasks();
}

function displayTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    tasks.forEach(function (task) {
        const li = document.createElement("li");
        li.dataset.id = task.id;
                li.classList.add(task.priority.toLowerCase());

        const span = document.createElement("span");
        span.className = "task-text";
         span.textContent = task.text + " [" + task.priority + "]";
        if (task.deadline) {
            span.textContent += " (Due: " + task.deadline + ")";
                document.getElementById("totalCount").textContent = tasks.length;
        }
        li.appendChild(span);
                const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.onclick = function () {
            editTask(task.id);
        };
        li.appendChild(editBtn);

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



































    
