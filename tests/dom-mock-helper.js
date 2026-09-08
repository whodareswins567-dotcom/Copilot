const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptSrc = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function createElement(tag) {
    const el = {
        tagName: tag,
        listeners: {},
        children: [],
        hidden: false,
        value: '',
    };
    let textContentValue = '';
    Object.defineProperty(el, 'textContent', {
        get() { return textContentValue; },
        set(value) {
            textContentValue = value;
            el.children = [];
        },
    });
    el.addEventListener = (event, handler) => {
        el.listeners[event] = el.listeners[event] || [];
        el.listeners[event].push(handler);
    };
    el.appendChild = (child) => {
        el.children.push(child);
    };
    el.dispatch = (event, eventObj) => {
        (el.listeners[event] || []).forEach((handler) => handler(eventObj));
    };
    return el;
}

// Creates a mock document with the #task-form / #task-input / #task-error / #task-list
// elements script.js expects, and loads script.js against it inside a vm sandbox.
function loadTaskApp() {
    const elements = {
        'task-form': createElement('form'),
        'task-input': createElement('input'),
        'task-error': createElement('p'),
        'task-list': createElement('ul'),
    };
    elements['task-error'].hidden = true;

    const domListeners = {};
    const mockDocument = {
        addEventListener(event, handler) {
            domListeners[event] = domListeners[event] || [];
            domListeners[event].push(handler);
        },
        getElementById(id) {
            return elements[id] || null;
        },
        createElement(tag) {
            return createElement(tag);
        },
    };

    const sandbox = { document: mockDocument, console, window: {} };
    vm.createContext(sandbox);
    vm.runInContext(scriptSrc, sandbox, { filename: 'script.js' });
    (domListeners['DOMContentLoaded'] || []).forEach((handler) => handler());

    return { sandbox, elements };
}

function submitForm(elements, value) {
    elements['task-input'].value = value;
    let defaultPrevented = false;
    elements['task-form'].dispatch('submit', {
        preventDefault: () => { defaultPrevented = true; },
    });
    return { defaultPrevented };
}

module.exports = { loadTaskApp, submitForm };
