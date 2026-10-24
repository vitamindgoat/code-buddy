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

   A module: { id, title, blurb, lessons: [...], quizBank: { draw, questions } }

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
                 or { type: "code", q, expectedOutput, explain, inputs? }
   quizBank.draw = { mc, code }: how many of each kind one attempt asks.
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
          { title: "Computers are fast, not smart", say: "Computers are fast, not smart. They need precise instructions in the right order.", text: "A computer does **exactly what it's told**, billions of times a second. It never guesses.\nSo instructions must be **precise** and in the **right order**.", visual: { type: "flow", steps: ["Start", "Get a slice of bread", "Spread the peanut butter", "Eat", "End"] } },
          { title: "That list has a name", say: "A step-by-step list of instructions is called an algorithm.", text: "A step-by-step list of instructions is an **algorithm**.\nA recipe is one. Directions to school are one. A **program is an algorithm** written in a language the computer understands.", visual: { type: "compare", a: { title: "Recipe", lines: ["Crack 2 eggs", "Whisk", "Cook 3 min"] }, b: { title: "Program", lines: ['eggs = 2', 'whisk()', 'cook(3)'] } } },
          { title: "Planning first", say: "Plan first: a flowchart or pseudocode lays out the steps before you code.", text: "Plan before you code.\nA **flowchart** draws the steps as boxes and arrows. **Pseudocode** writes them in plain English.\nBoth answer: what happens **first, next, last**?", visual: { type: "flow", steps: ["start", "output: ask for name", "input: name", "process: build greeting", "output: greeting", "end"] } },
          { title: "Order matters", say: "Order matters. That's called sequencing.", text: "Swap two steps and it all goes wrong. Shoes, THEN socks?\nThe computer won't notice. The **order of steps** is called **sequencing**, and it's the first skill of programming.", checks: [{"q": "What is an algorithm?", "choices": ["A kind of computer", "A step-by-step list of instructions", "A programming language", "A bug in the code"], "answer": 1, "explain": "Recipes, directions, programs: all algorithms. Steps, in order."}, {"q": "Why do computers need such precise instructions?", "choices": ["They are slow", "They never guess, they only follow what they're told", "They can't do math", "They only understand English"], "answer": 1, "explain": "A computer does exactly what it's told, nothing more. It never fills in the gaps."}, {"q": "A flowchart and pseudocode are both ways to...", "choices": ["Run a program faster", "Plan the steps before writing code", "Fix bugs automatically", "Draw pictures of computers"], "answer": 1, "explain": "Both show the steps and their order before any real code is typed."}, {"q": "Putting on shoes before socks goes wrong because of...", "choices": ["Spelling", "Sequencing: the order of the steps", "The computer's speed", "Too many steps"], "answer": 1, "explain": "Same steps, wrong order, wrong result. Order matters."}, {"q": "A program is...", "choices": ["An algorithm written in a language a computer can run", "Any list of steps, like a recipe", "The computer's hardware", "A drawing of the steps, like a flowchart"], "answer": 0, "explain": "A recipe is an algorithm and a flowchart is a plan. A program is that plan written in code, so a computer can run it."}] },
        ],
      },
      {
        id: "m1-steps",
        title: "Programs are steps",
        why: "Every app you use is just a long list of steps like this. Learning to think in steps is the real skill.",
        intro: "An *algorithm* is a list of steps in order. A program is an algorithm the computer can follow. Order matters!",
        steps: [
          {
            code: 'print("Wake up")',
            parts: [
              { text: "print", more: "The name comes from old printers: it \"printed\" output on paper. Today it just shows text.", say: "Every step in this program is a print, so let's start by typing print.", explain: "`print` is a *function*: a command that does one job.\nIts job is showing text on the screen." },
              { text: '("Wake up")', more: "Forget a quote and Python will think the words are code and get confused.", say: "Now give it the first step of the morning: the words, in quotes, inside the parentheses.", explain: "The ( ) hold what you give the function.\nQuotes mean \"these are words, not code.\"" },
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
        checkpoints: [{"after": 0, "output": "Wake up", "say": "See? Wake up printed on its own line. One print, one line of output."}, {"after": 1, "output": "Wake up\nBrush teeth", "say": "Two prints, two lines, in the order you wrote them."}, {"after": 2, "output": "Wake up\nBrush teeth\nGo to school"}],
        expectedOutput: "Wake up\nBrush teeth\nGo to school",
        done: "That's an algorithm: steps, in order, that the computer follows exactly.",
        practice: {
          task: "Print the numbers 1, 2 and 3, one per line. Numbers don't need quotes.",
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
          { title: "One switch, two states", say: "A computer is billions of switches. Each one is a bit: off is 0, on is 1.", text: "A computer is billions of tiny **switches**, each OFF or ON.\nOFF is **0**, ON is **1**. One switch is one **bit**.", visual: { type: "bits", value: "1" , labels: false } },
          { title: "Place values", say: "In binary, each place is worth twice the one before: 1, 2, 4, 8.", text: "Normal numbers: each place is worth **10×** more (ones, tens, hundreds).\n**Binary**: each place is worth **2×** more: **1, 2, 4, 8**.\nA 1 means \"count this place\", a 0 means \"skip it\".", visual: { type: "bits", value: "0101" } },
          { title: "Reading 101", say: "101 is four plus one, so it's five.", text: "**101** = a 1 in the fours place, 0 in the twos, 1 in the ones.\n**4 + 1 = 5**. So 101 is five.", visual: { type: "bits", value: "101" } },
          { title: "Writing a number in binary", say: "To write a number in binary, take the biggest place that fits, then what's left.", text: "Going the other way: write **6** in binary.\nPlaces are 8, 4, 2, 1. Does 8 fit in 6? No, so **0**. Does 4 fit? Yes, **1**, and 2 is left. Does 2 fit? Yes, **1**, 0 left. Does 1 fit? No, **0**.\nSo 6 is **0110**, or just **110**.", visual: { type: "bits", value: "0110" } },
          { title: "Bigger numbers, more bits", say: "8 bits make a byte, and everything on a computer is stored as bytes.", text: "**8 bits = 1 byte**, enough for 0 to 255. One letter is one byte. A photo is millions.\n**Every** number, letter, color and sound is stored as bits.", checks: [{"q": "What number is 110 in binary?", "choices": ["3", "6", "110", "12"], "answer": 1, "explain": "4 + 2 + 0 = 6. The fours and twos places are on, the ones place is off."}, {"q": "One bit can be...", "choices": ["0 or 1", "Any number", "A letter", "0 to 9"], "answer": 0, "explain": "A bit is one switch: off (0) or on (1)."}, {"q": "In binary, the place values from the right are...", "choices": ["1, 10, 100", "1, 2, 4, 8", "2, 4, 6, 8", "1, 3, 5, 7"], "answer": 1, "explain": "Each place is worth twice the one before it."}, {"q": "What is 101 in binary as a normal number?", "choices": ["101", "3", "5", "6"], "answer": 2, "explain": "4 + 0 + 1 = 5."}, {"q": "How many bits are in a byte?", "choices": ["2", "4", "8", "10"], "answer": 2, "explain": "8 bits make one byte, enough for 0 to 255."}, {"q": "What is 11 in binary as a normal number?", "choices": ["11", "2", "3", "4"], "answer": 2, "explain": "2 + 1 = 3."}] },
        ],
      },
      {
        id: "m1-binary",
        title: "Binary",
        why: "Everything in a computer, from photos to songs, is stored as 1s and 0s. Seeing a number in binary makes that real.",
        intro: "Computers store everything as *bits*: 0s and 1s. The number 5 is 101 in binary. Python can show you.",
        steps: [
          {
            code: "number = 5",
            parts: [
              { text: "number", more: "A variable name can be anything that starts with a letter, but a name that says what's inside is easier to read later.", say: "First, make a variable called number to hold our value.", explain: "`number` is a *variable*: a name that remembers a value." },
              { text: "= 5", more: "One equals sign is \"store\". Two equals signs, later, will mean \"compare\".", say: "Now store the number 5 in it.", explain: "One `=` means \"store this.\"" },
            ],
          },
          {
            code: "print(bin(number))",
            parts: [
              { text: "print(", say: "Press Enter. Next we'll print something.", explain: "print shows whatever is inside the parentheses." },
              { text: "bin(number))", more: "There's also hex() for base 16 and oct() for base 8. Same idea, different place values.", say: "Now type bin, with number inside it. bin turns a number into binary.", explain: "`bin` is a function that converts to *binary*.\n5 becomes 0b101: the 0b just means \"this is binary.\"\n1·4 + 0·2 + 1·1 = 5." },
            ],
          },
        ],
        checkpoints: [{"after": 1, "output": "0b101"}],
        expectedOutput: "0b101",
        done: "101 is 4 + 0 + 1. Every number, letter and picture in a computer is bits like these.",
        practice: {
          task: "Use bin() to print the number 10 in binary.",
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
          { title: "Patterns save space", say: "Repeating patterns can be stored shorter. That's run-length encoding.", text: "A row of pixels: 0 0 0 0 0 0 0 0. Eight numbers.\nOr: \"**0, eight times**.\" Two numbers, same meaning.\nThat's **run-length encoding**: store the value once, plus the count.", visual: { type: "compare", a: { title: "Without encoding", lines: ["0 0 0 0 0 0 0 0", "1 1 1 1 1 1 1 1", "0 1 1 1 1 1 1 0"] }, b: { title: "Run-length encoded", lines: ["0 ×8", "1 ×8", "0 ×1  1 ×6  0 ×1"] } } },
          { title: "Entropy: how surprising is the data?", say: "Low entropy means lots of repetition, so it compresses well. Random data doesn't.", text: "Lots of repetition = predictable = **low entropy**. It **compresses well**.\nRandom data = no patterns = **high entropy**. Nothing to shrink.\nA blue sky compresses great. TV static barely at all.", visual: { type: "compare", a: { title: "Low entropy", lines: ["0000000000", "0000000000", "compresses well"] }, b: { title: "High entropy", lines: ["1001011010", "0110100101", "barely shrinks"] } } },
          { title: "Lossless vs lossy", say: "Lossless keeps every bit. Lossy throws away detail you won't miss.", text: "**Lossless** keeps every bit. Unzip and you get the **exact original**. Text and code use this.\n**Lossy** throws away detail you won't notice, to save **much more space**. JPEG photos and MP3 music use this.", visual: { type: "compare", a: { title: "Lossless (PNG, ZIP)", lines: ["exact copy", "smaller", "text, code, logos"] }, b: { title: "Lossy (JPEG, MP3)", lines: ["close copy", "much smaller", "photos, music, video"] } } },
          { title: "Check", text: "Photos, music, text: all of it gets squeezed to save space. The question is whether anything gets lost.", checks: [{"q": "A photo app shrinks a picture from 4 MB to 400 KB. Up close, a few fine details are blurrier than the original. Which kind of compression is that?", "choices": ["Lossless", "Lossy", "Run-length only", "No compression"], "answer": 1, "explain": "Big savings and some detail is gone for good: that's lossy, like JPEG."}, {"q": "You zip a folder of code, then unzip it and every file is exactly the same. Which kind of compression is that?", "choices": ["Lossy", "Lossless", "Entropy", "Neither"], "answer": 1, "explain": "Nothing was lost: lossless. Text and code always use this."}, {"q": "Which data compresses best?", "choices": ["Random noise", "A row of 500 identical pixels", "A password", "A photo of static"], "answer": 1, "explain": "Repetition is a pattern, and patterns can be stored shorter. Low entropy compresses well."}, {"q": "How would run-length encoding store AAAAABB?", "choices": ["5A 2B", "AB", "AAAAABB", "7"], "answer": 0, "explain": "A count plus a value for each run: five A's, then two B's."}, {"q": "Data with high entropy...", "choices": ["Has lots of repetition, so it compresses well", "Is random, so it barely compresses", "Has already been compressed with a lossy format", "Is always smaller than low-entropy data"], "answer": 1, "explain": "High entropy means unpredictable: no patterns to shrink."}] },
        ],
      },
      {
        id: "m1-compression",
        title: "Patterns and compression",
        why: "Compression is why a movie fits on your phone. It all starts with spotting repeats.",
        intro: "Computers save space by finding *patterns*. Instead of storing 00000000, store \"0, eight times.\" That's run-length encoding.",
        steps: [
          {
            code: 'print("0" * 8)',
            parts: [
              { text: 'print("0"', say: "Start by printing a single character: the string zero.", explain: "A *string* is text in quotes. Even one character counts." },
              { text: " * 8)",more: "This only works for strings and numbers. \"ab\" * 3 is \"ababab\"; 2 * 3 is 6.", say: "Now multiply it by 8. On a string, the star means repeat.", explain: "`*` on a string means *repeat*.\n\"0\" * 8 is 0 eight times: the computer only stores the pattern." },
            ],
          },
          {
            code: 'print("01" * 4)',
            parts: [
              { text: 'print("01" * 4)', say: "Press Enter. Patterns can be longer than one character, so let's repeat zero-one four times.", explain: "\"01\" repeated 4 times gives 8 characters.\nLow *entropy* (lots of repetition) compresses well." },
            ],
          },
        ],
        checkpoints: [{"after": 0, "output": "00000000", "say": "Eight zeros, but you only typed one. The star repeated it."}, {"after": 1, "output": "00000000\n01010101"}],
        expectedOutput: "00000000\n01010101",
        done: "Repetition is the secret of compression. Random data has no pattern, so it can't shrink.",
        practice: {
          task: "Use the star to print \"ab\" five times on one line.",
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
          { title: "AND", say: "An AND gate outputs 1 only when both inputs are 1.", text: "An **AND gate**: two inputs, one output. Output is 1 only when **BOTH** inputs are 1.\nLike a door with two locks: you need both keys.", visual: { type: "gates", gate: "AND" } },
          { title: "OR", say: "An OR gate outputs 1 when at least one input is 1.", text: "An **OR gate** outputs 1 when **AT LEAST ONE** input is 1.\nLike two light switches for one lamp: either one works.", visual: { type: "gates", gate: "OR" } },
          { title: "NOT", say: "A NOT gate flips its input. A truth table lists every case.", text: "A **NOT gate** has one input and **flips** it: 1 → 0, 0 → 1.\nA **truth table** lists every input with its output. In Python these are **and, or, not**.", visual: { type: "gates", gate: "NOT" } },
          { title: "Check", text: "Gates are wired together by the billions to build a processor. Every calculation your phone does is gates.", checks: [{"q": "Which inputs make an AND gate output 1?", "choices": ["A = 0, B = 0", "A = 0, B = 1", "A = 1, B = 0", "A = 1, B = 1"], "answer": 3, "explain": "AND needs BOTH inputs on. Only the 1, 1 row gives 1."}, {"q": "Which inputs make an OR gate output 0?", "choices": ["A = 0, B = 0", "A = 0, B = 1", "A = 1, B = 0", "A = 1, B = 1"], "answer": 0, "explain": "OR only needs ONE input on to output 1, so 0 needs both inputs off."}, {"q": "A NOT gate's output is 1. What was its input?", "choices": ["0", "1", "Either one: NOT keeps the input the same", "Can't tell: NOT needs two inputs"], "answer": 0, "explain": "NOT has one input and flips it. An output of 1 means the input was 0."}, {"q": "Which gate outputs 1 only when both inputs are 1?", "choices": ["OR", "NOT", "AND", "All of them"], "answer": 2, "explain": "Both keys needed: AND."}, {"q": "A table that lists every input and its output is called a...", "choices": ["Flowchart", "Truth table", "Byte", "Gate map"], "answer": 1, "explain": "A truth table shows every case."}, {"q": "A lamp has two switches wired like an OR gate. Both switches are off. Is the lamp on?", "choices": ["Off: OR needs at least one input on", "On: one switch is always enough", "On: OR always outputs 1", "Off: OR needs both switches on"], "answer": 0, "explain": "OR outputs 1 when at least one input is 1. Both are 0, so the lamp is off. (Turning on just one switch would light it.)"}] },
        ],
      },
      {
        id: "m1-logic",
        title: "Logic gates",
        why: "and, or and not are how programs make decisions. You'll use them in every if statement later.",
        intro: "Chips are built from *logic gates*. AND gives True only if both inputs are True. OR gives True if either is. NOT flips it.",
        steps: [
          {
            code: "print(True and False)",
            parts: [
              { text: "print(True", more: "True and False are their own type in Python: bool, short for boolean, named after George Boole.", say: "Let's print True. True and False are *booleans*: yes or no values.", explain: "`True` is a *boolean*. Capital T! Python is picky." },
              { text: " and False)",more: "Python stops early: if the left side of an and is False, it doesn't even look at the right side.", say: "Now add and False. This works like an AND gate: both sides must be True.", explain: "`and` is an AND gate.\nTrue and False is False, because they're not BOTH true." },
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
        checkpoints: [{"after": 0, "output": "False", "say": "False: both sides weren't True, so the AND gate says no."}, {"after": 1, "output": "False\nTrue", "say": "True this time: with or, one True side is enough."}, {"after": 2, "output": "False\nTrue\nFalse"}],
        expectedOutput: "False\nTrue\nFalse",
        done: "You just wrote a truth table. Every decision a computer makes is built from gates like these.",
        practice: {
          task: "Use the gates to make the output below: line 1 must print True and line 2 must print False. Any mix of and / or / not works, as long as each line uses a gate (not just print(True)).",
          solution: ["print(True and True)", "print(False or False)"],
          expectedOutput: "True\nFalse",
          hints: ["Which gate gives True only when both sides are True? What two inputs would make it True?", "For False: what does or give when both sides are False? What does not give for True?", "Which two values need a capital first letter here?"],
        },
      },
    ],
    // The quiz draws from this bank: `draw` says how many of each kind are
    // asked per attempt (multiple choice stays a little ahead of coding).
    // A retake never repeats a question from the previous attempt.
    quizBank: {
      draw: { mc: 6, code: 4 },
      questions: [
        { q: "Which of these is an algorithm?", choices: ["A recipe: boil water, add the pasta, wait 10 minutes, drain", "A photo of a finished cake", "A list of your favorite foods", "The word \"delicious\""], answer: 0, explain: "An algorithm is steps done in a set order. The recipe is steps; a list of favorite foods is a list, but not steps to follow." },
        { q: "Which of these is pseudocode?", choices: ["ask for the name, then say hello", "print(\"hello\")", "01101000", "AND"], answer: 0, explain: "Pseudocode is the plan written in plain English, before any real code." },
        { q: "What is 5 written in binary?", choices: ["11", "101", "110", "1001"], answer: 1, explain: "101 = 4 + 0 + 1 = 5." },
        { q: "What is 7 written in binary?", choices: ["111", "101", "110", "1000"], answer: 0, explain: "111 = 4 + 2 + 1 = 7. Every place is on." },
        { q: "The binary number 1010 equals which normal number?", choices: ["1010", "5", "10", "12"], answer: 2, explain: "8 + 0 + 2 + 0 = 10. The eights and twos places are on." },
        { q: "How many different values can one byte hold?", choices: ["8", "2", "256", "100"], answer: 2, explain: "8 bits, each 0 or 1, make 256 combinations: 0 to 255." },
        { q: "A row of pixels is WWWWWWBBB (6 white, then 3 black). What does run-length encoding store?", choices: ["6W 3B", "WB", "WWWWWWBBB", "9"], answer: 0, explain: "Each run becomes a count plus a value: 6 W's, then 3 B's. \"WB\" or \"9\" would lose what you need to rebuild the row." },
        { q: "Data that's random and unpredictable, like TV static, has...", choices: ["Low entropy, so it compresses well", "High entropy, so it barely compresses", "Low entropy, so it barely compresses", "High entropy, so it compresses well"], answer: 1, explain: "Compression needs patterns to shrink. Random data has no patterns, which is what high entropy means." },
        { q: "You save a photo as a JPEG. The file gets 10 times smaller, but zoomed in it looks a little blurry. What happened?", choices: ["Lossy compression threw away detail you usually can't notice", "Lossless compression kept every pixel exactly", "The photo was turned into binary for the first time", "The photo got higher entropy, so it grew"], answer: 0, explain: "Much smaller AND some detail gone for good: that's lossy. Lossless (PNG, ZIP) would rebuild every pixel exactly." },
        { q: "Which file format keeps an exact copy (lossless)?", choices: ["JPEG photo", "MP3 song", "PNG image", "Streamed video"], answer: 2, explain: "PNG and ZIP are lossless: unpack and every bit is the original. JPEG and MP3 are lossy." },
        { q: "What does print(\"ab\" * 3) show?", choices: ["ababab", "ab3", "ab ab ab", "Error"], answer: 0, explain: "The star repeats a string: ab three times with nothing between." },
        { q: "Which inputs make an AND gate output 1?", choices: ["A = 0, B = 0", "A = 0, B = 1", "A = 1, B = 0", "A = 1, B = 1"], answer: 3, explain: "AND only outputs 1 when both inputs are 1. That's 1 row out of the 4 in its truth table." },
        { q: "Which inputs make an OR gate output 0?", choices: ["A = 0, B = 0", "A = 0, B = 1", "A = 1, B = 0", "A = 1, B = 1"], answer: 0, explain: "OR outputs 1 if at least one input is 1, so the only way to get 0 is with both inputs off." },
        { q: "Which line works like an OR gate?", choices: ["print(True and False)", "print(True or False)", "print(not True)", "print(True + False)"], answer: 1, explain: "or gives True when at least one side is True, exactly like an OR gate." },
        { q: "Which spelling does Python accept for a boolean?", choices: ["true", "True", "TRUE", "\"True\""], answer: 1, explain: "Capital T, no quotes: True is a boolean, \"True\" would be a string." },
        { type: "code", q: "Use bin() to print 13 in binary. (Python shows binary with 0b in front, that's expected.)", expectedOutput: "0b1101", explain: "print(bin(13)) gives 0b1101: 8 + 4 + 0 + 1." },
        { type: "code", q: "Use bin() to print 9 in binary.", expectedOutput: "0b1001", explain: "print(bin(9)) gives 0b1001: 8 + 0 + 0 + 1." },
        { type: "code", q: "Store 12 in a variable called number, then print it in binary with bin().", expectedOutput: "0b1100", explain: "number = 12, then print(bin(number)): 8 + 4 = 12, so 0b1100." },
        { type: "code", q: "A compressed file says: the pattern \"10\", 4 times in a row. Use the * to print what it decompresses to.", expectedOutput: "10101010", explain: "print(\"10\" * 4). The * rebuilds the repeats from one pattern and a count." },
        { type: "code", q: "Print the letter x six times on one line, using the star instead of typing it six times.", expectedOutput: "xxxxxx", explain: "print(\"x\" * 6). One pattern, one count: that's the idea behind compression." },
        { type: "code", q: "Print these three steps in this order, one per line: Open the fridge, Take the milk, Pour a glass.", expectedOutput: "Open the fridge\nTake the milk\nPour a glass", explain: "Three prints, top to bottom. The order of the lines is the order of the output: sequencing." },
        { type: "code", q: "Print the result of True and True on the first line, then not True on the second line.", expectedOutput: "True\nFalse", explain: "print(True and True) is True (both on). print(not True) flips it to False." },
        { type: "code", q: "Print the result of False or True.", expectedOutput: "True", explain: "print(False or True): an OR gate only needs one True side." },
        { q: "In the truth table for a 2-input OR gate, how many of the 4 rows output 1?", choices: ["1", "2", "3", "4"], answer: 2, explain: "Only 0, 0 gives 0. The other three rows (0 1, 1 0, 1 1) all have at least one input on." },
        { q: "A game lets you in if you're a member OR you have a guest pass. Sam isn't a member but has a guest pass. What happens?", choices: ["Sam gets in: OR only needs one input to be true", "Sam is stopped: OR needs both inputs to be true", "Sam is stopped: not being a member makes the output 0", "Sam gets in only if he's also a member"], answer: 0, explain: "Member = 0, guest pass = 1. One input on is enough for OR, so the output is 1." },
      ],
    },
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
          { title: "Languages for computers", say: "A programming language is words people can write that a computer can translate into bits.", text: "Computers only understand bits. People don't want to write bits.\nA **programming language** is the middle: words a human writes, a computer translates.\n**Python** reads almost like English.", visual: { type: "code", code: 'print("Hello, world!")', output: "Hello, world!" } },
          { title: "The console", say: "When a program prints, the text shows up in the console.", text: "When a program **prints**, the text appears in the **console**, a plain text window. In CodeBuddy that's the **Output** box.\nThe console is how your program talks to you.", visual: { type: "code", code: 'print("Hi")\nprint("Bye")', output: "Hi\nBye" } },
          { title: "Comments are for humans", say: "A line starting with a hash is a comment. Python skips it; it's for humans.", text: "A line starting with **#** is a **comment**. Python **skips it** completely.\nComments explain your code to people, including future you.", visual: { type: "code", code: "# Say hello twice\nprint(\"Hello\")\nprint(\"Hello\")", output: "Hello\nHello" } },
          { title: "Check", text: "Here's a tiny program. Think about what the console will show.", visual: { type: "code", code: "# print(\"one\")\nprint(\"two\")", output: null }, checks: [{"q": "What does this program print?\n# print(\"one\")\nprint(\"two\")", "choices": ["one", "two", "one and two", "Nothing"], "answer": 1, "explain": "The first line is a comment, so Python skips it. Only two prints."}, {"q": "What does this program print?\nprint(\"hi\")\n# print(\"bye\")", "choices": ["hi", "bye", "hi and bye", "Nothing"], "answer": 0, "explain": "The second line is a comment. Only hi prints."}, {"q": "Where does printed text show up?", "choices": ["In the code editor", "In the console", "In a comment", "On the keyboard"], "answer": 1, "explain": "The console is the plain text window where output appears."}, {"q": "A line starting with # is...", "choices": ["An error", "A comment Python skips", "A print", "A variable"], "answer": 1, "explain": "Comments are notes for humans. Python ignores them."}, {"q": "Why do programmers write comments?", "choices": ["To make the program faster", "To explain the code to people", "Python requires them", "To print text"], "answer": 1, "explain": "Comments explain what the code does, for you and for others."}] },
        ],
      },
      {
        id: "m2-output",
        title: "Output and comments",
        why: "print is how your program talks to you. Comments are how you talk to future you.",
        intro: "Programs talk to you through *console output*. Comments are notes for humans that Python skips.",
        steps: [
          {
            code: "# My first program",
            parts: [
              { text: "#", more: "Everything after the # on that line is ignored, even if it looks like code.", say: "Let's start with a comment. A comment starts with a hash symbol.", explain: "`#` starts a *comment*.\nPython ignores everything after it on that line." },
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
        checkpoints: [{"after": 1, "output": "Hello, world!", "say": "Hello, world! printed, and the comment line printed nothing at all."}, {"after": 2, "output": "Hello, world!\nCSP is fun."}],
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
        why: "Real text has line breaks and quote marks. Escapes let you put them inside a string.",
        intro: "Some characters are hard to type inside quotes. An *escape sequence* starts with a backslash: \\n is a new line, \\\" is a quote mark.",
        steps: [
          {
            code: 'print("Line one\\nLine two")',
            parts: [
              { text: 'print("Line one', say: "Start a print with the text Line one, but don't close the quote yet.", explain: "So far it's ordinary text." },
              { text: '\\nLine two")',more: "The backslash is an escape character: it says \"the next letter means something special\".", say: "Now type backslash n, then Line two. Backslash n means new line, right inside the string.", explain: "`\\n` is an *escape sequence*.\nOne print, two lines of output." },
            ],
          },
          {
            code: 'print("She said \\"hi\\"")',
            parts: [
              { text: 'print("She said \\"hi\\"")', say: "Press Enter. To print an actual quote mark, put a backslash right in front of it.", explain: "`\\\"` prints a real quote mark\ninstead of ending the string." },
            ],
          },
        ],
        checkpoints: [{"after": 0, "output": "Line one\nLine two", "say": "One print, two lines. The backslash n split it."}, {"after": 1, "output": "Line one\nLine two\nShe said \"hi\""}],
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
          { title: "Four types to know", say: "Four types: int, float, str, and bool.", text: "**int**: whole numbers, like 15 or -3.\n**float**: decimals, like 3.14 or 2.0.\n**str**: text in quotes, like \"hello\".\n**bool**: True or False.", visual: { type: "table", head: ["Value", "Type"], rows: [["15", "int"], ["3.14", "float"], ['"hello"', "str"], ["True", "bool"]] } },
          { title: "Why it matters", say: "Quote 5 unquote is text. 5 is a number. They are not the same.", text: "**\"5\" and 5 are not the same.** \"5\" is text; 5 is a number.\n\"5\" + \"5\" is **\"55\"** (text joined). 5 + 5 is **10**.", visual: { type: "code", code: 'print("5" + "5")\nprint(5 + 5)', output: "55\n10" } },
          { title: "Naming variables", say: "A variable is a name that holds a value. Good names say what's inside.", text: "A **variable** is a name that holds a value. Good names say what's inside: score, player_name, is_raining.\nRules: **lowercase**, words joined with **underscores**, no spaces, can't start with a number.", visual: { type: "table", head: ["Name", "OK?"], rows: [["score", "✓"], ["player_name", "✓"], ["2fast", "✗ starts with a number"], ["my score", "✗ has a space"]] } },
          { title: "Check", text: "Look at the value and pick its type.", checks: [{"q": "What type is 2.5?", "choices": ["int", "float", "str", "bool"], "answer": 1, "explain": "Anything with a decimal point is a float."}, {"q": "What type is \"15\"?", "choices": ["int", "float", "str", "bool"], "answer": 2, "explain": "It's in quotes, so it's text: a string."}, {"q": "What type is 15?", "choices": ["int", "float", "str", "bool"], "answer": 0, "explain": "A whole number with no quotes is an int."}, {"q": "What type is True?", "choices": ["int", "float", "str", "bool"], "answer": 3, "explain": "True and False are booleans."}, {"q": "What is \"5\" + \"5\"?", "choices": ["10", "\"55\"", "Error", "5"], "answer": 1, "explain": "Both are text, so + joins them: \"55\"."}, {"q": "Which is a good variable name?", "choices": ["Player Name", "player_name", "1name", "name!"], "answer": 1, "explain": "Lowercase, words joined with underscores, no spaces."}] },
        ],
      },
      {
        id: "m2-variables",
        title: "Variables and data types",
        why: "Variables are how a program remembers things. Types decide what you can do with what it remembers.",
        intro: "A *variable* is a name that holds a value. Every value has a *type*: int (whole number), float (decimal), str (text), bool (True/False).",
        steps: [
          {
            code: 'name = "Gary"',
            parts: [
              { text: "name", more: "Python is case-sensitive: name and Name are two different variables.", say: "Let's make a variable called name. Variable names are lowercase and describe what they hold.", explain: "`name` is a *variable*.\nGood names say what's inside: name, age, score." },
              { text: ' = "Gary"',more: "Single quotes work too: 'Gary' and \"Gary\" are the same string.", say: "Now store some text in it, like the name Gary.", explain: "Text in quotes is a *string* (type str)." },
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
              { text: "print(type(name))", more: "type() is handy when a bug makes you wonder what a variable actually holds.", say: "Press Enter. Let's ask Python what type name is, using the type function.", explain: "`type` is a function that reports a value's *type*.\n<class 'str'> means string." },
            ],
          },
          {
            code: "print(type(age))",
            parts: [
              { text: "print(type(age))", say: "Press Enter. Now do the same for age.", explain: "<class 'int'> means integer." },
            ],
          },
        ],
        checkpoints: [{"after": 2, "output": "<class 'str'>", "say": "<class 'str'> means name holds a string."}, {"after": 3, "output": "<class 'str'>\n<class 'int'>"}],
        expectedOutput: "<class 'str'>\n<class 'int'>",
        done: "str, int, float, bool. Knowing the type tells you what you can do with a value.",
        practice: {
          task: "Make a variable called price that holds 2.5, then print what type it is using type().",
          solution: ["price = 2.5", "print(type(price))"],
          expectedOutput: "<class 'float'>",
          hints: ["Is 2.5 a whole number or a decimal? Which type is that?", "How do you store a value in a name, then look at its type?", "Which function reports a type, and what goes inside it?"],
        },
      },
      {
        id: "m2-operators",
        title: "Math operators",
        why: "Remainder and floor division show up everywhere: even/odd checks, clocks, splitting into groups.",
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
              { text: "print(7 % 3)", more: "A quick even/odd test: a number is even when number % 2 is 0.", say: "Press Enter. The percent sign is modulus: it gives you the remainder.", explain: "`%` is *modulus*.\n7 ÷ 3 is 2 remainder 1, so 7 % 3 is 1." },
            ],
          },
          {
            code: "print(7 // 3)",
            parts: [
              { text: "print(7 // 3)", more: "Floor division rounds DOWN, so -7 // 2 is -4, not -3.", say: "Press Enter. Two slashes is floor division: it throws away the decimal part.", explain: "`//` is *floor division*.\n7 ÷ 3 is 2.33, floor division keeps just the 2." },
            ],
          },
          {
            code: "print(7 / 2)",
            parts: [
              { text: "print(7 / 2)", say: "Press Enter. A single slash is regular division, which keeps the decimals.", explain: "A single `/` always gives a *float*, even 4 / 2 = 2.0." },
            ],
          },
        ],
        checkpoints: [{"after": 0, "output": "10", "say": "10, plain addition."}, {"after": 1, "output": "10\n1", "say": "1: that's the remainder of 7 divided by 3."}, {"after": 2, "output": "10\n1\n2", "say": "2: floor division threw away the .33."}, {"after": 3, "output": "10\n1\n2\n3.5"}],
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
          { title: "Same rules as math", say: "Python follows the same order of operations as math.", text: "Same as math: **parentheses** first, then **exponents**, then **× ÷ % //** (left to right), then **+ −** (left to right).\n2 + 3 * 4 is **14**, not 20.", visual: { type: "code", code: "print(2 + 3 * 4)\nprint((2 + 3) * 4)", output: "14\n20" } },
          { title: "When in doubt, parentheses", say: "When in doubt, add parentheses.", text: "Extra parentheses are never wrong. They make your intention **obvious**, to Python and to people.", visual: { type: "table", head: ["Expression", "Value"], rows: [["10 - 2 - 3", "5"], ["10 - (2 - 3)", "11"], ["8 / 2 * 2", "8.0"], ["8 / (2 * 2)", "2.0"]] } },
          { title: "Check", text: "Work it out before you click.", checks: [{"q": "What is 1 + 2 * 3?", "choices": ["9", "7", "6", "5"], "answer": 1, "explain": "Multiply first: 2 * 3 = 6. Then 1 + 6 = 7."}, {"q": "What is (1 + 2) * 3?", "choices": ["9", "7", "6", "5"], "answer": 0, "explain": "Parentheses first: 1 + 2 = 3. Then 3 * 3 = 9."}, {"q": "What is 10 - 4 - 3?", "choices": ["3", "9", "11", "-3"], "answer": 0, "explain": "Same level goes left to right: 10 - 4 = 6, then 6 - 3 = 3."}, {"q": "What is 2 + 8 / 4?", "choices": ["2.5", "4.0", "4", "5"], "answer": 1, "explain": "Divide first: 8 / 4 = 2.0. Then 2 + 2.0 = 4.0 (division gives a float)."}, {"q": "When you're not sure about the order, you should...", "choices": ["Guess", "Add parentheses", "Remove the operators", "Use a comment"], "answer": 1, "explain": "Parentheses make your intention obvious to Python and to people."}] },
        ],
      },
      {
        id: "m2-trace",
        title: "Tracing code",
        why: "Tracing is how you find bugs without running the code: you become the computer for a minute.",
        intro: "*Tracing* means following a program line by line and tracking what each variable holds. Here x changes four times.",
        steps: [
          { code: "x = 5", parts: [{ text: "x = 5", say: "Let's start a variable x at 5.", explain: "In a trace table: after line 1, x is 5." }] },
          {
            code: "x = x + 3",
            parts: [
              { text: "x = x + 3", more: "Right side first, always. That's why x = x + 3 isn't a math contradiction: it's an instruction.", say: "Press Enter. Now use the old x to make a new x: x equals x plus 3.", explain: "Python computes the right side first (5 + 3 = 8),\nthen stores it. x is 8." },
            ],
          },
          { code: "x = x * 2", parts: [{ text: "x = x * 2", say: "Press Enter. Now double it.", explain: "8 * 2 = 16. x is 16." }] },
          { code: "x = x - 4", parts: [{ text: "x = x - 4", say: "Press Enter. Now take away 4.", explain: "16 - 4 = 12. x is 12." }] },
          { code: "print(x)", parts: [{ text: "print(x)", say: "Press Enter. Finally, print x to show the final value.", explain: "Only the last value prints. Did your trace say 12?" }] },
        ],
        checkpoints: [{"after": 4, "output": "12"}],
        expectedOutput: "12",
        done: "Tracing is how you find bugs: pretend to be the computer and track every variable.",
        practice: {
          task: "Start y at 10, floor-divide it by 3, then multiply it by itself, then print y. Before you press Run, trace it in your head: do you get the number below?",
          solution: ["y = 10", "y = y // 3", "y = y * y", "print(y)"],
          expectedOutput: "9",
          hints: ["How do you change a variable using its own old value?", "Which operator keeps only the whole part of a division?", "How do you multiply y by itself? (No new function needed.)"],
        },
      },
      {
        id: "m2-fstrings",
        title: "Fancy output (f-strings)",
        why: "f-strings are the clean way to mix words and values. Most real Python output uses them.",
        intro: "An *f-string* lets you drop variables straight into text with { }. Put an f before the opening quote.",
        steps: [
          { code: 'name = "GARY THE SNAIL"', parts: [{ text: 'name = "GARY THE SNAIL"', say: "First, a string variable called name.", explain: "name holds the text." }] },
          {
            code: 'print(f"Hi {name}!")',
            parts: [
              { text: 'print(f"', more: "The f stands for \"formatted\". Older code used + or .format() to do the same thing.", say: "Press Enter. Now type print, then an f right before the quote. That f is the magic.", explain: "`f\"` starts an *f-string*: a string that can hold variables." },
              { text: 'Hi {name}!")', more: "Anything inside the braces is real Python: {name.upper()} would shout it.", say: "Now write Hi, then name inside curly braces. The braces pull in the variable.", explain: "`{name}` is replaced by what name holds.\nNo + signs, no str()." },
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
        checkpoints: [{"after": 1, "output": "Hi GARY THE SNAIL!", "say": "The curly braces got swapped for the name. No plus signs needed."}, {"after": 3, "output": "Hi GARY THE SNAIL!\n50 * 2 = 100"}],
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
        why: "Programs get interesting when they react to a person. input is the first way to do that.",
        intro: "input() shows a prompt, pauses, and waits for the user to type.",
        inputs: ["Gary"],
        steps: [
          {
            code: 'name = input("What is your name? ")',
            parts: [
              { text: "name = ", say: "Let's make a variable called name to store what the user types.", explain: "The answer goes into the variable name." },
              { text: 'input("What is your name? ")', more: "The space at the end of the prompt keeps the cursor from touching the question.", say: "Now type input with a question inside. input shows the question and waits for an answer.", explain: "`input` is a function that *pauses* the program.\nWhatever the user types comes back as a *string*." },
            ],
          },
          {
            code: 'print("Hi " + name + "!")',
            parts: [
              { text: 'print("Hi " + name + "!")', say: "Press Enter. Now greet them. The plus sign joins strings together.", explain: "`+` on strings *joins* them.\n\"Hi \" + \"Gary\" + \"!\" becomes Hi Gary!" },
            ],
          },
        ],
        checkpoints: [{"after": 1, "output": "What is your name? Gary\nHi Gary!"}],
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
        why: "Mixing up text and numbers is the number one beginner bug. Casting fixes it on purpose.",
        intro: "input() always gives back text, even when the user types a number. Let's break that on purpose, then fix it with *casting*.",
        inputs: ["12"],
        steps: [
          {
            code: 'age = input("How old are you? ")',
            parts: [
              { text: "age = ", say: "Let's ask for the user's age and store it in a variable called age.", explain: "The answer will go into age." },
              { text: 'input("How old are you? ")', say: "Now the input with the question inside.", explain: "Whatever the user types comes back as a *string*, even 12." },
            ],
          },
          {
            code: "print(int(age) + 1)",
            bug: {
              code: "print(age + 1)",
              parts: [{ text: "print(age + 1)", say: "Press Enter. Now try some math: print age plus 1. Looks fine, right?", explain: "We're adding 1 to age. But remember what type age is..." }],
              explain: "TypeError: can only concatenate str (not \"int\") to str. age is the TEXT \"12\", not the number 12, so Python can't add 1 to it.",
              fix: "Wrap age in int( ) to *cast* the text into a real number. Change the line to:",
            },
            parts: [
              { text: "print(int(age) + 1)", more: "If the user types something that isn't a number, int() raises a ValueError. Real programs check first.", say: "Now wrap age in int, so the text becomes a number before the plus.", explain: "`int` *casts* text to a whole number. int(\"12\") is 12, so 12 + 1 works." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*age\s*\+/, say: "That still adds 1 to text. Put int( ) around age." }],
          },
        ],
        checkpoints: [{ after: 1, error: "TypeError" }, { after: 1, output: "How old are you? 12\n13" }],
        expectedOutput: "How old are you? 12\n13",
        done: "That crash was a runtime error: the code read fine, then broke while running. Casting fixed it. (If the user types \"twelve\", int() crashes too!)",
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
          { title: "Syntax errors", say: "A syntax error means Python can't even read the line.", text: "**Syntax error**: Python can't even read the line. A missing parenthesis, a typo, a forgotten colon.\nThe program **never starts**. Python points at where it got confused.", visual: { type: "code", code: 'print("hi"', output: "SyntaxError: '(' was never closed" } },
          { title: "Runtime errors", say: "A runtime error means the code broke while it was running.", text: "**Runtime error**: the code reads fine, but **breaks while running**. Dividing by zero. A variable that doesn't exist. Text plus a number.\nThe program **crashes partway**.", visual: { type: "code", code: 'print("Age: " + 15)', output: "TypeError: can only concatenate str (not \"int\") to str" } },
          { title: "Logic errors", say: "A logic error means it runs fine, but the answer is wrong.", text: "**Logic error**: the sneakiest. **No error message**, but the **answer is wrong**.\nYou wanted the average but divided by the wrong number. Only testing finds these.", visual: { type: "code", code: "total = 10 + 20\naverage = total / 3\nprint(average)", output: "10.0   (should be 15.0)" } },
          { title: "Reading a traceback", say: "When Python crashes, read the last line of the traceback first.", text: "When Python crashes it prints a **traceback**. Read the **last line first**: it names the error. Then find the **line number** above it.\nCodeBuddy highlights that line for you.", checks: [{"q": "Your program runs, prints a number, no error message, but the number is wrong. Which kind of error?", "choices": ["Syntax", "Runtime", "Logic", "Traceback"], "answer": 2, "explain": "No crash, wrong answer: a logic error. Only testing catches it."}, {"q": "You forgot the closing parenthesis and the program never even starts. Which kind of error?", "choices": ["Syntax", "Runtime", "Logic", "Traceback"], "answer": 0, "explain": "Python can't read the line: a syntax error."}, {"q": "The program starts fine, then crashes when it divides by zero. Which kind of error?", "choices": ["Syntax", "Runtime", "Logic", "Comment"], "answer": 1, "explain": "It broke while running: a runtime error."}, {"q": "When Python crashes and prints a traceback, which line should you read first?", "choices": ["The first line", "The last line", "The middle", "None of it"], "answer": 1, "explain": "The last line names the error. Then look for the line number above it."}, {"q": "Which kind of error gives NO error message at all?", "choices": ["Syntax", "Runtime", "Logic", "All of them"], "answer": 2, "explain": "Logic errors run silently with a wrong answer."}] },
        ],
      },
      {
        id: "m2-errors",
        title: "Errors and str()",
        why: "You will see TypeError a lot. Knowing why it happens turns a scary message into a quick fix.",
        intro: "The opposite problem from last time: a number that needs to become text. Let's hit the error, read it, and fix it.",
        steps: [
          {
            code: "total = 2 + 2",
            parts: [{ text: "total = 2 + 2", say: "First, do some math and store it in total.", explain: "total holds the int 4." }],
          },
          {
            code: 'print("total is " + str(total))',
            bug: {
              code: 'print("total is " + total)',
              parts: [{ text: 'print("total is " + total)', say: "Press Enter. Now print the words total is, then a plus sign, then total.", explain: "+ joins two *strings*. But total is an int, not a string..." }],
              explain: "TypeError: can only concatenate str (not \"int\") to str. The plus can join text to text, but total is a number.",
              fix: "Wrap total in str( ) to turn the number into text. Change the line to:",
            },
            parts: [
              { text: 'print("total is " + str(total))', say: "Now wrap total in str, so the number becomes text before the plus.", explain: "`str` converts a value to a *string*. \"total is \" + \"4\" joins fine." },
            ],
            hints: [{ match: /\+\s*total\s*\)/, say: "That still joins text to a number. Put str( ) around total." }],
          },
        ],
        checkpoints: [{ after: 1, error: "TypeError" }, { after: 1, output: "total is 4" }],
        expectedOutput: "total is 4",
        done: "When you see a traceback, read the LAST line first: it names the error. Then look at the line number above it.",
        practice: {
          task: "With age = 15, use + and str() to print exactly: Age: 15",
          solution: ["age = 15", 'print("Age: " + str(age))'],
          expectedOutput: "Age: 15",
          hints: ["What happens when you + a string and a number?", "Which function turns a number into text?", "Where does str() go: around age, or around the whole thing?"],
        },
      },
    ],
    quizBank: {
      draw: { mc: 7, code: 4 },
      questions: [
        { q: "What does this program print?\n# print(\"one\")\nprint(\"two\")", choices: ["one", "two", "one and two", "Nothing"], answer: 1, explain: "The first line is a comment, so Python skips it." },
        { q: "What does print(\"a\\nb\") show?", choices: ["a\\nb on one line", "a on one line, b on the next", "anb", "Error"], answer: 1, explain: "\\n is the escape sequence for a new line." },
        { q: "What type is 2.5?", choices: ["int", "float", "str", "bool"], answer: 1, explain: "A number with a decimal point is a float." },
        { q: "What does type(\"15\") report?", choices: ["int", "float", "str", "bool"], answer: 2, explain: "Quotes make it a string, even if it looks like a number." },
        { q: "What does 7 % 3 give?", choices: ["2", "1", "2.33", "21"], answer: 1, explain: "% is the remainder: 7 divided by 3 is 2 with 1 left over." },
        { q: "What does 7 // 2 give?", choices: ["3.5", "3", "4", "1"], answer: 1, explain: "// is floor division: it drops the decimal part, so 3." },
        { q: "What does 2 + 3 * 4 give?", choices: ["20", "14", "24", "9"], answer: 1, explain: "Multiplication first: 3 * 4 = 12, then 2 + 12 = 14." },
        { q: "What prints?  x = 5\nx = x * 2\nx = x - 3\nprint(x)", choices: ["5", "7", "10", "3"], answer: 1, explain: "Trace it: 5, then 10, then 7." },
        { q: "With name = \"Ana\", what does print(f\"Hi {name}!\") show?", choices: ["Hi {name}!", "Hi Ana!", "Hi name!", "Error"], answer: 1, explain: "In an f-string, the curly braces are replaced by the variable's value." },
        { q: "input() always gives back a...", choices: ["int", "float", "str", "bool"], answer: 2, explain: "Whatever the user types comes back as a string. Cast it with int() if you need a number." },
        { q: "age = input(\"Age? \") and the user types 12. What does age + 1 do?", choices: ["Gives 13", "Gives 121", "Causes a TypeError", "Gives 12"], answer: 2, explain: "age is the string \"12\". A string plus a number is a TypeError; int(age) + 1 would give 13." },
        { q: "print(\"Score: \" + 10) is an example of a...", choices: ["Syntax error", "Runtime error (TypeError)", "Logic error", "Comment"], answer: 1, explain: "Python can't add a string and a number: it stops while running. str(10) fixes it." },
        { q: "A program runs without crashing but prints the wrong answer. That is a...", choices: ["Syntax error", "Runtime error", "Logic error", "Traceback"], answer: 2, explain: "Logic errors don't crash: the code runs, but the result is wrong." },
        { type: "code", q: "Using one print and an escape sequence, show Red on the first line and Blue on the second.", expectedOutput: "Red\nBlue", explain: "print(\"Red\\nBlue\"): the \\n starts a new line." },
        { type: "code", q: "Make a variable called price that holds 4.5, then print its type with type().", expectedOutput: "<class 'float'>", explain: "price = 4.5, then print(type(price)). A decimal number is a float." },
        { type: "code", q: "Print 20 % 6 on the first line and 20 // 6 on the second.", expectedOutput: "2\n3", explain: "20 % 6 is the remainder 2; 20 // 6 drops the decimal and gives 3." },
        { type: "code", q: "With score = 8, use an f-string to print exactly: Score: 8 out of 10", expectedOutput: "Score: 8 out of 10", explain: "print(f\"Score: {score} out of 10\"). The braces drop the value in." },
        { type: "code", q: "Ask \"Name? \" with input(), then print \"Hello, \" followed by the answer and \"!\".", inputs: ["Sam"], expectedOutput: "Name? Sam\nHello, Sam!", explain: "name = input(\"Name? \") then print(\"Hello, \" + name + \"!\")." },
        { type: "code", q: "Ask \"Number? \", cast the answer to int, and print it doubled.", inputs: ["21"], expectedOutput: "Number? 21\n42", explain: "n = int(input(\"Number? \")) then print(n * 2). Without int() you'd get 2121." },
        { type: "code", q: "With total = 9, use + and str() to print exactly: Total: 9", expectedOutput: "Total: 9", explain: "print(\"Total: \" + str(total)). str() turns the number into text so + can join them." },
      ],
    },
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
          { title: "Yes or no questions", say: "A boolean is either True or False. Comparisons produce them.", text: "A **boolean** is either **True or False**. Comparisons make them: is 5 bigger than 3? True.\nEvery decision a program makes comes down to a boolean.", visual: { type: "table", head: ["Question", "Python", "Answer"], rows: [["Is 5 bigger than 3?", "5 > 3", "True"], ["Is 5 equal to 3?", "5 == 3", "False"], ["Is 5 not equal to 3?", "5 != 3", "True"]] } },
          { title: "Combining questions", say: "and needs both. or needs one. not flips it.", text: "**and**: both must be true. **or**: at least one. **not**: flip it.\nSame as the logic gates from Module 1, written as words.", visual: { type: "table", head: ["a", "b", "a and b", "a or b"], rows: [["True", "True", "True", "True"], ["True", "False", "False", "True"], ["False", "True", "False", "True"], ["False", "False", "False", "False"]] } },
          { title: "The fork in the road", say: "An if statement checks a boolean and picks a path.", text: "An **if statement** checks a boolean. **True**: run the indented block. **False**: skip it, or run the **else** block.\nA flowchart draws it as a diamond with two exits.", visual: { type: "flow", steps: ["age >= 18?", "Yes → print Adult", "No → print Minor"] } },
          { title: "Check", text: "Think about the truth table.", checks: [{"q": "is_raining = True and has_umbrella = False. What does is_raining and has_umbrella give?", "choices": ["True", "False", "Error: and only works on numbers", "The text \"True and False\""], "answer": 1, "explain": "and needs both sides True. has_umbrella is False, so the whole thing is False."}, {"q": "Which of these gives True?", "choices": ["False or False", "True and False", "not True", "False or True"], "answer": 3, "explain": "or needs just one True side. The others: False or False is False, True and False is False, not True is False."}, {"q": "What does not True give you?", "choices": ["True", "False", "Error", "1"], "answer": 1, "explain": "not flips it."}, {"q": "What does 5 > 3 give you?", "choices": ["5", "3", "True", "False"], "answer": 2, "explain": "A comparison produces a boolean. 5 is bigger than 3, so True."}, {"q": "An if statement's condition is False and there's an else. What runs?", "choices": ["The if block", "The else block", "Both", "Neither"], "answer": 1, "explain": "False skips the if block and runs the else instead."}, {"q": "Which of these gives False?", "choices": ["True or False", "not False", "False or False", "True and True"], "answer": 2, "explain": "or needs at least one True side, and neither side is. The other three all give True."}] },
        ],
      },
      {
        id: "m3-compare",
        title: "Comparisons",
        why: "Comparisons are questions with yes/no answers. Every decision in a program starts with one.",
        intro: "*Relational operators* compare two values and give a *boolean*: >  <  >=  <=  ==  !=",
        steps: [
          { code: "print(5 > 3)", parts: [{ text: "print(5 > 3)", say: "Let's ask Python a question: is 5 greater than 3?", explain: "`>` compares. The answer is a *boolean*: True." }] },
          {
            code: "print(5 == 3)",
            parts: [{ text: "print(5 == 3)", more: "Mixing these up is a classic bug: if x = 5 is a syntax error, if x == 5 is a comparison.", say: "Press Enter. Two equals signs ask: are these equal?", explain: "`==` means *is equal to*.\nOne = stores, two == compares!" }],
            hints: [{ match: /print\s*\(\s*5\s*=\s*3/, say: "Use two equals signs to compare: ==" }],
          },
          { code: "print(5 != 3)", parts: [{ text: "print(5 != 3)", say: "Press Enter. Exclamation equals means not equal.", explain: "`!=` means *not equal to*. 5 is not 3, so True." }] },
        ],
        checkpoints: [{"after": 0, "output": "True", "say": "True: 5 really is greater than 3. A comparison gives a boolean."}, {"after": 1, "output": "True\nFalse", "say": "False: 5 and 3 aren't equal."}, {"after": 2, "output": "True\nFalse\nTrue"}],
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
        why: "Combining questions lets a program check two things at once, like a teen check or a password rule.",
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
        checkpoints: [{"after": 1, "output": "True", "say": "True: 16 is at least 13 AND at most 19."}, {"after": 2, "output": "True\nFalse"}],
        expectedOutput: "True\nFalse",
        done: "Precedence tip: not runs first, then and, then or. Use parentheses when in doubt.",
        practice: {
          task: "With temp = 75, use and to print whether temp is above 60 AND below 90 (one print, one boolean).",
          solution: ["temp = 75", "print(temp > 60 and temp < 90)"],
          expectedOutput: "True",
          hints: ["How do you say \"both of these must be true\" in Python?", "Above 60 is one comparison. Below 90 is another. How do you join them?", "Which goes first on the line: the variable, or the print?"],
        },
      },
      {
        id: "m3-if",
        title: "if and else",
        why: "if and else are how a program chooses. This is the moment code stops being a straight line.",
        intro: "A *conditional* runs code only when something is true. if checks, else catches everything else.",
        inputs: ["20"],
        steps: [
          { code: 'age = int(input("Age? "))', parts: [{ text: 'age = int(input("Age? "))', say: "First, get a number from the user and store it in age.", explain: "Cast with int() so we can compare numbers." }] },
          {
            code: "if age >= 18:",
            parts: [
              { text: "if", more: "The line under an if is indented by four spaces. Python uses that indentation to know what belongs to the if.", say: "Press Enter. Now type if: the keyword that makes a decision.", explain: "`if` is a *keyword*: \"only do this when...\"" },
              { text: " age >= 18:", say: "Now the condition, age greater or equal to 18, then a colon.", explain: "The `:` means \"the code for this case is below, indented.\"" },
            ],
            hints: [{ match: /^\s*if\s+age\s*>=\s*18\s*$/, say: "Add a colon : at the end." }],
          },
          { code: '    print("Adult")', parts: [{ text: 'print("Adult")', say: "Press Enter. This line is indented, so it only runs if the condition was True.", explain: "Indented lines belong to the if." }] },
          {
            code: "else:",
            parts: [{ text: "else:", more: "There's no condition after else because it means \"in every other case\".", say: "Press Enter, then Backspace to un-indent. Now type else: it handles the other case.", explain: "`else` has no condition: it's \"otherwise.\"\nIt lines up with the if." }],
            hints: [{ match: /^\s+else/, say: "else: must line up with if. Remove the indentation." }],
          },
          { code: '    print("Minor")', parts: [{ text: 'print("Minor")', say: "Press Enter. This one is indented again, under the else.", explain: "Exactly one of the two prints runs. Never both." }] },
        ],
        checkpoints: [{"after": 4, "output": "Age? 20\nAdult"}],
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
        why: "Grades, menus, difficulty levels: anything with more than two options uses elif.",
        intro: "More than two cases? *elif* (else-if) checks another condition. Python stops at the first one that's true.",
        steps: [
          { code: "score = 85", parts: [{ text: "score = 85", say: "Let's start with a test score of 85.", explain: "score holds 85." }] },
          { code: "if score >= 90:", parts: [{ text: "if score >= 90:", say: "Press Enter. Here's the first check: is the score 90 or more?", explain: "85 >= 90 is False, so Python skips this block." }] },
          { code: '    print("A")', parts: [{ text: 'print("A")', say: "Press Enter. Indent, then print A.", explain: "This line gets skipped this time." }] },
          {
            code: "elif score >= 80:",
            parts: [{ text: "elif score >= 80:", more: "Order matters: if the >= 80 check came first, a 95 would get a B.", say: "Press Enter, then Backspace to un-indent. elif means else-if: another check.", explain: "`elif` only runs if the if was False.\n85 >= 80 is True!" }],
            hints: [{ match: /^\s*else\s+if/, say: "Python spells it elif, one word." }],
          },
          { code: '    print("B")', parts: [{ text: 'print("B")', say: "Press Enter. Indent, then print B.", explain: "This one runs, and Python stops checking." }] },
          { code: "else:", parts: [{ text: "else:", say: "Press Enter, then Backspace to un-indent. else is the catch-all.", explain: "`else` catches everything that didn't match." }] },
          { code: '    print("C")', parts: [{ text: 'print("C")', say: "Press Enter. Indent, then print C.", explain: "This line is never reached this time." }] },
        ],
        checkpoints: [{"after": 6, "output": "B"}],
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
        why: "Python ships with helpers so you don't rebuild them. Knowing a few saves a lot of typing.",
        intro: "Python ships with handy *functions*: len() counts characters, round() rounds, abs() drops the minus sign, max() picks the biggest.",
        steps: [
          { code: 'word = "banana"', parts: [{ text: 'word = "banana"', say: "First, a string to measure: word equals banana.", explain: "word holds 6 characters." }] },
          { code: "print(len(word))", parts: [{ text: "print(len(word))", say: "Press Enter. len counts the characters in word.", explain: "`len` returns the *length*: 6." }] },
          { code: "print(round(3.7))", parts: [{ text: "print(round(3.7))", say: "Press Enter. round rounds to the nearest whole number.", explain: "`round` gives 4." }] },
          { code: "print(abs(-5))", parts: [{ text: "print(abs(-5))", say: "Press Enter. abs gives the absolute value: it drops the minus sign.", explain: "`abs` removes the sign: 5." }] },
          { code: "print(max(3, 9))", parts: [{ text: "print(max(3, 9))", say: "Press Enter. max picks the biggest of the numbers you give it.", explain: "`max` returns the largest: 9. min does the opposite." }] },
        ],
        checkpoints: [{"after": 1, "output": "6", "say": "6: banana has six letters."}, {"after": 2, "output": "6\n4", "say": "4: 3.7 rounds up."}, {"after": 3, "output": "6\n4\n5"}, {"after": 4, "output": "6\n4\n5\n9"}],
        expectedOutput: "6\n4\n5\n9",
        done: "Also useful: min(), max(), str(), int(), float(). A function takes something in and gives something back.",
        practice: {
          task: "Print the length of \"Hello, world!\", then on the next line print the bigger of 3 and 9 using max().",
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
          { title: "for: when you know how many", say: "Use a for loop when you know how many times.", text: "A **for loop** repeats a **set number** of times. range(5) means five times.\nUse it when you **know the count** before the loop starts.", visual: { type: "code", code: "for i in range(3):\n    print(i)", output: "0\n1\n2" } },
          { title: "while: until something changes", say: "Use a while loop when you're waiting for something to change.", text: "A **while loop** keeps going **as long as a condition is True**. Maybe 3 times, maybe 300.\nUse it when you're **waiting for something**: a correct password, a game to end.", visual: { type: "code", code: "n = 3\nwhile n > 0:\n    print(n)\n    n = n - 1", output: "3\n2\n1" } },
          { title: "The infinite loop", say: "If nothing in a while loop changes the condition, it runs forever.", text: "If nothing inside a while loop changes the condition, it runs **forever**. The program freezes.\nAlways ask: what inside the loop **moves me toward False**?", visual: { type: "compare", a: { title: "Infinite", lines: ["n = 3", "while n > 0:", "    print(n)"] }, b: { title: "Fixed", lines: ["n = 3", "while n > 0:", "    print(n)", "    n = n - 1"] } } },
          { title: "break and continue", say: "break leaves the loop. continue skips to the next round.", text: "**break** leaves the loop immediately. **continue** skips the rest of this round and starts the next.\nBoth only make sense **inside a loop**.", checks: [{"q": "You want to repeat exactly 10 times. Which loop?", "choices": ["for", "while", "Either, it doesn't matter", "if"], "answer": 0, "explain": "Known count: for i in range(10). while is for \"until something happens.\""}, {"q": "You want to keep asking for a password until it's correct. Which loop?", "choices": ["for", "while", "if", "range"], "answer": 1, "explain": "You don't know how many tries: while."}, {"q": "A while loop never ends because...", "choices": ["The condition never becomes False", "It has too many lines", "It uses range", "It printed something"], "answer": 0, "explain": "If nothing inside changes the condition, it runs forever."}, {"q": "Which keyword leaves a loop immediately?", "choices": ["continue", "stop", "break", "exit"], "answer": 2, "explain": "break ends the whole loop right away."}, {"q": "Which keyword skips the rest of this round and starts the next one?", "choices": ["break", "continue", "skip", "next"], "answer": 1, "explain": "continue jumps straight to the next round."}, {"q": "range(5) runs a for loop how many times?", "choices": ["4", "5", "6", "It depends"], "answer": 1, "explain": "range(5) gives 0, 1, 2, 3, 4: five numbers."}] },
        ],
      },
      {
        id: "m3-for",
        title: "for loops",
        why: "Repeating is what computers are best at. A for loop does in one line what would take a hundred prints.",
        intro: "A *for loop* repeats a block once for each number range() produces. range(5) is 0, 1, 2, 3, 4.",
        steps: [
          {
            code: "for i in range(5):",
            parts: [
              { text: "for i in", more: "i is just a name. for number in range(5) works exactly the same.", say: "Type for, then i, then in. for is the loop keyword and i is the loop variable.", explain: "`for` is a *keyword*. `i` takes each value in turn." },
              { text: " range(5):",more: "range(2, 7) gives 2 through 6, and range(0, 10, 2) counts by twos.", say: "Now range of 5, which gives five numbers, then a colon.", explain: "`range(5)` is 0 through 4. Starts at 0, stops BEFORE 5." },
            ],
            hints: [{ match: /range\s*\(\s*5\s*\)\s*$/, say: "Add a colon : at the end." }],
          },
          { code: "    print(i)", parts: [{ text: "print(i)", say: "Press Enter. Indent and print i. This body runs 5 times.", explain: "Each time through, i is the next number." }] },
        ],
        checkpoints: [{"after": 1, "output": "0\n1\n2\n3\n4"}],
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
        why: "Building a total in a loop is the pattern behind averages, scores, and counting anything.",
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
        checkpoints: [{"after": 3, "output": "5050"}],
        expectedOutput: "5050",
        done: "Gauss did this in his head as a kid. You did it in four lines.",
        practice: {
          task: "Add up every EVEN number from 0 to 100 with a loop and print the total. Tip: range(start, stop, step), a step of 2 skips the odd numbers.",
          solution: ["total = 0", "for n in range(0, 101, 2):", "    total = total + n", "print(total)"],
          expectedOutput: "2550",
          hints: ["range can take a third number. What does it control?", "What step skips every other number? Where does the counting start?", "Where does the running total start, and where does the print go: inside or after the loop?"],
        },
      },
      {
        id: "m3-while",
        title: "while loops",
        why: "while is for \"keep going until\": games, menus, and retries all work this way.",
        intro: "A *while loop* repeats as long as a condition stays true. You must change something inside, or it loops forever.",
        steps: [
          { code: "count = 3", parts: [{ text: "count = 3", say: "Let's set up a countdown: count equals 3.", explain: "count holds 3." }] },
          {
            code: "while count > 0:",
            parts: [{ text: "while count > 0:", more: "A while loop checks its condition before every round, including the first.", say: "Press Enter. Now a while loop: keep going while count is greater than zero.", explain: "`while` is a *keyword*: \"repeat as long as this is True.\"" }],
          },
          { code: "    print(count)", parts: [{ text: "print(count)", say: "Press Enter. Indent, then print count.", explain: "Shows 3, then 2, then 1." }] },
          {
            code: "    count = count - 1",
            parts: [{ text: "count = count - 1", more: "count -= 1 is the short way to write this. Same thing.", say: "Press Enter. Still indented: subtract one from count. This line is what prevents an infinite loop.", explain: "Without it, count stays 3 forever.\nCodeBuddy would stop you after 3 seconds!" }],
          },
          { code: 'print("Liftoff!")', parts: [{ text: 'print("Liftoff!")', say: "Press Enter, then Backspace to un-indent. This runs after the loop.", explain: "Runs once when count hits 0." }] },
        ],
        checkpoints: [{"after": 4, "output": "3\n2\n1\nLiftoff!"}],
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
        why: "break and continue give you an exit and a skip. They make loops read like real decisions.",
        intro: "Two loop *keywords*: break leaves the loop immediately, continue skips to the next round.",
        steps: [
          { code: "for n in range(10):", parts: [{ text: "for n in range(10):", say: "Start a loop that would run 10 times.", explain: "But we'll cut it short with break." }] },
          { code: "    if n == 3:", parts: [{ text: "if n == 3:", say: "Press Enter. Indent, then add a check inside the loop: if n equals 3.", explain: "A conditional inside a loop. Very common." }] },
          {
            code: "        break",
            parts: [{ text: "break", more: "break only exits the loop it's inside. In a nested loop, the outer one keeps going.", say: "Press Enter. Indent twice, because we're inside the if, inside the loop. Then type break.", explain: "`break` ends the whole loop right now." }],
          },
          {
            code: "    print(n)",
            parts: [{ text: "print(n)", say: "Press Enter, then Backspace once to get back to loop level, and print n.", explain: "Prints 0, 1, 2. When n hits 3, break fires first." }],
          },
        ],
        checkpoints: [{"after": 3, "output": "0\n1\n2"}],
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
        why: "Grids, boards, tables: anything two-dimensional is a loop inside a loop.",
        intro: "A loop inside a loop. The inner one runs completely for every single round of the outer one. Great for grids.",
        steps: [
          { code: "for row in range(3):", parts: [{ text: "for row in range(3):", say: "Start with the outer loop: 3 rows.", explain: "The outer loop runs 3 times." }] },
          {
            code: "    for col in range(3):",
            parts: [{ text: "for col in range(3):", say: "Press Enter. Indent, then the inner loop: 3 columns.", explain: "A *nested loop*. For each row, this runs 3 times: 9 total." }],
          },
          {
            code: '        print("*", end="")',
            parts: [{ text: 'print("*", end="")', more: "You can set end to anything: end=\" \" puts spaces between items.", say: "Press Enter. Indent twice, then print a star with end equals empty quotes, which keeps printing on the same line.", explain: "Normally print ends with a new line.\n`end=\"\"` makes it end with nothing." }],
          },
          {
            code: "    print()",
            parts: [{ text: "print()", say: "Press Enter, then Backspace once. An empty print just moves to a new line.", explain: "After each row of stars, move to the next line." }],
          },
        ],
        checkpoints: [{"after": 3, "output": "***\n***\n***"}],
        expectedOutput: "***\n***\n***",
        done: "That's a shape builder. Change the ranges and you get rectangles; use the row number and you get triangles.",
        practice: {
          task: "Use a loop INSIDE a loop to print a rectangle of stars: 2 rows, each with 4 stars. Use print(\"*\", end=\"\") for the stars and an empty print() to end each row.",
          solution: ["for row in range(2):", "    for col in range(4):", "        print(\"*\", end=\"\")", "    print()"],
          expectedOutput: "****\n****",
          hints: ["Which loop is the rows and which is the columns? Which one goes inside?", "What stops the stars from each going on their own line?", "After the inner loop finishes a row, what moves to the next line?"],
        },
      },
      {
        id: "m3-final",
        title: "Final project: Guess the number",
        final: true,
        why: "This is a real, playable game, built only from things you already know. Every big program is small pieces like these, put together.",
        intro: "Time to build a *game*! The computer picks a secret number, and the player keeps guessing until they get it. It uses everything: variables, a while loop, input, if/elif and an f-string.",
        inputs: ["3", "9", "7"],
        steps: [
          { code: "secret = 7", parts: [{ text: "secret = 7", more: "At the end you'll make the secret random, so it's a surprise every game.", say: "Let's build a guessing game! First, the secret number. We'll use 7 for now.", explain: "`secret` holds the number the player must guess." }] },
          { code: "guess = 0", parts: [{ text: "guess = 0", say: "Press Enter. Make a variable for the player's guess. Start it at 0, a number that can't be the secret.", explain: "0 is never right, so the loop below is sure to start." }] },
          { code: "tries = 0", parts: [{ text: "tries = 0", say: "Press Enter. And a counter for how many guesses they take.", explain: "A *counter* starts at 0 and goes up by 1 each round." }] },
          {
            code: "while guess != secret:",
            parts: [{ text: "while guess != secret:", more: "!= means \"is not equal to\". The loop runs as long as the guess is wrong.", say: "Press Enter. Now the game loop: keep going while the guess is not the secret.", explain: "`while` repeats until the condition is False.\nHere: until the player guesses right." }],
          },
          {
            code: '    guess = int(input("Guess 1-10: "))',
            parts: [
              { text: "guess = ", say: "Press Enter. Inside the loop, ask for a guess and store it in guess.", explain: "Each round, `guess` gets the new answer." },
              { text: 'int(input("Guess 1-10: "))', more: "Without int(), guess would be the text \"7\", and \"7\" != 7 is always True: the game would never end!", say: "Ask with input, and wrap it in int so it becomes a number.", explain: "`input` gives back *text*. `int()` turns it into a number we can compare." },
            ],
          },
          { code: "    tries = tries + 1", parts: [{ text: "tries = tries + 1", say: "Press Enter. Still in the loop: add one to tries.", explain: "One more guess counted." }] },
          {
            code: "    if guess < secret:",
            parts: [{ text: "if guess < secret:", say: "Press Enter. Now give a clue. If the guess is smaller than the secret...", explain: "An `if` inside a loop: checked every round." }],
          },
          { code: '        print("Too low!")', parts: [{ text: 'print("Too low!")', say: "Press Enter. Indent twice, then tell them it's too low.", explain: "Two indents: inside the `if`, inside the loop." }] },
          {
            code: "    elif guess > secret:",
            parts: [{ text: "elif guess > secret:", say: "Press Enter, then Backspace once to line up with the if. Otherwise, if it's bigger than the secret...", explain: "`elif` only checks if the `if` above was False." }],
          },
          { code: '        print("Too high!")', parts: [{ text: 'print("Too high!")', say: "Press Enter. Indent, and say it's too high.", explain: "If it's not too low and not too high, it's right, and the loop ends by itself." }] },
          {
            code: 'print(f"You got it in {tries} tries!")',
            parts: [{ text: 'print(f"You got it in {tries} tries!")', more: "This line only runs after the loop is over, which means the guess was right.", say: "Press Enter, then Backspace twice to get all the way out of the loop. Celebrate, and show how many tries it took.", explain: "An f-string drops `tries` right into the message." }],
          },
        ],
        checkpoints: [{"after": 5, "output": "Guess 1-10: 3\nGuess 1-10: 9\nGuess 1-10: 7"}, {"after": 10, "output": "Guess 1-10: 3\nToo low!\nGuess 1-10: 9\nToo high!\nGuess 1-10: 7\nYou got it in 3 tries!"}],
        expectedOutput: "Guess 1-10: 3\nToo low!\nGuess 1-10: 9\nToo high!\nGuess 1-10: 7\nYou got it in 3 tries!",
        done: "You built a real game! Real guessing games use import random and random.randint(1, 10) so the secret is different every time.",
        practice: {
          task: "Build a password checker. Keep asking \"Password? \" until the user types python. After each wrong try, print \"Wrong, try again.\" At the end, print \"Welcome in! It took 3 tries.\" using a tries counter and an f-string.",
          inputs: ["cat", "Python", "python"],
          solution: ['password = ""', "tries = 0", 'while password != "python":', '    password = input("Password? ")', "    tries = tries + 1", '    if password != "python":', '        print("Wrong, try again.")', 'print(f"Welcome in! It took {tries} tries.")'],
          expectedOutput: "Password? cat\nWrong, try again.\nPassword? Python\nWrong, try again.\nPassword? python\nWelcome in! It took 3 tries.",
          hints: ["It's the same shape as the guessing game: a variable for the answer, a counter, and a while loop that runs while the answer is wrong.", "Start password as an empty string \"\" so the loop runs at least once. Inside: ask, add 1 to tries, then check.", "The welcome line goes after the loop, with no indent. Python is picky: \"Python\" with a capital P is not \"python\"."],
        },
      },
    ],
    quizBank: {
      draw: { mc: 7, code: 5 },
      questions: [
        { q: "What does 5 == 5 give?", choices: ["5", "True", "False", "Error"], answer: 1, explain: "== compares and gives a boolean. 5 equals 5, so True." },
        { q: "What does 3 != 3 give?", choices: ["True", "False", "3", "Error"], answer: 1, explain: "!= means \"not equal\". 3 is equal to 3, so False." },
        { q: "has_ticket = False and is_vip = True. What does has_ticket or is_vip give?", choices: ["True, because or only needs one side to be True", "False, because has_ticket is False", "False, because or needs both sides to be True", "An error, because or can't be used with variables"], answer: 0, explain: "or is True when at least one side is True. is_vip is True, so the whole thing is True." },
        { q: "With age = 15, what does age >= 13 and age <= 19 give?", choices: ["True", "False", "15", "Error"], answer: 0, explain: "Both sides are True (15 is at least 13 and at most 19), so and gives True." },
        { q: "What prints?  x = 7\nif x > 10:\n    print(\"A\")\nelse:\n    print(\"B\")", choices: ["A", "B", "A and B", "Nothing"], answer: 1, explain: "7 > 10 is False, so the else branch runs." },
        { q: "What prints?  score = 85\nif score >= 90:\n    print(\"A\")\nelif score >= 80:\n    print(\"B\")\nelse:\n    print(\"C\")", choices: ["A", "B", "C", "B and C"], answer: 1, explain: "90 fails, 80 passes, and only the first branch that passes runs." },
        { q: "What does len(\"hey\") give?", choices: ["2", "3", "\"hey\"", "Error"], answer: 1, explain: "len counts characters: h, e, y." },
        { q: "What does round(3.7) give?", choices: ["3", "4", "3.7", "0.7"], answer: 1, explain: "round goes to the nearest whole number: 3.7 rounds up to 4." },
        { q: "How many times does  for i in range(4):  loop?", choices: ["3", "4", "5", "Forever"], answer: 1, explain: "range(4) is 0, 1, 2, 3: four values." },
        { q: "What does range(1, 4) give?", choices: ["1, 2, 3, 4", "1, 2, 3", "0, 1, 2, 3", "4, 3, 2, 1"], answer: 1, explain: "range starts at the first number and stops before the second." },
        { q: "What does break do?", choices: ["Pauses the loop", "Skips one round", "Ends the loop immediately", "Restarts the loop"], answer: 2, explain: "break exits the loop right away. continue skips one round." },
        { q: "What prints?  n = 0\nwhile n < 3:\n    n = n + 1\nprint(n)", choices: ["0", "2", "3", "Loops forever"], answer: 2, explain: "n goes 1, 2, 3. At 3 the condition is False, and 3 prints." },
        { q: "A while loop's condition never becomes False. What happens?", choices: ["It runs once and stops", "It never runs at all", "It keeps running forever: an infinite loop", "Python stops it after 100 rounds"], answer: 2, explain: "Nothing ever makes the condition False, so it never stops. Something inside the loop has to change so the condition eventually fails." },
        { q: "What does print(\"*\", end=\"\") do differently from print(\"*\")?", choices: ["Prints two stars", "Stays on the same line afterwards", "Prints nothing", "Ends the program"], answer: 1, explain: "end=\"\" replaces the usual new line with nothing, so the next print continues the same line." },
        { type: "code", q: "Print 4 < 9 on the first line and 4 == 9 on the second.", expectedOutput: "True\nFalse", explain: "Comparisons give booleans: 4 < 9 is True, 4 == 9 is False." },
        { type: "code", q: "With temp = 95, print \"Hot\" if temp is above 80, otherwise print \"Fine\".", expectedOutput: "Hot", explain: "if temp > 80: print(\"Hot\") else: print(\"Fine\"). 95 > 80, so Hot." },
        { type: "code", q: "With score = 72: print \"A\" if it's 90 or more, \"B\" if it's 80 or more, otherwise \"C\".", expectedOutput: "C", explain: "if / elif / else. 72 fails both checks, so the else prints C." },
        { type: "code", q: "Print the length of \"Python\" on one line, then the bigger of 4 and 11 on the next.", expectedOutput: "6\n11", explain: "print(len(\"Python\")) gives 6; print(max(4, 11)) gives 11." },
        { type: "code", q: "Use a for loop to print the numbers 0, 1 and 2, each on its own line.", expectedOutput: "0\n1\n2", explain: "for i in range(3): then an indented print(i)." },
        { type: "code", q: "Use a for loop with range to print 1, 2, 3, 4, 5, each on its own line.", expectedOutput: "1\n2\n3\n4\n5", explain: "for i in range(1, 6): print(i). range stops before 6." },
        { type: "code", q: "Add up the numbers 1 to 10 with a loop and print the total.", expectedOutput: "55", explain: "total = 0, then for n in range(1, 11): total = total + n, then print(total)." },
        { type: "code", q: "Use a while loop to print 5, 4, 3, 2, 1 (count down), each on its own line.", expectedOutput: "5\n4\n3\n2\n1", explain: "n = 5, while n > 0: print(n) and n = n - 1 inside the loop." },
        { type: "code", q: "Loop n over range(5). Use continue to skip 3, and print all the other values of n, one per line.", expectedOutput: "0\n1\n2\n4", explain: "if n == 3: continue, then print(n). continue skips the rest of that round only." },
        { type: "code", q: "Loop n over range(10) and stop the loop with break as soon as n is 4. Print each n before that, one per line.", expectedOutput: "0\n1\n2\n3", explain: "if n == 4: break, then print(n) after it. break ends the loop for good." },
        { type: "code", q: "Use a loop inside a loop to print a rectangle of stars: 3 rows, each with 5 stars. Use print(\"*\", end=\"\") for a star and print() to end a row.", expectedOutput: "*****\n*****\n*****", explain: "for row in range(3): for col in range(5): print(\"*\", end=\"\"), then print() after the inner loop." },
      ],
    },
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
