# Album of the Day

One album a day for everyone. Listen on Spotify, score it on four measures out of 10, and compare with everyone else.

Built with Next.js on Vercel and Supabase for the database and logins.

## Pages

| Page | What it does |
| --- | --- |
| `/` | Today's album, the Listen on Spotify button, the score form and today's averages |
| `/day/[date]` | A past day; late scores allowed |
| `/archive` | Every released album, newest first |
| `/me` | Your scores and averages |
| `/admin` | Curator only: schedule albums from a Spotify link, fix the most-played song |
| `/login` | Sign in or make an account (email and password) |

## Rules the database enforces

- Scores are 0 to 10 in half points. "New to me" leaves Nostalgia out of the overall.
- One score per person per day, changeable until midnight UK time on the day it was given.
- You only see other people's scores for a day once you've scored it yourself.
- Albums for future days are hidden from everyone but the curator.
- The first person to sign up becomes the curator.

## Environment variables

See `.env.example`. On Vercel, add them under Project Settings → Environment Variables.

| Name | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys (publishable) |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | developer.spotify.com/dashboard → your app |
| `LASTFM_API_KEY` | last.fm/api (optional; suggests the most-played song) |

## Run locally

```
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```
