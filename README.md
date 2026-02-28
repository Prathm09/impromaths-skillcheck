This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## ImproMaths SkillCheck Pro 🚀
Status: Production Ready | Vercel Optimized

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Automatic Email Configuration (SMTP)

The application automatically emails a generated PDF diagnostic report upon test submission to both the student and the administrator (`impromaths@gmail.com`). This requires valid SMTP/email credentials to be configured.

### Setting up Email Credentials
1. Use an App Password for Gmail (Do **NOT** use your standard Google password). 
2. Go to your Google Account Settings -> Security -> 2-Step Verification -> App Passwords.
3. Generate a new App Password for "Node.js App" (or similar).
4. In the root of your project, locate or create a `.env` (and `.env.local` if using Next.js dev server). Provide the following variables:
```
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_character_app_password
```
5. Ensure these environment variables are safely managed and never committed to public repositories (e.g. they should be included in `.gitignore` or inputted directly into Vercel/Render Secret Environment Variables).

## Automatic WhatsApp Report Delivery (Meta Cloud API)

The application simultaneously sends the generated PDF and a short analytical text summary to the preconfigured administration number (`+65 9826 2401`) via WhatsApp.

### Setting up WhatsApp Business API Credentials
1. Go to the [Meta for Developers Portal](https://developers.facebook.com/) and Create an App (Type: Business).
2. Set up the **WhatsApp Product** inside your app.
3. It will give you a temporary (or permanent) **Access Token** and a **Phone Number ID**.
4. In the root of your project, locate or create a `.env` (and `.env.local` if using Next.js dev server) and provide these variables so the server can authorize the message pushing correctly:
```
WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NODE_ID=your_phone_number_id
```
*Note: Make sure to verify the destination phone number (`+6598262401`) on your Meta Dev Dashboard if you are using a test number, or go live for arbitrary delivery.*

Last update: 02/28/2026 19:55:56
