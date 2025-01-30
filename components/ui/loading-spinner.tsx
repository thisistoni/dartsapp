import { motion } from 'framer-motion';
import { ClipLoader } from "react-spinners";

export const LoadingSpinner = ({ text = "Loading..." }) => (
    <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex flex-col items-center justify-center h-screen gap-4"
    >
        <ClipLoader color="#3B82F6" size={40} />
        <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 font-medium"
        >
            {text}
        </motion.p>
    </motion.div>
); 