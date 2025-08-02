// pantypost-backend/test-email.js
// Simple test to check if nodemailer is working

console.log('Testing nodemailer setup...\n');

try {
  const nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
  console.log('Version:', require('nodemailer/package.json').version);
  
  // Try to create a transporter
  const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: 'pantypostpartners@gmail.com',
      pass: 'momj dckd zgyy ksya'
    }
  });
  
  console.log('✅ Transporter created successfully');
  
  // Try to send a test email
  console.log('\nAttempting to send test email...');
  
  transporter.sendMail({
    from: '"PantyPost Test" <pantypostpartners@gmail.com>',
    to: 'pantypostpartners@gmail.com', // sending to yourself for testing
    subject: 'Test Email from PantyPost Backend',
    text: 'If you receive this, email is working correctly!',
    html: '<h1>Test Email</h1><p>If you receive this, email is working correctly!</p>'
  }, (error, info) => {
    if (error) {
      console.error('❌ Error sending email:', error.message);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', info.messageId);
    }
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Make sure nodemailer is installed: npm install nodemailer');
}