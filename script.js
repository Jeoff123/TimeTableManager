// Function to save teachers to localStorage
function saveTeachersToLocalStorage(teachers) {
    localStorage.setItem('teachers', JSON.stringify(teachers));
}

// Function to load teachers into the manage-teachers.html page
function loadTeachers() {
    const teachersListDiv = document.getElementById('teachersList');
    teachersListDiv.innerHTML = '';

    const teachers = getTeachersFromLocalStorage();
    for (let teacher in teachers) {
        let teacherDiv = document.createElement('div');
        teacherDiv.classList.add('teacher-item');
        teacherDiv.innerHTML = `
            <p><strong>Name:</strong> ${teacher}</p>
            <p><strong>Monday:</strong> ${teachers[teacher].Monday}</p>
            <p><strong>Tuesday:</strong> ${teachers[teacher].Tuesday}</p>
            <p><strong>Wednesday:</strong> ${teachers[teacher].Wednesday}</p>
            <p><strong>Thursday:</strong> ${teachers[teacher].Thursday}</p>
            <p><strong>Friday:</strong> ${teachers[teacher].Friday}</p>
            <button onclick="editTeacher('${teacher}')">Edit</button>
            <button onclick="deleteTeacher('${teacher}')">Delete</button>
        `;
        teachersListDiv.appendChild(teacherDiv);
    }
}

// Function to add or edit a teacher
function saveTeacher(event) {
    event.preventDefault();

    const teacherName = document.getElementById('teacherName').value.trim();
    const mondaySchedule = document.getElementById('mondaySchedule').value.trim();
    const tuesdaySchedule = document.getElementById('tuesdaySchedule').value.trim();
    const wednesdaySchedule = document.getElementById('wednesdaySchedule').value.trim();
    const thursdaySchedule = document.getElementById('thursdaySchedule').value.trim();
    const fridaySchedule = document.getElementById('fridaySchedule').value.trim();

    if (!teacherName || !mondaySchedule || !tuesdaySchedule || !wednesdaySchedule || !thursdaySchedule || !fridaySchedule) {
        alert('Please fill in all fields.');
        return;
    }

    let teachers = getTeachersFromLocalStorage();

    teachers[teacherName] = {
        "Monday": mondaySchedule,
        "Tuesday": tuesdaySchedule,
        "Wednesday": wednesdaySchedule,
        "Thursday": thursdaySchedule,
        "Friday": fridaySchedule
    };

    saveTeachersToLocalStorage(teachers);
    loadTeachers();
    document.getElementById('teacherForm').reset();
}

// Function to edit a teacher's schedule
function editTeacher(teacherName) {
    let teachers = getTeachersFromLocalStorage();
    const teacher = teachers[teacherName];

    document.getElementById('teacherName').value = teacherName;
    document.getElementById('mondaySchedule').value = teacher.Monday;
    document.getElementById('tuesdaySchedule').value = teacher.Tuesday;
    document.getElementById('wednesdaySchedule').value = teacher.Wednesday;
    document.getElementById('thursdaySchedule').value = teacher.Thursday;
    document.getElementById('fridaySchedule').value = teacher.Friday;

    // Remove the current teacher from localStorage
    delete teachers[teacherName];
    saveTeachersToLocalStorage(teachers);
}

// Function to delete a teacher
function deleteTeacher(teacherName) {
    if (confirm(`Are you sure you want to delete ${teacherName}?`)) {
        let teachers = getTeachersFromLocalStorage();
        delete teachers[teacherName];
        saveTeachersToLocalStorage(teachers);
        loadTeachers();
    }
}

// Function to get teachers from localStorage or initialize if not present
function getTeachersFromLocalStorage() {
    let teachers = JSON.parse(localStorage.getItem('teachers'));
    if (!teachers) {
        teachers = {};
        localStorage.setItem('teachers', JSON.stringify(teachers));
    }
    return teachers;
}

// Function to generate checkboxes for teachers in index.html
function generateTeacherCheckboxes() {
    const teacherListDiv = document.getElementById('teacherList');
    teacherListDiv.innerHTML = ''; // Clear previous checkboxes

    const teachersData = getTeachersFromLocalStorage();
    for (let teacher in teachersData) {
        let label = document.createElement('label');
        label.classList.add('checkbox-label');

        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = teacher;
        checkbox.id = teacher; // Use teacher name as ID for uniqueness
        label.appendChild(checkbox);

        let labelText = document.createTextNode(teacher);
        label.appendChild(labelText);

        teacherListDiv.appendChild(label);
    }
}

// Function to find substitute based on selected teachers and weekday
function findSubstitute() {
    const selectedCheckboxes = document.querySelectorAll('#teacherList input[type="checkbox"]:checked');
    if (selectedCheckboxes.length === 0) {
        alert('Please select at least one teacher.');
        return;
    }

    let selectedTeachers = [];
    selectedCheckboxes.forEach(checkbox => {
        selectedTeachers.push(checkbox.value);
    });

    const selectedWeekday = document.getElementById('weekday').value;

    let originalTeachers = {};
    const teachersData = getTeachersFromLocalStorage();
    selectedTeachers.forEach(teacher => {
        originalTeachers[teacher] = teachersData[teacher][selectedWeekday];
    });

    selectedTeachers.forEach(absentTeacher => {
        for (let teacher in teachersData) {
            if (teacher !== absentTeacher) {
                let teacherSchedule = teachersData[teacher][selectedWeekday].split(',');
                let absentTeacherSchedule = originalTeachers[absentTeacher].split(',');

                let classToReplace = null;
                let freePeriodIndex = null;

                teacherSchedule.forEach((period, index) => {
                    if (absentTeacherSchedule[index] !== 'FREE' && period === 'FREE' && absentTeacherSchedule[index] === teachersData[teacher][selectedWeekday].split(',')[index]) {
                        classToReplace = absentTeacherSchedule[index];
                        freePeriodIndex = index;
                    }
                });

                if (classToReplace !== null && freePeriodIndex !== null) {
                    teacherSchedule[freePeriodIndex] = classToReplace;
                }

                teachersData[teacher][selectedWeekday] = teacherSchedule.join(',');
            }
        }
    });

    localStorage.setItem('teachers', JSON.stringify(teachersData));
    displayResult(selectedTeachers, selectedWeekday);
}

// Function to display substitution result
function displayResult(selectedTeachers, selectedWeekday) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h2>Substitution Time Table</h2><h3>${selectedWeekday}</h3>`;

    const teachersData = getTeachersFromLocalStorage();
    for (let teacher in teachersData) {
        if (!selectedTeachers.includes(teacher)) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${teacher}:</strong> ${teachersData[teacher][selectedWeekday]}<br><br>`;
            resultDiv.appendChild(p);
        }
    }
}

// Function to convert result to PDF and download
function convertToPdf() {
    const resultDiv = document.getElementById('result');
    const resultText = resultDiv.innerText;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text(resultText, 10, 10);

    // Generate a Blob object representing the PDF document
    const pdfBlob = doc.output('blob');

    // Create a URL for the Blob object
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Create a temporary <a> element to trigger the download
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;
    a.download = 'substitution_result.pdf';

    // Append the <a> element to the DOM and simulate click
    document.body.appendChild(a);
    a.click();

    // Clean up: remove the <a> element and revoke the URL object
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
}

// Initial load of teachers on window load
window.onload = function() {
    generateTeacherCheckboxes();
};
