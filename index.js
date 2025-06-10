const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
// Use an environment variable for the target URL
const TARGET_URL = process.env.TARGET_API_URL;

if (!TARGET_URL) {
    console.error("FATAL ERROR: TARGET_API_URL environment variable is not set.");
    process.exit(1); // Exit if the target URL isn't configured
}

app.use(express.json());

app.post('/', async (req, res) => {
    console.log('Request received. Forwarding to:', TARGET_URL);
    console.log('Original request body:', req.body);

    try {
        const apiResponse = await fetch(TARGET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });

        const dataFromTarget = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error('Target server returned an error:', dataFromTarget);
            return res.status(apiResponse.status).json({
                message: 'Request failed at the target server.',
                error: dataFromTarget,
            });
        }

        console.log('Successfully got response from target server:', dataFromTarget);
        res.status(200).json({
            message: 'Successfully forwarded request and got response.',
            forwardedData: dataFromTarget,
        });
    } catch (error) {
        console.error('Error connecting to the target server:', error.message);
        res.status(502).json({
            message: 'Bad Gateway: Could not connect to the target service.',
            error: error.message,
        });
    }
});

// Vercel doesn't use app.listen(), but it's good for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running for local development on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;