# ImproMaths SkillCheck Pro - Setup Guide

"Measure. Improve. Excel."

## Prerequisites
- Node.js (v18+)
- npm

## Folder Structure
- `/client`: Next.js frontend with TailwindCSS and jsPDF.
- `/server`: Node.js Express backend for email processing and question bank.

## Setup Instructions

### 1. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   EMAIL_USER=your-gmail@gmail.com
   EMAIL_PASS=your-app-password
   ```
   *Note: Use a Google App Password if using Gmail.*
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features
- **Dynamic Quiz**: 10 randomized MCQs for IGCSE Grade 7.
- **Progress Tracking**: Real-time progress bar and card-based navigation.
- **Detailed Scoring**: Categorization into Expert, Average, or Not Yet There.
- **PDF Reports**: Professional reports generated on the fly.
- **Email Automation**: Automatic report delivery to student and admin.
- **Responsive Design**: Fully optimized for mobile and desktop.
