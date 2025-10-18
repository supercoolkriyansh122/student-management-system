# Student Management System

A modern web application for managing student information with a backend server, allowing data access from any device or browser.

## 🚀 Quick Start

### Prerequisites
- Node.js (version 14 or higher) - [Download here](https://nodejs.org/)

### Installation & Setup

1. **Install Node.js** (if not already installed)
   - Download from https://nodejs.org/
   - Install and verify by running: `node --version`

2. **Install Dependencies**
   ```bash
   cd C:\Users\super\student-management
   npm install
   ```

3. **Start the Server**
   ```bash
   npm start
   ```
   
4. **Open the Application**
   - Open your browser and go to: http://localhost:3000
   - The application will now work from any device on your network!

5. **Access from Other Devices** (Optional)
   - Find your computer's IP address (run `ipconfig` in terminal)
   - On other devices on the same network, visit: http://YOUR_IP:3000

## Features

### Home View
- **Student Cards**: Displays all students in a clean grid layout with their name, roll number, and class/section
- **Clickable Cards**: Click any student card to view their complete profile
- **Add Student Button**: Positioned in the top-right corner for easy access
- **Empty State**: Shows a friendly message when no students are present

### Add Student Form
- **Required Fields**:
  - First Name
  - Last Name
  - Roll Number (must be unique)
  - Admission Number (must be unique)
  - Class (dropdown: Class 1-12)
  - Section (dropdown: A, B, C, D)
  - Date of Birth
  
- **Optional Fields**:
  - Profile Picture (with image preview)

### Student Profile View
- Displays complete student information in a beautiful card layout
- Shows profile picture or initials if no picture is uploaded
- Easy navigation back to the home view

## Key Features

✅ **Data Persistence**: All student data is saved in browser LocalStorage
✅ **Form Validation**: 
  - Required field validation
  - Unique Roll Number validation
  - Unique Admission Number validation
  - Date of Birth validation (must be in the past, minimum age 3 years)
  - Image size validation (max 5MB)
  
✅ **Modern UI/UX**:
  - Clean, professional design
  - Smooth transitions and hover effects
  - Responsive layout for all screen sizes
  - Toast notifications (no browser alerts)
  - Image upload with preview
  
✅ **Bug-Free**: Comprehensive error handling and validation

## How to Use

1. **Start the Server** (if not already running)
   - Run `npm start` in the project directory
   - Server will start on http://localhost:3000

2. **Add a Student**
   - Click the "Add Student" button in the top-right corner
   - Fill in all required fields (marked with *)
   - Optionally upload a profile picture
   - Click "Add Student" to save
   - The form will return to the Home View automatically

3. **View Student Profile**
   - Click on any student card in the Home View
   - View all student details
   - Click "Back" to return to the Home View

4. **Data Persistence**
   - All data is automatically saved to a server-side JSON file
   - Students will remain even after closing the browser
   - Data is accessible from any device or browser on the same network
   - Your data is stored locally on your server, not on any external service

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript (no frameworks required)
- **Backend**: Node.js with Express server
- **Storage**: JSON file storage (students-data.json)
- **API**: RESTful API for all CRUD operations
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Browser Compatibility**: Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- **Network Access**: Can be accessed from any device on your local network

## File Structure

```
student-management/
│
├── index.html           # Main HTML structure
├── styles.css           # All styling and responsive design
├── script.js            # Frontend JavaScript with API integration
├── server.js            # Node.js backend server
├── package.json         # Node.js dependencies
├── students-data.json   # Database file (auto-generated)
└── README.md            # This file
```

## Data Storage

The application uses a JSON file (students-data.json) to persist data on the server. To manage data:
- **View Data**: Open `students-data.json` in any text editor
- **Backup Data**: Copy the `students-data.json` file
- **Clear Data**: Delete `students-data.json` and restart the server
- **Export Data**: The JSON file can be imported into any database

## Notes

- Profile pictures are stored as base64 encoded strings in the JSON database
- Maximum image size is 5MB
- Students must be at least 3 years old
- Roll Numbers and Admission Numbers must be unique across all students
- Validation happens both client-side (instant feedback) and server-side (data integrity)
- Server must be running for the application to work

## Future Enhancements

Possible additions for future versions:
- Edit student information
- Delete students
- Search and filter functionality
- Export data to CSV/PDF
- Print student profiles
- Batch import of students
- Backend integration for multi-device sync

---

**Created**: October 2025
**Version**: 1.0.0

