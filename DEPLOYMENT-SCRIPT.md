# Student Management System - Deployment Script

This script helps you deploy your Student Management System to Netlify with automatic updates.

## 🚀 Quick Start Commands

### For Git Users (Recommended):

```bash
# 1. Initialize Git repository
git init

# 2. Add all files
git add .

# 3. Create initial commit
git commit -m "Initial commit - Student Management System with auto-deployment"

# 4. Add GitHub remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/student-management-system.git

# 5. Push to GitHub
git push -u origin main
```

### For Manual Updates (After Initial Setup):

```bash
# 1. Add changes
git add .

# 2. Commit changes
git commit -m "Updated: [Describe your changes]"

# 3. Push to GitHub
git push origin main
```

## 📋 Step-by-Step Setup

### Step 1: Install Git
1. Download from: https://git-scm.com/download/win
2. Install with default settings
3. Restart your terminal

### Step 2: Create GitHub Repository
1. Go to: https://github.com
2. Click "New Repository"
3. Name: `student-management-system`
4. Make it **Public**
5. Click "Create Repository"

### Step 3: Connect to Netlify
1. Go to: https://app.netlify.com
2. Click "New site from Git"
3. Choose "GitHub"
4. Select your repository
5. Click "Deploy site"

## 🔄 Auto-Deployment Workflow

Once set up, here's what happens:

1. **I make changes** to your code
2. **I run**: `git add . && git commit -m "Fix: [description]" && git push`
3. **Netlify detects** the changes automatically
4. **Your website updates** within 1-2 minutes!

## 📁 Project Structure

```
student-management/
├── index.html              # Main application
├── styles.css              # Styling
├── script.js               # JavaScript functionality
├── package.json            # Dependencies
├── server.js               # Backend server (optional)
├── .gitignore              # Git ignore rules
├── netlify.toml            # Netlify configuration
└── README.md               # Documentation
```

## 🛠️ Manual Deployment (Alternative)

If you prefer manual updates:

1. **Make changes** to your files
2. **Zip the folder** (excluding node_modules)
3. **Drag to Netlify** dashboard
4. **Site updates** immediately

## 📞 Support

Need help? Let me know and I'll guide you through any step!

---

**Ready to set up auto-deployment?** Follow the steps above, and I'll help you push the code to GitHub and connect it to Netlify!
