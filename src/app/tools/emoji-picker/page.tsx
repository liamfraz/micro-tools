"use client";

import { useState, useCallback, useMemo } from "react";

// ── Emoji data: [emoji, name, keywords] ──

type EmojiEntry = [string, string, string];

const EMOJI_DATA: { category: string; emojis: EmojiEntry[] }[] = [
  {
    category: "Smileys & People",
    emojis: [
      ["😀", "Grinning Face", "smile happy"],
      ["😃", "Grinning Face with Big Eyes", "smile happy"],
      ["😄", "Grinning Face with Smiling Eyes", "smile happy"],
      ["😁", "Beaming Face", "grin smile"],
      ["😆", "Grinning Squinting Face", "laugh"],
      ["😅", "Grinning Face with Sweat", "hot nervous"],
      ["🤣", "Rolling on the Floor Laughing", "lol rofl"],
      ["😂", "Face with Tears of Joy", "laugh cry lol"],
      ["🙂", "Slightly Smiling Face", "smile"],
      ["🙃", "Upside-Down Face", "sarcasm silly"],
      ["😉", "Winking Face", "wink flirt"],
      ["😊", "Smiling Face with Smiling Eyes", "blush happy"],
      ["😇", "Smiling Face with Halo", "angel innocent"],
      ["🥰", "Smiling Face with Hearts", "love adore"],
      ["😍", "Heart Eyes", "love crush"],
      ["🤩", "Star-Struck", "amazing wow"],
      ["😘", "Face Blowing a Kiss", "kiss love"],
      ["😗", "Kissing Face", "kiss"],
      ["😚", "Kissing Face with Closed Eyes", "kiss"],
      ["😙", "Kissing Face with Smiling Eyes", "kiss"],
      ["🥲", "Smiling Face with Tear", "sad happy grateful"],
      ["😋", "Face Savoring Food", "yummy delicious"],
      ["😛", "Face with Tongue", "tongue playful"],
      ["😜", "Winking Face with Tongue", "prank silly"],
      ["🤪", "Zany Face", "crazy silly wild"],
      ["😝", "Squinting Face with Tongue", "taste prank"],
      ["🤑", "Money-Mouth Face", "rich money"],
      ["🤗", "Hugging Face", "hug love"],
      ["🤭", "Face with Hand Over Mouth", "oops giggle"],
      ["🤫", "Shushing Face", "quiet secret"],
      ["🤔", "Thinking Face", "think hmm"],
      ["🫡", "Saluting Face", "salute respect"],
      ["🤐", "Zipper-Mouth Face", "secret quiet"],
      ["🤨", "Face with Raised Eyebrow", "skeptical"],
      ["😐", "Neutral Face", "meh indifferent"],
      ["😑", "Expressionless Face", "blank"],
      ["😶", "Face Without Mouth", "speechless silence"],
      ["😏", "Smirking Face", "smirk flirt"],
      ["😒", "Unamused Face", "dissatisfied"],
      ["🙄", "Face with Rolling Eyes", "whatever annoyed"],
      ["😬", "Grimacing Face", "awkward nervous"],
      ["🤥", "Lying Face", "pinocchio lie"],
      ["😌", "Relieved Face", "relieved relaxed"],
      ["😔", "Pensive Face", "sad thoughtful"],
      ["😪", "Sleepy Face", "tired sleepy"],
      ["🤤", "Drooling Face", "drool yummy"],
      ["😴", "Sleeping Face", "sleep zzz"],
      ["😷", "Face with Medical Mask", "sick mask"],
      ["🤒", "Face with Thermometer", "sick fever"],
      ["🤕", "Face with Head-Bandage", "hurt injury"],
      ["🤢", "Nauseated Face", "sick gross vomit"],
      ["🤮", "Face Vomiting", "sick throw up"],
      ["🤧", "Sneezing Face", "sneeze sick cold"],
      ["🥵", "Hot Face", "hot heat sweating"],
      ["🥶", "Cold Face", "cold frozen freezing"],
      ["🥴", "Woozy Face", "dizzy drunk"],
      ["😵", "Face with Crossed-Out Eyes", "dizzy dead"],
      ["🤯", "Exploding Head", "mind blown shocked"],
      ["🤠", "Cowboy Hat Face", "cowboy yeehaw"],
      ["🥳", "Partying Face", "party celebrate"],
      ["🥸", "Disguised Face", "disguise spy"],
      ["😎", "Smiling Face with Sunglasses", "cool sunglasses"],
      ["🤓", "Nerd Face", "nerd geek glasses"],
      ["🧐", "Face with Monocle", "classy sophisticated"],
      ["😕", "Confused Face", "confused"],
      ["😟", "Worried Face", "worried nervous"],
      ["🙁", "Slightly Frowning Face", "frown sad"],
      ["😮", "Face with Open Mouth", "surprised wow"],
      ["😯", "Hushed Face", "surprised stunned"],
      ["😲", "Astonished Face", "shocked amazed"],
      ["😳", "Flushed Face", "embarrassed shy"],
      ["🥺", "Pleading Face", "puppy eyes please"],
      ["😦", "Frowning Face with Open Mouth", "aw"],
      ["😧", "Anguished Face", "pain worried"],
      ["😨", "Fearful Face", "scared fear"],
      ["😰", "Anxious Face with Sweat", "nervous worried"],
      ["😥", "Sad but Relieved Face", "phew"],
      ["😢", "Crying Face", "cry sad tear"],
      ["😭", "Loudly Crying Face", "sob cry"],
      ["😱", "Face Screaming in Fear", "scream horror"],
      ["😖", "Confounded Face", "quivering"],
      ["😣", "Persevering Face", "struggle"],
      ["😞", "Disappointed Face", "sad"],
      ["😓", "Downcast Face with Sweat", "hard work"],
      ["😩", "Weary Face", "tired"],
      ["😫", "Tired Face", "exhausted"],
      ["🥱", "Yawning Face", "bored tired"],
      ["😤", "Face with Steam From Nose", "angry triumph"],
      ["😡", "Pouting Face", "angry rage"],
      ["😠", "Angry Face", "mad angry"],
      ["🤬", "Face with Symbols on Mouth", "swearing cursing"],
      ["😈", "Smiling Face with Horns", "devil naughty"],
      ["👿", "Angry Face with Horns", "devil angry"],
      ["💀", "Skull", "death dead skeleton"],
      ["☠️", "Skull and Crossbones", "death danger"],
      ["💩", "Pile of Poo", "poop"],
      ["🤡", "Clown Face", "clown"],
      ["👹", "Ogre", "monster"],
      ["👺", "Goblin", "monster"],
      ["👻", "Ghost", "ghost halloween"],
      ["👽", "Alien", "ufo extraterrestrial"],
      ["👾", "Alien Monster", "space invader game"],
      ["🤖", "Robot", "robot bot"],
      ["💋", "Kiss Mark", "lips kiss"],
      ["👋", "Waving Hand", "hello bye wave"],
      ["🤚", "Raised Back of Hand", "stop"],
      ["🖐️", "Hand with Fingers Splayed", "stop high five"],
      ["✋", "Raised Hand", "stop high five"],
      ["🖖", "Vulcan Salute", "spock star trek"],
      ["👌", "OK Hand", "ok perfect nice"],
      ["🤌", "Pinched Fingers", "italian what"],
      ["🤏", "Pinching Hand", "small tiny"],
      ["✌️", "Victory Hand", "peace victory two"],
      ["🤞", "Crossed Fingers", "luck hope"],
      ["🤟", "Love-You Gesture", "love ily"],
      ["🤘", "Sign of the Horns", "rock metal"],
      ["🤙", "Call Me Hand", "call shaka"],
      ["👈", "Backhand Index Pointing Left", "left point"],
      ["👉", "Backhand Index Pointing Right", "right point"],
      ["👆", "Backhand Index Pointing Up", "up point"],
      ["🖕", "Middle Finger", "flip off rude"],
      ["👇", "Backhand Index Pointing Down", "down point"],
      ["☝️", "Index Pointing Up", "up point"],
      ["👍", "Thumbs Up", "like approve yes"],
      ["👎", "Thumbs Down", "dislike disapprove no"],
      ["✊", "Raised Fist", "punch power"],
      ["👊", "Oncoming Fist", "punch bump"],
      ["🤛", "Left-Facing Fist", "fist bump"],
      ["🤜", "Right-Facing Fist", "fist bump"],
      ["👏", "Clapping Hands", "clap applause bravo"],
      ["🙌", "Raising Hands", "celebration hooray"],
      ["👐", "Open Hands", "hands"],
      ["🤲", "Palms Up Together", "prayer offering"],
      ["🤝", "Handshake", "deal agreement"],
      ["🙏", "Folded Hands", "pray please thank you"],
      ["✍️", "Writing Hand", "write"],
      ["💅", "Nail Polish", "beauty nails"],
      ["🤳", "Selfie", "selfie phone"],
      ["💪", "Flexed Biceps", "strong muscle"],
    ],
  },
  {
    category: "Animals & Nature",
    emojis: [
      ["🐶", "Dog Face", "dog puppy pet"],
      ["🐱", "Cat Face", "cat kitten pet"],
      ["🐭", "Mouse Face", "mouse"],
      ["🐹", "Hamster", "hamster pet"],
      ["🐰", "Rabbit Face", "bunny rabbit"],
      ["🦊", "Fox", "fox"],
      ["🐻", "Bear", "bear"],
      ["🐼", "Panda", "panda bear"],
      ["🐨", "Koala", "koala"],
      ["🐯", "Tiger Face", "tiger"],
      ["🦁", "Lion", "lion king"],
      ["🐮", "Cow Face", "cow"],
      ["🐷", "Pig Face", "pig"],
      ["🐸", "Frog", "frog toad"],
      ["🐵", "Monkey Face", "monkey"],
      ["🙈", "See-No-Evil Monkey", "hide shy"],
      ["🙉", "Hear-No-Evil Monkey", "deaf"],
      ["🙊", "Speak-No-Evil Monkey", "secret"],
      ["🐔", "Chicken", "chicken"],
      ["🐧", "Penguin", "penguin"],
      ["🐦", "Bird", "bird"],
      ["🦅", "Eagle", "eagle bird"],
      ["🦆", "Duck", "duck"],
      ["🦉", "Owl", "owl wise"],
      ["🦇", "Bat", "bat vampire"],
      ["🐺", "Wolf", "wolf"],
      ["🐗", "Boar", "boar pig"],
      ["🐴", "Horse Face", "horse"],
      ["🦄", "Unicorn", "unicorn magic"],
      ["🐝", "Honeybee", "bee honey"],
      ["🪱", "Worm", "worm"],
      ["🐛", "Bug", "bug caterpillar"],
      ["🦋", "Butterfly", "butterfly nature"],
      ["🐌", "Snail", "snail slow"],
      ["🐙", "Octopus", "octopus"],
      ["🦑", "Squid", "squid"],
      ["🦀", "Crab", "crab"],
      ["🐠", "Tropical Fish", "fish"],
      ["🐟", "Fish", "fish"],
      ["🐬", "Dolphin", "dolphin"],
      ["🐳", "Spouting Whale", "whale"],
      ["🦈", "Shark", "shark"],
      ["🐊", "Crocodile", "crocodile alligator"],
      ["🐢", "Turtle", "turtle slow"],
      ["🦎", "Lizard", "lizard reptile"],
      ["🐍", "Snake", "snake"],
      ["🦖", "T-Rex", "dinosaur"],
      ["🦕", "Sauropod", "dinosaur"],
      ["🌸", "Cherry Blossom", "flower spring"],
      ["🌹", "Rose", "flower love romance"],
      ["🌻", "Sunflower", "flower sun"],
      ["🌺", "Hibiscus", "flower tropical"],
      ["🌷", "Tulip", "flower spring"],
      ["🌼", "Blossom", "flower"],
      ["🌿", "Herb", "plant nature green"],
      ["🍀", "Four Leaf Clover", "luck lucky"],
      ["🍁", "Maple Leaf", "autumn fall canada"],
      ["🍂", "Fallen Leaf", "autumn fall"],
      ["🌲", "Evergreen Tree", "tree pine"],
      ["🌳", "Deciduous Tree", "tree nature"],
      ["🌴", "Palm Tree", "tropical beach"],
      ["🌵", "Cactus", "desert"],
      ["🌾", "Sheaf of Rice", "rice grain"],
      ["🍄", "Mushroom", "fungus"],
    ],
  },
  {
    category: "Food & Drink",
    emojis: [
      ["🍎", "Red Apple", "apple fruit"],
      ["🍐", "Pear", "fruit"],
      ["🍊", "Tangerine", "orange fruit"],
      ["🍋", "Lemon", "lemon fruit"],
      ["🍌", "Banana", "banana fruit"],
      ["🍉", "Watermelon", "watermelon fruit"],
      ["🍇", "Grapes", "grape fruit wine"],
      ["🍓", "Strawberry", "strawberry fruit berry"],
      ["🫐", "Blueberries", "blueberry fruit berry"],
      ["🍑", "Peach", "peach fruit"],
      ["🥭", "Mango", "mango fruit tropical"],
      ["🍍", "Pineapple", "pineapple fruit tropical"],
      ["🥥", "Coconut", "coconut tropical"],
      ["🥝", "Kiwi Fruit", "kiwi fruit"],
      ["🍅", "Tomato", "tomato vegetable"],
      ["🥑", "Avocado", "avocado"],
      ["🍆", "Eggplant", "eggplant aubergine"],
      ["🌶️", "Hot Pepper", "spicy chili"],
      ["🥕", "Carrot", "carrot vegetable"],
      ["🌽", "Ear of Corn", "corn maize"],
      ["🥦", "Broccoli", "broccoli vegetable"],
      ["🧄", "Garlic", "garlic"],
      ["🧅", "Onion", "onion"],
      ["🥔", "Potato", "potato"],
      ["🍞", "Bread", "bread toast"],
      ["🥐", "Croissant", "pastry french"],
      ["🥖", "Baguette Bread", "french bread"],
      ["🧀", "Cheese Wedge", "cheese"],
      ["🍖", "Meat on Bone", "meat"],
      ["🍗", "Poultry Leg", "chicken"],
      ["🥩", "Cut of Meat", "steak beef"],
      ["🌭", "Hot Dog", "hotdog sausage"],
      ["🍔", "Hamburger", "burger"],
      ["🍟", "French Fries", "fries chips"],
      ["🍕", "Pizza", "pizza"],
      ["🌮", "Taco", "taco mexican"],
      ["🌯", "Burrito", "burrito mexican wrap"],
      ["🥗", "Green Salad", "salad healthy"],
      ["🍜", "Steaming Bowl", "noodles ramen"],
      ["🍝", "Spaghetti", "pasta italian"],
      ["🍣", "Sushi", "sushi japanese"],
      ["🍱", "Bento Box", "bento japanese"],
      ["🍩", "Doughnut", "donut sweet"],
      ["🍪", "Cookie", "cookie biscuit"],
      ["🎂", "Birthday Cake", "birthday cake"],
      ["🍰", "Shortcake", "cake dessert"],
      ["🧁", "Cupcake", "cupcake"],
      ["🍫", "Chocolate Bar", "chocolate candy"],
      ["🍬", "Candy", "candy sweet"],
      ["🍭", "Lollipop", "candy lollipop"],
      ["🍮", "Custard", "pudding dessert"],
      ["☕", "Hot Beverage", "coffee tea"],
      ["🍵", "Teacup Without Handle", "tea"],
      ["🧃", "Beverage Box", "juice box"],
      ["🥤", "Cup with Straw", "drink soda"],
      ["🧋", "Bubble Tea", "boba milk tea"],
      ["🍺", "Beer Mug", "beer drink"],
      ["🍻", "Clinking Beer Mugs", "cheers beer"],
      ["🥂", "Clinking Glasses", "champagne toast cheers"],
      ["🍷", "Wine Glass", "wine drink"],
      ["🍸", "Cocktail Glass", "martini cocktail"],
      ["🧊", "Ice", "ice cube cold"],
    ],
  },
  {
    category: "Activities & Sports",
    emojis: [
      ["⚽", "Soccer Ball", "soccer football"],
      ["🏀", "Basketball", "basketball sport"],
      ["🏈", "American Football", "football sport"],
      ["⚾", "Baseball", "baseball sport"],
      ["🥎", "Softball", "softball sport"],
      ["🎾", "Tennis", "tennis sport"],
      ["🏐", "Volleyball", "volleyball sport"],
      ["🏉", "Rugby Football", "rugby sport"],
      ["🥏", "Flying Disc", "frisbee sport"],
      ["🎱", "Pool 8 Ball", "billiards pool"],
      ["🏓", "Ping Pong", "table tennis"],
      ["🏸", "Badminton", "badminton sport"],
      ["🥊", "Boxing Glove", "boxing fight"],
      ["🥋", "Martial Arts Uniform", "karate judo"],
      ["🎯", "Bullseye", "target darts"],
      ["⛳", "Flag in Hole", "golf"],
      ["🏋️", "Person Lifting Weights", "gym workout"],
      ["🧘", "Person in Lotus Position", "yoga meditation"],
      ["🏄", "Person Surfing", "surf wave"],
      ["🏊", "Person Swimming", "swim pool"],
      ["🚴", "Person Biking", "cycling bike"],
      ["🧗", "Person Climbing", "climbing rock"],
      ["🎮", "Video Game", "gaming controller"],
      ["🕹️", "Joystick", "gaming arcade"],
      ["🎲", "Game Die", "dice gambling"],
      ["🧩", "Puzzle Piece", "puzzle jigsaw"],
      ["♟️", "Chess Pawn", "chess strategy"],
      ["🎭", "Performing Arts", "theater drama"],
      ["🎨", "Artist Palette", "art painting"],
      ["🎬", "Clapper Board", "movie film"],
      ["🎤", "Microphone", "mic karaoke sing"],
      ["🎧", "Headphone", "headphones music"],
      ["🎵", "Musical Note", "music note"],
      ["🎶", "Musical Notes", "music notes"],
      ["🎹", "Musical Keyboard", "piano keyboard"],
      ["🥁", "Drum", "drum music"],
      ["🎷", "Saxophone", "sax jazz music"],
      ["🎸", "Guitar", "guitar music rock"],
      ["🎻", "Violin", "violin music"],
      ["🎺", "Trumpet", "trumpet music"],
      ["🏆", "Trophy", "winner champion award"],
      ["🥇", "1st Place Medal", "gold winner first"],
      ["🥈", "2nd Place Medal", "silver second"],
      ["🥉", "3rd Place Medal", "bronze third"],
      ["🎪", "Circus Tent", "circus"],
      ["🎠", "Carousel Horse", "merry go round"],
    ],
  },
  {
    category: "Travel & Places",
    emojis: [
      ["🚗", "Automobile", "car drive"],
      ["🚕", "Taxi", "taxi cab"],
      ["🚌", "Bus", "bus"],
      ["🚎", "Trolleybus", "trolley"],
      ["🚐", "Minibus", "van"],
      ["🚑", "Ambulance", "ambulance emergency"],
      ["🚒", "Fire Engine", "fire truck"],
      ["🚓", "Police Car", "police cop"],
      ["🚜", "Tractor", "farm tractor"],
      ["🏎️", "Racing Car", "race car formula"],
      ["🏍️", "Motorcycle", "motorcycle bike"],
      ["🚲", "Bicycle", "bike cycling"],
      ["🛴", "Kick Scooter", "scooter"],
      ["✈️", "Airplane", "plane flight travel"],
      ["🚀", "Rocket", "rocket space launch"],
      ["🛸", "Flying Saucer", "ufo alien"],
      ["🚁", "Helicopter", "helicopter"],
      ["⛵", "Sailboat", "boat sailing"],
      ["🚢", "Ship", "cruise ship"],
      ["🚂", "Locomotive", "train"],
      ["🚆", "Train", "train rail"],
      ["🏠", "House", "home house"],
      ["🏢", "Office Building", "office building"],
      ["🏥", "Hospital", "hospital medical"],
      ["🏫", "School", "school education"],
      ["🏛️", "Classical Building", "museum government"],
      ["⛪", "Church", "church religion"],
      ["🕌", "Mosque", "mosque islam"],
      ["🗽", "Statue of Liberty", "new york liberty"],
      ["🗼", "Tokyo Tower", "tokyo japan tower"],
      ["🏰", "Castle", "castle"],
      ["🌍", "Globe Europe-Africa", "earth world globe"],
      ["🌎", "Globe Americas", "earth world globe"],
      ["🌏", "Globe Asia-Australia", "earth world globe"],
      ["🗺️", "World Map", "map travel"],
      ["🌋", "Volcano", "volcano eruption"],
      ["🏔️", "Snow-Capped Mountain", "mountain snow"],
      ["⛰️", "Mountain", "mountain"],
      ["🏖️", "Beach with Umbrella", "beach vacation"],
      ["🌅", "Sunrise", "sunrise morning"],
      ["🌄", "Sunrise Over Mountains", "sunrise mountain"],
      ["🌠", "Shooting Star", "star wish"],
      ["🎆", "Fireworks", "fireworks celebration"],
      ["🎇", "Sparkler", "fireworks sparkler"],
      ["🌃", "Night with Stars", "night city"],
      ["🌉", "Bridge at Night", "bridge city night"],
    ],
  },
  {
    category: "Objects",
    emojis: [
      ["⌚", "Watch", "watch time"],
      ["📱", "Mobile Phone", "phone smartphone"],
      ["💻", "Laptop", "computer laptop"],
      ["⌨️", "Keyboard", "keyboard type"],
      ["🖥️", "Desktop Computer", "computer monitor"],
      ["🖨️", "Printer", "printer"],
      ["🖱️", "Computer Mouse", "mouse click"],
      ["💾", "Floppy Disk", "save disk"],
      ["💿", "Optical Disc", "cd dvd"],
      ["📷", "Camera", "camera photo"],
      ["📹", "Video Camera", "video camera record"],
      ["🎥", "Movie Camera", "film camera cinema"],
      ["📺", "Television", "tv television"],
      ["📻", "Radio", "radio"],
      ["🔋", "Battery", "battery power"],
      ["🔌", "Electric Plug", "plug electric power"],
      ["💡", "Light Bulb", "idea light bulb"],
      ["🔦", "Flashlight", "torch light"],
      ["📐", "Triangular Ruler", "ruler math"],
      ["📏", "Straight Ruler", "ruler measure"],
      ["✂️", "Scissors", "cut scissors"],
      ["📎", "Paperclip", "paperclip attachment"],
      ["📌", "Pushpin", "pin location"],
      ["📝", "Memo", "note write memo"],
      ["📁", "File Folder", "folder file directory"],
      ["📂", "Open File Folder", "folder open"],
      ["📅", "Calendar", "calendar date"],
      ["📊", "Bar Chart", "chart graph data"],
      ["📈", "Chart Increasing", "graph up trending"],
      ["📉", "Chart Decreasing", "graph down"],
      ["📋", "Clipboard", "clipboard"],
      ["🔒", "Locked", "lock security"],
      ["🔓", "Unlocked", "unlock open"],
      ["🔑", "Key", "key password"],
      ["🔨", "Hammer", "hammer tool build"],
      ["🪛", "Screwdriver", "screwdriver tool fix"],
      ["🔧", "Wrench", "wrench tool settings"],
      ["⚙️", "Gear", "settings gear cog"],
      ["🧲", "Magnet", "magnet attract"],
      ["💰", "Money Bag", "money wealth rich"],
      ["💵", "Dollar Banknote", "money dollar cash"],
      ["💳", "Credit Card", "payment card buy"],
      ["✉️", "Envelope", "email mail letter"],
      ["📧", "E-Mail", "email"],
      ["📦", "Package", "box package delivery"],
      ["🏷️", "Label", "tag label price"],
      ["🔔", "Bell", "notification bell alert"],
      ["🔕", "Bell with Slash", "mute silence"],
      ["🎁", "Wrapped Gift", "gift present birthday"],
    ],
  },
  {
    category: "Symbols",
    emojis: [
      ["❤️", "Red Heart", "love heart"],
      ["🧡", "Orange Heart", "heart orange"],
      ["💛", "Yellow Heart", "heart yellow"],
      ["💚", "Green Heart", "heart green"],
      ["💙", "Blue Heart", "heart blue"],
      ["💜", "Purple Heart", "heart purple"],
      ["🖤", "Black Heart", "heart black"],
      ["🤍", "White Heart", "heart white"],
      ["🤎", "Brown Heart", "heart brown"],
      ["💔", "Broken Heart", "heartbreak sad"],
      ["💕", "Two Hearts", "love hearts"],
      ["💞", "Revolving Hearts", "love hearts"],
      ["💓", "Beating Heart", "heartbeat love"],
      ["💗", "Growing Heart", "love heart"],
      ["💖", "Sparkling Heart", "love heart"],
      ["💘", "Heart with Arrow", "cupid love"],
      ["💝", "Heart with Ribbon", "love gift"],
      ["✅", "Check Mark Button", "yes done complete"],
      ["❌", "Cross Mark", "no wrong delete"],
      ["❗", "Exclamation Mark", "warning alert important"],
      ["❓", "Question Mark", "question what help"],
      ["⭐", "Star", "star favorite"],
      ["🌟", "Glowing Star", "star sparkle shine"],
      ["💫", "Dizzy", "star sparkle"],
      ["✨", "Sparkles", "sparkle shine new"],
      ["🔥", "Fire", "hot fire lit"],
      ["💥", "Collision", "boom explosion crash"],
      ["💯", "Hundred Points", "perfect score 100"],
      ["💤", "Zzz", "sleep tired"],
      ["💬", "Speech Balloon", "chat message comment"],
      ["💭", "Thought Balloon", "thinking cloud"],
      ["🗣️", "Speaking Head", "talk speak voice"],
      ["👁️‍🗨️", "Eye in Speech Bubble", "witness"],
      ["⚡", "High Voltage", "lightning electric zap"],
      ["🎵", "Musical Note", "music"],
      ["♻️", "Recycling Symbol", "recycle green"],
      ["⚠️", "Warning", "warning alert caution"],
      ["🚫", "Prohibited", "no ban forbidden"],
      ["⬆️", "Up Arrow", "up arrow"],
      ["⬇️", "Down Arrow", "down arrow"],
      ["⬅️", "Left Arrow", "left arrow"],
      ["➡️", "Right Arrow", "right arrow"],
      ["↩️", "Right Arrow Curving Left", "undo back return"],
      ["↪️", "Left Arrow Curving Right", "redo forward"],
      ["🔄", "Counterclockwise Arrows", "refresh reload sync"],
      ["🔀", "Shuffle Tracks Button", "shuffle random"],
      ["🔁", "Repeat Button", "repeat loop"],
      ["ℹ️", "Information", "info information"],
      ["🆕", "New Button", "new"],
      ["🆗", "OK Button", "ok"],
      ["🆘", "SOS Button", "sos emergency help"],
      ["🏳️", "White Flag", "flag surrender"],
      ["🏴", "Black Flag", "flag"],
      ["🚩", "Triangular Flag", "flag red flag"],
      ["🏁", "Chequered Flag", "finish race flag"],
    ],
  },
  {
    category: "Flags",
    emojis: [
      ["🇺🇸", "United States", "usa america flag"],
      ["🇬🇧", "United Kingdom", "uk britain flag"],
      ["🇨🇦", "Canada", "canada flag"],
      ["🇦🇺", "Australia", "australia flag"],
      ["🇩🇪", "Germany", "germany flag"],
      ["🇫🇷", "France", "france flag"],
      ["🇪🇸", "Spain", "spain flag"],
      ["🇮🇹", "Italy", "italy flag"],
      ["🇯🇵", "Japan", "japan flag"],
      ["🇰🇷", "South Korea", "korea flag"],
      ["🇨🇳", "China", "china flag"],
      ["🇮🇳", "India", "india flag"],
      ["🇧🇷", "Brazil", "brazil flag"],
      ["🇲🇽", "Mexico", "mexico flag"],
      ["🇷🇺", "Russia", "russia flag"],
      ["🇳🇱", "Netherlands", "netherlands holland flag"],
      ["🇸🇪", "Sweden", "sweden flag"],
      ["🇳🇴", "Norway", "norway flag"],
      ["🇵🇹", "Portugal", "portugal flag"],
      ["🇵🇱", "Poland", "poland flag"],
      ["🇹🇷", "Turkey", "turkey flag"],
      ["🇿🇦", "South Africa", "south africa flag"],
      ["🇳🇿", "New Zealand", "new zealand flag"],
      ["🇦🇷", "Argentina", "argentina flag"],
      ["🇨🇭", "Switzerland", "switzerland flag"],
      ["🇮🇪", "Ireland", "ireland flag"],
      ["🇸🇬", "Singapore", "singapore flag"],
      ["🇦🇪", "United Arab Emirates", "uae dubai flag"],
    ],
  },
];

const ALL_CATEGORIES = EMOJI_DATA.map((d) => d.category);

export default function EmojiPickerPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [collected, setCollected] = useState("");
  const [copiedMain, setCopiedMain] = useState(false);
  const [copiedEmoji, setCopiedEmoji] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiEntry | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);

  const filteredEmojis = useMemo(() => {
    const q = search.toLowerCase().trim();
    const results: { category: string; emojis: EmojiEntry[] }[] = [];

    for (const group of EMOJI_DATA) {
      if (activeCategory !== "All" && group.category !== activeCategory) continue;

      if (!q) {
        results.push(group);
        continue;
      }

      const filtered = group.emojis.filter(([emoji, name, keywords]) => {
        const haystack = `${emoji} ${name} ${keywords}`.toLowerCase();
        return haystack.includes(q);
      });

      if (filtered.length > 0) {
        results.push({ category: group.category, emojis: filtered });
      }
    }

    return results;
  }, [search, activeCategory]);

  const totalResults = useMemo(() => {
    return filteredEmojis.reduce((sum, g) => sum + g.emojis.length, 0);
  }, [filteredEmojis]);

  const handleEmojiClick = useCallback((emoji: string, entry: EmojiEntry) => {
    setCollected((prev) => prev + emoji);
    setSelectedEmoji(entry);

    // Copy single emoji
    navigator.clipboard.writeText(emoji);
    setCopiedEmoji(emoji);
    setTimeout(() => setCopiedEmoji(""), 1500);

    // Update recents
    setRecentEmojis((prev) => {
      const next = [emoji, ...prev.filter((e) => e !== emoji)];
      return next.slice(0, 24);
    });
  }, []);

  const handleCopyCollected = useCallback(async () => {
    if (!collected) return;
    await navigator.clipboard.writeText(collected);
    setCopiedMain(true);
    setTimeout(() => setCopiedMain(false), 2000);
  }, [collected]);

  const handleClearCollected = useCallback(() => {
    setCollected("");
  }, []);

  return (
    <>
      <title>Emoji Picker & Search - Free Online Tool | DevTools Hub</title>
      <meta
        name="description"
        content="Search and copy emojis instantly. Browse 500+ emojis by category — smileys, animals, food, travel, objects, symbols, and flags. Click to copy, collect multiple, search by name or keyword."
      />

      <main className="min-h-screen bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <nav className="text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><span className="mx-1">/</span></li>
              <li><a href="/tools" className="hover:text-white transition-colors">Text Tools</a></li>
              <li><span className="mx-1">/</span></li>
              <li className="text-slate-200">Emoji Picker</li>
            </ol>
          </nav>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Emoji Picker & Search
            </h1>
            <p className="text-slate-400 max-w-2xl text-lg">
              Search and copy emojis instantly. Browse 500+ emojis across 8 categories — click any emoji to copy it to your clipboard. Collect multiple emojis and copy them all at once.
            </p>
          </div>

          {/* Search bar */}
          <div className="mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emojis... (e.g. smile, heart, fire, dog, pizza)"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                activeCategory === "All"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
              }`}
            >
              All ({EMOJI_DATA.reduce((s, g) => s + g.emojis.length, 0)})
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const count = EMOJI_DATA.find((g) => g.category === cat)?.emojis.length || 0;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Collected bar */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 mb-4 flex items-center gap-3">
            <div className="flex-1 min-h-[2rem] text-2xl tracking-wider break-all">
              {collected || <span className="text-slate-500 text-sm">Click emojis to collect them here...</span>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleCopyCollected}
                disabled={!collected}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copiedMain ? "Copied!" : "Copy All"}
              </button>
              <button
                onClick={handleClearCollected}
                disabled={!collected}
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Recent */}
          {recentEmojis.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-slate-500 mb-1">Recently used:</div>
              <div className="flex flex-wrap gap-1">
                {recentEmojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    onClick={() => {
                      const entry = EMOJI_DATA.flatMap((g) => g.emojis).find((e) => e[0] === emoji);
                      if (entry) handleEmojiClick(emoji, entry);
                    }}
                    className="w-9 h-9 flex items-center justify-center text-xl rounded hover:bg-slate-800 transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected emoji detail */}
          {selectedEmoji && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4 flex items-center gap-4">
              <span className="text-5xl">{selectedEmoji[0]}</span>
              <div>
                <div className="font-medium text-white">{selectedEmoji[1]}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Keywords: {selectedEmoji[2]}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-mono">
                  U+{selectedEmoji[0].codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}
                  {" · "}
                  HTML: &amp;#{selectedEmoji[0].codePointAt(0)};
                </div>
              </div>
              {copiedEmoji === selectedEmoji[0] && (
                <span className="ml-auto text-xs text-green-400">Copied!</span>
              )}
            </div>
          )}

          {/* Results count */}
          {search && (
            <div className="text-sm text-slate-400 mb-3">
              {totalResults} emoji{totalResults !== 1 ? "s" : ""} found for &quot;{search}&quot;
            </div>
          )}

          {/* Emoji grid by category */}
          <div className="space-y-6 mb-8">
            {filteredEmojis.map((group) => (
              <div key={group.category}>
                <h2 className="text-sm font-medium text-slate-400 mb-2">{group.category}</h2>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16 gap-1">
                  {group.emojis.map(([emoji, name, keywords]) => (
                    <button
                      key={`${emoji}-${name}`}
                      onClick={() => handleEmojiClick(emoji, [emoji, name, keywords])}
                      className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${
                        copiedEmoji === emoji
                          ? "bg-green-900/50 ring-1 ring-green-500"
                          : "hover:bg-slate-800"
                      }`}
                      title={name}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredEmojis.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-sm">No emojis found for &quot;{search}&quot;</div>
                <div className="text-xs text-slate-600 mt-1">Try: smile, heart, fire, thumbs, star, pizza</div>
              </div>
            )}
          </div>

          {/* Related Tools */}
          <div className="bg-slate-800 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Related Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: "Unicode Character Map", slug: "character-map", desc: "Browse and copy Unicode characters" },
                { name: "Text Case Converter", slug: "text-case-converter", desc: "Convert text between different cases" },
                { name: "HTML Entity Encoder", slug: "html-entity-encoder", desc: "Encode special characters to HTML entities" },
              ].map((tool) => (
                <a
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="bg-slate-700/50 hover:bg-slate-700 rounded p-3 transition-colors block"
                >
                  <div className="font-medium text-blue-400 text-sm">{tool.name}</div>
                  <div className="text-xs text-slate-400 mt-1">{tool.desc}</div>
                </a>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-slate-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "How do I copy an emoji?",
                  a: "Simply click any emoji to instantly copy it to your clipboard. You'll see a brief green highlight confirming the copy. You can also collect multiple emojis in the bar above the grid and copy them all at once with the 'Copy All' button."
                },
                {
                  q: "How many emojis are available?",
                  a: "This tool includes 500+ carefully curated emojis across 8 categories: Smileys & People, Animals & Nature, Food & Drink, Activities & Sports, Travel & Places, Objects, Symbols, and Flags. Each emoji is searchable by name and related keywords."
                },
                {
                  q: "Can I search for emojis?",
                  a: "Yes! Use the search bar to find emojis by name or keyword. For example, search 'fire' to find 🔥, 'heart' to find all heart emojis, or 'food' to browse food-related emojis. The search checks emoji names, categories, and related keywords."
                },
                {
                  q: "Do these emojis work everywhere?",
                  a: "These are standard Unicode emojis that work on all modern platforms — iOS, Android, Windows, macOS, and the web. Their appearance may vary slightly between platforms as each uses its own emoji font, but the meaning is the same everywhere."
                },
              ].map((item) => (
                <div key={item.q}>
                  <h3 className="font-medium text-white text-sm">{item.q}</h3>
                  <p className="text-slate-400 text-sm mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
