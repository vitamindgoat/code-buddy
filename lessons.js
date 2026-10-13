/* ============================================================
   lessons.js — the lesson content
   Each lesson is plain data. The tutor engine (tutor.js) reads it;
   nothing here is code that runs. Adding a lesson = adding an object.

   A lesson:
     id             short unique name (used to save progress)
     title, intro   shown in the lesson panel
     steps          one object per LINE of code the learner will type:
        code        the exact line (what we compare against)
        say         what the buddy says when this step starts
        explain     what the buddy says once the line is right
        hints       optional: [{ match: /regex on the typed line/, say }]
                    checked first when the learner drifts off course,
                    before the generic "I was expecting ..." message
     expectedOutput what the program should print when it's all correct
     done           what the buddy says when the output matches
   ============================================================ */

const LESSONS = [
  {
    id: "hello",
    title: "Say hello",
    intro:
      "Computers can show words on the screen. In Python, print() shows whatever you put inside the parentheses.",
    steps: [
      {
        code: 'print("Hello, world!")',
        say: 'Let\'s make the computer say hi. Type exactly this: print("Hello, world!")',
        explain: "print shows text on the screen. The quotes tell Python those are words, not code.",
        hints: [
          { match: /^\s*(prnt|pirnt|pritn|pint|prin)\b/i, say: "Check the spelling: it's p-r-i-n-t." },
          { match: /^\s*print\s*"/, say: 'print needs parentheses around the words: print("Hello, world!")' },
          { match: /^\s*print\s*\(\s*[^"'\s)]/, say: 'Put the words inside quotes so Python knows they\'re text: print("Hello, world!")' },
          { match: /^\s*print\s*\(\s*"[^"]*"\s*$/, say: "Close it with a ) at the end." },
        ],
      },
    ],
    expectedOutput: "Hello, world!",
    done: "You wrote your first program! Every programmer in the world started with exactly this.",
  },

  {
    id: "variables",
    title: "Boxes with names",
    intro:
      "A variable is like a box with a name on it. You put something inside, and later you can use what's in the box.",
    steps: [
      {
        code: "age = 10",
        say: "Let's make a box called age and put 10 in it. Type: age = 10",
        explain: "The = sign stores the number 10 in a box named age.",
        hints: [
          { match: /^\s*age\s*==/, say: "Just one = sign. One = means 'store this'." },
          { match: /^\s*age\s*=\s*["']/, say: "No quotes here. 10 is a number, and we want to do math with it." },
        ],
      },
      {
        code: "print(age + 1)",
        say: "Now press Enter and type: print(age + 1)",
        explain: "Python looks inside the age box, finds 10, adds 1, and shows 11.",
        hints: [
          { match: /^\s*print\s*\(\s*["']/, say: "No quotes this time! We want Python to do the math, not show the words." },
        ],
      },
    ],
    expectedOutput: "11",
    done: "You just did math with a variable. Change 10 to your real age and run it again!",
  },

  {
    id: "loop",
    title: "Repeat with a loop",
    intro:
      "A loop repeats something so you don't have to type it over and over. This one repeats three times.",
    steps: [
      {
        code: "for i in range(3):",
        say: "Type: for i in range(3):",
        explain: "This means 'do the next part 3 times'. The colon at the end says 'the repeated part starts below'.",
        hints: [
          { match: /range\s*\(\s*3\s*\)\s*$/, say: "Add a colon : at the very end of the line." },
          { match: /^\s*for\s+i\s+in\s+range\s*\(\s*\d+\s*\)\s*:/, say: "Use the number 3 inside range() for this one." },
        ],
      },
      {
        code: '    print("Hip hip hooray!")',
        say: 'Press Enter. See how the line moved in? That\'s called indenting, and it puts this line inside the loop. Now type: print("Hip hip hooray!")',
        explain: "Indented lines belong to the loop, so this print runs 3 times.",
        hints: [
          { match: /^\S/, say: "This line needs to be indented (4 spaces at the start) so Python knows it's inside the loop." },
        ],
      },
    ],
    expectedOutput: "Hip hip hooray!\nHip hip hooray!\nHip hip hooray!",
    done: "Three cheers from a single print. Try changing 3 to 10!",
  },
];
