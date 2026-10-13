/* ============================================================
   lessons.js — the lesson content
   Each lesson is plain data. The tutor engine (tutor.js) reads it;
   nothing here is code that runs. Adding a lesson = adding an object.

   MESSAGE FORMAT (anything the buddy says):
     A string. "\n" starts a new line in the bubble. Text wrapped in
     backticks, like `print`, is shown as a code chip in its own color.
     A line starting with "# " is a section label. Keep lines short.

   A lesson:
     id, title, intro   shown in the lesson panel
     steps              one object per LINE of code the learner types:
        code            the exact full line (what we compare against)
        parts           the line split into pieces, typed in order:
           text         the piece of code (the tutor shows it as a chip)
           say          one short line about WHY, shown above the chip
           explain      what the buddy says once it's typed (the lesson!)
        hints           optional [{ match: /regex on the typed line/, say }]
                        checked when the learner drifts off course,
                        before the generic "I was expecting ..." message
     expectedOutput     what the program prints when it's all correct
     done               what the buddy says when the output matches
   ============================================================ */

const LESSONS = [
  {
    id: "hello",
    title: "Say hello",
    intro: "Make the computer show words on the screen. One line of code is all it takes.",
    steps: [
      {
        code: 'print("Hello, world!")',
        parts: [
          {
            text: "print",
            say: "Start with the name of the function.",
            explain: "`print` is a function.\nA function is a command that does one job.\nprint's job: show things on the screen.",
          },
          {
            text: '("Hello, world!")',
            say: "Give print something to show.",
            explain: "The ( ) hold what you give the function.\nThe quotes mean \"these are words, not code.\"",
          },
        ],
        hints: [
          { match: /^\s*(prnt|pirnt|pritn|pint|prin)\b/i, say: "Check the spelling.\nIt's p-r-i-n-t." },
          { match: /^\s*print\s*"/, say: "print needs parentheses around the words." },
          { match: /^\s*print\s*\(\s*[^"'\s)]/, say: "Put the words inside quotes,\nso Python knows they're text." },
          { match: /^\s*print\s*\(\s*"[^"]*"\s*$/, say: "Almost there.\nClose it with a `)` at the end." },
        ],
      },
    ],
    expectedOutput: "Hello, world!",
    done: "You wrote your first program!\nEvery programmer started with exactly this line.",
  },

  {
    id: "variables",
    title: "Variables",
    intro: "A variable is a name that holds a value. Store a number in one, then do math with it.",
    steps: [
      {
        code: "age = 10",
        parts: [
          {
            text: "age",
            say: "A variable starts with its name.",
            explain: "`age` is a variable.\nA variable is a name that remembers a value for you.",
          },
          {
            text: "= 10",
            say: "Now put a value in it.",
            explain: "One `=` means \"store this.\"\nNow the variable age holds 10.",
          },
        ],
        hints: [
          { match: /^\s*age\s*==/, say: "Just one `=` sign.\nOne = means \"store this.\"" },
          { match: /^\s*age\s*=\s*["']/, say: "No quotes here.\n10 is a number, and we want to do math with it." },
        ],
      },
      {
        code: "print(age + 1)",
        parts: [
          {
            text: "print",
            say: "Press Enter for a new line, then our function again.",
            explain: "Same function as before.\nThis time we'll give it math instead of words.",
          },
          {
            text: "(age + 1)",
            say: "Give it the math.",
            explain: "Python looks up age, finds 10, and adds 1.\nNo quotes, so it calculates instead of showing the words.",
          },
        ],
        hints: [
          { match: /^\s*print\s*\(\s*["']/, say: "No quotes this time!\nWe want Python to do the math,\nnot show the words." },
        ],
      },
    ],
    expectedOutput: "11",
    done: "You just did math with a variable!\nTry changing 10 to a different number and run it again.",
  },

  {
    id: "loop",
    title: "Loops",
    intro: "A loop repeats code so you don't have to type it over and over. This one repeats three times.",
    steps: [
      {
        code: "for i in range(3):",
        parts: [
          {
            text: "for",
            say: "Loops start with a keyword.",
            explain: "`for` is a keyword.\nIt tells Python: \"repeat what comes next.\"",
          },
          {
            text: "i in range(3)",
            say: "Say how many times.",
            explain: "`range(3)` makes the numbers 0, 1, 2.\n`i` takes each one in turn.\nThree numbers = three repeats.",
          },
          {
            text: ":",
            say: "Finish the line with a colon.",
            explain: "The `:` means \"the repeated part starts below.\"",
          },
        ],
        hints: [
          { match: /^\s*for\s+i\s+in\s+range\s*\(\s*\d+\s*\)\s*:/, say: "Use the number 3 inside range() for this one." },
          { match: /range\s*\(\s*3\s*\)\s*$/, say: "Add a colon `:` at the very end of the line." },
        ],
      },
      {
        code: '    print("Hip hip hooray!")',
        parts: [
          {
            text: "print",
            say: "Press Enter. The line moves in: that's indenting.",
            explain: "Indented lines belong to the loop.\nSo this print will run 3 times.",
          },
          {
            text: '("Hip hip hooray!")',
            say: "Give it something to shout.",
            explain: "Words in quotes, inside the parentheses.\nYou've got this pattern down.",
          },
        ],
        hints: [
          { match: /^\S/, say: "This line needs to be indented.\nPut 4 spaces at the start\nso Python knows it's inside the loop." },
        ],
      },
    ],
    expectedOutput: "Hip hip hooray!\nHip hip hooray!\nHip hip hooray!",
    done: "Three cheers from a single print!\nTry changing 3 to 10 and run it again.",
  },
];
