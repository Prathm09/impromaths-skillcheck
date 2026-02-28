import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import axios from 'axios';

export async function POST(request: Request) {
    try {
        const { email, name, grade, score, category, pdfBase64 } = await request.json();

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

        // Send via WhatsApp if credentials exist
        const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
        const WHATSAPP_PHONE_NODE_ID = process.env.WHATSAPP_PHONE_NODE_ID;
        const RECEIVER_PHONE = '6598262401';

        if (WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NODE_ID) {
            try {
                console.log("Attempting to send WhatsApp message...");

                // 1. Upload the PDF base64 file to WhatsApp Media API
                const formData = new FormData();
                formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `ImproMaths_Report_${name.replace(/\s+/g, '_')}.pdf`);
                formData.append('type', 'document');
                formData.append('messaging_product', 'whatsapp');

                const mediaResponse = await axios.post(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NODE_ID}/media`, formData, {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });

                const mediaId = mediaResponse.data.id;

                // 2. Send Media Message with Caption
                const captionText = `*ImproMaths SkillCheck Pro Report*\n\nStudent: ${name}\nGrade: ${grade}\nScore: ${score}/10\nCategory: ${category}\n\nPlease find the attached PDF diagnostic report.`;

                await axios.post(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NODE_ID}/messages`, {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: RECEIVER_PHONE,
                    type: "document",
                    document: {
                        id: mediaId,
                        caption: captionText,
                        filename: `ImproMaths_Report_${name.replace(/\s+/g, '_')}.pdf`
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log("WhatsApp message with PDF attachment sent successfully!");
            } catch (whatsappError: any) {
                console.error("WhatsApp Error:", whatsappError.response?.data || whatsappError.message);
                // We don't throw here to ensure the generic response isn't breaking if WhatsApp fails but email succeeds
            }
        }

        return NextResponse.json({ message: 'Automation triggered successfully!' }, { status: 200 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ message: 'Failed to complete automation.' }, { status: 500 });
    }
}
