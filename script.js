document.addEventListener('DOMContentLoaded', () => {
    console.log('TODO App loaded');
    initTaskForm();
});

const tasks = [];

function isValidTaskText(rawInput) {
    return typeof rawInput === 'string' && rawInput.trim().length > 0;
}

function addTask(rawInput) {
    if (!isValidTaskText(rawInput)) {
        return { success: false };
    }
    tasks.push(rawInput.trim());
    return { success: true };
}

function showTaskError(errorElement) {
    errorElement.hidden = false;
}

function hideTaskError(errorElement) {
    errorElement.hidden = true;
}

function renderTaskList(listElement) {
    listElement.textContent = '';
    tasks.forEach((taskText) => {
        const item = document.createElement('li');
        item.textContent = taskText;
        listElement.appendChild(item);
    });
}

function initTaskForm() {
    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const errorElement = document.getElementById('task-error');
    const list = document.getElementById('task-list');

    if (!form || !input || !errorElement || !list) {
        return;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const result = addTask(input.value);
        if (result.success) {
            hideTaskError(errorElement);
            renderTaskList(list);
            input.value = '';
        } else {
            showTaskError(errorElement);
        }
    });
}
