#!/usr/bin/env node

// Environment Variables Checker for Render Deployment
// This script checks if all required environment variables are set

console.log('🔍 Checking environment variables...\n');

const required = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'NODE_ENV': process.env.NODE_ENV,
};

const optional = {
  'PORT': process.env.PORT,
  'SENDGRID_API_KEY': process.env.SENDGRID_API_KEY,
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
  'TWILIO_ACCOUNT_SID': process.env.TWILIO_ACCOUNT_SID,
  'JWT_SECRET': process.env.JWT_SECRET,
};

let hasErrors = false;

console.log('📋 Required Variables:');
Object.entries(required).forEach(([key, value]) => {
  if (!value) {
    console.log(`  ❌ ${key}: NOT SET (REQUIRED)`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const masked = value.length > 20 
      ? value.substring(0, 20) + '...[MASKED]'
      : '[SET]';
    console.log(`  ✅ ${key}: ${masked}`);
  }
});

console.log('\n📋 Optional Variables:');
Object.entries(optional).forEach(([key, value]) => {
  if (!value) {
    console.log(`  ⚪ ${key}: Not set (Optional)`);
  } else {
    const masked = value.length > 20 
      ? value.substring(0, 20) + '...[MASKED]'
      : '[SET]';
    console.log(`  ✅ ${key}: ${masked}`);
  }
});

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Missing required environment variables!');
  console.log('Please set them in Render Dashboard → Environment');
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set!');
  process.exit(0);
}
