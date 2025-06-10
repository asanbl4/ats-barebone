const express = require('express');
const app = express();

// Define the port the server will run on. Use an environment variable or default to 3000.
const PORT = process.env.PORT || 3000;

// --- 1. CRITICAL: Add the JSON body-parsing middleware ---
// This line is essential. It parses incoming JSON requests and populates `req.body`.
// Without this, `req.body` would be undefined and the request could hang.
app.use(express.json());


// --- 2. Define the single POST endpoint ---
// We make the function 'async' to use 'await' for handling the fetch call.
app.post('/', async (req, res) => {
    const targetUrl = 'http://localhost:9090/api/event';

    console.log('Request received. Forwarding to:', targetUrl);
    console.log('Original request body:', req.body);

    // 3. Use a try...catch block to handle any errors during the fetch operation.
    try {
        // 4. 'await' the fetch call to the target server.
        const apiResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Pass the original request body along, re-stringified.
            body: JSON.stringify(req.body),
        });

        // Parse the response from the target server as JSON
        const dataFromTarget = await apiResponse.json();

        // 5. Check if the call to the target server was successful.
        if (!apiResponse.ok) {
            // If the target server returned an error (e.g., 400, 500), forward that status and data.
            console.error('Target server returned an error:', dataFromTarget);
            return res.status(apiResponse.status).json({
                message: 'Request failed at the target server.',
                error: dataFromTarget,
            });
        }

        // 6. If everything was successful, log it and send a success response back to the original client.
        console.log('Successfully got response from target server:', dataFromTarget);
        res.status(200).json({
            message: 'Successfully forwarded request and got response.',
            forwardedData: dataFromTarget,
        });

    } catch (error) {
        // This block catches network errors (e.g., the target server is down).
        console.error('Error connecting to the target server:', error.message);

        // 502 Bad Gateway is an appropriate status code for a proxy failing to reach the upstream server.
        res.status(502).json({
            message: 'Bad Gateway: Could not connect to the target service.',
            error: error.message,
        });
    }
});


// --- 7. Start the server ---
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});