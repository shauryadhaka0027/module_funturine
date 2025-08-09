import nodemailer, { Transporter } from 'nodemailer';
import { IDealer, IEnquiry, EmailOptions } from '../types/index';

// Create transporter
const createTransporter = (): Transporter => {
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
const sendEmail = async (options: EmailOptions): Promise<boolean> => {
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
export const sendDealerRegistrationEmail = async (dealer: IDealer): Promise<boolean> => {
  const emailOptions: EmailOptions = {
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
export const sendDealerApprovalEmail = async (dealer: IDealer): Promise<boolean> => {
  const emailOptions: EmailOptions = {
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
        
        <p>You can now log in to our system and start placing orders. Welcome to the Moulded Furniture family!</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send dealer rejection email
export const sendDealerRejectionEmail = async (dealer: IDealer, reason: string): Promise<boolean> => {
  const emailOptions: EmailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: dealer.email,
    subject: 'Registration Application Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Registration Application Update</h2>
        <p>Dear ${dealer.contactPersonName},</p>
        <p>We have reviewed your dealer registration application for ${dealer.companyName}.</p>
        
        <div style="background-color: #f8d7da; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <p style="color: #721c24;">Unfortunately, we are unable to approve your application at this time.</p>
          <p style="color: #721c24;"><strong>Reason:</strong> ${reason}</p>
        </div>
        
        <p>If you believe this decision was made in error or if you have additional information to provide, please contact our support team.</p>
        <p>You may also reapply with updated information if applicable.</p>
        
        <p>Thank you for your interest in Moulded Furniture.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, resetToken: string): Promise<boolean> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const emailOptions: EmailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested a password reset for your Moulded Furniture account.</p>
        <p>Click the link below to reset your password:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        
        <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};

// Send enquiry confirmation email
export const sendEnquiryConfirmationEmail = async (enquiry: IEnquiry): Promise<boolean> => {
  const emailOptions: EmailOptions = {
    from: `"Moulded Furniture" <${process.env.SMTP_USER}>`,
    to: enquiry.dealerInfo.email,
    subject: 'Order Enquiry Received - Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Order Enquiry Received!</h2>
        <p>Dear ${enquiry.dealerInfo.contactPersonName},</p>
        <p>Thank you for your enquiry. We have received your order request and our team will process it shortly.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333;">Order Details:</h3>
          <p><strong>Product:</strong> ${enquiry.productName} (${enquiry.productCode})</p>
          <p><strong>Color:</strong> ${enquiry.productColor}</p>
          <p><strong>Quantity:</strong> ${enquiry.quantity}</p>
          <p><strong>Unit Price:</strong> ₹${enquiry.price.toFixed(2)}</p>
          <p><strong>Total Amount:</strong> ₹${enquiry.totalAmount.toFixed(2)}</p>
          ${enquiry.remarks ? `<p><strong>Remarks:</strong> ${enquiry.remarks}</p>` : ''}
        </div>
        
        <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Status:</strong> ${enquiry.status.charAt(0).toUpperCase() + enquiry.status.slice(1)}</p>
          <p>We will review your enquiry and get back to you within 24 hours with confirmation and further details.</p>
        </div>
        
        <p>You can track the status of your enquiry by logging into your dealer account.</p>
        
        <p>Best regards,<br>Moulded Furniture Team</p>
      </div>
    `
  };
  
  return await sendEmail(emailOptions);
};
