const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const creds = JSON.parse(process.env.GOOGLE_CREDS); // Service account credentials

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Google Sheets API Setup
const SHEET_ID = process.env.SHEET_ID;

async function authorizeGoogleAPI() {
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const authClient = await auth.getClient();
    return google.sheets({ version: 'v4', auth: authClient });
}

// POST handler
app.post('/submit-form', async (req, res) => {
    const { name, mobile, services, city, message } = req.body;

    try {
        const sheets = await authorizeGoogleAPI();

        const date = new Date();
        const istTime = date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SHEET_ID,
            range: 'Sheet1!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    name,
                    mobile,
                    Array.isArray(services) ? services.join(', ') : services,
                    city,
                    message,
                    istTime
                ]],
            },
        });

        res.status(200).json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
});

app.listen(PORT);
