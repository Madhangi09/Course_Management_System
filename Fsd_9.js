
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory data
const users = [];
const students = [];
const courses = [];

let studentId = 1;
let courseId = 1;

const hashPassword = (password, salt) =>
    crypto.scryptSync(password, salt, 64).toString("hex");

const validEmail = email =>
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validId = id => /^\d+$/.test(id) && Number(id) > 0;

// Home
app.get("/", (req, res) => {
    res.json({ success: true, message: "Student and Course API is running" });
});

// Health
app.get("/api/health", (req, res) => {
    res.json({ success: true, status: "UP" });
});

// Register
app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body || {};

    if (typeof name !== "string" || !name.trim() ||
        !validEmail(email) ||
        typeof password !== "string" || password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Valid name, email and password (minimum 8 characters) required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email === normalizedEmail)) {
        return res.status(409).json({
            success: false,
            message: "Email already registered"
        });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const user = {
        id: users.length + 1,
        name: name.trim(),
        email: normalizedEmail,
        salt,
        passwordHash: hashPassword(password, salt)
    };

    users.push(user);

    res.status(201).json({
        success: true,
        message: "Registration successful",
        user: { id: user.id, name: user.name, email: user.email }
    });
});

// Login
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};

    if (!validEmail(email) || typeof password !== "string") {
        return res.status(400).json({
            success: false,
            message: "Valid email and password required"
        });
    }

    const user = users.find(
        u => u.email === email.trim().toLowerCase()
    );

    if (!user || hashPassword(password, user.salt) !== user.passwordHash) {
        return res.status(401).json({
            success: false,
            message: "Invalid email or password"
        });
    }

    const token = crypto.randomBytes(32).toString("hex");

    res.json({
        success: true,
        message: "Login successful",
        token,
        user: { id: user.id, name: user.name, email: user.email }
    });
});

// Create student
app.post("/api/students", (req, res) => {
    const { name, email, age } = req.body || {};

    if (typeof name !== "string" || !name.trim() ||
        !validEmail(email) ||
        !Number.isInteger(Number(age)) ||
        Number(age) < 1 || Number(age) > 120) {
        return res.status(400).json({
            success: false,
            message: "Valid name, email and age required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (students.some(s => s.email === normalizedEmail)) {
        return res.status(409).json({
            success: false,
            message: "Student email already exists"
        });
    }

    const student = {
        id: studentId++,
        name: name.trim(),
        email: normalizedEmail,
        age: Number(age)
    };

    students.push(student);
    res.status(201).json({
        success: true,
        message: "Student created",
        data: student
    });
});

// Get all students
app.get("/api/students", (req, res) => {
    res.json({ success: true, count: students.length, data: students });
});

// Get student by ID
app.get("/api/students/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const student = students.find(s => s.id === Number(req.params.id));

    if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, data: student });
});

// Update student
app.put("/api/students/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const student = students.find(s => s.id === Number(req.params.id));

    if (!student) {
        return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { name, email, age } = req.body || {};

    if (name !== undefined &&
        (typeof name !== "string" || !name.trim())) {
        return res.status(400).json({ success: false, message: "Invalid name" });
    }

    if (email !== undefined && !validEmail(email)) {
        return res.status(400).json({ success: false, message: "Invalid email" });
    }

    if (age !== undefined &&
        (!Number.isInteger(Number(age)) || Number(age) < 1 || Number(age) > 120)) {
        return res.status(400).json({ success: false, message: "Invalid age" });
    }

    if (email !== undefined) {
        const normalizedEmail = email.trim().toLowerCase();

        if (students.some(s => s.id !== student.id && s.email === normalizedEmail)) {
            return res.status(409).json({ success: false, message: "Email already exists" });
        }

        student.email = normalizedEmail;
    }

    if (name !== undefined) student.name = name.trim();
    if (age !== undefined) student.age = Number(age);

    res.json({ success: true, message: "Student updated", data: student });
});

// Delete student
app.delete("/api/students/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const index = students.findIndex(s => s.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: "Student not found" });
    }

    students.splice(index, 1);
    res.json({ success: true, message: "Student deleted" });
});

// Create course
app.post("/api/courses", (req, res) => {
    const { title, description = "", duration } = req.body || {};

    if (typeof title !== "string" || !title.trim() ||
        typeof description !== "string" ||
        !Number.isFinite(Number(duration)) || Number(duration) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Valid title, description and positive duration required"
        });
    }

    const course = {
        id: courseId++,
        title: title.trim(),
        description,
        duration: Number(duration)
    };

    courses.push(course);
    res.status(201).json({
        success: true,
        message: "Course created",
        data: course
    });
});

// Get all courses
app.get("/api/courses", (req, res) => {
    res.json({ success: true, count: courses.length, data: courses });
});

// Get course by ID
app.get("/api/courses/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const course = courses.find(c => c.id === Number(req.params.id));

    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.json({ success: true, data: course });
});

// Update course
app.put("/api/courses/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const course = courses.find(c => c.id === Number(req.params.id));

    if (!course) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    const { title, description, duration } = req.body || {};

    if (title !== undefined &&
        (typeof title !== "string" || !title.trim())) {
        return res.status(400).json({ success: false, message: "Invalid title" });
    }

    if (description !== undefined && typeof description !== "string") {
        return res.status(400).json({ success: false, message: "Invalid description" });
    }

    if (duration !== undefined &&
        (!Number.isFinite(Number(duration)) || Number(duration) <= 0)) {
        return res.status(400).json({ success: false, message: "Invalid duration" });
    }

    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description;
    if (duration !== undefined) course.duration = Number(duration);

    res.json({ success: true, message: "Course updated", data: course });
});

// Delete course
app.delete("/api/courses/:id", (req, res) => {
    if (!validId(req.params.id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const index = courses.findIndex(c => c.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: "Course not found" });
    }

    courses.splice(index, 1);
    res.json({ success: true, message: "Course deleted" });
});

// Invalid JSON and other errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON"
        });
    }

    res.status(500).json({ success: false, message: "Internal server error" });
});

// Unknown routes
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
