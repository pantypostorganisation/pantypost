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
    const transporter = nodemailer.createTransporter({
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
  // Branded template for verification code - enhanced but email-safe
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            margin: 0;
            padding: 0;
            background-color: #000000;
          }
          .wrapper {
            background-color: #000000;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #1a1a1a;
          }
          .header {
            background-color: #ff950e;
            color: #000000;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -1px;
          }
          .header .tagline {
            margin-top: 5px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.8;
          }
          .logo {
            display: block;
            max-width: 150px;
            height: auto;
            margin: 0 auto 15px;
          }
          .content {
            padding: 40px 30px;
            background-color: #0a0a0a;
          }
          .content h2 {
            color: #ffffff;
            text-align: center;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .greeting {
            text-align: center;
            color: #9ca3af;
            margin-bottom: 25px;
          }
          .greeting .username {
            color: #ff950e;
            font-weight: 600;
          }
          .code-box {
            background-color: #1a1a1a;
            border: 2px solid #ff950e;
            border-radius: 10px;
            padding: 25px;
            margin: 30px auto;
            text-align: center;
            max-width: 400px;
          }
          .code {
            font-size: 42px;
            font-weight: bold;
            color: #ff950e;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .code-expiry {
            color: #9ca3af;
            font-size: 13px;
            margin-top: 10px;
          }
          .timer-warning {
            background-color: rgba(255, 149, 14, 0.1);
            border-left: 3px solid #ff950e;
            padding: 12px 20px;
            margin: 25px 0;
            color: #fbbf24;
            font-size: 14px;
            text-align: center;
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
            font-weight: 700;
            font-size: 16px;
          }
          .alt-link {
            text-align: center;
            color: #6b7280;
            font-size: 13px;
            margin: 20px 0;
          }
          .alt-link a {
            color: #ff950e;
            text-decoration: none;
          }
          .security-notice {
            background-color: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0 20px;
            color: #9ca3af;
            font-size: 14px;
          }
          .security-notice .icon {
            color: #ff950e;
            font-weight: 600;
          }
          .footer {
            background-color: #050505;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #1a1a1a;
          }
          .footer .brand {
            color: #ffffff;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .footer .copyright {
            color: #4b5563;
            font-size: 11px;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <img src="${process.env.FRONTEND_URL}/logo.png" alt="PantyPost" class="logo" />
              <h1>PantyPost</h1>
              <div class="tagline">Premium Marketplace</div>
            </div>
            
            <div class="content">
              <h2>Password Reset Request</h2>
              <p class="greeting">
                Hello <span class="username">${username}</span>!
              </p>
              
              <p style="color: #d1d5db; text-align: center; margin: 20px 0;">
                We received a request to reset your password.<br>
                Use the verification code below to continue:
              </p>
              
              <div class="code-box">
                <div class="code">${code}</div>
                <div class="code-expiry">Valid for 15 minutes</div>
              </div>
              
              <div class="timer-warning">
                ⏱️ This code expires in 15 minutes
              </div>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="button">
                  Enter Reset Code
                </a>
              </div>
              
              <p class="alt-link">
                Or visit this link:<br>
                <a href="${process.env.FRONTEND_URL}/verify-reset-code">
                  ${process.env.FRONTEND_URL}/verify-reset-code
                </a>
              </p>
              
              <div class="security-notice">
                <span class="icon">🛡️ Security Notice:</span><br>
                If you didn't request this password reset, you can safely ignore this email. 
                Your password won't be changed without entering this code.
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">PantyPost</div>
              <div>The premium marketplace for authentic items</div>
              <div class="copyright">
                This is an automated message, please do not reply.<br>
                © ${new Date().getFullYear()} PantyPost. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${username}!

We received a request to reset your PantyPost password.

Your verification code is: ${code}

This code will expire in 15 minutes.

Enter this code on the password reset page to continue.

If you didn't request this password reset, you can safely ignore this email. Your password won't be changed.

Best regards,
The PantyPost Team
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
            background-color: #ff950e;
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
            background-color: #ff950e;
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
  
  // Password reset success email - branded version
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .wrapper {
            background-color: #f5f5f5;
            padding: 40px 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            background-color: #22c55e;
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
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
            font-weight: 700;
            font-size: 16px;
          }
          .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 15px;
            margin: 25px 0;
            color: #dc2626;
            font-size: 14px;
            text-align: center;
          }
          .footer {
            background-color: #f9fafb;
            padding: 25px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
          }
          .footer .brand {
            color: #111827;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>Password Reset Successful</h1>
            </div>
            
            <div class="content">
              <div class="success-icon">✅</div>
              
              <h2 style="text-align: center; color: #111827;">Hello ${username}!</h2>
              
              <p style="text-align: center; color: #6b7280; margin: 20px 0;">
                Your PantyPost password has been successfully reset.
              </p>
              
              <p style="text-align: center; color: #6b7280;">
                You can now log in with your new password.
              </p>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/login" class="button">
                  Log In to PantyPost
                </a>
              </div>
              
              <div class="warning">
                ⚠️ <strong>Important Security Notice:</strong><br>
                If you didn't make this change, please contact our support team immediately.
              </div>
            </div>
            
            <div class="footer">
              <div class="brand">PantyPost</div>
              <div>The premium marketplace for authentic items</div>
              <div style="margin-top: 15px; color: #9ca3af; font-size: 11px;">
                This is an automated message, please do not reply.<br>
                © ${new Date().getFullYear()} PantyPost. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Hello ${username}!

Your PantyPost password has been successfully reset.

You can now log in with your new password.

If you didn't make this change, please contact our support team immediately.

Best regards,
The PantyPost Team
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};