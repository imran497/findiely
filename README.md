# Findiely - Discover Products by Indie Makers

A semantic search engine for discovering indie products, built with Next.js, OpenSearch, and vector embeddings.

## Quick Start

### 1. Start OpenSearch
```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup OpenSearch Index
```bash
node lib/scripts/setupIndex.js
```

### 4. Start Development Server
```bash
npm run dev
```

Visit **http://localhost:3001**

## Features

✅ Semantic Search with vector embeddings  
✅ Hybrid Search (vector + keyword)  
✅ Auto-tagging from web pages  
✅ Dark/Light mode  
✅ Modern shadcn/ui design  
✅ Single Next.js application (frontend + backend API)

## Tech Stack

- Next.js 16 + TypeScript
- shadcn/ui + Tailwind CSS
- OpenSearch with k-NN vector search
- transformers.js (MiniLM-L6-v2)
- Space Grotesk font
