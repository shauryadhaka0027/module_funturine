import dotenv from 'dotenv';
import { sendDealerRegistrationEmail } from '../services/emailService';

// Load environment variables
dotenv.config();

const testEmail = async () => {
  try {
    // Check if email configuration is set
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('❌ Email configuration missing!');
      console.log('Please set the following environment variables:');
      console.log('- SMTP_USER: Your email address');
      console.log('- SMTP_PASS: Your email app password');
      process.exit(1);
    }

    console.log('Testing email service...');
    console.log('SMTP Host:', process.env.SMTP_HOST || 'smtp.gmail.com');
    console.log('SMTP Port:', process.env.SMTP_PORT || '587');
    console.log('SMTP User:', process.env.SMTP_USER);

    // Mock dealer object for testing
    const mockDealer = {
      companyName: 'Test Company Ltd.',
      contactPersonName: 'John Doe',
      email: process.env.SMTP_USER, // Send test email to yourself
      mobile: '9876543210',
      gst: '27AAAAA0000A1Z5',
      address: '123 Test Street, Test City'
    } as any;

    console.log('\nSending test email...');
    const emailSent = await sendDealerRegistrationEmail(mockDealer);

    if (emailSent) {
      console.log('✅ Test email sent successfully!');
      console.log(`Check your inbox at ${process.env.SMTP_USER}`);
    } else {
      console.log('❌ Failed to send test email');
    }

  } catch (error) {
    console.error('❌ Error testing email:', error);
  }
};

// Run the script
testEmail();
