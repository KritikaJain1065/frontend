const express = require('express');
const path = require('path');
const fetch = require('node-fetch');  // Make sure to install node-fetch if not already installed
const cors = require('cors');  // Make sure to install cors if not already installed

const app = express();
const PORT = process.env.PORT || 3000;

// Environment-based API URL configuration
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://medi-assist.onrender.com'
    : 'http://localhost:3000';

// Updated CORS configuration with all necessary origins
const allowedOrigins = [
    'http://localhost:3000',
    'https://frontend-kew6.onrender.com',
    'https://medi-assist.onrender.com',
    'https://medi-assist-frontend.onrender.com'
];

app.use(cors({ 
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            console.log(`Blocked request from origin: ${origin}`);
            return callback(null, false);
        }
        console.log(`Allowed request from origin: ${origin}`);
        return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200 // For legacy browser support
}));

// Fetch configuration
const fetchConfig = {
    timeout: 15000, // 15 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

// Helper function for API calls
async function makeAPICall(url, options) {
    console.log(`Making API call to: ${url}`);
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
        console.log(`Response status: ${response.status} for ${url}`);
        
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
        
        const data = await response.json();
        console.log(`Successful response from ${url}`);
        return data;
    } catch (error) {
        clearTimeout(timeout);
        console.error(`API call error for ${url}:`, error);
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

// Add health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add backend health check
app.get('/api/health', async (req, res) => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (response.ok) {
            res.json({ status: 'ok', backend: 'connected' });
        } else {
            res.status(503).json({ status: 'error', message: 'Backend service unavailable' });
        }
    } catch (error) {
        console.error('Backend health check failed:', error);
        res.status(503).json({ status: 'error', message: 'Cannot connect to backend' });
    }
});

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
        const data = await makeAPICall(`${API_BASE_URL}/api/signin`, {
            method: 'POST',
            body: JSON.stringify(req.body)
        });
        res.json(data);
    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            timestamp: new Date().toISOString()
        });
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
        const data = await makeAPICall(`${API_BASE_URL}/api/request-mobile-clinic`, {
            method: 'POST',
            body: JSON.stringify(req.body)
        });
        res.json(data);
    } catch (error) {
        console.error('Mobile clinic request error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message,
            timestamp: new Date().toISOString()
        });
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

// Start the server with better logging
app.listen(PORT, () => {
    console.log(`
Server started successfully!
-----------------------------
Local: http://localhost:${PORT}
Time: ${new Date().toISOString()}
-----------------------------
Routes available:
- GET  /health           (Server health check)
- GET  /api/health       (Backend health check)
- GET  /                 (Home page)
- GET  /signup          (Sign up page)
- GET  /signin          (Sign in page)
- GET  /main            (Main website page)
- GET  /emergency       (Emergency page)
- POST /api/signup      (Sign up API)
- POST /api/signin      (Sign in API)
- POST /api/emergency-connect    (Emergency service)
- POST /api/request-mobile-clinic (Mobile clinic)
- GET  /api/nearby-facilities    (Nearby facilities)
-----------------------------
`);
});
