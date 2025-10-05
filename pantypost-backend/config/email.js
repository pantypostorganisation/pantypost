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
  // New branded template for verification code with logo
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PantyPost Password Reset</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #000000;">
        
        <!-- Wrapper Table -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Main Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(255, 149, 14, 0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #ff950e 0%, #ffb347 100%); padding: 40px 40px 30px 40px; text-align: center;">
                    <!-- Logo Image with Fallback -->
                    <div style="display: inline-block;">
                      <img src="${process.env.FRONTEND_URL}/logo.png" alt="PantyPost" width="180" height="60" style="display: block; max-width: 180px; height: auto; margin: 0 auto;" />
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${process.env.FRONTEND_URL}" style="height:40px;v-text-anchor:middle;width:180px;" arcsize="0%" strokecolor="#000000" fillcolor="#000000">
                        <w:anchorlock/>
                        <center style="color:#ff950e;font-family:sans-serif;font-size:24px;font-weight:bold;">PantyPost</center>
                      </v:roundrect>
                      <![endif]-->
                      <!-- Fallback text if image doesn't load -->
                      <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: rgba(0, 0, 0, 0.7); text-transform: uppercase; letter-spacing: 2px;">
                        Premium Marketplace
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Icon Section -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(255, 149, 14, 0.2) 0%, rgba(255, 149, 14, 0.05) 100%); border-radius: 50%; border: 2px solid rgba(255, 149, 14, 0.3); position: relative;">
                      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 36px; color: #ff950e;">🔐</span>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 30px 40px;">
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center;">
                      Password Reset Request
                    </h2>
                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #9ca3af; text-align: center;">
                      Hello <span style="color: #ff950e; font-weight: 600;">${username}</span>
                    </p>
                    
                    <p style="margin: 0 0 30px 0; font-size: 15px; color: #d1d5db; text-align: center; line-height: 1.6;">
                      We received a request to reset your password.<br>
                      Use the verification code below to continue:
                    </p>
                    
                    <!-- Code Display Box -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; background: linear-gradient(135deg, rgba(255, 149, 14, 0.15) 0%, rgba(255, 149, 14, 0.05) 100%); border: 2px solid #ff950e; border-radius: 12px; padding: 30px 40px;">
                            <div style="font-size: 48px; font-weight: 800; color: #ff950e; letter-spacing: 12px; font-family: 'Courier New', monospace; text-align: center;">
                              ${code}
                            </div>
                            <div style="margin-top: 12px; font-size: 13px; color: #9ca3af; text-align: center;">
                              Valid for 15 minutes
                            </div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Timer Warning -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                      <tr>
                        <td align="center">
                          <div style="display: inline-block; background: rgba(255, 149, 14, 0.1); border-left: 3px solid #ff950e; padding: 12px 20px; border-radius: 4px;">
                            <span style="font-size: 14px; color: #fbbf24;">⏱️</span>
                            <span style="font-size: 14px; color: #fbbf24; margin-left: 8px; font-weight: 600;">
                              This code expires in 15 minutes
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL}/verify-reset-code" style="display: inline-block; background: linear-gradient(135deg, #ff950e 0%, #ffb347 100%); color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 15px rgba(255, 149, 14, 0.3); transition: all 0.3s ease;">
                            Enter Reset Code
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <p style="margin: 0 0 30px 0; font-size: 13px; color: #6b7280; text-align: center;">
                      Or copy and paste this link:<br>
                      <a href="${process.env.FRONTEND_URL}/verify-reset-code" style="color: #ff950e; text-decoration: none; word-break: break-all;">
                        ${process.env.FRONTEND_URL}/verify-reset-code
                      </a>
                    </p>
                    
                    <!-- Security Notice -->
                    <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 20px; margin: 0 0 20px 0; border: 1px solid rgba(255, 255, 255, 0.1);">
                      <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                        <span style="color: #ff950e; font-weight: 600;">🛡️ Security Notice:</span><br>
                        If you didn't request this password reset, you can safely ignore this email. Your password won't be changed without entering this code.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer with Logo -->
                <tr>
                  <td style="background: #0a0a0a; padding: 30px 40px; border-top: 1px solid rgba(255, 149, 14, 0.2);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <!-- Small footer logo -->
                          <img src="${process.env.FRONTEND_URL}/logo.png" alt="PantyPost" width="100" height="33" style="display: block; max-width: 100px; height: auto; margin: 0 auto 12px auto; opacity: 0.8;" />
                          <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">
                            The premium marketplace for authentic items
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
                            This is an automated message, please do not reply to this email.<br>
                            © ${new Date().getFullYear()} PantyPost. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `,
    text: `
PantyPost Password Reset
========================

Hello ${username}!

We received a request to reset your PantyPost password.

Your verification code is:

${code}

This code will expire in 15 minutes.

Enter this code on the password reset page to continue:
${process.env.FRONTEND_URL}/verify-reset-code

Security Notice:
If you didn't request this password reset, you can safely ignore this email. Your password won't be changed without entering this code.

Best regards,
The PantyPost Team

This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} PantyPost. All rights reserved.
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
  
  // Password reset success email with logo
  passwordResetSuccess: (username) => ({
    subject: 'Your PantyPost Password Has Been Reset',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Successful</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #ffffff; background-color: #000000;">
        
        <!-- Wrapper Table -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000; min-height: 100vh;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              
              <!-- Main Container -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; width: 100%; background: linear-gradient(180deg, #0a0a0a 0%, #000000 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(34, 197, 94, 0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 40px 40px 30px 40px; text-align: center;">
                    <!-- Logo Image -->
                    <div style="display: inline-block;">
                      <img src="${process.env.FRONTEND_URL}/logo.png" alt="PantyPost" width="180" height="60" style="display: block; max-width: 180px; height: auto; margin: 0 auto; filter: brightness(0) invert(1);" />
                      <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; letter-spacing: 2px;">
                        Password Reset Successful
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Success Icon -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 50%; border: 2px solid rgba(34, 197, 94, 0.3);">
                      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 36px; color: #22c55e;">✅</span>
                      </div>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h2 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center;">
                      Password Successfully Reset
                    </h2>
                    <p style="margin: 0 0 30px 0; font-size: 16px; color: #9ca3af; text-align: center;">
                      Hello <span style="color: #ff950e; font-weight: 600;">${username}</span>
                    </p>
                    
                    <div style="background: rgba(34, 197, 94, 0.1); border-left: 3px solid #22c55e; padding: 20px; border-radius: 4px; margin: 0 0 30px 0;">
                      <p style="margin: 0; font-size: 15px; color: #d1d5db; line-height: 1.6;">
                        Your password has been successfully reset. You can now log in with your new password.
                      </p>
                    </div>
                    
                    <!-- CTA Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #ff950e 0%, #ffb347 100%); color: #000000; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; box-shadow: 0 4px 15px rgba(255, 149, 14, 0.3);">
                            Log In to PantyPost
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Security Warning -->
                    <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; margin: 0 0 20px 0;">
                      <p style="margin: 0; font-size: 14px; color: #f87171; line-height: 1.6;">
                        <span style="font-weight: 600;">⚠️ Important Security Notice:</span><br>
                        If you didn't make this change, please contact our support team immediately.
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer with Logo -->
                <tr>
                  <td style="background: #0a0a0a; padding: 30px 40px; border-top: 1px solid rgba(255, 149, 14, 0.2);">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center;">
                          <!-- Small footer logo -->
                          <img src="${process.env.FRONTEND_URL}/logo.png" alt="PantyPost" width="100" height="33" style="display: block; max-width: 100px; height: auto; margin: 0 auto 12px auto; opacity: 0.8;" />
                          <p style="margin: 0 0 12px 0; font-size: 12px; color: #6b7280;">
                            The premium marketplace for authentic items
                          </p>
                          <p style="margin: 0; font-size: 11px; color: #4b5563; line-height: 1.5;">
                            This is an automated message, please do not reply to this email.<br>
                            © ${new Date().getFullYear()} PantyPost. All rights reserved.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
              </table>
              
            </td>
          </tr>
        </table>
        
      </body>
      </html>
    `,
    text: `
PantyPost - Password Reset Successful
=====================================

Hello ${username}!

Your PantyPost password has been successfully reset.

You can now log in with your new password at:
${process.env.FRONTEND_URL}/login

Important Security Notice:
If you didn't make this change, please contact our support team immediately.

Best regards,
The PantyPost Team

This is an automated message, please do not reply to this email.
© ${new Date().getFullYear()} PantyPost. All rights reserved.
    `
  })
};

module.exports = {
  sendEmail,
  emailTemplates
};