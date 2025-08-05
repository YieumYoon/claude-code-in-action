# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Setup project (install deps, generate Prisma client, run migrations)
npm run setup

# Development server with Turbopack
npm run dev

# Build for production  
npm run build

# Start production server
npm start

# Linting
npm run lint

# Run tests with Vitest
npm test

# Reset database (force migrate reset)
npm run db:reset
```

## Architecture Overview

This is a Next.js 15 application that generates React components using Claude AI with a virtual file system for live preview.

### Core System Architecture

**Virtual File System (`src/lib/file-system.ts`)**

- In-memory file system that doesn't write to disk
- Supports file/directory operations (create, read, update, delete, rename)
- Serializes to/from JSON for persistence
- Used for component generation and preview

**Context Providers (`src/lib/contexts/`)**

- `FileSystemProvider`: Manages virtual file system state and operations
- `ChatProvider`: Handles AI chat interactions using Vercel AI SDK
- Both use React context for state management across components

**AI Integration (`src/app/api/chat/route.ts`)**

- Uses Anthropic Claude via Vercel AI SDK
- Custom tools: `str_replace_editor` and `file_manager` for file manipulation
- Streams responses with tool calls to update virtual file system
- Saves project state to database for authenticated users

### Database Schema (Prisma + SQLite)

- `User`: Authentication with email/password (bcrypt)
- `Project`: Stores chat messages and file system state as JSON
- Generated client in `src/generated/prisma/`

### Key Component Structure

**Chat Interface (`src/components/chat/`)**

- `ChatInterface`: Main chat UI with message display
- `MessageInput`: Handles user input and chat submission
- `MarkdownRenderer`: Renders AI responses with syntax highlighting

**Code Editor (`src/components/editor/`)**

- `CodeEditor`: Monaco Editor integration for file editing
- `FileTree`: Virtual file system browser

**Preview System (`src/components/preview/`)**

- `PreviewFrame`: Renders generated React components in real-time
- Uses Babel standalone for JSX transformation

### Authentication

- JWT-based auth using `jose` library
- Session management in middleware and auth utilities
- Anonymous users can work without saving (tracked in localStorage)

### AI Tool System

The AI uses custom tools to manipulate the virtual file system:

- `str_replace_editor`: Create files, string replacement, line insertion
- `file_manager`: File/directory rename and delete operations
- Tool calls trigger updates to the React context and UI

### Testing

- Vitest for unit tests
- Testing Library for React component tests
- Tests located in `__tests__` directories alongside components
- Vitest config is in vitest.config.mts

## Best Practices

- Use comments sparingly. Only comment complex code.

### Database Reference

- The database schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database