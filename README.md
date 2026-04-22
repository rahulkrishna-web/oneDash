# OneDash

**OneDash** is a minimalist, beautifully crafted Chrome Extension that overrides your default "New Tab" page and transforms it into an elegant daily productivity workspace. Inspired by clean glassy UI and a soft, tactile notebook design, OneDash helps you stay grounded, capturing your daily intentions right where you need them most.

![OneDash Aesthetics (StrongMe Inspired)](https://i.imgur.com/uGzZOPn.png) *(Preview aesthetic)*

## Features

- **Daily Focus Scratchpad**: Replaces the clutter of the standard new tab with a lined-paper styled notebook section. Write down your main intention for the day, and let it persist localy in your browser automatically.
- **Top Sites Polaroid Grid**: Automatically pulls your most frequently visited sites and elegantly renders them as slightly tilted, interactive polaroid cards.
- **Dynamic Greeting & Developer Quotes**: You are greeted according to the time of the day, alongside a fresh snippet of wisdom pulled from a rotating queue of developer-centric quotes.
- **Time Boxing & Daily Progress**: Keep track of the hours ticking across your typical workday (9 AM – 5 PM) with the vertical progress bar.
- **Data Export & Backup**: Everything is stored privately using `chrome.storage.local`. A quick "Export" button generates a `onedash_backup.json` file to back up your thoughts, streaks, and progress.
- **Dark Pattern Free**: No analytics, no distant servers, no tracking. purely Vanilla JS and CSS variables. 

## Installation

As this project is aimed at developer customization, it can be loaded directly as an "Unpacked Extension."

1. **Download the Repository**
   Clone the repo via your terminal:
   ```bash
   git clone https://github.com/your-username/onedash.git
   ```
   *Or just download it as a ZIP and extract it.*

2. **Open Extensions Dashboard**
   Launch Google Chrome and navigate to `chrome://extensions/` 
   (or click the puzzle piece icon -> Manage Extensions).

3. **Enable Developer Mode**
   Toggle the **"Developer mode"** switch located on the top right.

4. **Load the Extension**
   Click the **"Load unpacked"** button on the top left. Select the `onedash` folder you just downloaded.

5. **Voila!**
   Open a New Tab (`Cmd/Ctrl + T`) and enjoy your new aesthetic workspace.

## How to Export & Backup Data

Since all notes are retained solely on your machine, you can export your data at any time:
1. Locate the **Download icon** at the bottom of the left-hand date tracking sidebar.
2. Click the icon, and a file called `onedash_backup.json` will instantly download to your computer containing the exact state of your local storage.

## Customization

The extension is constructed purely out of Vanilla HTML/CSS/JS, leaning heavily on CSS Grid and CSS variables. Customizing the design is completely straightforward:
- Open `style.css` and tweak variables like `--bg-color`, `--accent`, and `--text-main` situated in the `:root` pseudo-class.
- Modify `quotes.json` to insert your team's internal jokes, mantras, or additional wisdom snippets.

Enjoy your productive new space!
