export const randInt = (n) => Math.floor(Math.random() * n);

export const pick = (arr) => arr[randInt(arr.length)];

export const chance = (p) => Math.random() < p;
