/* ============================================================
   lessons.js — the curriculum
   Built from three class units:
     Unit 1  Computer Science Fundamentals (algorithms, binary,
             compression, logic gates)
     Unit 2  Programming Basics Through Python (output, comments,
             variables, types, operators, tracing, f-strings, input,
             casting, errors)
     Unit 3  Conditionals and Loops (comparisons, logic, if/elif/else,
             common functions, for/while, break/continue, nested loops)

   Everything here is plain data. tutor.js, quiz.js and app.js read it.

   MESSAGE FORMAT (anything the buddy says):
     "\n" = new line.  `code` = code chip.  "# Label" = section label.
     *term* = a highlighted vocabulary word (colored by category).

   A module: { id, title, blurb, lessons: [...], quiz: [...] }

   A READING lesson ({ type: "read" }): interactive cards you click
   through, with pictures and check questions. Teaches the ideas before
   the coding lessons use them, so quizzes only ask what was taught.
     cards: [{ title, text, visual?, check? }]
        visual   { type: "bits" | "flow" | "table" | "compare" | "code" | "gates", ... }
        check    { q, choices, answer, explain }   must be answered to continue

   A CODING lesson:
     id, title, intro       shown in the lesson panel
     inputs                 optional: what "the user types" when the
                            program calls input() (fed in automatically)
     steps                  one per LINE the learner types:
        code                the exact line
        parts               pieces typed in order: { text, say, explain }
        hints               optional [{ match: /regex/, say }] used when the
                            learner clicks the buddy while off course
     expectedOutput         what the program prints when correct
     done                   what the buddy says when the output matches
     practice               { task, inputs?, solution: [lines],
                              expectedOutput, hints: [h1, h2, h3] }

   A quiz question: { q, choices: [4], answer: index, explain }
   ============================================================ */

const MODULES = [
  /* ============================================================ */
  {
    id: "m1",
    title: "Computer Science Fundamentals",
    blurb: "How computers think: steps, bits, patterns and logic.",
    lessons: [
      {
        id: "m1-read-programs", type: "read",
        title: "What is a program?",
        intro: "Before we type any code: how do computers actually think?",
        cards: [
          { title: "Computers are fast, not smart", say: "Computers are fast, not smart. They need precise instructions in the right order.", text: "A computer does exactly what it's told, billions of times a second. It never guesses.\nSo we have to give it instructions that are *precise* and in the right *order*.", visual: { type: "flow", steps: ["Start", "Get a slice of bread", "Spread the peanut butter", "Eat", "End"] } },
          { title: "That list has a name", say: "A step-by-step list of instructions is called an algorithm.", text: "A step-by-step list of instructions is called an *algorithm*.\nA recipe is an algorithm. Directions to school are an algorithm. A program is an algorithm written in a language the computer understands.", visual: { type: "compare", a: { title: "Recipe", lines: ["Crack 2 eggs", "Whisk", "Cook 3 min"] }, b: { title: "Program", lines: ['eggs = 2', 'whisk()', 'cook(3)'] } } },
          { title: "Planning first", say: "Plan first: a flowchart or pseudocode lays out the steps before you code.", text: "Programmers often sketch the plan before coding.\nA *flowchart* draws the steps as boxes and arrows. *Pseudocode* writes them in plain English.\nBoth answer the same question: what happens first, next, and last?", visual: { type: "flow", steps: ["start", "output: ask for name", "input: name", "process: build greeting", "output: greeting", "end"] } },
          { title: "Order matters", say: "Order matters. That's called sequencing.", text: "Swap two steps and the whole thing can go wrong. Put on your shoes, THEN your socks?\nThe computer won't notice. That's why *sequencing* (the order of steps) is the first skill of programming.", check: { q: "What is an algorithm?", choices: ["A kind of computer", "A step-by-step list of instructions", "A programming language", "A bug in the code"], answer: 1, explain: "Recipes, directions, programs: all algorithms. Steps, in order." } },
        ],
      },
      {
        id: "m1-steps",
        title: "Programs are steps",
        intro: "An *algorithm* is a list of steps in order. A program is an algorithm the computer can follow. Order matters!",
        steps: [
          {
            code: 'print("Wake up")',
            parts: [
              { text: "print", say: "Every step in this program is a print, so let's start by typing print.", explain: "`print` is a *function*: a command that does one job.\nIts job is showing text on the screen." },
              { text: '("Wake up")', say: "Now give it the first step of the morning: the words, in quotes, inside the parentheses.", explain: "The ( ) hold what you give the function.\nQuotes mean \"these are words, not code.\"" },
            ],
            hints: [
              { match: /^\s*(prnt|pirnt|pritn|pint|prin)\b/i, say: "Check the spelling: p-r-i-n-t." },
              { match: /^\s*print\s*\(\s*[^"'\s)]/, say: "The words need quotes around them." },
            ],
          },
          {
            code: 'print("Brush teeth")',
            parts: [
              { text: 'print("Brush teeth")', say: "Press Enter, because step two goes on its own line.", explain: "Python runs lines top to bottom.\nThat's called *sequencing*." },
            ],
          },
          {
            code: 'print("Go to school")',
            parts: [
              { text: 'print("Go to school")', say: "Press Enter and add one more step.", explain: "Three lines, three steps, in order.\nSwap two lines and the morning goes wrong!" },
            ],
          },
        ],
        expectedOutput: "Wake up\nBrush teeth\nGo to school",
        done: "That's an algorithm: steps, in order, that the computer follows exactly.",
        practice: {
          task: "Print the numbers 1, 2 and 3, each on its own line, in order.",
          solution: ["print(1)", "print(2)", "print(3)"],
          expectedOutput: "1\n2\n3",
          hints: ["Which command puts text on the screen? You used it in the lesson.", "Do numbers need quotes around them, or only words?", "How many lines do you need if each number gets its own line?"],
        },
      },
      {
        id: "m1-read-binary", type: "read",
        title: "Bits and binary",
        intro: "Everything inside a computer is made of 0s and 1s. Here's how that can mean numbers.",
        cards: [
          { title: "One switch, two states", say: "A computer is billions of switches. Each one is a bit: off is 0, on is 1.", text: "Deep down, a computer is billions of tiny switches. Each switch is either OFF or ON.\nWe write OFF as 0 and ON as 1. One switch is one *bit*.", visual: { type: "bits", value: "1" , labels: false } },
          { title: "Place values", say: "In binary, each place is worth twice the one before: 1, 2, 4, 8.", text: "In normal numbers, each place is worth 10 times more: ones, tens, hundreds.\nIn *binary*, each place is worth 2 times more: 1, 2, 4, 8.\nA 1 means \"count this place,\" a 0 means \"skip it.\"", visual: { type: "bits", value: "0101" } },
          { title: "Reading 101", say: "101 is four plus one, so it's five.", text: "101 has a 1 in the fours place, a 0 in the twos place, and a 1 in the ones place.\n4 + 1 = 5. So 101 is five.\nPython writes binary with 0b in front: 0b101.", visual: { type: "bits", value: "101" } },
          { title: "Bigger numbers, more bits", say: "8 bits make a byte, and everything on a computer is stored as bytes.", text: "8 bits make a *byte*: that's enough for 0 to 255. A letter on your keyboard is one byte. A photo is millions of bytes.\nEvery number, letter, color and sound is just bits like these.", check: { q: "What number is 110 in binary?", choices: ["3", "6", "110", "12"], answer: 1, explain: "4 + 2 + 0 = 6. The fours and twos places are on, the ones place is off." } },
        ],
      },
      {
        id: "m1-binary",
        title: "Binary",
        intro: "Computers store everything as *bits*: 0s and 1s. The number 5 is 101 in binary. Python can show you.",
        steps: [
          {
            code: "number = 5",
            parts: [
              { text: "number", say: "First, make a variable called number to hold our value.", explain: "`number` is a *variable*: a name that remembers a value." },
              { text: "= 5", say: "Now store the number 5 in it.", explain: "One `=` means \"store this.\"" },
            ],
          },
          {
            code: "print(bin(number))",
            parts: [
              { text: "print(", say: "Press Enter. Next we'll print something.", explain: "print shows whatever is inside the parentheses." },
              { text: "bin(number))", say: "Now type bin, with number inside it. bin turns a number into binary.", explain: "`bin` is a function that converts to *binary*.\n5 becomes 0b101: the 0b just means \"this is binary.\"\n1·4 + 0·2 + 1·1 = 5." },
            ],
          },
        ],
        expectedOutput: "0b101",
        done: "101 is 4 + 0 + 1. Every number, letter and picture in a computer is bits like these.",
        practice: {
          task: "Print the binary form of 10.",
          solution: ["print(bin(10))"],
          expectedOutput: "0b1010",
          hints: ["Which function turned a number into binary in the lesson?", "Does bin() show anything on its own, or does it need to be inside something?", "Does the number need a variable, or can it go straight inside bin( )?"],
        },
      },
      {
        id: "m1-read-compression", type: "read",
        title: "Storing data: compression",
        intro: "Files are huge. Compression makes them smaller by finding patterns.",
        cards: [
          { title: "Patterns save space", say: "Repeating patterns can be stored shorter. That's run-length encoding.", text: "A row of pixels in a picture: 0 0 0 0 0 0 0 0. Eight numbers.\nOr: \"0, eight times.\" Two numbers that mean the same thing.\nThat trick is *run-length encoding*: store a value once, plus how many times it repeats.", visual: { type: "compare", a: { title: "Without encoding", lines: ["0 0 0 0 0 0 0 0", "1 1 1 1 1 1 1 1", "0 1 1 1 1 1 1 0"] }, b: { title: "Run-length encoded", lines: ["0 ×8", "1 ×8", "0 ×1  1 ×6  0 ×1"] } } },
          { title: "Entropy: how surprising is the data?", say: "Low entropy means lots of repetition, so it compresses well. Random data doesn't.", text: "Data with lots of repetition is predictable. We say it has *low entropy*, and it compresses well.\nRandom data has no patterns at all: *high entropy*. There's nothing to shrink.\nStatic on a TV compresses terribly. A blue sky compresses great.", visual: { type: "compare", a: { title: "Low entropy", lines: ["0000000000", "0000000000", "compresses well"] }, b: { title: "High entropy", lines: ["1001011010", "0110100101", "barely shrinks"] } } },
          { title: "Lossless vs lossy", say: "Lossless keeps every bit. Lossy throws away detail you won't miss.", text: "*Lossless* compression keeps every single bit. Unzip it and you get the exact original. Text and code use this.\n*Lossy* compression throws away detail you probably won't notice, to save a LOT more space. JPEG photos and MP3 music use this.", visual: { type: "compare", a: { title: "Lossless (PNG, ZIP)", lines: ["exact copy", "smaller", "text, code, logos"] }, b: { title: "Lossy (JPEG, MP3)", lines: ["close copy", "much smaller", "photos, music, video"] } } },
          { title: "Check", text: "You take a photo and send it to a friend. The app shrinks it from 4 MB to 400 KB and it still looks fine.", check: { q: "Which kind of compression is that?", choices: ["Lossless", "Lossy", "Run-length only", "No compression"], answer: 1, explain: "Big savings with slight, unnoticeable loss of detail: that's lossy, like JPEG." } },
        ],
      },
      {
        id: "m1-compression",
        title: "Patterns and compression",
        intro: "Computers save space by finding *patterns*. Instead of storing 00000000, store \"0, eight times.\" That's run-length encoding.",
        steps: [
          {
            code: 'print("0" * 8)',
            parts: [
              { text: 'print("0"', say: "Start by printing a single character: the string zero.", explain: "A *string* is text in quotes. Even one character counts." },
              { text: " * 8)", say: "Now multiply it by 8. On a string, the star means repeat.", explain: "`*` on a string means *repeat*.\n\"0\" * 8 is 0 eight times: the computer only stores the pattern." },
            ],
          },
          {
            code: 'print("01" * 4)',
            parts: [
              { text: 'print("01" * 4)', say: "Press Enter. Patterns can be longer than one character, so let's repeat zero-one four times.", explain: "\"01\" repeated 4 times gives 8 characters.\nLow *entropy* (lots of repetition) compresses well." },
            ],
          },
        ],
        expectedOutput: "00000000\n01010101",
        done: "Repetition is the secret of compression. Random data has no pattern, so it can't shrink.",
        practice: {
          task: "Print \"ab\" repeated 5 times (one line).",
          solution: ['print("ab" * 5)'],
          expectedOutput: "ababababab",
          hints: ["What does the star do when one side is a string?", "Which part is the string and which part is the count?", "Does the string go in quotes? Does the count?"],
        },
      },
      {
        id: "m1-read-logic", type: "read",
        title: "Logic gates",
        intro: "How do switches make decisions? With three tiny machines called gates.",
        cards: [
          { title: "AND", say: "An AND gate outputs 1 only when both inputs are 1.", text: "An *AND gate* has two inputs and one output. The output is 1 only when BOTH inputs are 1.\nLike a door with two locks: you need both keys.", visual: { type: "gates", gate: "AND" } },
          { title: "OR", say: "An OR gate outputs 1 when at least one input is 1.", text: "An *OR gate* outputs 1 when AT LEAST ONE input is 1.\nLike a room with two light switches: either one turns the light on.", visual: { type: "gates", gate: "OR" } },
          { title: "NOT", say: "A NOT gate flips its input. A truth table lists every case.", text: "A *NOT gate* has one input and flips it. 1 becomes 0, 0 becomes 1.\nThe table that lists every input and its output is called a *truth table*. You'll write these in Python with and, or, not.", visual: { type: "gates", gate: "NOT" } },
          { title: "Check", text: "Gates are wired together by the billions to build a processor. Every calculation your phone does is gates.", check: { q: "An AND gate gets inputs 1 and 0. Its output is...", choices: ["1", "0", "2", "It depends"], answer: 1, explain: "AND needs BOTH inputs on. One is off, so the output is 0." } },
        ],
      },
      {
        id: "m1-logic",
        title: "Logic gates",
        intro: "Chips are built from *logic gates*. AND gives True only if both inputs are True. OR gives True if either is. NOT flips it.",
        steps: [
          {
            code: "print(True and False)",
            parts: [
              { text: "print(True", say: "Let's print True. True and False are *booleans*: yes or no values.", explain: "`True` is a *boolean*. Capital T! Python is picky." },
              { text: " and False)", say: "Now add and False. This works like an AND gate: both sides must be True.", explain: "`and` is an AND gate.\nTrue and False is False, because they're not BOTH true." },
            ],
            hints: [{ match: /\btrue\b|\bfalse\b/, say: "Capital letters: `True` and `False`." }],
          },
          {
            code: "print(True or False)",
            parts: [
              { text: "print(True or False)", say: "Press Enter. Next, or works like an OR gate: one True side is enough.", explain: "`or` is an OR gate.\nOne True is enough, so this is True." },
            ],
          },
          {
            code: "print(not True)",
            parts: [
              { text: "print(not True)", say: "Press Enter. Last one: not flips the value.", explain: "`not` is a NOT gate.\nnot True is False." },
            ],
          },
        ],
        expectedOutput: "False\nTrue\nFalse",
        done: "You just wrote a truth table. Every decision a computer makes is built from gates like these.",
        practice: {
          task: "Print True and True on one line, then False or False on the next.",
          solution: ["print(True and True)", "print(False or False)"],
          expectedOutput: "True\nFalse",
          hints: ["Which word gives True only when both sides are True? Which gives True when either side is?", "True and True: what comes out? False or False: what comes out?", "Which two values need a capital first letter here?"],
        },
      },
    ],
    quiz: [
      { q: "What is an algorithm?", choices: ["A type of computer", "A list of steps in order", "A random guess", "A kind of bug"], answer: 1, explain: "An algorithm is a step-by-step list of instructions. Order matters." },
      { q: "What is 5 in binary?", choices: ["0b11", "0b101", "0b110", "0b1001"], answer: 1, explain: "101 = 4 + 0 + 1 = 5." },
      { q: "Run-length encoding stores 00000000 as...", choices: ["Eight separate zeros", "\"0\" and the count 8", "A picture", "Nothing, it deletes it"], answer: 1, explain: "RLE stores the value once plus how many times it repeats." },
      { q: "Data that is random and unpredictable has...", choices: ["Low entropy, compresses well", "High entropy, compresses badly", "No bits", "Lossless quality"], answer: 1, explain: "Compression needs patterns. Random data (high entropy) has none." },
      { q: "True and False is...", choices: ["True", "False", "Error", "Maybe"], answer: 1, explain: "AND needs both to be True." },
      { q: "Lossy compression...", choices: ["Keeps every bit exactly", "Throws some detail away to save space", "Only works on text", "Makes files bigger"], answer: 1, explain: "Lossy (like JPEG) drops detail you won't notice. Lossless keeps everything." },
      { type: "code", q: "Write code that prints 13 in binary.", expectedOutput: "0b1101", explain: "print(bin(13)) gives 0b1101: 8 + 4 + 0 + 1." },
      { type: "code", q: "Print the pattern \"10\" repeated 4 times on one line (like run-length encoding would store it).", expectedOutput: "10101010", explain: "print(\"10\" * 4): the * repeats a string." },
    ],
  },

  /* ============================================================ */
  {
    id: "m2",
    title: "Programming Basics Through Python",
    blurb: "Output, variables, types, math, fancy printing and input.",
    lessons: [
      {
        id: "m2-read-python", type: "read",
        title: "Meet Python",
        intro: "What a programming language is, and why Python is a great first one.",
        cards: [
          { title: "Languages for computers", say: "A programming language is words people can write that a computer can translate into bits.", text: "Computers only understand bits. People don't want to write bits. A *programming language* is the middle ground: words a human can write that a computer can translate.\n*Python* is one of the most popular, because it reads almost like English.", visual: { type: "code", code: 'print("Hello, world!")', output: "Hello, world!" } },
          { title: "The console", say: "When a program prints, the text shows up in the console.", text: "When a program *prints*, the text shows up in the *console*: a plain text window. In CodeBuddy it's the Output box.\nThe console is how your program talks to you.", visual: { type: "code", code: 'print("Hi")\nprint("Bye")', output: "Hi\nBye" } },
          { title: "Comments are for humans", say: "A line starting with a hash is a comment. Python skips it; it's for humans.", text: "A line starting with # is a *comment*. Python skips it completely.\nUse comments to explain what your code does, for yourself and for others. Good programmers comment a lot.", visual: { type: "code", code: "# Say hello twice\nprint(\"Hello\")\nprint(\"Hello\")", output: "Hello\nHello" } },
          { title: "Check", text: "Here's a tiny program. Think about what the console will show.", visual: { type: "code", code: "# print(\"one\")\nprint(\"two\")", output: null }, check: { q: "What does this program print?", choices: ["one", "two", "one and two", "Nothing"], answer: 1, explain: "The first line is a comment, so Python skips it. Only two prints." } },
        ],
      },
      {
        id: "m2-output",
        title: "Output and comments",
        intro: "Programs talk to you through *console output*. Comments are notes for humans that Python skips.",
        steps: [
          {
            code: "# My first program",
            parts: [
              { text: "#", say: "Let's start with a comment. A comment starts with a hash symbol.", explain: "`#` starts a *comment*.\nPython ignores everything after it on that line." },
              { text: " My first program", say: "Now write any note you like after the hash.", explain: "Comments explain your code to people.\nThe computer never sees them." },
            ],
          },
          {
            code: 'print("Hello, world!")',
            parts: [
              { text: 'print("Hello, world!")', say: "Press Enter. Now some real code: print Hello, world!", explain: "`print` sends text to the console.\nThis exact line is the first program most people ever write." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*[^"'\s)]/, say: "The words need quotes around them." }],
          },
          {
            code: 'print("CSP is fun.")',
            parts: [
              { text: 'print("CSP is fun.")', say: "Press Enter and print one more line.", explain: "Each print makes its own line." },
            ],
          },
        ],
        expectedOutput: "Hello, world!\nCSP is fun.",
        done: "Notice the comment didn't print. Comments are for you, output is for the user.",
        practice: {
          task: "Add a comment that says anything, then print \"Python\" on one line and \"rocks\" on the next.",
          solution: ["# comment", 'print("Python")', 'print("rocks")'],
          expectedOutput: "Python\nrocks",
          hints: ["Which symbol starts a comment? Does a comment print anything?", "How many print lines do you need for two separate lines of output?", "What's inside the quotes on the first print? On the second?"],
        },
      },
      {
        id: "m2-escapes",
        title: "Escape sequences",
        intro: "Some characters are hard to type inside quotes. An *escape sequence* starts with a backslash: \\n is a new line, \\\" is a quote mark.",
        steps: [
          {
            code: 'print("Line one\\nLine two")',
            parts: [
              { text: 'print("Line one', say: "Start a print with the text Line one, but don't close the quote yet.", explain: "So far it's ordinary text." },
              { text: '\\nLine two")', say: "Now type backslash n, then Line two. Backslash n means new line, right inside the string.", explain: "`\\n` is an *escape sequence*.\nOne print, two lines of output." },
            ],
          },
          {
            code: 'print("She said \\"hi\\"")',
            parts: [
              { text: 'print("She said \\"hi\\"")', say: "Press Enter. To print an actual quote mark, put a backslash right in front of it.", explain: "`\\\"` prints a real quote mark\ninstead of ending the string." },
            ],
          },
        ],
        expectedOutput: 'Line one\nLine two\nShe said "hi"',
        done: "Backslash means \"the next character is special.\" \\n, \\t and \\\" are the ones you'll use most.",
        practice: {
          task: "Using ONE print, show \"Red\" on the first line and \"Blue\" on the second.",
          solution: ['print("Red\\nBlue")'],
          expectedOutput: "Red\nBlue",
          hints: ["Which two characters inside a string mean \"go to a new line\"?", "Can one print show two lines if the string has that in the middle?", "Where exactly does the \\n go: between Red and Blue, inside the same quotes?"],
        },
      },
      {
        id: "m2-read-types", type: "read",
        title: "Data types",
        intro: "Every value in Python has a type. The type decides what you can do with it.",
        cards: [
          { title: "Four types to know", say: "Four types: int, float, str, and bool.", text: "*int*: whole numbers like 15 or -3.\n*float*: decimals like 3.14 or 2.0.\n*str*: text in quotes, like \"hello\" (short for string).\n*bool*: True or False (short for boolean).", visual: { type: "table", head: ["Value", "Type"], rows: [["15", "int"], ["3.14", "float"], ['"hello"', "str"], ["True", "bool"]] } },
          { title: "Why it matters", say: "Quote 5 unquote is text. 5 is a number. They are not the same.", text: "\"5\" and 5 look alike but aren't. \"5\" is text: you can't do math with it. 5 is a number.\n\"5\" + \"5\" is \"55\" (text joined). 5 + 5 is 10.", visual: { type: "code", code: 'print("5" + "5")\nprint(5 + 5)', output: "55\n10" } },
          { title: "Naming variables", say: "A variable is a name that holds a value. Good names say what's inside.", text: "A *variable* is a name that holds a value. Good names say what's inside: score, player_name, is_raining.\nRules: lowercase, words joined with underscores, no spaces, can't start with a number.", visual: { type: "table", head: ["Name", "OK?"], rows: [["score", "✓"], ["player_name", "✓"], ["2fast", "✗ starts with a number"], ["my score", "✗ has a space"]] } },
          { title: "Check", text: "Look at the value and pick its type.", check: { q: "What type is 2.5?", choices: ["int", "float", "str", "bool"], answer: 1, explain: "Anything with a decimal point is a float." } },
        ],
      },
      {
        id: "m2-variables",
        title: "Variables and data types",
        intro: "A *variable* is a name that holds a value. Every value has a *type*: int (whole number), float (decimal), str (text), bool (True/False).",
        steps: [
          {
            code: 'name = "Gary"',
            parts: [
              { text: "name", say: "Let's make a variable called name. Variable names are lowercase and describe what they hold.", explain: "`name` is a *variable*.\nGood names say what's inside: name, age, score." },
              { text: ' = "Gary"', say: "Now store some text in it, like the name Gary.", explain: "Text in quotes is a *string* (type str)." },
            ],
          },
          {
            code: "age = 15",
            parts: [
              { text: "age = 15", say: "Press Enter. Now make a variable called age that holds a whole number.", explain: "15 with no quotes is an *integer* (type int)." },
            ],
            hints: [{ match: /^\s*age\s*=\s*["']/, say: "No quotes: 15 should be a number, not text." }],
          },
          {
            code: "print(type(name))",
            parts: [
              { text: "print(type(name))", say: "Press Enter. Let's ask Python what type name is, using the type function.", explain: "`type` is a function that reports a value's *type*.\n<class 'str'> means string." },
            ],
          },
          {
            code: "print(type(age))",
            parts: [
              { text: "print(type(age))", say: "Press Enter. Now do the same for age.", explain: "<class 'int'> means integer." },
            ],
          },
        ],
        expectedOutput: "<class 'str'>\n<class 'int'>",
        done: "str, int, float, bool. Knowing the type tells you what you can do with a value.",
        practice: {
          task: "Make a variable called price holding 2.5, then print its type.",
          solution: ["price = 2.5", "print(type(price))"],
          expectedOutput: "<class 'float'>",
          hints: ["Is 2.5 a whole number or a decimal? Which type is that?", "How do you store a value in a name, then look at its type?", "Which function reports a type, and what goes inside it?"],
        },
      },
      {
        id: "m2-operators",
        title: "Math operators",
        intro: "Python does math with + - * /. Two weird ones: *modulus* % gives the remainder, and *floor division* // throws away the decimals.",
        steps: [
          {
            code: "print(7 + 3)",
            parts: [
              { text: "print(7 + 3)", say: "Let's start with plain addition: print 7 plus 3.", explain: "No quotes, so Python *calculates* instead of printing the words." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*["']/, say: "No quotes: we want Python to do the math." }],
          },
          {
            code: "print(7 % 3)",
            parts: [
              { text: "print(7 % 3)", say: "Press Enter. The percent sign is modulus: it gives you the remainder.", explain: "`%` is *modulus*.\n7 ÷ 3 is 2 remainder 1, so 7 % 3 is 1." },
            ],
          },
          {
            code: "print(7 // 3)",
            parts: [
              { text: "print(7 // 3)", say: "Press Enter. Two slashes is floor division: it throws away the decimal part.", explain: "`//` is *floor division*.\n7 ÷ 3 is 2.33, floor division keeps just the 2." },
            ],
          },
          {
            code: "print(7 / 2)",
            parts: [
              { text: "print(7 / 2)", say: "Press Enter. A single slash is regular division, which keeps the decimals.", explain: "A single `/` always gives a *float*, even 4 / 2 = 2.0." },
            ],
          },
        ],
        expectedOutput: "10\n1\n2\n3.5",
        done: "Trick: num % 10 gives the ones digit. (num // 10) % 10 gives the tens digit. Isolate any digit!",
        practice: {
          task: "Print 17 % 5 on one line and 17 // 5 on the next.",
          solution: ["print(17 % 5)", "print(17 // 5)"],
          expectedOutput: "2\n3",
          hints: ["Which operator gives the remainder? Which gives the whole-number part?", "What is 17 divided by 5, and what's left over?", "Two outputs on two lines: how many prints is that?"],
        },
      },
      {
        id: "m2-read-precedence", type: "read",
        title: "Order of operations",
        intro: "Python does math in a specific order, just like in math class.",
        cards: [
          { title: "Same rules as math", say: "Python follows the same order of operations as math.", text: "Parentheses first. Then exponents. Then multiply, divide, modulus and floor division (left to right). Then add and subtract (left to right).\n2 + 3 * 4 is 14, not 20.", visual: { type: "code", code: "print(2 + 3 * 4)\nprint((2 + 3) * 4)", output: "14\n20" } },
          { title: "When in doubt, parentheses", say: "When in doubt, add parentheses.", text: "You never lose points for extra parentheses. They make your intention obvious to Python AND to the next person reading your code.", visual: { type: "table", head: ["Expression", "Value"], rows: [["10 - 2 - 3", "5"], ["10 - (2 - 3)", "11"], ["8 / 2 * 2", "8.0"], ["8 / (2 * 2)", "2.0"]] } },
          { title: "Check", text: "Work it out before you click.", check: { q: "What is 1 + 2 * 3?", choices: ["9", "7", "6", "5"], answer: 1, explain: "Multiply first: 2 * 3 = 6. Then 1 + 6 = 7." } },
        ],
      },
      {
        id: "m2-trace",
        title: "Tracing code",
        intro: "*Tracing* means following a program line by line and tracking what each variable holds. Here x changes four times.",
        steps: [
          { code: "x = 5", parts: [{ text: "x = 5", say: "Let's start a variable x at 5.", explain: "In a trace table: after line 1, x is 5." }] },
          {
            code: "x = x + 3",
            parts: [
              { text: "x = x + 3", say: "Press Enter. Now use the old x to make a new x: x equals x plus 3.", explain: "Python computes the right side first (5 + 3 = 8),\nthen stores it. x is 8." },
            ],
          },
          { code: "x = x * 2", parts: [{ text: "x = x * 2", say: "Press Enter. Now double it.", explain: "8 * 2 = 16. x is 16." }] },
          { code: "x = x - 4", parts: [{ text: "x = x - 4", say: "Press Enter. Now take away 4.", explain: "16 - 4 = 12. x is 12." }] },
          { code: "print(x)", parts: [{ text: "print(x)", say: "Press Enter. Finally, print x to show the final value.", explain: "Only the last value prints. Did your trace say 12?" }] },
        ],
        expectedOutput: "12",
        done: "Tracing is how you find bugs: pretend to be the computer and track every variable.",
        practice: {
          task: "Start y at 10. Floor-divide it by 3. Multiply it by itself. Print y.",
          solution: ["y = 10", "y = y // 3", "y = y * y", "print(y)"],
          expectedOutput: "9",
          hints: ["How do you change a variable using its own old value?", "Which operator keeps only the whole part of a division?", "How do you multiply y by itself? (No new function needed.)"],
        },
      },
      {
        id: "m2-fstrings",
        title: "Fancy output (f-strings)",
        intro: "An *f-string* lets you drop variables straight into text with { }. Put an f before the opening quote.",
        steps: [
          { code: 'name = "GARY THE SNAIL"', parts: [{ text: 'name = "GARY THE SNAIL"', say: "First, a string variable called name.", explain: "name holds the text." }] },
          {
            code: 'print(f"Hi {name}!")',
            parts: [
              { text: 'print(f"', say: "Press Enter. Now type print, then an f right before the quote. That f is the magic.", explain: "`f\"` starts an *f-string*: a string that can hold variables." },
              { text: 'Hi {name}!")', say: "Now write Hi, then name inside curly braces. The braces pull in the variable.", explain: "`{name}` is replaced by what name holds.\nNo + signs, no str()." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*"/, say: "Put an f right before the opening quote: print(f\"...\")" }],
          },
          { code: "num = 50", parts: [{ text: "num = 50", say: "Press Enter. Let's make a number variable this time.", explain: "num holds 50." }] },
          {
            code: 'print(f"{num} * 2 = {num * 2}")',
            parts: [
              { text: 'print(f"{num} * 2 = {num * 2}")', say: "Press Enter. The braces can hold math too, like num times 2.", explain: "`{num * 2}` does the math inside the string.\nOutput: 50 * 2 = 100." },
            ],
          },
        ],
        expectedOutput: "Hi GARY THE SNAIL!\n50 * 2 = 100",
        done: "f-strings are the cleanest way to print text and values together. You'll use them constantly.",
        practice: {
          task: "With score = 7, use an f-string to print exactly: Score: 7 out of 10",
          solution: ["score = 7", 'print(f"Score: {score} out of 10")'],
          expectedOutput: "Score: 7 out of 10",
          hints: ["What letter goes right before the opening quote to make an f-string?", "How do you drop a variable into the middle of the string?", "Does the word Score and \"out of 10\" go inside the string or outside?"],
        },
      },
      {
        id: "m2-input",
        title: "Input",
        intro: "input() shows a prompt, pauses, and waits for the user to type.",
        inputs: ["Gary"],
        steps: [
          {
            code: 'name = input("What is your name? ")',
            parts: [
              { text: "name = ", say: "Let's make a variable called name to store what the user types.", explain: "The answer goes into the variable name." },
              { text: 'input("What is your name? ")', say: "Now type input with a question inside. input shows the question and waits for an answer.", explain: "`input` is a function that *pauses* the program.\nWhatever the user types comes back as a *string*." },
            ],
          },
          {
            code: 'print("Hi " + name + "!")',
            parts: [
              { text: 'print("Hi " + name + "!")', say: "Press Enter. Now greet them. The plus sign joins strings together.", explain: "`+` on strings *joins* them.\n\"Hi \" + \"Gary\" + \"!\" becomes Hi Gary!" },
            ],
          },
        ],
        expectedOutput: "What is your name? Gary\nHi Gary!",
        done: "input() ALWAYS returns a string, even if the user types a number. That matters next lesson.",
        practice: {
          task: "Ask \"Favorite food? \" with input(), then print \"Yum, \" followed by the answer and \"!\".",
          inputs: ["pizza"],
          solution: ['food = input("Favorite food? ")', 'print("Yum, " + food + "!")'],
          expectedOutput: "Favorite food? pizza\nYum, pizza!",
          hints: ["Which function asks the user something and waits? Where does its answer go?", "How do you glue two strings together?", "Which pieces are fixed text and which piece is the user's answer?"],
        },
      },
      {
        id: "m2-casting",
        title: "Casting input",
        intro: "input() gives a string, so \"12\" + 1 breaks. *Casting* converts it: int(\"12\") is the number 12.",
        inputs: ["12"],
        steps: [
          {
            code: 'age = int(input("How old are you? "))',
            parts: [
              { text: "age = int(", say: "This time we wrap the input in int, to turn the typed text into a number.", explain: "`int` is a function that *casts* text to a whole number." },
              { text: 'input("How old are you? "))', say: "The input goes inside the int. You'll need two closing parentheses!", explain: "Inside-out: input() runs first, then int() converts the answer." },
            ],
            hints: [{ match: /^\s*age\s*=\s*input/, say: "Wrap it: age = int(input(...)). Without int() the math will fail." }],
          },
          {
            code: "print(age + 1)",
            parts: [
              { text: "print(age + 1)", say: "Press Enter. Now that age is a number, math works: print age plus 1.", explain: "age is a real number now, so 12 + 1 = 13." },
            ],
          },
        ],
        expectedOutput: "How old are you? 12\n13",
        done: "Casting lets math happen. But if the user types \"twelve\", int() crashes: that's a runtime error.",
        practice: {
          task: "Ask \"Number? \", cast the answer to int, and print it times 3.",
          inputs: ["4"],
          solution: ['n = int(input("Number? "))', "print(n * 3)"],
          expectedOutput: "Number? 4\n12",
          hints: ["What type does input() always give back? Can you multiply that?", "Which function turns text into a whole number?", "Does int() wrap around the input, or go after it?"],
        },
      },
      {
        id: "m2-read-errors", type: "read",
        title: "Three kinds of errors",
        intro: "Every programmer makes errors all day. The skill is knowing which kind you're looking at.",
        cards: [
          { title: "Syntax errors", say: "A syntax error means Python can't even read the line.", text: "Python can't even read the line. A missing parenthesis, a typo in a keyword, a forgotten colon.\nThe program never starts. Python points at the spot it got confused.", visual: { type: "code", code: 'print("hi"', output: "SyntaxError: '(' was never closed" } },
          { title: "Runtime errors", say: "A runtime error means the code broke while it was running.", text: "The code reads fine, but something breaks while it's running. Dividing by zero. Using a variable that doesn't exist. Adding text to a number.\nThe program crashes partway through.", visual: { type: "code", code: 'print("Age: " + 15)', output: "TypeError: can only concatenate str (not \"int\") to str" } },
          { title: "Logic errors", say: "A logic error means it runs fine, but the answer is wrong.", text: "The sneakiest kind. The program runs with no error message, but the answer is wrong.\nYou wanted the average but divided by the wrong number. Only testing finds these.", visual: { type: "code", code: "total = 10 + 20\naverage = total / 3\nprint(average)", output: "10.0   (should be 15.0)" } },
          { title: "Reading a traceback", say: "When Python crashes, read the last line of the traceback first.", text: "When Python crashes it prints a *traceback*. Read the LAST line first: it names the error and explains it. Then look for the line number above it.\nCodeBuddy highlights that line for you in red.", check: { q: "Your program runs, prints a number, no error message, but the number is wrong. Which kind of error?", choices: ["Syntax", "Runtime", "Logic", "Traceback"], answer: 2, explain: "No crash, wrong answer: a logic error. Only testing catches it." } },
        ],
      },
      {
        id: "m2-errors",
        title: "Errors and str()",
        intro: "Three kinds of *errors*: syntax (Python can't read it), runtime (it crashes while running), logic (it runs but is wrong). Here's a classic runtime one.",
        steps: [
          { code: "total = 2 + 2", parts: [{ text: "total = 2 + 2", say: "First, do some math and store it in total.", explain: "total holds the int 4." }] },
          {
            code: 'print("total is " + str(total))',
            parts: [
              { text: 'print("total is " + ', say: "Press Enter. Now start printing some text, and join it with a plus.", explain: "+ joins two *strings*. But total is an int!" },
              { text: "str(total))", say: "Now wrap total in str to turn the number into text.", explain: "`str` converts a value to a *string*.\nWithout it you'd get a TypeError: can't join str and int." },
            ],
            hints: [{ match: /\+\s*total\s*\)/, say: "total is a number. Wrap it: str(total), or Python raises a TypeError." }],
          },
        ],
        expectedOutput: "total is 4",
        done: "When you see a traceback, read the LAST line first: it names the error. Then the line number.",
        practice: {
          task: "With age = 15, print exactly: Age: 15  (use + and str()).",
          solution: ["age = 15", 'print("Age: " + str(age))'],
          expectedOutput: "Age: 15",
          hints: ["What happens when you + a string and a number?", "Which function turns a number into text?", "Where does str() go: around age, or around the whole thing?"],
        },
      },
    ],
    quiz: [
      { q: "What does # do in Python?", choices: ["Prints a hashtag", "Starts a comment Python ignores", "Makes a variable", "Ends the program"], answer: 1, explain: "Comments are notes for humans. Python skips them." },
      { q: "What type is 3.14?", choices: ["int", "str", "float", "bool"], answer: 2, explain: "Decimals are floats." },
      { q: "What is 10 % 3?", choices: ["3", "1", "3.33", "0"], answer: 1, explain: "10 ÷ 3 is 3 remainder 1. % gives the remainder." },
      { q: "What is 10 // 3?", choices: ["3", "1", "3.33", "4"], answer: 0, explain: "Floor division throws away the decimals: 3." },
      { q: "input() always returns a...", choices: ["int", "float", "string", "bool"], answer: 2, explain: "Even if the user types 12, you get \"12\". Cast it with int()." },
      { q: "print(\"Age: \" + 15) causes a...", choices: ["Syntax error", "Runtime error (TypeError)", "Logic error", "Nothing, it prints Age: 15"], answer: 1, explain: "It runs, then crashes: you can't join a str and an int. Use str(15)." },
      { q: "Which prints  Hi Sam!  if name = \"Sam\"?", choices: ['print("Hi {name}!")', 'print(f"Hi {name}!")', 'print("Hi name!")', 'print(f"Hi name!")'], answer: 1, explain: "The f before the quote makes { } pull in the variable." },
      { type: "code", q: "Print 29 % 6 on one line, then 29 // 6 on the next.", expectedOutput: "5\n4", explain: "29 ÷ 6 is 4 remainder 5. % gives 5, // gives 4." },
      { type: "code", q: "Make a variable called name holding \"Ada\", then use an f-string to print exactly:  Hello, Ada!", expectedOutput: "Hello, Ada!", explain: 'name = "Ada" then print(f"Hello, {name}!")' },
      { type: "code", q: "Ask \"Age? \" with input(), cast it to int, and print the age plus 10. The user types: 15", inputs: ["15"], expectedOutput: "Age? 15\n25", explain: "age = int(input(\"Age? \")) then print(age + 10). Without int() the + would fail." },
    ],
  },

  /* ============================================================ */
  {
    id: "m3",
    title: "Conditionals and Loops",
    blurb: "Make decisions and repeat things: the heart of real programs.",
    lessons: [
      {
        id: "m3-read-decisions", type: "read",
        title: "Making decisions",
        intro: "Programs that only go in a straight line are boring. Decisions let them react.",
        cards: [
          { title: "Yes or no questions", say: "A boolean is either True or False. Comparisons produce them.", text: "A *boolean* is a value that's either True or False. Comparisons produce them: is 5 bigger than 3? True.\nEvery decision a program makes comes down to a boolean.", visual: { type: "table", head: ["Question", "Python", "Answer"], rows: [["Is 5 bigger than 3?", "5 > 3", "True"], ["Is 5 equal to 3?", "5 == 3", "False"], ["Is 5 not equal to 3?", "5 != 3", "True"]] } },
          { title: "Combining questions", say: "and needs both. or needs one. not flips it.", text: "and: both must be true. or: at least one. not: flip it.\nSame as the logic gates from Module 1, just written as words.", visual: { type: "table", head: ["a", "b", "a and b", "a or b"], rows: [["True", "True", "True", "True"], ["True", "False", "False", "True"], ["False", "True", "False", "True"], ["False", "False", "False", "False"]] } },
          { title: "The fork in the road", say: "An if statement checks a boolean and picks a path.", text: "An *if statement* checks a boolean. True: run the indented block. False: skip it, or run the else block instead.\nA flowchart shows it as a diamond with two exits.", visual: { type: "flow", steps: ["age >= 18?", "Yes → print Adult", "No → print Minor"] } },
          { title: "Check", text: "Think about the truth table.", check: { q: "True and False is...", choices: ["True", "False", "Error", "Sometimes"], answer: 1, explain: "and needs both. One is False, so the whole thing is False." } },
        ],
      },
      {
        id: "m3-compare",
        title: "Comparisons",
        intro: "*Relational operators* compare two values and give a *boolean*: >  <  >=  <=  ==  !=",
        steps: [
          { code: "print(5 > 3)", parts: [{ text: "print(5 > 3)", say: "Let's ask Python a question: is 5 greater than 3?", explain: "`>` compares. The answer is a *boolean*: True." }] },
          {
            code: "print(5 == 3)",
            parts: [{ text: "print(5 == 3)", say: "Press Enter. Two equals signs ask: are these equal?", explain: "`==` means *is equal to*.\nOne = stores, two == compares!" }],
            hints: [{ match: /print\s*\(\s*5\s*=\s*3/, say: "Use two equals signs to compare: ==" }],
          },
          { code: "print(5 != 3)", parts: [{ text: "print(5 != 3)", say: "Press Enter. Exclamation equals means not equal.", explain: "`!=` means *not equal to*. 5 is not 3, so True." }] },
        ],
        expectedOutput: "True\nFalse\nTrue",
        done: "Comparisons are questions with yes/no answers. Conditionals are built on them.",
        practice: {
          task: "Print 10 <= 10 on one line and 2 >= 5 on the next.",
          solution: ["print(10 <= 10)", "print(2 >= 5)"],
          expectedOutput: "True\nFalse",
          hints: ["Which symbols mean \"less than or equal\" and \"greater than or equal\"?", "Is 10 <= 10 True or False? Is 2 >= 5?", "Do you need quotes around a comparison, or does print show the result directly?"],
        },
      },
      {
        id: "m3-logic",
        title: "and, or, not",
        intro: "*Logical operators* combine comparisons. and: both true. or: at least one. not: flip it.",
        steps: [
          { code: "age = 16", parts: [{ text: "age = 16", say: "First, a number to test: age equals 16.", explain: "age holds 16." }] },
          {
            code: "print(age >= 13 and age <= 19)",
            parts: [
              { text: "print(age >= 13", say: "Press Enter. Now the first comparison: is age 13 or older?", explain: "16 >= 13 is True." },
              { text: " and age <= 19)", say: "Now add and age less than or equal to 19. With and, the second part must also be true.", explain: "`and` needs BOTH. 16 <= 19 is True too, so True.\nA teenager check!" },
            ],
          },
          {
            code: "print(age < 13 or age > 19)",
            parts: [{ text: "print(age < 13 or age > 19)", say: "Press Enter. Now try or: only one side needs to be true.", explain: "`or` needs just one. Both are False here, so False." }],
          },
        ],
        expectedOutput: "True\nFalse",
        done: "Precedence tip: not runs first, then and, then or. Use parentheses when in doubt.",
        practice: {
          task: "With temp = 75, print whether temp is above 60 AND below 90.",
          solution: ["temp = 75", "print(temp > 60 and temp < 90)"],
          expectedOutput: "True",
          hints: ["How do you say \"both of these must be true\" in Python?", "Above 60 is one comparison. Below 90 is another. How do you join them?", "Which goes first on the line: the variable, or the print?"],
        },
      },
      {
        id: "m3-if",
        title: "if and else",
        intro: "A *conditional* runs code only when something is true. if checks, else catches everything else.",
        inputs: ["20"],
        steps: [
          { code: 'age = int(input("Age? "))', parts: [{ text: 'age = int(input("Age? "))', say: "First, get a number from the user and store it in age.", explain: "Cast with int() so we can compare numbers." }] },
          {
            code: "if age >= 18:",
            parts: [
              { text: "if", say: "Press Enter. Now type if: the keyword that makes a decision.", explain: "`if` is a *keyword*: \"only do this when...\"" },
              { text: " age >= 18:", say: "Now the condition, age greater or equal to 18, then a colon.", explain: "The `:` means \"the code for this case is below, indented.\"" },
            ],
            hints: [{ match: /^\s*if\s+age\s*>=\s*18\s*$/, say: "Add a colon : at the end." }],
          },
          { code: '    print("Adult")', parts: [{ text: 'print("Adult")', say: "Press Enter. This line is indented, so it only runs if the condition was True.", explain: "Indented lines belong to the if." }] },
          {
            code: "else:",
            parts: [{ text: "else:", say: "Press Enter, then Backspace to un-indent. Now type else: it handles the other case.", explain: "`else` has no condition: it's \"otherwise.\"\nIt lines up with the if." }],
            hints: [{ match: /^\s+else/, say: "else: must line up with if. Remove the indentation." }],
          },
          { code: '    print("Minor")', parts: [{ text: 'print("Minor")', say: "Press Enter. This one is indented again, under the else.", explain: "Exactly one of the two prints runs. Never both." }] },
        ],
        expectedOutput: "Age? 20\nAdult",
        done: "if/else is a fork in the road. The user typed 20, so we took the Adult path.",
        practice: {
          task: "Ask \"Number? \" (cast to int). If it's greater than 10 print \"Big\", else print \"Small\".",
          inputs: ["5"],
          solution: ['n = int(input("Number? "))', "if n > 10:", '    print("Big")', "else:", '    print("Small")'],
          expectedOutput: "Number? 5\nSmall",
          hints: ["Which keyword makes a decision? What goes at the end of that line?", "What happens to the line under an if? How is it placed?", "Which keyword handles \"otherwise\"? Does it line up with the if or with the print?"],
        },
      },
      {
        id: "m3-elif",
        title: "elif",
        intro: "More than two cases? *elif* (else-if) checks another condition. Python stops at the first one that's true.",
        steps: [
          { code: "score = 85", parts: [{ text: "score = 85", say: "Let's start with a test score of 85.", explain: "score holds 85." }] },
          { code: "if score >= 90:", parts: [{ text: "if score >= 90:", say: "Press Enter. Here's the first check: is the score 90 or more?", explain: "85 >= 90 is False, so Python skips this block." }] },
          { code: '    print("A")', parts: [{ text: 'print("A")', say: "Press Enter. Indent, then print A.", explain: "This line gets skipped this time." }] },
          {
            code: "elif score >= 80:",
            parts: [{ text: "elif score >= 80:", say: "Press Enter, then Backspace to un-indent. elif means else-if: another check.", explain: "`elif` only runs if the if was False.\n85 >= 80 is True!" }],
            hints: [{ match: /^\s*else\s+if/, say: "Python spells it elif, one word." }],
          },
          { code: '    print("B")', parts: [{ text: 'print("B")', say: "Press Enter. Indent, then print B.", explain: "This one runs, and Python stops checking." }] },
          { code: "else:", parts: [{ text: "else:", say: "Press Enter, then Backspace to un-indent. else is the catch-all.", explain: "`else` catches everything that didn't match." }] },
          { code: '    print("C")', parts: [{ text: 'print("C")', say: "Press Enter. Indent, then print C.", explain: "This line is never reached this time." }] },
        ],
        expectedOutput: "B",
        done: "Order matters: put the strictest check first. Checking >= 80 before >= 90 would give the wrong grade.",
        practice: {
          task: "With temp = 50: print \"Hot\" if above 80, \"Warm\" if above 60, otherwise \"Cold\".",
          solution: ["temp = 50", "if temp > 80:", '    print("Hot")', "elif temp > 60:", '    print("Warm")', "else:", '    print("Cold")'],
          expectedOutput: "Cold",
          hints: ["Which keyword means \"else, if\"? How many checks do you need here?", "Which number should you check first: 80 or 60? Why does the order matter?", "What catches everything that didn't match either check?"],
        },
      },
      {
        id: "m3-functions",
        title: "Common functions",
        intro: "Python ships with handy *functions*: len() counts characters, round() rounds, abs() drops the minus sign.",
        steps: [
          { code: 'word = "banana"', parts: [{ text: 'word = "banana"', say: "First, a string to measure: word equals banana.", explain: "word holds 6 characters." }] },
          { code: "print(len(word))", parts: [{ text: "print(len(word))", say: "Press Enter. len counts the characters in word.", explain: "`len` returns the *length*: 6." }] },
          { code: "print(round(3.7))", parts: [{ text: "print(round(3.7))", say: "Press Enter. round rounds to the nearest whole number.", explain: "`round` gives 4." }] },
          { code: "print(abs(-5))", parts: [{ text: "print(abs(-5))", say: "Press Enter. abs gives the absolute value: it drops the minus sign.", explain: "`abs` removes the sign: 5." }] },
        ],
        expectedOutput: "6\n4\n5",
        done: "Also useful: min(), max(), str(), int(), float(). A function takes something in and gives something back.",
        practice: {
          task: "Print the length of \"Hello, world!\" then print max(3, 9).",
          solution: ['print(len("Hello, world!"))', "print(max(3, 9))"],
          expectedOutput: "13\n9",
          hints: ["Which function counts characters? Do spaces and punctuation count?", "Which function picks the biggest of its inputs?", "Can a function call go directly inside print( )?"],
        },
      },
      {
        id: "m3-read-loops", type: "read",
        title: "Which loop?",
        intro: "Two kinds of loops. Picking the right one is half the job.",
        cards: [
          { title: "for: when you know how many", say: "Use a for loop when you know how many times.", text: "A *for loop* repeats a set number of times. range(5) means five times. Looping over a list means once per item.\nUse it when the count is known before the loop starts.", visual: { type: "code", code: "for i in range(3):\n    print(i)", output: "0\n1\n2" } },
          { title: "while: until something changes", say: "Use a while loop when you're waiting for something to change.", text: "A *while loop* keeps going as long as a condition is True. You don't know how many times: maybe 3, maybe 300.\nUse it when you're waiting for something: a correct password, a game to end.", visual: { type: "code", code: "n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1", output: "3\n2\n1" } },
          { title: "The infinite loop", say: "If nothing in a while loop changes the condition, it runs forever.", text: "If nothing inside a while loop ever changes the condition, it runs forever. The program freezes.\nAlways ask: what inside the loop moves me toward False?", visual: { type: "compare", a: { title: "Infinite", lines: ["n = 3", "while n > 0:", "    print(n)"] }, b: { title: "Fixed", lines: ["n = 3", "while n > 0:", "    print(n)", "    n = n - 1"] } } },
          { title: "break and continue", say: "break leaves the loop. continue skips to the next round.", text: "*break* leaves the loop immediately. *continue* skips the rest of this round and starts the next one.\nBoth only make sense inside a loop.", check: { q: "You want to repeat exactly 10 times. Which loop?", choices: ["for", "while", "Either, it doesn't matter", "if"], answer: 0, explain: "Known count: for i in range(10). while is for \"until something happens.\"" } },
        ],
      },
      {
        id: "m3-for",
        title: "for loops",
        intro: "A *for loop* repeats a block once for each number range() produces. range(5) is 0, 1, 2, 3, 4.",
        steps: [
          {
            code: "for i in range(5):",
            parts: [
              { text: "for i in", say: "Type for, then i, then in. for is the loop keyword and i is the loop variable.", explain: "`for` is a *keyword*. `i` takes each value in turn." },
              { text: " range(5):", say: "Now range of 5, which gives five numbers, then a colon.", explain: "`range(5)` is 0 through 4. Starts at 0, stops BEFORE 5." },
            ],
            hints: [{ match: /range\s*\(\s*5\s*\)\s*$/, say: "Add a colon : at the end." }],
          },
          { code: "    print(i)", parts: [{ text: "print(i)", say: "Press Enter. Indent and print i. This body runs 5 times.", explain: "Each time through, i is the next number." }] },
        ],
        expectedOutput: "0\n1\n2\n3\n4",
        done: "range(5) has 5 numbers but starts at 0, so the last is 4. That trips everyone up once.",
        practice: {
          task: "Print 1, 2, 3 using a for loop with range(1, 4).",
          solution: ["for i in range(1, 4):", "    print(i)"],
          expectedOutput: "1\n2\n3",
          hints: ["range(5) starts at 0. How do you make it start at 1?", "range stops BEFORE its last number. If you want 3, what do you pass?", "What goes on the indented line under the for?"],
        },
      },
      {
        id: "m3-sum",
        title: "Adding up with a loop",
        intro: "A loop can build a result step by step. This one adds every number from 0 to 100.",
        steps: [
          { code: "total = 0", parts: [{ text: "total = 0", say: "First, start a running total at zero.", explain: "An *accumulator*: a variable that collects results." }] },
          { code: "for n in range(101):", parts: [{ text: "for n in range(101):", say: "Press Enter. To count from 0 to 100 we need range of 101.", explain: "range(101) stops before 101, so 100 is included." }] },
          { code: "    total = total + n", parts: [{ text: "total = total + n", say: "Press Enter. Indent, then add n to the total each time.", explain: "Each loop adds the next number to total." }] },
          {
            code: "print(total)",
            parts: [{ text: "print(total)", say: "Press Enter, then Backspace to un-indent. Print the total after the loop.", explain: "Un-indented, so it runs once, at the end: 5050." }],
            hints: [{ match: /^\s+print\s*\(\s*total/, say: "Un-indent this print so it runs after the loop, not inside it." }],
          },
        ],
        expectedOutput: "5050",
        done: "Gauss did this in his head as a kid. You did it in four lines.",
        practice: {
          task: "Add up all the EVEN numbers from 0 to 100 and print the total. (Hint: range can take a step.)",
          solution: ["total = 0", "for n in range(0, 101, 2):", "    total = total + n", "print(total)"],
          expectedOutput: "2550",
          hints: ["range can take a third number. What does it control?", "What step skips every other number? Where does the counting start?", "Where does the running total start, and where does the print go: inside or after the loop?"],
        },
      },
      {
        id: "m3-while",
        title: "while loops",
        intro: "A *while loop* repeats as long as a condition stays true. You must change something inside, or it loops forever.",
        steps: [
          { code: "count = 3", parts: [{ text: "count = 3", say: "Let's set up a countdown: count equals 3.", explain: "count holds 3." }] },
          {
            code: "while count > 0:",
            parts: [{ text: "while count > 0:", say: "Press Enter. Now a while loop: keep going while count is greater than zero.", explain: "`while` is a *keyword*: \"repeat as long as this is True.\"" }],
          },
          { code: "    print(count)", parts: [{ text: "print(count)", say: "Press Enter. Indent, then print count.", explain: "Shows 3, then 2, then 1." }] },
          {
            code: "    count = count - 1",
            parts: [{ text: "count = count - 1", say: "Press Enter. Still indented: subtract one from count. This line is what prevents an infinite loop.", explain: "Without it, count stays 3 forever.\nCodeBuddy would stop you after 3 seconds!" }],
          },
          { code: 'print("Liftoff!")', parts: [{ text: 'print("Liftoff!")', say: "Press Enter, then Backspace to un-indent. This runs after the loop.", explain: "Runs once when count hits 0." }] },
        ],
        expectedOutput: "3\n2\n1\nLiftoff!",
        done: "Use for when you know how many times. Use while when you're waiting for something to become true.",
        practice: {
          task: "Use a while loop to print 1, 2, 3, 4 (count up).",
          solution: ["n = 1", "while n <= 4:", "    print(n)", "    n = n + 1"],
          expectedOutput: "1\n2\n3\n4",
          hints: ["What should the counter start at? When should the loop stop?", "What goes inside the loop so it eventually ends?", "Which comes first inside the loop: printing n, or adding 1 to it?"],
        },
      },
      {
        id: "m3-break",
        title: "break and continue",
        intro: "Two loop *keywords*: break leaves the loop immediately, continue skips to the next round.",
        steps: [
          { code: "for n in range(10):", parts: [{ text: "for n in range(10):", say: "Start a loop that would run 10 times.", explain: "But we'll cut it short with break." }] },
          { code: "    if n == 3:", parts: [{ text: "if n == 3:", say: "Press Enter. Indent, then add a check inside the loop: if n equals 3.", explain: "A conditional inside a loop. Very common." }] },
          {
            code: "        break",
            parts: [{ text: "break", say: "Press Enter. Indent twice, because we're inside the if, inside the loop. Then type break.", explain: "`break` ends the whole loop right now." }],
          },
          {
            code: "    print(n)",
            parts: [{ text: "print(n)", say: "Press Enter, then Backspace once to get back to loop level, and print n.", explain: "Prints 0, 1, 2. When n hits 3, break fires first." }],
          },
        ],
        expectedOutput: "0\n1\n2",
        done: "break = stop the loop. continue = skip this round. Both only work inside loops.",
        practice: {
          task: "Loop n over range(4). If n == 2, continue (skip it). Otherwise print n.",
          solution: ["for n in range(4):", "    if n == 2:", "        continue", "    print(n)"],
          expectedOutput: "0\n1\n3",
          hints: ["Which keyword skips the rest of this round but keeps looping?", "What's the check that spots n being 2? What goes under it?", "How many levels of indentation does continue need: one or two?"],
        },
      },
      {
        id: "m3-nested",
        title: "Nested loops",
        intro: "A loop inside a loop. The inner one runs completely for every single round of the outer one. Great for grids.",
        steps: [
          { code: "for row in range(3):", parts: [{ text: "for row in range(3):", say: "Start with the outer loop: 3 rows.", explain: "The outer loop runs 3 times." }] },
          {
            code: "    for col in range(3):",
            parts: [{ text: "for col in range(3):", say: "Press Enter. Indent, then the inner loop: 3 columns.", explain: "A *nested loop*. For each row, this runs 3 times: 9 total." }],
          },
          {
            code: '        print("*", end="")',
            parts: [{ text: 'print("*", end="")', say: "Press Enter. Indent twice, then print a star with end equals empty quotes, which keeps printing on the same line.", explain: "Normally print ends with a new line.\n`end=\"\"` makes it end with nothing." }],
          },
          {
            code: "    print()",
            parts: [{ text: "print()", say: "Press Enter, then Backspace once. An empty print just moves to a new line.", explain: "After each row of stars, move to the next line." }],
          },
        ],
        expectedOutput: "***\n***\n***",
        done: "That's a shape builder. Change the ranges and you get rectangles; use the row number and you get triangles.",
        practice: {
          task: "Print a triangle: * on line 1, ** on line 2, *** on line 3. (A single loop and string repetition will do it.)",
          solution: ["for row in range(1, 4):", '    print("*" * row)'],
          expectedOutput: "*\n**\n***",
          hints: ["What does \"*\" * 3 give you?", "If row goes 1, 2, 3, what is \"*\" * row each time?", "Which range gives you 1, 2, 3?"],
        },
      },
    ],
    quiz: [
      { q: "What does 5 == 5 give?", choices: ["5", "True", "False", "Error"], answer: 1, explain: "== compares and gives a boolean. 5 equals 5, so True." },
      { q: "True or False is...", choices: ["True", "False", "Error", "Both"], answer: 0, explain: "OR needs just one True." },
      { q: "What prints?  x = 7\nif x > 10:\n    print(\"A\")\nelse:\n    print(\"B\")", choices: ["A", "B", "A and B", "Nothing"], answer: 1, explain: "7 > 10 is False, so the else branch runs." },
      { q: "How many times does  for i in range(4):  loop?", choices: ["3", "4", "5", "Forever"], answer: 1, explain: "range(4) is 0, 1, 2, 3: four values." },
      { q: "What does break do?", choices: ["Pauses the loop", "Skips one round", "Ends the loop immediately", "Restarts the loop"], answer: 2, explain: "break exits the loop right away. continue skips one round." },
      { q: "What prints?  n = 0\nwhile n < 3:\n    n = n + 1\nprint(n)", choices: ["0", "2", "3", "Loops forever"], answer: 2, explain: "n goes 1, 2, 3. At 3 the condition is False, and 3 prints." },
      { q: "len(\"hey\") is...", choices: ["2", "3", "\"hey\"", "Error"], answer: 1, explain: "len counts characters: h, e, y." },
      { type: "code", q: "Use a for loop to print the numbers 0, 1 and 2, each on its own line.", expectedOutput: "0\n1\n2", explain: "for i in range(3): then an indented print(i)." },
      { type: "code", q: "With temp = 95, print \"Hot\" if temp is above 80, otherwise print \"Fine\".", expectedOutput: "Hot", explain: "if temp > 80: print(\"Hot\") else: print(\"Fine\"). 95 > 80, so Hot." },
      { type: "code", q: "Use a while loop to print 5, 4, 3, 2, 1 (count down), each on its own line.", expectedOutput: "5\n4\n3\n2\n1", explain: "n = 5, while n > 0: print(n) and n = n - 1 inside the loop." },
    ],
  },
];

// Order inside a module: every module opens with a CODING lesson (nobody's
// first lesson should be a reading), and each reading comes right after
// the coding lesson on the same topic, as a deeper dive.
for (const m of MODULES) {
  const ordered = [], waiting = [];
  for (const l of m.lessons) {
    if (l.type === "read") waiting.push(l);
    else { ordered.push(l); ordered.push(...waiting.splice(0)); }
  }
  m.lessons = [...ordered, ...waiting];
}

// Flat list of lessons, with module info attached, for navigation
const LESSONS = MODULES.flatMap((m, mi) =>
  m.lessons.map((l, li) => ({ ...l, moduleId: m.id, moduleIndex: mi, lessonIndex: li, number: `${mi + 1}.${li + 1}` }))
);
