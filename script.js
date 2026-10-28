
function deleteTask(button) {
    button.parentElement.remove();
}

<!DOCTYPE html>
<html>
<head>
    <title>Task Manager</title>
</head>
<body>

    <h2>My Tasks</h2>

    <ul>
        <li>
            Study HTML
            <button onclick="deleteTask(this)">
                Delete
            </button>
        </li>

        <li>
            Study JavaScript
            <button onclick="deleteTask(this)">
                Delete
            </button>
        </li>
    </ul>

    <script src="script.js"></script>

</body>
</html>

function completeTask(button) {
    let task = button.parentElement;
    task.style.textDecoration = "line-through";
}
<li>
    Study HTML
    <button onclick="completeTask(this)">Complete</button>
    <button onclick="deleteTask(this)">Delete</button>
</li>

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
<h3>Completed Tasks: <span id="counter">0</span></h3>
<button onclick="completeTask(this)">Complete</button>


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




































    
