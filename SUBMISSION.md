# Congressional App Challenge 2026: submission checklist

> **Deadline: Monday, October 26, 2026 at 12:00 PM (noon) Eastern = 9:00 AM Pacific.**
> District pages and the challenge's own guides list a noon ET cutoff, not evening. Confirm the exact time on your account page at congressionalappchallenge.us, and plan to submit on **Sunday, Oct 25**. Nothing can be changed after the deadline.

## 1. What you submit

- [ ] Registered at congressionalappchallenge.us, under **your** district (California, Folsom)
- [ ] App link: https://code-buddy-iota-puce.vercel.app
- [ ] Source code link: https://github.com/vitamindgoat/code-buddy (make sure the repo is **public**, or be ready to give judges access; refusing a code request disqualifies)
- [ ] Demo video: **1 to 3 minutes**, uploaded to **YouTube or Vimeo**, set to **Public** (not unlisted)
- [ ] Written answers (below)
- [ ] AI use **fully disclosed** (the rules require this; see section 4)

## 2. Demo video (aim for 2:45)

The video **must** say: your name, the app's name, its purpose in one sentence, who it's for, the tools and languages used, and show the app working.

Record the screen with your voice over it (OBS, or Win+G on Windows). Use a fresh browser profile so progress starts empty, turn sound effects on, and zoom the browser to about 125% so text is readable on YouTube.

| Time | Show | Say (roughly) |
|---|---|---|
| 0:00 to 0:15 | Your face or the logo, then the home screen | "Hi, I'm Oleksandr Rybitskyi from Folsom High School. This is **CodeBuddy**, a free web app that teaches total beginners Python by having them type every line, with a buddy who explains each piece as they type." |
| 0:15 to 0:30 | Scroll the sidebar: modules, lessons | "It's for middle and high schoolers who've never coded. No install and no account: 33 lessons, practices and quizzes." |
| 0:30 to 1:10 | Lesson 1.1: type `print("Wake up")` slowly. Buddy moves to your line, ghost letters, explanation per piece | "Buddy follows the line you're on. Gray letters show what's next, and as I type each part he explains what it means." |
| 1:10 to 1:25 | Make a typo (`prnit`), tap the autocorrect bubble | "Typos get caught as they happen. Tap the bubble to fix it, like autocorrect. That's huge on a phone." |
| 1:25 to 1:45 | Press Run, show output, finish the lesson, confetti and badge | "This is real Python running in the browser. Finishing a lesson earns progress and badges." |
| 1:45 to 2:00 | A lesson that crashes on purpose, then fix it | "Some lessons crash on purpose so kids learn to read errors instead of fearing them." |
| 2:00 to 2:15 | Practice (goal + hints), then a quiz question plus the scratch pad | "Then you prove it in a practice without help, and quizzes test everything." |
| 2:15 to 2:30 | Phone: open CodeBuddy **from the home screen icon with airplane mode on**, type and Run; then the dark mode toggle | "It installs like an app and even works offline: this is airplane mode and the Python still runs. It has dark mode too." |
| 2:30 to 2:45 | Certificate screen | "Finish the course and you get a certificate." |
| 2:45 to 2:55 | Back to the lesson screen | "I built it with HTML, CSS and JavaScript, Pyodide to run Python, and CodeMirror for the editor, with help from an AI assistant that I've disclosed. Thanks for watching!" |

## 3. Written answers (drafts, rewrite in your own words)

**Title:** CodeBuddy

**Purpose (one sentence):** CodeBuddy teaches total beginners to code in Python by having them type every line themselves while an animated buddy explains each piece, catches mistakes and cheers them on, for free in any browser.

**Target audience:** Middle and high school students who have never coded, especially those without access to a CS class or tutor.

**Tools and languages:** JavaScript, HTML, CSS; Service Worker + Web App Manifest (installable, offline); Python (the language taught); Pyodide (Python in WebAssembly); CodeMirror 5 (editor); Web Workers; Web Audio API; Web Speech API; Vercel (hosting); GitHub; Playwright (testing); Claude (AI pair programmer, disclosed).

**What inspired you:** *Write this one yourself:* why you wanted a free "tutor next to you," and what learning to code was like for you.

**Technical difficulties and how you solved them** (pick 2 or 3 you can explain well):
- Running Python safely in a browser: Pyodide in a Web Worker, so code can't freeze the page; a 3-second timer kills infinite loops; `input()` gets the lesson's sample answers.
- Knowing exactly where the learner is: each line is split into parts, and the tutor compares what's typed to the target piece by piece, so it can tell "on track" from "typo" and show the right ghost letters.
- Phones: the on-screen keyboard covers things and lacks Python's symbols, so I added a key bar that sits above it and tap-to-fix typo bubbles.
- Keeping the typewriter text in sync with text-to-speech, which behaves differently on every browser.
- Working offline without ever serving an old version: the service worker loads the app network-first (so updates always arrive) but keeps Python cache-first (its URL has a version number, and it's 10 MB).

**What you learned / biggest takeaway:** *Write this yourself.*

**2.0 version:** More modules (lists, functions you write yourself, a small game project), teacher dashboards to track a class, a live AI "ask Buddy anything" mode, and Spanish and Ukrainian translations.

## 4. AI disclosure (required)

The rules allow AI **only if fully disclosed**, and say it "cannot make up the entirety of the technical development" and that you must show "significant individual contributions and technical understanding." So:

- [ ] Put the disclosure from the README's "AI disclosure" section in your submission (edit it so it's accurate in your own words)
- [ ] Be ready to explain to a judge, without notes: how `tutor.js` decides a typo vs. on-track, why Python runs in a Web Worker, how lessons are stored as data in `lessons.js`, and how progress saves to `localStorage`
- [ ] In the video, say it plainly: "I built this with help from an AI coding assistant, which I've disclosed."

## 5. Final checks (Sunday)

- [ ] Open the live site in a private window on a laptop **and** your phone: first lesson, Run, the reading cards and a quiz all work
- [ ] Python loads (Run unlocks) on school Wi-Fi and on cellular
- [ ] Install it to your phone's home screen (Android: Settings → 📲 Install app, or the browser menu; iPhone: Share → Add to Home Screen), open it once online, then try airplane mode before you record
- [ ] README renders on GitHub with screenshots
- [ ] Video is Public, under 3:00, and the audio is clear
- [ ] All form fields filled; submit, then screenshot the confirmation page
