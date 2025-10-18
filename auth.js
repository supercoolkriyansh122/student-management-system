// Authentication and Authorization System

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
    }

    // Load users from localStorage
    loadUsers() {
        const users = localStorage.getItem('users');
        if (!users) {
            // Initialize with default admin account
            const defaultUsers = [
                {
                    id: '1',
                    username: 'admin',
                    password: 'admin123', // In production, this should be hashed
                    role: 'admin',
                    name: 'Administrator',
                    email: 'admin@school.com'
                },
                {
                    id: '2',
                    username: 'teacher',
                    password: 'teacher123',
                    role: 'teacher',
                    name: 'John Teacher',
                    email: 'teacher@school.com'
                }
            ];
            localStorage.setItem('users', JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(users);
    }

    // Save users to localStorage
    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    // Login
    login(username, password) {
        const user = this.users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            this.currentUser = { ...user };
            delete this.currentUser.password; // Don't store password in session
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            return { success: true, user: this.currentUser };
        }

        return { success: false, error: 'Invalid username or password' };
    }

    // Logout
    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }

    // Check if logged in
    isLoggedIn() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return !!this.currentUser;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check permissions
    hasPermission(permission) {
        if (!this.currentUser) return false;

        const permissions = {
            admin: ['view', 'add', 'edit', 'delete', 'attendance', 'reports', 'manage_users'],
            teacher: ['view', 'edit', 'attendance', 'reports'],
            student: ['view_own']
        };

        return permissions[this.currentUser.role]?.includes(permission) || false;
    }

    // Get role display name
    getRoleDisplay() {
        const roles = {
            admin: 'Administrator',
            teacher: 'Teacher',
            student: 'Student'
        };
        return roles[this.currentUser?.role] || 'Unknown';
    }

    // Add new user (admin only)
    addUser(userData) {
        // Check if username already exists
        if (this.users.some(u => u.username === userData.username)) {
            return { success: false, error: 'Username already exists' };
        }

        // Check if email already exists
        if (this.users.some(u => u.email === userData.email)) {
            return { success: false, error: 'Email already exists' };
        }

        const newUser = {
            id: Date.now().toString(),
            username: userData.username,
            password: userData.password,
            role: userData.role,
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString(),
            createdBy: this.currentUser?.name || 'System'
        };

        this.users.push(newUser);
        this.saveUsers();

        return { success: true, user: newUser };
    }

    // Get all users (admin only)
    getAllUsers() {
        return this.users.map(u => ({
            ...u,
            password: '••••••••' // Hide password
        }));
    }

    // Delete user (admin only)
    deleteUser(userId) {
        if (userId === '1') {
            return { success: false, error: 'Cannot delete default admin account' };
        }

        if (userId === this.currentUser?.id) {
            return { success: false, error: 'Cannot delete your own account' };
        }

        const index = this.users.findIndex(u => u.id === userId);
        if (index === -1) {
            return { success: false, error: 'User not found' };
        }

        this.users.splice(index, 1);
        this.saveUsers();

        return { success: true };
    }

    // Check if username is unique
    isUsernameUnique(username, excludeId = null) {
        return !this.users.some(u => 
            u.username.toLowerCase() === username.toLowerCase() && u.id !== excludeId
        );
    }

    // Check if email is unique
    isEmailUnique(email, excludeId = null) {
        return !this.users.some(u => 
            u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId
        );
    }
}

// Attendance Manager
class AttendanceManager {
    constructor() {
        this.attendance = this.loadAttendance();
    }

    // Load attendance from localStorage
    loadAttendance() {
        const data = localStorage.getItem('attendance');
        return data ? JSON.parse(data) : [];
    }

    // Save attendance to localStorage
    saveAttendance() {
        localStorage.setItem('attendance', JSON.stringify(this.attendance));
    }

    // Mark attendance for a student
    markAttendance(studentId, date, status, markedBy) {
        const record = {
            id: Date.now().toString(),
            studentId,
            date,
            status, // 'present', 'absent', 'late', 'excused'
            markedBy,
            markedAt: new Date().toISOString()
        };

        // Remove existing record for same student and date
        this.attendance = this.attendance.filter(a => 
            !(a.studentId === studentId && a.date === date)
        );

        this.attendance.push(record);
        this.saveAttendance();
        return record;
    }

    // Get attendance for a student
    getStudentAttendance(studentId, startDate = null, endDate = null) {
        let records = this.attendance.filter(a => a.studentId === studentId);

        if (startDate) {
            records = records.filter(a => a.date >= startDate);
        }
        if (endDate) {
            records = records.filter(a => a.date <= endDate);
        }

        return records.sort((a, b) => b.date.localeCompare(a.date));
    }

    // Get attendance for a date
    getDateAttendance(date) {
        return this.attendance.filter(a => a.date === date);
    }

    // Get attendance statistics
    getAttendanceStats(studentId, startDate = null, endDate = null) {
        const records = this.getStudentAttendance(studentId, startDate, endDate);
        
        const stats = {
            total: records.length,
            present: records.filter(a => a.status === 'present').length,
            absent: records.filter(a => a.status === 'absent').length,
            late: records.filter(a => a.status === 'late').length,
            excused: records.filter(a => a.status === 'excused').length
        };

        stats.percentage = stats.total > 0 
            ? ((stats.present + stats.late) / stats.total * 100).toFixed(1)
            : 0;

        return stats;
    }

    // Get today's date in YYYY-MM-DD format
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Check if attendance is marked for student today
    isMarkedToday(studentId) {
        const today = this.getTodayDate();
        return this.attendance.some(a => 
            a.studentId === studentId && a.date === today
        );
    }

    // Get today's attendance status for a student
    getTodayStatus(studentId) {
        const today = this.getTodayDate();
        const record = this.attendance.find(a => 
            a.studentId === studentId && a.date === today
        );
        return record?.status || null;
    }
}

// Initialize Auth and Attendance Managers
const authManager = new AuthManager();
const attendanceManager = new AttendanceManager();

