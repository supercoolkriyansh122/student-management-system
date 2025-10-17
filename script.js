// Student Management System - Main JavaScript

// Configuration: Set to 'local' for LocalStorage or 'api' for server
const STORAGE_MODE = 'local'; // Change to 'api' when server is running

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Data Management with Fallback
class StudentManager {
    constructor() {
        this.students = [];
        this.storageMode = STORAGE_MODE;
    }

    // Load students with fallback
    async loadStudents() {
        if (this.storageMode === 'api') {
            try {
                const response = await fetch(`${API_BASE_URL}/students`);
                if (!response.ok) throw new Error('Failed to load students');
                this.students = await response.json();
                return this.students;
            } catch (error) {
                console.warn('API failed, falling back to LocalStorage:', error);
                this.storageMode = 'local';
                return this.loadFromLocalStorage();
            }
        } else {
            return this.loadFromLocalStorage();
        }
    }

    // Load from LocalStorage
    loadFromLocalStorage() {
        const data = localStorage.getItem('students');
        this.students = data ? JSON.parse(data) : [];
        return this.students;
    }

    // Save to LocalStorage
    saveToLocalStorage() {
        localStorage.setItem('students', JSON.stringify(this.students));
    }

    // Export data as JSON
    exportData() {
        const data = {
            students: this.students,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `students-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return data;
    }

    // Import data from JSON
    importData(jsonData) {
        try {
            if (jsonData.students && Array.isArray(jsonData.students)) {
                this.students = jsonData.students;
                this.saveToLocalStorage();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Add a new student
    async addStudent(student) {
        if (this.storageMode === 'api') {
            try {
                const response = await fetch(`${API_BASE_URL}/students`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(student)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to add student');
                }

                const newStudent = await response.json();
                this.students.push(newStudent);
                return newStudent;
            } catch (error) {
                console.warn('API failed, falling back to LocalStorage:', error);
                this.storageMode = 'local';
                return this.addStudentLocal(student);
            }
        } else {
            return this.addStudentLocal(student);
        }
    }

    // Add student to LocalStorage
    addStudentLocal(student) {
        student.id = Date.now().toString();
        this.students.push(student);
        this.saveToLocalStorage();
        return student;
    }

    // Get student by ID
    getStudent(id) {
        return this.students.find(s => s.id === id);
    }

    // Get all students
    getAllStudents() {
        return this.students;
    }

    // Check if roll number exists
    isRollNoUnique(rollNo, excludeId = null) {
        return !this.students.some(s => 
            s.rollNo.toLowerCase() === rollNo.toLowerCase() && s.id !== excludeId
        );
    }

    // Check if admission number exists
    isAdmissionNoUnique(admissionNo, excludeId = null) {
        return !this.students.some(s => 
            s.admissionNo.toLowerCase() === admissionNo.toLowerCase() && s.id !== excludeId
        );
    }
}

// Initialize Student Manager
const studentManager = new StudentManager();

// View Management
function showView(viewId) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(viewId).classList.add('active');
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Home View Functions
async function renderStudentsList(filteredStudents = null) {
    try {
        // Load students with fallback
        await studentManager.loadStudents();
        
        const allStudents = studentManager.getAllStudents();
        const students = filteredStudents !== null ? filteredStudents : allStudents;
        const studentsList = document.getElementById('studentsList');
        const emptyState = document.getElementById('emptyState');
        const dataStatus = document.getElementById('dataStatus');
        const searchBar = document.getElementById('searchBar');

        // Search bar is always visible now
        searchBar.style.display = 'block';

        // Update data status
        if (allStudents.length === 0) {
            dataStatus.textContent = 'No students in database';
        } else {
            dataStatus.textContent = `${allStudents.length} student${allStudents.length === 1 ? '' : 's'} loaded`;
        }

        if (students.length === 0) {
            studentsList.innerHTML = '';
            if (allStudents.length === 0) {
                emptyState.classList.add('visible');
            } else {
                // Show no results message
                emptyState.classList.remove('visible');
                studentsList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary); grid-column: 1/-1;"><h3>No students found</h3><p>Try adjusting your search terms</p></div>';
            }
        } else {
            emptyState.classList.remove('visible');
            studentsList.innerHTML = students.map(student => `
                <div class="student-card" data-id="${student.id}">
                    <div class="student-card-header">
                        <div class="student-avatar">
                            ${student.picture ? 
                                `<img src="${student.picture}" alt="${student.firstName}">` : 
                                `<span>${getInitials(student.firstName, student.lastName)}</span>`
                            }
                        </div>
                        <div class="student-info">
                            <h3>${student.firstName} ${student.lastName}</h3>
                        </div>
                    </div>
                    <div class="student-card-details">
                        <div class="detail-row">
                            <span>Roll No.</span>
                            <span>${student.rollNo}</span>
                        </div>
                        <div class="detail-row">
                            <span>Class</span>
                            <span>Class ${student.class} - ${student.section}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            // Add click listeners to cards and staggered animations
            document.querySelectorAll('.student-card').forEach((card, index) => {
                // Staggered animation delay
                card.style.animationDelay = `${index * 0.05}s`;
                
                card.addEventListener('click', () => {
                    const studentId = card.dataset.id;
                    showStudentProfile(studentId);
                });
            });
        }
    } catch (error) {
        console.error('Error rendering students list:', error);
        showNotification('Error loading students. Please refresh the page.', 'error');
    }
}

// Search functionality
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const allStudents = studentManager.getAllStudents();
        
        if (searchTerm === '') {
            // Show all students
            renderStudentsList();
            searchResultsInfo.textContent = '';
            return;
        }
        
        // Filter students by name, roll number, or admission number
        const filteredStudents = allStudents.filter(student => {
            const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
            const rollNo = student.rollNo.toLowerCase();
            const admissionNo = student.admissionNo.toLowerCase();
            
            return fullName.includes(searchTerm) || 
                   rollNo.includes(searchTerm) || 
                   admissionNo.includes(searchTerm);
        });
        
        // Update search results info
        searchResultsInfo.textContent = `Found ${filteredStudents.length} student${filteredStudents.length === 1 ? '' : 's'}`;
        
        // Render filtered students
        renderStudentsList(filteredStudents);
    });
}

function getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Student Profile View
function showStudentProfile(studentId) {
    const student = studentManager.getStudent(studentId);
    if (!student) return;

    // Update profile picture
    const profilePicture = document.getElementById('profilePicture');
    if (student.picture) {
        profilePicture.innerHTML = `<img src="${student.picture}" alt="${student.firstName}">`;
    } else {
        profilePicture.innerHTML = `<span class="profile-initials">${getInitials(student.firstName, student.lastName)}</span>`;
    }

    // Update profile information
    document.getElementById('profileName').textContent = `${student.firstName} ${student.lastName}`;
    document.getElementById('profileClass').textContent = `Class ${student.class} - Section ${student.section}`;
    document.getElementById('profileRollNo').textContent = student.rollNo;
    document.getElementById('profileAdmissionNo').textContent = student.admissionNo;
    document.getElementById('profileClassValue').textContent = `Class ${student.class}`;
    document.getElementById('profileSection').textContent = student.section;
    document.getElementById('profileDob').textContent = formatDate(student.dob);

    showView('profileView');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Form Validation
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        this.errors = {};
    }

    clearErrors() {
        this.errors = {};
        this.form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        this.form.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
    }

    setError(fieldId, message) {
        this.errors[fieldId] = message;
        const errorElement = document.getElementById(`${fieldId}Error`);
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    }

    validateRequired(fieldId, fieldName) {
        const value = document.getElementById(fieldId).value.trim();
        if (!value) {
            this.setError(fieldId, `${fieldName} is required`);
            return false;
        }
        return true;
    }

    validateSelect(fieldId, fieldName) {
        const value = document.getElementById(fieldId).value;
        if (!value) {
            this.setError(fieldId, `Please select a ${fieldName}`);
            return false;
        }
        return true;
    }

    validateUnique(fieldId, fieldName, checkFunction, value) {
        if (!checkFunction(value)) {
            this.setError(fieldId, `This ${fieldName} is already taken`);
            return false;
        }
        return true;
    }

    validateDate(fieldId) {
        const value = document.getElementById(fieldId).value;
        if (!value) {
            this.setError(fieldId, 'Date of Birth is required');
            return false;
        }
        
        const selectedDate = new Date(value);
        const today = new Date();
        
        if (selectedDate >= today) {
            this.setError(fieldId, 'Date of Birth must be in the past');
            return false;
        }

        // Check if student is at least 3 years old
        const minAge = new Date();
        minAge.setFullYear(minAge.getFullYear() - 3);
        
        if (selectedDate > minAge) {
            this.setError(fieldId, 'Student must be at least 3 years old');
            return false;
        }

        return true;
    }

    isValid() {
        return Object.keys(this.errors).length === 0;
    }
}

// Image state management
let currentImageData = null;

// Add Student Form Handler
function setupAddStudentForm() {
    const form = document.getElementById('addStudentForm');
    const pictureInput = document.getElementById('picture');
    const imagePreview = document.getElementById('imagePreview');
    const dragDropZone = document.getElementById('dragDropZone');

    // Drag and Drop handlers
    dragDropZone.addEventListener('click', () => {
        pictureInput.click();
    });

    dragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropZone.classList.add('drag-over');
    });

    dragDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('drag-over');
    });

    dragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleImageFile(file);
            } else {
                showNotification('Please upload an image file', 'error');
            }
        }
    });

    // Image preview handler
    pictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });

    function handleImageFile(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification('Image size should be less than 5MB', 'error');
            pictureInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            currentImageData = e.target.result;
            displayImagePreview(currentImageData);
            dragDropZone.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    function displayImagePreview(imageData) {
        imagePreview.innerHTML = `
            <div class="image-preview-container">
                <img src="${imageData}" alt="Preview">
                <button type="button" class="remove-image-btn" id="removeImageBtn">×</button>
            </div>
        `;
        imagePreview.classList.add('visible');

        // Add remove button handler
        document.getElementById('removeImageBtn').addEventListener('click', removeImage);
    }

    function removeImage() {
        currentImageData = null;
        pictureInput.value = '';
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('visible');
        dragDropZone.classList.remove('has-image');
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const validator = new FormValidator('addStudentForm');
        validator.clearErrors();

        // Validate all fields
        let isValid = true;

        isValid = validator.validateRequired('firstName', 'First Name') && isValid;
        isValid = validator.validateRequired('lastName', 'Last Name') && isValid;
        
        const rollNo = document.getElementById('rollNo').value.trim();
        isValid = validator.validateRequired('rollNo', 'Roll Number') && isValid;
        if (isValid && rollNo) {
            isValid = validator.validateUnique(
                'rollNo', 
                'Roll Number', 
                (val) => studentManager.isRollNoUnique(val),
                rollNo
            ) && isValid;
        }

        const admissionNo = document.getElementById('admissionNo').value.trim();
        isValid = validator.validateRequired('admissionNo', 'Admission Number') && isValid;
        if (isValid && admissionNo) {
            isValid = validator.validateUnique(
                'admissionNo', 
                'Admission Number', 
                (val) => studentManager.isAdmissionNoUnique(val),
                admissionNo
            ) && isValid;
        }

        isValid = validator.validateSelect('class', 'Class') && isValid;
        isValid = validator.validateSelect('section', 'Section') && isValid;
        isValid = validator.validateDate('dob') && isValid;

        if (!validator.isValid()) {
            showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Get form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            rollNo: rollNo,
            admissionNo: admissionNo,
            class: document.getElementById('class').value,
            section: document.getElementById('section').value,
            dob: document.getElementById('dob').value,
            picture: currentImageData // Use the stored Base64 image data
        };

        // Save student
        saveStudent(formData);
    });
}

async function saveStudent(formData) {
    try {
        await studentManager.addStudent(formData);
        showNotification('Student added successfully!', 'success');
        resetAddStudentForm();
        showView('homeView');
        await renderStudentsList();
    } catch (error) {
        showNotification(error.message || 'Error adding student. Please try again.', 'error');
        console.error('Error saving student:', error);
    }
}

function resetAddStudentForm() {
    const form = document.getElementById('addStudentForm');
    const dragDropZone = document.getElementById('dragDropZone');
    const imagePreview = document.getElementById('imagePreview');
    
    // Reset global image data
    currentImageData = null;
    
    form.reset();
    imagePreview.innerHTML = '';
    imagePreview.classList.remove('visible');
    dragDropZone.classList.remove('has-image');
    
    // Clear all error messages
    form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    form.querySelectorAll('input, select').forEach(el => el.classList.remove('error'));
}

// Data Management Functions
function setupDataManagement() {
    // Export Data button
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        try {
            const data = studentManager.exportData();
            showNotification(`Exported ${data.students.length} students successfully!`, 'success');
        } catch (error) {
            showNotification('Failed to export data', 'error');
            console.error('Export error:', error);
        }
    });

    // Import Data button
    document.getElementById('importDataBtn').addEventListener('click', () => {
        document.getElementById('importFileInput').click();
    });

    // Import file input
    document.getElementById('importFileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const jsonData = JSON.parse(e.target.result);
                const success = studentManager.importData(jsonData);
                
                if (success) {
                    showNotification(`Imported ${jsonData.students.length} students successfully!`, 'success');
                    renderStudentsList(); // Refresh the list
                } else {
                    showNotification('Invalid data format. Please select a valid backup file.', 'error');
                }
            } catch (error) {
                showNotification('Failed to read file. Please select a valid JSON file.', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
        
        // Reset the input
        e.target.value = '';
    });
}

// Navigation Event Listeners
function setupNavigation() {
    // Add Student button
    document.getElementById('addStudentBtn').addEventListener('click', () => {
        resetAddStudentForm();
        showView('addStudentView');
    });

    // Test Animations button
    document.getElementById('testAnimBtn').addEventListener('click', () => {
        // Test form animation
        showView('addStudentView');
        setTimeout(() => {
            showView('homeView');
            setTimeout(() => {
                showNotification('✅ Animations are working! Check the smooth transitions.', 'success');
            }, 500);
        }, 1000);
    });

    // Back from Add Student
    document.getElementById('backFromAddBtn').addEventListener('click', () => {
        showView('homeView');
        clearSearch();
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
        showView('homeView');
        clearSearch();
    });

    // Back from Profile
    document.getElementById('backFromProfileBtn').addEventListener('click', () => {
        showView('homeView');
        clearSearch();
    });
}

// Clear search input
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    if (searchInput) {
        searchInput.value = '';
        searchResultsInfo.textContent = '';
    }
}

// Initialize Application
async function init() {
    setupNavigation();
    setupAddStudentForm();
    setupDataManagement();
    setupSearchBar();
    await renderStudentsList();
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
