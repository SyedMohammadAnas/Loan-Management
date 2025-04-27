# Personal Finance Management System

## Overview

A comprehensive personal finance management application built with Next.js 14, React, TypeScript, Tailwind CSS, and Supabase. The system enables users to manage loans, track personal payments, and receive payment reminders through an intuitive dashboard interface.

## Features

### Authentication & Security
- **Google OAuth Integration** - Login with Google account
- **Email Authorization** - Restricted access to authorized emails only
- **OTP Verification** - Secure one-time password verification via email
- **Session Management** - Secure session handling with cookies and localStorage

### Loan Management
- **Loan Creation** - Easy loan creation with customizable terms
- **Payment Recording** - Record payments against loans with automatic interest calculation
- **Loan Details** - Detailed view of loan information including payment history
- **Search Functionality** - Filter loans by various criteria

### Personal Payments
- **Payment Tracking** - Track personal payments with due dates
- **Status Management** - Automatic status updates based on due dates
- **Manual Completion** - Mark payments as finished with confirmation
- **Payment Reminders** - Automated email reminders for upcoming payments

### Analytics
- **Financial Metrics** - Track key metrics like active loans, total interest, and outstanding amounts
- **Data Visualization** - Visual representation of loan and payment data
- **Real-time Updates** - Live updates from Supabase database

### User Interface
- **Modern Design** - Sleek dark-themed interface with glass effects
- **Responsive Layout** - Mobile-friendly design that works on all screen sizes
- **Interactive Components** - Modal dialogs, search functionality, and tabbed interfaces
- **Gradient Styling** - Beautiful gradient buttons and backgrounds

## Technical Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI, Lucide Icons, Framer Motion
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth, Custom OTP Implementation
- **Email**: Nodemailer for OTP and reminder emails
- **Data Management**: Supabase Real-time Subscriptions
- **Styling**: Tailwind CSS, Custom Glass Effect Components
- **Typography**: Overpass Mono font throughout the application

## Database Architecture

- **Loans Table** - Stores loan information
- **Repayment Tables** - Dynamically created tables for each loan's repayments
- **Personal Payments Table** - Tracks personal payment obligations
- **OTPs Table** - Manages one-time passwords for verification
- **User Sessions Table** - Handles authentication sessions

## Key Implementation Details

### Row-Level Security
The application implements Supabase Row-Level Security policies to ensure data privacy while allowing necessary operations without requiring authentication for every action.

### Dynamic Table Creation
The system dynamically creates repayment tables for each loan to isolate payment data while maintaining security through RLS policies.

### Real-time Updates
Leverages Supabase's real-time subscription feature to ensure immediate UI updates when data changes.

### Email Reminders
Automatically sends email reminders for upcoming payments with clear visual indicators for urgency.

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_AUTHORIZED_EMAILS=comma,separated,email,list
   EMAIL_SERVER_HOST=your_smtp_host
   EMAIL_SERVER_PORT=your_smtp_port
   EMAIL_SERVER_USER=your_smtp_user
   EMAIL_SERVER_PASSWORD=your_smtp_password
   PAYMENT_REMINDER_SUBJECT=Payment Reminder
   PAYMENT_REMINDER_FROM="Finance Manager <finance@example.com>"
   ```
4. Run database migrations:
   ```
   node apply_simple_loans_migration.js
   node apply_personal_payments_rls_fix.js
   node apply_personal_payments_status_column.js
   ```
5. Start the development server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Vercel Deployment

This application is optimized for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Set up the required environment variables in the Vercel dashboard
3. Deploy from the main branch

#### Handling ESLint Warnings

The project includes configurations to prevent ESLint errors from failing the build:

- ESLint warnings are ignored during builds using the `eslint.ignoreDuringBuilds: true` setting in `next.config.ts`
- An `.eslintrc.json` file disables specific rules that might cause deployment issues
- These settings ensure successful deployment while keeping the code quality tools available during development

### Other Deployment Options

To deploy to other platforms:

1. Build the application: `npm run build`
2. Start the production server: `npm run start`
3. Ensure all environment variables are properly set up on your hosting platform

## Future Enhancements

- Mobile application support
- Enhanced data visualization with more chart types
- Export functionality for financial reports
- Budget tracking and financial goal setting
- Multi-currency support
- Expense categorization and analysis
- Integration with banking APIs for automatic transaction tracking
