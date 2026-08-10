# Meeting Muse

Lovable Prompt — Hello_Ai (AI Meeting Assistant)

Copy-paste everything below into Lovable as your project prompt.

Build a full-stack AI-powered meeting assistant platform called Hello_Ai.

Project Overview

Hello_Ai is a tool that joins or records meetings, transcribes them in real time, and automatically generates summaries, key discussion points, and action items — similar in spirit to Otter.ai or Fireflies.ai, but positioned as a lightweight, student/startup-friendly alternative. The UI should feel clean, modern, and professional, with a dark-mode-friendly SaaS aesthetic (think Linear or Notion), rounded cards, and soft accent colors.

Core Features

1. Authentication & User Profiles

Email/password + Google OAuth sign-in

User profile with name, role/team, and default meeting preferences

Persistent dashboard after login showing recent meetings

2. Meeting Upload & Recording

Allow users to upload an audio/video recording of a meeting (mp3, mp4, wav)

Optionally support live recording directly in-browser using the microphone

Show upload progress and processing status clearly

3. Real-Time / Post-Meeting Transcription

Use speech-to-text to transcribe the uploaded or recorded meeting

Support speaker labeling (Speaker 1, Speaker 2, etc.) where possible

Display transcript in a clean, timestamped, scrollable format synced to audio playback

4. AI-Generated Summaries & Action Items

Automatically generate a concise meeting summary after transcription completes

Extract key discussion points, decisions made, and action items with owners (if identifiable) and due dates (if mentioned)

Structure the AI output as clean JSON so it renders reliably into UI cards (Summary / Key Points / Action Items / Decisions)

5. Search & Organization

Let users search across all past meeting transcripts by keyword

Organize meetings into folders or tag them by project/team

Show a meeting history list with title, date, duration, and a one-line AI-generated summary preview

6. Meeting Insights Dashboard

Track stats over time: total meetings, total hours transcribed, most frequent action-item owners, most discussed topics/keywords

Simple charts (bar/line) showing meeting activity trends by week/month

7. Collaboration Features

Allow users to share a meeting's summary/transcript via a shareable link

Allow inline comments or highlights on specific transcript segments

Export meeting summary and action items as a PDF or copy-to-clipboard formatted text (for pasting into Slack/email)

8. Settings & Extras

Dark/light mode toggle

Adjustable AI summary style (Concise / Detailed / Bullet-point only)

Notification/reminder support for pending action items

Tech & Data Requirements

Use Supabase for authentication, database, and file storage (audio/video uploads)

Store meetings, transcripts, summaries, and action items in structured tables so search and history work reliably

Integrate a speech-to-text API (e.g., Whisper) for transcription

Integrate an LLM API (Claude or OpenAI) for summarization and action-item extraction — structure prompts so responses return clean JSON

Handle long recordings by chunking audio before transcription if needed

Design Requirements

Clean, modern SaaS aesthetic — avoid generic templated look

Landing page with a clear value proposition ("Never take meeting notes again. Let AI do it for you.")

Smooth transitions between upload, processing, and results screens

Mobile-responsive layout

Use a distinct accent color (not default blue/purple) to make the brand memorable

Project Name

Name this project Hello_Ai everywhere in the UI (navbar logo, page title, footer).

Goal

The end result should be a working MVP I can demo publicly, get real users to try, and showcase in my portfolio/resume as "Hello_Ai — an AI-powered meeting assistant that automatically transcribes, summarizes, and extracts action items from meetings."

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/52d5ae8d-75d3-4962-946b-8ce7d21c7683).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
