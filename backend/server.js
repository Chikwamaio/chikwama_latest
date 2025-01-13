const express = require('express');
const PocketBase = require('pocketbase/cjs');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pb = new PocketBase('http://127.0.0.1:8080');

const adminEmail = process.env.adminEmail;
const adminPassword = process.env.adminPassword;

const authenticate = async () => {
    try {
        const authData = await pb.admins.authWithPassword(adminEmail, adminPassword);
        console.log('Authenticated as admin:', authData);
    } catch (error) {
        console.error('Error authenticating:', error);
        process.exit(1); // Exit the server if authentication fails
    }
};

app.use(cors());
app.use(bodyParser.json());

app.post('/submit', async (req, res) => {
    const { email, location } = req.body;

    try {

        const data = {
            "email": email,
            "location": location
        };
        const record = await pb.collection('submissions').create(data);
        res.status(200).json({ message: 'Success', record });
    } catch (error) {
        console.error('Error submitting data:', error);
        res.status(500).json({ message: 'Error submitting data', error });
    }
});

const PORT = 5001;
(async () => {
    await authenticate();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
})();