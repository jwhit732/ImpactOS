/**
 * Gmail OAuth2 setup script
 * Run this once to get your refresh token
 */

import { google } from 'googleapis';
import * as readline from 'readline';
import * as fs from 'fs';
import * as path from 'path';
// import { fileURLToPath } from 'url';

// Unused: const __filename = fileURLToPath(import.meta.url);
// Unused: const __dirname = path.dirname(__filename);

// If you have credentials.json, this will use it
// Otherwise, you'll need to provide Client ID and Secret manually
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.modify'];

async function main() {
  console.log('='.repeat(60));
  console.log('Gmail OAuth2 Setup for Impact OS');
  console.log('='.repeat(60));
  console.log();

  let clientId: string;
  let clientSecret: string;
  let redirectUri = 'http://localhost:3000/oauth2callback';

  // Check if credentials.json exists
  if (fs.existsSync(CREDENTIALS_PATH)) {
    console.log('✓ Found credentials.json');
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
    const { client_id, client_secret, redirect_uris } = credentials.installed || credentials.web;
    clientId = client_id;
    clientSecret = client_secret;
    redirectUri = redirect_uris[0] || redirectUri;
  } else {
    console.log('✗ No credentials.json found');
    console.log();
    console.log('Please provide your OAuth credentials from Google Cloud Console:');
    console.log('https://console.cloud.google.com/apis/credentials');
    console.log();

    clientId = await ask('Enter Client ID: ');
    clientSecret = await ask('Enter Client Secret: ');
  }

  console.log();
  console.log('Setting up OAuth2 client...');

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // Generate auth URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log();
  console.log('='.repeat(60));
  console.log('STEP 1: Authorize this app');
  console.log('='.repeat(60));
  console.log();
  console.log('Open this URL in your browser:');
  console.log();
  console.log(authUrl);
  console.log();
  console.log('After authorization, you\'ll be redirected to a page that may');
  console.log('show an error. That\'s OK! Copy the ENTIRE URL from your browser.');
  console.log();

  const redirectedUrl = await ask('Paste the full redirect URL here: ');

  // Extract code from URL
  const url = new URL(redirectedUrl);
  const code = url.searchParams.get('code');

  if (!code) {
    console.error('❌ No authorization code found in URL');
    process.exit(1);
  }

  console.log();
  console.log('Exchanging authorization code for tokens...');

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.error('❌ No refresh token received');
      console.error('This usually means you need to revoke access and try again:');
      console.error('https://myaccount.google.com/permissions');
      process.exit(1);
    }

    console.log();
    console.log('✓ Success! Got refresh token');
    console.log();
    console.log('='.repeat(60));
    console.log('STEP 2: Add these to your .env file');
    console.log('='.repeat(60));
    console.log();
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REDIRECT_URI=${redirectUri}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log();

    // Offer to update .env automatically
    const updateEnv = await ask('Would you like me to update .env automatically? (y/n): ');

    if (updateEnv.toLowerCase() === 'y') {
      updateEnvFile({
        GMAIL_CLIENT_ID: clientId,
        GMAIL_CLIENT_SECRET: clientSecret,
        GMAIL_REDIRECT_URI: redirectUri,
        GMAIL_REFRESH_TOKEN: tokens.refresh_token!,
      });
      console.log();
      console.log('✓ .env file updated!');
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Setup complete! You can now run:');
    console.log('  npm run send-test');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error getting tokens:', error);
    process.exit(1);
  }
}

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function updateEnvFile(values: Record<string, string>) {
  const envPath = path.join(process.cwd(), '.env');
  let envContent = fs.readFileSync(envPath, 'utf-8');

  for (const [key, value] of Object.entries(values)) {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
}

main();
