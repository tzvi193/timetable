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

    // Highlight the active week button, excluding the "Show Books" button
    if (weekId === 'week1') {
        document.querySelector('.week-btn[onclick="showWeek(\'week1\')"]').classList.add('active');
    } else if (weekId === 'week2') {
        document.querySelector('.week-btn[onclick="showWeek(\'week2\')"]').classList.add('active');
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
    // Period 5b is a break, so we skip it in this schedule index
    { name: "Period 4",     start: "11:35", end: "12:20" }, // Period Row 4
    { name: "Period 5a",    start: "12:20", end: "13:05" }, // Period Row 5
    // Mincha is a break time but treated as a period
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


// --- BOOK REQUIREMENTS DATA ---
const subjectBookMap = {
    "Chemistry": ["Chemistry Notebook"],
    "Mathematics": ["Maths Notebook"],
    "English": ["English Notebook", "Jekyll + Hyde text"],
    "Modern Hebrew": ["Mh Book"],
    "Computing": [],
    "Bioligy": ["Laptop"], // "Bioligy" as it appears in your HTML
    "Biology": ["Laptop"], // Corrected spelling for internal use
    "Physics": ["Laptop"],
    "P.E.": ["PE Kit"], // No book, but practical items
    "Gemoro": [],
    "Geography": ["Laptop"], // "geography i type on my laptop"
    "Biblical Hebrew": ["Josephs Rise To Power text"],
    "Chumash": [],
    "P.S.H.E.": [],
    "Mincha": [],
    "Registration": [], // General item
    // Add other subjects as they appear in your timetable HTML
    // If a subject is not listed here, it will default to "No specific items".
};

function getBooksForToday() {
    const now = new Date();
    const day = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat

    if (day === 0 || day === 6) { // Sunday or Saturday
        return { message: "It's the weekend! No lessons today." };
    }

    const activeWeekId = localStorage.getItem('activeWeek') || 'week1';
    const activeTable = document.getElementById(activeWeekId).querySelector('.timetable');

    if (!activeTable) {
        return { message: "Timetable not found for the active week." };
    }

    const booksNeeded = new Set();
    let hasLessons = false; // Flag to check if there are any actual lessons today

    // Iterate through rows (periods) of the active table for the current day's column
    const rows = activeTable.querySelectorAll('tbody tr');

    rows.forEach(row => {
        // cells[0] is Time, cells[1] is Monday, cells[2] is Tuesday, etc.
        const dayCell = row.cells[day]; 

        if (dayCell && dayCell.classList.contains('lesson')) {
            hasLessons = true; // Mark that there's at least one lesson today
            const subjectElement = dayCell.querySelector('.subject');

            if (subjectElement) {
                let subject = subjectElement.textContent.trim();
                
                // Handle the typo for "Bioligy" if it exists in your HTML
                if (subject === "Bioligy") {
                    subject = "Biology"; // Use the correct spelling for lookup in subjectBookMap
                }

                if (subjectBookMap[subject]) {
                    subjectBookMap[subject].forEach(item => booksNeeded.add(item));
                } else {
                    console.warn(`No specific book mapping for subject: "${subject}". Consider adding it to subjectBookMap.`);
                    // Optional: add a generic fallback if no specific mapping is found
                    // booksNeeded.add(`Notebook for ${subject}`); 
                }
            }
        }
    });

    if (!hasLessons) {
        return { message: "No lessons scheduled for today." }; // E.g., a school holiday or an entirely empty day
    }

    // Remove "No book needed" if other items are present and it's not the only item
    if (booksNeeded.has("No book needed") && booksNeeded.size > 1) {
        booksNeeded.delete("No book needed");
    }
    
    // If after processing, no specific books were added, it means all lessons require no specific books
    if (booksNeeded.size === 0) {
        return { message: "All lessons today require no specific books." };
    }
    
    // Sort the list for consistent display
    const sortedBooks = Array.from(booksNeeded).sort();

    return { books: sortedBooks };
}


// --- MODAL AND BUTTON LOGIC ---
const showBooksBtn = document.getElementById('showBooksBtn');
const booksModal = document.getElementById('booksModal');
const closeButton = document.querySelector('.close-button');
const booksList = document.getElementById('booksList');
const noBooksMessage = document.getElementById('noBooksMessage');
const booksModalTitle = document.getElementById('booksModalTitle');

showBooksBtn.addEventListener('click', () => {
    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    booksModalTitle.textContent = `Books for ${dayNames[today.getDay()]}`;

    const bookData = getBooksForToday();
    
    booksList.innerHTML = ''; // Clear previous list
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
        // Fallback for unexpected cases, though the above should cover most
        noBooksMessage.textContent = "Could not retrieve book information.";
        noBooksMessage.style.display = 'block';
    }

    booksModal.classList.add('show'); // Show the modal
});

closeButton.addEventListener('click', () => {
    booksModal.classList.remove('show'); // NEW: Remove 'show' class
});


// Close the modal if user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target == booksModal) {
        booksModal.classList.remove('show'); // NEW: Remove 'show' class
    }
});


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