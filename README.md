# ServiceHub Pro

https://service-hub-pro-five.vercel.app/

A modern full-stack service marketplace built with **Next.js 15 (App Router)**, **Supabase**, and **Tailwind CSS**.

## ✨ Features

- 🔐 Auth with Supabase (email/password, JWT sessions)
- 🛡️ Middleware-based protected routes
- 💼 Job listings with live search & filters
- 📊 User dashboard with activity feed
- 🎨 Dark glassmorphism UI with micro-animations

## 🗂️ Folder Structure

```
app/
├── (auth)/login/page.js       # Login
├── (auth)/register/page.js    # Register
├── dashboard/page.js          # Protected dashboard
├── jobs/page.js               # Job listings (client-side filtered)
├── page.js                    # Home / landing
├── layout.js                  # Root layout
└── globals.css                # Global styles + Tailwind

components/
├── ui/Button.js
├── ui/Card.js
├── ui/Input.js
├── Navbar.js
└── Footer.js

lib/
├── supabase/client.js         # Browser client
├── supabase/server.js         # Server/SSR client
└── utils.js

middleware.js                  # Route protection
```

## 🚀 Installation

### 1. Prerequisites

- Node.js 18+ and npm
- A Supabase project ([supabase.com](https://supabase.com))

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase dashboard under **Settings → API**.

### 4. Run the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 📄 Pages

| URL | Access | Description |
|-----|--------|-------------|
| `/` | Public | Landing / hero page |
| `/login` | Public | Email/password login |
| `/register` | Public | New account creation |
| `/dashboard` | Protected | Stats, activity, quick actions |
| `/jobs` | Protected | Searchable job listings |

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 | Framework (App Router) |
| Supabase | Auth + Database + Storage |
| Tailwind CSS | Styling |
| @supabase/ssr | SSR-safe auth cookie handling |
