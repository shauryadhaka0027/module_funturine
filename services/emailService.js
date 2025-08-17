import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
  
    return nodemailer.createTransport({
       service:"gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
    });
  };

// Send email utility
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    await transporter.sendMail({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html
    });
    
    console.log('Email sent successfully to:', options.to);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Send dealer registration confirmation email
export const sendDealerRegistrationEmail = async (dealer) => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: dealer.email,
    subject: 'Registration Successful - Awaiting Approval',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Moulded Furniture!</h2>
        <p>Dear ${dealer.contactPersonName},</p>
        <p>Thank you for registering with Moulded Furniture. Your registration has been received successfully.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Registration Details:</h3>
          <p><strong>Company Name:</strong> ${dealer.companyName}</p>
          <p><strong>Contact Person:</strong> ${dealer.contactPersonName}</p>
          <p><strong>Email:</strong> ${dealer.email}</p>
          <p><strong>Mobile:</strong> ${dealer.mobile}</p>
          <p><strong>GST Number:</strong> ${dealer.gst}</p>
        </div>
        
        <p><strong>Status:</strong> Pending Admin Approval</p>
        <p>Your application is currently under review. Our admin team will verify your details and approve your account within 24-48 hours.</p>
        <p>Once approved, you will receive a confirmation email and can start placing orders.</p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send dealer approval email
export const sendDealerApprovalEmail = async (dealer) => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: dealer.email,
    subject: 'Account Approved - Welcome to Moulded Furniture!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Congratulations! Your Account is Approved</h2>
        <p>Dear ${dealer.contactPersonName},</p>
        <p>Great news! Your dealer account has been approved by our admin team.</p>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="color: #155724;">You can now:</h3>
          <ul style="color: #155724;">
            <li>Browse our complete product catalog</li>
            <li>Place orders for furniture items</li>
            <li>Track your order status</li>
            <li>Access dealer-specific pricing</li>
          </ul>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h4>Login Details:</h4>
          <p><strong>GST Number:</strong> ${dealer.gst} (Use this as your username)</p>
          <p><strong>Password:</strong> Use the password you set during registration</p>
        </div>
        
        <p>Please visit our website to start exploring our products and place your first order.</p>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send dealer rejection email
export const sendDealerRejectionEmail = async (dealer, reason) => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: dealer.email,
    subject: 'Account Application Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Application Status Update</h2>
        <p>Dear ${dealer.contactPersonName},</p>
        <p>Thank you for your interest in becoming a dealer with Moulded Furniture.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="color: #721c24;">Application Status: Not Approved</h3>
          <p><strong>Reason:</strong> ${reason || 'Application did not meet our current requirements'}</p>
        </div>
        
        <p>We encourage you to review the information provided and consider reapplying in the future if your circumstances change.</p>
        
        <p>If you believe this decision was made in error or have additional information to provide, please contact our support team.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request - Moulded Furniture',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You have requested to reset your password for your Moulded Furniture dealer account.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Click the button below to reset your password:</strong></p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0;">Reset Password</a>
        </div>
        
        <p><strong>Important:</strong></p>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this password reset, please ignore this email</li>
          <li>For security reasons, please don't share this link with anyone</li>
        </ul>
        
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #007bff;">${resetUrl}</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send enquiry confirmation email
export const sendEnquiryConfirmationEmail = async (enquiry) => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: enquiry.dealerInfo.email,
    subject: 'Enquiry Confirmation - Moulded Furniture',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Enquiry Confirmation</h2>
        <p>Dear ${enquiry.dealerInfo.contactPersonName},</p>
        <p>Thank you for your enquiry. We have received your request and it is currently being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Enquiry Details:</h3>
          <p><strong>Enquiry ID:</strong> ${enquiry._id}</p>
          <p><strong>Product Code:</strong> ${enquiry.productCode}</p>
          <p><strong>Product Name:</strong> ${enquiry.productName}</p>
          <p><strong>Color:</strong> ${enquiry.productColor}</p>
          <p><strong>Quantity:</strong> ${enquiry.quantity}</p>
          <p><strong>Price per unit:</strong> ₹${enquiry.price}</p>
          <p><strong>Total Amount:</strong> ₹${enquiry.totalAmount}</p>
          <p><strong>Status:</strong> Pending Review</p>
        </div>
        
        <p>Our team will review your enquiry and get back to you within 24-48 hours with further details.</p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send OTP by email (generic, for email change, registration, etc.)
export const sendOtpByEmail = async (email, otp, context = 'Your OTP code') => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;"> ${context}</h2>
        <p>Dear User,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="font-size: 2rem; font-weight: bold; letter-spacing: 4px; color: #007bff; margin: 20px 0;">${otp}</div>
        <p>This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  return await sendEmail(emailOptions);
};

// Send notification email after successful email change
export const sendEmailChangeSuccessNotification = async (email) => {
  const emailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Your Email Has Been Changed Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Email Change Successful</h2>
        <p>Dear User,</p>
        <p>Your email address has been updated successfully in our system.</p>
        <p>If you did not perform this action, please contact our support team immediately.</p>
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  return await sendEmail(emailOptions);
};