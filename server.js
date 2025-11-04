const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

const anthropicApiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
const anthropicModel =
    process.env.CLAUDE_MODEL_VERSION ||
    process.env.ANTHROPIC_MODEL ||
    'claude-3-sonnet-20240229';
const anthropicVersion =
    process.env.CLAUDE_API_VERSION || process.env.ANTHROPIC_VERSION || '2023-06-01';

console.log(`Configured Claude model: ${anthropicModel}`);

// API proxy handler
const handleProxy = async (req, res) => {
    try {
        console.log('Received request body:', req.body); // Log incoming request

        if (!anthropicApiKey) {
            console.error('Missing Anthropic/Claude API key environment variable.');
            return res.status(500).json({
                error: 'Anthropic API key is not configured on the server.'
            });
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': anthropicApiKey,
                'anthropic-version': anthropicVersion
            },
            body: JSON.stringify({
                ...req.body,
                model: anthropicModel
            })
        });

        const responseText = await response.text();

        console.log('Anthropic API status:', response.status);

        if (!response.ok) {
            console.error('Anthropic API Error:', responseText);
            return res.status(response.status).json({
                error: responseText,
                status: response.status,
                statusText: response.statusText
            });
        }

        const data = JSON.parse(responseText);
        res.status(200).json(data);
    } catch (error) {
        console.error('Server proxy error:', error);
        res.status(500).json({
            error: 'API call failed',
            details: error instanceof Error ? error.message : undefined
        });
    }
};

app.options('/api/proxy', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
});

app.post('/api/proxy', handleProxy);

// Serve index.html for other routes (if desired)
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
