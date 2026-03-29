/**
 * Questionnaire Definition
 * ========================
 * All 50 questions organized into 8 stages with:
 *   - Input types (slider, single_select, multi_select, scale, number, text)
 *   - Skip logic functions
 *   - Scoring dimension mappings
 */

export const STAGES = [
  { id: 'budget', label: 'Budget & Finances', icon: '💰', color: '#D4A574' },
  { id: 'riders', label: 'Who\'s Riding', icon: '👥', color: '#7BA7BC' },
  { id: 'driving', label: 'How You Drive', icon: '🛣️', color: '#8B9E6B' },
  { id: 'reliability', label: 'Reliability', icon: '🔧', color: '#C4786C' },
  { id: 'features', label: 'Features & Tech', icon: '⚙️', color: '#9B8EC4' },
  { id: 'powertrain', label: 'Powertrain', icon: '⚡', color: '#6BA5A5' },
  { id: 'style', label: 'Style & Preferences', icon: '🎨', color: '#C49B6C' },
  { id: 'final', label: 'Final Details', icon: '📍', color: '#7C8EA0' },
];

export const QUESTIONS = [
  // ── Stage 1: Budget & Financial Reality ──
  {
    id: 1, stage: 'budget',
    text: 'What\'s your total budget for this vehicle?',
    subtext: 'Include everything — purchase price, taxes, fees.',
    type: 'slider',
    min: 5000, max: 100000, step: 1000,
    format: 'currency',
    defaultValue: 30000,
  },
  {
    id: 2, stage: 'budget',
    text: 'How are you planning to pay?',
    type: 'single_select',
    options: [
      { value: 'cash', label: 'Cash / all upfront' },
      { value: 'finance', label: 'Financing a loan' },
      { value: 'lease', label: 'Leasing' },
      { value: 'undecided', label: 'Not sure yet' },
    ],
  },
  {
    id: 3, stage: 'budget',
    text: 'What monthly payment range works for you?',
    type: 'slider',
    min: 150, max: 1500, step: 25,
    format: 'currency',
    defaultValue: 400,
    skipIf: (answers) => answers[2] === 'cash',
  },
  {
    id: 4, stage: 'budget',
    text: 'How important is resale value to you?',
    subtext: 'Some brands hold value much better than others.',
    type: 'scale',
    labels: ['Don\'t care', 'Somewhat', 'Neutral', 'Important', 'Very important'],
  },
  {
    id: 5, stage: 'budget',
    text: 'What\'s your comfort level with maintenance costs?',
    subtext: 'Luxury and performance cars cost more to maintain.',
    type: 'single_select',
    options: [
      { value: 'low', label: 'Keep it low — budget-friendly maintenance' },
      { value: 'medium', label: 'Moderate — willing to pay for quality' },
      { value: 'high', label: 'Not concerned — happy to invest in the car' },
    ],
  },
  {
    id: 6, stage: 'budget',
    text: 'How important is minimizing fuel or energy costs?',
    type: 'single_select',
    options: [
      { value: 'not_important', label: 'Not a big factor for me' },
      { value: 'somewhat', label: 'Would prefer something efficient' },
      { value: 'very', label: 'This is a top priority' },
    ],
  },
  {
    id: 7, stage: 'budget',
    text: 'Are you open to new, used, or certified pre-owned?',
    subtext: 'Select all that apply.',
    type: 'multi_select',
    options: [
      { value: 'new', label: 'New' },
      { value: 'used', label: 'Used' },
      { value: 'cpo', label: 'Certified Pre-Owned' },
    ],
  },

  // ── Stage 2: Who's Riding ──
  {
    id: 8, stage: 'riders',
    text: 'How many people will regularly ride in the car?',
    subtext: 'Including you.',
    type: 'number',
    min: 1, max: 9,
    defaultValue: 2,
  },
  {
    id: 9, stage: 'riders',
    text: 'Do you have child car seats or plan to need them?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes, I need car seat compatibility' },
      { value: 'maybe', label: 'Maybe in the near future' },
      { value: 'no', label: 'No' },
    ],
    skipIf: (answers) => (answers[8] || 2) <= 2,
  },
  {
    id: 10, stage: 'riders',
    text: 'Do you regularly carry pets?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes — they ride with me often' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 11, stage: 'riders',
    text: 'Do you need wheelchair or mobility accessibility features?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  {
    id: 12, stage: 'riders',
    text: 'How tall is the tallest person who\'ll regularly ride?',
    subtext: 'Helps us filter for headroom and legroom.',
    type: 'single_select',
    options: [
      { value: 'average', label: 'Under 5\'10"' },
      { value: 'tall', label: '5\'10" to 6\'2"' },
      { value: 'very_tall', label: 'Over 6\'2"' },
    ],
    skipIf: (answers) => (answers[8] || 2) <= 1,
  },

  // ── Stage 3: How & Where You Drive ──
  {
    id: 13, stage: 'driving',
    text: 'How many miles do you drive per week?',
    type: 'slider',
    min: 0, max: 500, step: 10,
    format: 'miles',
    defaultValue: 150,
  },
  {
    id: 14, stage: 'driving',
    text: 'What\'s your longest regular trip?',
    subtext: 'Think commute, weekend drives, or regular road trips.',
    type: 'slider',
    min: 5, max: 500, step: 5,
    format: 'miles',
    defaultValue: 30,
  },
  {
    id: 15, stage: 'driving',
    text: 'What\'s your primary driving environment?',
    subtext: 'Select all that apply.',
    type: 'multi_select',
    options: [
      { value: 'city', label: 'City streets' },
      { value: 'suburban', label: 'Suburban roads' },
      { value: 'rural', label: 'Rural / country roads' },
      { value: 'highway', label: 'Highway commute' },
    ],
  },
  {
    id: 16, stage: 'driving',
    text: 'Do you drive on unpaved roads, gravel, or off-road?',
    type: 'single_select',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'frequently', label: 'Frequently' },
    ],
  },
  {
    id: 17, stage: 'driving',
    text: 'Do you drive in heavy snow or ice?',
    type: 'single_select',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'frequently', label: 'Frequently' },
    ],
  },
  {
    id: 18, stage: 'driving',
    text: 'How would you describe your driving style?',
    type: 'single_select',
    options: [
      { value: 'relaxed', label: 'Relaxed — comfort over speed' },
      { value: 'balanced', label: 'Balanced — a bit of both' },
      { value: 'spirited', label: 'Spirited — I enjoy driving' },
      { value: 'performance', label: 'Performance-focused — I want thrills' },
    ],
  },
  {
    id: 19, stage: 'driving',
    text: 'How important is a smooth, quiet ride?',
    type: 'scale',
    labels: ['Don\'t care', '', 'Neutral', '', 'Very important'],
  },
  {
    id: 20, stage: 'driving',
    text: 'Do you need to tow anything?',
    type: 'single_select',
    options: [
      { value: 'no', label: 'No towing needed' },
      { value: 'light', label: 'Occasionally — small trailer or jet ski' },
      { value: 'heavy', label: 'Regularly — boat, camper, or heavy loads' },
    ],
  },
  {
    id: 21, stage: 'driving',
    text: 'How much cargo space do you need day-to-day?',
    type: 'single_select',
    options: [
      { value: 'minimal', label: 'Minimal — a bag or two' },
      { value: 'moderate', label: 'Moderate — groceries, gear' },
      { value: 'lots', label: 'A lot — sports equipment, tools' },
      { value: 'max', label: 'Maximum — I haul large items regularly' },
    ],
  },
  {
    id: 22, stage: 'driving',
    text: 'Do you regularly need to fit specific large items?',
    subtext: 'Select all that apply, or skip if none.',
    type: 'multi_select',
    options: [
      { value: 'bikes', label: 'Bicycles' },
      { value: 'surfboards', label: 'Surfboards / kayaks' },
      { value: 'tools', label: 'Power tools / work equipment' },
      { value: 'strollers', label: 'Strollers' },
      { value: 'none', label: 'None of these' },
    ],
  },

  // ── Stage 4: Reliability & Longevity ──
  {
    id: 23, stage: 'reliability',
    text: 'How many total miles do you expect to put on this car?',
    type: 'slider',
    min: 30000, max: 300000, step: 10000,
    format: 'miles',
    defaultValue: 100000,
  },
  {
    id: 24, stage: 'reliability',
    text: 'How long do you plan to keep it?',
    type: 'single_select',
    options: [
      { value: '1-3', label: '1–3 years' },
      { value: '3-5', label: '3–5 years' },
      { value: '5-10', label: '5–10 years' },
      { value: '10+', label: '10+ years' },
      { value: 'forever', label: 'Until it dies' },
    ],
  },
  {
    id: 25, stage: 'reliability',
    text: 'How important is the brand\'s reliability reputation?',
    type: 'scale',
    labels: ['Don\'t care', '', 'Neutral', '', 'Extremely important'],
  },
  {
    id: 26, stage: 'reliability',
    text: 'Are you comfortable doing basic maintenance yourself?',
    subtext: 'Oil changes, air filters, brake pads, etc.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes — I\'m handy with cars' },
      { value: 'no', label: 'No — I\'ll take it to a shop for everything' },
    ],
  },
  {
    id: 27, stage: 'reliability',
    text: 'Do you want a vehicle still under manufacturer warranty?',
    type: 'single_select',
    options: [
      { value: 'must', label: 'Must have warranty coverage' },
      { value: 'prefer', label: 'Would prefer it, but not essential' },
      { value: 'no', label: 'Don\'t care about warranty' },
    ],
  },
  {
    id: 28, stage: 'reliability',
    text: 'How do you feel about vehicle recalls?',
    subtext: 'All manufacturers issue recalls. Some more than others.',
    type: 'single_select',
    options: [
      { value: 'not_concerned', label: 'Not concerned — part of car ownership' },
      { value: 'somewhat', label: 'Somewhat concerned — prefer fewer recalls' },
      { value: 'very', label: 'Very concerned — want a clean record' },
    ],
  },

  // ── Stage 5: Features & Technology ──
  {
    id: 29, stage: 'features',
    text: 'How important are advanced safety features?',
    subtext: 'Auto emergency braking, lane assist, blind spot monitoring.',
    type: 'scale',
    labels: ['Don\'t need', '', 'Nice to have', '', 'Must have'],
  },
  {
    id: 30, stage: 'features',
    text: 'Do you want a backup camera?',
    subtext: 'Required on all new cars since May 2018.',
    type: 'single_select',
    options: [
      { value: 'need', label: 'Yes, I need one' },
      { value: 'nice', label: 'Nice to have but not essential' },
    ],
  },
  {
    id: 31, stage: 'features',
    text: 'How important is the infotainment system?',
    type: 'single_select',
    options: [
      { value: 'dont_care', label: 'Don\'t care — just need a radio' },
      { value: 'basic', label: 'Basic is fine — touchscreen and Bluetooth' },
      { value: 'best', label: 'Want the best — large screen, fast, responsive' },
    ],
  },
  {
    id: 32, stage: 'features',
    text: 'Do you need Apple CarPlay or Android Auto?',
    type: 'single_select',
    options: [
      { value: 'must', label: 'Must have' },
      { value: 'nice', label: 'Nice to have' },
      { value: 'no', label: 'Don\'t care' },
    ],
  },
  {
    id: 33, stage: 'features',
    text: 'How important is a premium sound system?',
    type: 'scale',
    labels: ['Don\'t care', '', 'Neutral', '', 'Very important'],
  },
  {
    id: 34, stage: 'features',
    text: 'Do you want adaptive cruise control or semi-autonomous driving?',
    type: 'single_select',
    options: [
      { value: 'must', label: 'Must have' },
      { value: 'nice', label: 'Nice to have' },
      { value: 'no', label: 'Don\'t need it' },
    ],
  },
  {
    id: 35, stage: 'features',
    text: 'How important is a sunroof or moonroof?',
    type: 'single_select',
    options: [
      { value: 'must', label: 'Must have' },
      { value: 'nice', label: 'Nice to have' },
      { value: 'no', label: 'Don\'t care' },
    ],
  },
  {
    id: 36, stage: 'features',
    text: 'Do you need heated or cooled seats?',
    type: 'single_select',
    options: [
      { value: 'must', label: 'Must have' },
      { value: 'nice', label: 'Nice to have' },
      { value: 'no', label: 'Don\'t care' },
    ],
  },

  // ── Stage 6: Powertrain & Efficiency ──
  {
    id: 37, stage: 'powertrain',
    text: 'Are you open to an electric vehicle?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes — I\'m interested' },
      { value: 'maybe', label: 'Maybe — depends on range and price' },
      { value: 'no', label: 'No — not for me right now' },
    ],
  },
  {
    id: 38, stage: 'powertrain',
    text: 'What about a hybrid or plug-in hybrid?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes — great middle ground' },
      { value: 'maybe', label: 'Maybe' },
      { value: 'no', label: 'No — prefer traditional gas' },
    ],
  },
  {
    id: 39, stage: 'powertrain',
    text: 'Do you have access to home charging?',
    subtext: 'A regular outlet works for plug-in hybrids; EVs benefit from a Level 2 charger.',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes — I have or can install a charger' },
      { value: 'no', label: 'No — I\'d rely on public charging' },
      { value: 'could', label: 'I could install one if needed' },
    ],
    skipIf: (answers) => answers[37] === 'no' && answers[38] === 'no',
  },
  {
    id: 40, stage: 'powertrain',
    text: 'Do you have a minimum fuel economy you\'d accept?',
    type: 'single_select',
    options: [
      { value: 'dont_care', label: 'Don\'t care about MPG' },
      { value: '20', label: 'At least 20 MPG' },
      { value: '25', label: 'At least 25 MPG' },
      { value: '30', label: 'At least 30 MPG' },
      { value: '35', label: 'At least 35 MPG' },
      { value: '40', label: '40+ MPG' },
    ],
  },
  {
    id: 41, stage: 'powertrain',
    text: 'What\'s your preference for engine power?',
    type: 'single_select',
    options: [
      { value: 'efficient', label: 'Efficient is fine — just get me there' },
      { value: 'some', label: 'Want some power — comfortable merging and passing' },
      { value: 'lots', label: 'Need serious power — towing or performance' },
    ],
  },

  // ── Stage 7: Aesthetics & Preferences ──
  {
    id: 42, stage: 'style',
    text: 'What body styles appeal to you?',
    subtext: 'Select all that interest you.',
    type: 'multi_select',
    options: [
      { value: 'sedan', label: 'Sedan' },
      { value: 'suv', label: 'SUV / Crossover' },
      { value: 'truck', label: 'Pickup Truck' },
      { value: 'coupe', label: 'Coupe' },
      { value: 'hatchback', label: 'Hatchback' },
      { value: 'minivan', label: 'Minivan' },
      { value: 'wagon', label: 'Wagon' },
      { value: 'convertible', label: 'Convertible' },
    ],
  },
  {
    id: 43, stage: 'style',
    text: 'Do you prefer a specific size?',
    type: 'single_select',
    options: [
      { value: 'compact', label: 'Compact — easy to park, nimble' },
      { value: 'midsize', label: 'Midsize — balanced' },
      { value: 'fullsize', label: 'Full-size — maximum room' },
      { value: 'any', label: 'No preference' },
    ],
  },
  {
    id: 44, stage: 'style',
    text: 'Any brands you love — or refuse to consider?',
    subtext: 'Optional. This is a hard filter if used.',
    type: 'brand_selector',
    brands: [
      'Acura','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler','Dodge',
      'Ford','Genesis','GMC','Honda','Hyundai','Infiniti','Jaguar','Jeep',
      'Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','MINI',
      'Mitsubishi','Nissan','Porsche','Ram','Subaru','Tesla','Toyota',
      'Volkswagen','Volvo',
    ],
  },
  {
    id: 45, stage: 'style',
    text: 'How important is the car\'s exterior appearance to you?',
    type: 'scale',
    labels: ['Not important', '', 'Neutral', '', 'Very important'],
  },
  {
    id: 46, stage: 'style',
    text: 'Do you prefer a higher driving position or lower/sportier feel?',
    type: 'single_select',
    options: [
      { value: 'high', label: 'Higher — I like to see over traffic' },
      { value: 'low', label: 'Lower — sportier, more connected to the road' },
      { value: 'no_pref', label: 'No preference' },
    ],
  },

  // ── Stage 8: Deal-Breakers & Final Preferences ──
  {
    id: 47, stage: 'final',
    text: 'What\'s the maximum mileage you\'d accept on a used car?',
    type: 'slider',
    min: 10000, max: 200000, step: 5000,
    format: 'miles',
    defaultValue: 60000,
    skipIf: (answers) => {
      const condition = answers[7];
      return Array.isArray(condition) && condition.length === 1 && condition[0] === 'new';
    },
  },
  {
    id: 48, stage: 'final',
    text: 'How far are you willing to travel to pick up the car?',
    type: 'single_select',
    options: [
      { value: '25', label: 'Within 25 miles' },
      { value: '50', label: 'Within 50 miles' },
      { value: '100', label: 'Within 100 miles' },
      { value: '250', label: 'Within 250 miles' },
      { value: 'any', label: 'Anywhere — I\'ll have it shipped' },
    ],
  },
  {
    id: 49, stage: 'final',
    text: 'What\'s your zip code?',
    subtext: 'Used to find cars near you. Never shared.',
    type: 'text',
    placeholder: '28202',
    maxLength: 5,
    validate: (val) => /^\d{5}$/.test(val),
  },
  {
    id: 50, stage: 'final',
    text: 'Anything else we should know?',
    subtext: 'Optional — any deal-breakers, must-haves, or context we haven\'t covered.',
    type: 'text',
    placeholder: 'e.g., "I have a long driveway with a steep incline" or "I need to fit a wheelchair in the trunk"',
    maxLength: 500,
    optional: true,
  },
];
