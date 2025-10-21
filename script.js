// --- WEEK TOGGLE SCRIPT ---
onkeypress = function(e) {
    if (e.key === '1') {
        showWeek('week1');
    } else if (e.key === '2') {
        showWeek('week2');
    }
};

/**
 * NEW: Updated showWeek function with animations
 */
function showWeek(weekId) {
    const animationDuration = 300;
    const newWeek = document.getElementById(weekId);
    if (!newWeek) return;

    const currentWeek = document.querySelector('.week-content:not([style*="display: none"])');
    const slider = document.getElementById('weekSlider');
    
    // Safety check - if slider doesn't exist yet, skip animations
    if (slider) {
        // Add stretch animation
        slider.classList.add('stretching');
        
        setTimeout(() => {
            // Remove stretch and add bounce
            slider.classList.remove('stretching');
            slider.classList.add('bouncing');
            
            // Update slider state
            slider.classList.remove('week1', 'week2');
            slider.classList.add(weekId === 'week1' ? 'week1' : 'week2');
            
            // Update buttons
            const buttons = slider.querySelectorAll('.week-btn');
            buttons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.week === (weekId === 'week1' ? '1' : '2')) {
                    btn.classList.add('active');
                }
            });
            
            setTimeout(() => {
                slider.classList.remove('bouncing');
            }, 600);
        }, 150);
    }

    // Handle the timetable animation (keep your existing logic)
    if (currentWeek && currentWeek.id !== weekId) {
        currentWeek.classList.add('fade-out-down');
        setTimeout(() => {
            currentWeek.style.display = 'none';
            currentWeek.classList.remove('fade-out-down');
            newWeek.style.display = 'block';
            newWeek.classList.add('fade-in-up');
            setTimeout(() => {
                newWeek.classList.remove('fade-in-up');
            }, animationDuration);
        }, animationDuration);
    } else if (!currentWeek) {
        newWeek.style.display = 'block';
    }

    localStorage.setItem('activeWeek', weekId);
    updateLessonHighlight();
}
// --- DYNAMIC HIGHLIGHTING SCRIPT ---

// IMPORTANT: Adjust these times to match your actual school schedule
const lessonSchedule = [
    { name: "Period 1",     start: "09:00", end: "09:45" }, // Row 0
    { name: "Period 2",     start: "09:45", end: "10:30" }, // Row 1
    { name: "Period 3",     start: "10:30", end: "11:15" }, // Row 2
    { name: "Period 4",     start: "11:35", end: "12:20" }, // Row 3
    { name: "Period 5a",    start: "12:20", end: "13:05" }, // Row 4
    { name: "Lunch",        start: "13:05", end: "13:50" }, // Row 5
    { name: "Mincha",       start: "13:50", end: "14:05" }, // Row 6
    { name: "Period 6",     start: "14:05", end: "14:50" }, // Row 7
    { name: "Period 7",     start: "14:50", end: "15:35" }, // Row 8
    { name: "Period 8",     start: "15:35", end: "16:25" }  // Row 9
];

// Direct mapping: schedule index = table row index
const scheduleRowMap = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function updateLessonHighlight() {
    const now = new Date();
    // For testing different times uncomment the line below and change the time:
    // const now = new Date("2024-07-16T10:30:00"); 

    const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Clear previous highlights
    document.querySelectorAll('.highlight-current, .highlight-next').forEach(cell => {
        cell.classList.remove('highlight-current', 'highlight-next');
    });

    let currentPeriod = null;
    let nextPeriod = null;

    // --- Find current and next period for today ---
    if (day >= 1 && day <= 5) { // If it's a weekday (Monday=1 to Friday=5)
        for (let i = 0; i < lessonSchedule.length; i++) {
            const period = lessonSchedule[i];
            // Check for current lesson
            if (currentTime >= period.start && currentTime < period.end) {
                currentPeriod = { day: day, periodIndex: i };
            }
            // Find the very next lesson of the day (if not already found and not currently in a lesson)
            if (currentTime < period.start && !nextPeriod && !currentPeriod) {
                 nextPeriod = { day: day, periodIndex: i };
            }
        }
        // If currentPeriod was found, and there's a next one for *today*, set it.
        if (currentPeriod && currentPeriod.periodIndex < lessonSchedule.length - 1) {
            nextPeriod = { day: day, periodIndex: currentPeriod.periodIndex + 1};
        } else if (currentPeriod && currentPeriod.periodIndex === lessonSchedule.length - 1) {
             // If the current period is the last of the day, next period is the first of the next school day
            let nextDay = (day === 5) ? 1 : day + 1; // If Friday, next is Monday, else next day
            nextPeriod = { day: nextDay, periodIndex: 0 };
        }

    } else { // It's a weekend (Saturday or Sunday), next period is always Monday's first
        nextPeriod = { day: 1, periodIndex: 0 };
    }
    
    // If no next period was found because it's past all periods on a weekday (e.g., after last lesson on Fri), then it's next Monday.
    if (!nextPeriod && day >= 1 && day <=5 && currentTime >= lessonSchedule[lessonSchedule.length -1].end) {
        let nextDay = (day === 5) ? 1 : day + 1;
        nextPeriod = { day: nextDay, periodIndex: 0 };
    } else if (!nextPeriod && (day === 0 || day === 6)) { // If it's Saturday or Sunday
        nextPeriod = { day: 1, periodIndex: 0 };
    }

    // --- Apply the highlight classes ---
    // Only highlight in the currently visible table
    const activeWeekId = localStorage.getItem('activeWeek') || 'week1'; // Get the active week ID
    const activeTable = document.getElementById(activeWeekId)?.querySelector('.timetable');

    if (activeTable) {
        const rows = activeTable.querySelectorAll('tbody tr');
        
        // Highlight CURRENT lesson/break
        if (currentPeriod) {
            const rowIndex = scheduleRowMap[currentPeriod.periodIndex];
            const cell = rows[rowIndex]?.cells[currentPeriod.day];
            if (cell && (cell.classList.contains('lesson') || cell.classList.contains('break'))) {
                cell.classList.add('highlight-current');
            }
        }

        // Highlight NEXT lesson/break
        if (nextPeriod) {
            const rowIndex = scheduleRowMap[nextPeriod.periodIndex];
            const cell = rows[rowIndex]?.cells[nextPeriod.day];
            if (cell && (cell.classList.contains('lesson') || cell.classList.contains('break'))) {
                cell.classList.add('highlight-next');
            }
        }
    }
}


// --- BOOK REQUIREMENTS DATA ---
const subjectBookMap = {
    "Chemistry": ["🟡 Chemistry Notebook"],
    "Mathematics": ["🔵 Maths Notebook"],
    "English": ["🔵 English Notebook", "🟤 An Inspector Calls text"],
    "Modern Hebrew": ["🟠 Mh Pack"],
    "Computing": [],
    "Biology": ["⚫ Laptop", "🟢 Biology Notebook"],
    "Physics": ["⚫ Laptop", "🔵 Physics Notebook"],
    "P.E.": ["🟣 PE Kit"], 
    "Gemoro": [],
    "Geography": ["⚫ Laptop", "⚪ Geography Pack"], 
    "Biblical Hebrew": ["⚪ Josephs Rise To Power text"],
    "Chumash": [],
    "Mincha": [],
};

// ================== JAVASCRIPT REVERT START ==================
/**
 * Retrieves the books needed for a specific day. (Original simple version)
 * If the target day is a weekend, it will automatically shift to the next Monday.
 * @param {Date} targetDate The date for which to get books.
 * @returns {object} An object containing 'books' (array) and 'message' (string),
 *                   and 'effectiveDayName' if the day was shifted.
 */
function getBooksForDay(targetDate) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    let targetDayIndex = targetDate.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    let message = null;
    let booksNeeded = new Set();
    let hasLessons = false;
    let effectiveDate = new Date(targetDate); // Use a copy to modify if needed

    // Determine the actual school day to get books for
    if (targetDayIndex === 0) { // If Sunday
        message = `No lessons scheduled for Sunday. Showing books for Monday instead.`;
        effectiveDate.setDate(effectiveDate.getDate() + 1); // Move to Monday
        targetDayIndex = effectiveDate.getDay(); // Will be 1 (Monday)
    } else if (targetDayIndex === 6) { // If Saturday
        message = `No lessons scheduled for Saturday. Showing books for Monday instead.`;
        effectiveDate.setDate(effectiveDate.getDate() + 2); // Move to Monday (Sunday + 2)
        targetDayIndex = effectiveDate.getDay(); // Will be 1 (Monday)
    }

    const activeWeekId = localStorage.getItem('activeWeek') || 'week1';
    const activeTable = document.getElementById(activeWeekId).querySelector('.timetable');

    if (!activeTable) {
        return { message: "Timetable not found for the active week." };
    }

    const dayColumnIndex = targetDayIndex;
    const rows = activeTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
        const dayCell = row.cells[dayColumnIndex];
        if (dayCell && dayCell.classList.contains('lesson')) {
            hasLessons = true;
            const subjectElement = dayCell.querySelector('.subject');
            if (subjectElement) {
                let subject = subjectElement.textContent.trim();
                if (subject === "Bioligy") subject = "Biology";

                if (subjectBookMap[subject]) {
                    subjectBookMap[subject].forEach(item => booksNeeded.add(item));
                }
            }
        }
    });

    if (!hasLessons && !message) {
        message = "No lessons scheduled for this day.";
    } else if (booksNeeded.size === 0 && !message) {
        message = "All lessons this day require no specific books.";
    }
    
    const sortedBooks = Array.from(booksNeeded).sort();

    return { 
        books: sortedBooks, 
        message: message, 
        effectiveDayName: dayNames[effectiveDate.getDay()]
    };
}


// --- MODAL LOGIC ---
const booksModal = document.getElementById('booksModal');
const closeButton = document.querySelector('.close-button');
const booksList = document.getElementById('booksList');
const noBooksMessage = document.getElementById('noBooksMessage');
const booksModalTitle = document.getElementById('booksModalTitle');

/**
 * Populates and displays the books modal. (Original simple version)
 * @param {Date} dateToDisplay The date object for which books are requested.
 * @param {string} titlePrefix Prefix for the modal title (e.g., "Books for").
 */
function displayBooksModal(dateToDisplay, titlePrefix) {
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bookData = getBooksForDay(dateToDisplay);
    
    if (bookData.effectiveDayName && bookData.effectiveDayName !== dayNames[dateToDisplay.getDay()]) {
        booksModalTitle.textContent = `${titlePrefix} ${dayNames[dateToDisplay.getDay()]} (Showing ${bookData.effectiveDayName}'s Books)`;
    } else {
        booksModalTitle.textContent = `${titlePrefix} ${dayNames[dateToDisplay.getDay()]}`;
    }

    booksList.innerHTML = '';
    noBooksMessage.style.display = 'none';

    if (bookData.books && bookData.books.length > 0) {
        bookData.books.forEach(book => {
            const li = document.createElement('li');
            li.textContent = book;
            booksList.appendChild(li);
        });
    } else if (bookData.message) {
        noBooksMessage.textContent = bookData.message;
        noBooksMessage.style.display = 'block';
    } else {
        noBooksMessage.textContent = "Could not retrieve book information.";
        noBooksMessage.style.display = 'block';
    }

    booksModal.classList.add('show');
}
// ================== JAVASCRIPT REVERT END ==================


closeButton.addEventListener('click', () => {
    booksModal.classList.remove('show'); 
});

window.addEventListener('click', (event) => {
    if (event.target == booksModal) {
        booksModal.classList.remove('show'); 
    }
});


// --- KEYBOARD SHORTCUT FOR BOOKS MODAL ---
document.addEventListener('keydown', function(e) {
    if (e.key.toLowerCase() === 'b' && !e.repeat) {
        const booksModal = document.getElementById('booksModal');
        if (booksModal.classList.contains('show')) {
            booksModal.classList.remove('show');
        } else {
            const today = new Date();
            displayBooksModal(today, 'Books for');
        }
    }
});


// --- DOMContentLoaded: Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    const savedWeek = localStorage.getItem('activeWeek');
    if (savedWeek) {
        showWeek(savedWeek);
    } else {
        showWeek('week1');
    }

    window.addEventListener('resize', () => {
        const activeWeek = localStorage.getItem('activeWeek') || 'week1';
        showWeek(activeWeek);
    });

    updateLessonHighlight();
    setInterval(updateLessonHighlight, 60000);

    const compactToggle = document.getElementById('compactToggle');
    let compactActive = false;

    function setCompactMode(enabled) {
        document.body.classList.toggle('compact-mode', enabled);
        
        const weekButtons = document.querySelectorAll('.week-btn');
        weekButtons.forEach(btn => {
            const weekNum = btn.dataset.week;
            btn.textContent = enabled ? weekNum : `Week ${weekNum}`;
        });

        if (compactToggle) {
            compactToggle.classList.toggle('active', enabled);
            compactToggle.title = enabled ? "Exit compact mode (F)" : "Toggle compact mode (F)";
            compactToggle.innerHTML = enabled ? '&#x2715;' : '⛶';
        }
        
        localStorage.setItem('compactMode', enabled);
    }

    if (compactToggle) {
        compactToggle.addEventListener('click', () => {
            compactActive = !compactActive;
            setCompactMode(compactActive);
        });
    }
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 'f' && !e.repeat) {
            compactActive = !compactActive;
            setCompactMode(compactActive);
        }
    });

    const savedCompactState = localStorage.getItem('compactMode') === 'true';
    if (savedCompactState) {
        compactActive = true;
        setCompactMode(true);
    } else {
        compactActive = false;
        setCompactMode(false);
    }

    const dayHeaders = document.querySelectorAll('.timetable th.day-header');
    
    dayHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const clickedColumnIndex = this.cellIndex;
            const today = new Date();
            const currentDayOfWeek = today.getDay();
            let dummyDateForClickedDay = new Date(today);
            dummyDateForClickedDay.setDate(today.getDate() + (clickedColumnIndex - currentDayOfWeek));
            displayBooksModal(dummyDateForClickedDay, "Books for");
        });
    });

    const weekSlider = document.getElementById('weekSlider');
    const weekButtons = weekSlider.querySelectorAll('.week-btn');

    weekButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const weekNumber = parseInt(button.dataset.week);
            const weekId = `week${weekNumber}`;
            if (!button.classList.contains('active')) {
                showWeek(weekId);
            }
        });
    });

    weekSlider.addEventListener('click', (e) => {
        if (e.target === weekSlider || e.target.classList.contains('week-slider')) {
            const rect = weekSlider.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const sliderWidth = rect.width;
            const weekNumber = clickX < sliderWidth / 2 ? 1 : 2;
            const weekId = `week${weekNumber}`;
            
            const targetButton = document.querySelector(`[data-week="${weekNumber}"]`);
            if (!targetButton.classList.contains('active')) {
                showWeek(weekId);
            }
        }
    });

    function updateLessonInfoBoxes() {
        const now = new Date();
        const day = now.getDay();
        const currentTime = now.toTimeString().slice(0, 5);
        let nextPeriodIdx = null;
        let nextStart = null;
        let nextName = '-';

        // Find next period (lesson or break)
        for (let i = 0; i < lessonSchedule.length; i++) {
            const period = lessonSchedule[i];
            if (currentTime < period.start && nextPeriodIdx === null) {
                nextPeriodIdx = i;
                nextStart = period.start;
                nextName = period.name;
            }
        }

        document.getElementById('nextLessonName').textContent = nextName;
        function getCountdown(targetTime) {
            if (!targetTime) return '--:--';
            const [h, m] = targetTime.split(':').map(Number);
            const target = new Date(now);
            target.setHours(h, m, 0, 0);
            let diff = Math.floor((target - now) / 1000);
            if (diff < 0) diff = 0;
            const min = Math.floor(diff / 60);
            const sec = diff % 60;
            return `${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        }
        document.getElementById('nextLessonCountdown').textContent = "In: " + getCountdown(nextStart);
    }

    updateLessonInfoBoxes();
    setInterval(updateLessonInfoBoxes, 1000);
});