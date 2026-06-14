/**
 * English units — a flat K-8 progression. Each unit maps to ONE California
 * CCSS-ELA standard, carries a grade level, and holds 5 questions. The catalog
 * turns each unit into one level; the generator serves the unit's questions.
 *
 * `answer` is the 0-based index into `choices`.
 */

export interface UnitQuestion {
  q: string;
  choices: string[];
  answer: number;
  explain: string;
}

export interface LessonUnit {
  grade: string;     // "K", "1", … "8"
  standard: string;  // CA CCSS-ELA code, e.g. "L.2.5a"
  title: string;     // short skill name shown on the level
  questions: UnitQuestion[]; // 5 per unit
}

export const ENGLISH_UNITS: LessonUnit[] = [
  {
    grade: "K", standard: "RF.K.2a", title: "Rhyming words",
    questions: [
      { q: 'Which word rhymes with "cat"?', choices: ["hat", "dog", "sun", "cup"], answer: 0, explain: '"hat" ends with the same -at sound as "cat".' },
      { q: 'Which word rhymes with "bed"?', choices: ["red", "book", "milk", "top"], answer: 0, explain: '"red" and "bed" both end in -ed.' },
      { q: 'Which word rhymes with "dog"?', choices: ["log", "cat", "pen", "sit"], answer: 0, explain: '"log" and "dog" both end in -og.' },
      { q: 'Which word rhymes with "sun"?', choices: ["run", "map", "bee", "cup"], answer: 0, explain: '"run" and "sun" both end in -un.' },
      { q: 'Which word rhymes with "tree"?', choices: ["bee", "tray", "toe", "cap"], answer: 0, explain: '"bee" and "tree" both end in the long -ee sound.' },
    ],
  },
  {
    grade: "1", standard: "L.1.5a", title: "Word groups",
    questions: [
      { q: "Which one is a kind of fruit?", choices: ["apple", "chair", "shoe", "truck"], answer: 0, explain: "An apple is a fruit; the others are not." },
      { q: "Which one is an animal?", choices: ["rabbit", "table", "spoon", "hat"], answer: 0, explain: "A rabbit is an animal." },
      { q: "Which group are all colors?", choices: ["red, blue, green", "cat, dog, cow", "one, two, three", "run, jump, sit"], answer: 0, explain: "Red, blue, and green are all colors." },
      { q: "Which one does NOT belong with the others?", choices: ["banana", "grape", "orange", "sock"], answer: 3, explain: "A sock is clothing; the rest are fruits." },
      { q: "Which one is something you wear?", choices: ["coat", "lake", "cloud", "drum"], answer: 0, explain: "A coat is clothing you wear." },
    ],
  },
  {
    grade: "2", standard: "L.2.5a", title: "Shades of meaning",
    questions: [
      { q: 'Which word means MORE than "warm"?', choices: ["hot", "cool", "cold", "damp"], answer: 0, explain: '"Hot" is stronger than "warm".' },
      { q: 'Which word means MORE than "big"?', choices: ["huge", "small", "tiny", "short"], answer: 0, explain: '"Huge" is bigger than "big".' },
      { q: 'Which word means a LITTLE happy?', choices: ["pleased", "thrilled", "overjoyed", "ecstatic"], answer: 0, explain: '"Pleased" is mildly happy; the others are very happy.' },
      { q: 'Which is the strongest way to walk fast?', choices: ["sprint", "stroll", "amble", "wander"], answer: 0, explain: '"Sprint" is the fastest; the others are slow.' },
      { q: 'Which word means VERY tired?', choices: ["exhausted", "sleepy", "calm", "fresh"], answer: 0, explain: '"Exhausted" means extremely tired.' },
    ],
  },
  {
    grade: "3", standard: "L.3.4a", title: "Context clues",
    questions: [
      { q: 'The puppy was timid and hid behind the couch. "Timid" means —', choices: ["shy", "brave", "loud", "hungry"], answer: 0, explain: "Hiding shows the puppy was shy (timid)." },
      { q: 'It was an arid desert with almost no water. "Arid" means —', choices: ["very dry", "very wet", "very cold", "very loud"], answer: 0, explain: '"Almost no water" tells you arid means dry.' },
      { q: 'She was elated when she won first prize. "Elated" means —', choices: ["very happy", "very sad", "bored", "sleepy"], answer: 0, explain: "Winning a prize makes you very happy (elated)." },
      { q: 'The fragile glass shattered easily. "Fragile" means —', choices: ["easily broken", "very strong", "heavy", "colorful"], answer: 0, explain: "Shattering easily shows it was fragile (easily broken)." },
      { q: 'They had to cooperate and work together to finish. "Cooperate" means —', choices: ["work together", "argue", "give up", "run away"], answer: 0, explain: '"Work together" is the clue for cooperate.' },
    ],
  },
  {
    grade: "4", standard: "L.4.5b", title: "Idioms & sayings",
    questions: [
      { q: '"It\'s raining cats and dogs" means it is raining —', choices: ["very hard", "very softly", "with animals", "only at night"], answer: 0, explain: "The idiom means it's raining heavily." },
      { q: '"Break a leg" said before a show means —', choices: ["good luck", "be careful", "go home", "sit down"], answer: 0, explain: '"Break a leg" is a way to wish good luck.' },
      { q: '"Hit the books" means to —', choices: ["study hard", "throw books", "take a nap", "go outside"], answer: 0, explain: '"Hit the books" means to study.' },
      { q: 'If something "costs an arm and a leg," it is —', choices: ["very expensive", "free", "broken", "small"], answer: 0, explain: "The idiom means very expensive." },
      { q: '"A piece of cake" means something is —', choices: ["very easy", "very sweet", "very hard", "very small"], answer: 0, explain: '"A piece of cake" means easy.' },
    ],
  },
  {
    grade: "5", standard: "L.5.4b", title: "Greek & Latin roots",
    questions: [
      { q: 'The root "tele" means "far." What does "telescope" help you do?', choices: ["see far away", "hear music", "write fast", "run quickly"], answer: 0, explain: '"Tele" (far) + "scope" (see) = see far.' },
      { q: 'The root "aqua" means "water." An "aquarium" holds —', choices: ["water and fish", "books", "sand", "fire"], answer: 0, explain: '"Aqua" means water, so an aquarium holds water.' },
      { q: 'The root "bio" means "life." "Biology" is the study of —', choices: ["living things", "rocks", "numbers", "stars"], answer: 0, explain: '"Bio" (life) + "ology" (study) = study of life.' },
      { q: 'The prefix "tri-" means "three." A "triangle" has —', choices: ["three sides", "two sides", "four sides", "no sides"], answer: 0, explain: '"Tri" means three, so a triangle has three sides.' },
      { q: 'The root "port" means "carry." To "transport" something is to —', choices: ["carry it across", "break it", "hide it", "paint it"], answer: 0, explain: '"Trans" (across) + "port" (carry) = carry across.' },
    ],
  },
  {
    grade: "6", standard: "L.6.5b", title: "Word relationships",
    questions: [
      { q: "Hot is to cold as up is to —", choices: ["down", "tall", "fast", "warm"], answer: 0, explain: "These are opposites: hot/cold, up/down." },
      { q: "Kitten is to cat as puppy is to —", choices: ["dog", "bird", "fish", "cow"], answer: 0, explain: "A kitten is a young cat; a puppy is a young dog." },
      { q: "Which word is a SYNONYM for 'enormous'?", choices: ["gigantic", "tiny", "quiet", "smooth"], answer: 0, explain: "Gigantic and enormous both mean very large." },
      { q: "Which word is an ANTONYM for 'generous'?", choices: ["stingy", "kind", "giving", "helpful"], answer: 0, explain: "Stingy (not giving) is the opposite of generous." },
      { q: "Author is to book as painter is to —", choices: ["painting", "brush", "wall", "color"], answer: 0, explain: "An author creates a book; a painter creates a painting." },
    ],
  },
  {
    grade: "8", standard: "L.8.5a", title: "Figurative language",
    questions: [
      { q: '"The classroom was a zoo." This is a —', choices: ["metaphor", "simile", "rhyme", "fact"], answer: 0, explain: "It compares without using like/as, so it's a metaphor." },
      { q: '"As busy as a bee" is a —', choices: ["simile", "metaphor", "pun", "definition"], answer: 0, explain: 'It uses "as … as," so it is a simile.' },
      { q: '"The wind whispered through the trees" gives the wind a human action. This is —', choices: ["personification", "hyperbole", "simile", "alliteration"], answer: 0, explain: "Giving non-human things human traits is personification." },
      { q: '"I\'ve told you a million times!" is an example of —', choices: ["hyperbole", "metaphor", "simile", "irony"], answer: 0, explain: "Exaggeration for effect is hyperbole." },
      { q: '"Peter Piper picked a peck" repeats the /p/ sound. This is —', choices: ["alliteration", "metaphor", "hyperbole", "simile"], answer: 0, explain: "Repeating the beginning sound is alliteration." },
    ],
  },
];
