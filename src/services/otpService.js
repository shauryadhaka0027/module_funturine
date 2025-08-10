// Generate OTP with expiration
export const generateOTPWithExpiration = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  return { otp, expiresAt };
};

// Verify OTP
export const verifyOTP = (storedOtp, providedOtp, expiresAt) => {
  const now = new Date();
  
  if (now > expiresAt) {
    return false; // OTP expired
  }
  
  return storedOtp === providedOtp;
};

// Send SMS OTP (mock implementation - replace with actual SMS service)
export const sendSMSOTP = async (mobile, otp) => {
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
export const sendEmailOTP = async (email, otp, companyName) => {
  try {
    // Import nodemailer here to avoid circular dependency
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const emailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Email Verification OTP - Moulded Furniture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p style="color: #666; line-height: 1.6;">
            Thank you for registering with Moulded Furniture. Please use the following OTP to verify your email address:
          </p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
          </p>
          <p style="color: #666; line-height: 1.6;">
            If you have any issues, please contact our support team.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            Moulded Furniture Team
          </p>
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
export const sendPasswordResetOTP = async (email, dealerName) => {
  try {
    const { otp } = generateOTPWithExpiration();
    
    const nodemailer = await import('nodemailer');
    
    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const emailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset OTP - Moulded Furniture',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p style="color: #666; line-height: 1.6;">
            You requested to reset your password for your Moulded Furniture account. Please use the following OTP:
          </p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; line-height: 1.6;">
            This OTP will expire in 10 minutes. If you didn't request this password reset, please contact support immediately.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Enter this OTP in the password reset form to proceed with changing your password.
          </p>
          <p style="color: #666; line-height: 1.6;">
            Best regards,<br>
            Moulded Furniture Team
          </p>
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
