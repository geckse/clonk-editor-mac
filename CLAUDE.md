# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a desktop Clonk game editor built with Angular 16 and Electron 25. The application allows users to browse, edit, and manage Clonk game files (.c4d, .c4f, .c4s, .c4g, etc.) with an integrated file browser and text editor.

## Development Commands

### Core Development
- `npm start` - Start development environment (Angular dev server + Electron)
- `npm run ng:serve` - Start Angular dev server only (web mode)
- `npm run electron:local` - Build and run Electron app locally

### Building
- `npm run build` - Build for Electron (development)
- `npm run build:dev` - Build for development
- `npm run build:prod` - Build for production
- `npm run web:build` - Build for web deployment
- `npm run electron:build` - Build distributable Electron app

### Testing & Quality
- `npm test` - Run unit tests (single run)
- `npm run test:watch` - Run unit tests in watch mode
- `npm run e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint checks

### Utilities
- `npm run electron:serve-tsc` - Compile TypeScript for Electron main process
- `npm run e2e:show-trace` - View Playwright test traces

## Architecture

### Project Structure
- `app/` - Electron main process (NodeJS environment)
- `src/` - Angular renderer process (web environment)
- `clonkFolder/` - Contains Clonk game files and engine
- `e2e/` - End-to-end tests using Playwright
- `src/models`– Folder for Models

### Key Services

#### ElectronService (`src/app/core/services/electron/electron.service.ts`)
Handles interaction between Angular and Electron APIs, including:
- File system operations for Clonk files
- File icon retrieval via IPC
- Command execution for Clonk engine and c4group tool
- File content reading (text and binary)

#### ClonkService (`src/app/core/services/clonk/clonk.service.ts`)
Manages Clonk-specific operations:
- Starting scenarios via Clonk.app
- Packing/unpacking C4Group files
- Engine command formatting and parsing
- File type validation for Clonk extensions

### File Management
The app works with Clonk file types:
- `.c4s` - Scenarios (playable levels)
- `.c4d` - Clonk definition files
- `.c4f` - Clonk folders/packs
- `.c4g` - Clonk group files
- `.c4p` - Player files

### Development Notes

#### Electron Integration
- Uses two-package structure (root package.json + app/package.json)
- Node integration enabled for accessing file system
- IPC communication for file icons via `app.getFileIcon()`

#### Angular Configuration
- Uses custom webpack configuration (`angular.webpack.js`)
- SCSS for styling
- Multiple build configurations (dev, prod, web, web-production)
- ESLint for code quality

#### File Handling
- Hardcoded paths: `./clonkFolder/` for Clonk files
- Engine path: `clonkFolder/Clonk.app/Contents/MacOS/clonk`
- C4Group tool: `clonkFolder/c4group`

#### Components
- `FileListComponent` - Displays file browser with drag-and-drop
- `TextEditorComponent` - Basic text editing for .txt and .c files
- `KeyValueEditorComponent` - Specialized editor for key=value files
- `LoadingSpinnerComponent` - Loading states

### External Dependencies
- `ng2-dragula` - Drag and drop functionality
- `@ngx-translate` - Internationalization
- Electron Builder for packaging
- Playwright for E2E testing

## Testing
- Unit tests use Karma + Jasmine
- E2E tests use Playwright
- Test files follow `.spec.ts` convention