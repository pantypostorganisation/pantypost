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
  // AGGRESSIVE DARK MODE - Multiple techniques combined
  passwordResetCode: (username, code) => ({
    subject: 'Your PantyPost Password Reset Code',
    html: `
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
        <!--[if !mso]><!-->
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <!--<![endif]-->
        <style type="text/css">
          @media (prefers-color-scheme: dark) {
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
          }
        </style>
        <!--[if mso]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
      </head>
      <body bgcolor="#202124" style="margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background-color:#202124;">
        <!--[if mso | IE]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#202124">
        <tr>
        <td>
        <![endif]-->
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;background-color:#202124;">
          <tbody>
            <tr>
              <td align="center" bgcolor="#202124" style="padding:0;background-color:#202124;">
                
                <!--[if mso | IE]>
                <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
                <v:fill type="tile" color="#202124"/>
                <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
                <![endif]-->
                
                <div style="max-width:600px;margin:0 auto;background-color:#202124;">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#202124;">
                    
                    <!-- HEADER -->
                    <tr>
                      <td align="center" bgcolor="#303134" style="padding:30px;background-color:#303134;border-bottom:3px solid #ff950e;">
                        <a href="https://pantypost.com/">
                          <img src="https://pantypost.com/logo.png" alt="PantyPost" width="180" border="0" style="display:block;">
                        </a>
                        <h1 style="color:#e8eaed;font-family:Arial,sans-serif;font-size:22px;font-weight:normal;margin:20px 0 0 0;mso-line-height-rule:exactly;line-height:28px;">
                          Password Reset Request
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- CONTENT -->
                    <tr>
                      <td align="left" bgcolor="#202124" style="padding:35px 30px;background-color:#202124;">
                        <h2 style="color:#e8eaed;font-family:Arial,sans-serif;font-size:18px;font-weight:bold;margin:0 0 15px 0;mso-line-height-rule:exactly;">
                          Hello ${username}! 👋
                        </h2>
                        
                        <p style="color:#9aa0a6;font-family:Arial,sans-serif;font-size:15px;line-height:22px;margin:0 0 25px 0;mso-line-height-rule:exactly;">
                          We received a request to reset your PantyPost account password. Use the verification code below:
                        </p>
                        
                        <!-- CODE BOX -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                          <tr>
                            <td align="center" style="padding:0;">
                              <table role="presentation" border="0" cellpadding="25" cellspacing="0" style="background-color:#303134;border:2px solid #ff950e;border-radius:8px;">
                                <tr>
                                  <td align="center" bgcolor="#303134" style="background-color:#303134;">
                                    <p style="color:#ff950e;font-family:Arial,sans-serif;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;margin:0 0 12px 0;mso-line-height-rule:exactly;">
                                      Your Verification Code
                                    </p>
                                    <p style="color:#ff950e;font-family:'Courier New',monospace;font-size:28px;font-weight:bold;letter-spacing:5px;margin:0;mso-line-height-rule:exactly;">
                                      ${code}
                                    </p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <!-- TIMER -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:20px 0;">
                          <tr>
                            <td bgcolor="#3c2a1a" style="background-color:#3c2a1a;border-left:3px solid #ff950e;padding:12px;">
                              <p style="color:#ffb347;font-family:Arial,sans-serif;font-size:13px;margin:0;mso-line-height-rule:exactly;">
                                ⏱ This code expires in 15 minutes
                              </p>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="color:#9aa0a6;font-family:Arial,sans-serif;font-size:15px;line-height:22px;margin:20px 0 25px 0;mso-line-height-rule:exactly;">
                          Enter this code on the password reset page.
                        </p>
                        
                        <!-- BUTTON -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                          <tr>
                            <td align="center" bgcolor="#ff950e" style="background-color:#ff950e;border-radius:25px;">
                              <a href="${process.env.FRONTEND_URL}/verify-reset-code" target="_blank" style="display:inline-block;padding:12px 30px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;color:#202124;mso-line-height-rule:exactly;">
                                Enter Reset Code →
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                      </td>
                    </tr>
                    
                    <!-- FOOTER -->
                    <tr>
                      <td align="center" bgcolor="#202124" style="padding:25px;background-color:#202124;border-top:1px solid #5f6368;">
                        <p style="color:#5f6368;font-family:Arial,sans-serif;font-size:10px;margin:0;mso-line-height-rule:exactly;">
                          © ${new Date().getFullYear()} PantyPost. All rights reserved.
                        </p>
                      </td>
                    </tr>
                    
                  </table>
                </div>
                
                <!--[if mso | IE]>
                </v:textbox>
                </v:rect>
                <![endif]-->
                
              </td>
            </tr>
          </tbody>
        </table>
        
        <!--[if mso | IE]>
        </td>
        </tr>
        </table>
        <![endif]-->
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
      <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
      <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="color-scheme" content="dark">
        <meta name="supported-color-schemes" content="dark">
      </head>
      <body bgcolor="#202124" style="margin:0;padding:0;background-color:#202124;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#202124">
          <tr>
            <td align="center" style="padding:0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#202124;">
                <!-- Header -->
                <tr>
                  <td align="center" bgcolor="#303134" style="padding:30px;background-color:#303134;border-bottom:3px solid #28a745;">
                    <a href="https://pantypost.com/">
                      <img src="https://pantypost.com/logo.png" alt="PantyPost" width="180" border="0" style="display:block;">
                    </a>
                    <h1 style="color:#28a745;font-family:Arial,sans-serif;font-size:22px;font-weight:normal;margin:20px 0 0 0;">
                      Password Successfully Reset
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td align="center" bgcolor="#202124" style="padding:35px 30px;background-color:#202124;">
                    <div style="width:70px;height:70px;background-color:#28a745;border-radius:50%;margin:0 auto 25px;line-height:70px;text-align:center;">
                      <span style="color:white;font-size:35px;">✓</span>
                    </div>
                    
                    <h2 style="color:#e8eaed;font-family:Arial,sans-serif;font-size:18px;margin:0 0 15px 0;">
                      Great news, ${username}! 🎉
                    </h2>
                    
                    <p style="color:#9aa0a6;font-family:Arial,sans-serif;font-size:15px;line-height:22px;margin:0 0 25px 0;">
                      Your password has been reset successfully.
                    </p>
                    
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                      <tr>
                        <td align="center" bgcolor="#ff950e" style="background-color:#ff950e;border-radius:25px;">
                          <a href="${process.env.FRONTEND_URL}/login" target="_blank" style="display:inline-block;padding:12px 30px;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;color:#202124;">
                            Log In Now →
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" bgcolor="#202124" style="padding:25px;background-color:#202124;border-top:1px solid #5f6368;">
                    <p style="color:#5f6368;font-family:Arial,sans-serif;font-size:10px;margin:0;">
                      © ${new Date().getFullYear()} PantyPost. All rights reserved.
                    </p>
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