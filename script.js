
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
