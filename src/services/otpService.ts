import { EmailOptions } from '../types/index';

// Generate OTP with expiration
export const generateOTPWithExpiration = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  return { otp, expiresAt };
};

// Verify OTP
export const verifyOTP = (storedOtp: string, providedOtp: string, expiresAt: Date): boolean => {
  const now = new Date();
  
  if (now > expiresAt) {
    return false; // OTP expired
  }
  
  return storedOtp === providedOtp;
};

// Send SMS OTP (mock implementation - replace with actual SMS service)
export const sendSMSOTP = async (mobile: string, otp: string): Promise<boolean> => {
  try {
    // Mock SMS sending - in production, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS OTP sent to ${mobile}: ${otp}`);
    
    // For development/testing purposes, always return true
    // In production, implement actual SMS sending logic here
    
    return true;
  } catch (error) {
    console.error('SMS sending failed:', error);
    return false;
  }
};

// Send Email OTP
export const sendEmailOTP = async (email: string, otp: string, companyName: string): Promise<boolean> => {
  try {
    // Import nodemailer here to avoid circular dependency
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const emailOptions = {
      from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Email Verification OTP - Moulded Furniture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Dear ${companyName} Team,</p>
          <p>Thank you for registering with Moulded Furniture. Please use the following OTP to verify your email address:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; display: inline-block; border: 2px dashed #007bff;">
              <h1 style="color: #007bff; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this verification, please ignore this email</li>
          </ul>
          
          <p>If you have any issues, please contact our support team.</p>
          
          <p>Best regards,<br>Moulded Furniture Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(emailOptions);
    console.log('Email OTP sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Email OTP sending failed:', error);
    return false;
  }
};

// Generate and send OTP for password reset
export const sendPasswordResetOTP = async (email: string, dealerName: string): Promise<string | null> => {
  try {
    const { otp } = generateOTPWithExpiration();
    
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const emailOptions = {
      from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Moulded Furniture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Dear ${dealerName},</p>
          <p>You requested to reset your password for your Moulded Furniture account. Please use the following OTP:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #fff3cd; padding: 20px; border-radius: 5px; display: inline-block; border: 2px dashed #ffc107;">
              <h1 style="color: #856404; margin: 0; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
            </div>
          </div>
          
          <p><strong>Security Notice:</strong></p>
          <ul>
            <li>This OTP is valid for 10 minutes only</li>
            <li>Do not share this OTP with anyone</li>
            <li>If you didn't request this password reset, please contact support immediately</li>
          </ul>
          
          <p>Enter this OTP in the password reset form to proceed with changing your password.</p>
          
          <p>Best regards,<br>Moulded Furniture Team</p>
        </div>
      `
    };
    
    await transporter.sendMail(emailOptions);
    console.log('Password reset OTP sent successfully to:', email);
    return otp;
  } catch (error) {
    console.error('Password reset OTP sending failed:', error);
    return null;
  }
};
