# Character Select API

A C# .NET 8 Web API backend for the Character Select application.

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

## Getting Started

### Running the API

From the `backend` directory:

```bash
dotnet restore
dotnet run
```

The API will start on `http://localhost:3001`

### Development Mode with Hot Reload

```bash
dotnet watch run
```

## API Endpoints

### Duos

- **GET** `/api/duos` - Get all duos
- **POST** `/api/duos` - Add a new duo
  - Body: `{ "id1": number, "id2": number, "name": string, "altName": string?, "date": string? }`

## Swagger Documentation

When running in development mode, Swagger UI is available at:
`http://localhost:3001/swagger`

## Future Endpoints

This backend is set up as a foundation for future features including:

- Character management (CRUD operations)
- Image upload/management
- Trios management
- Moods management
- And more...

## Project Structure

```
backend/
├── Controllers/        # API Controllers
│   └── DuosController.cs
├── Properties/         # Launch settings
├── Program.cs         # Application entry point
├── appsettings.json   # Configuration
└── CharacterSelectAPI.csproj
```
