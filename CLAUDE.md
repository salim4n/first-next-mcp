# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build the production application
- `pnpm lint` - Run ESLint
- `pnpm test` - Run tests with Vitest
- `pnpm start` - Start production server

This project uses `pnpm` as the package manager.

## Architecture Overview

This is a Next.js 15 application that provides an MCP (Model Context Protocol) usage dashboard with real-time analytics and chat interface.

### Core Components

**Frontend:**
- Next.js App Router with TypeScript
- Tailwind CSS for styling
- Chart.js for data visualization
- Usage dashboard at `/usage` with KPIs, charts, and data tables
- Real-time chat interface integrated into the dashboard

**Backend APIs:**
- `/api/usage` - Fetches usage data from Azure Table Storage
- `/api/chat` - Chat interface powered by AI SDK v5 with MCP tools
- `/api/[transport]` - MCP transport endpoint for data collection

**Data Layer:**
- Azure Table Storage for persistence (`lib/azure/table.ts`)
- Usage event types defined in `lib/usage/types.ts`
- Data partitioned by date (yyyymmdd format)

**AI Agent System:**
- MCP-powered data agent for analyzing usage patterns
- Tools for calculating nutrition and meal planning
- Prompts for course listings and daily meal generation

### Key Directories

- `app/` - Next.js App Router pages and API routes
- `lib/agent/` - AI agent configuration and chatbot logic  
- `lib/azure/` - Azure Table Storage integration
- `lib/usage/` - Usage tracking types and utilities
- `lib/tools/` - MCP calculation tools
- `lib/prompts/` - AI prompt templates
- `tests/` - Vitest test files

### Testing

Tests are located in the `tests/` directory and use Vitest. Run tests with `pnpm test`.

### Dependencies

Key production dependencies:
- `@ai-sdk/azure` - Azure OpenAI integration
- `@azure/data-tables` - Azure Table Storage client
- `@modelcontextprotocol/sdk` - MCP SDK for tools
- `mcp-handler` - MCP request handling
- `chart.js` - Data visualization
- `zod` - Schema validation

The application includes French UI text and focuses on MCP tool usage analytics with real-time data visualization.