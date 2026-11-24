"use client";

import { MotionConfig } from "motion/react";

// Reduceret bevægelse: motion slår flyt og skalering fra, hvis enheden beder om det.
export default function MotionProvider({ children }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
