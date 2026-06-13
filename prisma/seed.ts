import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedTopic = {
  slug: string;
  name: string;
  subject: string;
  baseRating: number;
  order: number;
  prereqs: string[];
  problems: Array<{
    prompt: string;
    difficulty: number;
    kind: "numeric" | "multiple_choice" | "short";
    payload: object;
  }>;
};

const TOPICS: SeedTopic[] = [
  // ─── MATH SUBJECT ──────────────────────────────────────────────────────────
  {
    slug: "arithmetic",
    name: "Arithmetic",
    subject: "math",
    baseRating: 800,
    order: 0,
    prereqs: [],
    problems: [
      { prompt: "What is 7 + 5?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 12, hints: ["Count up from 7."], solution: "7 + 5 = 12." } },
      { prompt: "What is 14 - 9?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Count back from 14."], solution: "14 - 9 = 5." } },
      { prompt: "What is 6 × 7?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 42, hints: ["Six sevens."], solution: "6 × 7 = 42." } },
      { prompt: "What is 81 ÷ 9?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 9, hints: ["9 times what equals 81?"], solution: "81 ÷ 9 = 9." } },
      { prompt: "What is 13 × 11?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 143, hints: ["13 × 10 + 13."], solution: "13 × 11 = 143." } },
      { prompt: "What is 144 ÷ 12?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 12, hints: ["12 × 12 = 144."], solution: "144 ÷ 12 = 12." } },
      { prompt: "Evaluate: 4 + 3 × 5", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 19, hints: ["Order of operations: multiplication before addition."], solution: "4 + (3 × 5) = 4 + 15 = 19." } },
      { prompt: "What is 25 × 8?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 200, hints: ["Think of four 25s making 100."], solution: "25 × 8 = 200." } },
      { prompt: "What is the remainder when 47 is divided by 6?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Find the largest multiple of 6 less than 47."], solution: "6 × 7 = 42. 47 - 42 = 5." } },
      { prompt: "Calculate: 125 ÷ 5 + 6 × 3", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 43, hints: ["Perform division and multiplication first, then add."], solution: "(125 ÷ 5) + (6 × 3) = 25 + 18 = 43." } }
    ],
  },
  {
    slug: "integers",
    name: "Integers",
    subject: "math",
    baseRating: 900,
    order: 1,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "What is -5 + 3?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: -2, hints: ["Move 3 to the right on a number line starting at -5."], solution: "-5 + 3 = -2." } },
      { prompt: "What is -4 × -6?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 24, hints: ["Negative times negative is positive."], solution: "-4 × -6 = 24." } },
      { prompt: "What is the absolute value of -17?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 17, hints: ["Distance from zero."], solution: "|-17| = 17." } },
      { prompt: "Order from least to greatest: -3, 1, -7, 0", difficulty: 3, kind: "short", payload: { type: "short", acceptable: ["-7, -3, 0, 1", "-7,-3,0,1"], hints: ["List negatives first, with the largest absolute value negative being smallest."], solution: "-7, -3, 0, 1." } },
      { prompt: "Evaluate: -12 - (-15)", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 3, hints: ["Subtracting a negative is the same as adding a positive."], solution: "-12 - (-15) = -12 + 15 = 3." } },
      { prompt: "Evaluate: -36 ÷ (3 × -3)", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 4, hints: ["Simplify the parentheses first."], solution: "-36 ÷ (-9) = 4." } }
    ],
  },
  {
    slug: "fractions",
    name: "Fractions",
    subject: "math",
    baseRating: 1000,
    order: 2,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "Simplify 6/8 to lowest terms.", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["3/4"], hints: ["Divide both the numerator and denominator by their greatest common divisor (2)."], solution: "6/8 = 3/4." } },
      { prompt: "What is 1/2 + 1/3?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["5/6"], hints: ["Find a common denominator (6)."], solution: "1/2 + 1/3 = 3/6 + 2/6 = 5/6." } },
      { prompt: "What is 2/3 × 3/4? (as a simplified fraction, e.g. 1/2)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/2"], hints: ["Multiply numerators, multiply denominators, then simplify."], solution: "2/3 × 3/4 = 6/12 = 1/2." } },
      { prompt: "What is 5/6 ÷ 1/3?", difficulty: 3, kind: "short", payload: { type: "short", acceptable: ["5/2", "2.5", "2 1/2"], hints: ["Multiply by the reciprocal of 1/3."], solution: "5/6 ÷ 1/3 = 5/6 × 3/1 = 15/6 = 5/2." } },
      { prompt: "Convert 7/4 to a decimal.", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 1.75, hints: ["Divide 7 by 4."], solution: "7 ÷ 4 = 1.75." } },
      { prompt: "What is 3/8 - 1/4?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/8"], hints: ["Find a common denominator."], solution: "3/8 - 2/8 = 1/8." } }
    ],
  },
  {
    slug: "geometry",
    name: "Geometry",
    subject: "math",
    baseRating: 1050,
    order: 3,
    prereqs: ["arithmetic"],
    problems: [
      { prompt: "How many sides does a hexagon have?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Hex means six."], solution: "A hexagon has 6 sides." } },
      { prompt: "What is the area of a rectangle with length 7 and width 4?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 28, hints: ["Area = length × width."], solution: "7 × 4 = 28." } },
      { prompt: "What is the perimeter of a square with side 9?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 36, hints: ["4 times the side length."], solution: "4 × 9 = 36." } },
      { prompt: "What is the volume of a cube with edge length 3?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 27, hints: ["Volume = edge^3."], solution: "3^3 = 27." } },
      { prompt: "What is the sum of the interior angles of a triangle (in degrees)?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 180, hints: ["All triangles have the same sum."], solution: "The sum of interior angles is 180°." } },
      { prompt: "The hypotenuse of a right triangle with legs 3 and 4 is?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Use the Pythagorean theorem: a^2 + b^2 = c^2."], solution: "3^2 + 4^2 = 9 + 16 = 25. √25 = 5." } }
    ],
  },
  {
    slug: "algebra",
    name: "Algebra",
    subject: "math",
    baseRating: 1100,
    order: 4,
    prereqs: ["fractions", "integers"],
    problems: [
      { prompt: "Solve for x: x + 7 = 12", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Subtract 7 from both sides."], solution: "x = 12 - 7 = 5." } },
      { prompt: "Solve for x: 3x = 21", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Divide both sides by 3."], solution: "x = 21 / 3 = 7." } },
      { prompt: "Solve for x: 2x + 5 = 17", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Subtract 5 first, then divide by 2."], solution: "2x = 12, x = 6." } },
      { prompt: "If f(x) = 2x - 3, what is f(5)?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Substitute 5 for x in the equation."], solution: "2(5) - 3 = 10 - 3 = 7." } },
      { prompt: "Solve: (x - 2)(x + 3) = 0. Sum of the solutions?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: -1, hints: ["The roots are 2 and -3."], solution: "Sum = 2 + (-3) = -1." } },
      { prompt: "Solve for y: 4y - 9 = 2y + 7", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 8, hints: ["Subtract 2y from both sides, then add 9 to both sides."], solution: "2y = 16, y = 8." } }
    ],
  },
  {
    slug: "quadratics",
    name: "Quadratics",
    subject: "math",
    baseRating: 1300,
    order: 5,
    prereqs: ["algebra"],
    problems: [
      { prompt: "Solve x^2 = 49. Find the positive root.", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Square root both sides."], solution: "x = 7." } },
      { prompt: "Factor: x^2 - 5x + 6", difficulty: 2, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["(x-2)(x-3)", "(x-1)(x-6)", "(x+2)(x+3)", "(x-6)(x+1)"], answerIndex: 0, hints: ["Find two numbers that multiply to +6 and add to -5."], solution: "(x-2)(x-3) = x^2 - 5x + 6." } },
      { prompt: "Solve x^2 - 4x + 3 = 0. Find the sum of the distinct roots.", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 4, hints: ["Roots are 1 and 3."], solution: "Sum = 1 + 3 = 4." } },
      { prompt: "Find the y-value of the vertex of y = x^2 - 6x + 5.", difficulty: 4, kind: "numeric", payload: { type: "numeric", answer: -4, hints: ["Vertex x-value is -b/(2a) = 3. Plug 3 back in to find y."], solution: "y = 3^2 - 6(3) + 5 = 9 - 18 + 5 = -4." } },
      { prompt: "How many real solutions does x^2 + 4x + 5 = 0 have?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 0, hints: ["Check the discriminant: b^2 - 4ac."], solution: "Discriminant = 16 - 20 = -4. Since it is negative, there are 0 real solutions." } }
    ],
  },
  {
    slug: "trig",
    name: "Trigonometry",
    subject: "math",
    baseRating: 1400,
    order: 6,
    prereqs: ["algebra", "geometry"],
    problems: [
      { prompt: "What is sin(0°)?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 0, tolerance: 0.0001, hints: ["Imagine the unit circle at angle 0."], solution: "sin 0 = 0." } },
      { prompt: "What is cos(60°)? (fraction or decimal)", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["1/2", "0.5"], hints: ["Think of a 30-60-90 triangle's ratios."], solution: "cos 60° = 1/2." } },
      { prompt: "What is tan(45°)?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 1, tolerance: 0.0001, hints: ["A 45-45-90 triangle is isosceles, so opposite/adjacent is equal."], solution: "tan 45° = 1." } },
      { prompt: "Evaluate sin(30°) + cos(60°).", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 1, hints: ["Both terms equal 1/2."], solution: "1/2 + 1/2 = 1." } }
    ],
  },
  {
    slug: "statistics",
    name: "Statistics",
    subject: "math",
    baseRating: 1250,
    order: 7,
    prereqs: ["fractions", "integers"],
    problems: [
      { prompt: "What is the mean of 2, 4, 6, 8?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Sum all elements and divide by their count."], solution: "(2+4+6+8)/4 = 20/4 = 5." } },
      { prompt: "What is the median of 1, 3, 7, 9, 12?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Sort the values and select the middle one."], solution: "The list is sorted; the middle value is 7." } },
      { prompt: "What is the range of -3, 0, 4, 11?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 14, hints: ["Range is Max value minus Min value."], solution: "11 - (-3) = 14." } },
      { prompt: "What is the mode of the dataset: 3, 7, 3, 9, 7, 3, 11?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 3, hints: ["Mode is the most frequent value."], solution: "3 appears three times, more than any other value." } }
    ],
  },
  {
    slug: "combinatorics",
    name: "Combinatorics",
    subject: "math",
    baseRating: 1500,
    order: 8,
    prereqs: ["integers"],
    problems: [
      { prompt: "How many ways can you arrange 3 distinct books on a shelf?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Use factorial: 3! = 3 · 2 · 1."], solution: "3! = 6." } },
      { prompt: "Evaluate C(5,2), the number of ways to choose 2 items from 5.", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 10, hints: ["Formula: n! / (r!(n-r)!)."], solution: "5! / (2! · 3!) = (5 × 4) / 2 = 10." } },
      { prompt: "How many distinct 4-letter permutations can be formed from the word 'CODE'?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 24, hints: ["4 letters, all distinct. 4!"], solution: "4! = 24." } }
    ],
  },
  {
    slug: "probability",
    name: "Probability",
    subject: "math",
    baseRating: 1450,
    order: 9,
    prereqs: ["statistics"],
    problems: [
      { prompt: "What is the probability of rolling a 6 on a fair six-sided die? (as a fraction)", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["1/6"], hints: ["1 favorable outcome out of 6 possible outcomes."], solution: "1/6." } },
      { prompt: "What is the probability of getting two heads in two fair coin flips? (as a fraction)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/4"], hints: ["Sample space is: HH, HT, TH, TT."], solution: "1 out of 4 is 1/4." } },
      { prompt: "If you draw a card from a standard deck of 52, what is the probability of drawing an Ace? (simplified fraction)", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["1/13"], hints: ["There are 4 Aces in 52 cards."], solution: "4 / 52 = 1 / 13." } }
    ],
  },
  {
    slug: "calculus",
    name: "Calculus",
    subject: "math",
    baseRating: 1700,
    order: 10,
    prereqs: ["trig", "quadratics"],
    problems: [
      { prompt: "What is the derivative of x^2?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["2x", "2x^1"], hints: ["Use the power rule: d/dx(x^n) = n·x^(n-1)."], solution: "d/dx(x^2) = 2x." } },
      { prompt: "What is the derivative of sin(x)?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["cos(x)", "cosx", "cos"], hints: ["Trig derivative standard rule."], solution: "d/dx(sin x) = cos x." } },
      { prompt: "Evaluate the indefinite integral: ∫ 2x dx (omit + C).", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["x^2", "x**2"], hints: ["Reverse power rule."], solution: "∫ 2x dx = x^2 (+ C)." } }
    ],
  },

  // ─── COMPUTER SCIENCE SUBJECT ──────────────────────────────────────────────
  {
    slug: "programming-basics",
    name: "Programming Basics",
    subject: "computer_science",
    baseRating: 800,
    order: 0,
    prereqs: [],
    problems: [
      { prompt: "In programming, what is the assignment operator in JavaScript or Python?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["="], hints: ["It is a single character used to assign values to variables."], solution: "The single equals sign `=` is the assignment operator." } },
      { prompt: "What keyword is typically used to print text to the console in Python?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["print", "print()"], hints: ["p-r-i-n-t"], solution: "`print` is used to output text in Python." } },
      { prompt: "Which of the following is NOT a common programming language?", difficulty: 1, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["Python", "Java", "HTML", "C++"], answerIndex: 2, hints: ["One of these is a markup language, not a programming language."], solution: "HTML is a markup language, not a programming language." } },
      { prompt: "What does IDE stand for in programming?", difficulty: 2, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["Integrated Development Environment", "Internal Device Engine", "Interactive Design Editor", "Independent Developer Ecosystem"], answerIndex: 0, hints: ["It's a software suite where developers write code."], solution: "IDE stands for Integrated Development Environment." } }
    ],
  },
  {
    slug: "variables-types",
    name: "Variables & Types",
    subject: "computer_science",
    baseRating: 900,
    order: 1,
    prereqs: ["programming-basics"],
    problems: [
      { prompt: "What data type is used to represent true or false values?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["boolean", "bool"], hints: ["Named after George Boole."], solution: "A Boolean represents true or false." } },
      { prompt: "In JS: What is the data type of the value 42.5?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["number", "float", "double"], hints: ["All numbers in JavaScript are of type..."], solution: "In JavaScript, integers and decimals are of type `number`." } },
      { prompt: "What is the value of x after: x = 10; x = x + 5;?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 15, hints: ["Read the statements sequentially."], solution: "10 + 5 = 15." } },
      { prompt: "What is the output of 'hello' + 'world' (string concatenation)?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["helloworld"], hints: ["Strings are joined directly without adding spaces unless specified."], solution: "'helloworld'." } }
    ],
  },
  {
    slug: "conditionals",
    name: "Conditionals",
    subject: "computer_science",
    baseRating: 1000,
    order: 2,
    prereqs: ["variables-types"],
    problems: [
      { prompt: "In Python: what keyword is used for 'else if' statements?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["elif"], hints: ["Combination of else and if."], solution: "Python uses `elif`." } },
      { prompt: "What does the expression (5 > 3) && (2 < 1) evaluate to in JS?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["false", "0"], hints: ["Both conditions must be true for the && operator to return true."], solution: "(5 > 3) is true, but (2 < 1) is false. True AND False is false." } },
      { prompt: "Given x = 5. If x > 10: x = 20. Else: x = 0. What is x?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 0, hints: ["Is 5 greater than 10?"], solution: "Since 5 is not > 10, the else block executes and x becomes 0." } },
      { prompt: "What comparison operator is used to check for strict equality in JavaScript?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["==="], hints: ["It is three characters long."], solution: "`===` checks both value and type in JavaScript." } }
    ],
  },
  {
    slug: "loops",
    name: "Loops",
    subject: "computer_science",
    baseRating: 1100,
    order: 3,
    prereqs: ["conditionals"],
    problems: [
      { prompt: "What type of loop runs a block of code while a condition is true?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["while", "while loop"], hints: ["w-h-i-l-e"], solution: "A `while` loop runs code based on a condition." } },
      { prompt: "How many times does this loop run: for i in range(5)?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 5, hints: ["Python's range(n) generates numbers from 0 to n-1."], solution: "It runs for i = 0, 1, 2, 3, 4, which is 5 times." } },
      { prompt: "What keyword is used to terminate a loop prematurely?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["break"], hints: ["You 'break' out of a loop."], solution: "`break` immediately exits the loop." } },
      { prompt: "What is the final value of sum: sum = 0; for i in [1, 2, 3]: sum += i?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Add 1, then 2, then 3 to sum."], solution: "0 + 1 + 2 + 3 = 6." } }
    ],
  },
  {
    slug: "functions",
    name: "Functions",
    subject: "computer_science",
    baseRating: 1200,
    order: 4,
    prereqs: ["loops"],
    problems: [
      { prompt: "What keyword is used to declare a function in Python?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["def"], hints: ["Short for define."], solution: "`def` is used in Python." } },
      { prompt: "What statement is used to send a value back from a function?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["return"], hints: ["r-e-t-u-r-n"], solution: "The `return` statement sends a value back." } },
      { prompt: "If def add(a, b): return a + b. What does add(3, 4) return?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 7, hints: ["Add the arguments together."], solution: "3 + 4 = 7." } },
      { prompt: "If a variable is declared inside a function, what is its scope?", difficulty: 3, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["Global scope", "Local scope", "Block scope", "Class scope"], answerIndex: 1, hints: ["It is only accessible inside the function."], solution: "It has local scope." } }
    ],
  },
  {
    slug: "arrays-lists",
    name: "Arrays & Lists",
    subject: "computer_science",
    baseRating: 1350,
    order: 5,
    prereqs: ["functions"],
    problems: [
      { prompt: "What is the index of the first element in an array in most languages?", difficulty: 1, kind: "numeric", payload: { type: "numeric", answer: 0, hints: ["Zero-based indexing."], solution: "The first index is 0." } },
      { prompt: "If arr = [10, 20, 30, 40], what is arr[2]?", difficulty: 2, kind: "numeric", payload: { type: "numeric", answer: 30, hints: ["Remember indexes start at 0: arr[0]=10, arr[1]=20..."], solution: "arr[2] = 30." } },
      { prompt: "In JavaScript: what method is used to add an element to the end of an array?", difficulty: 2, kind: "short", payload: { type: "short", acceptable: ["push", "push()"], hints: ["You push something onto the array."], solution: "`push` adds an item to the end of an array." } },
      { prompt: "If arr = [1, 2, 3], what is the length of arr after arr.pop()?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 2, hints: ["pop() removes the last element."], solution: "Removing the last element reduces the length to 2." } }
    ],
  },
  {
    slug: "recursion",
    name: "Recursion",
    subject: "computer_science",
    baseRating: 1500,
    order: 6,
    prereqs: ["functions"],
    problems: [
      { prompt: "What is the term for a function that calls itself?", difficulty: 1, kind: "short", payload: { type: "short", acceptable: ["recursive function", "recursion", "recursive"], hints: ["It recur-s."], solution: "A function that calls itself is recursive." } },
      { prompt: "What is the condition that stops a recursive function from calling itself infinitely?", difficulty: 2, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["Recursive case", "Base case", "Stop condition", "Breakpoint"], answerIndex: 1, hints: ["It is the 'base' of the recursion."], solution: "The base case halts recursion." } },
      { prompt: "Given: fact(n) = 1 if n<=1 else n * fact(n-1). What is fact(3)?", difficulty: 3, kind: "numeric", payload: { type: "numeric", answer: 6, hints: ["Evaluate fact(3) = 3 * fact(2) = 3 * 2 * fact(1)..."], solution: "3 × 2 × 1 = 6." } }
    ],
  },
  {
    slug: "basic-algorithms",
    name: "Basic Algorithms",
    subject: "computer_science",
    baseRating: 1650,
    order: 7,
    prereqs: ["arrays-lists", "recursion"],
    problems: [
      { prompt: "What is the average time complexity of Binary Search?", difficulty: 2, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["O(n)", "O(1)", "O(log n)", "O(n log n)"], answerIndex: 2, hints: ["It divides the search space in half at each step."], solution: "Binary search runs in logarithmic time O(log n)." } },
      { prompt: "What is the time complexity of Bubble Sort in the worst case?", difficulty: 3, kind: "multiple_choice", payload: { type: "multiple_choice", choices: ["O(n log n)", "O(n)", "O(1)", "O(n^2)"], answerIndex: 3, hints: ["It uses nested loops to compare elements."], solution: "Bubble sort has quadratic time complexity O(n^2) in the worst case." } },
      { prompt: "Which algorithm searches a graph by exploring neighbors first before moving deep?", difficulty: 3, kind: "short", payload: { type: "short", acceptable: ["bfs", "breadth first search", "breadth-first search"], hints: ["Opposite of DFS (Depth First Search)."], solution: "Breadth-First Search (BFS)." } }
    ],
  }
];

const BADGES = [
  { slug: "first-steps", name: "First Steps", description: "Solve your first problem.", tier: "bronze", rule: { type: "total_problems_solved", min: 1 } },
  { slug: "getting-going", name: "Getting Going", description: "Solve 10 problems.", tier: "bronze", rule: { type: "total_problems_solved", min: 10 } },
  { slug: "century", name: "Century", description: "Solve 100 problems.", tier: "silver", rule: { type: "total_problems_solved", min: 100 } },
  { slug: "week-streak", name: "Week Warrior", description: "Reach a 7-day streak.", tier: "silver", rule: { type: "streak_days", min: 7 } },
  { slug: "month-streak", name: "Unstoppable", description: "Reach a 30-day streak.", tier: "gold", rule: { type: "streak_days", min: 30 } },
  { slug: "level-5", name: "Apprentice", description: "Reach level 5.", tier: "bronze", rule: { type: "level_reached", min: 5 } },
  { slug: "level-10", name: "Adept", description: "Reach level 10.", tier: "silver", rule: { type: "level_reached", min: 10 } },
  { slug: "polymath", name: "Polymath", description: "Reach unlock rating in every topic.", tier: "platinum", rule: { type: "all_topics_unlocked" } },
];

const QUESTS = [
  { slug: "solve-3-problems", title: "Daily Practice", description: "Solve 3 problems correctly today.", type: "problems_solved", targetValue: 3, xpReward: 50 },
  { slug: "earn-100-xp", title: "XP Grinder", description: "Earn 100 total XP today.", type: "xp_earned", targetValue: 100, xpReward: 100 },
  { slug: "master-1-topic", title: "Topic Master", description: "Reach a rating of 1100 (Unlock) on any topic.", type: "master_1_topic", targetValue: 1100, xpReward: 150 },
  { slug: "perfect-streak-5", title: "Sharp Shooter", description: "Get a correct-answer streak of 5 problems in a row.", type: "correct_streak", targetValue: 5, xpReward: 200 }
];

async function main() {
  console.log("🌱 Seeding Questline database with expanded content...");

  // Wipe data in dependency order
  await prisma.userQuest.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.classroomMember.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.attempt.deleteMany();
  await prisma.mastery.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.$executeRawUnsafe('DELETE FROM "_TopicPrereqs";');
  await prisma.topic.deleteMany();
  await prisma.user.deleteMany();

  console.log("Wiped old seed data.");

  // 1. Create Topics
  const topicIdBySlug = new Map<string, string>();
  for (const t of TOPICS) {
    const row = await prisma.topic.create({
      data: {
        slug: t.slug,
        name: t.name,
        subject: t.subject,
        baseRating: t.baseRating,
        order: t.order,
      },
    });
    topicIdBySlug.set(t.slug, row.id);
  }

  // 2. Setup Prerequisites
  for (const t of TOPICS) {
    const prereqIds = t.prereqs.map((s) => topicIdBySlug.get(s)!).filter(Boolean);
    if (prereqIds.length > 0) {
      await prisma.topic.update({
        where: { id: topicIdBySlug.get(t.slug)! },
        data: {
          prerequisites: {
            connect: prereqIds.map((id) => ({ id })),
          },
        },
      });
    }
  }

  // 3. Create Problems
  let problemCount = 0;
  for (const t of TOPICS) {
    const topicId = topicIdBySlug.get(t.slug)!;
    for (const p of t.problems) {
      const spread = (p.difficulty - 3) * 60;
      const rating = Math.max(600, Math.min(2400, t.baseRating + spread + 50));
      await prisma.problem.create({
        data: {
          topicId,
          rating,
          difficulty: p.difficulty,
          prompt: p.prompt,
          kind: p.kind,
          payload: JSON.stringify(p.payload),
          subject: t.subject,
        },
      });
      problemCount++;
    }
  }
  console.log(`Created ${problemCount} problems across ${TOPICS.length} topics.`);

  // 4. Create Badges
  for (const b of BADGES) {
    await prisma.badge.create({
      data: {
        slug: b.slug,
        name: b.name,
        description: b.description,
        tier: b.tier,
        rule: JSON.stringify(b.rule),
      },
    });
  }
  console.log(`Created ${BADGES.length} badges.`);

  // 5. Create Quests
  for (const q of QUESTS) {
    await prisma.quest.create({
      data: q,
    });
  }
  console.log(`Created ${QUESTS.length} quests.`);

  // 6. Create Users
  // Standard demo user
  const demo = await prisma.user.create({
    data: {
      username: "demo",
      displayName: "Demo Learner",
      role: "student",
      totalXp: 120,
      level: 2,
      currentStreak: 2,
      longestStreak: 5,
      lastActiveDay: new Date().toISOString().slice(0, 10),
    },
  });

  // Teacher user
  const teacher = await prisma.user.create({
    data: {
      username: "teacher_jane",
      displayName: "Ms. Jane",
      role: "teacher",
    },
  });

  // Mock student users to populate the leaderboard & classrooms
  const mockStudents = [
    { username: "alice", displayName: "Alice Green", totalXp: 1250, level: 6, streak: 8 },
    { username: "bob", displayName: "Bob Smith", totalXp: 450, level: 3, streak: 1 },
    { username: "charlie", displayName: "Charlie Brown", totalXp: 2100, level: 9, streak: 12 },
    { username: "diana", displayName: "Diana Prince", totalXp: 3400, level: 12, streak: 21 },
  ];

  const studentRows = [];
  for (const s of mockStudents) {
    const studentRow = await prisma.user.create({
      data: {
        username: s.username,
        displayName: s.displayName,
        role: "student",
        totalXp: s.totalXp,
        level: s.level,
        currentStreak: s.streak,
        longestStreak: s.streak + 3,
        lastActiveDay: new Date().toISOString().slice(0, 10),
      },
    });
    studentRows.push(studentRow);
  }
  console.log("Created teacher and student accounts.");

  // 7. Create Classroom and enroll students
  const classroom = await prisma.classroom.create({
    data: {
      name: "Ms. Jane's Coding Camp",
      code: "CAMP26",
      teacherId: teacher.id,
    },
  });

  // Enroll demo and mock students
  const membersToEnroll = [demo, ...studentRows];
  for (const m of membersToEnroll) {
    await prisma.classroomMember.create({
      data: {
        classroomId: classroom.id,
        userId: m.id,
      },
    });
  }
  console.log(`Created classroom '${classroom.name}' with code '${classroom.code}' and enrolled all students.`);

  // 8. Create some initial attempts and mastery ratings for mock students
  // to make the leaderboard and classroom heatmap look realistic
  for (const s of studentRows) {
    // Give each student a few masteries
    for (const t of TOPICS.slice(0, 4)) {
      const topicId = topicIdBySlug.get(t.slug)!;
      // Random rating based on student's level
      const rating = t.baseRating + (s.level * 30) + Math.floor(Math.random() * 50);
      await prisma.mastery.create({
        data: {
          userId: s.id,
          topicId,
          rating,
          solved: s.level + 2,
          attempts: s.level + 5,
        },
      });
    }
  }
  console.log("Seeded mock attempts and masteries for classmates.");

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
