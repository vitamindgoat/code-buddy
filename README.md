# CodeBuddy

A learn-to-code platform for total beginners, with a friendly animated mentor buddy who goes through the lessons with you. Built for the 2026 Congressional App Challenge.

**Live site:** (coming soon)

## What it does

- Short, guided JavaScript lessons that run right in the browser
- A real code editor with a Run button that actually executes your code
- A mentor buddy that reacts to what you do: hints when you're stuck, explains errors in plain language, celebrates when it works

## How it's built

Plain HTML, CSS, and JavaScript. No framework, no build step.

- **CodeMirror 5** for the code editor (line numbers + syntax highlighting)
- **Web Worker sandbox** (`runner.js`): the learner's code runs in a separate thread that can't touch the page. A 3-second timeout kills runaway loops.
- **Rule-based buddy**: each lesson defines its expected output and common mistakes, so hints are instant, accurate, and never go off the rails.

## Running locally

Web Workers need a real server (they won't load from `file://`). Any static server works:

```
npx serve .
```

Then open the printed URL.

## AI disclosure

Parts of this project were built with help from an AI assistant (Claude), used as a coding mentor. All code was reviewed and is understood by the author.

## Author

Oleksandr Rybitskyi, Folsom High School
