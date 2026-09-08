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
    saveTasks();                                 // FR-01: persist on every add
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

function saveTasks() {
    try {
        localStorage.setItem('todos', JSON.stringify(tasks));
    } catch (_e) {
        // quota-exceeded or SecurityError — silently ignored; in-memory state
        // remains authoritative (NFR-02, NFR-05)
    }
}

function loadTasks() {
    try {
        let raw = localStorage.getItem('todos');
        if (raw === null) { return; }           // FR-06: absent key -> stay []
        let parsed = JSON.parse(raw);           // throws on bad JSON -> catch
        if (!Array.isArray(parsed)) { return; } // H-01: non-array JSON -> stay []
        let filtered = parsed.filter((item) => typeof item === 'string'); // M-03: drop non-string elements
        tasks.length = 0;                       // H-02: const — must NOT reassign
        tasks.push(...filtered);
    } catch (_e) {
        // JSON.parse failure or SecurityError — silently leave tasks as []
        // (FR-07, NFR-01, NFR-06: no console.error)
    }
}

function initTaskForm() {
    loadTasks();                                 // M-01: before DOM guard

    const form = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    const errorElement = document.getElementById('task-error');
    const list = document.getElementById('task-list');

    if (!form || !input || !errorElement || !list) {
        return;
    }

    renderTaskList(list);                        // FR-04: render persisted tasks on load

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
