const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { sendReport } = require('./utils/mailer');
const questionsGrade6 = require('./data/questions_grade6.json');
const questionsGrade7 = require('./data/questions_grade7.json');
const questionsGrade8 = require('./data/questions_grade8.json');
const questionsGrade9 = require('./data/questions_grade9.json');
const questionsGrade10 = require('./data/questions_grade10.json');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/api/questions/:grade', (req, res) => {
    const { grade } = req.params;
    let qBank = [];

    if (grade === '6') qBank = questionsGrade6;
    else if (grade === '7') qBank = questionsGrade7;
    else if (grade === '8') qBank = questionsGrade8;
    else if (grade === '9') qBank = questionsGrade9;
    else if (grade === '10') qBank = questionsGrade10;
    else {
        return res.status(404).json({ message: "Grade level not found." });
    }

    // Shuffle questions and select 10
    const shuffledQuestions = [...qBank]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10)
        .map(q => {
            // Shuffle the options within each question
            const shuffledOptions = [...q.options].sort(() => 0.5 - Math.random());
            return {
                ...q,
                options: shuffledOptions
            };
        });

    return res.json(shuffledQuestions);
});

app.post('/api/send-report', async (req, res) => {
    try {
        const { email, name, pdfBase64 } = req.body;
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        await sendReport(email, pdfBuffer, name);
        res.status(200).json({ message: 'Report sent successfully!' });
    } catch (error) {
        console.error('Email Error:', error);
        res.status(500).json({ message: 'Failed to send report.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
