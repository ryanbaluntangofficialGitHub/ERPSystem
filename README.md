# ERPSystem

Enterprise Resource Planning (ERP) sample application (backend .NET 8 + React frontend).


## CI

The repository includes a GitHub Actions workflow that runs on push and pull requests against the `master` branch: `.github/workflows/ci.yml`.

- The workflow builds the .NET solution, runs .NET tests, installs Node, runs frontend tests, builds the React app, and uploads the built client as an artifact.

Status badge (will show status once workflow runs):

[![CI](https://github.com/ryanbaluntangofficialGitHub/ERPSystem/actions/workflows/ci.yml/badge.svg)](https://github.com/ryanbaluntangofficialGitHub/ERPSystem/actions/workflows/ci.yml)


## Local development

Prerequisites:
- .NET 8 SDK
- Node.js 18+
- npm

Backend

1. Restore & build

   dotnet restore
   dotnet build

2. Run tests

   dotnet test

3. Run the application

   dotnet run --project ERPSystem

Frontend (ClientApp)

1. Install frontend dependencies

   cd ClientApp
   npm ci

2. Run frontend tests

   npm test

3. Start the dev server

   npm start

4. Build production bundle

   npm run build


## Notes

- The frontend uses a lightweight `fetch`-based `ClientApp/src/api.js` client for compatibility with Jest during tests. You can replace it with `axios` if you add ESM transformation in Jest or configure Babel.
- The backend seeds sample data on startup via `DbInitializer.Initialize`.

If you want, I can:
- Add a test-coverage job and upload coverage reports to CI.
- Add status badges for .NET tests and frontend test coverage.
- Configure deployment (Azure App Service / Static Web Apps) in the workflow.

Which of the above should I do next?"