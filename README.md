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

Last update: 02/19/2026 16:24:56
