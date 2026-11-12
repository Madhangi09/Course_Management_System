
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
require("dotenv").config();

const app = express();

// Security and Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10kb" }));

// Request Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(error => console.log("Database Error:", error.message));

// User Schema
const User = mongoose.model("SecureUser", new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
}, { timestamps: true }));

// Input Validation
function validateInput(req, res, next) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            message: "Name, email and password are required"
        });
    }

    if (typeof name !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string") {
        return res.status(400).json({
            message: "Invalid input format"
        });
    }

    if (name.trim().length < 2 || name.trim().length > 50) {
        return res.status(400).json({
            message: "Name must contain 2 to 50 characters"
        });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return res.status(400).json({
            message: "Invalid email address"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must contain at least 6 characters"
        });
    }

    next();
}

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Access token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

// Home Route
app.get("/", (req, res) => {
    res.json({ message: "Secure API is Running Successfully" });
});

// Register User
app.post("/api/register", validateInput, async (req, res, next) => {
    try {
        const name = req.body.name.trim();
        const email = req.body.email.trim().toLowerCase();

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 12);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).json({
            message: "Registration Successful",
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        next(error);
    }
});

// Login User
app.post("/api/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() || !password) {
            return res.status(400).json({
                message: "Valid email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login Successful",
            token
        });
    } catch (error) {
        next(error);
    }
});

// Protected Profile Route
app.get("/api/profile", authenticateToken, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .lean();

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Protected Profile Accessed",
            user
        });
    } catch (error) {
        next(error);
    }
});

// Get All Users
app.get("/api/users", authenticateToken, async (req, res, next) => {
    try {
        const users = await User.find()
            .select("-password")
            .lean();

        res.json(users);
    } catch (error) {
        next(error);
    }
});

// Update Profile
app.put("/api/profile", authenticateToken, async (req, res, next) => {
    try {
        const { name } = req.body;

        if (typeof name !== "string" ||
            name.trim().length < 2 ||
            name.trim().length > 50) {
            return res.status(400).json({
                message: "Enter a valid name"
            });
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { name: name.trim() },
            { new: true, runValidators: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.json({
            message: "Profile Updated Successfully",
            user
        });
    } catch (error) {
        next(error);
    }
});

// Centralized Error Handling
app.use((err, req, res, next) => {
    console.error("Error:", err.message);

    if (err.name === "ValidationError") {
        return res.status(400).json({
            message: "Validation Error",
            error: err.message
        });
    }

    if (err.code === 11000) {
        return res.status(409).json({
            message: "Duplicate email address"
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID format"
        });
    }

    res.status(500).json({
        message: "Internal Server Error"
    });
});

// Unknown Route
app.use((req, res) => {
    res.status(404).json({
        message: "API Route Not Found"
    });
});

// Server Start
const PORT = process.env.PORT || 5002;

mongoose.connection.once("open", () => {
    app.listen(PORT, () => {
        console.log(`Secure Server running on port ${PORT}`);
    });
});

process.on("unhandledRejection", error => {
    console.error("Unhandled Rejection:", error.message);
});

process.on("uncaughtException", error => {
    console.error("Uncaught Exception:", error.message);
    process.exit(1);
});
