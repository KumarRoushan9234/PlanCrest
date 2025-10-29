import { testEmailConfig } from './utils/mailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing Email Configuration\n');
console.log('================================\n');

// Show current configuration (masked)
console.log('Current Settings:');
console.log(`EMAIL_SERVICE: ${process.env.EMAIL_SERVICE || 'not set'}`);
console.log(`EMAIL_USER: ${process.env.EMAIL_USER || 'not set'}`);
console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'not set'}`);
console.log(`EMAIL_SENDER_NAME: ${process.env.EMAIL_SENDER_NAME || 'PlanCrest (default)'}`);
console.log('\n================================\n');

// Run test
const result = await testEmailConfig();

if (result.success) {
  console.log('\n✅ SUCCESS! Email is configured correctly!');
  console.log(`📧 Service: ${result.service}`);
  console.log(`📧 Email: ${result.email}`);
} else {
  console.log('\n❌ FAILED! Email configuration has errors.');
  console.log(`Error: ${result.error}`);
  console.log(`\n${result.details || ''}`);
  
  console.log('\n💡 Troubleshooting Steps:\n');
  console.log('1. Make sure EMAIL_USER and EMAIL_PASS are set in .env file');
  console.log('2. For Gmail, you MUST use an App Password, not your regular password');
  console.log('3. Enable 2-Step Verification on your Google Account first');
  console.log('4. Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('5. Remove spaces from the App Password when adding to .env');
  console.log('\nExample .env:');
  console.log('EMAIL_SERVICE=gmail');
  console.log('EMAIL_USER=your-email@gmail.com');
  console.log('EMAIL_PASS=abcdabcdabcdabcd  (no spaces!)');
}

process.exit(result.success ? 0 : 1);

