# ClubHub landing page

The public marketing site for ClubHub — React + Vite + TypeScript + Tailwind CSS, kept as an independent app in this subfolder so it can be deployed without any Supabase credentials.

## Running locally

```sh
cd landing
pnpm install
pnpm dev
```

## Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import this repository.
2. When configuring the project, set **Root Directory** to `landing`.
3. Framework Preset: **Vite** (build command `pnpm build`, output directory `dist` — Vercel detects these automatically).
4. Deploy.

Vercel will give you a URL like `https://your-project.vercel.app`. Add it to the main project's `README.md`, or connect a custom domain from the Vercel project settings.
