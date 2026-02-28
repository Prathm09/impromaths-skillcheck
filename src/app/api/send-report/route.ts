import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
    try {
        const { email, name, pdfBase64 } = await request.json();

        // Decode base64 
        const pdfBuffer = Buffer.from(pdfBase64, 'base64');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: [email, 'impromaths@gmail.com'], // Ensuring BOTH student and impromaths get it!
            subject: `ImproMaths Diagnostic Test Report - ${name}`,
            text: `Hello ${name},\n\nThank you for completing the ImproMaths Diagnostic Test.\n\nPlease find attached your detailed diagnostic test report, which includes your score, accuracy percentage, detailed performance analysis, and areas for improvement. Review this report carefully to understand your current skill level.\n\nBest regards,\nImproMaths Team\nimpromaths@gmail.com\n`,
            attachments: [
                {
                    filename: `ImproMaths_Report_${name.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBuffer,
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");

        return NextResponse.json({ message: 'Email automation triggered successfully!' }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ message: 'Failed to complete email automation.' }, { status: 500 });
    }
}
