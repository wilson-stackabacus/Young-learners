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

const U = (grade: string, standard: string, title: string, questions: UnitQuestion[]): LessonUnit => ({ grade, standard, title, questions });

export const ENGLISH_UNITS: LessonUnit[] = [
  // ── Grade K ──
  U("K", "RF.K.2a", "Rhyming words", [
    { q: 'Which word rhymes with "cat"?', choices: ["hat", "dog", "sun", "cup"], answer: 0, explain: '"hat" ends with the same -at sound as "cat".' },
    { q: 'Which word rhymes with "bed"?', choices: ["red", "book", "milk", "top"], answer: 0, explain: '"red" and "bed" both end in -ed.' },
    { q: 'Which word rhymes with "dog"?', choices: ["log", "cat", "pen", "sit"], answer: 0, explain: '"log" and "dog" both end in -og.' },
    { q: 'Which word rhymes with "sun"?', choices: ["run", "map", "bee", "cup"], answer: 0, explain: '"run" and "sun" both end in -un.' },
    { q: 'Which word rhymes with "tree"?', choices: ["bee", "tray", "toe", "cap"], answer: 0, explain: '"bee" and "tree" both end in the long -ee sound.' },
  ]),
  U("K", "RF.K.2d", "Beginning sounds", [
    { q: 'Which word begins with the /b/ sound?', choices: ["ball", "cat", "sun", "dog"], answer: 0, explain: '"ball" starts with the /b/ sound.' },
    { q: 'Which word begins with the /s/ sound?', choices: ["sock", "hat", "mop", "pen"], answer: 0, explain: '"sock" starts with /s/.' },
    { q: 'Which word begins with the /m/ sound?', choices: ["moon", "fish", "log", "rug"], answer: 0, explain: '"moon" starts with /m/.' },
    { q: 'Which word begins with the same sound as "dog"?', choices: ["duck", "cat", "bee", "fan"], answer: 0, explain: 'Both "dog" and "duck" start with /d/.' },
    { q: 'Which word begins with the /t/ sound?', choices: ["top", "nap", "bug", "win"], answer: 0, explain: '"top" starts with /t/.' },
  ]),
  U("K", "RF.K.3c", "Sight words", [
    { q: 'Read the word: the. Finish the sentence: "I see ___ dog."', choices: ["the", "and", "is", "go"], answer: 0, explain: '"I see the dog." uses the sight word "the".' },
    { q: 'Which is the word "and"?', choices: ["and", "ant", "end", "are"], answer: 0, explain: '"and" is spelled a-n-d.' },
    { q: 'Finish: "She ___ happy."', choices: ["is", "the", "and", "to"], answer: 0, explain: '"She is happy." uses the sight word "is".' },
    { q: 'Which word means more than one when we say "I like ___"?', choices: ["it", "is", "the", "a"], answer: 0, explain: '"I like it." uses the sight word "it".' },
    { q: 'Finish: "We ___ to play."', choices: ["like", "the", "is", "and"], answer: 0, explain: '"We like to play." uses the sight word "like".' },
  ]),
  U("K", "L.K.5b", "Opposites", [
    { q: 'What is the opposite of "big"?', choices: ["small", "tall", "round", "fast"], answer: 0, explain: '"Small" is the opposite of "big".' },
    { q: 'What is the opposite of "up"?', choices: ["down", "over", "in", "left"], answer: 0, explain: '"Down" is the opposite of "up".' },
    { q: 'What is the opposite of "hot"?', choices: ["cold", "warm", "wet", "soft"], answer: 0, explain: '"Cold" is the opposite of "hot".' },
    { q: 'What is the opposite of "happy"?', choices: ["sad", "glad", "kind", "loud"], answer: 0, explain: '"Sad" is the opposite of "happy".' },
    { q: 'What is the opposite of "day"?', choices: ["night", "morning", "sun", "week"], answer: 0, explain: '"Night" is the opposite of "day".' },
  ]),
  U("K", "L.K.5a", "Sorting groups", [
    { q: "Which one is a food?", choices: ["apple", "chair", "shoe", "car"], answer: 0, explain: "An apple is a food." },
    { q: "Which one is an animal?", choices: ["cow", "cup", "hat", "rock"], answer: 0, explain: "A cow is an animal." },
    { q: "Which group are all colors?", choices: ["red, blue, green", "cat, dog, cow", "one, two, three", "hat, sock, coat"], answer: 0, explain: "Red, blue, and green are colors." },
    { q: "Which one is a toy?", choices: ["ball", "soup", "tree", "door"], answer: 0, explain: "A ball is a toy." },
    { q: "Which one does NOT belong: dog, cat, fish, spoon?", choices: ["spoon", "dog", "cat", "fish"], answer: 0, explain: "A spoon is not an animal." },
  ]),
  U("K", "L.K.5c", "Words in real life", [
    { q: "Where would you sleep?", choices: ["bed", "sink", "car", "box"], answer: 0, explain: "You sleep in a bed." },
    { q: "What do you use to eat soup?", choices: ["spoon", "shoe", "book", "cup"], answer: 0, explain: "You use a spoon to eat soup." },
    { q: "Where do fish live?", choices: ["water", "trees", "beds", "shoes"], answer: 0, explain: "Fish live in water." },
    { q: "What do you wear on your feet?", choices: ["shoes", "hats", "gloves", "belts"], answer: 0, explain: "You wear shoes on your feet." },
    { q: "What do you use to see in the dark?", choices: ["light", "spoon", "ball", "chair"], answer: 0, explain: "A light helps you see in the dark." },
  ]),

  // ── Grade 1 ──
  U("1", "L.1.5a", "Word groups", [
    { q: "Which one is a kind of fruit?", choices: ["apple", "chair", "shoe", "truck"], answer: 0, explain: "An apple is a fruit." },
    { q: "Which one is an animal?", choices: ["rabbit", "table", "spoon", "hat"], answer: 0, explain: "A rabbit is an animal." },
    { q: "Which group are all vehicles?", choices: ["car, bus, train", "red, blue, green", "cat, dog, cow", "one, two, three"], answer: 0, explain: "Car, bus, and train are vehicles." },
    { q: "Which one does NOT belong: banana, grape, orange, sock?", choices: ["sock", "banana", "grape", "orange"], answer: 0, explain: "A sock is clothing; the rest are fruits." },
    { q: "Which one is something you wear?", choices: ["coat", "lake", "cloud", "drum"], answer: 0, explain: "A coat is clothing you wear." },
  ]),
  U("1", "L.1.5b", "Describe by attributes", [
    { q: "A ball is round. Which other thing is round?", choices: ["sun", "book", "door", "box"], answer: 0, explain: "The sun is round, like a ball." },
    { q: "Ice is cold. Which other thing is cold?", choices: ["snow", "fire", "lamp", "oven"], answer: 0, explain: "Snow is cold, like ice." },
    { q: "A feather is soft. Which other thing is soft?", choices: ["pillow", "rock", "brick", "nail"], answer: 0, explain: "A pillow is soft, like a feather." },
    { q: "A lemon is sour. Which other thing is sour?", choices: ["lime", "candy", "cake", "honey"], answer: 0, explain: "A lime is sour, like a lemon." },
    { q: "An elephant is big. Which other thing is big?", choices: ["whale", "ant", "bee", "pea"], answer: 0, explain: "A whale is big, like an elephant." },
  ]),
  U("1", "L.1.4a", "Sentence clues", [
    { q: 'The bird flew up into the sky. "Flew" tells us the bird —', choices: ["moved through the air", "ate food", "went to sleep", "sang a song"], answer: 0, explain: '"Flew" means moved through the air.' },
    { q: 'The baby began to giggle and smile. "Giggle" means —', choices: ["laugh", "cry", "sleep", "fall"], answer: 0, explain: "Smiling shows giggle means laugh." },
    { q: 'It was so cold that we began to shiver. "Shiver" means —', choices: ["shake from cold", "run fast", "feel hot", "jump high"], answer: 0, explain: "Being cold makes you shiver (shake)." },
    { q: 'The soup was tasty, so I ate it all. "Tasty" means —', choices: ["good to eat", "very cold", "too big", "broken"], answer: 0, explain: "Eating it all shows it was tasty." },
    { q: 'The puppy was tiny and fit in my hand. "Tiny" means —', choices: ["very small", "very big", "very loud", "very fast"], answer: 0, explain: "Fitting in a hand shows tiny means small." },
  ]),
  U("1", "L.1.4b", "Endings: -s and -ed", [
    { q: 'More than one cat is spelled —', choices: ["cats", "cat", "cates", "catt"], answer: 0, explain: "Add -s to make a plural: cats." },
    { q: 'Yesterday I ___ to the park. (walk)', choices: ["walked", "walks", "walk", "walking"], answer: 0, explain: "Add -ed for the past: walked." },
    { q: 'More than one box is spelled —', choices: ["boxes", "boxs", "box", "boxx"], answer: 0, explain: "Words ending in -x add -es: boxes." },
    { q: 'She ___ the ball yesterday. (kick)', choices: ["kicked", "kicks", "kick", "kicking"], answer: 0, explain: "Past tense adds -ed: kicked." },
    { q: 'More than one dog is spelled —', choices: ["dogs", "dog", "doges", "dogg"], answer: 0, explain: "Add -s: dogs." },
  ]),
  U("1", "L.1.5d", "Shades: action words", [
    { q: "Which word shows the LOUDEST way to talk?", choices: ["shout", "whisper", "mumble", "say"], answer: 0, explain: '"Shout" is the loudest.' },
    { q: "Which word shows the FASTEST way to go?", choices: ["race", "walk", "stroll", "crawl"], answer: 0, explain: '"Race" is the fastest.' },
    { q: "Which word means to look very closely?", choices: ["stare", "glance", "peek", "blink"], answer: 0, explain: '"Stare" means to look long and closely.' },
    { q: "Which word shows being VERY happy?", choices: ["thrilled", "okay", "fine", "calm"], answer: 0, explain: '"Thrilled" means very happy.' },
    { q: "Which word means to eat quickly?", choices: ["gobble", "nibble", "taste", "sip"], answer: 0, explain: '"Gobble" means to eat fast.' },
  ]),
  U("1", "RF.1.3", "Vowel sounds", [
    { q: 'Which word has the LONG a sound (like "cake")?', choices: ["rain", "cat", "bed", "dog"], answer: 0, explain: '"Rain" has the long-a sound.' },
    { q: 'Which word has the SHORT i sound (like "sit")?', choices: ["pig", "kite", "boat", "tree"], answer: 0, explain: '"Pig" has the short-i sound.' },
    { q: 'Which word has the LONG e sound (like "bee")?', choices: ["leaf", "egg", "cup", "fox"], answer: 0, explain: '"Leaf" has the long-e sound.' },
    { q: 'Which word has the SHORT o sound (like "hot")?', choices: ["pot", "rope", "rain", "mule"], answer: 0, explain: '"Pot" has the short-o sound.' },
    { q: 'Which word has the LONG o sound (like "go")?', choices: ["boat", "dog", "cat", "pig"], answer: 0, explain: '"Boat" has the long-o sound.' },
  ]),

  // ── Grade 2 ──
  U("2", "L.2.5a", "Shades of meaning", [
    { q: 'Which word means MORE than "warm"?', choices: ["hot", "cool", "cold", "damp"], answer: 0, explain: '"Hot" is stronger than "warm".' },
    { q: 'Which word means MORE than "big"?', choices: ["huge", "small", "tiny", "short"], answer: 0, explain: '"Huge" is bigger than "big".' },
    { q: 'Which word means a LITTLE happy?', choices: ["pleased", "thrilled", "overjoyed", "ecstatic"], answer: 0, explain: '"Pleased" is mildly happy.' },
    { q: 'Which is the strongest way to walk fast?', choices: ["sprint", "stroll", "amble", "wander"], answer: 0, explain: '"Sprint" is the fastest.' },
    { q: 'Which word means VERY tired?', choices: ["exhausted", "sleepy", "calm", "fresh"], answer: 0, explain: '"Exhausted" means extremely tired.' },
  ]),
  U("2", "L.2.4a", "Context clues", [
    { q: 'The path was so narrow only one person could pass. "Narrow" means —', choices: ["thin / not wide", "very wide", "very long", "very dark"], answer: 0, explain: "Only one person fitting shows narrow means thin." },
    { q: 'She felt joyful and danced around. "Joyful" means —', choices: ["full of joy", "very angry", "very tired", "afraid"], answer: 0, explain: "Dancing shows joyful means full of joy." },
    { q: 'The soup was bland, so I added salt. "Bland" means —', choices: ["not much flavor", "too spicy", "very hot", "very sweet"], answer: 0, explain: "Adding salt shows bland means little flavor." },
    { q: 'He spoke in a calm, gentle voice. "Gentle" means —', choices: ["soft and kind", "loud and rough", "fast", "scary"], answer: 0, explain: '"Calm" tells us gentle means soft and kind.' },
    { q: 'The store was vacant with no people inside. "Vacant" means —', choices: ["empty", "crowded", "noisy", "bright"], answer: 0, explain: '"No people" shows vacant means empty.' },
  ]),
  U("2", "L.2.4b", "Prefixes un- and re-", [
    { q: '"Unhappy" means —', choices: ["not happy", "very happy", "happy again", "almost happy"], answer: 0, explain: "The prefix un- means 'not'." },
    { q: '"Redo" means to —', choices: ["do again", "not do", "do quickly", "stop doing"], answer: 0, explain: "The prefix re- means 'again'." },
    { q: '"Unlock" means to —', choices: ["open a lock", "lock again", "break", "close"], answer: 0, explain: "Un- reverses the action: unlock = open a lock." },
    { q: '"Refill" means to —', choices: ["fill again", "empty", "not fill", "spill"], answer: 0, explain: "Re- means again: refill = fill again." },
    { q: '"Unkind" means —', choices: ["not kind", "very kind", "kind again", "a little kind"], answer: 0, explain: "Un- means 'not': unkind = not kind." },
  ]),
  U("2", "L.2.4c", "Endings -ful and -less", [
    { q: '"Helpful" means —', choices: ["full of help", "without help", "needing help", "not helping"], answer: 0, explain: "The ending -ful means 'full of'." },
    { q: '"Fearless" means —', choices: ["without fear", "full of fear", "a little afraid", "very afraid"], answer: 0, explain: "The ending -less means 'without'." },
    { q: '"Colorful" means —', choices: ["full of color", "without color", "one color", "no color"], answer: 0, explain: "-ful means full of: colorful = full of color." },
    { q: '"Careless" means —', choices: ["without care", "full of care", "very careful", "a little careful"], answer: 0, explain: "-less means without: careless = without care." },
    { q: '"Joyful" means —', choices: ["full of joy", "without joy", "a little sad", "tired"], answer: 0, explain: "-ful means full of: joyful = full of joy." },
  ]),
  U("2", "L.2.4d", "Compound words", [
    { q: 'What two words make "sunshine"?', choices: ["sun + shine", "sun + shy", "sing + shine", "sun + shore"], answer: 0, explain: '"Sunshine" = sun + shine.' },
    { q: '"Rainbow" is made of —', choices: ["rain + bow", "ran + bow", "rain + boy", "rail + bow"], answer: 0, explain: '"Rainbow" = rain + bow.' },
    { q: 'A "bedroom" is a room with a —', choices: ["bed", "broom", "door", "rug"], answer: 0, explain: '"Bedroom" = bed + room.' },
    { q: '"Football" combines —', choices: ["foot + ball", "fool + ball", "foot + bell", "for + ball"], answer: 0, explain: '"Football" = foot + ball.' },
    { q: 'A "butterfly" is made of —', choices: ["butter + fly", "but + fly", "butter + fry", "batter + fly"], answer: 0, explain: '"Butterfly" = butter + fly.' },
  ]),
  U("2", "L.2.5b", "Verbs in real life", [
    { q: "Which verb goes with a hungry person?", choices: ["eat", "sleep", "swim", "sing"], answer: 0, explain: "A hungry person wants to eat." },
    { q: "Which verb goes with a tired person?", choices: ["rest", "run", "jump", "shout"], answer: 0, explain: "A tired person wants to rest." },
    { q: "Which verb goes with a bird?", choices: ["fly", "drive", "read", "cook"], answer: 0, explain: "Birds fly." },
    { q: "Which verb goes with a swimmer?", choices: ["swim", "bake", "write", "drive"], answer: 0, explain: "A swimmer swims." },
    { q: "Which verb goes with a singer?", choices: ["sing", "dig", "paint", "fly"], answer: 0, explain: "A singer sings." },
  ]),

  // ── Grade 3 ──
  U("3", "L.3.4a", "Context clues", [
    { q: 'The puppy was timid and hid behind the couch. "Timid" means —', choices: ["shy", "brave", "loud", "hungry"], answer: 0, explain: "Hiding shows timid means shy." },
    { q: 'It was an arid desert with almost no water. "Arid" means —', choices: ["very dry", "very wet", "very cold", "very loud"], answer: 0, explain: '"Almost no water" shows arid means dry.' },
    { q: 'She was elated when she won first prize. "Elated" means —', choices: ["very happy", "very sad", "bored", "sleepy"], answer: 0, explain: "Winning makes you elated (very happy)." },
    { q: 'The fragile glass shattered easily. "Fragile" means —', choices: ["easily broken", "very strong", "heavy", "colorful"], answer: 0, explain: "Shattering easily shows fragile means easily broken." },
    { q: 'They had to cooperate and work together. "Cooperate" means —', choices: ["work together", "argue", "give up", "run away"], answer: 0, explain: '"Work together" defines cooperate.' },
  ]),
  U("3", "L.3.4b", "Affixes", [
    { q: '"Unable" means —', choices: ["not able", "able again", "very able", "almost able"], answer: 0, explain: "Un- means 'not'." },
    { q: '"Replay" means to —', choices: ["play again", "stop playing", "not play", "play badly"], answer: 0, explain: "Re- means 'again'." },
    { q: '"Painless" means —', choices: ["without pain", "full of pain", "a little pain", "more pain"], answer: 0, explain: "-less means 'without'." },
    { q: '"Comfortable" means able to give —', choices: ["comfort", "danger", "speed", "noise"], answer: 0, explain: "-able means 'able to'; comfortable = able to give comfort." },
    { q: '"Disagree" means to —', choices: ["not agree", "agree strongly", "agree again", "almost agree"], answer: 0, explain: "Dis- means 'not/opposite'." },
  ]),
  U("3", "L.3.4c", "Root words", [
    { q: 'In "rebuilding," the root word is —', choices: ["build", "rebuild", "building", "re"], answer: 0, explain: "Take off re- and -ing to find the root: build." },
    { q: 'In "helpful," the root word is —', choices: ["help", "helpf", "ful", "helpful"], answer: 0, explain: "Take off -ful: the root is help." },
    { q: 'In "unkindly," the root word is —', choices: ["kind", "unkind", "kindly", "un"], answer: 0, explain: "Remove un- and -ly to find kind." },
    { q: 'In "teacher," the root word is —', choices: ["teach", "teac", "her", "teache"], answer: 0, explain: "Remove -er: the root is teach." },
    { q: 'In "darkness," the root word is —', choices: ["dark", "darknes", "ness", "darkn"], answer: 0, explain: "Remove -ness: the root is dark." },
  ]),
  U("3", "L.3.5a", "Literal or not?", [
    { q: '"It is raining cats and dogs." This really means —', choices: ["it is raining hard", "animals are falling", "it is sunny", "pets are outside"], answer: 0, explain: "It's a saying meaning heavy rain." },
    { q: '"He has a green thumb." This means he is —', choices: ["good at growing plants", "cold", "sick", "painting"], answer: 0, explain: "A 'green thumb' means good at gardening." },
    { q: '"Break the ice" at a party means —', choices: ["start a friendly talk", "drop ice", "feel cold", "leave early"], answer: 0, explain: "It means to start a conversation." },
    { q: 'Which sentence is LITERAL (says exactly what it means)?', choices: ["The dog ran to the door.", "Time flies.", "She is a night owl.", "He is all ears."], answer: 0, explain: "The dog literally ran; the others are figures of speech." },
    { q: '"You are the apple of my eye" means someone is —', choices: ["very loved", "a fruit", "round", "red"], answer: 0, explain: "It means someone is dear/loved." },
  ]),
  U("3", "L.3.5c", "Synonyms & antonyms", [
    { q: "Which word is a SYNONYM for 'big'?", choices: ["large", "small", "thin", "short"], answer: 0, explain: "Large and big mean the same." },
    { q: "Which word is an ANTONYM for 'fast'?", choices: ["slow", "quick", "rapid", "speedy"], answer: 0, explain: "Slow is the opposite of fast." },
    { q: "Which word is a SYNONYM for 'happy'?", choices: ["glad", "sad", "angry", "tired"], answer: 0, explain: "Glad and happy mean the same." },
    { q: "Which word is an ANTONYM for 'begin'?", choices: ["end", "start", "open", "go"], answer: 0, explain: "End is the opposite of begin." },
    { q: "Which word is a SYNONYM for 'tired'?", choices: ["weary", "fresh", "awake", "lively"], answer: 0, explain: "Weary and tired mean the same." },
  ]),
  U("3", "RI.3.4", "Academic words", [
    { q: 'In science, "observe" means to —', choices: ["watch carefully", "guess", "ignore", "destroy"], answer: 0, explain: "Observe means to watch closely." },
    { q: 'A "predict" is a —', choices: ["guess about what will happen", "fact from the past", "drawing", "question"], answer: 0, explain: "To predict is to guess what will happen." },
    { q: 'To "compare" two things is to find how they are —', choices: ["alike", "broken", "colored", "counted"], answer: 0, explain: "Compare looks at how things are alike." },
    { q: 'A "sequence" is the —', choices: ["order things happen in", "color of an object", "name of a place", "size of a thing"], answer: 0, explain: "Sequence is the order of events." },
    { q: 'To "describe" something is to —', choices: ["tell what it is like", "throw it", "hide it", "count it"], answer: 0, explain: "Describe means to tell about it." },
  ]),

  // ── Grade 4 ──
  U("4", "L.4.5b", "Idioms & sayings", [
    { q: '"It\'s raining cats and dogs" means it is raining —', choices: ["very hard", "very softly", "with animals", "only at night"], answer: 0, explain: "The idiom means raining heavily." },
    { q: '"Break a leg" before a show means —', choices: ["good luck", "be careful", "go home", "sit down"], answer: 0, explain: '"Break a leg" wishes good luck.' },
    { q: '"Hit the books" means to —', choices: ["study hard", "throw books", "take a nap", "go outside"], answer: 0, explain: "It means to study." },
    { q: 'If something "costs an arm and a leg," it is —', choices: ["very expensive", "free", "broken", "small"], answer: 0, explain: "It means very expensive." },
    { q: '"A piece of cake" means something is —', choices: ["very easy", "very sweet", "very hard", "very small"], answer: 0, explain: "It means easy." },
  ]),
  U("4", "L.4.4a", "Context clues", [
    { q: 'The hikers were exhausted after the long climb. "Exhausted" means —', choices: ["very tired", "very happy", "very fast", "very cold"], answer: 0, explain: "After a long climb you are exhausted (very tired)." },
    { q: 'The ancient ruins were thousands of years old. "Ancient" means —', choices: ["very old", "brand new", "very small", "very tall"], answer: 0, explain: '"Thousands of years" shows ancient means very old.' },
    { q: 'Her explanation was clear, so everyone understood. "Clear" means —', choices: ["easy to understand", "confusing", "loud", "short"], answer: 0, explain: "Everyone understanding shows clear means easy to understand." },
    { q: 'The stubborn mule refused to move. "Stubborn" means —', choices: ["unwilling to change", "very fast", "very kind", "very weak"], answer: 0, explain: "Refusing to move shows stubborn." },
    { q: 'They found an abundant supply of food, more than enough. "Abundant" means —', choices: ["plentiful", "scarce", "spoiled", "tiny"], answer: 0, explain: '"More than enough" shows abundant means plentiful.' },
  ]),
  U("4", "L.4.4b", "Greek & Latin roots", [
    { q: 'The root "tele" means "far." A "telescope" lets you —', choices: ["see far away", "hear music", "write fast", "run quickly"], answer: 0, explain: "tele (far) + scope (see)." },
    { q: 'The root "aqua" means "water." An "aquarium" holds —', choices: ["water and fish", "books", "sand", "fire"], answer: 0, explain: "aqua means water." },
    { q: 'The root "bio" means "life." "Biology" is the study of —', choices: ["living things", "rocks", "numbers", "stars"], answer: 0, explain: "bio (life) + ology (study)." },
    { q: 'The prefix "tri-" means "three." A "triangle" has —', choices: ["three sides", "two sides", "four sides", "no sides"], answer: 0, explain: "tri- means three." },
    { q: 'The root "port" means "carry." To "transport" is to —', choices: ["carry across", "break", "hide", "paint"], answer: 0, explain: "trans (across) + port (carry)." },
  ]),
  U("4", "L.4.5a", "Similes & metaphors", [
    { q: '"As brave as a lion" is a —', choices: ["simile", "metaphor", "rhyme", "fact"], answer: 0, explain: 'It uses "as … as," so it is a simile.' },
    { q: '"The snow was a white blanket." This is a —', choices: ["metaphor", "simile", "question", "list"], answer: 0, explain: "It compares without like/as, so it's a metaphor." },
    { q: '"She runs like the wind." This means she runs —', choices: ["very fast", "very slowly", "in circles", "while sleeping"], answer: 0, explain: "The simile means very fast." },
    { q: 'Which sentence is a SIMILE?', choices: ["The baby was as quiet as a mouse.", "The baby slept.", "Time is money.", "He is a star."], answer: 0, explain: 'Only the first uses "as … as".' },
    { q: '"Her smile was sunshine." This metaphor means her smile was —', choices: ["warm and bright", "cold", "dark", "small"], answer: 0, explain: "Sunshine suggests warm and bright." },
  ]),
  U("4", "L.4.5c", "Synonyms & antonyms", [
    { q: "Which word is a SYNONYM for 'enormous'?", choices: ["gigantic", "tiny", "quiet", "smooth"], answer: 0, explain: "Gigantic and enormous both mean very large." },
    { q: "Which word is an ANTONYM for 'generous'?", choices: ["stingy", "kind", "giving", "helpful"], answer: 0, explain: "Stingy is the opposite of generous." },
    { q: "Which word is a SYNONYM for 'brave'?", choices: ["courageous", "fearful", "timid", "weak"], answer: 0, explain: "Courageous and brave mean the same." },
    { q: "Which word is an ANTONYM for 'ancient'?", choices: ["modern", "old", "aged", "antique"], answer: 0, explain: "Modern is the opposite of ancient." },
    { q: "Which word is a SYNONYM for 'difficult'?", choices: ["hard", "easy", "simple", "light"], answer: 0, explain: "Hard and difficult mean the same." },
  ]),
  U("4", "L.4.4c", "Homophones", [
    { q: 'Choose the right word: "I can ___ the music." (hear/here)', choices: ["hear", "here", "heir", "her"], answer: 0, explain: '"Hear" means to listen.' },
    { q: 'Choose: "They lost ___ ball." (their/there)', choices: ["their", "there", "they’re", "thair"], answer: 0, explain: '"Their" shows it belongs to them.' },
    { q: 'Choose: "The wind ___ all night." (blew/blue)', choices: ["blew", "blue", "blow", "below"], answer: 0, explain: '"Blew" is the past tense of blow.' },
    { q: 'Choose: "She ate a ___." (pear/pair)', choices: ["pear", "pair", "pare", "peer"], answer: 0, explain: '"Pear" is the fruit.' },
    { q: 'Choose: "Do you know the ___?" (way/weigh)', choices: ["way", "weigh", "wey", "whey"], answer: 0, explain: '"Way" means path or direction.' },
  ]),

  // ── Grade 5 ──
  U("5", "L.5.4b", "Greek & Latin roots", [
    { q: 'The root "spect" means "look." A "spectator" is someone who —', choices: ["watches", "speaks", "runs", "cooks"], answer: 0, explain: "spect (look) → spectator watches." },
    { q: 'The root "dict" means "say." To "predict" is to say —', choices: ["beforehand", "loudly", "quietly", "never"], answer: 0, explain: "pre (before) + dict (say)." },
    { q: 'The root "geo" means "earth." "Geology" is the study of —', choices: ["the earth and rocks", "the sky", "animals", "numbers"], answer: 0, explain: "geo (earth) + ology (study)." },
    { q: 'The prefix "auto" means "self." An "autobiography" is written about —', choices: ["yourself", "a friend", "an animal", "a place"], answer: 0, explain: "auto (self) + bio (life)." },
    { q: 'The root "struct" means "build." To "construct" is to —', choices: ["build", "destroy", "hide", "paint"], answer: 0, explain: "construct = build." },
  ]),
  U("5", "L.5.4a", "Context clues", [
    { q: 'The scientist was meticulous, checking every detail. "Meticulous" means —', choices: ["very careful", "very careless", "very fast", "very loud"], answer: 0, explain: '"Checking every detail" shows meticulous means careful.' },
    { q: 'The crowd was enormous, filling the whole stadium. "Enormous" means —', choices: ["very large", "very small", "very quiet", "very old"], answer: 0, explain: "Filling a stadium shows enormous means large." },
    { q: 'His argument was persuasive and convinced everyone. "Persuasive" means —', choices: ["convincing", "boring", "confusing", "untrue"], answer: 0, explain: "Convincing everyone shows persuasive." },
    { q: 'They felt reluctant and did not want to go. "Reluctant" means —', choices: ["unwilling", "eager", "excited", "ready"], answer: 0, explain: '"Did not want to" shows reluctant means unwilling.' },
    { q: 'The lake was tranquil, calm and still. "Tranquil" means —', choices: ["peaceful", "stormy", "crowded", "noisy"], answer: 0, explain: '"Calm and still" shows tranquil means peaceful.' },
  ]),
  U("5", "L.5.5a", "Figurative language", [
    { q: '"The wind whispered." This gives the wind a human action, called —', choices: ["personification", "simile", "hyperbole", "fact"], answer: 0, explain: "Giving human traits to things is personification." },
    { q: '"I\'m so hungry I could eat a horse" is —', choices: ["hyperbole (exaggeration)", "a simile", "a fact", "personification"], answer: 0, explain: "Big exaggeration is hyperbole." },
    { q: '"Life is a journey." This is a —', choices: ["metaphor", "simile", "rhyme", "question"], answer: 0, explain: "It compares without like/as → metaphor." },
    { q: '"The stars danced in the sky." This is —', choices: ["personification", "hyperbole", "simile", "a fact"], answer: 0, explain: "Stars 'dancing' is personification." },
    { q: '"As light as a feather" is a —', choices: ["simile", "metaphor", "pun", "fact"], answer: 0, explain: '"As … as" → simile.' },
  ]),
  U("5", "L.5.5b", "Idioms, adages, proverbs", [
    { q: '"The early bird catches the worm" means —', choices: ["acting early brings success", "birds eat worms", "wake up late", "worms are fast"], answer: 0, explain: "It's a proverb about acting early." },
    { q: '"Don\'t count your chickens before they hatch" means —', choices: ["don’t depend on something not done yet", "buy more chickens", "wait for eggs", "count carefully"], answer: 0, explain: "Don't assume success too soon." },
    { q: '"Practice makes perfect" means —', choices: ["doing it often makes you better", "perfect people practice", "stop practicing", "be perfect first"], answer: 0, explain: "Repeated practice improves skill." },
    { q: '"Bite off more than you can chew" means to —', choices: ["take on too much", "eat fast", "chew gum", "be hungry"], answer: 0, explain: "It means to attempt too much." },
    { q: '"When in Rome, do as the Romans do" means —', choices: ["follow local customs", "travel to Rome", "build a city", "learn Latin"], answer: 0, explain: "Adapt to where you are." },
  ]),
  U("5", "L.5.5c", "Homographs", [
    { q: 'In "I will bow to the queen," "bow" means —', choices: ["bend forward", "a hair ribbon", "a weapon", "the front of a ship"], answer: 0, explain: "Bow (rhymes with cow) = bend forward." },
    { q: 'In "The wind blew," "wind" means —', choices: ["moving air", "to twist", "to wrap", "a clock part"], answer: 0, explain: "Wind (air) vs. wind (to twist) are homographs." },
    { q: 'In "A tear rolled down her cheek," "tear" means —', choices: ["a drop from crying", "to rip", "fear", "a year"], answer: 0, explain: "Tear (crying) vs. tear (rip)." },
    { q: 'In "Lead is a heavy metal," "lead" means —', choices: ["a metal", "to guide", "a leash", "a story"], answer: 0, explain: "Lead (metal) vs. lead (guide)." },
    { q: 'In "Please close the door," "close" means —', choices: ["to shut", "nearby", "a friend", "to finish"], answer: 0, explain: "Close (shut) vs. close (near)." },
  ]),
  U("5", "L.5.6", "Academic vocabulary", [
    { q: '"Analyze" means to —', choices: ["examine in detail", "ignore", "memorize", "copy"], answer: 0, explain: "Analyze = examine carefully." },
    { q: '"Summarize" means to —', choices: ["give the main points briefly", "add details", "draw a picture", "ask a question"], answer: 0, explain: "Summarize = restate briefly." },
    { q: 'A "conclusion" is —', choices: ["a final judgment or ending", "the first idea", "a title", "a guess"], answer: 0, explain: "Conclusion = the end / decision." },
    { q: '"Evidence" is —', choices: ["facts that support an idea", "an opinion", "a question", "a story"], answer: 0, explain: "Evidence supports a claim." },
    { q: 'To "infer" is to —', choices: ["figure out using clues", "state directly", "ignore", "repeat"], answer: 0, explain: "Infer = conclude from clues." },
  ]),

  // ── Grade 6 ──
  U("6", "L.6.5b", "Word relationships", [
    { q: "Hot is to cold as up is to —", choices: ["down", "tall", "fast", "warm"], answer: 0, explain: "Opposites: hot/cold, up/down." },
    { q: "Kitten is to cat as puppy is to —", choices: ["dog", "bird", "fish", "cow"], answer: 0, explain: "Young animal to adult." },
    { q: "Author is to book as painter is to —", choices: ["painting", "brush", "wall", "color"], answer: 0, explain: "Creator to creation." },
    { q: "Finger is to hand as toe is to —", choices: ["foot", "leg", "arm", "knee"], answer: 0, explain: "Part to whole." },
    { q: "Teacher is to school as doctor is to —", choices: ["hospital", "patient", "medicine", "nurse"], answer: 0, explain: "Worker to workplace." },
  ]),
  U("6", "L.6.4a", "Context clues", [
    { q: 'His remarks were so ambiguous that no one knew his real opinion. "Ambiguous" means —', choices: ["unclear / having more than one meaning", "very clear", "very loud", "very funny"], answer: 0, explain: '"No one knew" shows ambiguous means unclear.' },
    { q: 'The diligent student studied every night. "Diligent" means —', choices: ["hardworking", "lazy", "forgetful", "rude"], answer: 0, explain: "Studying nightly shows diligent (hardworking)." },
    { q: 'The fragile truce was likely to break at any moment. "Fragile" means —', choices: ["easily broken", "very strong", "permanent", "fair"], answer: 0, explain: '"Likely to break" shows fragile.' },
    { q: 'She gave a concise answer, short and to the point. "Concise" means —', choices: ["brief and clear", "long", "confusing", "loud"], answer: 0, explain: '"Short and to the point" defines concise.' },
    { q: 'The novel was tedious and put readers to sleep. "Tedious" means —', choices: ["boring", "exciting", "short", "scary"], answer: 0, explain: '"Put readers to sleep" shows tedious means boring.' },
  ]),
  U("6", "L.6.4b", "Greek & Latin affixes", [
    { q: 'The prefix "anti-" means "against." An "antidote" works —', choices: ["against a poison", "for a poison", "very slowly", "only at night"], answer: 0, explain: "anti- means against." },
    { q: 'The root "vis" means "see." Something "visible" can be —', choices: ["seen", "heard", "eaten", "moved"], answer: 0, explain: "vis (see) → visible = able to be seen." },
    { q: 'The prefix "sub-" means "under." A "submarine" goes —', choices: ["under water", "above clouds", "very fast", "on land"], answer: 0, explain: "sub (under) + marine (sea)." },
    { q: 'The root "manu" means "hand." To do something "manual" is to use your —', choices: ["hands", "feet", "voice", "eyes"], answer: 0, explain: "manu (hand) → manual." },
    { q: 'The prefix "inter-" means "between." To "interact" is to act —', choices: ["between / with each other", "alone", "against", "under"], answer: 0, explain: "inter- means between." },
  ]),
  U("6", "L.6.5a", "Figures of speech", [
    { q: '"The classroom was a zoo." This is a —', choices: ["metaphor", "simile", "rhyme", "fact"], answer: 0, explain: "Compares without like/as → metaphor." },
    { q: '"The thunder grumbled." This is —', choices: ["personification", "hyperbole", "simile", "a fact"], answer: 0, explain: "Thunder 'grumbling' is personification." },
    { q: '"I\'ve told you a thousand times!" is —', choices: ["hyperbole", "a simile", "a metaphor", "a fact"], answer: 0, explain: "Exaggeration → hyperbole." },
    { q: '"Busy as a bee" is a —', choices: ["simile", "metaphor", "pun", "fact"], answer: 0, explain: '"As … as" → simile.' },
    { q: '"The leaves waved in the breeze." This is —', choices: ["personification", "hyperbole", "metaphor", "a fact"], answer: 0, explain: "Leaves 'waving' is personification." },
  ]),
  U("6", "L.6.5c", "Connotation", [
    { q: 'Which word has a more POSITIVE feeling?', choices: ["thrifty", "cheap", "stingy", "miserly"], answer: 0, explain: '"Thrifty" sounds positive; the others sound negative.' },
    { q: 'Which word has a NEGATIVE connotation?', choices: ["nosy", "curious", "interested", "wondering"], answer: 0, explain: '"Nosy" sounds negative.' },
    { q: 'Which word sounds the most POSITIVE?', choices: ["confident", "arrogant", "bossy", "cocky"], answer: 0, explain: '"Confident" is positive; the others are negative.' },
    { q: 'A house described as "cozy" sounds —', choices: ["warm and pleasant", "tiny and cramped", "old and dirty", "cold"], answer: 0, explain: '"Cozy" has a positive connotation.' },
    { q: 'Which word for "thin" sounds NEGATIVE?', choices: ["scrawny", "slim", "slender", "lean"], answer: 0, explain: '"Scrawny" sounds negative.' },
  ]),
  U("6", "L.6.6", "Academic vocabulary", [
    { q: '"Significant" means —', choices: ["important", "tiny", "boring", "broken"], answer: 0, explain: "Significant = important." },
    { q: 'To "demonstrate" is to —', choices: ["show clearly", "hide", "forget", "guess"], answer: 0, explain: "Demonstrate = show." },
    { q: 'A "factor" is —', choices: ["something that contributes to a result", "a final answer", "a story", "a feeling"], answer: 0, explain: "A factor influences a result." },
    { q: '"Consequence" means —', choices: ["a result of an action", "a beginning", "a question", "a tool"], answer: 0, explain: "Consequence = result." },
    { q: 'To "establish" is to —', choices: ["set up firmly", "break apart", "ignore", "copy"], answer: 0, explain: "Establish = set up." },
  ]),

  // ── Grade 7 ──
  U("7", "L.7.4a", "Context clues", [
    { q: 'The candidate was eloquent, speaking with grace and power. "Eloquent" means —', choices: ["well-spoken", "silent", "rude", "confused"], answer: 0, explain: '"Grace and power" shows eloquent means well-spoken.' },
    { q: 'Their plan was feasible and could really be done. "Feasible" means —', choices: ["possible to do", "impossible", "expensive", "secret"], answer: 0, explain: '"Could really be done" shows feasible.' },
    { q: 'He was indifferent and did not care either way. "Indifferent" means —', choices: ["not caring", "very angry", "very excited", "afraid"], answer: 0, explain: '"Did not care" shows indifferent.' },
    { q: 'The evidence was irrefutable; no one could argue against it. "Irrefutable" means —', choices: ["impossible to disprove", "easily wrong", "unimportant", "hidden"], answer: 0, explain: '"No one could argue" shows irrefutable.' },
    { q: 'Her response was candid and completely honest. "Candid" means —', choices: ["honest and open", "dishonest", "shy", "angry"], answer: 0, explain: '"Completely honest" defines candid.' },
  ]),
  U("7", "L.7.4b", "Roots & affixes", [
    { q: 'The root "chron" means "time." "Chronological" order is by —', choices: ["time", "size", "color", "price"], answer: 0, explain: "chron (time) → chronological." },
    { q: 'The prefix "mal-" means "bad." A "malfunction" is a —', choices: ["bad / faulty working", "good result", "new machine", "loud sound"], answer: 0, explain: "mal- means bad." },
    { q: 'The root "scrib/script" means "write." A "manuscript" is —', choices: ["a written document", "a spoken word", "a picture", "a song"], answer: 0, explain: "script = write." },
    { q: 'The prefix "bene-" means "good." A "benefit" is something —', choices: ["good / helpful", "harmful", "boring", "secret"], answer: 0, explain: "bene- means good." },
    { q: 'The root "aud" means "hear." An "audience" is a group that —', choices: ["listens", "writes", "cooks", "drives"], answer: 0, explain: "aud (hear) → audience." },
  ]),
  U("7", "L.7.5a", "Figures of speech", [
    { q: '"Her room was an absolute disaster zone." This is —', choices: ["hyperbole", "a fact", "a simile", "alliteration"], answer: 0, explain: "Exaggeration → hyperbole." },
    { q: '"The opportunity knocked on his door." This is —', choices: ["personification", "a simile", "a pun", "a fact"], answer: 0, explain: "Opportunity 'knocking' is personification." },
    { q: '"He was a lion in battle." This metaphor means he was —', choices: ["brave and fierce", "furry", "sleepy", "hungry"], answer: 0, explain: "Lion suggests brave and fierce." },
    { q: '"Time is a thief." This means time —', choices: ["takes things away (like youth)", "steals money", "is a person", "stops"], answer: 0, explain: "Metaphor: time takes things from us." },
    { q: 'A "verbal irony" example is saying "Great!" when something —', choices: ["went wrong", "went perfectly", "is far away", "is heavy"], answer: 0, explain: "Verbal irony says the opposite of what's meant." },
  ]),
  U("7", "L.7.5b", "Analogies", [
    { q: "Pen is to write as scissors is to —", choices: ["cut", "paper", "sharp", "draw"], answer: 0, explain: "Tool to its function." },
    { q: "Library is to books as garden is to —", choices: ["plants", "shelves", "water", "reading"], answer: 0, explain: "Place to what it holds." },
    { q: "Happy is to sad as victory is to —", choices: ["defeat", "win", "game", "joy"], answer: 0, explain: "Antonym pair." },
    { q: "Knife is to cut as ruler is to —", choices: ["measure", "draw", "wood", "long"], answer: 0, explain: "Tool to function." },
    { q: "Doctor is to patient as teacher is to —", choices: ["student", "school", "lesson", "book"], answer: 0, explain: "Provider to receiver." },
  ]),
  U("7", "L.7.5c", "Connotation & denotation", [
    { q: 'The DENOTATION (dictionary meaning) of "home" is —', choices: ["a place where one lives", "warmth and love", "family", "safety"], answer: 0, explain: "Denotation is the literal meaning." },
    { q: 'Which word has the most POSITIVE connotation for "old"?', choices: ["vintage", "ancient", "decrepit", "worn-out"], answer: 0, explain: '"Vintage" sounds positive.' },
    { q: 'Calling someone "youthful" instead of "childish" gives a —', choices: ["more positive feeling", "more negative feeling", "neutral fact", "rhyme"], answer: 0, explain: '"Youthful" is positive; "childish" is negative.' },
    { q: 'Which word has a NEGATIVE connotation?', choices: ["cheap", "affordable", "economical", "reasonable"], answer: 0, explain: '"Cheap" can sound negative.' },
    { q: 'A "slender" model and a "skinny" model: which word is more flattering?', choices: ["slender", "skinny", "both same", "neither"], answer: 0, explain: '"Slender" has a positive connotation.' },
  ]),
  U("7", "L.7.6", "Academic vocabulary", [
    { q: '"Justify" means to —', choices: ["give good reasons for", "ignore", "guess", "erase"], answer: 0, explain: "Justify = support with reasons." },
    { q: 'A "perspective" is a —', choices: ["point of view", "fact", "color", "number"], answer: 0, explain: "Perspective = viewpoint." },
    { q: 'To "interpret" is to —', choices: ["explain the meaning of", "destroy", "count", "copy"], answer: 0, explain: "Interpret = explain meaning." },
    { q: '"Relevant" means —', choices: ["closely connected to the topic", "very old", "off-topic", "loud"], answer: 0, explain: "Relevant = related to the topic." },
    { q: 'A "valid" argument is —', choices: ["well-founded and logical", "false", "rude", "short"], answer: 0, explain: "Valid = sound/logical." },
  ]),

  // ── Grade 8 ──
  U("8", "L.8.5a", "Figurative language", [
    { q: '"The classroom was a zoo." This is a —', choices: ["metaphor", "simile", "rhyme", "fact"], answer: 0, explain: "Compares without like/as → metaphor." },
    { q: '"As busy as a bee" is a —', choices: ["simile", "metaphor", "pun", "definition"], answer: 0, explain: '"As … as" → simile.' },
    { q: '"The wind whispered through the trees" is —', choices: ["personification", "hyperbole", "simile", "alliteration"], answer: 0, explain: "Human action to wind → personification." },
    { q: '"I\'ve told you a million times!" is —', choices: ["hyperbole", "metaphor", "simile", "irony"], answer: 0, explain: "Exaggeration → hyperbole." },
    { q: '"Peter Piper picked a peck" repeats the /p/ sound. This is —', choices: ["alliteration", "metaphor", "hyperbole", "simile"], answer: 0, explain: "Repeated beginning sound → alliteration." },
  ]),
  U("8", "L.8.4a", "Context clues", [
    { q: 'The dictator was a notorious tyrant feared by all. "Notorious" means —', choices: ["famous for something bad", "kind", "unknown", "generous"], answer: 0, explain: '"Feared by all" shows notorious means famously bad.' },
    { q: 'Her speech was redundant, repeating the same point. "Redundant" means —', choices: ["needlessly repetitive", "very short", "very clear", "false"], answer: 0, explain: '"Repeating" shows redundant.' },
    { q: 'They reached a consensus and all finally agreed. "Consensus" means —', choices: ["general agreement", "an argument", "a single vote", "a refusal"], answer: 0, explain: '"All agreed" shows consensus.' },
    { q: 'The plot was so intricate it was hard to follow. "Intricate" means —', choices: ["complex / detailed", "simple", "boring", "short"], answer: 0, explain: '"Hard to follow" shows intricate means complex.' },
    { q: 'He remained skeptical and doubted the claim. "Skeptical" means —', choices: ["doubtful", "certain", "excited", "afraid"], answer: 0, explain: '"Doubted" shows skeptical.' },
  ]),
  U("8", "L.8.4b", "Roots & affixes", [
    { q: 'The root "ject" means "throw." To "reject" is to —', choices: ["throw back / refuse", "accept", "build", "hide"], answer: 0, explain: "re (back) + ject (throw)." },
    { q: 'The prefix "circum-" means "around." The "circumference" is the distance —', choices: ["around a circle", "across a circle", "through a line", "up a hill"], answer: 0, explain: "circum- means around." },
    { q: 'The root "cred" means "believe." Something "credible" is —', choices: ["believable", "false", "loud", "heavy"], answer: 0, explain: "cred (believe) → credible." },
    { q: 'The prefix "trans-" means "across." To "translate" is to carry meaning —', choices: ["across languages", "under water", "back in time", "around town"], answer: 0, explain: "trans- means across." },
    { q: 'The root "voc" means "voice/call." An "advocate" is one who —', choices: ["speaks up for", "stays silent", "writes", "cooks"], answer: 0, explain: "voc (voice) → advocate speaks for." },
  ]),
  U("8", "L.8.5b", "Word relationships", [
    { q: "Cautious is to reckless as generous is to —", choices: ["selfish", "kind", "giving", "rich"], answer: 0, explain: "Antonym analogy." },
    { q: "Whisper is to shout as walk is to —", choices: ["sprint", "step", "stroll", "stand"], answer: 0, explain: "Degree: whisper/shout, walk/sprint." },
    { q: "Sculptor is to statue as composer is to —", choices: ["symphony", "piano", "stage", "music sheet"], answer: 0, explain: "Creator to creation." },
    { q: "Drop is to ocean as grain is to —", choices: ["beach", "sand", "wheat", "field"], answer: 1, explain: "A single part to the whole: a grain of sand makes a beach." },
    { q: "Novice is to expert as student is to —", choices: ["master", "school", "class", "teacher"], answer: 0, explain: "Beginner to skilled (degree)." },
  ]),
  U("8", "L.8.5c", "Connotation & nuance", [
    { q: 'Which word for a leader sounds most NEGATIVE?', choices: ["dictator", "ruler", "leader", "chief"], answer: 0, explain: '"Dictator" has a negative connotation.' },
    { q: 'Describing a smell as a "fragrance" rather than an "odor" sounds —', choices: ["more pleasant", "more unpleasant", "neutral", "louder"], answer: 0, explain: '"Fragrance" is positive; "odor" is often negative.' },
    { q: 'Which word suggests the most determination (positive)?', choices: ["persistent", "stubborn", "pig-headed", "obstinate"], answer: 0, explain: '"Persistent" is positive; the others sound negative.' },
    { q: 'Calling a plan "unconventional" instead of "weird" makes it sound —', choices: ["more positive", "more negative", "neutral", "older"], answer: 0, explain: '"Unconventional" is more positive than "weird".' },
    { q: 'Which word for "talk a lot" is the most NEGATIVE?', choices: ["babble", "chat", "converse", "discuss"], answer: 0, explain: '"Babble" sounds negative.' },
  ]),
  U("8", "L.8.6", "Academic vocabulary", [
    { q: '"Synthesize" means to —', choices: ["combine ideas into a whole", "take apart", "ignore", "copy"], answer: 0, explain: "Synthesize = combine." },
    { q: 'A "hypothesis" is —', choices: ["a testable proposed explanation", "a proven fact", "a conclusion", "an opinion"], answer: 0, explain: "Hypothesis = a testable prediction." },
    { q: 'To "evaluate" is to —', choices: ["judge the value of", "memorize", "draw", "list"], answer: 0, explain: "Evaluate = judge worth." },
    { q: '"Comprehensive" means —', choices: ["complete and thorough", "tiny", "false", "quick"], answer: 0, explain: "Comprehensive = covering everything." },
    { q: 'An "objective" statement is —', choices: ["based on facts, not feelings", "based on opinion", "rude", "funny"], answer: 0, explain: "Objective = fact-based, unbiased." },
  ]),
];
