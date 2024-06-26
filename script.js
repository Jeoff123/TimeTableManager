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

    let substituted = {};

    selectedTeachers.forEach(absentTeacher => {
        let substitutionMade = false;

        for (let teacher in teachersData) {
            if (teacher !== absentTeacher) {
                let teacherSchedule = teachersData[teacher][selectedWeekday].split(',');
                let absentTeacherSchedule = originalTeachers[absentTeacher].split(',');

                absentTeacherSchedule.forEach((classToReplace, index) => {
                    if (classToReplace !== 'FREE' && teacherSchedule[index] === 'FREE' && !substitutionMade) {
                        teacherSchedule[index] = classToReplace;
                        substitutionMade = true;
                        substituted[teacher] = substituted[teacher] || [];
                        substituted[teacher].push(`Period ${index + 1}: ${classToReplace}`);
                    }
                });

                teachersData[teacher][selectedWeekday] = teacherSchedule.join(',');
            }
        }
    });

    saveTeachersToLocalStorage(teachersData);
    displayResult(substituted, selectedWeekday);
}

// Function to display substitution result
function displayResult(substituted, selectedWeekday) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<h2>Substitution Time Table</h2><h3>${selectedWeekday}</h3>`;

    for (let teacher in substituted) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${teacher}:</strong> ${substituted[teacher].join(', ')}<br><br>`;
        resultDiv.appendChild(p);
    }
}

// Function to convert result to PDF and share via WhatsApp
function convertToPdf() {
    const resultDiv = document.getElementById('result');
    const resultText = resultDiv.innerText;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    try {
        // Set line height (line spacing) to 10 points (adjust as needed)
        const lineHeight = 5;

        // Split result text into lines
        const lines = doc.splitTextToSize(resultText, doc.internal.pageSize.width - 20);

        // Add lines to PDF with specified line height
        lines.forEach((line, index) => {
            // Calculate y position for each line
            const y = 20 + (index * lineHeight);
            // Add text to PDF at x=10, y position
            doc.text(line, 10, y);
        });

        // Generate a Blob object representing the PDF document
        const pdfBlob = doc.output('blob');

        // Share PDF via WhatsApp if supported
        if (navigator.share) {
            // Create a File object from Blob
            const file = new File([pdfBlob], 'substitution_result.pdf', {
                type: 'application/pdf',
            });

            // Use the Web Share API to share the PDF file to WhatsApp
            navigator.share({
                files: [file],
                title: 'Substitution Result PDF'
            }).then(() => {
                console.log('PDF shared successfully to WhatsApp');
            }).catch((error) => {
                console.error('Error sharing PDF:', error);
                alert('Your browser does not support sharing files directly to WhatsApp.');

                // If sharing fails, attempt to download the PDF
                downloadPdf(pdfBlob);
            });
        } else {
            // Fallback for browsers that do not support Web Share API
            alert('Your browser does not support sharing files directly to WhatsApp.');

            // Attempt to download the PDF
            downloadPdf(pdfBlob);
        }
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('PDF IS  In The Downloads Folder.');

        // If PDF generation fails, attempt to download the PDF
        downloadPdf(pdfBlob);
    }
}

// Function to download the generated PDF
function downloadPdf(pdfBlob) {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.style.display = 'none';
    document.body.appendChild(a);

    // Set the HREF to a Blob URL representing the PDF
    const url = window.URL.createObjectURL(pdfBlob);
    a.href = url;

    // Set the download attribute with a default filename
    a.download = 'substitution_result.pdf';

    // Programmatically click the anchor element to trigger download
    a.click();

    // Clean up: remove the anchor element and revoke the Blob URL
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Initial load of teachers on window load
window.onload = function() {
    generateTeacherCheckboxes();
};
