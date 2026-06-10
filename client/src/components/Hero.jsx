import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import heroVideo from "../assets/hero-video.mp4";

export default function Hero() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
            return;
        }

        const hasAccount = localStorage.getItem('hasAccount') === 'true';
        if (hasAccount) {
            navigate('/login');
        } else {
            navigate('/register');
        }
    };

    return (
        <section className="relative min-h-screen overflow-hidden bg-black text-white">
            <video autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover">
                <source src={heroVideo} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/70"></div>
            <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500/30 blur-[150px]" />
            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="rounded-full border border-pink-500/40 bg-pink-500/10 px-4 py-2 text-sm text-pink-400">
                    Secure E-Signatures
                </motion.span>
                <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="mt-6 max-w-4xl text-5xl font-bold md:text-7xl">
                    Sign Documents <span className="text-pink-400"> Digitally</span>
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="mt-6 max-w-2xl text-lg text-gray-300">
                    Upload PDFs, sign securely, verify identities, and manage documents from anywhere.
                </motion.p>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="mt-8 flex gap-4">
                    <button
                        onClick={handleGetStarted}
                        type="button"
                        className="rounded-xl bg-pink-500 px-8 py-4 font-semibold text-black transition hover:bg-pink-400 cursor-pointer"
                    >
                        Get Started
                    </button>
                    <button type="button" className="rounded-xl border border-white/20 px-8 py-4 transition hover:bg-white/10">Learn More</button>
                </motion.div>
                <motion.div animate={{ y: [0, -15, 0], rotateY: [0, 10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="mt-20" style={{ perspective: 1000 }}>
                    <div className="h-80 w-60 rounded-3xl border border-pink-500/20 bg-zinc-900/80 p-6 backdrop-blur-lg">
                        <div className="mb-4 h-3 w-24 rounded bg-pink-500"></div>
                        <div className="space-y-3">
                            <div className="h-2 rounded bg-zinc-700"></div>
                            <div className="h-2 rounded bg-zinc-700"></div>
                            <div className="h-2 w-3/4 rounded bg-zinc-700"></div>
                        </div>
                        <div className="mt-10 rounded-xl border border-pink-500/30 p-4">
                            <h3 className="text-pink-400">Verified Signature ✓</h3>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}