type CharStatus = "present" | "absent" | "correct";
type letterStatus = {
  [key: string]: CharStatus;
};

export const letterStatuses = (
  solution: string,
  prevGuesses: string[]
): letterStatus => {
  const chars: { [key: string]: CharStatus } = {};
  for (const guess of prevGuesses) {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i];
      // guess and solutions should always be the same length
      if (solution[i] === letter) chars[letter] = "correct";
      else if (solution.includes(letter)) chars[letter] = "present";
      else chars[letter] = "absent";
    }
  }
  return chars;
};

export const isServer = () => typeof window === "undefined";

import { WORDS } from "../constants/words";
export const getRandomWord = () => {
  const wordIdx = Math.floor(Math.random() * 2315);
  return WORDS[wordIdx].toUpperCase();
};
