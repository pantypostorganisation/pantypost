// src/lib/validateEnv.ts

type RequiredEnvVars = {
  production: string[];
  development: string[];
  all: string[];
};

const REQUIRED_ENV_VARS: RequiredEnvVars = {
  production: [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_BASE_URL',
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
  ],
  development: [],
  all: [
    'NEXT_PUBLIC_APP_NAME',
    'NEXT_PUBLIC_APP_VERSION'
  ]
};

export function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // Check required vars for all environments
  REQUIRED_ENV_VARS.all.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check environment-specific vars
  if (isProduction) {
    REQUIRED_ENV_VARS.production.forEach(varName => {
      if (!process.env[varName]) {
        errors.push(`Missing required production environment variable: ${varName}`);
      }
    });
  } else {
    REQUIRED_ENV_VARS.development.forEach(varName => {
      if (!process.env[varName]) {
        warnings.push(`Missing development environment variable: ${varName}`);
      }
    });
  }

  // Validate URLs
  if (process.env.NEXT_PUBLIC_APP_URL && !isValidUrl(process.env.NEXT_PUBLIC_APP_URL)) {
    errors.push(`Invalid URL for NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
  }

  if (process.env.NEXT_PUBLIC_API_BASE_URL && !isValidUrl(process.env.NEXT_PUBLIC_API_BASE_URL)) {
    errors.push(`Invalid URL for NEXT_PUBLIC_API_BASE_URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}`);
  }

  // Log results
  if (errors.length > 0) {
    console.error('❌ Environment validation failed:');
    errors.forEach(error => console.error(`  - ${error}`));
    if (isProduction) {
      throw new Error('Environment validation failed. Please check your configuration.');
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment validation warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment validation passed');
  }

  return { errors, warnings };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Run validation on app start if on server
if (typeof window === 'undefined') {
  validateEnvironment();
}