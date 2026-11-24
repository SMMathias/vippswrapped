"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import styles from "./Galaxy.module.css";

// Galaksen bag F09: lysprikker i fire spiralarme, der drejer rundt om en lys kerne.
// Tegnes på et canvas. Reduceret bevægelse: ét stillbillede.
const colors = ["#ffffff", "#fcf0ea", "#ffb08f", "#ff5b24", "#b9a6f5", "#5a3cba"];
const arms = 4;

// Prikkerne laves én gang: afstand fra midten, vinkel, farve og størrelse.
const dots = Array.from({ length: 500 }, (_, index) => {
  const radius = 10 + Math.random() * 320;
  const arm = (index % arms) * ((Math.PI * 2) / arms);
  return {
    radius,
    angle: arm + radius / 60 + (Math.random() - 0.5) * 0.5, // spiralen: længere ude = drejet mere
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 1 + Math.random() * 2.5,
  };
});

export default function Galaxy({ open }) {
  const canvasRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const cx = canvas.width / 2;
    const cy = canvas.height * 0.36; // bag titlen
    let turn = 0;
    let frame;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Kernen: en blød hvid glød i midten.
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.9)");
      glow.addColorStop(1, "rgba(255, 190, 160, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 90, cy - 90, 180, 180);
      // Prikkerne: inderst drejer hurtigst, som en rigtig galakse.
      for (const dot of dots) {
        const angle = dot.angle + turn / Math.sqrt(dot.radius / 20);
        ctx.fillStyle = dot.color;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * dot.radius, cy + Math.sin(angle) * dot.radius * 0.6, dot.size, 0, Math.PI * 2);
        ctx.fill();
      }
      turn += 0.004;
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.galaxy} ${open ? styles.open : ""}`}
      aria-hidden="true"
    />
  );
}
