// pantypost-backend/config/email.js
const nodemailer = require('nodemailer');

// Create email transporter
const createTransporter = () => {
  // Check if we have email credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not set. Emails will be logged to console only.');
    return null;
  }
  
  try {
    // Create reusable transporter object using SMTP transport
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Email transporter created successfully');
    
    // Verify connection configuration
    transporter.verify(function(error, success) {
      if (error) {
        console.error('❌ Email verification failed:', error.message);
      } else {
        console.log('✅ Email server is ready to send messages');
      }
    });
    
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error.message);
    console.error('Error details:', error);
    return null;
  }
};

// Send an email
const sendEmail = async (options) => {
  const transporter = createTransporter();
  
  // If no transporter (no credentials), just log the email
  if (!transporter) {
    console.log('📧 EMAIL WOULD BE SENT:');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('Content:', options.text || options.html);
    
    // Add helpful link for password reset emails
    if (options.subject && options.subject.includes('Password Reset Code')) {
      console.log('\n🔗 Quick Link: ' + process.env.FRONTEND_URL + '/verify-reset-code');
      console.log('   (Copy the code above and paste it at this link)');
    }
    
    console.log('-------------------');
    return { messageId: 'console-only' };
  }
  
  try {
    // Send the email
    const info = await transporter.sendMail({
      from: `"PantyPost" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // In development, still continue even if email fails
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 EMAIL CONTENT (failed to send):');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Content:', options.text || options.html);
      console.log('-------------------');
      // Return success in development to continue flow
      return { messageId: 'dev-mode-email' };
    }
    throw error;
  }
};

// Email templates
const emailTemplates = {
  // New template for verification code - SAFE VERSION
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            margin: 0;
            padding: 0;
            background-color: #000000;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #000000;
          }
          .header {
            background-color: #0a0a0a;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #ff950e;
          }
          .header h1 {
            color: #ffffff;
            font-size: 26px;
            margin: 15px 0 5px 0;
            font-weight: normal;
          }
          .logo-text {
            color: #ff950e;
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .content {
            background-color: #0a0a0a;
            padding: 40px 30px;
          }
          .greeting {
            color: #ffffff;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 20px 0;
          }
          .message {
            color: #cccccc;
            font-size: 16px;
            margin: 0 0 30px 0;
            line-height: 1.6;
          }
          .code-box {
            background-color: #1a1a1a;
            border: 2px solid #ff950e;
            border-radius: 12px;
            padding: 30px 20px;
            margin: 30px 0;
            text-align: center;
          }
          .code-label {
            color: #ff950e;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 15px 0;
          }
          .code {
            font-family: monospace;
            font-size: 38px;
            font-weight: bold;
            color: #ff950e;
            letter-spacing: 10px;
            margin: 0;
            padding: 10px;
          }
          .expiry-notice {
            background-color: #1a0a00;
            border-left: 3px solid #ff950e;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 6px;
          }
          .expiry-text {
            color: #ffb347;
            font-size: 14px;
            font-weight: bold;
            margin: 0;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #ff950e;
            color: #000000;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
          }
          .link-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background-color: #0f0f0f;
            border-radius: 8px;
          }
          .link-text {
            color: #999999;
            font-size: 13px;
            margin: 0 0 8px 0;
          }
          .link {
            color: #ff950e;
            font-size: 14px;
            word-break: break-all;
          }
          .security-notice {
            background-color: #0f0f0f;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .security-text {
            color: #999999;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          .footer {
            background-color: #000000;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #333333;
          }
          .footer-logo {
            color: #ff950e;
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .footer-tagline {
            color: #666666;
            font-size: 12px;
            margin: 0 0 20px 0;
          }
          .footer-links {
            margin: 20px 0;
          }
          .footer-link {
            color: #999999;
            text-decoration: none;
            font-size: 12px;
            margin: 0 15px;
          }
          .copyright {
            color: #555555;
            font-size: 11px;
            margin: 20px 0 0 0;
          }
          .automated-notice {
            color: #444444;
            font-size: 10px;
            margin: 10px 0 0 0;
            font-style: italic;
          }
          @media only screen and (max-width: 600px) {
            .content {
              padding: 30px 20px;
            }
            .greeting {
              font-size: 20px;
            }
            .code {
              font-size: 28px;
              letter-spacing: 6px;
            }
            .button {
              padding: 12px 30px;
              font-size: 14px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">PantyPost</div>
            <h1>Password Reset Request</h1>
          </div>
          
          <div class="content">
            <h2 class="greeting">Hello ${username}!</h2>
            
            <p class="message">
              We received a request to reset your PantyPost account password. Use the verification code below to proceed with resetting your password.
            </p>
            
            <div class="code-box">
              <p class="code-label">Your Verification Code</p>
              <p class="code">${code}</p>
            </div>
            
            <div class="expiry-notice">
              <p class="expiry-text">⏱ This code expires in 15 minutes</p>
            </div>
            
            <p class="message">
              Enter this code on the password reset page to create your new password.
            </p>
            
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="button">
                Enter Reset Code
              </a>
            </div>
            
            <div class="link-container">
              <p class="link-text">Or copy and paste this link into your browser:</p>
              <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="link">
                ${process.env.FRONTEND_URL}/verify-reset-code
              </a>
            </div>
            
            <div class="security-notice">
              <p class="security-text">
                <strong>Didn't request this?</strong><br>
                If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-logo">PantyPost</p>
            <p class="footer-tagline">The premium marketplace for authentic items</p>
            
            <div class="footer-links">
              <a href="${process.env.FRONTEND_URL}/terms" class="footer-link">Terms</a>
              <a href="${process.env.FRONTEND_URL}/help" class="footer-link">Support</a>
              <a href="${process.env.FRONTEND_URL}/browse" class="footer-link">Browse</a>
            </div>
            
            <p class="copyright">© ${new Date().getFullYear()} PantyPost. All rights reserved.</p>
            <p class="automated-notice">This is an automated message, please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${username}!

We received a request to reset your PantyPost account password.

Your verification code is: ${code}

This code expires in 15 minutes.

Enter this code on the password reset page to create your new password:
${process.env.FRONTEND_URL}/verify-reset-code

Didn't request this?
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.

Best regards,
The PantyPost Team

© ${new Date().getFullYear()} PantyPost. All rights reserved.
This is an automated message, please do not reply to this email.
    `
  }),

  // Original password reset email template (keeping for backward compatibility)
  passwordReset: (username, resetLink) => ({
    subject: 'Reset Your PantyPost Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #ff1493;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #ff1493;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>PantyPost Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${username}!</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            
            <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
            
            <p>If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.</p>
            
            <div class="footer">
              <p>Best regards,<br>The PantyPost Team</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${username}!

We received a request to reset your PantyPost password.

To reset your password, visit this link:
${resetLink}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.

Best regards,
The PantyPost Team
    `
  }),
  
  // Password reset success email
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            margin: 0;
            padding: 0;
            background-color: #000000;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #000000;
          }
          .header {
            background-color: #0a0a0a;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #28a745;
          }
          .header h1 {
            color: #28a745;
            font-size: 26px;
            margin: 15px 0 5px 0;
            font-weight: normal;
          }
          .logo-text {
            color: #ff950e;
            font-size: 32px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          .content {
            background-color: #0a0a0a;
            padding: 40px 30px;
          }
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            background-color: #28a745;
            border-radius: 50%;
            display: table;
            text-align: center;
          }
          .checkmark {
            color: white;
            font-size: 40px;
            font-weight: bold;
            line-height: 80px;
          }
          .greeting {
            color: #ffffff;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 20px 0;
          }
          .message {
            color: #cccccc;
            font-size: 16px;
            margin: 0 0 30px 0;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #ff950e;
            color: #000000;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            background-color: #000000;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #333333;
          }
          .footer-text {
            color: #666666;
            font-size: 12px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">PantyPost</div>
            <h1>Password Successfully Reset</h1>
          </div>
          
          <div class="content">
            <div class="success-icon">
              <div class="checkmark">✓</div>
            </div>
            
            <h2 class="greeting">Great news, ${username}!</h2>
            
            <p class="message">
              Your PantyPost password has been successfully reset. You can now log in with your new password.
            </p>
            
            <div class="button-container">
              <a href="${process.env.FRONTEND_URL}/login" class="button">
                Log In Now
              </a>
            </div>
            
            <p class="message">
              If you didn't make this change, please contact our support team immediately.
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
              This is an automated message, please do not reply to this email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${username}!

Great news! Your PantyPost password has been successfully reset.

You can now log in with your new password at:
${process.env.FRONTEND_URL}/login

If you didn't make this change, please contact our support team immediately.

Best regards,
The PantyPost Team

© ${new Date().getFullYear()} PantyPost. All rights reserved.
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};