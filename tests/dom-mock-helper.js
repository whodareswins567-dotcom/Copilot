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

// ---------------------------------------------------------------------------
// localStorage mock helpers
// ---------------------------------------------------------------------------

// makeFreshLocalStorage returns a new self-contained localStorage mock.
// Each call creates its own isolated store — there is NO shared state between
// instances.  loadTaskApp() uses this by default so tests cannot bleed into
// each other.
function makeFreshLocalStorage() {
    let store = {};
    return {
        getItem(key) {
            return Object.prototype.hasOwnProperty.call(store, key)
                ? store[key] : null;
        },
        setItem(key, value) { store[key] = String(value); },
        removeItem(key)     { delete store[key]; },
        clear()             { store = {}; },
    };
}

// mockLocalStorage is a shared instance backed by the module-level _store.
// Use it when a test needs to PRE-SEED data before calling loadTaskApp:
//   clearMockStorage();
//   mockLocalStorage.setItem('todos', JSON.stringify([...]));
//   const app = loadTaskApp({ localStorage: mockLocalStorage });
// Always call clearMockStorage() before each such test to avoid leakage.
let _store = {};

const mockLocalStorage = {
    getItem(key) {
        return Object.prototype.hasOwnProperty.call(_store, key)
            ? _store[key] : null;
    },
    setItem(key, value) { _store[key] = String(value); },
    removeItem(key)     { delete _store[key]; },
    clear()             { _store = {}; },
};

// Reset the shared _store to {}.  Call before any test that uses mockLocalStorage.
function clearMockStorage() { _store = {}; }

// Returns a fresh localStorage-shaped object whose setItem always throws
// QuotaExceededError.  Pass to loadTaskApp({ localStorage: ... }) to simulate
// a full storage quota.  The base store is isolated — getItem returns null
// unless the caller explicitly calls setItem (which throws) or uses the
// returned object's removeItem/clear directly.
function makeQuotaExceededStorage() {
    const base = makeFreshLocalStorage();
    return Object.assign({}, base, {
        setItem() {
            const err = new Error('QuotaExceededError');
            err.name = 'QuotaExceededError';
            throw err;
        },
    });
}

// ---------------------------------------------------------------------------
// App harness
// ---------------------------------------------------------------------------

// Creates a mock document with the #task-form / #task-input / #task-error /
// #task-list elements script.js expects, and loads script.js against it inside
// a vm sandbox.
//
// By default, each call receives its OWN fresh localStorage instance so tests
// cannot share state accidentally.  Pass an overrides object to substitute any
// sandbox global — for example:
//   loadTaskApp({ localStorage: mockLocalStorage })   — use the shared store
//   loadTaskApp({ localStorage: undefined })          — simulate unavailability
//   loadTaskApp({ localStorage: makeQuotaExceededStorage() })
//
// Returns { sandbox, elements, localStorage } where `localStorage` is the
// instance that was injected into the sandbox.
function loadTaskApp(overrides) {
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

    // localStorage is injected as a bare global (not nested under window) because
    // script.js accesses it as `localStorage`, not `window.localStorage`.
    const sandbox = Object.assign(
        {
            document: mockDocument,
            console,
            window: {},
            localStorage: makeFreshLocalStorage(),
        },
        overrides || {}
    );
    vm.createContext(sandbox);
    vm.runInContext(scriptSrc, sandbox, { filename: 'script.js' });
    (domListeners['DOMContentLoaded'] || []).forEach((handler) => handler());

    return { sandbox, elements, localStorage: sandbox.localStorage };
}

function submitForm(elements, value) {
    elements['task-input'].value = value;
    let defaultPrevented = false;
    elements['task-form'].dispatch('submit', {
        preventDefault: () => { defaultPrevented = true; },
    });
    return { defaultPrevented };
}

module.exports = {
    loadTaskApp,
    submitForm,
    makeFreshLocalStorage,
    clearMockStorage,
    makeQuotaExceededStorage,
    mockLocalStorage,
};
