"use client";
import { motion } from "framer-motion";

export function Logo({ size = 22 }: { size?: number }) {
  return (
    <motion.svg
      width={size} height={size} viewBox="0 0 32 32" fill="none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect x="3" y="18" width="5" height="11" rx="1" fill="#5C6470"
        initial={{ height: 0, y: 29 }} animate={{ height: 11, y: 18 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }} />
      <motion.rect x="13.5" y="10" width="5" height="19" rx="1" fill="#8B94A0"
        initial={{ height: 0, y: 29 }} animate={{ height: 19, y: 10 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }} />
      <motion.rect x="24" y="3" width="5" height="26" rx="1" fill="#C08A2E"
        initial={{ height: 0, y: 29 }} animate={{ height: 26, y: 3 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }} />
    </motion.svg>
  );
}