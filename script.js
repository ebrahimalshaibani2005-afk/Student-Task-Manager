// ===== Student 1 =====
let tasks = [];

function addTask() {
    console.log("Add button clicked");
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



































    
