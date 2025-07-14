
// --- WEEK TOGGLE SCRIPT (Your original) ---
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
    // Row is a break, so we skip it in this schedule
    { name: "Period 4",     start: "11:35", end: "12:20" }, // Period Row 4
    { name: "Period 5a",    start: "12:20", end: "13:05" }, // Period Row 5
    // Row is a break, so we skip it in this schedule
    { name: "Mincha",       start: "13:50", end: "14:05" }, // Period Row 7
    { name: "Period 6",     start: "14:05", end: "14:50" }, // Period Row 8
    { name: "Period 7",     start: "14:50", end: "15:35" }, // Period Row 9
    { name: "Period 8",     start: "15:35", end: "16:25" }  // Period Row 10
];

// This maps a schedule index to the actual row index in the HTML table
const scheduleRowMap = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10]; 

function updateLessonHighlight() {
    const now = new Date();
    // Use `new Date("2024-07-16T10:30:00")` for testing different times
    const day = now.getDay(); // 0=Sun, 1=Mon, 2=Tue, ..., 6=Sat
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"

    // Clear previous highlights
    document.querySelectorAll('.highlight-current, .highlight-next').forEach(cell => {
        cell.classList.remove('highlight-current', 'highlight-next');
    });

    let currentPeriod = null;
    let nextPeriod = null;

    // --- Find current and next period for today ---
    if (day >= 1 && day <= 5) { // If it's a weekday
        for (let i = 0; i < lessonSchedule.length; i++) {
            const period = lessonSchedule[i];
            // Check for current lesson
            if (currentTime >= period.start && currentTime < period.end) {
                currentPeriod = { day: day, periodIndex: i };
            }
            // Find the very next lesson of the day
            if (currentTime < period.start && !nextPeriod) {
                nextPeriod = { day: day, periodIndex: i };
            }
        }
    }

    // --- Logic for finding the next lesson if it's not today ---
    if (!nextPeriod) {
        let nextDay = (day >= 1 && day <= 4) ? day + 1 : 1; // If Mon-Thurs, next day is tomorrow. Else, it's Monday.
        if (day === 5 && currentTime >= lessonSchedule[lessonSchedule.length - 1].end) {
            nextDay = 1; // After last lesson on Friday, next is Monday
        }
        nextPeriod = { day: nextDay, periodIndex: 0 }; // First period of the next school day
    }
    
    // --- Apply the highlight classes ---
    const tables = document.querySelectorAll('.timetable');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tbody tr');
        
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
    });
}

// Run the function once on load, then every minute to keep it updated
document.addEventListener('DOMContentLoaded', () => {
    updateLessonHighlight();
    setInterval(updateLessonHighlight, 60000); // 60000 ms = 1 minute
});
