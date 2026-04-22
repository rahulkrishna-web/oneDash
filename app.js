// app.js

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    updateDateNavigation();
    updateGreeting();
    loadQuotes();
    initTopSites();
    initJournal();
    updateProgressBar();
    loadStreak();
    initExportBackup();
    
    // Update time-dependent UI every minute
    setInterval(() => {
        updateProgressBar();
        updateTime();
    }, 60000);
}

function updateDateNavigation() {
    const today = new Date();
    const dateNav = document.getElementById('date-nav');
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    dateNav.innerHTML = '';
    
    for (let i = -2; i <= 2; i++) {
        const itemDate = new Date(today);
        itemDate.setDate(today.getDate() + i);
        
        const dayName = days[itemDate.getDay()];
        const dayNum = String(itemDate.getDate()).padStart(2, '0');
        const monthName = months[itemDate.getMonth()];
        
        const el = document.createElement('div');
        el.className = `date-item ${i === 0 ? 'active' : ''}`;
        
        // Add label 
        let label = dayName;
        if (i === 0) label = 'Today';
        else if (i === -1) label = 'Yesterday';
        else if (i === -2) label = '2 days ago';
        else if (i === 1) label = 'Tomorrow';
        else if (i === 2) label = 'In 2 days';
        
        el.innerHTML = `
            <span class="date-label">${label}</span>
            <span class="day-num">${dayNum}</span>
            <span class="date-month">${monthName}</span>
        `;
        
        dateNav.appendChild(el);
    }
}

function updateGreeting() {
    const title = document.getElementById('greeting-title');
    const hour = new Date().getHours();
    
    let timeOfDay = "Morning";
    if (hour >= 12 && hour < 17) timeOfDay = "Afternoon";
    else if (hour >= 17) timeOfDay = "Evening";
    
    // Update time top right pill if we added one, else just the greeting
    const timeStr = formatAMPM(new Date());
    
    title.innerHTML = `
        <span class="greeting-text">Good ${timeOfDay}, Developer</span>
        <span class="time-text">${timeStr}</span>
    `;
}

function updateTime() {
    const timeEl = document.querySelector('.time-text');
    if (timeEl) {
        timeEl.textContent = formatAMPM(new Date());
    }
}

function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return hours + ':' + minutes + ' ' + ampm;
}

async function loadQuotes() {
    try {
        const res = await fetch('quotes.json');
        const quotes = await res.json();
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        
        const quoteEl = document.getElementById('greeting-quote');
        quoteEl.innerHTML = `${randomQuote.text} <span class="author">— ${randomQuote.author}</span>`;
    } catch (e) {
        console.error("Failed to load quotes", e);
        // Fallback
        document.getElementById('greeting-quote').innerHTML = `Waking up with intention sets the tone for a beautiful day ahead.`;
    }
}

function initTopSites() {
    const topSitesContainer = document.getElementById('top-sites');
    if (typeof chrome !== 'undefined' && chrome.topSites) {
        chrome.topSites.get((sites) => {
            topSitesContainer.innerHTML = '';
            // Show up to 4 top sites
            const displaySites = sites.slice(0, 4);
            
            displaySites.forEach(site => {
                const card = document.createElement('a');
                card.className = 'polaroid';
                card.href = site.url;
                
                // Get base domain for favicon
                const urlObj = new URL(site.url);
                // Use a reliable favicon service
                const faviconUrl = `https://www.google.com/s2/favicons?domain=${urlObj.hostname}&sz=128`;
                
                card.innerHTML = `
                    <img src="${faviconUrl}" alt="${site.title}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'64\\' height=\\'64\\'><rect width=\\'64\\' height=\\'64\\' fill=\\'%23f1f5f9\\'/></svg>'"/>
                    <span></span>
                `;
                topSitesContainer.appendChild(card);
            });
            // If less than 4 sites, fill with placeholders to keep grid nice
            for (let i = displaySites.length; i < 4; i++) {
                const placeholder = document.createElement('div');
                placeholder.className = 'polaroid';
                placeholder.innerHTML = `
                    <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' fill='%23f1f5f9'/></svg>" />
                    <span></span>
                `;
                topSitesContainer.appendChild(placeholder);
            }
        });
    } else {
        // Fallback for non-extension environment
        // Render dummy polaroids
        topSitesContainer.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            const card = document.createElement('div');
            card.className = 'polaroid';
            card.innerHTML = `
                <img src="https://ui-avatars.com/api/?name=Top+Site&background=random" />
                <span></span>
            `;
            topSitesContainer.appendChild(card);
        }
    }
}

function initJournal() {
    const textArea = document.querySelector('.journal-input');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        // Load existing content
        chrome.storage.local.get(['daily_focus'], (result) => {
            if (result.daily_focus) {
                textArea.value = result.daily_focus;
            }
        });
        
        // Save on input
        textArea.addEventListener('input', (e) => {
            chrome.storage.local.set({ 'daily_focus': e.target.value });
        });
    } else {
        textArea.value = localStorage.getItem('daily_focus') || '';
        textArea.addEventListener('input', (e) => {
            localStorage.setItem('daily_focus', e.target.value);
        });
    }
}

function updateProgressBar() {
    const progressEl = document.getElementById('daily-progress');
    const now = new Date();
    // Assuming workday from 9 AM to 5 PM
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
    
    let progress = 0;
    
    if (now > endOfDay) {
        progress = 100;
    } else if (now > startOfDay) {
        const totalMs = endOfDay - startOfDay;
        const elapsedMs = now - startOfDay;
        progress = (elapsedMs / totalMs) * 100;
    }
    
    progressEl.style.height = `${progress}%`;
}

function loadStreak() {
    // A simple mock streak counter logic that could be expanded
    const streakTitle = document.getElementById('streak-title');
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['last_active_date', 'current_streak'], (result) => {
            const todayStr = new Date().toDateString();
            let streak = result.current_streak || 1;
            
            if (result.last_active_date !== todayStr) {
                // If it wasn't yesterday, it breaks (simplified)
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                if (result.last_active_date === yesterday.toDateString()) {
                    streak++;
                } else {
                    streak = 1;
                }
                
                chrome.storage.local.set({
                    'last_active_date': todayStr,
                    'current_streak': streak
                });
            }
            streakTitle.textContent = `${streak} Day Streak`;
        });
    } else {
        // Fallback
        streakTitle.textContent = `3 Day Streak`;
    }
}

function initExportBackup() {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(null, (items) => {
                downloadJSON(items, 'onedash_backup.json');
            });
        } else {
            // Fallback for non-extension environment
            const items = { daily_focus: localStorage.getItem('daily_focus') || '' };
            downloadJSON(items, 'onedash_backup.json');
        }
    });
}

function downloadJSON(data, filename) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
