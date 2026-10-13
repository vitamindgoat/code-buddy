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

   A lesson:
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
        id: "m1-steps",
        title: "Programs are steps",
        intro: "An *algorithm* is a list of steps in order. A program is an algorithm the computer can follow. Order matters!",
        steps: [
          {
            code: 'print("Wake up")',
            parts: [
              { text: "print", say: "Every step here is a print.", explain: "`print` is a *function*: a command that does one job.\nIts job is showing text on the screen." },
              { text: '("Wake up")', say: "Give it the first step of the morning.", explain: "The ( ) hold what you give the function.\nQuotes mean \"these are words, not code.\"" },
            ],
            hints: [
              { match: /^\s*(prnt|pirnt|pritn|pint|prin)\b/i, say: "Check the spelling: p-r-i-n-t." },
              { match: /^\s*print\s*\(\s*[^"'\s)]/, say: "The words need quotes around them." },
            ],
          },
          {
            code: 'print("Brush teeth")',
            parts: [
              { text: 'print("Brush teeth")', say: "Press Enter. Step two goes on its own line.", explain: "Python runs lines top to bottom.\nThat's called *sequencing*." },
            ],
          },
          {
            code: 'print("Go to school")',
            parts: [
              { text: 'print("Go to school")', say: "One more step.", explain: "Three lines, three steps, in order.\nSwap two lines and the morning goes wrong!" },
            ],
          },
        ],
        expectedOutput: "Wake up\nBrush teeth\nGo to school",
        done: "That's an algorithm: steps, in order, that the computer follows exactly.",
        practice: {
          task: "Print the numbers 1, 2 and 3, each on its own line, in order.",
          solution: ["print(1)", "print(2)", "print(3)"],
          expectedOutput: "1\n2\n3",
          hints: ["You need three print lines, one per number.", "Numbers don't need quotes: `print(1)` works.", "Line 1 is `print(1)`. Then 2, then 3."],
        },
      },
      {
        id: "m1-binary",
        title: "Binary",
        intro: "Computers store everything as *bits*: 0s and 1s. The number 5 is 101 in binary. Python can show you.",
        steps: [
          {
            code: "number = 5",
            parts: [
              { text: "number", say: "Make a variable to hold a number.", explain: "`number` is a *variable*: a name that remembers a value." },
              { text: "= 5", say: "Store 5 in it.", explain: "One `=` means \"store this.\"" },
            ],
          },
          {
            code: "print(bin(number))",
            parts: [
              { text: "print(", say: "Press Enter. We'll print something.", explain: "print shows whatever is inside the parentheses." },
              { text: "bin(number))", say: "bin() turns a number into binary.", explain: "`bin` is a function that converts to *binary*.\n5 becomes 0b101: the 0b just means \"this is binary.\"\n1·4 + 0·2 + 1·1 = 5." },
            ],
          },
        ],
        expectedOutput: "0b101",
        done: "101 is 4 + 0 + 1. Every number, letter and picture in a computer is bits like these.",
        practice: {
          task: "Print the binary form of 10.",
          solution: ["print(bin(10))"],
          expectedOutput: "0b1010",
          hints: ["bin() converts a number to binary.", "Put bin(10) inside print( ).", "`print(bin(10))`"],
        },
      },
      {
        id: "m1-compression",
        title: "Patterns and compression",
        intro: "Computers save space by finding *patterns*. Instead of storing 00000000, store \"0, eight times.\" That's run-length encoding.",
        steps: [
          {
            code: 'print("0" * 8)',
            parts: [
              { text: 'print("0"', say: "Print a single character...", explain: "A *string* is text in quotes. Even one character counts." },
              { text: " * 8)", say: "...and repeat it with *", explain: "`*` on a string means *repeat*.\n\"0\" * 8 is 0 eight times: the computer only stores the pattern." },
            ],
          },
          {
            code: 'print("01" * 4)',
            parts: [
              { text: 'print("01" * 4)', say: "Press Enter. Patterns can be longer than one character.", explain: "\"01\" repeated 4 times gives 8 characters.\nLow *entropy* (lots of repetition) compresses well." },
            ],
          },
        ],
        expectedOutput: "00000000\n01010101",
        done: "Repetition is the secret of compression. Random data has no pattern, so it can't shrink.",
        practice: {
          task: "Print \"ab\" repeated 5 times (one line).",
          solution: ['print("ab" * 5)'],
          expectedOutput: "ababababab",
          hints: ["Use * to repeat a string.", "The string is \"ab\", the count is 5.", "`print(\"ab\" * 5)`"],
        },
      },
      {
        id: "m1-logic",
        title: "Logic gates",
        intro: "Chips are built from *logic gates*. AND gives True only if both inputs are True. OR gives True if either is. NOT flips it.",
        steps: [
          {
            code: "print(True and False)",
            parts: [
              { text: "print(True", say: "True and False are *booleans*: yes or no values.", explain: "`True` is a *boolean*. Capital T! Python is picky." },
              { text: " and False)", say: "AND gate: both must be True.", explain: "`and` is an AND gate.\nTrue and False is False, because they're not BOTH true." },
            ],
            hints: [{ match: /\btrue\b|\bfalse\b/, say: "Capital letters: `True` and `False`." }],
          },
          {
            code: "print(True or False)",
            parts: [
              { text: "print(True or False)", say: "Press Enter. OR gate: either one.", explain: "`or` is an OR gate.\nOne True is enough, so this is True." },
            ],
          },
          {
            code: "print(not True)",
            parts: [
              { text: "print(not True)", say: "Press Enter. NOT flips the value.", explain: "`not` is a NOT gate.\nnot True is False." },
            ],
          },
        ],
        expectedOutput: "False\nTrue\nFalse",
        done: "You just wrote a truth table. Every decision a computer makes is built from gates like these.",
        practice: {
          task: "Print True and True on one line, then False or False on the next.",
          solution: ["print(True and True)", "print(False or False)"],
          expectedOutput: "True\nFalse",
          hints: ["Two print lines. Capital T and F.", "First: True and True. Second: False or False.", "`print(True and True)` then `print(False or False)`"],
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
    ],
  },

  /* ============================================================ */
  {
    id: "m2",
    title: "Programming Basics Through Python",
    blurb: "Output, variables, types, math, fancy printing and input.",
    lessons: [
      {
        id: "m2-output",
        title: "Output and comments",
        intro: "Programs talk to you through *console output*. Comments are notes for humans that Python skips.",
        steps: [
          {
            code: "# My first program",
            parts: [
              { text: "#", say: "A comment starts with a hash.", explain: "`#` starts a *comment*.\nPython ignores everything after it on that line." },
              { text: " My first program", say: "Write any note you like.", explain: "Comments explain your code to people.\nThe computer never sees them." },
            ],
          },
          {
            code: 'print("Hello, world!")',
            parts: [
              { text: 'print("Hello, world!")', say: "Press Enter. Now real code.", explain: "`print` sends text to the console.\nThis exact line is the first program most people ever write." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*[^"'\s)]/, say: "The words need quotes around them." }],
          },
          {
            code: 'print("CSP is fun.")',
            parts: [
              { text: 'print("CSP is fun.")', say: "Press Enter. One more.", explain: "Each print makes its own line." },
            ],
          },
        ],
        expectedOutput: "Hello, world!\nCSP is fun.",
        done: "Notice the comment didn't print. Comments are for you, output is for the user.",
        practice: {
          task: "Add a comment that says anything, then print \"Python\" on one line and \"rocks\" on the next.",
          solution: ["# comment", 'print("Python")', 'print("rocks")'],
          expectedOutput: "Python\nrocks",
          hints: ["Comments start with #. They don't print.", "Two print lines, each with words in quotes.", "`print(\"Python\")` then `print(\"rocks\")`"],
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
              { text: 'print("Line one', say: "Start a normal string.", explain: "So far it's ordinary text." },
              { text: '\\nLine two")', say: "\\n means \"new line\" right inside the string.", explain: "`\\n` is an *escape sequence*.\nOne print, two lines of output." },
            ],
          },
          {
            code: 'print("She said \\"hi\\"")',
            parts: [
              { text: 'print("She said \\"hi\\"")', say: "Press Enter. To print a quote mark, escape it with a backslash.", explain: "`\\\"` prints a real quote mark\ninstead of ending the string." },
            ],
          },
        ],
        expectedOutput: 'Line one\nLine two\nShe said "hi"',
        done: "Backslash means \"the next character is special.\" \\n, \\t and \\\" are the ones you'll use most.",
        practice: {
          task: "Using ONE print, show \"Red\" on the first line and \"Blue\" on the second.",
          solution: ['print("Red\\nBlue")'],
          expectedOutput: "Red\nBlue",
          hints: ["\\n inside a string starts a new line.", "One print with Red, then \\n, then Blue.", "`print(\"Red\\nBlue\")`"],
        },
      },
      {
        id: "m2-variables",
        title: "Variables and data types",
        intro: "A *variable* is a name that holds a value. Every value has a *type*: int (whole number), float (decimal), str (text), bool (True/False).",
        steps: [
          {
            code: 'name = "Gary"',
            parts: [
              { text: "name", say: "Variable names are lowercase and describe what they hold.", explain: "`name` is a *variable*.\nGood names say what's inside: name, age, score." },
              { text: ' = "Gary"', say: "Store some text in it.", explain: "Text in quotes is a *string* (type str)." },
            ],
          },
          {
            code: "age = 15",
            parts: [
              { text: "age = 15", say: "Press Enter. Now a whole number.", explain: "15 with no quotes is an *integer* (type int)." },
            ],
            hints: [{ match: /^\s*age\s*=\s*["']/, say: "No quotes: 15 should be a number, not text." }],
          },
          {
            code: "print(type(name))",
            parts: [
              { text: "print(type(name))", say: "Press Enter. Ask Python what type name is.", explain: "`type` is a function that reports a value's *type*.\n<class 'str'> means string." },
            ],
          },
          {
            code: "print(type(age))",
            parts: [
              { text: "print(type(age))", say: "Press Enter. And age?", explain: "<class 'int'> means integer." },
            ],
          },
        ],
        expectedOutput: "<class 'str'>\n<class 'int'>",
        done: "str, int, float, bool. Knowing the type tells you what you can do with a value.",
        practice: {
          task: "Make a variable called price holding 2.5, then print its type.",
          solution: ["price = 2.5", "print(type(price))"],
          expectedOutput: "<class 'float'>",
          hints: ["A decimal number is a float.", "price = 2.5 on the first line, then print(type(price)).", "`price = 2.5` then `print(type(price))`"],
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
              { text: "print(7 + 3)", say: "Plain addition.", explain: "No quotes, so Python *calculates* instead of printing the words." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*["']/, say: "No quotes: we want Python to do the math." }],
          },
          {
            code: "print(7 % 3)",
            parts: [
              { text: "print(7 % 3)", say: "Press Enter. % is modulus: the remainder.", explain: "`%` is *modulus*.\n7 ÷ 3 is 2 remainder 1, so 7 % 3 is 1." },
            ],
          },
          {
            code: "print(7 // 3)",
            parts: [
              { text: "print(7 // 3)", say: "Press Enter. // is floor division.", explain: "`//` is *floor division*.\n7 ÷ 3 is 2.33, floor division keeps just the 2." },
            ],
          },
          {
            code: "print(7 / 2)",
            parts: [
              { text: "print(7 / 2)", say: "Press Enter. Regular division keeps decimals.", explain: "A single `/` always gives a *float*, even 4 / 2 = 2.0." },
            ],
          },
        ],
        expectedOutput: "10\n1\n2\n3.5",
        done: "Trick: num % 10 gives the ones digit. (num // 10) % 10 gives the tens digit. Isolate any digit!",
        practice: {
          task: "Print 17 % 5 on one line and 17 // 5 on the next.",
          solution: ["print(17 % 5)", "print(17 // 5)"],
          expectedOutput: "2\n3",
          hints: ["% gives the remainder, // gives the whole-number part.", "17 ÷ 5 is 3 remainder 2.", "`print(17 % 5)` then `print(17 // 5)`"],
        },
      },
      {
        id: "m2-trace",
        title: "Tracing code",
        intro: "*Tracing* means following a program line by line and tracking what each variable holds. Here x changes four times.",
        steps: [
          { code: "x = 5", parts: [{ text: "x = 5", say: "Start x at 5.", explain: "Trace table: after line 1, x is 5." }] },
          {
            code: "x = x + 3",
            parts: [
              { text: "x = x + 3", say: "Press Enter. Use x to make a new x.", explain: "Python computes the right side first (5 + 3 = 8),\nthen stores it. x is 8." },
            ],
          },
          { code: "x = x * 2", parts: [{ text: "x = x * 2", say: "Press Enter. Double it.", explain: "8 * 2 = 16. x is 16." }] },
          { code: "x = x - 4", parts: [{ text: "x = x - 4", say: "Press Enter. Take away 4.", explain: "16 - 4 = 12. x is 12." }] },
          { code: "print(x)", parts: [{ text: "print(x)", say: "Press Enter. Show the final value.", explain: "Only the last value prints. Did your trace say 12?" }] },
        ],
        expectedOutput: "12",
        done: "Tracing is how you find bugs: pretend to be the computer and track every variable.",
        practice: {
          task: "Start y at 10. Floor-divide it by 3. Multiply it by itself. Print y.",
          solution: ["y = 10", "y = y // 3", "y = y * y", "print(y)"],
          expectedOutput: "9",
          hints: ["Four lines: set, floor-divide, square, print.", "10 // 3 is 3, and 3 * 3 is 9.", "`y = 10`, `y = y // 3`, `y = y * y`, `print(y)`"],
        },
      },
      {
        id: "m2-fstrings",
        title: "Fancy output (f-strings)",
        intro: "An *f-string* lets you drop variables straight into text with { }. Put an f before the opening quote.",
        steps: [
          { code: 'name = "GARY THE SNAIL"', parts: [{ text: 'name = "GARY THE SNAIL"', say: "A string variable.", explain: "name holds the text." }] },
          {
            code: 'print(f"Hi {name}!")',
            parts: [
              { text: 'print(f"', say: "Press Enter. The f before the quote is the magic.", explain: "`f\"` starts an *f-string*: a string that can hold variables." },
              { text: 'Hi {name}!")', say: "Curly braces pull in the variable.", explain: "`{name}` is replaced by what name holds.\nNo + signs, no str()." },
            ],
            hints: [{ match: /^\s*print\s*\(\s*"/, say: "Put an f right before the opening quote: print(f\"...\")" }],
          },
          { code: "num = 50", parts: [{ text: "num = 50", say: "Press Enter. A number this time.", explain: "num holds 50." }] },
          {
            code: 'print(f"{num} * 2 = {num * 2}")',
            parts: [
              { text: 'print(f"{num} * 2 = {num * 2}")', say: "Press Enter. Braces can hold math, too.", explain: "`{num * 2}` does the math inside the string.\nOutput: 50 * 2 = 100." },
            ],
          },
        ],
        expectedOutput: "Hi GARY THE SNAIL!\n50 * 2 = 100",
        done: "f-strings are the cleanest way to print text and values together. You'll use them constantly.",
        practice: {
          task: "With score = 7, use an f-string to print exactly: Score: 7 out of 10",
          solution: ["score = 7", 'print(f"Score: {score} out of 10")'],
          expectedOutput: "Score: 7 out of 10",
          hints: ["First line: score = 7.", "f\"...\" with {score} where the number goes.", "`print(f\"Score: {score} out of 10\")`"],
        },
      },
      {
        id: "m2-input",
        title: "Input",
        intro: "input() shows a prompt, pauses, and waits for the user to type. For this lesson, the user types: Gary",
        inputs: ["Gary"],
        steps: [
          {
            code: 'name = input("What is your name? ")',
            parts: [
              { text: "name = ", say: "We'll store what the user types.", explain: "The answer goes into the variable name." },
              { text: 'input("What is your name? ")', say: "input() shows the prompt and waits.", explain: "`input` is a function that *pauses* the program.\nWhatever the user types comes back as a *string*." },
            ],
          },
          {
            code: 'print("Hi " + name + "!")',
            parts: [
              { text: 'print("Hi " + name + "!")', say: "Press Enter. Greet them. + joins strings.", explain: "`+` on strings *joins* them.\n\"Hi \" + \"Gary\" + \"!\" becomes Hi Gary!" },
            ],
          },
        ],
        expectedOutput: "What is your name? Gary\nHi Gary!",
        done: "input() ALWAYS returns a string, even if the user types a number. That matters next lesson.",
        practice: {
          task: "Ask \"Favorite food? \" with input(), then print \"Yum, \" followed by the answer and \"!\". The user types: pizza",
          inputs: ["pizza"],
          solution: ['food = input("Favorite food? ")', 'print("Yum, " + food + "!")'],
          expectedOutput: "Favorite food? pizza\nYum, pizza!",
          hints: ["Store the input in a variable, then print with +.", "food = input(\"Favorite food? \")", "`print(\"Yum, \" + food + \"!\")`"],
        },
      },
      {
        id: "m2-casting",
        title: "Casting input",
        intro: "input() gives a string, so \"12\" + 1 breaks. *Casting* converts it: int(\"12\") is the number 12. The user types: 12",
        inputs: ["12"],
        steps: [
          {
            code: 'age = int(input("How old are you? "))',
            parts: [
              { text: "age = int(", say: "Wrap the input in int( ) to cast it.", explain: "`int` is a function that *casts* text to a whole number." },
              { text: 'input("How old are you? "))', say: "The input goes inside. Two closing parentheses!", explain: "Inside-out: input() runs first, then int() converts the answer." },
            ],
            hints: [{ match: /^\s*age\s*=\s*input/, say: "Wrap it: age = int(input(...)). Without int() the math will fail." }],
          },
          {
            code: "print(age + 1)",
            parts: [
              { text: "print(age + 1)", say: "Press Enter. Now math works.", explain: "age is a real number now, so 12 + 1 = 13." },
            ],
          },
        ],
        expectedOutput: "How old are you? 12\n13",
        done: "Casting lets math happen. But if the user types \"twelve\", int() crashes: that's a runtime error.",
        practice: {
          task: "Ask \"Number? \", cast the answer to int, and print it times 3. The user types: 4",
          inputs: ["4"],
          solution: ['n = int(input("Number? "))', "print(n * 3)"],
          expectedOutput: "Number? 4\n12",
          hints: ["int(input(...)) turns the typed text into a number.", "n = int(input(\"Number? \"))", "`print(n * 3)`"],
        },
      },
      {
        id: "m2-errors",
        title: "Errors and str()",
        intro: "Three kinds of *errors*: syntax (Python can't read it), runtime (it crashes while running), logic (it runs but is wrong). Here's a classic runtime one.",
        steps: [
          { code: "total = 2 + 2", parts: [{ text: "total = 2 + 2", say: "Do some math.", explain: "total holds the int 4." }] },
          {
            code: 'print("total is " + str(total))',
            parts: [
              { text: 'print("total is " + ', say: "Press Enter. Start joining text...", explain: "+ joins two *strings*. But total is an int!" },
              { text: "str(total))", say: "Cast the number to text with str( ).", explain: "`str` converts a value to a *string*.\nWithout it you'd get a TypeError: can't join str and int." },
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
          hints: ["You can't + a string and an int directly.", "str(age) turns 15 into \"15\".", "`print(\"Age: \" + str(age))`"],
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
    ],
  },

  /* ============================================================ */
  {
    id: "m3",
    title: "Conditionals and Loops",
    blurb: "Make decisions and repeat things: the heart of real programs.",
    lessons: [
      {
        id: "m3-compare",
        title: "Comparisons",
        intro: "*Relational operators* compare two values and give a *boolean*: >  <  >=  <=  ==  !=",
        steps: [
          { code: "print(5 > 3)", parts: [{ text: "print(5 > 3)", say: "Is 5 greater than 3?", explain: "`>` compares. The answer is a *boolean*: True." }] },
          {
            code: "print(5 == 3)",
            parts: [{ text: "print(5 == 3)", say: "Press Enter. Two equals signs ask \"are these equal?\"", explain: "`==` means *is equal to*.\nOne = stores, two == compares!" }],
            hints: [{ match: /print\s*\(\s*5\s*=\s*3/, say: "Use two equals signs to compare: ==" }],
          },
          { code: "print(5 != 3)", parts: [{ text: "print(5 != 3)", say: "Press Enter. != means not equal.", explain: "`!=` means *not equal to*. 5 is not 3, so True." }] },
        ],
        expectedOutput: "True\nFalse\nTrue",
        done: "Comparisons are questions with yes/no answers. Conditionals are built on them.",
        practice: {
          task: "Print 10 <= 10 on one line and 2 >= 5 on the next.",
          solution: ["print(10 <= 10)", "print(2 >= 5)"],
          expectedOutput: "True\nFalse",
          hints: ["<= is \"less than or equal\", >= is \"greater than or equal\".", "10 <= 10 is True. 2 >= 5 is False.", "`print(10 <= 10)` then `print(2 >= 5)`"],
        },
      },
      {
        id: "m3-logic",
        title: "and, or, not",
        intro: "*Logical operators* combine comparisons. and: both true. or: at least one. not: flip it.",
        steps: [
          { code: "age = 16", parts: [{ text: "age = 16", say: "A number to test.", explain: "age holds 16." }] },
          {
            code: "print(age >= 13 and age <= 19)",
            parts: [
              { text: "print(age >= 13", say: "Press Enter. First comparison: 13 or older?", explain: "16 >= 13 is True." },
              { text: " and age <= 19)", say: "and: the second must also be true.", explain: "`and` needs BOTH. 16 <= 19 is True too, so True.\nA teenager check!" },
            ],
          },
          {
            code: "print(age < 13 or age > 19)",
            parts: [{ text: "print(age < 13 or age > 19)", say: "Press Enter. or: either one.", explain: "`or` needs just one. Both are False here, so False." }],
          },
        ],
        expectedOutput: "True\nFalse",
        done: "Precedence tip: not runs first, then and, then or. Use parentheses when in doubt.",
        practice: {
          task: "With temp = 75, print whether temp is above 60 AND below 90.",
          solution: ["temp = 75", "print(temp > 60 and temp < 90)"],
          expectedOutput: "True",
          hints: ["Two comparisons joined with and.", "temp > 60 and temp < 90", "`print(temp > 60 and temp < 90)`"],
        },
      },
      {
        id: "m3-if",
        title: "if and else",
        intro: "A *conditional* runs code only when something is true. if checks, else catches everything else. The user types: 20",
        inputs: ["20"],
        steps: [
          { code: 'age = int(input("Age? "))', parts: [{ text: 'age = int(input("Age? "))', say: "Get a number from the user.", explain: "Cast with int() so we can compare numbers." }] },
          {
            code: "if age >= 18:",
            parts: [
              { text: "if", say: "Press Enter. The keyword that makes a decision.", explain: "`if` is a *keyword*: \"only do this when...\"" },
              { text: " age >= 18:", say: "The condition, then a colon.", explain: "The `:` means \"the code for this case is below, indented.\"" },
            ],
            hints: [{ match: /^\s*if\s+age\s*>=\s*18\s*$/, say: "Add a colon : at the end." }],
          },
          { code: '    print("Adult")', parts: [{ text: 'print("Adult")', say: "Press Enter. Indented: this only runs if the condition was True.", explain: "Indented lines belong to the if." }] },
          {
            code: "else:",
            parts: [{ text: "else:", say: "Press Enter, then Backspace to un-indent. else handles the other case.", explain: "`else` has no condition: it's \"otherwise.\"\nIt lines up with the if." }],
            hints: [{ match: /^\s+else/, say: "else: must line up with if. Remove the indentation." }],
          },
          { code: '    print("Minor")', parts: [{ text: 'print("Minor")', say: "Press Enter. Indented again.", explain: "Exactly one of the two prints runs. Never both." }] },
        ],
        expectedOutput: "Age? 20\nAdult",
        done: "if/else is a fork in the road. The user typed 20, so we took the Adult path.",
        practice: {
          task: "Ask \"Number? \" (cast to int). If it's greater than 10 print \"Big\", else print \"Small\". The user types: 5",
          inputs: ["5"],
          solution: ['n = int(input("Number? "))', "if n > 10:", '    print("Big")', "else:", '    print("Small")'],
          expectedOutput: "Number? 5\nSmall",
          hints: ["if n > 10: then an indented print, then else: and another.", "Don't forget the colons and the indentation.", "`if n > 10:` / `    print(\"Big\")` / `else:` / `    print(\"Small\")`"],
        },
      },
      {
        id: "m3-elif",
        title: "elif",
        intro: "More than two cases? *elif* (else-if) checks another condition. Python stops at the first one that's true.",
        steps: [
          { code: "score = 85", parts: [{ text: "score = 85", say: "A test score.", explain: "score holds 85." }] },
          { code: "if score >= 90:", parts: [{ text: "if score >= 90:", say: "Press Enter. First check.", explain: "85 >= 90 is False, so Python skips this block." }] },
          { code: '    print("A")', parts: [{ text: 'print("A")', say: "Press Enter. Indented.", explain: "Skipped this time." }] },
          {
            code: "elif score >= 80:",
            parts: [{ text: "elif score >= 80:", say: "Press Enter, Backspace to un-indent. elif = another check.", explain: "`elif` only runs if the if was False.\n85 >= 80 is True!" }],
            hints: [{ match: /^\s*else\s+if/, say: "Python spells it elif, one word." }],
          },
          { code: '    print("B")', parts: [{ text: 'print("B")', say: "Press Enter. Indented.", explain: "This one runs, and Python stops checking." }] },
          { code: "else:", parts: [{ text: "else:", say: "Press Enter, un-indent. The catch-all.", explain: "`else` catches everything that didn't match." }] },
          { code: '    print("C")', parts: [{ text: 'print("C")', say: "Press Enter. Indented.", explain: "Never reached this time." }] },
        ],
        expectedOutput: "B",
        done: "Order matters: put the strictest check first. Checking >= 80 before >= 90 would give the wrong grade.",
        practice: {
          task: "With temp = 50: print \"Hot\" if above 80, \"Warm\" if above 60, otherwise \"Cold\".",
          solution: ["temp = 50", "if temp > 80:", '    print("Hot")', "elif temp > 60:", '    print("Warm")', "else:", '    print("Cold")'],
          expectedOutput: "Cold",
          hints: ["if, elif, else: three branches.", "Check > 80 first, then > 60.", "`if temp > 80:` / `elif temp > 60:` / `else:` with an indented print in each."],
        },
      },
      {
        id: "m3-functions",
        title: "Common functions",
        intro: "Python ships with handy *functions*: len() counts characters, round() rounds, abs() drops the minus sign.",
        steps: [
          { code: 'word = "banana"', parts: [{ text: 'word = "banana"', say: "A string to measure.", explain: "word holds 6 characters." }] },
          { code: "print(len(word))", parts: [{ text: "print(len(word))", say: "Press Enter. len() counts.", explain: "`len` returns the *length*: 6." }] },
          { code: "print(round(3.7))", parts: [{ text: "print(round(3.7))", say: "Press Enter. round() to the nearest whole number.", explain: "`round` gives 4." }] },
          { code: "print(abs(-5))", parts: [{ text: "print(abs(-5))", say: "Press Enter. abs() = absolute value.", explain: "`abs` removes the sign: 5." }] },
        ],
        expectedOutput: "6\n4\n5",
        done: "Also useful: min(), max(), str(), int(), float(). A function takes something in and gives something back.",
        practice: {
          task: "Print the length of \"Hello, world!\" then print max(3, 9).",
          solution: ['print(len("Hello, world!"))', "print(max(3, 9))"],
          expectedOutput: "13\n9",
          hints: ["len() counts every character, spaces and punctuation too.", "max() gives the biggest of its inputs.", "`print(len(\"Hello, world!\"))` then `print(max(3, 9))`"],
        },
      },
      {
        id: "m3-for",
        title: "for loops",
        intro: "A *for loop* repeats a block once for each number range() produces. range(5) is 0, 1, 2, 3, 4.",
        steps: [
          {
            code: "for i in range(5):",
            parts: [
              { text: "for i in", say: "The loop keyword and a loop variable.", explain: "`for` is a *keyword*. `i` takes each value in turn." },
              { text: " range(5):", say: "range(5) gives five numbers. Colon!", explain: "`range(5)` is 0 through 4. Starts at 0, stops BEFORE 5." },
            ],
            hints: [{ match: /range\s*\(\s*5\s*\)\s*$/, say: "Add a colon : at the end." }],
          },
          { code: "    print(i)", parts: [{ text: "print(i)", say: "Press Enter. Indented: the body runs 5 times.", explain: "Each time through, i is the next number." }] },
        ],
        expectedOutput: "0\n1\n2\n3\n4",
        done: "range(5) has 5 numbers but starts at 0, so the last is 4. That trips everyone up once.",
        practice: {
          task: "Print 1, 2, 3 using a for loop with range(1, 4).",
          solution: ["for i in range(1, 4):", "    print(i)"],
          expectedOutput: "1\n2\n3",
          hints: ["range(start, stop) begins at start and stops before stop.", "for i in range(1, 4): then an indented print(i).", "`for i in range(1, 4):` / `    print(i)`"],
        },
      },
      {
        id: "m3-sum",
        title: "Adding up with a loop",
        intro: "A loop can build a result step by step. This one adds every number from 0 to 100.",
        steps: [
          { code: "total = 0", parts: [{ text: "total = 0", say: "Start the running total at zero.", explain: "An *accumulator*: a variable that collects results." }] },
          { code: "for n in range(101):", parts: [{ text: "for n in range(101):", say: "Press Enter. 0 to 100 means range(101).", explain: "range(101) stops before 101, so 100 is included." }] },
          { code: "    total = total + n", parts: [{ text: "total = total + n", say: "Press Enter. Indented: add n each time.", explain: "Each loop adds the next number to total." }] },
          {
            code: "print(total)",
            parts: [{ text: "print(total)", say: "Press Enter, then Backspace to un-indent. Print AFTER the loop.", explain: "Un-indented, so it runs once, at the end: 5050." }],
            hints: [{ match: /^\s+print\s*\(\s*total/, say: "Un-indent this print so it runs after the loop, not inside it." }],
          },
        ],
        expectedOutput: "5050",
        done: "Gauss did this in his head as a kid. You did it in four lines.",
        practice: {
          task: "Add up all the EVEN numbers from 0 to 100 and print the total. (Hint: range can take a step.)",
          solution: ["total = 0", "for n in range(0, 101, 2):", "    total = total + n", "print(total)"],
          expectedOutput: "2550",
          hints: ["range(start, stop, step): a step of 2 skips the odd numbers.", "for n in range(0, 101, 2):", "`total = 0` / `for n in range(0, 101, 2):` / `    total = total + n` / `print(total)`"],
        },
      },
      {
        id: "m3-while",
        title: "while loops",
        intro: "A *while loop* repeats as long as a condition stays true. You must change something inside, or it loops forever.",
        steps: [
          { code: "count = 3", parts: [{ text: "count = 3", say: "A countdown starts here.", explain: "count holds 3." }] },
          {
            code: "while count > 0:",
            parts: [{ text: "while count > 0:", say: "Press Enter. Keep going while count is positive.", explain: "`while` is a *keyword*: \"repeat as long as this is True.\"" }],
          },
          { code: "    print(count)", parts: [{ text: "print(count)", say: "Press Enter. Indented.", explain: "Shows 3, then 2, then 1." }] },
          {
            code: "    count = count - 1",
            parts: [{ text: "count = count - 1", say: "Press Enter. Still indented. THIS line prevents an infinite loop.", explain: "Without it, count stays 3 forever.\nCodeBuddy would stop you after 3 seconds!" }],
          },
          { code: 'print("Liftoff!")', parts: [{ text: 'print("Liftoff!")', say: "Press Enter, Backspace to un-indent. After the loop.", explain: "Runs once when count hits 0." }] },
        ],
        expectedOutput: "3\n2\n1\nLiftoff!",
        done: "Use for when you know how many times. Use while when you're waiting for something to become true.",
        practice: {
          task: "Use a while loop to print 1, 2, 3, 4 (count up).",
          solution: ["n = 1", "while n <= 4:", "    print(n)", "    n = n + 1"],
          expectedOutput: "1\n2\n3\n4",
          hints: ["Start n at 1, loop while n <= 4.", "Inside: print(n), then n = n + 1.", "`n = 1` / `while n <= 4:` / `    print(n)` / `    n = n + 1`"],
        },
      },
      {
        id: "m3-break",
        title: "break and continue",
        intro: "Two loop *keywords*: break leaves the loop immediately, continue skips to the next round.",
        steps: [
          { code: "for n in range(10):", parts: [{ text: "for n in range(10):", say: "A loop that would run 10 times...", explain: "...but we'll cut it short." }] },
          { code: "    if n == 3:", parts: [{ text: "if n == 3:", say: "Press Enter. Indented: a check inside the loop.", explain: "A conditional inside a loop. Very common." }] },
          {
            code: "        break",
            parts: [{ text: "break", say: "Press Enter. Indented TWICE: inside the if, inside the loop.", explain: "`break` ends the whole loop right now." }],
          },
          {
            code: "    print(n)",
            parts: [{ text: "print(n)", say: "Press Enter, Backspace once: back to loop level.", explain: "Prints 0, 1, 2. When n hits 3, break fires first." }],
          },
        ],
        expectedOutput: "0\n1\n2",
        done: "break = stop the loop. continue = skip this round. Both only work inside loops.",
        practice: {
          task: "Loop n over range(4). If n == 2, continue (skip it). Otherwise print n.",
          solution: ["for n in range(4):", "    if n == 2:", "        continue", "    print(n)"],
          expectedOutput: "0\n1\n3",
          hints: ["continue jumps to the next loop round without running the rest.", "if n == 2: then an extra-indented continue.", "`for n in range(4):` / `    if n == 2:` / `        continue` / `    print(n)`"],
        },
      },
      {
        id: "m3-nested",
        title: "Nested loops",
        intro: "A loop inside a loop. The inner one runs completely for every single round of the outer one. Great for grids.",
        steps: [
          { code: "for row in range(3):", parts: [{ text: "for row in range(3):", say: "The outer loop: 3 rows.", explain: "Runs 3 times." }] },
          {
            code: "    for col in range(3):",
            parts: [{ text: "for col in range(3):", say: "Press Enter. Indented: the inner loop, 3 columns.", explain: "A *nested loop*. For each row, this runs 3 times: 9 total." }],
          },
          {
            code: '        print("*", end="")',
            parts: [{ text: 'print("*", end="")', say: "Press Enter. Indented twice. end=\"\" keeps printing on the same line.", explain: "Normally print ends with a new line.\n`end=\"\"` makes it end with nothing." }],
          },
          {
            code: "    print()",
            parts: [{ text: "print()", say: "Press Enter, Backspace once. An empty print = new line.", explain: "After each row of stars, move to the next line." }],
          },
        ],
        expectedOutput: "***\n***\n***",
        done: "That's a shape builder. Change the ranges and you get rectangles; use the row number and you get triangles.",
        practice: {
          task: "Print a triangle: * on line 1, ** on line 2, *** on line 3. (A single loop and string repetition will do it.)",
          solution: ["for row in range(1, 4):", '    print("*" * row)'],
          expectedOutput: "*\n**\n***",
          hints: ["\"*\" * row repeats the star row times.", "for row in range(1, 4): gives 1, 2, 3.", "`for row in range(1, 4):` / `    print(\"*\" * row)`"],
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
    ],
  },
];

// Flat list of lessons, with module info attached, for navigation
const LESSONS = MODULES.flatMap((m, mi) =>
  m.lessons.map((l, li) => ({ ...l, moduleId: m.id, moduleIndex: mi, lessonIndex: li, number: `${mi + 1}.${li + 1}` }))
);
