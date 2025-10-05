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
  // Responsive light/dark mode template with email logo
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>Password Reset - PantyPost</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          
          /* Reset styles */
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
          
          /* Light mode (default) */
          body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f4f4f4 !important;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          
          .email-container {
            max-width: 600px;
            margin: auto;
          }
          
          .email-header {
            background-color: #ffffff;
            border-bottom: 3px solid #ff950e;
          }
          
          .email-body {
            background-color: #ffffff;
          }
          
          .code-box {
            background-color: #fff5e6;
            border: 2px solid #ff950e;
          }
          
          .timer-box {
            background-color: #fff9f0;
            border-left: 3px solid #ff950e;
          }
          
          .alt-link-box {
            background-color: #f8f8f8;
            border: 1px solid #e0e0e0;
          }
          
          .security-box {
            background-color: #f8f8f8;
            border: 1px solid #e0e0e0;
          }
          
          .text-primary { color: #333333 !important; }
          .text-secondary { color: #666666 !important; }
          .text-muted { color: #999999 !important; }
          .text-orange { color: #ff950e !important; }
          
          /* Desktop logo - visible by default */
          .desktop-logo {
            display: block !important;
          }
          
          /* Mobile logo - hidden by default */
          .mobile-logo {
            display: none !important;
          }
          
          /* Dark mode overrides */
          @media (prefers-color-scheme: dark) {
            body {
              background-color: #202124 !important;
            }
            
            .email-header {
              background-color: #303134 !important;
            }
            
            .email-body {
              background-color: #202124 !important;
            }
            
            .code-box {
              background-color: #303134 !important;
            }
            
            .timer-box {
              background-color: #3c2a1a !important;
            }
            
            .alt-link-box {
              background-color: #303134 !important;
              border-color: #5f6368 !important;
            }
            
            .security-box {
              background-color: #303134 !important;
              border-color: #5f6368 !important;
            }
            
            .text-primary { color: #e8eaed !important; }
            .text-secondary { color: #9aa0a6 !important; }
            .text-muted { color: #5f6368 !important; }
            .text-orange { color: #ff950e !important; }
          }
          
          /* Outlook Dark Mode */
          [data-ogsc] body { background-color: #202124 !important; }
          [data-ogsc] .email-header { background-color: #303134 !important; }
          [data-ogsc] .email-body { background-color: #202124 !important; }
          [data-ogsc] .text-primary { color: #e8eaed !important; }
          [data-ogsc] .text-secondary { color: #9aa0a6 !important; }
          
          /* Mobile styles */
          @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .email-padding { padding: 25px 20px !important; }
            .code-text { font-size: 24px !important; letter-spacing: 4px !important; }
            
            /* Logo swap for mobile */
            .desktop-logo {
              display: none !important;
            }
            .mobile-logo {
              display: block !important;
            }
          }
        </style>
      </head>
      <body>
        <div role="article" aria-roledescription="email" aria-label="Password Reset" lang="en" style="width: 100%;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <div class="email-container">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    
                    <!-- Header with email logo -->
                    <tr>
                      <td class="email-header" style="padding: 30px; text-align: center;">
                        <a href="https://pantypost.com/" style="text-decoration: none;">
                          <!-- Desktop logo with dark background embedded -->
                          <img src="https://pantypost.com/emaillogo.png" 
                               alt="PantyPost" 
                               width="240" 
                               class="desktop-logo"
                               style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
                          <!-- Mobile logo (same image, different size) -->
                          <img src="https://pantypost.com/emaillogo.png" 
                               alt="PantyPost" 
                               width="200" 
                               class="mobile-logo"
                               style="display: none; margin: 0 auto; max-width: 90%; height: auto;">
                        </a>
                        <h1 class="text-primary" style="font-size: 22px; font-weight: normal; margin: 20px 0 0 0;">
                          Password Reset Request
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td class="email-body email-padding" style="padding: 35px 30px;">
                        <h2 class="text-primary" style="font-size: 18px; margin: 0 0 15px 0;">
                          Hello ${username}! 👋
                        </h2>
                        
                        <p class="text-secondary" style="font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                          We received a request to reset your PantyPost account password. Use the verification code below to proceed with resetting your password.
                        </p>
                        
                        <!-- Code Box -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <div class="code-box" style="padding: 25px; text-align: center; border-radius: 8px;">
                                <div class="text-orange" style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                                  Your Verification Code
                                </div>
                                <div class="text-orange code-text" style="font-size: 28px; font-weight: bold; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                                  ${code}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Timer -->
                        <div class="timer-box" style="padding: 12px; margin: 25px 0; border-radius: 4px;">
                          <p style="color: #ffb347; font-size: 13px; margin: 0;">
                            ⏱ This code expires in 15 minutes
                          </p>
                        </div>
                        
                        <p class="text-secondary" style="font-size: 15px; line-height: 1.6; margin: 20px 0 25px 0;">
                          Enter this code on the password reset page to create your new password.
                        </p>
                        
                        <!-- CTA Button -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 30px auto;">
                          <tr>
                            <td style="background-color: #ff950e; border-radius: 25px;">
                              <a href="${process.env.FRONTEND_URL}/verify-reset-code" style="display: inline-block; padding: 12px 30px; color: #000000; font-size: 15px; font-weight: bold; text-decoration: none;">
                                Enter Reset Code →
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- Alternative Link -->
                        <div class="alt-link-box" style="padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
                          <p class="text-secondary" style="font-size: 13px; margin: 0 0 6px 0;">
                            Or copy and paste this link into your browser:
                          </p>
                          <a href="${process.env.FRONTEND_URL}/verify-reset-code" class="text-orange" style="font-size: 13px; text-decoration: underline;">
                            ${process.env.FRONTEND_URL}/verify-reset-code
                          </a>
                        </div>
                        
                        <!-- Security Notice -->
                        <div class="security-box" style="padding: 18px; border-radius: 8px; margin-top: 25px;">
                          <p class="text-secondary" style="font-size: 13px; line-height: 1.6; margin: 0;">
                            <strong class="text-primary">🔒 Didn't request this?</strong><br>
                            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                          </p>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td class="email-body" style="padding: 25px; text-align: center; border-top: 1px solid #333333;">
                        <p class="text-orange" style="font-weight: bold; font-size: 16px; margin: 0;">PantyPost</p>
                        <p class="text-secondary" style="font-size: 11px; margin: 5px 0 15px 0;">The premium marketplace for authentic items</p>
                        
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td style="padding: 0 10px;">
                              <a href="${process.env.FRONTEND_URL}/terms" class="text-orange" style="font-size: 12px; text-decoration: none;">Terms</a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="${process.env.FRONTEND_URL}/help" class="text-orange" style="font-size: 12px; text-decoration: none;">Support</a>
                            </td>
                            <td style="padding: 0 10px;">
                              <a href="${process.env.FRONTEND_URL}/browse" class="text-orange" style="font-size: 12px; text-decoration: none;">Browse</a>
                            </td>
                          </tr>
                        </table>
                        
                        <p class="text-muted" style="font-size: 10px; margin: 15px 0 0 0;">
                          © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
                          This is an automated message, please do not reply to this email.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </div>
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
  
  // Password reset success email - responsive light/dark with email logo
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="light dark">
        <meta name="supported-color-schemes" content="light dark">
        <title>Password Reset Success - PantyPost</title>
        <style>
          :root {
            color-scheme: light dark;
            supported-color-schemes: light dark;
          }
          
          body {
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          }
          
          .email-container {
            max-width: 600px;
            margin: auto;
          }
          
          .email-header {
            background-color: #ffffff;
            border-bottom: 3px solid #28a745;
          }
          
          .email-body {
            background-color: #ffffff;
          }
          
          .success-icon {
            width: 70px;
            height: 70px;
            background-color: #28a745;
            border-radius: 50%;
            margin: 0 auto 25px;
            line-height: 70px;
            text-align: center;
          }
          
          .text-primary { color: #333333; }
          .text-secondary { color: #666666; }
          .text-success { color: #28a745; }
          
          .desktop-logo {
            display: block !important;
          }
          
          .mobile-logo {
            display: none !important;
          }
          
          @media (prefers-color-scheme: dark) {
            body { background-color: #202124; }
            .email-header { background-color: #303134; }
            .email-body { background-color: #202124; }
            .text-primary { color: #e8eaed; }
            .text-secondary { color: #9aa0a6; }
          }
          
          @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; }
            .desktop-logo { display: none !important; }
            .mobile-logo { display: block !important; }
          }
        </style>
      </head>
      <body>
        <div role="article" aria-roledescription="email" lang="en" style="width: 100%;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center">
                <div class="email-container">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    
                    <!-- Header with email logo -->
                    <tr>
                      <td class="email-header" style="padding: 30px; text-align: center;">
                        <a href="https://pantypost.com/">
                          <!-- Desktop logo -->
                          <img src="https://pantypost.com/emaillogo.png" 
                               alt="PantyPost" 
                               width="240" 
                               class="desktop-logo"
                               style="display: block; margin: 0 auto; max-width: 100%; height: auto;">
                          <!-- Mobile logo -->
                          <img src="https://pantypost.com/emaillogo.png" 
                               alt="PantyPost" 
                               width="200" 
                               class="mobile-logo"
                               style="display: none; margin: 0 auto; max-width: 90%; height: auto;">
                        </a>
                        <h1 class="text-success" style="font-size: 22px; font-weight: normal; margin: 20px 0 0 0;">
                          Password Successfully Reset
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                      <td class="email-body" style="padding: 35px 30px; text-align: center;">
                        <div class="success-icon">
                          <span style="color: white; font-size: 35px;">✓</span>
                        </div>
                        
                        <h2 class="text-primary" style="font-size: 18px; margin: 0 0 15px 0;">
                          Great news, ${username}! 🎉
                        </h2>
                        
                        <p class="text-secondary" style="font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                          Your PantyPost password has been successfully reset.<br>
                          You can now log in with your new password.
                        </p>
                        
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td style="background-color: #ff950e; border-radius: 25px;">
                              <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 12px 30px; color: #000000; font-size: 15px; font-weight: bold; text-decoration: none;">
                                Log In Now →
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p class="text-secondary" style="font-size: 13px; margin: 25px 0 0 0;">
                          If you didn't make this change, please contact our support team immediately.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td class="email-body" style="padding: 25px; text-align: center; border-top: 1px solid #333333;">
                        <p style="color: #999999; font-size: 10px; margin: 0;">
                          © ${new Date().getFullYear()} PantyPost. All rights reserved.<br>
                          This is an automated message, please do not reply to this email.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </div>
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