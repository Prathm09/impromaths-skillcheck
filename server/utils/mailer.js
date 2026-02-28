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
    subject: `ImproMaths Diagnostic Test Report - ${studentName}`,
    text: `Hello ${studentName},\n\nThank you for completing the ImproMaths Diagnostic Test.\n\nPlease find attached your detailed diagnostic test report, which includes your score, accuracy percentage, detailed performance analysis, and areas for improvement. Review this report carefully to understand your current skill level.\n\nBest regards,\nImproMaths Team\nimpromaths@gmail.com\n`,
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
