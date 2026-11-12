
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected Successfully"))
    .catch(error => console.log("Database Error:", error.message));

// Message Model
const Message = mongoose.model("Message", new mongoose.Schema({
    sender: String,
    message: String,
    time: { type: Date, default: Date.now }
}));

// Chat Interface
app.get("/", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Student Real-Time Chat</title>
    <style>
        body {
            font-family: Arial;
            background: #F2F5FA;
            color: #142D4E;
            text-align: center;
            padding: 30px;
        }
        .chat-box {
            background: white;
            max-width: 500px;
            margin: auto;
            padding: 20px;
            border-radius: 10px;
        }
        #messages {
            height: 300px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            margin-bottom: 15px;
        }
        input {
            padding: 10px;
            margin: 5px;
            width: 65%;
        }
        button {
            padding: 10px 15px;
            background: #142D4E;
            color: white;
            border: none;
            cursor: pointer;
        }
        .status {
            color: green;
        }
    </style>
</head>
<body>

    <div class="chat-box">
        <h2>Student Chat Application</h2>

        <input id="username" placeholder="Enter your name">
        <button onclick="joinChat()">Join Chat</button>

        <p class="status" id="status">Not connected</p>
        <p id="online">Online students: 0</p>

        <div id="messages"></div>

        <input id="message" placeholder="Type your message">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();

        const messages = document.getElementById("messages");
        const status = document.getElementById("status");
        const online = document.getElementById("online");

        let joined = false;

        socket.on("connect", () => {
            status.textContent = "Connected to server";
        });

        socket.on("disconnect", () => {
            status.textContent = "Disconnected";
        });

        function joinChat() {
            const name = document.getElementById("username").value.trim();

            if (!name) {
                alert("Please enter your name");
                return;
            }

            if (joined) return;

            socket.emit("join", name);
            joined = true;
            document.getElementById("username").disabled = true;
        }

        function sendMessage() {
            const message = document.getElementById("message").value.trim();

            if (!joined) {
                alert("Please join the chat first");
                return;
            }

            if (!message) return;

            socket.emit("chatMessage", message);
            document.getElementById("message").value = "";
        }

        function displayMessage(sender, message, time) {
            const item = document.createElement("p");
            item.textContent = sender + ": " + message + " (" + time + ")";
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        }

        socket.on("chatMessage", data => {
            displayMessage(data.sender, data.message, data.time);
        });

        socket.on("notification", message => {
            alert(message);
        });

        socket.on("onlineUsers", count => {
            online.textContent = "Online students: " + count;
        });

        socket.on("chatHistory", history => {
            history.forEach(data => {
                displayMessage(
                    data.sender,
                    data.message,
                    new Date(data.time).toLocaleTimeString()
                );
            });
        });

        document.getElementById("message").addEventListener("keypress", event => {
            if (event.key === "Enter") sendMessage();
        });
    </script>

</body>
</html>
    `);
});

// Socket.IO Connection
const users = new Map();

io.on("connection", socket => {

    console.log("A student connected:", socket.id);

    socket.on("join", async name => {
        users.set(socket.id, name);

        console.log(name + " joined the chat");

        socket.emit("chatHistory", await Message.find().sort({ time: 1 }).limit(50));

        io.emit("onlineUsers", users.size);
        socket.broadcast.emit("notification", name + " joined the chat");
    });

    socket.on("chatMessage", async message => {
        const sender = users.get(socket.id);

        if (!sender || !message.trim()) return;

        const newMessage = await Message.create({
            sender,
            message
        });

        const data = {
            sender: newMessage.sender,
            message: newMessage.message,
            time: newMessage.time.toLocaleTimeString()
        };

        io.emit("chatMessage", data);
        socket.broadcast.emit("notification", "New message from " + sender);
    });

    socket.on("disconnect", () => {
        const name = users.get(socket.id);

        users.delete(socket.id);

        if (name) {
            console.log(name + " disconnected");
            socket.broadcast.emit("notification", name + " left the chat");
        }

        io.emit("onlineUsers", users.size);
    });
});

// Start Server
const PORT = process.env.PORT || 5001;

mongoose.connection.once("open", () => {
    server.listen(PORT, () => {
        console.log("Server running on port " + PORT);
    });
});
