const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
// Use an environment variable for the target URL

app.use(express.json());

app.post('/', async (req, res) => {
    if (req.body.event === "complete") {
        try {
            const transcriptSegments = req.body.data?.transcript || [];

            const allWordsArray = transcriptSegments.flatMap(segment =>
                (segment.words || []).map(wordObject => wordObject.word)
            );

            const fullTranscript = allWordsArray.join('——');


            console.log("Successfully extracted transcript:");
            console.log(fullTranscript);

            return res.status(200).json({
                message: "Transcript processed successfully.",
                transcript: fullTranscript
            });

        } catch (error) {
            console.log("Error processing transcript:", error);
            return res.status(500).json({ error: "Failed to process the request body." });
        }
    }

    res.status(200).json({ message: "Event was not 'complete', no action taken." });
});

// Vercel doesn't use app.listen(), but it's good for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running for local development on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;