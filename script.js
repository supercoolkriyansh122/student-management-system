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

    // Update student
    async updateStudent(id, updatedData) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) {
            throw new Error('Student not found');
        }

        this.students[index] = { ...this.students[index], ...updatedData, id };
        this.saveToLocalStorage();
        return this.students[index];
    }

    // Delete student
    async deleteStudent(id) {
        const index = this.students.findIndex(s => s.id === id);
        if (index === -1) {
            throw new Error('Student not found');
        }

        this.students.splice(index, 1);
        this.saveToLocalStorage();
        return true;
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

// Global instances
// Note: authManager and attendanceManager are created in auth.js
// studentManager is created here because StudentManager class is in this file
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

        // Search bar is always visible
        if (searchBar) {
            searchBar.style.display = 'block';
        }

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
                    <button class="student-edit-btn" data-id="${student.id}" title="Edit Student">✏️</button>
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
                
                // Add click listener to card (but not edit button)
                card.addEventListener('click', (e) => {
                    // Don't trigger if edit button was clicked
                    if (e.target.closest('.student-edit-btn')) {
                        return;
                    }
                    const studentId = card.dataset.id;
                    showStudentProfile(studentId);
                });
            });

            // Add click listeners to edit buttons
            document.querySelectorAll('.student-edit-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent card click
                    const studentId = btn.dataset.id;
                    showEditStudent(studentId);
                });
            });
        }
    } catch (error) {
        console.error('Error rendering students list:', error);
        showNotification('Error loading students. Please refresh the page.', 'error');
    }
}

function getInitials(firstName, lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

// Filter and sort state
let currentFilters = {
    class: '',
    section: '',
    sortBy: '',
    searchTerm: ''
};

// Filter and Sort Students
function filterAndSortStudents(students) {
    let filtered = [...students];

    // Apply search filter
    if (currentFilters.searchTerm) {
        const searchTerm = currentFilters.searchTerm.toLowerCase();
        filtered = filtered.filter(student => {
            const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
            const rollNo = student.rollNo.toLowerCase();
            const admissionNo = student.admissionNo.toLowerCase();
            
            return fullName.includes(searchTerm) || 
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

// Apply filters and update view
function applyFiltersAndSort() {
    const allStudents = studentManager.getAllStudents();
    const filteredStudents = filterAndSortStudents(allStudents);
    
    // Update results info
    const searchResultsInfo = document.getElementById('searchResultsInfo');
    if (searchResultsInfo) {
        const activeFilters = [];
        if (currentFilters.searchTerm) activeFilters.push('search');
        if (currentFilters.class) activeFilters.push('class');
        if (currentFilters.section) activeFilters.push('section');
        
        if (activeFilters.length > 0 || filteredStudents.length !== allStudents.length) {
            searchResultsInfo.textContent = `Showing ${filteredStudents.length} of ${allStudents.length} student${allStudents.length === 1 ? '' : 's'}`;
        } else {
            searchResultsInfo.textContent = '';
        }
    }
    
    renderStudentsList(filteredStudents);
}

// Search functionality
function setupSearchBar() {
    const searchInput = document.getElementById('searchInput');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        currentFilters.searchTerm = e.target.value.trim();
        applyFiltersAndSort();
    });
}

// Setup Filters and Sort
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

// Edit Student Form Handler
function setupEditStudentForm() {
    const form = document.getElementById('editStudentForm');
    const pictureInput = document.getElementById('editPicture');
    const imagePreview = document.getElementById('editImagePreview');
    const dragDropZone = document.getElementById('editDragDropZone');

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
                handleEditImageFile(file);
            } else {
                showNotification('Please upload an image file', 'error');
            }
        }
    });

    // Image preview handler
    pictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleEditImageFile(file);
        }
    });

    function handleEditImageFile(file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification('Image size should be less than 5MB', 'error');
            pictureInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            editImageData = e.target.result;
            displayEditImagePreview(editImageData);
            dragDropZone.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }

    function displayEditImagePreview(imageData) {
        imagePreview.innerHTML = `
            <div class="image-preview-container">
                <img src="${imageData}" alt="Preview">
                <button type="button" class="remove-image-btn" id="removeEditImageBtn">×</button>
            </div>
        `;
        imagePreview.classList.add('visible');

        // Add remove button handler
        document.getElementById('removeEditImageBtn').addEventListener('click', removeEditImage);
    }

    function removeEditImage() {
        editImageData = null;
        pictureInput.value = '';
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('visible');
        dragDropZone.classList.remove('has-image');
    }

    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const validator = new FormValidator('editStudentForm');
        validator.clearErrors();

        // Validate all fields
        let isValid = true;

        isValid = validator.validateRequired('editFirstName', 'First Name') && isValid;
        isValid = validator.validateRequired('editLastName', 'Last Name') && isValid;
        
        const rollNo = document.getElementById('editRollNo').value.trim();
        isValid = validator.validateRequired('editRollNo', 'Roll Number') && isValid;
        if (isValid && rollNo) {
            isValid = validator.validateUnique(
                'editRollNo', 
                'Roll Number', 
                (val) => studentManager.isRollNoUnique(val, currentEditingStudentId),
                rollNo
            ) && isValid;
        }

        const admissionNo = document.getElementById('editAdmissionNo').value.trim();
        isValid = validator.validateRequired('editAdmissionNo', 'Admission Number') && isValid;
        if (isValid && admissionNo) {
            isValid = validator.validateUnique(
                'editAdmissionNo', 
                'Admission Number', 
                (val) => studentManager.isAdmissionNoUnique(val, currentEditingStudentId),
                admissionNo
            ) && isValid;
        }

        isValid = validator.validateSelect('editClass', 'Class') && isValid;
        isValid = validator.validateSelect('editSection', 'Section') && isValid;
        isValid = validator.validateDate('editDob') && isValid;

        if (!validator.isValid()) {
            showNotification('Please fix the errors in the form', 'error');
            return;
        }

        // Get form data
        const formData = {
            firstName: document.getElementById('editFirstName').value.trim(),
            lastName: document.getElementById('editLastName').value.trim(),
            rollNo: rollNo,
            admissionNo: admissionNo,
            class: document.getElementById('editClass').value,
            section: document.getElementById('editSection').value,
            dob: document.getElementById('editDob').value,
            picture: editImageData
        };

        // Update student
        updateStudent(currentEditingStudentId, formData);
    });
}

async function updateStudent(studentId, formData) {
    try {
        await studentManager.updateStudent(studentId, formData);
        showNotification('Student updated successfully!', 'success');
        resetEditStudentForm();
        showView('homeView');
        await renderStudentsList();
    } catch (error) {
        showNotification(error.message || 'Error updating student. Please try again.', 'error');
        console.error('Error updating student:', error);
    }
}

function resetEditStudentForm() {
    const form = document.getElementById('editStudentForm');
    const dragDropZone = document.getElementById('editDragDropZone');
    const imagePreview = document.getElementById('editImagePreview');
    
    // Reset global image data
    editImageData = null;
    currentEditingStudentId = null;
    
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

    // Back from Edit Student
    const backFromEditBtn = document.getElementById('backFromEditBtn');
    if (backFromEditBtn) {
        backFromEditBtn.addEventListener('click', () => {
            resetEditStudentForm();
            showView('homeView');
            clearSearch();
        });
    }

    // Cancel Edit button
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            resetEditStudentForm();
            showView('homeView');
            clearSearch();
        });
    }

    // Back from Profile
    document.getElementById('backFromProfileBtn').addEventListener('click', () => {
        showView('homeView');
        clearSearch();
    });

    // Print Student button
    const printStudentBtn = document.getElementById('printStudentBtn');
    if (printStudentBtn) {
        printStudentBtn.addEventListener('click', () => {
            if (!currentProfileStudentId) return;
            
            const student = studentManager.getStudent(currentProfileStudentId);
            if (!student) return;

            // Add print date to profile card
            const profileCard = document.querySelector('.profile-card');
            if (profileCard) {
                const currentDate = new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                profileCard.setAttribute('data-print-date', currentDate);
            }

            // Trigger print dialog
            window.print();
            
            showNotification('Print dialog opened', 'success');
        });
    }

    // Delete Student button
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
    const students = studentManager.getAllStudents();
    const attendanceList = document.getElementById('attendanceList');
    const statsSummary = document.getElementById('attendanceStatsSummary');

    if (!attendanceList) return;

    if (students.length === 0) {
        attendanceList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No students to track attendance for.</div>';
        return;
    }

    // Get today's attendance
    const dateAttendance = attendanceManager.getDateAttendance(date);
    const stats = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        unmarked: 0
    };

    attendanceList.innerHTML = students.map(student => {
        const todayStatus = dateAttendance.find(a => a.studentId === student.id)?.status || null;
        
        if (todayStatus) {
            stats[todayStatus]++;
        } else {
            stats.unmarked++;
        }

        return `
            <div class="attendance-item" data-student-id="${student.id}">
                <div class="attendance-student-info">
                    <div class="attendance-student-avatar">
                        ${student.picture ? 
                            `<img src="${student.picture}" alt="${student.firstName}">` : 
                            `<span>${getInitials(student.firstName, student.lastName)}</span>`
                        }
                    </div>
                    <div class="attendance-student-details">
                        <h4>${student.firstName} ${student.lastName}</h4>
                        <p>Roll: ${student.rollNo} | Class ${student.class} - ${student.section}</p>
                    </div>
                </div>
                <div class="attendance-status-buttons">
                    <button class="attendance-btn present ${todayStatus === 'present' ? 'active' : ''}" 
                            data-student-id="${student.id}" data-status="present">
                        ✓ Present
                    </button>
                    <button class="attendance-btn absent ${todayStatus === 'absent' ? 'active' : ''}" 
                            data-student-id="${student.id}" data-status="absent">
                        ✗ Absent
                    </button>
                    <button class="attendance-btn late ${todayStatus === 'late' ? 'active' : ''}" 
                            data-student-id="${student.id}" data-status="late">
                        ⏰ Late
                    </button>
                    <button class="attendance-btn excused ${todayStatus === 'excused' ? 'active' : ''}" 
                            data-student-id="${student.id}" data-status="excused">
                        📋 Excused
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Add click listeners to attendance buttons
    document.querySelectorAll('.attendance-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const studentId = this.dataset.studentId;
            const status = this.dataset.status;
            const date = document.getElementById('attendanceDate').value;
            
            // Mark attendance
            const user = authManager.getCurrentUser();
            attendanceManager.markAttendance(studentId, date, status, user.name);

            // Update UI - remove active from all buttons for this student
            const item = this.closest('.attendance-item');
            item.querySelectorAll('.attendance-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            showNotification('Attendance marked successfully', 'success');
            
            // Update stats
            renderAttendanceList(date);
        });
    });

    // Update stats summary
    if (statsSummary) {
        statsSummary.innerHTML = `
            <div class="stat-badge">
                <span class="stat-badge-value" style="color: var(--success-color);">${stats.present}</span>
                <span class="stat-badge-label">Present</span>
            </div>
            <div class="stat-badge">
                <span class="stat-badge-value" style="color: var(--error-color);">${stats.absent}</span>
                <span class="stat-badge-label">Absent</span>
            </div>
            <div class="stat-badge">
                <span class="stat-badge-value" style="color: var(--warning-color);">${stats.late}</span>
                <span class="stat-badge-label">Late</span>
            </div>
            <div class="stat-badge">
                <span class="stat-badge-value" style="color: var(--secondary-color);">${stats.excused}</span>
                <span class="stat-badge-label">Excused</span>
            </div>
            <div class="stat-badge">
                <span class="stat-badge-value" style="color: var(--text-secondary);">${stats.unmarked}</span>
                <span class="stat-badge-label">Unmarked</span>
            </div>
        `;
    }
}

// Show Attendance History
function showAttendanceHistory(studentId) {
    const student = studentManager.getStudent(studentId);
    if (!student) return;

    // Update header
    document.getElementById('historyStudentName').textContent = 
        `Attendance History - ${student.firstName} ${student.lastName}`;

    // Get attendance stats (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const stats = attendanceManager.getAttendanceStats(studentId, startDate, endDate);
    const records = attendanceManager.getStudentAttendance(studentId, startDate, endDate);

    // Render stats
    const statsCard = document.getElementById('attendanceStatsCard');
    if (statsCard) {
        statsCard.innerHTML = `
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Last 30 Days Statistics</h3>
            <div class="attendance-percentage">${stats.percentage}%</div>
            <p style="text-align: center; color: var(--text-secondary); margin-bottom: 1.5rem;">
                Attendance Rate
            </p>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-item-value present">${stats.present}</div>
                    <div class="stat-item-label">Present</div>
                </div>
                <div class="stat-item">
                    <div class="stat-item-value absent">${stats.absent}</div>
                    <div class="stat-item-label">Absent</div>
                </div>
                <div class="stat-item">
                    <div class="stat-item-value late">${stats.late}</div>
                    <div class="stat-item-label">Late</div>
                </div>
                <div class="stat-item">
                    <div class="stat-item-value excused">${stats.excused}</div>
                    <div class="stat-item-label">Excused</div>
                </div>
                <div class="stat-item">
                    <div class="stat-item-value">${stats.total}</div>
                    <div class="stat-item-label">Total Days</div>
                </div>
            </div>
        `;
    }

    // Render history
    const historyList = document.getElementById('attendanceHistoryList');
    if (historyList) {
        if (records.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No attendance records found for the last 30 days.</div>';
        } else {
            historyList.innerHTML = records.map(record => `
                <div class="history-item">
                    <span class="history-date">${formatDate(record.date)}</span>
                    <span class="history-status ${record.status}">${record.status.toUpperCase()}</span>
                </div>
            `).join('');
        }
    }

    showView('attendanceHistoryView');
}

// Setup User Management
function setupUserManagement() {
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const backFromUsersBtn = document.getElementById('backFromUsersBtn');
    const addUserBtn = document.getElementById('addUserBtn');
    const backFromAddUserBtn = document.getElementById('backFromAddUserBtn');
    const cancelUserBtn = document.getElementById('cancelUserBtn');
    const addUserForm = document.getElementById('addUserForm');
    const userRoleSelect = document.getElementById('userRole');
    const roleDescription = document.getElementById('roleDescription');

    if (manageUsersBtn) {
        manageUsersBtn.addEventListener('click', () => {
            showView('userManagementView');
            renderUsersList();
        });
    }

    if (backFromUsersBtn) {
        backFromUsersBtn.addEventListener('click', () => {
            showView('homeView');
        });
    }

    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showView('addUserView');
            resetAddUserForm();
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
                        'View all students',
                        'Edit student information',
                        'Mark attendance',
                        'View attendance reports',
                        'Cannot delete students or manage users'
                    ]
                },
                student: {
                    title: '🎓 Student',
                    permissions: [
                        'View all students',
                        'View own attendance history',
                        'Cannot edit or delete',
                        'Read-only access'
                    ]
                }
            };

            if (role && descriptions[role]) {
                const desc = descriptions[role];
                roleDescription.innerHTML = `
                    <h4>${desc.title} Permissions:</h4>
                    <ul>
                        ${desc.permissions.map(p => `<li>${p}</li>`).join('')}
                    </ul>
                `;
                roleDescription.classList.add('visible');
            } else {
                roleDescription.classList.remove('visible');
            }
        });
    }

    // Handle add user form submission
    if (addUserForm) {
        addUserForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const username = document.getElementById('userUsername').value.trim();
            const password = document.getElementById('userPassword').value;
            const role = document.getElementById('userRole').value;

            // Validate
            if (!name || !email || !username || !password || !role) {
                showNotification('Please fill in all fields', 'error');
                return;
            }

            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }

            // Create user
            const result = authManager.addUser({
                name,
                email,
                username,
                password,
                role
            });

            if (result.success) {
                showNotification('User created successfully!', 'success');
                showView('userManagementView');
                renderUsersList();
                resetAddUserForm();
            } else {
                showNotification(result.error, 'error');
            }
        });
    }
}

// Render users list
function renderUsersList() {
    const container = document.getElementById('usersListContainer');
    if (!container) return;

    const users = authManager.getAllUsers();

    if (users.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 3rem; color: var(--text-secondary);">No users found.</div>';
        return;
    }

    container.innerHTML = users.map(user => {
        const roleIcons = {
            admin: '👑',
            teacher: '👨‍🏫',
            student: '🎓'
        };

        const canDelete = user.id !== '1' && user.id !== authManager.getCurrentUser()?.id;

        return `
            <div class="user-card">
                ${canDelete ? `<button class="user-delete-btn" data-user-id="${user.id}" title="Delete User">🗑️</button>` : ''}
                <div class="user-card-header">
                    <div class="user-avatar">${roleIcons[user.role] || '👤'}</div>
                    <div class="user-info-content">
                        <h3>${user.name}</h3>
                        <p>${user.email}</p>
                        <span class="user-role-badge ${user.role}">${user.role}</span>
                    </div>
                </div>
                <div class="user-card-details">
                    <div class="user-detail-row">
                        <span>Username:</span>
                        <span>${user.username}</span>
                    </div>
                    <div class="user-detail-row">
                        <span>Password:</span>
                        <span>${user.password}</span>
                    </div>
                    ${user.createdAt ? `
                        <div class="user-detail-row">
                            <span>Created:</span>
                            <span>${new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Add delete listeners
    document.querySelectorAll('.user-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userId = btn.dataset.userId;
            const user = authManager.users.find(u => u.id === userId);
            
            if (!user) return;

            const confirmed = confirm(
                `Are you sure you want to delete user "${user.name}"?\n\n` +
                `Username: ${user.username}\n` +
                `Role: ${user.role}\n\n` +
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
        
        // Only render if logged in
        if (authManager.isLoggedIn()) {
            await renderStudentsList();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Run when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}