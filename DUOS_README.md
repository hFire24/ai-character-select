# Duo Management System

The duo names feature has been updated to use a dynamic system with a local development server!

## How It Works

1. **Initial Data**: All existing duo names are stored in `src/assets/data/duos.json`
2. **Smart Form Display**: The "Add Custom Duo Name" form only appears when you select two characters that don't have a custom duo name yet
3. **Local Server**: In development, a C# .NET backend updates the JSON file directly (localhost only)
4. **Auto-Sorting**: New duos are automatically sorted by character IDs
5. **Auto-Complete**: Character selection has auto-complete with character images

## Development Setup

### Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- Node.js and npm

### Install Dependencies
```bash
npm install
```

### Running the Application

**Option 1: Run both servers together (recommended)**
```bash
npm run dev
```
This starts both the Angular dev server (port 4200) and the .NET backend API (port 3001).

**Option 2: Run servers separately**
```bash
# Terminal 1 - .NET backend API
npm run start:backend

# Terminal 2 - Angular dev server with proxy
npm start
```

## Adding a New Duo (Development Only)

1. Make sure you're running on `localhost` (the feature only works in development)
2. Navigate to the Duos page
3. Select Character 1 using the auto-complete at the top
4. Select Character 2 using the auto-complete
5. If these characters don't have a custom duo name, a form will appear
6. Enter the duo name in the form
7. (Optional) Enter an alternative name for reversed character order
8. Click "Add Duo Name"
9. **The `duos.json` file is automatically updated!**

## Technical Details

### Architecture
- **Frontend**: Angular application (port 4200)
- **Backend**: Express server (port 3001)
- **Proxy**: Angular proxy redirects `/api/*` requests to port 3001
- **Storage**: Direct file system writes to `src/assets/duos.json`

### Files
- `duo-server.js` - Express server that handles duo management
- `proxy.conf.json` - Angular proxy configuration
- `src/assets/duos.json` - Duo data storage

### API Endpoints
- `GET /api/duos` - Retrieve all duos
- `POST /api/duos` - Add a new duo (development only)

### Security
- The add duo feature is **localhost-only**
- In production builds, the form won't appear
- The service checks `window.location.hostname` to ensure it's localhost

## Production Deployment

For production:
- The app reads from the static `duos.json` file
- No duo management server is needed
- Users cannot add new duos (read-only mode)
- Just build and deploy normally: `npm run deploy`
