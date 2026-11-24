// Fælles timing til animationer med motion. Samme værdier som --motion-* i tokens.css,
// så CSS-animationer og motion-animationer føles ens.
export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
};

export const ease = {
  standard: [0, 0, 0.58, 1],
  inOut: [0.42, 0, 0.58, 1],
  bump: [0.34, 1.56, 0.64, 1],
};
