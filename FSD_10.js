
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("Add JWT_SECRET to your .env file");
}

// In-memory storage for demonstration
const users = [];
const students = [];
const courses = [];

let studentId = 1;
let courseId = 1;

// Password hashing for this demo
function hashPassword(password) {
    return crypto.scryptSync(password, "demo-salt", 64).toString("hex");
}

// JWT authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized: Token required"
        });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({
                message: "Unauthorized: Invalid or expired token"
            });
        }

        req.user = decoded;
        next();
    });
}

// Home
app.get("/", (req, res) => {
    res.json({ message: "JWT Authentication API is running" });
});

// Register
app.post("/api/auth/register", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
        return res.status(400).json({
            message: "Enter name, email and password (minimum 6 characters)"
        });
    }

    if (users.some(user => user.email === email)) {
        return res.status(409).json({
            message: "Email already registered"
        });
    }

    users.push({
        id: users.length + 1,
        name,
        email,
        password: hashPassword(password)
    });

    res.status(201).json({
        message: "Registration successful"
    });
});

// Login and generate JWT
app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(user => user.email === email);

    if (!user || user.password !== hashPassword(password || "")) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({
        message: "Login successful",
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
});

// Protected dashboard
app.get("/api/dashboard", authenticateToken, (req, res) => {
    res.json({
        message: "Welcome to your protected dashboard",
        user: req.user
    });
});

// Protected student routes
app.post("/api/students", authenticateToken, (req, res) => {
    const { name, email, course } = req.body;

    if (!name || !email) {
        return res.status(400).json({
            message: "Student name and email are required"
        });
    }

    const student = {
        id: studentId++,
        name,
        email,
        course: course || ""
    };

    students.push(student);
    res.status(201).json(student);
});

app.get("/api/students", authenticateToken, (req, res) => {
    res.json(students);
});

app.get("/api/students/:id", authenticateToken, (req, res) => {
    const student = students.find(s => s.id === Number(req.params.id));

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
});

app.put("/api/students/:id", authenticateToken, (req, res) => {
    const student = students.find(s => s.id === Number(req.params.id));

    if (!student) {
        return res.status(404).json({ message: "Student not found" });
    }

    Object.assign(student, req.body, { id: student.id });
    res.json(student);
});

app.delete("/api/students/:id", authenticateToken, (req, res) => {
    const index = students.findIndex(s => s.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ message: "Student not found" });
    }

    students.splice(index, 1);
    res.json({ message: "Student deleted successfully" });
});

// Protected course routes
app.post("/api/courses", authenticateToken, (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Course name is required"
        });
    }

    const course = {
        id: courseId++,
        name,
        description: description || ""
    };

    courses.push(course);
    res.status(201).json(course);
});

app.get("/api/courses", authenticateToken, (req, res) => {
    res.json(courses);
});

app.get("/api/courses/:id", authenticateToken, (req, res) => {
    const course = courses.find(c => c.id === Number(req.params.id));

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    res.json(course);
});

app.put("/api/courses/:id", authenticateToken, (req, res) => {
    const course = courses.find(c => c.id === Number(req.params.id));

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    Object.assign(course, req.body, { id: course.id });
    res.json(course);
});

app.delete("/api/courses/:id", authenticateToken, (req, res) => {
    const index = courses.findIndex(c => c.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ message: "Course not found" });
    }

    courses.splice(index, 1);
    res.json({ message: "Course deleted successfully" });
});

// Logout endpoint
app.post("/api/auth/logout", authenticateToken, (req, res) => {
    res.json({
        message: "Logout successful. Delete the token on the client."
    });
});

// Handle unknown routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
