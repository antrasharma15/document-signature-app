import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSignature,
  Users,
  Activity,
  ShieldCheck,
  Cloud,
  UsersRound,
  FileStack,
  Lock,
  Upload,
  Send,
  Download,
  UserPlus,
  CheckCircle2,
  Clock,
  ChevronDown,
  ArrowRight,
  Play,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Shared tokens                                                       */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function SectionLabel({ children }) {
  return (
    <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-700">
      <span className="h-px w-6 bg-gradient-to-r from-violet-600 to-pink-600" />
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated signature stroke (signature element)                      */
/* ------------------------------------------------------------------ */

function SignatureStroke({ className = "" }) {
  return (
    <svg
      viewBox="0 0 420 120"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <motion.path
        d="M10 90 C 40 30, 70 30, 90 70 C 110 110, 140 40, 165 60 C 190 80, 200 30, 230 50 C 260 70, 270 100, 300 60 C 330 20, 350 90, 410 40"
        stroke="url(#sigGradient)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: "easeInOut", delay: 0.4 }}
      />
      <defs>
        <linearGradient id="sigGradient" x1="0" y1="0" x2="420" y2="0">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="55%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                          */
/* ------------------------------------------------------------------ */

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = ["Features", "Solutions", "Security", "Contact"];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"
        }`}
    >
      <div className="mx-auto max-w-7xl px-6">
        <div
          className={`flex items-center justify-between rounded-2xl px-5 transition-all duration-300 ${scrolled
              ? "bg-[#BAC095]/85 backdrop-blur-xl border border-[#3D4127]/10 py-2.5 shadow-[0_8px_30px_rgba(61,65,39,0.15)]"
              : "bg-transparent py-2"
            }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500">
              <FileSignature className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
            </span>
            <span className="text-[17px] font-semibold tracking-tight text-[#3D4127]">
              EASY<span className="text-violet-700">sign</span>
            </span>
          </Link>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l}
                href={`#${l.toLowerCase()}`}
                className="text-[13.5px] font-medium text-[#3D4127]/80 hover:text-[#3D4127] transition-colors"
              >
                {l}
              </a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {token ? (
              <Link
                to="/dashboard"
                className="group inline-flex items-center gap-1.5 rounded-full bg-[#3D4127] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#3D4127]/90"
              >
                Dashboard
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block text-[13.5px] font-medium text-[#3D4127]/80 hover:text-[#3D4127] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-1.5 rounded-full bg-[#3D4127] px-4 py-2 text-[13px] font-semibold text-white transition-all hover:bg-[#3D4127]/90"
                >
                  Sign up
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                                 */
/* ------------------------------------------------------------------ */

function Hero() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <section className="relative overflow-hidden pt-36 pb-28 sm:pt-44 sm:pb-36">
      {/* Background atmosphere */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#BAC095]" />
        <div className="absolute -top-1/3 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-violet-400/25 blur-[140px]" />
        <div className="absolute top-1/4 right-0 h-[500px] w-[500px] rounded-full bg-pink-400/20 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.2]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(61,65,39,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(61,65,39,0.06) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mx-auto max-w-3xl text-center"
        >
          <motion.div variants={fadeUp} className="mb-6 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#BAC095] bg-[#BAC095]/20 px-4 py-1.5 text-[12.5px] font-medium text-[#3D4127]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Encrypted storage · Full audit trail on every document
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="font-display text-[2.75rem] sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-[#3D4127]"
          >
            Sign, send &amp; manage
            <br />
            documents{" "}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-violet-700 via-pink-600 to-rose-700 bg-clip-text text-transparent">
                securely
              </span>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-6 max-w-xl text-[15.5px] sm:text-lg text-[#3D4127]/80 leading-relaxed"
          >
            Upload documents, collect legally binding signatures, track
            progress in real time, and manage everything from one secure
            dashboard.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={handleGetStarted}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-7 py-3.5 text-[14.5px] font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.6)] transition-transform hover:scale-[1.03] cursor-pointer"
            >
              Ready to Start
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <a
              href="#solutions"
              className="group inline-flex items-center gap-2 rounded-full border border-[#3D4127]/20 bg-[#BAC095]/30 px-7 py-3.5 text-[14.5px] font-semibold text-[#3D4127] backdrop-blur-sm transition-colors hover:bg-[#BAC095]/50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3D4127]/10">
                <Play className="h-3 w-3 fill-[#3D4127]" />
              </span>
              Watch Demo
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard mockup (used in hero + product showcase)                  */
/* ------------------------------------------------------------------ */

function DashboardMockup({ interactive = false }) {
  const [hovered, setHovered] = useState(null);

  const docs = [
    { name: "Founders_Agreement.pdf", status: "signed", who: "3/3 signed" },
    { name: "Vendor_Contract.pdf", status: "pending", who: "1/2 signed" },
    { name: "Offer_Letter_R.Patel.pdf", status: "pending", who: "0/1 signed" },
    { name: "MSA_Acme_Corp.pdf", status: "signed", who: "2/2 signed" },
  ];

  return (
    <div className="rounded-2xl border border-[#3D4127]/15 bg-white/70 p-2 shadow-[0_30px_100px_-20px_rgba(61,65,39,0.15)] backdrop-blur-2xl">
      <div className="rounded-xl border border-[#3D4127]/10 bg-white overflow-hidden">
        {/* top bar */}
        <div className="flex items-center gap-2 border-b border-[#3D4127]/10 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>
          <span className="ml-2 text-[11px] text-slate-500">app.EASYsign.io/dashboard</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
          {/* sidebar */}
          <div className="hidden sm:block border-r border-[#3D4127]/10 p-4 space-y-1">
            {[
              { icon: FileStack, label: "All Documents", active: true },
              { icon: Send, label: "Sent for Signing" },
              { icon: Clock, label: "Pending" },
              { icon: CheckCircle2, label: "Completed" },
              { icon: Activity, label: "Activity Log" },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] transition-colors ${item.active
                  ? "bg-[#3D4127]/10 text-[#3D4127] font-medium"
                  : "text-slate-500 hover:text-[#3D4127]"
                  }`}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </div>
            ))}
          </div>

          {/* main */}
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#3D4127]">Documents</p>
                <p className="text-[11px] text-slate-500">4 active · updated just now</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                <Upload className="h-3 w-3" />
                Upload
              </span>
            </div>

            <div className="space-y-2">
              {docs.map((doc, i) => (
                <motion.div
                  key={doc.name}
                  onMouseEnter={() => interactive && setHovered(i)}
                  onMouseLeave={() => interactive && setHovered(null)}
                  animate={interactive ? { scale: hovered === i ? 1.015 : 1 } : {}}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between rounded-lg border border-[#3D4127]/10 bg-[#BAC095]/10 px-3.5 py-2.5 transition-colors hover:border-violet-600/30 hover:bg-[#BAC095]/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-rose-100 text-[9px] font-bold text-rose-700">
                      PDF
                    </span>
                    <span className="truncate text-[12.5px] text-[#3D4127]">{doc.name}</span>
                  </div>
                  <span
                    className={`shrink-0 ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10.5px] font-medium ${doc.status === "signed"
                      ? "bg-emerald-500/10 text-emerald-700"
                      : "bg-amber-500/10 text-amber-700"
                      }`}
                  >
                    {doc.status === "signed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {doc.who}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* activity timeline strip */}
            <div className="mt-4 rounded-lg border border-[#3D4127]/10 bg-[#BAC095]/10 p-3">
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-[#3D4127]/60">
                Recent activity
              </p>
              <div className="space-y-1.5">
                {[
                  "Riya Patel viewed Offer_Letter_R.Patel.pdf",
                  "Vendor_Contract.pdf signed by Marcus Lee",
                  "MSA_Acme_Corp.pdf sent to 2 signers",
                ].map((a) => (
                  <div key={a} className="flex items-center gap-2 text-[11px] text-[#3D4127]/80">
                    <span className="h-1 w-1 rounded-full bg-violet-600" />
                    {a}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product showcase                                                     */
/* ------------------------------------------------------------------ */

function ProductShowcase() {
  return (
    <section id="solutions" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Inside EASYsign</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
          >
            One dashboard for every document, signer, and signature
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-[#3D4127]/80 text-[15px]">
            Upload, send, and track documents in real time — see exactly who's
            signed, who's pending, and what happened, when.
          </motion.p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
        >
          <DashboardMockup interactive />
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                             */
/* ------------------------------------------------------------------ */



const FEATURES = [
  { icon: FileSignature, title: "Secure Digital Signatures", desc: "Draw or upload a signature and embed it directly into the document at the exact position you place it." },
  { icon: Users, title: "Tokenized Signing Links", desc: "Send a secure, time-limited link to a signer — no account required on their end." },
  { icon: Activity, title: "Real-Time Status Tracking", desc: "Watch documents move from pending to signed or rejected, the moment it happens." },
  { icon: ShieldCheck, title: "Audit Trail & Activity Logs", desc: "Every view, sign, and rejection is logged with a timestamp and IP for full traceability." },
  { icon: Cloud, title: "Document Storage", desc: "Original and signed versions of every document are saved and stay linked to your account." },
  { icon: UsersRound, title: "Signer Activity Visibility", desc: "See exactly when each signer viewed, signed, or rejected a document — no account needed on their end." },
  { icon: FileStack, title: "PDF Management", desc: "Upload, preview, and filter your documents by status, all from a single dashboard." },
  { icon: Lock, title: "Owner-Controlled Access", desc: "Only the document owner can send, finalize, or view the audit trail — signers only see what's shared with them." },
];

function Features() {
  return (
    <section id="features" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Built for trust</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
          >
            Everything a modern signing workflow needs
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-[#BAC095] bg-white/40 p-5 transition-colors hover:border-[#636B2F] hover:bg-white/60 shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600/10 to-pink-600/10 text-violet-700 transition-colors group-hover:text-pink-600">
                <f.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-[14.5px] font-semibold text-[#3D4127]">{f.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D4127]/80">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How it works                                                         */
/* ------------------------------------------------------------------ */

const STEPS = [
  { icon: Upload, title: "Upload Document", desc: "Drag in any PDF — contracts, offer letters, NDAs, or forms." },
  { icon: UserPlus, title: "Add Signers", desc: "Add one or more signers and place signature fields exactly where needed." },
  { icon: Send, title: "Send for Signature", desc: "Signers get a secure link by email — no account required on their end." },
  { icon: Download, title: "Download Signed Document", desc: "Once everyone signs, download the finalized, tamper-evident PDF." },
];

function HowItWorks() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center mb-20"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>The workflow</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
          >
            From upload to signed in four easy steps
          </motion.h2>
        </motion.div>

        <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* connecting line */}
          <div className="absolute left-0 right-0 top-7 hidden h-px lg:block">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="h-full w-full origin-left bg-gradient-to-r from-violet-600/30 via-pink-600/30 to-violet-600/5"
            />
          </div>

          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative"
            >
              <div className="relative z-10 mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#BAC095] bg-white text-violet-700 shadow-md">
                <step.icon className="h-6 w-6" strokeWidth={1.75} />
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-[10px] font-bold text-white">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-[15px] font-semibold text-[#3D4127]">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D4127]/80">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Security                                                             */
/* ------------------------------------------------------------------ */

const SECURITY_POINTS = [
  { icon: Lock, title: "Encrypted Connections", desc: "All traffic between your browser and the server runs over HTTPS." },
  { icon: Cloud, title: "Access-Controlled Storage", desc: "Uploaded documents are only accessible to their owner and authorized signers." },
  { icon: Activity, title: "Audit Logs", desc: "Every view, sign, and rejection is recorded with a timestamp and IP address." },
  { icon: ShieldCheck, title: "User Authentication", desc: "JWT-based sessions, hashed credentials, and protected routes by default." },
  { icon: FileStack, title: "Privacy-Conscious Design", desc: "Built with data minimization in mind — only what's needed is stored." },
];

function Security() {
  return (
    <section id="security" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/20 blur-[160px]" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Animated shield illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative mx-auto flex h-72 w-72 items-center justify-center sm:h-96 sm:w-96"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute h-full w-full rounded-full border border-dashed border-[#3D4127]/15"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="absolute h-[80%] w-[80%] rounded-full border border-[#3D4127]/10"
            />
            <div className="absolute h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-32 w-32 items-center justify-center rounded-3xl border border-[#BAC095] bg-white shadow-2xl"
            >
              <ShieldCheck className="h-14 w-14 text-violet-700" strokeWidth={1.5} />
              <motion.span
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-sm"
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div variants={fadeUp}>
              <SectionLabel>Security first</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeUp}
              className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
            >
              Your documents, protected at every layer
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-[#3D4127]/80 text-[15px] max-w-md">
              Security isn't a feature here — it's the foundation everything
              else is built on.
            </motion.p>

            <div className="mt-8 space-y-4">
              {SECURITY_POINTS.map((p) => (
                <motion.div key={p.title} variants={fadeUp} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 text-violet-700">
                    <p.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#3D4127]">{p.title}</h3>
                    <p className="mt-0.5 text-[13px] text-[#3D4127]/80 leading-relaxed">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Use cases                                                            */
/* ------------------------------------------------------------------ */

const USE_CASES = [
  { title: "Businesses", desc: "Send contracts and vendor agreements for fast remote signoff.", icon: FileStack },
  { title: "HR Teams", desc: "Offer letters, NDAs, and policy acknowledgements, handled digitally.", icon: Users },
  { title: "Freelancers", desc: "Get client agreements and proposals signed without the back-and-forth.", icon: FileSignature },
  { title: "Students", desc: "Sign consent forms, applications, and admission documents from anywhere.", icon: UserPlus },
  { title: "Legal Professionals", desc: "Maintain traceability and audit trails for every executed document.", icon: ShieldCheck },
  { title: "Educational Institutions", desc: "Manage approvals, certificates, and enrollment paperwork without the paper trail.", icon: Cloud },
];

function UseCases() {
  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Who it's for</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
          >
            Built for every team that handles paperwork
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {USE_CASES.map((u) => (
            <motion.div
              key={u.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-[#BAC095] bg-white/40 p-6 transition-colors hover:border-pink-600/30 hover:bg-white/60 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-100 text-pink-700">
                <u.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <h3 className="mt-4 text-[15px] font-semibold text-[#3D4127]">{u.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#3D4127]/80">{u.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stats                                                                */
/* ------------------------------------------------------------------ */





/* ------------------------------------------------------------------ */
/*  FAQ                                                                  */
/* ------------------------------------------------------------------ */

const FAQS = [
  { q: "Do signers need to create an account?", a: "No. Signers receive a secure, time-limited link by email and can review and sign the document without registering for anything." },
  { q: "What happens to the original document?", a: "The original upload is kept on file, and a separate signed copy is generated with the signature embedded once the signer submits." },
  { q: "Can I see who viewed but didn't sign?", a: "Yes. The activity log records every view, sign, and rejection, so you always know exactly where a document stands." },
  { q: "Can a signer reject a document?", a: "Yes. A signer can decline to sign and provide a reason, which is recorded in the document's activity log and visible to the owner." },
{ q: "How is my signature added to the document?", a: "You can draw your signature or upload an image of it. It's placed exactly where you position it on the document before it's embedded into the final PDF." },
  { q: "Can I download the signed document?", a: "Yes. Once a document is signed, the owner can download the finalized PDF with the signature embedded." },
];
function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-3xl px-6">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-14"
        >
          <motion.div variants={fadeUp}>
            <SectionLabel>Questions</SectionLabel>
          </motion.div>
          <motion.h2
            variants={fadeUp}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#3D4127]"
          >
            Frequently asked questions
          </motion.h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-xl border border-[#BAC095] bg-white/40 overflow-hidden"
            >
              <button
                onClick={() => setOpen(open === i ? -1 : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-[14px] font-medium text-[#3D4127]">{item.q}</span>
                <motion.span
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-4 shrink-0 text-[#3D4127]/60"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <p className="px-5 pb-4 text-[13.5px] leading-relaxed text-[#3D4127]/80">
                      {item.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                            */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <section className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-[#3D4127]/25 bg-gradient-to-br from-[#3D4127] via-[#252818] to-[#1C1E12] px-8 py-16 text-center sm:px-16"
        >
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/20 blur-[100px]" />

          <div className="relative">
            <SignatureStroke className="mx-auto mb-6 h-12 w-48 opacity-80" />
            <h2 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-white">
              Ready to simplify
              <br />
              document signing?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#BAC095]">
              Join today and experience the simplicity of digital signatures.
            </p>
            <button
              onClick={handleGetStarted}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#BAC095] px-8 py-4 text-[15px] font-semibold text-[#3D4127] transition-transform hover:bg-white cursor-pointer"
            >
              Get Started Today
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                               */
/* ------------------------------------------------------------------ */

function Footer() {
  const columns = [
    { title: "Product", links: ["Features","Security"] },
    { title: "Company", links: ["About", "Contact"] },
    { title: "Legal", links: ["Privacy Policy", "Terms & Conditions"] },
  ];

  return (
    <footer id="contact" className="relative border-t border-[#3D4127]/10 py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <a href="#" className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500">
                <FileSignature className="h-4.5 w-4.5 text-white" strokeWidth={2.25} />
              </span>
              <span className="text-[17px] font-semibold tracking-tight text-[#3D4127]">
                Signa<span className="text-violet-700">fy</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#3D4127]/70">
              Secure document signing and management for teams that move fast
              and need a clean paper trail.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[12px] font-bold uppercase tracking-wider text-[#3D4127]">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[13px] text-[#3D4127]/70 hover:text-[#3D4127] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#3D4127]/10 pt-8">
          <p className="text-[12.5px] text-[#3D4127]/60">
            © {new Date().getFullYear()} EASYsign. All rights reserved.
          </p>
          <div className="flex gap-5 text-[12.5px] text-[#3D4127]/60">
            <a href="#" className="hover:text-[#3D4127] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[#3D4127] transition-colors">LinkedIn</a>
            <a href="#" className="hover:text-[#3D4127] transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                 */
/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="min-h-screen bg-[#BAC095] font-sans text-[#3D4127] antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <NavBar />
      <main>
        <Hero />
        <ProductShowcase />
        <Features />
        <HowItWorks />
        <Security />
        <UseCases />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
