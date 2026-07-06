#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read .env.production
const envFile = path.join(__dirname, '..', '.env.production');

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');

  // Parse and set environment variables
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      process.env[key] = value;
      console.log(`✓ Set ${key}`);
    }
  });
}

// Execute the actual build command
const { execSync } = require('child_process');
const buildCmd = 'prisma generate && next build';

console.log(`\nRunning: ${buildCmd}\n`);
execSync(buildCmd, { stdio: 'inherit' });
