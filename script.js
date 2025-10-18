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
                return this.addToLocalStorage(student);
            }
        } else {
            return this.addToLocalStorage(student);
        }
    }

    // Add to LocalStorage
    addToLocalStorage(student) {
        const newStudent = {
            ...student,
            id: Date.now().toString(),
            createdAt: new Date().toISOString()
        };
        
        this.students.push(newStudent);
        this.saveToLocalStorage();
        return newStudent;
    }

    // Update student
    async updateStudent(studentId, updatedData) {
        if (this.storageMode === 'api') {
            try {
                const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to update student');
                }

                const updatedStudent = await response.json();
                const index = this.students.findIndex(s => s.id === studentId);
                if (index !== -1) {
                    this.students[index] = updatedStudent;
                }
                return updatedStudent;
            } catch (error) {
                console.warn('API failed, falling back to LocalStorage:', error);
                this.storageMode = 'local';
                return this.updateInLocalStorage(studentId, updatedData);
            }
        } else {
            return this.updateInLocalStorage(studentId, updatedData);
        }
    }

    // Update in LocalStorage
    updateInLocalStorage(studentId, updatedData) {
        const index = this.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            this.students[index] = { ...this.students[index], ...updatedData };
            this.saveToLocalStorage();
            return this.students[index];
        }
        throw new Error('Student not found');
    }

    // Delete student
    async deleteStudent(studentId) {
        if (this.storageMode === 'api') {
            try {
                const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to delete student');
                }

                this.students = this.students.filter(s => s.id !== studentId);
                return true;
            } catch (error) {
                console.warn('API failed, falling back to LocalStorage:', error);
                this.storageMode = 'local';
                return this.deleteFromLocalStorage(studentId);
            }
        } else {
            return this.deleteFromLocalStorage(studentId);
        }
    }

    // Delete from LocalStorage
    deleteFromLocalStorage(studentId) {
        this.students = this.students.filter(s => s.id !== studentId);
        this.saveToLocalStorage();
        return true;
    }

    // Get student by ID
    getStudent(studentId) {
        return this.students.find(s => s.id === studentId);
    }

    // Get all students
    getAllStudents() {
        return this.students;
    }

    // Check if roll number exists
    isRollNumberUnique(rollNo, excludeId = null) {
        return !this.students.some(s => s.rollNo === rollNo && s.id !== excludeId);
    }

    // Check if admission number exists
    isAdmissionNumberUnique(admissionNo, excludeId = null) {
        return !this.students.some(s => s.admissionNo === admissionNo && s.id !== excludeId);
    }
}

// View Management
function showView(viewId) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.add('active');
    }
}

// Navigation Setup
function setupNavigation() {
    const addStudentBtn = document.getElementById('addStudentBtn');
    const backFromAddBtn = document.getElementById('backFromAddBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const backFromEditBtn = document.getElementById('backFromEditBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const backFromProfileBtn = document.getElementById('backFromProfileBtn');
    const backFromAttendanceBtn = document.getElementById('backFromAttendanceBtn');
    const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
    const backFromUsersBtn = document.getElementById('backFromUsersBtn');
    const backFromAddUserBtn = document.getElementById('backFromAddUserBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');

    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', () => {
            showView('addStudentView');
            resetAddStudentForm();
        });
    }

    if (backFromAddBtn) {
        backFromAddBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromEditBtn) {
        backFromEditBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromProfileBtn) {
        backFromProfileBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromAttendanceBtn) {
        backFromAttendanceBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromHistoryBtn) {
        backFromHistoryBtn.addEventListener('click', () => {
            showView('profileView');
        });
    }

    if (backFromUsersBtn) {
        backFromUsersBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromAddUserBtn) {
        backFromAddUserBtn.addEventListener('click', () => {
            showView('userManagementView');
            renderUsersList();
        });
    }

    if (cancelUserBtn) {
        cancelUserBtn.addEventListener('click', () => {
            showView('userManagementView');
            renderUsersList();
        });
    }
}

// Render Students List
async function renderStudentsList(filteredStudents = null) {
    const studentsList = document.getElementById('studentsList');
    const emptyState = document.getElementById('emptyState');
    const dataStatus = document.getElementById('dataStatus');
    
    if (!studentsList || !emptyState || !dataStatus) return;

    try {
        const students = filteredStudents || await studentManager.loadStudents();
        
        // Update data status
        dataStatus.textContent = `${students.length} student${students.length !== 1 ? 's' : ''} loaded`;

        if (students.length === 0) {
            studentsList.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        studentsList.style.display = 'grid';
        emptyState.style.display = 'none';

        // Clear existing cards
        studentsList.innerHTML = '';

        // Create student cards
        students.forEach((student, index) => {
            const card = createStudentCard(student, index);
            studentsList.appendChild(card);
        });

    } catch (error) {
        console.error('Error rendering students:', error);
        showNotification('Error loading students. Please try again.', 'error');
    }
}

// Create Student Card
function createStudentCard(student, index) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.style.animationDelay = `${index * 0.1}s`;

    const initials = getInitials(student.firstName, student.lastName);
    const pictureHtml = student.picture 
        ? `<img src="${student.picture}" alt="${student.firstName}">`
        : `<span class="student-initials">${initials}</span>`;

    card.innerHTML = `
        <div class="student-picture">
            ${pictureHtml}
        </div>
        <div class="student-info">
            <h3 class="student-name">${student.firstName} ${student.lastName}</h3>
            <p class="student-details">
                <span class="student-roll">Roll: ${student.rollNo}</span>
                <span class="student-class">Class ${student.class} - ${student.section}</span>
            </p>
            <p class="student-admission">Admission: ${student.admissionNo}</p>
        </div>
        <div class="student-actions">
            <button class="student-edit-btn" onclick="showEditStudent('${student.id}')" title="Edit Student">
                ✏️
            </button>
        </div>
    `;

    // Add click handler for viewing profile
    card.addEventListener('click', (e) => {
        // Don't trigger if clicking edit button
        if (!e.target.closest('.student-edit-btn')) {
            showStudentProfile(student.id);
        }
    });

    return card;
}

// Search Bar Setup
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    
    if (!searchInput || !searchResultsInfo) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        currentFilters.searchTerm = searchTerm;
        applyFiltersAndSort();
    });
}

// Filter and Sort Setup
function setupFiltersAndSort() {
    const filterClass = document.getElementById('filterClass');
    const filterSection = document.getElementById('filterSection');
    const sortBy = document.getElementById('sortBy');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');

    if (filterClass) {
        filterClass.addEventListener('change', (e) => {
            currentFilters.class = e.target.value;
            applyFiltersAndSort();
        });
    }

    if (filterSection) {
        filterSection.addEventListener('change', (e) => {
            currentFilters.section = e.target.value;
            applyFiltersAndSort();
        });
    }

    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            currentFilters.sortBy = e.target.value;
            applyFiltersAndSort();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            // Reset all filters
            currentFilters = {
                class: '',
                section: '',
                sortBy: '',
                searchTerm: ''
            };
            
            // Reset UI
            if (filterClass) filterClass.value = '';
            if (filterSection) filterSection.value = '';
            if (sortBy) sortBy.value = '';
            document.getElementById('searchInput').value = '';
            
            // Update view
            applyFiltersAndSort();
            showNotification('Filters cleared', 'success');
        });
    }
}

function getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Student Profile View
function showStudentProfile(studentId) {
    const student = studentManager.getStudent(studentId);
    if (!student) return;

    // Store current profile student ID for delete functionality
    currentProfileStudentId = studentId;

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

// Show Edit Student Form
function showEditStudent(studentId) {
    const student = studentManager.getStudent(studentId);
    if (!student) return;

    currentEditingStudentId = studentId;

    // Populate form fields
    document.getElementById('editStudentId').value = studentId;
    document.getElementById('editFirstName').value = student.firstName;
    document.getElementById('editLastName').value = student.lastName;
    document.getElementById('editRollNo').value = student.rollNo;
    document.getElementById('editAdmissionNo').value = student.admissionNo;
    document.getElementById('editClass').value = student.class;
    document.getElementById('editSection').value = student.section;
    document.getElementById('editDob').value = student.dob;

    // Handle existing picture
    if (student.picture) {
        editImageData = student.picture;
        const editImagePreview = document.getElementById('editImagePreview');
        const editDragDropZone = document.getElementById('editDragDropZone');
        
        editImagePreview.innerHTML = `
            <div class="image-preview-container">
                <img src="${student.picture}" alt="Preview">
                <button type="button" class="remove-image-btn" id="removeEditImageBtn">×</button>
            </div>
        `;
        editImagePreview.classList.add('visible');
        editDragDropZone.classList.add('has-image');

        // Add remove button handler
        document.getElementById('removeEditImageBtn').addEventListener('click', () => {
            editImageData = null;
            document.getElementById('editPicture').value = '';
            editImagePreview.innerHTML = '';
            editImagePreview.classList.remove('visible');
            editDragDropZone.classList.remove('has-image');
        });
    } else {
        editImageData = null;
    }

    showView('editStudentView');
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
let editImageData = null;
let currentEditingStudentId = null;
let currentProfileStudentId = null;

// Filter and sort state
let currentFilters = {
    class: '',
    section: '',
    sortBy: '',
    searchTerm: ''
};

// Add Student Form Handler
function setupAddStudentForm() {
    const form = document.getElementById('addStudentForm');
    const pictureInput = document.getElementById('picture');
    const imagePreview = document.getElementById('imagePreview');
    const dragDropZone = document.getElementById('dragDropZone');

    if (!form || !pictureInput || !imagePreview || !dragDropZone) return;

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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const validator = new FormValidator('addStudentForm');
        validator.clearErrors();

        // Get form data
        const formData = new FormData(form);
        const studentData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            rollNo: formData.get('rollNo').trim(),
            admissionNo: formData.get('admissionNo').trim(),
            class: formData.get('class'),
            section: formData.get('section'),
            dob: formData.get('dob'),
            picture: currentImageData
        };

        // Validation
        let isValid = true;

        // Required fields
        isValid &= validator.validateRequired('firstName', 'First Name');
        isValid &= validator.validateRequired('lastName', 'Last Name');
        isValid &= validator.validateRequired('rollNo', 'Roll Number');
        isValid &= validator.validateRequired('admissionNo', 'Admission Number');
        isValid &= validator.validateSelect('class', 'Class');
        isValid &= validator.validateSelect('section', 'Section');
        isValid &= validator.validateDate('dob');

        // Uniqueness checks
        if (studentData.rollNo) {
            isValid &= validator.validateUnique('rollNo', 'Roll Number', 
                (rollNo) => studentManager.isRollNumberUnique(rollNo), studentData.rollNo);
        }

        if (studentData.admissionNo) {
            isValid &= validator.validateUnique('admissionNo', 'Admission Number', 
                (admissionNo) => studentManager.isAdmissionNumberUnique(admissionNo), studentData.admissionNo);
        }

        if (!isValid) {
            showNotification('Please fix the errors above', 'error');
            return;
        }

        try {
            await studentManager.addStudent(studentData);
            showNotification('Student added successfully!', 'success');
            resetAddStudentForm();
            showView('homeView');
            await renderStudentsList();
        } catch (error) {
            showNotification(error.message || 'Error adding student. Please try again.', 'error');
            console.error('Error adding student:', error);
        }
    });
}

// Edit Student Form Handler
function setupEditStudentForm() {
    const form = document.getElementById('editStudentForm');
    const editPictureInput = document.getElementById('editPicture');
    const editImagePreview = document.getElementById('editImagePreview');
    const editDragDropZone = document.getElementById('editDragDropZone');

    if (!form || !editPictureInput || !editImagePreview || !editDragDropZone) return;

    // Drag and Drop handlers for edit form
    editDragDropZone.addEventListener('click', () => {
        editPictureInput.click();
    });

    editDragDropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        editDragDropZone.classList.add('drag-over');
    });

    editDragDropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        editDragDropZone.classList.remove('drag-over');
    });

    editDragDropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        editDragDropZone.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                handleEditImageFile(file);
            } else {
                showNotification('Please upload an image file', 'error');
            }
        }
    });

    // Image preview handler for edit form
    editPictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleEditImageFile(file);
        }
    });

    function handleEditImageFile(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification('Image size should be less than 5MB', 'error');
            editPictureInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            editImageData = e.target.result;
            displayEditImagePreview(editImageData);
            editDragDropZone.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    function displayEditImagePreview(imageData) {
        editImagePreview.innerHTML = `
            <div class="image-preview-container">
                <img src="${imageData}" alt="Preview">
                <button type="button" class="remove-image-btn" id="removeEditImageBtn">×</button>
            </div>
        `;
        editImagePreview.classList.add('visible');

        // Add remove button handler
        document.getElementById('removeEditImageBtn').addEventListener('click', () => {
            editImageData = null;
            editPictureInput.value = '';
            editImagePreview.innerHTML = '';
            editImagePreview.classList.remove('visible');
            editDragDropZone.classList.remove('has-image');
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const validator = new FormValidator('editStudentForm');
        validator.clearErrors();

        // Get form data
        const formData = new FormData(form);
        const studentData = {
            firstName: formData.get('firstName').trim(),
            lastName: formData.get('lastName').trim(),
            rollNo: formData.get('rollNo').trim(),
            admissionNo: formData.get('admissionNo').trim(),
            class: formData.get('class'),
            section: formData.get('section'),
            dob: formData.get('dob'),
            picture: editImageData
        };

        // Validation
        let isValid = true;

        // Required fields
        isValid &= validator.validateRequired('editFirstName', 'First Name');
        isValid &= validator.validateRequired('editLastName', 'Last Name');
        isValid &= validator.validateRequired('editRollNo', 'Roll Number');
        isValid &= validator.validateRequired('editAdmissionNo', 'Admission Number');
        isValid &= validator.validateSelect('editClass', 'Class');
        isValid &= validator.validateSelect('editSection', 'Section');
        isValid &= validator.validateDate('editDob');

        // Uniqueness checks (excluding current student)
        if (studentData.rollNo) {
            isValid &= validator.validateUnique('editRollNo', 'Roll Number', 
                (rollNo) => studentManager.isRollNumberUnique(rollNo, currentEditingStudentId), studentData.rollNo);
        }

        if (studentData.admissionNo) {
            isValid &= validator.validateUnique('editAdmissionNo', 'Admission Number', 
                (admissionNo) => studentManager.isAdmissionNumberUnique(admissionNo, currentEditingStudentId), studentData.admissionNo);
        }

        if (!isValid) {
            showNotification('Please fix the errors above', 'error');
            return;
        }

        try {
            await studentManager.updateStudent(currentEditingStudentId, studentData);
            showNotification('Student updated successfully!', 'success');
            currentEditingStudentId = null;
            showView('homeView');
            await renderStudentsList();
        } catch (error) {
            showNotification(error.message || 'Error updating student. Please try again.', 'error');
            console.error('Error updating student:', error);
        }
    });
}

// Data Management Setup
function setupDataManagement() {
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');

    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            try {
                const data = studentManager.exportData();
                showNotification(`Exported ${data.students.length} students successfully!`, 'success');
            } catch (error) {
                showNotification('Error exporting data. Please try again.', 'error');
                console.error('Export error:', error);
            }
        });
    }

    if (importDataBtn) {
        importDataBtn.addEventListener('click', () => {
            importFileInput.click();
        });
    }

    if (importFileInput) {
        importFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (studentManager.importData(data)) {
                    showNotification('Data imported successfully!', 'success');
                    await renderStudentsList();
                } else {
                    showNotification('Invalid file format. Please select a valid backup file.', 'error');
                }
            } catch (error) {
                showNotification('Error importing data. Please check the file format.', 'error');
                console.error('Import error:', error);
            }
            
            // Reset file input
            importFileInput.value = '';
        });
    }
}

// Apply filters and sort
function applyFiltersAndSort() {
    const students = studentManager.getAllStudents();
    const filteredStudents = filterAndSortStudents(students);
    renderStudentsList(filteredStudents);
    
    // Update search results info
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    if (searchResultsInfo) {
        const totalStudents = students.length;
        const filteredCount = filteredStudents.length;
        
        if (filteredCount < totalStudents) {
            searchResultsInfo.textContent = `Showing ${filteredCount} of ${totalStudents} students`;
        } else {
            searchResultsInfo.textContent = '';
        }
    }
}

// Filter and sort students
function filterAndSortStudents(students) {
    let filtered = [...students];

    // Apply search filter
    if (currentFilters.searchTerm) {
        const searchTerm = currentFilters.searchTerm.toLowerCase();
        filtered = filtered.filter(student => {
            const firstName = student.firstName.toLowerCase();
            const lastName = student.lastName.toLowerCase();
            const rollNo = student.rollNo.toLowerCase();
            const admissionNo = student.admissionNo.toLowerCase();
            
            return firstName.includes(searchTerm) || 
                   lastName.includes(searchTerm) || 
                   rollNo.includes(searchTerm) || 
                   admissionNo.includes(searchTerm);
        });
    }

    // Apply class filter
    if (currentFilters.class) {
        filtered = filtered.filter(student => student.class === currentFilters.class);
    }

    // Apply section filter
    if (currentFilters.section) {
        filtered = filtered.filter(student => student.section === currentFilters.section);
    }

    // Apply sorting
    if (currentFilters.sortBy) {
        switch (currentFilters.sortBy) {
            case 'name-asc':
                filtered.sort((a, b) => {
                    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                    return nameA.localeCompare(nameB);
                });
                break;
            case 'name-desc':
                filtered.sort((a, b) => {
                    const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                    const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                    return nameB.localeCompare(nameA);
                });
                break;
            case 'roll-asc':
                filtered.sort((a, b) => {
                    return a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true });
                });
                break;
            case 'roll-desc':
                filtered.sort((a, b) => {
                    return b.rollNo.localeCompare(a.rollNo, undefined, { numeric: true });
                });
                break;
            case 'date-newest':
                filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id));
                break;
            case 'date-oldest':
                filtered.sort((a, b) => parseInt(a.id) - parseInt(b.id));
                break;
        }
    }

    return filtered;
}

// Reset Add Student Form
function resetAddStudentForm() {
    const form = document.getElementById('addStudentForm');
    const imagePreview = document.getElementById('imagePreview');
    const dragDropZone = document.getElementById('dragDropZone');
    
    if (form) {
        form.reset();
    }
    
    if (imagePreview) {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('visible');
    }
    
    if (dragDropZone) {
        dragDropZone.classList.remove('has-image');
    }
    
    currentImageData = null;
}

// Setup Profile Actions
function setupProfileActions() {
    const printStudentBtn = document.getElementById('printStudentBtn');
    if (printStudentBtn) {
        printStudentBtn.addEventListener('click', () => {
            window.print();
        });
    }

    const deleteStudentBtn = document.getElementById('deleteStudentBtn');
    if (deleteStudentBtn) {
        deleteStudentBtn.addEventListener('click', () => {
            if (!currentProfileStudentId) return;
            
            const student = studentManager.getStudent(currentProfileStudentId);
            if (!student) return;

            // Show confirmation dialog
            const confirmed = confirm(
                `Are you sure you want to delete ${student.firstName} ${student.lastName}?\n\n` +
                `Roll Number: ${student.rollNo}\n` +
                `Class: ${student.class} - ${student.section}\n\n` +
                `This action cannot be undone!`
            );

            if (confirmed) {
                deleteStudent(currentProfileStudentId);
            }
        });
    }
}

// Delete student function
async function deleteStudent(studentId) {
    try {
        await studentManager.deleteStudent(studentId);
        showNotification('Student deleted successfully!', 'success');
        currentProfileStudentId = null;
        showView('homeView');
        await renderStudentsList();
    } catch (error) {
        showNotification(error.message || 'Error deleting student. Please try again.', 'error');
        console.error('Error deleting student:', error);
    }
}

// Clear search input and filters
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    
    // Reset filters
    currentFilters = {
        class: '',
        section: '',
        sortBy: '',
        searchTerm: ''
    };
    
    // Reset UI
    if (searchInput) searchInput.value = '';
    if (searchResultsInfo) searchResultsInfo.textContent = '';
    
    const filterClass = document.getElementById('filterClass');
    const filterSection = document.getElementById('filterSection');
    const sortBy = document.getElementById('sortBy');
    
    if (filterClass) filterClass.value = '';
    if (filterSection) filterSection.value = '';
    if (sortBy) sortBy.value = '';
}

// Setup Login
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const userInfoBar = document.getElementById('userInfoBar');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value.trim();
            const password = document.getElementById('loginPassword').value;

            const result = authManager.login(username, password);

            if (result.success) {
                showNotification(`Welcome, ${result.user.name}!`, 'success');
                
                // Update user info bar
                document.getElementById('currentUserName').textContent = result.user.name;
                document.getElementById('currentUserRole').textContent = authManager.getRoleDisplay();
                userInfoBar.style.display = 'flex';

                // Show home view
                showView('homeView');
                renderStudentsList();

                // Update UI based on permissions
                updateUIForRole();
            } else {
                showNotification(result.error, 'error');
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            authManager.logout();
            userInfoBar.style.display = 'none';
            showView('loginView');
            showNotification('Logged out successfully', 'success');
        });
    }

    // Check if already logged in
    if (authManager.isLoggedIn()) {
        const user = authManager.getCurrentUser();
        document.getElementById('currentUserName').textContent = user.name;
        document.getElementById('currentUserRole').textContent = authManager.getRoleDisplay();
        userInfoBar.style.display = 'flex';
        showView('homeView');
        updateUIForRole();
    }
}

// Update UI based on user role
function updateUIForRole() {
    const user = authManager.getCurrentUser();
    if (!user) return;

    const addStudentBtn = document.getElementById('addStudentBtn');
    const deleteStudentBtn = document.getElementById('deleteStudentBtn');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const attendanceViewBtn = document.getElementById('attendanceViewBtn');
    const manageUsersBtn = document.getElementById('manageUsersBtn');

    // Show manage users button only for admins
    if (user.role === 'admin') {
        if (manageUsersBtn) manageUsersBtn.style.display = 'inline-flex';
    }

    // Teachers can't add/delete students
    if (user.role === 'teacher') {
        if (addStudentBtn) addStudentBtn.style.display = 'none';
        if (deleteStudentBtn) deleteStudentBtn.style.display = 'none';
    } else if (user.role === 'student') {
        if (addStudentBtn) addStudentBtn.style.display = 'none';
        if (deleteStudentBtn) deleteStudentBtn.style.display = 'none';
        if (exportDataBtn) exportDataBtn.style.display = 'none';
        if (importDataBtn) importDataBtn.style.display = 'none';
        if (attendanceViewBtn) attendanceViewBtn.style.display = 'none';
    }
}

// Setup Attendance Tracking
function setupAttendance() {
    const attendanceViewBtn = document.getElementById('attendanceViewBtn');
    const backFromAttendanceBtn = document.getElementById('backFromAttendanceBtn');
    const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
    const attendanceDate = document.getElementById('attendanceDate');
    const todayBtn = document.getElementById('todayBtn');
    const viewAttendanceBtn = document.getElementById('viewAttendanceBtn');

    if (attendanceViewBtn) {
        attendanceViewBtn.addEventListener('click', () => {
            showView('attendanceView');
            const today = attendanceManager.getTodayDate();
            document.getElementById('attendanceDate').value = today;
            renderAttendanceList(today);
        });
    }

    if (backFromAttendanceBtn) {
        backFromAttendanceBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (backFromHistoryBtn) {
        backFromHistoryBtn.addEventListener('click', () => {
            showView('profileView');
        });
    }

    if (attendanceDate) {
        attendanceDate.addEventListener('change', (e) => {
            renderAttendanceList(e.target.value);
        });
    }

    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            const today = attendanceManager.getTodayDate();
            document.getElementById('attendanceDate').value = today;
            renderAttendanceList(today);
        });
    }

    if (viewAttendanceBtn) {
        viewAttendanceBtn.addEventListener('click', () => {
            if (currentProfileStudentId) {
                showAttendanceHistory(currentProfileStudentId);
            }
        });
    }
}

// Render Attendance List
function renderAttendanceList(date) {
    const attendanceList = document.getElementById('attendanceList');
    const attendanceStatsSummary = document.getElementById('attendanceStatsSummary');
    
    if (!attendanceList || !attendanceStatsSummary) return;

    const students = studentManager.getAllStudents();
    const attendanceRecords = attendanceManager.getDateAttendance(date);
    
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    attendanceList.innerHTML = '';

    students.forEach(student => {
        const record = attendanceRecords.find(r => r.studentId === student.id);
        const status = record ? record.status : 'not-marked';

        const attendanceItem = document.createElement('div');
        attendanceItem.className = 'attendance-item';
        
        const initials = getInitials(student.firstName, student.lastName);
        const pictureHtml = student.picture 
            ? `<img src="${student.picture}" alt="${student.firstName}">`
            : `<span class="attendance-student-initials">${initials}</span>`;

        attendanceItem.innerHTML = `
            <div class="attendance-student-info">
                <div class="attendance-student-avatar">
                    ${pictureHtml}
                </div>
                <div class="attendance-student-details">
                    <h4>${student.firstName} ${student.lastName}</h4>
                    <p>Roll: ${student.rollNo} | Class ${student.class} - ${student.section}</p>
                </div>
            </div>
            <div class="attendance-status-buttons">
                <button class="attendance-btn present ${status === 'present' ? 'active' : ''}" 
                        data-student-id="${student.id}" data-status="present">
                    ✅ Present
                </button>
                <button class="attendance-btn absent ${status === 'absent' ? 'active' : ''}" 
                        data-student-id="${student.id}" data-status="absent">
                    ❌ Absent
                </button>
                <button class="attendance-btn late ${status === 'late' ? 'active' : ''}" 
                        data-student-id="${student.id}" data-status="late">
                    ⏰ Late
                </button>
            </div>
        `;

        attendanceList.appendChild(attendanceItem);

        // Count statuses
        if (status === 'present') presentCount++;
        else if (status === 'absent') absentCount++;
        else if (status === 'late') lateCount++;
    });

    // Add event listeners to attendance buttons
    attendanceList.querySelectorAll('.attendance-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.dataset.studentId;
            const status = e.target.dataset.status;
            const user = authManager.getCurrentUser();
            
            if (user) {
                attendanceManager.markAttendance(studentId, date, status, user.id);
                
                // Update button states
                const buttons = e.target.parentElement.querySelectorAll('.attendance-btn');
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Re-render to update counts
                renderAttendanceList(date);
            }
        });
    });

    // Update stats summary
    const totalStudents = students.length;
    const markedCount = presentCount + absentCount + lateCount;
    
    attendanceStatsSummary.innerHTML = `
        <div class="stat-badge present">${presentCount} Present</div>
        <div class="stat-badge absent">${absentCount} Absent</div>
        <div class="stat-badge late">${lateCount} Late</div>
        <div class="stat-badge total">${markedCount}/${totalStudents} Marked</div>
    `;
}

// Show Attendance History
function showAttendanceHistory(studentId) {
    const student = studentManager.getStudent(studentId);
    if (!student) return;

    document.getElementById('historyStudentName').textContent = 
        `Attendance History - ${student.firstName} ${student.lastName}`;

    // Get attendance stats
    const stats = attendanceManager.getAttendanceStats(studentId);
    const attendanceStatsCard = document.getElementById('attendanceStatsCard');
    
    attendanceStatsCard.innerHTML = `
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${stats.totalDays}</div>
                <div class="stat-label">Total Days</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.presentDays}</div>
                <div class="stat-label">Present</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.absentDays}</div>
                <div class="stat-label">Absent</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${stats.lateDays}</div>
                <div class="stat-label">Late</div>
            </div>
        </div>
        <div class="attendance-percentage">
            <div class="percentage-circle">
                <span>${stats.attendancePercentage}%</span>
            </div>
            <p>Overall Attendance</p>
        </div>
    `;

    // Get attendance history
    const history = attendanceManager.getStudentAttendance(studentId);
    const attendanceHistoryList = document.getElementById('attendanceHistoryList');
    
    attendanceHistoryList.innerHTML = '';

    if (history.length === 0) {
        attendanceHistoryList.innerHTML = '<p class="no-history">No attendance records found.</p>';
        return;
    }

    history.forEach(record => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date(record.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });

        historyItem.innerHTML = `
            <div class="history-date">${formattedDate}</div>
            <div class="history-status ${record.status}">
                ${record.status === 'present' ? '✅ Present' : 
                  record.status === 'absent' ? '❌ Absent' : 
                  '⏰ Late'}
            </div>
        `;

        attendanceHistoryList.appendChild(historyItem);
    });

    showView('attendanceHistoryView');
}

// Setup User Management
function setupUserManagement() {
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const addUserForm = document.getElementById('addUserForm');
    const userRoleSelect = document.getElementById('userRole');
    const roleDescription = document.getElementById('roleDescription');

    if (manageUsersBtn) {
        manageUsersBtn.addEventListener('click', () => {
            showView('userManagementView');
            renderUsersList();
        });
    }

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showView('addUserView');
            resetAddUserForm();
        });
    }

    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(addUserForm);
            const userData = {
                name: formData.get('name').trim(),
                email: formData.get('email').trim(),
                username: formData.get('username').trim(),
                password: formData.get('password'),
                role: formData.get('role')
            };

            // Basic validation
            if (!userData.name || !userData.email || !userData.username || !userData.password || !userData.role) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (userData.password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            const result = authManager.addUser(userData);
            if (result.success) {
                showNotification('User created successfully', 'success');
                showView('userManagementView');
                renderUsersList();
                resetAddUserForm();
            } else {
                showNotification(result.error, 'error');
            }
        });
    }

    // Show role description when role is selected
    if (userRoleSelect && roleDescription) {
        userRoleSelect.addEventListener('change', (e) => {
            const role = e.target.value;
            
            const descriptions = {
                admin: {
                    title: '👑 Administrator',
                    permissions: [
                        'Add, edit, and delete students',
                        'Mark attendance',
                        'View attendance reports',
                        'Export and import data',
                        'Manage user accounts',
                        'Full system access'
                    ]
                },
                teacher: {
                    title: '👨‍🏫 Teacher',
                    permissions: [
                        'View student information',
                        'Mark attendance',
                        'View attendance reports',
                        'Limited system access'
                    ]
                },
                student: {
                    title: '🎓 Student',
                    permissions: [
                        'View own information only',
                        'View own attendance',
                        'Read-only access'
                    ]
                }
            };

            if (role && descriptions[role]) {
                const desc = descriptions[role];
                roleDescription.innerHTML = `
                    <h4>${desc.title}</h4>
                    <ul>
                        ${desc.permissions.map(perm => `<li>${perm}</li>`).join('')}
                    </ul>
                `;
                roleDescription.classList.add('visible');
            } else {
                roleDescription.classList.remove('visible');
            }
        });
    }
}

// Render Users List
function renderUsersList() {
    const container = document.getElementById('usersListContainer');
    if (!container) return;

    const users = authManager.getAllUsers();
    
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p class="no-users">No users found.</p>';
        return;
    }

    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = 'user-card';
        
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        
        userCard.innerHTML = `
            <div class="user-avatar">
                <span class="user-initials">${initials}</span>
            </div>
            <div class="user-info">
                <h3>${user.name}</h3>
                <p class="user-email">${user.email}</p>
                <p class="user-username">@${user.username}</p>
                <div class="user-role-badge ${user.role}">${authManager.getRoleDisplay(user.role)}</div>
            </div>
            <button class="user-delete-btn" data-user-id="${user.id}" title="Delete User">
                🗑️
            </button>
        `;

        container.appendChild(userCard);
    });

    // Add delete button handlers
    container.querySelectorAll('.user-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const userId = e.target.dataset.userId;
            const user = authManager.getAllUsers().find(u => u.id === userId);
            
            if (user) {
                const confirmed = confirm(
                    `Are you sure you want to delete user "${user.name}"?\n\n` +
                    `Username: ${user.username}\n` +
                    `Role: ${authManager.getRoleDisplay(user.role)}\n\n` +
                    `This action cannot be undone!`
                );
                
                if (confirmed) {
                    const result = authManager.deleteUser(userId);
                    if (result.success) {
                        showNotification('User deleted successfully', 'success');
                        renderUsersList();
                    } else {
                        showNotification(result.error, 'error');
                    }
                }
            }
        });
    });
}

// Reset add user form
function resetAddUserForm() {
    const form = document.getElementById('addUserForm');
    const roleDescription = document.getElementById('roleDescription');
    
    if (form) {
        form.reset();
        roleDescription.classList.remove('visible');
    }
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Initialize Application
async function init() {
    try {
        setupLogin();
        setupNavigation();
        setupAddStudentForm();
        setupEditStudentForm();
        setupDataManagement();
        setupSearchBar();
        setupFiltersAndSort();
        setupAttendance();
        setupUserManagement();
        setupProfileActions();
        
        // Only render if logged in
        if (authManager.isLoggedIn()) {
            await renderStudentsList();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Global instances
const studentManager = new StudentManager();
const authManager = new AuthManager();
const attendanceManager = new AttendanceManager();

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
