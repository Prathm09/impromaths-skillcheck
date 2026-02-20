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
            subject: `ImproMaths SkillCheck Pro Report - ${name}`,
            text: `Hello ${name},\n\nPlease find attached your diagnostic test report from ImproMaths.\n\nBest regards,\nImproMaths Team`,
            attachments: [
                {
                    filename: `ImproMaths_Report_${name.replace(/\s+/g, '_')}.pdf`,
                    content: pdfBuffer,
                },
            ],
        };

        await transporter.sendMail(mailOptions);

        return NextResponse.json({ message: 'Report sent successfully!' }, { status: 200 });
    } catch (error) {
        console.error('Email Error:', error);
        return NextResponse.json({ message: 'Failed to send report.' }, { status: 500 });
    }
}
