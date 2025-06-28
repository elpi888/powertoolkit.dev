# [Toolkit.dev](https://toolkit.dev)

![Banner Image](/banner.png)

An extensible AI chat application with Generative UI built for the **T3 Cloneathon** using the [T3 Stack](https://create.t3.gg/). Toolkit.dev features a powerful toolkit system that allow users to toggle sets of AI tools to interact with external services, search the web, manage files, and much more.

Every Toolkit includes customizable UI components, enabling rich, interactive, and visually engaging displays for all tool outputs and interactions.

## Table of Contents

- [Features](#features)
  - [Extensible Toolkit System](#extensible-toolkit-system)
    - [Web Search & Research](#web-search--research)
    - [Development & Code](#development--code)
    - [Productivity & Knowledge](#productivity--knowledge)
    - [Media & Content](#media--content)
  - [Multiple LLM Providers](#multiple-llm-providers)
  - [Flexible Authentication](#flexible-authentication)
  - [Modern UI/UX](#modern-uiux)
  - [Security & Type Safety](#security--type-safety)
- [Built With the T3 Stack](#built-with-the-t3-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Environment Configuration](#3-environment-configuration)
    - [Required Configuration](#required-configuration)
    - [Choose at least one Authentication Provider](#choose-at-least-one-authentication-provider)
    - [Choose at least one LLM Provider](#choose-at-least-one-llm-provider)
    - [Optional Toolkit API Keys](#optional-toolkit-api-keys)
  - [4. Database Setup](#4-database-setup)
  - [5. Start Development Server](#5-start-development-server)
- [Development](#development)
  - [Adding New Toolkits](#adding-new-toolkits)
  - [Project Structure](#project-structure)
  - [Database Commands](#database-commands)
- [T3 Cloneathon](#t3-cloneathon)
- [Contributing](#contributing)
- [License](#license)

## Features

### **Extensible Toolkit System**

Toolkit.dev's toolkit architecture allows AI assistants to use powerful tools:

#### **Web Search & Research**

- **Exa Search** - Neural web search

#### **Development & Code**

- **GitHub API** - Repository management, issue tracking, code search
- **E2B** - Code execution in secure sandboxes

#### **Productivity & Knowledge**

- **Google Calendar** - Event management and scheduling
- **Google Drive** - File management and document access
- **Notion** - Database queries and page management
- **Memory (Mem0)** - Persistent memory for conversations

### **Multiple LLM Providers**

- **OpenAI**
- **Anthropic**
- **XAI**
- **Google**
- **Perplexity**

Choose any LLM provider - the app automatically adapts to your configuration!

### **Flexible Authentication with Clerk**

- Simplified authentication flows managed by Clerk.
- Supports various OAuth providers (Google, GitHub, LinkedIn, etc.), magic links, and password-based accounts, configurable via the Clerk dashboard.
- Secure user session management and profile handling.

#### **Media & Content**

- **Image Processing** - Advanced image analysis and manipulation

### **Modern UI/UX**

- Responsive design with Tailwind CSS
- Real-time chat interface
- Interactive tool result displays
- Loading states and progress indicators
- Dark/light mode support

### **Security & Type Safety**

- Server-side API key management
- Type-safe API calls with tRPC
- Zod schema validation
- Secure authentication flow

## Built With the T3 Stack

Toolkit.dev leverages the full power of the T3 Stack:

- **[Next.js](https://nextjs.org)** - React framework with App Router
- **[Clerk](https://clerk.com)** - Authentication and User Management
- **[Prisma](https://prisma.io)** - Database ORM and migrations
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first CSS framework
- **[tRPC](https://trpc.io)** - End-to-end type-safe APIs

Plus additional tools:

- **[Zod](https://zod.dev)** - Schema validation
- **[Lucide React](https://lucide.dev)** - Icon library
- **[AI SDK](https://sdk.vercel.ai)** - AI model integration

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- **Database** (PostgreSQL recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/jasonhedman/toolkit.dev.git
cd open-chat
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Open the `.env` file and fill in the required values. See `.env.example` for the full list and detailed comments.

**Key Environment Variables:**

*   **Clerk Authentication:**
    *   `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk Publishable Key.
    *   `CLERK_SECRET_KEY`: Your Clerk Secret Key.
    *   `CLERK_WEBHOOK_SECRET`: Your Clerk Webhook Signing Secret (for user data sync).
*   **Database:**
    *   `DATABASE_URL`: Your PostgreSQL connection string.
        *   For local development: e.g., `postgresql://postgres:password@localhost:5432/open-chat`
        *   For Vercel deployment with Supabase: Use the **Session Pooler** string, e.g., `postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-YOUR_REGION.pooler.supabase.com:5432/postgres` (See Supabase docs and `.env.example` for details on why Session Pooler is used for Vercel).
*   **Application:**
    *   `APP_URL`: The public URL of your application (e.g., `http://localhost:3000` for local, your Vercel URL for production).
    *   `NODE_ENV`: Typically `development` or `production`.
*   **AI Model Providers:**
    *   `OPENROUTER_API_KEY`: Required if using OpenRouter.
*   **Optional Toolkit API Keys & Services:**

Enable specific toolkits by adding their API keys:

```env
# Web Search
EXA_API_KEY="your-exa-key"

# Memory
MEM0_API_KEY="your-mem0-key"

# Code Execution
E2B_API_KEY="your-e2b-key"

# Image Generation
OPENAI_API_KEY=""
XAI_API_KEY=""
```

> **Note:** The app automatically detects which providers and toolkits are configured and adapts the interface accordingly!

### 4. Database Setup

Ensure your PostgreSQL database server is running and accessible via the `DATABASE_URL` you configured. Then, apply database migrations:

```bash
pnpm prisma migrate deploy
```

Optionally, if seed data is defined in `prisma/seed.ts`:
```bash
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your Toolkit.dev instance!

## Development

### Adding New Toolkits

Toolkit.dev's modular architecture makes it easy to add new toolkits. Check out the [Toolkit Development Guide](./src/toolkits/README.md) for detailed instructions.

### Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components
├── lib/                 # Utility functions
├── server/             # tRPC server and database
├── toolkits/           # Extensible toolkit system
└── env.js              # Environment validation
```

### Database Commands

```bash
# Push schema changes
pnpm db:push

# Generate Prisma client
pnpm db:generate

# Open database studio
pnpm db:studio
```

## T3 Cloneathon

This project was built for the T3 Cloneathon, showcasing:

- **Modern T3 Stack** usage with latest patterns
- **Type Safety** throughout the entire application
- **Scalable Architecture** with the toolkit system
- **Developer Experience** with comprehensive tooling
- **Production Ready** with proper error handling and validation

## Contributing

Contributions are welcome! Please read our [Toolkit Development Guide](./src/toolkits/README.md) to get started with creating new toolkits.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with love for the T3 Cloneathon
