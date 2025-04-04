const express = require('express');
const path = require('path');
const fetch = require('node-fetch');  // Make sure to install node-fetch if not already installed

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://medi-assist.onrender.com';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname)));

// Serve Static HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, 'sign_up.html')));
app.get('/signin', (req, res) => res.sendFile(path.join(__dirname, 'sign_in.html')));
app.get('/main', (req, res) => res.sendFile(path.join(__dirname, 'main_websitepage.html')));

// User Registration (Sign Up)
app.post('/api/signup', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend server' });
    }
});

// User Login (Sign In)
app.post('/api/signin', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend server' });
    }
});

// Emergency service route
app.get('/emergency', (req, res) => {
    res.sendFile(path.join(__dirname, 'final_guestpage.html'));
});

// API for emergency service
app.post('/api/emergency-connect', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/emergency-connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend server' });
    }
});

// API for mobile clinic requests
app.post('/api/request-mobile-clinic', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/request-mobile-clinic`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend server' });
    }
});

// API for nearby facilities
app.get('/api/nearby-facilities', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/nearby-facilities?${new URLSearchParams(req.query)}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error connecting to backend server' });
    }
});

// Additional routes
app.get('/splash', (req, res) => {
    res.sendFile(path.join(__dirname, 'splash.html'));
});

app.get('/onboarding', (req, res) => {
    res.sendFile(path.join(__dirname, 'advertisment_all_login_Connected.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Frontend server running on port ${PORT}`);
});
