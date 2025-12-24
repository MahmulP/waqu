# WhatsApp Multi-Session Manager

A Next.js application that enables managing multiple WhatsApp Web connections simultaneously with real-time QR code display and message sending capabilities.

## Features

- 🔄 **Multi-Session Support**: Connect up to 20 WhatsApp accounts simultaneously
- 📱 **Real-time QR Codes**: Display QR codes via Socket.IO for instant authentication
- 💬 **Message Sending**: Send messages through any connected session
- 🔌 **Socket.IO Integration**: Real-time updates for session status and events
- 💾 **Session Persistence**: Automatic session restoration on server restart
- 🎨 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 📊 **State Management**: TanStack Query for efficient data fetching and caching

## Tech Stack

- **Framework**: Next.js 16.1.1 with React 19
- **WhatsApp Integration**: whatsapp-web.js
- **Real-time Communication**: Socket.IO
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **State Management**: TanStack Query v5
- **Type Safety**: TypeScript 5
- **Testing**: Vitest + fast-check (property-based testing)

## Prerequisites

- Node.js 20+ or Bun
- Chrome/Chromium (for Puppeteer)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wa-web
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Configure environment variables in `.env.local`:
```env
NODE_ENV=development
PORT=3000
SESSION_STORAGE_PATH=./.wwebjs_auth
```

## Development

Start the development server:

```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:3000`

## Usage

### Creating a Session

1. Navigate to the dashboard
2. Click "New Session" button
3. Wait for the QR code to appear
4. Scan the QR code with WhatsApp on your phone
5. Once authenticated, the session will show as "connected"

### Sending Messages

1. Select a connected session from the dropdown
2. Enter the recipient phone number (format: `1234567890@c.us` or `+1234567890`)
3. Type your message
4. Click "Send Message"

### Managing Sessions

- **Disconnect**: Click the power icon to disconnect a session (keeps auth data)
- **Delete**: Click the trash icon to permanently remove a session

## Architecture

### Backend

- **Custom Next.js Server**: Custom HTTP server with Socket.IO integration
- **SessionManager**: Core service managing WhatsApp client lifecycle
- **API Routes**: REST endpoints for session and message management
- **Persistence Layer**: File-based storage for session metadata

### Frontend

- **Dashboard Page**: Main interface for managing sessions
- **React Components**: Modular UI components with shadcn/ui
- **TanStack Query**: Server state management with automatic refetching
- **Socket.IO Client**: Real-time event handling

## API Endpoints

### Sessions

- `GET /api/sessions` - Get all sessions
- `POST /api/sessions` - Create a new session
- `DELETE /api/sessions/[sessionId]` - Delete a session

### Messages

- `POST /api/messages` - Send a message
  ```json
  {
    "sessionId": "uuid",
    "recipient": "1234567890@c.us",
    "message": "Hello!"
  }
  ```

## Socket.IO Events

### Server → Client

- `session:qr` - QR code generated
- `session:ready` - Session authenticated
- `session:disconnected` - Session disconnected
- `session:error` - Error occurred
- `message:sent` - Message sent successfully
- `message:error` - Message send failed
- `message:received` - New message received

### Client → Server

- `session:create` - Create new session
- `session:delete` - Delete session
- `session:disconnect` - Disconnect session

## Testing

Run tests:

```bash
npm test
# or
bun test
```

Run property-based tests:

```bash
npm test -- --grep "Property"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `SESSION_STORAGE_PATH` | Path for session data | `./.wwebjs_auth` |
| `ALLOWED_ORIGINS` | CORS origins (production) | - |

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── sessions/
│   │   │   ├── route.ts
│   │   │   └── [sessionId]/route.ts
│   │   └── messages/
│   │       └── route.ts
│   ├── dashboard/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── session-list.tsx
│   ├── qr-display.tsx
│   ├── message-form.tsx
│   └── error-display.tsx
├── hooks/
│   ├── use-socket.ts
│   ├── use-sessions.ts
│   └── use-messages.ts
└── lib/
    ├── types.ts
    ├── validation.ts
    ├── persistence.ts
    └── session-manager.ts
server.ts
```

## Troubleshooting

### Puppeteer Issues

If you encounter Puppeteer errors, ensure Chrome/Chromium is installed:

**Ubuntu/Debian:**
```bash
sudo apt-get install -y chromium-browser
```

**macOS:**
```bash
brew install chromium
```

### Port Already in Use

Change the port in `.env.local`:
```env
PORT=3001
```

### Session Not Connecting

1. Check if Chrome/Chromium is installed
2. Verify firewall settings
3. Check console logs for errors
4. Try deleting `.wwebjs_auth` folder and recreating session

## Performance Considerations

- **Max Sessions**: Limited to 20 concurrent sessions (configurable)
- **Memory Usage**: Each WhatsApp client uses ~100-200MB RAM
- **Message Queue**: FIFO queue per session prevents rate limiting

## Security Notes

- Add authentication before deploying to production
- Configure CORS properly for production
- Use environment variables for sensitive data
- Implement rate limiting on API endpoints
- Validate all user inputs

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
