// scripts/validate-env.js

const fs = require('fs');
const path = require('path');

// List of required environment variables for each environment
const requiredVars = {
  common: [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_VERSION',
    'NEXT_PUBLIC_APP_URL',
  ],
  development: [
    'NEXT_PUBLIC_USE_MOCK_API',
  ],
  staging: [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
  ],
  production: [
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
    'NEXT_PUBLIC_SENTRY_DSN',
  ],
};

function validateEnvFile(envFile, environment) {
  console.log(`\nValidating ${envFile} for ${environment} environment...`);
  
  if (!fs.existsSync(envFile)) {
    console.error(`❌ ${envFile} not found!`);
    return false;
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  
  // Parse env file
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, value] = line.split('=');
      if (key) envVars[key.trim()] = value?.trim();
    }
  });

  // Check required variables
  const required = [...requiredVars.common, ...(requiredVars[environment] || [])];
  const missing = required.filter(varName => !envVars[varName]);

  if (missing.length > 0) {
    console.error(`❌ Missing required variables: ${missing.join(', ')}`);
    return false;
  }

  console.log(`✅ ${envFile} is valid!`);
  return true;
}

// Validate all environment files
const environments = ['development', 'staging', 'production'];
let allValid = true;

environments.forEach(env => {
  const envFile = path.join(__dirname, '..', `.env.${env}`);
  if (!validateEnvFile(envFile, env)) {
    allValid = false;
  }
});

// Check for .env.example
const exampleFile = path.join(__dirname, '..', '.env.example');
if (!fs.existsSync(exampleFile)) {
  console.error('\n❌ .env.example not found! This file is important for documentation.');
  allValid = false;
}

if (allValid) {
  console.log('\n✅ All environment files are valid!');
  process.exit(0);
} else {
  console.error('\n❌ Environment validation failed!');
  process.exit(1);
}