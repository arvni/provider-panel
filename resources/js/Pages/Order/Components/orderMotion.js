/**
 * Framer-motion variants shared by the Order Show + Finalize pages. Both pages
 * used identical stagger-in container/item variants; extracted to keep them in
 * sync.
 */
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            when: "beforeChildren",
            staggerChildren: 0.1,
        },
    },
};

export const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { duration: 0.4 },
    },
};
