const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { google } = require('googleapis');
const creds = require('./credentials.json'); // Service account credentials

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Google Sheets API Setup
const SHEET_ID = '1ewua_EGLCkPW9qAwQbwOsC9mXOxhd-EdH7mDFYlZ1i0';

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
    console.log('Incoming payload:', req.body);

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

        console.log('Row added:', response.data.updates);
        res.status(200).json({ success: true, message: 'Form submitted successfully' });
    } catch (error) {
        console.error('Error during submission:', error);
        res.status(500).json({ success: false, message: 'Something went wrong', error: error.message });
    }
});


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
