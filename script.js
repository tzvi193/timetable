// --- WEEK TOGGLE SCRIPT ---
onkeypress = function(e) {
    if (e.key === '1') {
        showWeek('week1');
    } else if (e.key === '2') {
        showWeek('week2');
    }
};

function showWeek(weekId) {
    const weekContents = document.querySelectorAll('.week-content');
    weekContents.forEach(content => {
        content.style.display = 'none';
    });
    const buttons = document.querySelectorAll('.week-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(weekId).style.display = 'block';

    if (weekId === 'week1') {
        buttons[0].classList.add('active');
    } else if (weekId === 'week2') {
        buttons[1].classList.add('active');
    }

    // NEW: Save the active week to localStorage
    localStorage.setItem('activeWeek', weekId);

    // Re-run the highlight function when switching weeks to ensure it's visible
    updateLessonHighlight();
}


// --- DYNAMIC HIGHLIGHTING SCRIPT ---

// IMPORTANT: Adjust these times to match your actual school schedule
const lessonSchedule = [
    { name: "Registration", start: "08:35", end: "09:00" }, // Period Row 0
    { name: "Period 1",     start: "09:00", end: "09:45" }, // Period Row 1
    { name: "Period 2",     start: "09:45", end: "10:30" }, // Period Row 2
    { name: "Period 3",     start: "10:30", end: "11:15" }, // Period Row 3
    // Row is a break (Period 3 ends 11:15, Period 4 starts 11:35)
    { name: "Period 4",     start: "11:35", end: "12:20" }, // Period Row 4
    { name: "Period 5a",    start: "12:20", end: "13:05" }, // Period Row 5
    // Row is a break (Period 5a ends 13:05, Mincha starts 13:50)
    { name: "Mincha",       start: "13:50", end: "14:05" }, // Period Row 7
    { name: "Period 6",     start: "14:05", end: "14:50" }, // Period Row 8
    { name: "Period 7",     start: "14:50", end: "15:35" }, // Period Row 9
    { name: "Period 8",     start: "15:35", end: "16:25" }  // Period Row 10
];

// This maps a schedule index to the actual row index in the HTML table
// (e.g., schedule entry 0 is HTML row 0, schedule entry 3 is HTML row 3, 
// schedule entry 4 (Period 4) is HTML row 4, etc. - accounting for break rows)
const scheduleRowMap = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10]; 

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
            // Find the very next lesson of the day (if not already found)
            if (currentTime < period.start && !nextPeriod && !currentPeriod) {
                 nextPeriod = { day: day, periodIndex: i };
            }
        }
        // If currentPeriod was found, and there's a next one for *today*, set it.
        // This handles the case where currentPeriod is the last period of the day.
        if (currentPeriod && currentPeriod.periodIndex < lessonSchedule.length -1) {
            nextPeriod = { day: day, periodIndex: currentPeriod.periodIndex + 1};
        } else if (currentPeriod && currentPeriod.periodIndex === lessonSchedule.length - 1) {
             // If the current period is the last of the day, next period is Monday's first
            let nextDay = (day === 5) ? 1 : day + 1; // If Friday, next is Monday, else next day
            nextPeriod = { day: nextDay, periodIndex: 0 };
        }

    } else { // It's a weekend (Saturday or Sunday), next period is always Monday's first
        nextPeriod = { day: 1, periodIndex: 0 };
    }
    
    // If no next period was found because it's past all periods on a weekday, then it's next Monday.
    if (!nextPeriod && day >= 1 && day <=5 && currentTime >= lessonSchedule[lessonSchedule.length -1].end) {
        let nextDay = (day === 5) ? 1 : day + 1;
        nextPeriod = { day: nextDay, periodIndex: 0 };
    } else if (!nextPeriod && (day === 0 || day === 6)) { // If it's Saturday or Sunday
        nextPeriod = { day: 1, periodIndex: 0 };
    }

    // --- Apply the highlight classes ---
    // Only highlight in the currently visible table
    const activeWeekId = localStorage.getItem('activeWeek') || 'week1'; // Get the active week ID
    const activeTable = document.getElementById(activeWeekId).querySelector('.timetable');

    if (activeTable) {
        const rows = activeTable.querySelectorAll('tbody tr');
        
        // Highlight CURRENT lesson
        if (currentPeriod) {
            const rowIndex = scheduleRowMap[currentPeriod.periodIndex];
            const cell = rows[rowIndex]?.cells[currentPeriod.day];
            if (cell && cell.classList.contains('lesson')) {
                cell.classList.add('highlight-current');
            }
        }

        // Highlight NEXT lesson
        if (nextPeriod) {
            const rowIndex = scheduleRowMap[nextPeriod.periodIndex];
            const cell = rows[rowIndex]?.cells[nextPeriod.day];
            if (cell && cell.classList.contains('lesson')) {
                cell.classList.add('highlight-next');
            }
        }
    }
}

// Run the function once on load, then every minute to keep it updated
document.addEventListener('DOMContentLoaded', () => {
    // NEW: Load the active week from localStorage or default to 'week1'
    const savedWeek = localStorage.getItem('activeWeek');
    if (savedWeek) {
        showWeek(savedWeek);
    } else {
        showWeek('week1'); // Default to Week 1 if no saved preference
    }

    // Now that the correct week is displayed, update highlights
    updateLessonHighlight();
    setInterval(updateLessonHighlight, 60000); // 60000 ms = 1 minute
});