
const mongoose = require("mongoose");
require("dotenv").config();

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/course_management")
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(err => console.log("Database Error:", err));

// 1. Users Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
        type: String,
        enum: ["admin", "student", "teacher"],
        default: "student"
    }
}, { timestamps: true });

// 2. Students Schema
const studentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    department: String
}, { timestamps: true });

// 3. Courses Schema
const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    duration: { type: String, required: true },
    instructor: String
}, { timestamps: true });

// 4. Enrollments Schema
const enrollmentSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    date: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["active", "completed", "cancelled"],
        default: "active"
    }
}, { timestamps: true });

// Prevent duplicate enrollments
enrollmentSchema.index(
    { studentId: 1, courseId: 1 },
    { unique: true }
);

// 5. Notifications Schema
const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false }
}, { timestamps: true });

// Create Models
const User = mongoose.model("User", userSchema);
const Student = mongoose.model("Student", studentSchema);
const Course = mongoose.model("Course", courseSchema);
const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
const Notification = mongoose.model("Notification", notificationSchema);

// Create Collections and Indexes
async function setupDatabase() {
    try {
        await Promise.all([
            User.createCollection(),
            Student.createCollection(),
            Course.createCollection(),
            Enrollment.createCollection(),
            Notification.createCollection()
        ]);

        await Promise.all([
            User.init(),
            Student.init(),
            Course.init(),
            Enrollment.init(),
            Notification.init()
        ]);

        console.log("All Collections Created Successfully");
    } catch (error) {
        console.log("Setup Error:", error.message);
    }
}

mongoose.connection.once("open", setupDatabase);

// Export Models
module.exports = {
    User,
    Student,
    Course,
    Enrollment,
    Notification
};
