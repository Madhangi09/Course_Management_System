
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// DATABASE CONNECTION
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(error => console.log("Database Error:", error.message));

// USER MODEL
const User = mongoose.model("User", new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

// STUDENT MODEL
const Student = mongoose.model("Student", new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    department: String
}));

// COURSE MODEL
const Course = mongoose.model("Course", new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    duration: String,
    instructor: String
}));

// HOME ROUTE
app.get("/", (req, res) => {
    res.send("Task 12 - Database Integration and CRUD API is Running");
});

// USER CRUD OPERATIONS

// Register User
app.post("/api/users/register", async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({ message: "User Registered Successfully", user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Login User
app.post("/api/users/login", async (req, res) => {
    try {
        const user = await User.findOne({
            email: req.body.email,
            password: req.body.password
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid Email or Password" });
        }

        res.json({ message: "Login Successful", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get All Users
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update User
app.put("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id, req.body,
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) return res.status(404).json({ message: "User Not Found" });
        res.json({ message: "User Updated Successfully", user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) return res.status(404).json({ message: "User Not Found" });
        res.json({ message: "User Deleted Successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// STUDENT CRUD OPERATIONS

// Create Student
app.post("/api/students", async (req, res) => {
    try {
        const student = await Student.create(req.body);
        res.status(201).json({ message: "Student Created Successfully", student });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get All Students
app.get("/api/students", async (req, res) => {
    try {
        res.json(await Student.find());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Student By ID
app.get("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (!student) return res.status(404).json({ message: "Student Not Found" });
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update Student
app.put("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id, req.body,
            { new: true, runValidators: true }
        );

        if (!student) return res.status(404).json({ message: "Student Not Found" });
        res.json({ message: "Student Updated Successfully", student });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Student
app.delete("/api/students/:id", async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) return res.status(404).json({ message: "Student Not Found" });
        res.json({ message: "Student Deleted Successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// COURSE CRUD OPERATIONS

// Create Course
app.post("/api/courses", async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ message: "Course Created Successfully", course });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get All Courses
app.get("/api/courses", async (req, res) => {
    try {
        res.json(await Course.find());
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Course By ID
app.get("/api/courses/:id", async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) return res.status(404).json({ message: "Course Not Found" });
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update Course
app.put("/api/courses/:id", async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id, req.body,
            { new: true, runValidators: true }
        );

        if (!course) return res.status(404).json({ message: "Course Not Found" });
        res.json({ message: "Course Updated Successfully", course });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete Course
app.delete("/api/courses/:id", async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) return res.status(404).json({ message: "Course Not Found" });
        res.json({ message: "Course Deleted Successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// START SERVER AFTER DATABASE CONNECTION
const PORT = process.env.PORT || 5000;

mongoose.connection.once("open", () => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
