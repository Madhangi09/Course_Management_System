import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import "./App.css";

// Navbar
function Navbar() {
  return (
    <nav>
      <h2>LearnHub</h2>

      <div>
        <NavLink to="/">Home</NavLink>{" "}
        <NavLink to="/login">Login</NavLink>{" "}
        <NavLink to="/register">Register</NavLink>{" "}
        <NavLink to="/dashboard">Dashboard</NavLink>{" "}
        <NavLink to="/courses">Courses</NavLink>
      </div>
    </nav>
  );
}

// Footer
function Footer() {
  return (
    <footer>
      <p>© 2026 LearnHub</p>
    </footer>
  );
}

// Course Card
function CourseCard({ title, instructor }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p>Instructor: {instructor}</p>
      <button>View Course</button>
    </div>
  );
}

// Home
function Home() {
  return (
    <>
      <Navbar />

      <div className="container">
        <h1>Welcome to LearnHub</h1>
        <p>Learn new skills through online courses.</p>

        <Link to="/courses">
          <button>Explore Courses</button>
        </Link>
      </div>

      <Footer />
    </>
  );
}

// Login
function Login() {
  return (
    <>
      <Navbar />

      <div className="form">
        <h1>Login</h1>

        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />

        <button>Login</button>

        <p>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>

      <Footer />
    </>
  );
}

// Register
function Register() {
  return (
    <>
      <Navbar />

      <div className="form">
        <h1>Register</h1>

        <input type="text" placeholder="Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />

        <button>Register</button>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>

      <Footer />
    </>
  );
}

// Dashboard
function Dashboard() {
  return (
    <>
      <Navbar />

      <div className="container">
        <h1>Dashboard</h1>
        <p>Welcome to your learning dashboard!</p>

        <h2>My Learning</h2>
        <p>3 courses enrolled</p>
      </div>

      <Footer />
    </>
  );
}

// Courses
function Courses() {
  return (
    <>
      <Navbar />

      <div className="container">
        <h1>Available Courses</h1>

        <CourseCard
          title="React Development"
          instructor="John"
        />

        <CourseCard
          title="Python Programming"
          instructor="David"
        />

        <CourseCard
          title="Artificial Intelligence"
          instructor="Sarah"
        />
      </div>

      <Footer />
    </>
  );
}

// Main App
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/courses" element={<Courses />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
