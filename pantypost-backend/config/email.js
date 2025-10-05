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
  // New template for verification code - DARK MODE SAFE & RESPONSIVE WITH LOGO
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <style>
          /* Force dark mode colors */
          :root {
            color-scheme: dark !important;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff !important;
            margin: 0;
            padding: 0;
            background-color: #000000 !important;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          /* Main container */
          .wrapper {
            background-color: #000000 !important;
            width: 100%;
            table-layout: fixed;
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #000000 !important;
          }
          
          /* Force dark backgrounds on all elements */
          table, tr, td, div {
            background-color: transparent !important;
          }
          
          /* Header section */
          .header {
            background-color: #0a0a0a !important;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #ff950e;
          }
          
          .header h1 {
            color: #ffffff !important;
            font-size: 24px;
            margin: 15px 0 5px 0;
            font-weight: normal;
          }
          
          /* Content section */
          .content {
            background-color: #0a0a0a !important;
            padding: 40px 30px;
          }
          
          .greeting {
            color: #ffffff !important;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 20px 0;
          }
          
          .message {
            color: #cccccc !important;
            font-size: 16px;
            margin: 0 0 30px 0;
            line-height: 1.6;
          }
          
          /* Code display box */
          .code-box {
            background-color: #1a1a1a !important;
            border: 2px solid #ff950e;
            border-radius: 12px;
            padding: 25px 15px;
            margin: 30px 0;
            text-align: center;
          }
          
          .code-label {
            color: #ff950e !important;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 15px 0;
            display: block;
          }
          
          .code {
            font-family: 'Courier New', monospace;
            font-size: 36px;
            font-weight: bold;
            color: #ff950e !important;
            letter-spacing: 8px;
            margin: 0;
            padding: 10px 5px;
            display: block;
          }
          
          /* Timer notice */
          .expiry-notice {
            background-color: #1a0a00 !important;
            border-left: 3px solid #ff950e;
            padding: 15px 20px;
            margin: 25px 0;
            border-radius: 6px;
          }
          
          .expiry-text {
            color: #ffb347 !important;
            font-size: 14px;
            font-weight: bold;
            margin: 0;
          }
          
          /* CTA Button */
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          
          .button {
            display: inline-block;
            padding: 14px 35px;
            background-color: #ff950e !important;
            color: #000000 !important;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            border: 2px solid #ff950e;
          }
          
          /* Alternative link section */
          .link-container {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background-color: #0f0f0f !important;
            border-radius: 8px;
            border: 1px solid #222222;
          }
          
          .link-text {
            color: #999999 !important;
            font-size: 13px;
            margin: 0 0 8px 0;
          }
          
          .link {
            color: #ff950e !important;
            font-size: 14px;
            word-break: break-all;
            text-decoration: underline;
          }
          
          /* Security notice */
          .security-notice {
            background-color: #0f0f0f !important;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          
          .security-text {
            color: #999999 !important;
            font-size: 14px;
            line-height: 1.6;
            margin: 0;
          }
          
          .security-text strong {
            color: #ffffff !important;
          }
          
          /* Footer section */
          .footer {
            background-color: #000000 !important;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #333333;
          }
          
          .footer-logo {
            color: #ff950e !important;
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 10px 0;
          }
          
          .footer-tagline {
            color: #666666 !important;
            font-size: 12px;
            margin: 0 0 20px 0;
          }
          
          .footer-links {
            margin: 20px 0;
          }
          
          .footer-link {
            color: #999999 !important;
            text-decoration: none;
            font-size: 12px;
            margin: 0 15px;
            display: inline-block;
          }
          
          .copyright {
            color: #555555 !important;
            font-size: 11px;
            margin: 20px 0 0 0;
          }
          
          .automated-notice {
            color: #444444 !important;
            font-size: 10px;
            margin: 10px 0 0 0;
            font-style: italic;
          }
          
          /* Mobile responsive styles */
          @media only screen and (max-width: 600px) {
            .container {
              width: 100% !important;
            }
            
            .content {
              padding: 25px 15px !important;
            }
            
            .header {
              padding: 20px 15px !important;
            }
            
            .header h1 {
              font-size: 20px !important;
            }
            
            .greeting {
              font-size: 18px !important;
            }
            
            .message {
              font-size: 14px !important;
            }
            
            .code-box {
              padding: 20px 10px !important;
              margin: 20px 0 !important;
            }
            
            .code {
              font-size: 24px !important;
              letter-spacing: 4px !important;
              padding: 10px 0 !important;
            }
            
            .button {
              padding: 12px 25px !important;
              font-size: 14px !important;
              display: block !important;
              width: 80% !important;
              margin: 0 auto !important;
            }
            
            .footer-link {
              display: block !important;
              margin: 8px 0 !important;
            }
            
            .link-container {
              padding: 15px 10px !important;
            }
            
            .security-notice {
              padding: 15px !important;
            }
          }
          
          /* Ultra small mobile */
          @media only screen and (max-width: 380px) {
            .code {
              font-size: 20px !important;
              letter-spacing: 2px !important;
            }
            
            .button {
              width: 90% !important;
              padding: 10px 20px !important;
            }
          }
          
          /* Force dark mode for Gmail and others */
          @media (prefers-color-scheme: dark) {
            body, .wrapper, .container {
              background-color: #000000 !important;
            }
            
            .header, .content {
              background-color: #0a0a0a !important;
            }
            
            .code-box {
              background-color: #1a1a1a !important;
            }
            
            * {
              color: inherit !important;
            }
          }
          
          /* Outlook dark mode */
          [data-ogsc] .wrapper,
          [data-ogsc] .container,
          [data-ogsc] .header,
          [data-ogsc] .content,
          [data-ogsc] .footer {
            background-color: #000000 !important;
          }
          
          /* Apple Mail dark mode */
          @supports (color-scheme: dark) {
            @media (prefers-color-scheme: dark) {
              .wrapper, .container {
                background-color: #000000 !important;
              }
            }
          }
        </style>
      </head>
      <body style="background-color: #000000 !important; color: #ffffff !important;">
        <div class="wrapper" style="background-color: #000000 !important;">
          <div class="container" style="background-color: #000000 !important;">
            <!-- Header with logo image -->
            <div class="header" style="background-color: #0a0a0a !important;">
              <img src="https://pantypost.com/logo.png" alt="PantyPost" style="display: block; margin: 0 auto; border: 0; outline: none; width: 240px; height: auto; max-width: 90%;">
              <h1 style="color: #ffffff !important;">Password Reset Request</h1>
            </div>
            
            <!-- Main content -->
            <div class="content" style="background-color: #0a0a0a !important;">
              <h2 class="greeting" style="color: #ffffff !important;">Hello ${username}! 👋</h2>
              
              <p class="message" style="color: #cccccc !important;">
                We received a request to reset your PantyPost account password. Use the verification code below to proceed with resetting your password.
              </p>
              
              <!-- Verification code -->
              <div class="code-box" style="background-color: #1a1a1a !important;">
                <span class="code-label" style="color: #ff950e !important;">Your Verification Code</span>
                <span class="code" style="color: #ff950e !important;">${code}</span>
              </div>
              
              <!-- Timer -->
              <div class="expiry-notice" style="background-color: #1a0a00 !important;">
                <p class="expiry-text" style="color: #ffb347 !important;">⏱ This code expires in 15 minutes</p>
              </div>
              
              <p class="message" style="color: #cccccc !important;">
                Enter this code on the password reset page to create your new password.
              </p>
              
              <!-- CTA button -->
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="button" style="background-color: #ff950e !important; color: #000000 !important;">
                  Enter Reset Code →
                </a>
              </div>
              
              <!-- Alternative link -->
              <div class="link-container" style="background-color: #0f0f0f !important;">
                <p class="link-text" style="color: #999999 !important;">Or copy and paste this link into your browser:</p>
                <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="link" style="color: #ff950e !important;">
                  ${process.env.FRONTEND_URL}/verify-reset-code
                </a>
              </div>
              
              <!-- Security notice -->
              <div class="security-notice" style="background-color: #0f0f0f !important;">
                <p class="security-text" style="color: #999999 !important;">
                  <strong style="color: #ffffff !important;">🔒 Didn't request this?</strong><br>
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer" style="background-color: #000000 !important;">
              <p class="footer-logo" style="color: #ff950e !important;">PantyPost</p>
              <p class="footer-tagline" style="color: #666666 !important;">The premium marketplace for authentic items</p>
              
              <div class="footer-links">
                <a href="${process.env.FRONTEND_URL}/terms" class="footer-link" style="color: #999999 !important;">Terms</a>
                <a href="${process.env.FRONTEND_URL}/help" class="footer-link" style="color: #999999 !important;">Support</a>
                <a href="${process.env.FRONTEND_URL}/browse" class="footer-link" style="color: #999999 !important;">Browse</a>
              </div>
              
              <p class="copyright" style="color: #555555 !important;">© ${new Date().getFullYear()} PantyPost. All rights reserved.</p>
              <p class="automated-notice" style="color: #444444 !important;">This is an automated message, please do not reply to this email.</p>
            </div>
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
  
  // Password reset success email - also dark mode safe with logo
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <style>
          :root {
            color-scheme: dark !important;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff !important;
            margin: 0;
            padding: 0;
            background-color: #000000 !important;
          }
          
          .wrapper {
            background-color: #000000 !important;
            width: 100%;
          }
          
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #000000 !important;
          }
          
          .header {
            background-color: #0a0a0a !important;
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #28a745;
          }
          
          .header h1 {
            color: #28a745 !important;
            font-size: 24px;
            margin: 15px 0 5px 0;
            font-weight: normal;
          }
          
          .content {
            background-color: #0a0a0a !important;
            padding: 40px 30px;
          }
          
          .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            background-color: #28a745 !important;
            border-radius: 50%;
            display: table;
            text-align: center;
          }
          
          .checkmark {
            color: white !important;
            font-size: 40px;
            font-weight: bold;
            line-height: 80px;
          }
          
          .greeting {
            color: #ffffff !important;
            font-size: 22px;
            font-weight: bold;
            margin: 0 0 20px 0;
          }
          
          .message {
            color: #cccccc !important;
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
            background-color: #ff950e !important;
            color: #000000 !important;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
          }
          
          .footer {
            background-color: #000000 !important;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #333333;
          }
          
          .footer-text {
            color: #666666 !important;
            font-size: 12px;
            margin: 0;
          }
          
          @media only screen and (max-width: 600px) {
            .content {
              padding: 25px 15px !important;
            }
            
            .button {
              display: block !important;
              width: 80% !important;
              margin: 0 auto !important;
            }
          }
          
          @media (prefers-color-scheme: dark) {
            body, .wrapper, .container {
              background-color: #000000 !important;
            }
            
            .header, .content {
              background-color: #0a0a0a !important;
            }
          }
        </style>
      </head>
      <body style="background-color: #000000 !important;">
        <div class="wrapper" style="background-color: #000000 !important;">
          <div class="container" style="background-color: #000000 !important;">
            <div class="header" style="background-color: #0a0a0a !important;">
              <img src="https://pantypost.com/logo.png" alt="PantyPost" width="180" height="60" style="display: block; margin: 0 auto; border: 0; outline: none;">
              <h1 style="color: #28a745 !important;">Password Successfully Reset</h1>
            </div>
            
            <div class="content" style="background-color: #0a0a0a !important;">
              <div class="success-icon" style="background-color: #28a745 !important;">
                <div class="checkmark" style="color: white !important;">✓</div>
              </div>
              
              <h2 class="greeting" style="color: #ffffff !important;">Great news, ${username}! 🎉</h2>
              
              <p class="message" style="color: #cccccc !important;">
                Your PantyPost password has been successfully reset. You can now log in with your new password.
              </p>
              
              <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/login" class="button" style="background-color: #ff950e !important; color: #000000 !important;">
                  Log In Now →
                </a>
              </div>
              
              <p class="message" style="color: #cccccc !important;">
                If you didn't make this change, please contact our support team immediately.
              </p>
            </div>
            
            <div class="footer" style="background-color: #000000 !important;">
              <p class="footer-text" style="color: #666666 !important;">
                © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
                This is an automated message, please do not reply to this email.
              </p>
            </div>
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