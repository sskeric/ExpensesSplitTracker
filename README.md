# 💸 SplitRecord — Expense Tracking & Split System

A full-stack web application for tracking shared expenses within groups. Members can record expenses, make partial or full payments, and monitor who has paid what — all in real time.


# ✨ Features
+ Group management — Create groups, add/remove registered members
+ Expense tracking — Log expenses with description and total amount
+ Partial payments — Members record how much they paid toward each expense (capped at remaining amount)
+ Payment breakdown — Visual progress bar and per-user payment summary on every expense
+ Summary dashboard — Total expenses, total paid, remaining balance with per-user contribution
+ Secure authentication — JWT-based login, bcrypt password hashing, invite-code signup
+ Form validation — Real-time field validation with password strength indicator on signup
+ Role-based actions — Only group creators can add/remove members and delete groups

# 🛠 Tech Stack
+ Frontend: HTML, CSS, Vanilla JavaScript
+ Backend: Node.js, Express.js
+ Database: MongoDB (Mongoose ODM)
+ Authentication: JWT (JSON Web Tokens) + bcrypt
+ Deployment: Render (backend) + Vercel (frontend) + MongoDB Atlas
+ Version Control: GitHub

# 🔄 System Workflow
+ User signs up using a secret invite code, then logs in
+ User creates a group and adds registered members
+ Any member adds an expense with a description and total amount
+ Members individually record how much they paid toward each expense
+ System caps each payment at the remaining unpaid amount
+ Dashboard updates totals and per-user breakdown in real time

# 🔒 Security
- Passwords hashed using bcrypt before storing in database
- All protected routes require a valid JWT token in the request header
- Signup restricted by a secret invite code (stored in .env)
- API keys and credentials stored in backend .env (excluded from GitHub via .gitignore)
- Group actions (delete group, remove member) restricted to group creator only

# ⚙️ Setup Instructions

a. Prerequisites
Make sure you have installed:
=+ Node.js (v18+)
+ MongoDB Atlas account (or local MongoDB)
+ Git

b. Clone the Repository
+ git clone https://github.com/yourusername/splitrecord.git
+ cd splitrecord

c. Configure Environment Variables
+ Inside the backend/ folder, create a .env file:
+ cp .env.example .env

Fill in your own values:
- MONGODB_URI=mongodb+srv://youruser:yourpass@cluster.mongodb.net/splitrecord
- JWT_SECRET=your_jwt_secret_key
- SIGNUP_SECRET_CODE=your_invite_code
- PORT=10000

d. Run Backend
+ bashcd backend
+ npm install
+ node server.js

e. Run Frontend
+ Open index.html directly in your browser, or deploy the frontend folder to Vercel.

# 🎯 Project Outcome
This project demonstrates:
- Full-stack development with Node.js + Express backend and Vanilla JS frontend
- RESTful API design with protected routes and role-based access control
- MongoDB data modelling with embedded subdocuments (payments inside expenses)
- Real-world business logic — partial payments, balance tracking, automated cleanup
- JWT authentication with bcrypt password hashing
- Form validation — both client-side (live feedback) and server-side (duplicate checks)
- Cloud deployment — backend on Render, frontend on Vercel, database on MongoDB Atlas

# Video Demostration
