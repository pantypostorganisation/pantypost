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

// Values that indicate the variable needs to be configured
const placeholderValues = [
  'your_cloud_name',
  'your_upload_preset',
  'your_api_key',
  'your_analytics_id',
  'your_production_sentry_dsn',
  'your_staging_sentry_dsn',
  '',
  undefined,
  null
];

function validateEnvFile(envFile, environment) {
  console.log(`\n🔍 Validating ${envFile} for ${environment} environment...`);
  
  if (!fs.existsSync(envFile)) {
    if (environment === 'development') {
      console.error(`❌ ${envFile} not found! This is required for development.`);
      return false;
    } else {
      console.warn(`⚠️  ${envFile} not found - will use defaults for ${environment}`);
      return true; // Production/staging files are optional in CI
    }
  }

  const envContent = fs.readFileSync(envFile, 'utf8');
  const envVars = {};
  
  // Parse env file
  envContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        const value = valueParts.join('=')?.trim();
        envVars[key.trim()] = value;
      }
    }
  });

  // Check required variables
  const required = [...requiredVars.common, ...(requiredVars[environment] || [])];
  const missing = [];
  const needsConfiguration = [];

  required.forEach(varName => {
    const value = envVars[varName];
    
    if (!value) {
      missing.push(varName);
    } else if (placeholderValues.includes(value)) {
      needsConfiguration.push(varName);
    }
  });

  let hasErrors = false;

  if (missing.length > 0) {
    console.error(`❌ Missing required variables: ${missing.join(', ')}`);
    hasErrors = true;
  }

  if (needsConfiguration.length > 0) {
    if (environment === 'production') {
      console.error(`❌ Production variables need configuration: ${needsConfiguration.join(', ')}`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  Variables need configuration for ${environment}: ${needsConfiguration.join(', ')}`);
    }
  }

  if (!hasErrors) {
    console.log(`✅ ${envFile} is valid for ${environment}!`);
  }

  return !hasErrors;
}

// Check if we're running in CI environment
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

console.log('🚀 Starting environment validation...');
if (isCI) {
  console.log('🔧 Running in CI environment - using flexible validation');
}

// Validate all environment files
const environments = ['development', 'staging', 'production'];
let allValid = true;
let warnings = [];

environments.forEach(env => {
  const envFile = path.join(__dirname, '..', `.env.${env}`);
  try {
    const isValid = validateEnvFile(envFile, env);
    if (!isValid) {
      if (env === 'development' || !isCI) {
        allValid = false;
      } else {
        warnings.push(`${env} environment needs configuration`);
      }
    }
  } catch (error) {
    console.error(`❌ Error validating ${envFile}:`, error.message);
    if (env === 'development' || !isCI) {
      allValid = false;
    }
  }
});

// Check for .env.example
const exampleFile = path.join(__dirname, '..', '.env.example');
if (!fs.existsSync(exampleFile)) {
  console.warn('\n⚠️  .env.example not found! This file is important for documentation.');
  warnings.push('.env.example missing');
} else {
  console.log('\n✅ .env.example found');
}

// Final results
if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach(warning => console.log(`   - ${warning}`));
}

if (allValid) {
  console.log('\n✅ Environment validation passed!');
  if (isCI) {
    console.log('   CI environment - placeholder values are acceptable');
  }
  console.log('   Your project is ready for development and deployment');
  process.exit(0);
} else {
  console.error('\n❌ Environment validation failed!');
  console.log('   Please check your environment files and try again');
  process.exit(1);
}