const s3Service = require('./service');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();

const PORT = process.env.PORT || 3000;
// Use an environment variable for the target URL

app.use(express.json());

app.post('/', async (req, res) => {
    // Check if the event has finished
    if (req.body.event === "complete") {
        try {
            const zoomBotId = req.body.bot_id;
            const transcriptSegments = req.body.data?.transcript || [];

            const botMp4Url = req.body.data?.mp4 || "";

            // get full transcript
            const allWordsArray = transcriptSegments.flatMap(segment =>
                (segment.words || []).map(wordObject => wordObject.word)
            );

            const fullTranscript = allWordsArray.join('');


            console.log("Successfully extracted transcript:");
            console.log(fullTranscript);

            // download a video from the link and upload to our s3
            const response = await axios.get(botMp4Url, {
                responseType: 'arraybuffer'
            });
            const videoBuffer = Buffer.from(response.data, 'binary');
            const uniqueFileName = `${uuidv4()}.mp4`;
            const meetingVideoKey = `notetaker/${uniqueFileName}`;
            await s3Service.uploadFile(videoBuffer, 'note-taker.mp4', meetingVideoKey, false);

            // // generate note
            // const assessment = Assessment.findOne({zoomBotId: zoomBotId});
            // const note = await generateNoteSummary(fullTranscript, assessment.roleName, assessment.roleDescription);
            //
            // UserMeetingEvent.findOneAndUpdate({ zoomBotId: zoomBotId }, {
            //     $set: {
            //         note: note,
            //         meetingVideoKey: meetingVideoKey,
            //     }
            // });

            return res.status(200).json({
                message: "video uploaded successfully.",
                transcript: fullTranscript,
                meetingVideoKey: meetingVideoKey,
            });

        } catch (error) {
            console.log("Error processing transcript:", error);
            return res.status(500).json({ error: "Failed to process the request body." });
        }
    }

    res.status(200).json({ message: "Event was not 'complete', no action taken." });
});

app.post('/calendar', async (req, res) => {
    console.log(req.headers);
    console.log(req.body);
})

// Vercel doesn't use app.listen(), but it's good for local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running for local development on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel
module.exports = app;