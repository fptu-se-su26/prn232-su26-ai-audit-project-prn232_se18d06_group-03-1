# MoveVN

Base project for an ASP.NET Core Web API built with Clean Architecture, ASP.NET Core Identity, JWT authentication, Entity Framework Core, SQL Server, AutoMapper, FluentValidation, and DotNetEnv.

## Solution structure

```text
MoveVN.sln
src/
  MoveVN.Api/
  MoveVN.Application/
  MoveVN.Domain/
  MoveVN.Infrastructure/
tests/
  MoveVN.Tests/
```

## Prerequisites

- .NET 8 SDK
- SQL Server
- EF Core CLI (`dotnet tool install --global dotnet-ef` if not installed)

## Environment setup

1. Copy `.env.example` to `.env`.
2. Update `DB_CONNECTION` in `.env` to match your SQL Server instance.
3. Update JWT settings in `.env` for your local environment.

Example `.env`:

```env
DB_CONNECTION=Server=.;Database=MoveVNDb;Trusted_Connection=True;TrustServerCertificate=True
JWT_KEY=SUPER_SECRET_KEY_FOR_MOVEVN_123456789
JWT_ISSUER=MoveVNAPI
JWT_AUDIENCE=MoveVNClient
JWT_EXPIRE_MINUTES=60
```

## Run the API

```bash
dotnet restore
dotnet build
dotnet run --project src/MoveVN.Api
```

## Entity Framework migrations

Create initial migration:

```bash
dotnet ef migrations add InitialCreate -p src/MoveVN.Infrastructure -s src/MoveVN.Api -o Persistence/Migrations
```

Apply migration:

```bash
dotnet ef database update -p src/MoveVN.Infrastructure -s src/MoveVN.Api
```

## Architecture rules

- `Domain` contains core entities and shared base classes.
- `Application` contains abstractions, common models, mappings, and validation setup.
- `Infrastructure` contains EF Core, Identity, repositories, unit of work, and JWT implementation.
- `Api` contains composition root, middleware, and HTTP layer only.

## Notes

- `.env` is ignored by git.
- `appsettings.json` only keeps placeholders.
- JWT includes `UserId`, `Email`, `Role`, and `Jti` claims.
- Soft delete is applied through `BaseEntity.IsDeleted` query filtering.
