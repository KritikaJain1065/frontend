const express = require('express');
const path = require('path');
const fetch = require('node-fetch');  // Make sure to install node-fetch if not already installed
const cors = require('cors');  // Make sure to install cors if not already installed

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = 'https://medi-assist.onrender.com';

// Enable CORS for the frontend
app.use(cors({ 
    origin: 'https://frontend-kew6.onrender.com',
    methods: ['GET', 'POST'],
    credentials: true
}));

// Fetch configuration
const fetchConfig = {
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Helper function for API calls
async function makeAPICall(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchConfig.timeout);
    
    try {
        const response = await fetch(url, {
            ...options,
            ...fetchConfig,
            signal: controller.signal,
            headers: { ...fetchConfig.headers, ...options?.headers }
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Backend error:', {
                endpoint: url,
                status: response.status,
                statusText: response.statusText,
                body: errorData
            });
            throw new Error(`Backend server error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout - backend server not responding');
        }
        throw error;
    }
}

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
        
        if (!response.ok) {
            const errorData = await response.text();
            console.error('Backend error:', {
                status: response.status,
                statusText: response.statusText,
                body: errorData
            });
            return res.status(response.status).json({ 
                success: false, 
                message: `Backend server error: ${response.status} ${response.statusText}`,
                details: errorData
            });
        }
        
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Connection error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error connecting to backend server',
            error: error.message
        });
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
        const data = await makeAPICall(`${API_BASE_URL}/api/emergency-connect`, {
            method: 'POST',
            body: JSON.stringify(req.body)
        });
        res.json(data);
    } catch (error) {
        console.error('Emergency connect error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            timestamp: new Date().toISOString()
        });
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
        const data = await makeAPICall(
            `${API_BASE_URL}/api/nearby-facilities?${new URLSearchParams(req.query)}`
        );
        res.json(data);
    } catch (error) {
        console.error('Nearby facilities error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            timestamp: new Date().toISOString()
        });
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
