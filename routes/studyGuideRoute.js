require('dotenv').config();
const express = require('express');
const fs = require('fs');
const handlebars = require('handlebars');
const path = require('path');
const SibApiV3Sdk = require('@getbrevo/brevo');

studyGuideRouter = express.Router();

// Initialize Brevo
let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

studyGuideRouter.post('/study-guide', async (req, res) => {
    const { first_name, email, major } = req.body;

    // Defne the Base URL based on the environment
    const BASE_URL = process.env.NODE_ENV === 'production' ? 'https://avrilwriters.com' : `http://127.0.0.1:${process.env.PORT}`;

    // 1. Map majors to your specific URLs
    const links = {
        nursing: `${BASE_URL}/dl/nursing-blueprint.pdf`,
        business: `${BASE_URL}/dl/finance-blueprint.pdf`,
        stem: `${BASE_URL}/dl/stem-blueprint.pdf`,
        humanities: `${BASE_URL}/dl/humanities-blueprint.pdf`,
        other: `${BASE_URL}/dl/general-blueprint.pdf`
    };

    // 2. Prepare Template
    const filePath = path.join(__dirname, 'views', 'email.html');
    const source = fs.readFileSync(filePath, 'utf-8');
    const template = handlebars.compile(source);

    // 3. Inject Data
    const htmlToSend = template({
        first_name: first_name,
        major: major.charAt(0).toUpperCase() + major.slice(1),
        download_url: links[major] || links.other
    });

    // 4. Send via Brevo
    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.subject = "Your Academic Blueprint is Ready!";
    sendSmtpEmail.htmlContent = htmlToSend;
    sendSmtpEmail.sender = { "name": "Avril Writers", "email": "info@avrilwriters.com" };
    sendSmtpEmail.to = [{ "email": email, "name": first_name }];

    try {
        await apiInstance.sendTransacEmail(sendSmtpEmail);
        res.status(200).send("Email Sent!");
    } catch (error) {
        res.status(500).send("Error sending email.");
    }
});

module.exports = studyGuideRouter;
