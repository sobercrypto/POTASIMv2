const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Update CORS and add security headers
app.use(cors({
    origin: true, // Allow all origins temporarily while testing
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'anthropic-version'],
    credentials: true
}));

app.use((req, res, next) => {
    // Remove the X-Frame-Options header as it might conflict with CSP
    // Set CSP to allow your domain explicitly
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self' *.squarespace.com *.potabro.com https://www.potabro.com https://potabro.com");
    next();
});

app.use(express.json());
app.use(express.static('public'));

app.post('/proxy', async (req, res) => {
    try {
        console.log('Received request body:', req.body); // Log incoming request

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: req.body.model,
                max_tokens: req.body.max_tokens,
                messages: req.body.messages
            })
        });

        console.log('Anthropic API status:', response.status); // Log API response status

        if (!response.ok) {
            const error = await response.text();
            console.error('Anthropic API Error:', error);
            return res.status(response.status).json({ 
                error: error,
                status: response.status,
                statusText: response.statusText
            });
        }

        const data = await response.json();
        console.log('Anthropic API response:', data); // Log API response data
        res.json(data);
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});


// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server listening on port ${port}`));
