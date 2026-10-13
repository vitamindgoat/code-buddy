# CodeBuddy

A learn-to-code platform for total beginners, with a friendly animated mentor buddy who goes through the lessons with you. Built for the 2026 Congressional App Challenge.

**Live site:** https://code-buddy-iota-puce.vercel.app

## What it does

- Short, guided Python lessons that run right in the browser, no install
- A real code editor with a Run button that actually executes your code
- A mentor buddy that reacts to what you do: hints when you're stuck, explains errors in plain language, celebrates when it works

## How it's built

Plain HTML, CSS, and JavaScript. No framework, no build step.

- **CodeMirror 5** for the code editor (line numbers + syntax highlighting)
- **Pyodide** (CPython compiled to WebAssembly) so real Python runs in the browser
- **Web Worker sandbox** (`runner.js`): the learner's code runs in a separate thread that can't touch the page. A 3-second timeout kills runaway loops.
- **Rule-based buddy**: each lesson defines its expected output and common mistakes, so hints are instant, accurate, and never go off the rails.
- **Buddy animation**: five SVG poses, swapped by a `data-state` attribute; all motion is CSS keyframes (`buddy.css`). JS decides what the buddy feels, CSS decides how it looks.

## Running locally

Web Workers need a real server (they won't load from `file://`). Any static server works:

```
npx serve .
```

Then open the printed URL.

## AI disclosure

- The code was written with help from an AI assistant (Claude), used as a coding mentor. All code was reviewed and is understood by the author.
- The buddy character art (the five pose SVGs in `assets/buddy/`) was AI-generated from the author's design direction, then cleaned up and animated by hand. The animation system and state logic are the author's own.

## Author

Oleksandr Rybitskyi, Folsom High School
