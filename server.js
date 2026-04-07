const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json()); // Allows server to read JSON
app.use(cors());         // Allows your frontend to talk to your backend safely

// Our secure, backend-only password (users cannot see this in their browser!)
const SECURE_PASSWORD = "pgnutd2025";

// The Login Route
app.post('/login', (req, res) => {
    const userPassword = req.body.password;

    if (userPassword === SECURE_PASSWORD) {
        // Send a 200 OK status back to the frontend
        res.status(200).json({ message: "Login successful!" });
    } else {
        // Send a 401 Unauthorized status back
        res.status(401).json({ message: "Incorrect password" });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});