const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendReport = async (studentEmail, pdfBuffer, studentName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: [studentEmail, 'impromaths@gmail.com'],
    subject: `ImproMaths SkillCheck Pro Report - ${studentName}`,
    text: `Hello ${studentName},\n\nPlease find attached your diagnostic test report from ImproMaths.\n\nBest regards,\nImproMaths Team`,
    attachments: [
      {
        filename: `ImproMaths_Report_${studentName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendReport };
