// Student Management System - Backend Server
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'students-data.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(express.static(__dirname)); // Serve static files

// Initialize data file if it doesn't exist
async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
}

// Read students from file
async function readStudents() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading students:', error);
        return [];
    }
}

// Write students to file
async function writeStudents(students) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(students, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing students:', error);
        return false;
    }
}

// API Routes

// Get all students
app.get('/api/students', async (req, res) => {
    try {
        const students = await readStudents();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

// Get single student by ID
app.get('/api/students/:id', async (req, res) => {
    try {
        const students = await readStudents();
        const student = students.find(s => s.id === req.params.id);
        
        if (student) {
            res.json(student);
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch student' });
    }
});

// Add new student
app.post('/api/students', async (req, res) => {
    try {
        const students = await readStudents();
        const newStudent = req.body;
        
        // Validate required fields
        if (!newStudent.firstName || !newStudent.lastName || !newStudent.rollNo || 
            !newStudent.admissionNo || !newStudent.class || !newStudent.section || !newStudent.dob) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check for unique roll number
        const rollNoExists = students.some(s => 
            s.rollNo.toLowerCase() === newStudent.rollNo.toLowerCase()
        );
        if (rollNoExists) {
            return res.status(400).json({ error: 'Roll Number already exists' });
        }
        
        // Check for unique admission number
        const admissionNoExists = students.some(s => 
            s.admissionNo.toLowerCase() === newStudent.admissionNo.toLowerCase()
        );
        if (admissionNoExists) {
            return res.status(400).json({ error: 'Admission Number already exists' });
        }
        
        // Add student with ID
        newStudent.id = Date.now().toString();
        students.push(newStudent);
        
        const success = await writeStudents(students);
        if (success) {
            res.status(201).json(newStudent);
        } else {
            res.status(500).json({ error: 'Failed to save student' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to add student' });
    }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
    try {
        const students = await readStudents();
        const index = students.findIndex(s => s.id === req.params.id);
        
        if (index === -1) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const updatedStudent = { ...students[index], ...req.body, id: req.params.id };
        students[index] = updatedStudent;
        
        const success = await writeStudents(students);
        if (success) {
            res.json(updatedStudent);
        } else {
            res.status(500).json({ error: 'Failed to update student' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update student' });
    }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
    try {
        const students = await readStudents();
        const filteredStudents = students.filter(s => s.id !== req.params.id);
        
        if (students.length === filteredStudents.length) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        const success = await writeStudents(filteredStudents);
        if (success) {
            res.json({ message: 'Student deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete student' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

// Start server
async function startServer() {
    await initDataFile();
    app.listen(PORT, () => {
        console.log(`
╔════════════════════════════════════════════════════╗
║   Student Management System - Server Running      ║
╠════════════════════════════════════════════════════╣
║   URL: http://localhost:${PORT}                      ║
║   API: http://localhost:${PORT}/api/students         ║
║                                                    ║
║   Press Ctrl+C to stop the server                 ║
╚════════════════════════════════════════════════════╝
        `);
    });
}

startServer();

