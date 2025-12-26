# Installation Guide

## Initial Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Start the server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:3030/install` and complete the installation wizard

4. After successful installation, you can:
   - Login with your admin credentials at `/login`
   - Register new users at `/register`

## Disabling Installation Page

After initial setup, you can disable the `/install` page to prevent unauthorized reinstallation:

1. Open `.env.local`
2. Change `DISABLE_INSTALL=false` to `DISABLE_INSTALL=true`
3. Restart the server

When disabled:
- The `/install` page will return a 403 error
- The install check API will always return "installed"
- Users will be redirected to login page instead

## Re-enabling Installation

If you need to reinstall or run the installation wizard again:

1. Open `.env.local`
2. Change `DISABLE_INSTALL=true` to `DISABLE_INSTALL=false`
3. Restart the server
4. Visit `/install`

## Security Recommendations

- **Always set `DISABLE_INSTALL=true` in production** after initial setup
- Keep your `ENCRYPTION_KEY` secure and never commit it to version control
- Use strong passwords for admin accounts
- Regularly backup your database

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 3306 |
| `DB_USER` | Database user | root |
| `DB_PASSWORD` | Database password | (empty) |
| `DB_NAME` | Database name | whatsapp_manager |
| `ENCRYPTION_KEY` | Encryption key for sensitive data | (required) |
| `DISABLE_INSTALL` | Disable installation page | false |
| `SESSION_STORAGE_PATH` | WhatsApp session storage | ./.wwebjs_auth |
