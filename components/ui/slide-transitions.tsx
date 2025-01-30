"use client";

import { motion } from "framer-motion";

interface SlideProps {
    children: React.ReactNode;
}

export const SlideLeft = ({ children }: SlideProps) => (
    <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
        {children}
    </motion.div>
);

export const SlideRight = ({ children }: SlideProps) => (
    <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
    >
        {children}
    </motion.div>
); 