// app.js

const state = {
    activeDate: new Date().toISOString().split('T')[0],
    data: { intention: '', tasks: [], notes: '', finance: [], mood: '😃 Happy', energy: '80' },
    draggedTask: null
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    renderDateNav();
    loadDateData(state.activeDate);
    
    // Bind global listeners
    document.getElementById('daily-intention').addEventListener('input', debounce(saveIntention, 500));
    document.getElementById('daily-notes').addEventListener('input', debounce(saveNotes, 500));
    document.getElementById('export-btn')?.addEventListener('click', exportBackup);
    
    initStatusPopups();
    loadStreak();
    initSettings();


    
    // Tasks
    document.getElementById('add-root-task-btn').addEventListener('click', () => {
        addTask(state.data.tasks, 'New Task');
        renderTasks();
        saveTasks();
    });
    
    // Finance
    document.getElementById('add-finance-btn').addEventListener('click', () => {
        document.getElementById('finance-form').classList.remove('hidden');
    });
    document.getElementById('cancel-finance-btn').addEventListener('click', () => {
        document.getElementById('finance-form').classList.add('hidden');
        clearFinanceForm();
    });
    document.getElementById('save-finance-btn').addEventListener('click', saveFinanceEntry);
}

// --- Date Navigation ---
function renderDateNav() {
    const nav = document.getElementById('date-nav');
    nav.innerHTML = '';
    const today = new Date();
    
    // Generate past 30 days and couple of future days
    for (let i = 2; i >= -30; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        
        const el = document.createElement('div');
        el.className = `date-item ${iso === state.activeDate ? 'active' : ''}`;
        el.onclick = () => switchDate(iso);
        
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        const num = String(d.getDate()).padStart(2, '0');
        const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
        
        // Quick labels
        let label = dayStr;
        if (i === 0) label = 'Today';
        if (i === -1) label = 'Yesterday';
        if (i < -1) label = `${Math.abs(i)} days ago`;
        if (i === 1) label = 'Tomorrow';
        
        el.innerHTML = `
            <span class="date-label">${label}</span>
            <span class="day-num">${num}</span>
            <span class="date-month">${monthStr}</span>
        `;
        nav.appendChild(el);
    }
}

function switchDate(iso) {
    state.activeDate = iso;
    renderDateNav();
    loadDateData(iso);
}

// --- Storage Logic ---
function loadDateData(iso) {
    const defaultData = { intention: '', tasks: [], notes: '', finance: [], mood: '😃 Happy', energy: '80' };
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([iso], (res) => {
            state.data = res[iso] || defaultData;
            hydrateUI();
        });
    } else {
        const stored = localStorage.getItem(iso);
        state.data = stored ? JSON.parse(stored) : defaultData;
        hydrateUI();
    }
}

function saveToStorage() {
    const obj = {};
    obj[state.activeDate] = state.data;
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(obj);
    } else {
        localStorage.setItem(state.activeDate, JSON.stringify(state.data));
    }
}

// --- Hydration ---
function hydrateUI() {
    document.getElementById('daily-intention').value = state.data.intention || '';
    document.getElementById('daily-notes').value = state.data.notes || '';
    
    const mood = state.data.mood || '😃 Happy';
    const energy = state.data.energy || '80';
    document.getElementById('mood-display').textContent = mood;
    document.getElementById('energy-display-val').textContent = energy + '%';
    document.getElementById('energy-range').value = energy;
    document.getElementById('energy-value-preview').textContent = energy + '%';
    
    renderTasks();
    renderFinance();
}

function saveIntention(e) {
    state.data.intention = e.target.value;
    saveToStorage();
}

function saveNotes(e) {
    state.data.notes = e.target.value;
    saveToStorage();
}

// --- Tasks ---
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function addTask(parentArray, text) {
    parentArray.push({
        id: generateId(),
        text: text,
        completed: false,
        children: []
    });
}

function renderTasks() {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';
    const rootList = createTaskListDOM(state.data.tasks, 0); // layer 0
    container.appendChild(rootList);
}

function createTaskListDOM(tasksArray, depth) {
    const ul = document.createElement('ul');
    ul.className = 'task-list';
    if (tasksArray) {
        tasksArray.forEach((task, index) => {
            ul.appendChild(createTaskDOM(task, tasksArray, index, depth));
        });
    }
    return ul;
}

function createTaskDOM(task, parentArray, index, depth) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    li.setAttribute('draggable', 'true');
    li.dataset.id = task.id;
    
    // HTML5 Drag and Drop events
    li.addEventListener('dragstart', (e) => {
        state.draggedTask = { task, parentArray, index };
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => li.style.opacity = '0.5', 0);
        e.stopPropagation();
    });
    
    li.addEventListener('dragend', (e) => {
        li.style.opacity = '1';
        state.draggedTask = null;
        e.stopPropagation();
    });
    
    li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        e.stopPropagation();
    });
    
    li.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!state.draggedTask) return;
        
        // Remove from old parent
        state.draggedTask.parentArray.splice(state.draggedTask.index, 1);
        
        // Insert into new parent
        parentArray.splice(index, 0, state.draggedTask.task);
        
        state.draggedTask = null;
        saveTasks();
        renderTasks();
    });
    
    const row = document.createElement('div');
    row.className = 'task-row';
    
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.innerHTML = '⋮⋮';
    
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = task.completed;
    cb.onchange = () => {
        task.completed = cb.checked;
        saveTasks();
        renderTasks();
    };
    
    const input = document.createElement('span');
    input.setAttribute('contenteditable', 'true');
    input.className = 'task-text';
    input.textContent = task.text;
    input.oninput = debounce((e) => {
        task.text = e.target.textContent;
        saveTasks();
    }, 300);
    
    // Prevent Enter key from creating new lines (optional, but keep it for task behavior)
    // If you WANT internal enters, remove this listener.
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            input.blur();
        }
    };
    
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    if (depth < 2) { // Restrict to 3 layers (0, 1, 2)
        const addSubBtn = document.createElement('button');
        addSubBtn.className = 'task-btn';
        addSubBtn.textContent = '+';
        addSubBtn.onclick = () => {
            if (!task.children) task.children = [];
            addTask(task.children, '');
            saveTasks();
            renderTasks();
        };
        actions.appendChild(addSubBtn);
    }
    
    const delBtn = document.createElement('button');
    delBtn.className = 'task-btn';
    delBtn.textContent = '×';
    delBtn.onclick = () => {
        parentArray.splice(index, 1);
        saveTasks();
        renderTasks();
    };
    actions.appendChild(delBtn);
    
    row.appendChild(handle);
    row.appendChild(cb);
    row.appendChild(input);
    row.appendChild(actions);
    
    li.appendChild(row);
    
    if (task.children && task.children.length > 0) {
        li.appendChild(createTaskListDOM(task.children, depth + 1));
    }
    return li;
}

function saveTasks() {
    saveToStorage();
}

// --- Finance ---
function renderFinance() {
    const list = document.getElementById('finance-list');
    list.innerHTML = '';
    let total = 0;
    
    const data = state.data.finance || [];
    
    data.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `finance-item ${item.type}`;
        
        let amountStr = parseFloat(item.amount).toFixed(2);
        if (item.type === 'expense') {
            total -= parseFloat(item.amount);
            amountStr = '-$' + amountStr;
        } else {
            total += parseFloat(item.amount);
            amountStr = '+$' + amountStr;
        }
        
        const spanDesc = document.createElement('span');
        spanDesc.textContent = item.desc;
        
        const actionsDiv = document.createElement('div');
        
        const spanAmount = document.createElement('span');
        spanAmount.className = 'amount';
        spanAmount.textContent = amountStr;
        
        const delBtn = document.createElement('button');
        delBtn.className = 'del-btn';
        delBtn.textContent = '×';
        delBtn.addEventListener('click', () => deleteFinance(index));
        
        actionsDiv.appendChild(spanAmount);
        actionsDiv.appendChild(delBtn);
        
        div.appendChild(spanDesc);
        div.appendChild(actionsDiv);
        
        list.appendChild(div);
    });
    
    document.getElementById('finance-total').textContent = `$${total.toFixed(2)}`;
}

function saveFinanceEntry() {
    const type = document.getElementById('finance-type').value;
    const desc = document.getElementById('finance-desc').value;
    const amount = document.getElementById('finance-amount').value;
    
    if (!desc || !amount) return;
    
    if (!state.data.finance) state.data.finance = [];
    state.data.finance.push({
        id: generateId(),
        type, desc, amount: parseFloat(amount)
    });
    
    saveToStorage();
    renderFinance();
    document.getElementById('finance-form').classList.add('hidden');
    clearFinanceForm();
}

function deleteFinance(index) {
    state.data.finance.splice(index, 1);
    saveToStorage();
    renderFinance();
}

function clearFinanceForm() {
    document.getElementById('finance-desc').value = '';
    document.getElementById('finance-amount').value = '';
}

// --- Utils ---
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function exportBackup() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(null, (items) => {
            downloadJSON(items, 'onedash_backup.json');
        });
    } else {
        const items = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try { items[key] = JSON.parse(localStorage.getItem(key)); } catch(e){}
        }
        downloadJSON(items, 'onedash_backup.json');
    }
}

function downloadJSON(data, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

// --- Status Popups ---
function initStatusPopups() {
    const moodDisplay = document.getElementById('mood-display');
    const moodPopup = document.getElementById('mood-popup');
    const energyDisplay = document.getElementById('energy-display');
    const energyPopup = document.getElementById('energy-popup');
    const energyRange = document.getElementById('energy-range');
    const energyPreview = document.getElementById('energy-value-preview');

    moodDisplay.addEventListener('click', (e) => {
        moodPopup.classList.toggle('hidden');
        energyPopup.classList.add('hidden');
        e.stopPropagation();
    });
    
    energyDisplay.addEventListener('click', (e) => {
        energyPopup.classList.toggle('hidden');
        moodPopup.classList.add('hidden');
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        moodPopup.classList.add('hidden');
        energyPopup.classList.add('hidden');
    });

    moodPopup.addEventListener('click', (e) => e.stopPropagation());
    energyPopup.addEventListener('click', (e) => e.stopPropagation());

    document.querySelectorAll('.mood-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const selectedMood = e.target.getAttribute('data-mood');
            state.data.mood = selectedMood;
            document.getElementById('mood-display').textContent = selectedMood;
            moodPopup.classList.add('hidden');
            saveToStorage();
        });
    });

    energyRange.addEventListener('input', (e) => {
        energyPreview.textContent = e.target.value + '%';
    });
    
    energyRange.addEventListener('change', (e) => {
        state.data.energy = e.target.value;
        document.getElementById('energy-display-val').textContent = e.target.value + '%';
        saveToStorage();
    });
}

// --- Streak Logic ---
function loadStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const getStreakMsg = (streak) => {
        if (streak <= 0) return "Ready to start?";
        if (streak <= 3) return "Great start!";
        if (streak <= 7) return "You're on fire! 🔥";
        if (streak <= 30) return "Unstoppable! 🚀";
        return "Legendary momentum! 👑";
    };

    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['streakInfo'], (res) => {
            let info = res.streakInfo || { currentStreak: 0, lastActiveDate: null };
            
            if (info.lastActiveDate !== today) {
                if (info.lastActiveDate === yesterdayStr) {
                    info.currentStreak += 1;
                } else {
                    info.currentStreak = 1;
                }
                info.lastActiveDate = today;
                chrome.storage.local.set({ streakInfo: info });
            }
            
            document.getElementById('streak-val').textContent = `${info.currentStreak} Day${info.currentStreak === 1 ? '' : 's'}`;
            document.getElementById('streak-msg').textContent = getStreakMsg(info.currentStreak);
        });
    } else {
        let infoStr = localStorage.getItem('streakInfo');
        let info = infoStr ? JSON.parse(infoStr) : { currentStreak: 0, lastActiveDate: null };
        if (info.lastActiveDate !== today) {
            if (info.lastActiveDate === yesterdayStr) {
                info.currentStreak += 1;
            } else {
                info.currentStreak = 1;
            }
            info.lastActiveDate = today;
            localStorage.setItem('streakInfo', JSON.stringify(info));
        }
        document.getElementById('streak-val').textContent = `${info.currentStreak} Day${info.currentStreak === 1 ? '' : 's'}`;
        document.getElementById('streak-msg').textContent = getStreakMsg(info.currentStreak);
    }
}

// --- Settings Logic ---
function applyConfig(config) {
    if (config.theme === 'dark' || (config.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    document.documentElement.setAttribute('data-font', config.font);
    document.documentElement.setAttribute('data-palette', config.palette);
    
    // Sync UI controls if they exist (for cross-tab updates)
    const tSelect = document.getElementById('config-theme');
    const pSelect = document.getElementById('config-palette');
    const fSelect = document.getElementById('config-font');
    if (tSelect) tSelect.value = config.theme;
    if (pSelect) pSelect.value = config.palette;
    if (fSelect) fSelect.value = config.font;
}

function initSettings() {
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeBtn = document.getElementById('close-settings');
    
    const themeSelect = document.getElementById('config-theme');
    const paletteSelect = document.getElementById('config-palette');
    const fontSelect = document.getElementById('config-font');
    
    let savedConfig = { theme: 'system', font: 'system', palette: 'default' };
    try {
        const stored = localStorage.getItem('appConfig');
        if (stored) savedConfig = JSON.parse(stored);
    } catch(e) {}
    
    // Initial apply
    applyConfig(savedConfig);

    const handleUiChange = () => {
        const config = {
            theme: themeSelect.value,
            palette: paletteSelect.value,
            font: fontSelect.value
        };
        localStorage.setItem('appConfig', JSON.stringify(config));
        applyConfig(config);
    };

    themeSelect.addEventListener('change', handleUiChange);
    paletteSelect.addEventListener('change', handleUiChange);
    fontSelect.addEventListener('change', handleUiChange);

    // Cross-tab sync listener
    window.addEventListener('storage', (e) => {
        if (e.key === 'appConfig') {
            try {
                const newConfig = JSON.parse(e.newValue);
                applyConfig(newConfig);
            } catch(err) {}
        }
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (themeSelect.value === 'system') {
            const config = {
                theme: themeSelect.value,
                palette: paletteSelect.value,
                font: fontSelect.value
            };
            applyConfig(config);
        }
    });
}



