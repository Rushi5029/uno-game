export const COLORS = ['red', 'yellow', 'green', 'blue'];
export const NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
export const ACTIONS = ['skip', 'reverse', 'draw2'];

/**
 * Generates an official 108-card UNO deck
 */
export function createDeck() {
  const deck = [];
  let cardCounter = 0;

  // 1. Color cards
  for (const color of COLORS) {
    // One '0' card per color
    deck.push({
      id: `${color}_0_${++cardCounter}`,
      color,
      value: '0',
      type: 'number'
    });

    // Two of each 1-9 per color
    for (let i = 1; i <= 9; i++) {
      const val = i.toString();
      deck.push({
        id: `${color}_${val}_${++cardCounter}`,
        color,
        value: val,
        type: 'number'
      });
      deck.push({
        id: `${color}_${val}_${++cardCounter}`,
        color,
        value: val,
        type: 'number'
      });
    }

    // Two of each Action card (Skip, Reverse, Draw Two) per color
    for (const action of ACTIONS) {
      deck.push({
        id: `${color}_${action}_${++cardCounter}`,
        color,
        value: action,
        type: 'action'
      });
      deck.push({
        id: `${color}_${action}_${++cardCounter}`,
        color,
        value: action,
        type: 'action'
      });
    }
  }

  // 2. Wild cards (4 Wild, 4 Wild Draw Four)
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `wild_${++cardCounter}`,
      color: 'wild',
      value: 'wild',
      type: 'wild'
    });
    deck.push({
      id: `wild_draw4_${++cardCounter}`,
      color: 'wild',
      value: 'wild_draw4',
      type: 'wild'
    });
  }

  return deck;
}

/**
 * Fisher-Yates shuffle algorithm
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
