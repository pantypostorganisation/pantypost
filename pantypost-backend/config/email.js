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
  // Using Gmail's exact dark mode colors - #202124 background
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          :root {
            color-scheme: light dark;
          }
          
          @media (prefers-color-scheme: dark) {
            .darkmode { 
              background-color: #202124 !important;
            }
            .darkmode-secondary {
              background-color: #303134 !important;
            }
            .darkmode-text {
              color: #e8eaed !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background-color:#202124;">
        <div style="background-color:#202124;width:100%;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#202124;">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#202124;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#303134;padding:30px;text-align:center;border-bottom:3px solid #ff950e;">
                      <a href="https://pantypost.com/" style="text-decoration:none;">
                        <img src="https://pantypost.com/logo.png" alt="PantyPost" width="200" style="display:block;margin:0 auto;border:0;">
                      </a>
                      <h1 style="color:#e8eaed;font-size:24px;font-weight:400;margin:20px 0 0 0;">Password Reset Request</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="background-color:#202124;padding:40px 30px;">
                      <h2 style="color:#e8eaed;font-size:20px;margin:0 0 20px 0;">Hello ${username}! 👋</h2>
                      
                      <p style="color:#9aa0a6;font-size:16px;line-height:1.6;margin:0 0 30px 0;">
                        We received a request to reset your PantyPost account password. Use the verification code below to proceed with resetting your password.
                      </p>
                      
                      <!-- Code Box -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:30px 0;">
                        <tr>
                          <td align="center">
                            <div style="background-color:#303134;border:2px solid #ff950e;border-radius:8px;padding:30px;text-align:center;">
                              <div style="color:#ff950e;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;margin-bottom:15px;">
                                Your Verification Code
                              </div>
                              <div style="color:#ff950e;font-size:32px;font-weight:bold;letter-spacing:6px;font-family:'Courier New',monospace;">
                                ${code}
                              </div>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Timer Notice -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:25px 0;">
                        <tr>
                          <td>
                            <div style="background-color:#3c2a1a;border-left:3px solid #ff950e;padding:15px;">
                              <p style="color:#ffb347;font-size:14px;margin:0;">⏱ This code expires in 15 minutes</p>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color:#9aa0a6;font-size:16px;line-height:1.6;margin:0 0 30px 0;">
                        Enter this code on the password reset page to create your new password.
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                        <tr>
                          <td align="center" style="padding:20px 0;">
                            <a href="${process.env.FRONTEND_URL}/verify-reset-code" 
                               style="background-color:#ff950e;color:#202124;text-decoration:none;padding:14px 35px;border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">
                              Enter Reset Code →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Alternative Link -->
                      <div style="background-color:#303134;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
                        <p style="color:#9aa0a6;font-size:14px;margin:0 0 8px 0;">
                          Or copy and paste this link into your browser:
                        </p>
                        <a href="${process.env.FRONTEND_URL}/verify-reset-code" style="color:#ff950e;font-size:14px;text-decoration:underline;">
                          ${process.env.FRONTEND_URL}/verify-reset-code
                        </a>
                      </div>
                      
                      <!-- Security Notice -->
                      <div style="background-color:#303134;border:1px solid #5f6368;border-radius:8px;padding:20px;margin:30px 0;">
                        <p style="color:#9aa0a6;font-size:14px;line-height:1.6;margin:0;">
                          <strong style="color:#e8eaed;">🔒 Didn't request this?</strong><br>
                          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#202124;padding:30px;text-align:center;border-top:1px solid #5f6368;">
                      <p style="color:#ff950e;font-weight:bold;font-size:18px;margin:0;">PantyPost</p>
                      <p style="color:#9aa0a6;font-size:12px;margin:5px 0 20px 0;">The premium marketplace for authentic items</p>
                      
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td style="padding:0 10px;">
                            <a href="${process.env.FRONTEND_URL}/terms" style="color:#ff950e;text-decoration:none;font-size:12px;">Terms</a>
                          </td>
                          <td style="padding:0 10px;">
                            <a href="${process.env.FRONTEND_URL}/help" style="color:#ff950e;text-decoration:none;font-size:12px;">Support</a>
                          </td>
                          <td style="padding:0 10px;">
                            <a href="${process.env.FRONTEND_URL}/browse" style="color:#ff950e;text-decoration:none;font-size:12px;">Browse</a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color:#5f6368;font-size:11px;margin:20px 0 0 0;">
                        © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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
  
  // Password reset success email - using Gmail dark mode colors
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <style>
          :root {
            color-scheme: light dark;
          }
          
          @media (prefers-color-scheme: dark) {
            .darkmode { 
              background-color: #202124 !important;
            }
            .darkmode-secondary {
              background-color: #303134 !important;
            }
            .darkmode-text {
              color: #e8eaed !important;
            }
          }
        </style>
      </head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background-color:#202124;">
        <div style="background-color:#202124;width:100%;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background-color:#202124;">
            <tr>
              <td align="center" style="padding:40px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background-color:#202124;">
                  <!-- Header -->
                  <tr>
                    <td style="background-color:#303134;padding:30px;text-align:center;border-bottom:3px solid #28a745;">
                      <a href="https://pantypost.com/" style="text-decoration:none;">
                        <img src="https://pantypost.com/logo.png" alt="PantyPost" width="200" style="display:block;margin:0 auto;border:0;">
                      </a>
                      <h1 style="color:#28a745;font-size:24px;font-weight:400;margin:20px 0 0 0;">Password Successfully Reset</h1>
                    </td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="background-color:#202124;padding:40px 30px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                        <tr>
                          <td align="center">
                            <div style="width:80px;height:80px;background-color:#28a745;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;">
                              <span style="color:white;font-size:40px;line-height:80px;display:block;text-align:center;">✓</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      
                      <h2 style="color:#e8eaed;font-size:20px;text-align:center;margin:0 0 20px 0;">Great news, ${username}! 🎉</h2>
                      
                      <p style="color:#9aa0a6;font-size:16px;line-height:1.6;text-align:center;margin:0 0 30px 0;">
                        Your PantyPost password has been successfully reset. You can now log in with your new password.
                      </p>
                      
                      <!-- Button -->
                      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
                        <tr>
                          <td align="center" style="padding:20px 0;">
                            <a href="${process.env.FRONTEND_URL}/login" 
                               style="background-color:#ff950e;color:#202124;text-decoration:none;padding:14px 35px;border-radius:25px;font-weight:bold;font-size:16px;display:inline-block;">
                              Log In Now →
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="color:#9aa0a6;font-size:16px;line-height:1.6;text-align:center;margin:30px 0 0 0;">
                        If you didn't make this change, please contact our support team immediately.
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#202124;padding:30px;text-align:center;border-top:1px solid #5f6368;">
                      <p style="color:#5f6368;font-size:12px;margin:0;">
                        © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
                        This is an automated message, please do not reply to this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
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