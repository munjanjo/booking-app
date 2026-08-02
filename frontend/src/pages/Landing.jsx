import { Link } from "react-router-dom";
import "../landing.css";

const features = [
    {
        n: "01",
        title: "Kalendar po radniku",
        desc: "Dnevni pregled s kolonom za svakog radnika, radno vrijeme i pauze vidljivi na prvi pogled.",
    },
    {
        n: "02",
        title: "Online rezervacije",
        desc: "Klijenti biraju uslugu, radnika i slobodan termin sami — bez telefonskih poziva izvan radnog vremena.",
    },
    {
        n: "03",
        title: "Rezervacija za šalterom",
        desc: "Klijent nazvao ili došao osobno? Dodaš termin u par klikova, s pretragom postojećih klijenata.",
    },
    {
        n: "04",
        title: "Dvokratne smjene",
        desc: "Radnik radi ujutro i navečer, s pauzom između? Radno vrijeme se posloži točno kako radite.",
    },
    {
        n: "05",
        title: "Pomicanje termina povlačenjem",
        desc: "Klijent zove da promijeni vrijeme — povučeš termin na novi slot i gotovo, bez brisanja i ponovnog upisa.",
    },
    {
        n: "06",
        title: "Pregled svih rezervacija",
        desc: "Svaki radnik, svaki klijent, svaki termin — pretraživo i uredno, bez bilježnice na pultu.",
    },
];

const steps = [
    {
        n: "1",
        title: "Postaviš salon",
        desc: "Dodaš radnike, usluge i radno vrijeme — traje kraće od jedne šalice kave.",
    },
    {
        n: "2",
        title: "Podijeliš poveznicu",
        desc: "Klijenti rezerviraju sami, u bilo koje doba dana, bez čekanja da im se javiš.",
    },
    {
        n: "3",
        title: "Vodiš dan iz kalendara",
        desc: "Sve promjene, otkazivanja i nove rezervacije stižu na jedno mjesto — tvoj kalendar.",
    },
];

const slots = [
    { time: "09:00", who: "Ivana K.", what: "Feniranje · Ana", tag: "Potvrđeno" },
    { time: "10:30", who: "Marko P.", what: "Šišanje · Tomo", tag: "Potvrđeno" },
    { time: "11:00", who: "Petra Vuk", what: "Farbanje · Ana", tag: "Novo", isNew: true },
    { time: "14:00", who: "Doris B.", what: "Masaža · Lucija", tag: "Potvrđeno" },
];

function Logo({ className = "" }) {
    return (
        <span className={`font-display text-xl font-bold tracking-wide ${className}`}>
            apunta<span className="text-smilje">.</span>
        </span>
    );
}

function PrimaryButton({ children, to = "/register" }) {
    return (
        <Link
            to={to}
            className="no-underline inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-smilje px-6 py-3 text-[15px] font-semibold text-[#1a1305] transition-transform duration-200 ease-out hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-smilje motion-reduce:transition-none motion-reduce:hover:scale-100"
        >
            {children}
        </Link>
    );
}

function GhostButton({ children, href = "#kako-radi" }) {
    return (
        <a
            href={href}
            className="no-underline inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone/35 px-6 py-3 text-[15px] font-semibold text-stone transition-colors duration-200 hover:border-stone/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone"
        >
            {children}
        </a>
    );
}

function Nav() {
    return (
        <nav className="sticky top-0 z-20 border-b border-line bg-stone/90 backdrop-blur-md">
            <div className="mx-auto flex h-[72px] max-w-[1080px] items-center justify-between px-6 sm:px-8">
                <Logo />
                <div className="flex items-center gap-9">
                    <div className="hidden gap-8 text-sm text-ink-soft md:flex">
                        <a className="no-underline transition-colors hover:text-ink" href="#znacajke">
                            Značajke
                        </a>
                        <a className="no-underline transition-colors hover:text-ink" href="#kako-radi">
                            Kako radi
                        </a>
                        <a className="no-underline transition-colors hover:text-ink" href="#porijeklo">
                            Porijeklo imena
                        </a>
                    </div>
                    <Link
                        to="/register"
                        className="no-underline inline-flex min-h-11 items-center justify-center rounded-full bg-sea px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sea/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sea"
                    >
                        Isprobaj besplatno
                    </Link>
                </div>
            </div>
        </nav>
    );
}

function Hero() {
    return (
        <header className="relative overflow-hidden bg-gradient-to-b from-sea-deep to-sea-deeper pb-28 pt-20 text-stone sm:pt-24">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 -top-32 h-[500px] w-[900px] rounded-full bg-sea/25 blur-3xl"
            />
            <div className="relative mx-auto grid max-w-[1080px] items-center gap-12 px-6 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                <div>
                    <p className="mb-5 font-display text-xs uppercase tracking-[0.24em] text-smilje">
                        Rezervacije za salone i studije
                    </p>
                    <h1 className="font-display text-[clamp(2.5rem,5.4vw,4rem)] leading-[1.06] tracking-tight text-balance">
                        Svaki termin, <span className="text-smilje">zapisan</span> na vrijeme.
                    </h1>
                    <p className="mt-6 max-w-[46ch] text-lg text-stone/80">
                        Apunta vodi kalendar tvog salona — radnici, radno vrijeme, online
                        rezervacije i rezervacije preko telefona, sve na jednom mjestu,
                        bez dvostrukih upisa.
                    </p>
                    <div className="mt-9 flex flex-wrap gap-3.5">
                        <PrimaryButton>Isprobaj besplatno</PrimaryButton>
                        <GhostButton>Kako radi →</GhostButton>
                    </div>
                </div>

                <div className="rotate-[1.2deg] rounded-2xl bg-stone-panel p-6 text-ink shadow-2xl shadow-black/40">
                    <div className="mb-4 flex items-baseline justify-between border-b border-line pb-3.5">
                        <span className="font-display text-lg">Subota, 1. kolovoza</span>
                        <span className="text-[12.5px] uppercase tracking-wide text-ink-soft">
                            Salon Nera
                        </span>
                    </div>
                    <ul>
                        {slots.map((s) => (
                            <li
                                key={s.time}
                                className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-dashed border-line py-2.5 text-sm last:border-none"
                            >
                                <time className="text-[13px] tabular-nums text-ink-soft">{s.time}</time>
                                <div>
                                    <div className="font-semibold">{s.who}</div>
                                    <div className="text-[12.5px] text-ink-soft">{s.what}</div>
                                </div>
                                <span
                                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                        s.isNew ? "bg-sea/15 text-sea" : "bg-maslina/15 text-maslina"
                                    }`}
                                >
                                    {s.tag}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <svg
                aria-hidden="true"
                viewBox="0 0 1200 90"
                preserveAspectRatio="none"
                className="absolute inset-x-0 bottom-0 h-[70px] w-full text-stone sm:h-[90px]"
            >
                <path
                    fill="currentColor"
                    d="M0,54 L60,45 L130,56 L210,43 L300,55 L390,44 L480,57 L580,42 L680,55 L790,43 L900,54 L1020,44 L1200,50 L1200,90 L0,90 Z"
                />
            </svg>
        </header>
    );
}

function Features() {
    return (
        <section id="znacajke" className="py-20 sm:py-24">
            <div className="mx-auto max-w-[1080px] px-6 sm:px-8">
                <div className="mb-12 max-w-[60ch] sm:mb-14">
                    <span className="mb-3.5 block font-display text-xs font-semibold uppercase tracking-[0.22em] text-sea">
                        Značajke
                    </span>
                    <h2 className="text-[clamp(1.75rem,3.4vw,2.375rem)] font-display tracking-tight text-balance">
                        Sve što treba jednom salonu, ništa što ne treba.
                    </h2>
                    <p className="mt-3.5 text-base text-ink-soft sm:text-[16.5px]">
                        Bez modula koje nećeš nikad uključiti. Kalendar, radnici i
                        rezervacije — posloženo da radi od prvog dana.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => (
                        <div key={f.n} className="flex flex-col gap-3 bg-stone-panel p-7">
                            <span className="font-display text-[13px] tracking-wide text-smilje">
                                {f.n}
                            </span>
                            <h3 className="text-[17.5px] font-semibold">{f.title}</h3>
                            <p className="text-[14.5px] text-ink-soft">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section id="kako-radi" className="pb-20 sm:pb-24">
            <div className="mx-auto max-w-[1080px] px-6 sm:px-8">
                <div className="mb-12 max-w-[60ch] sm:mb-14">
                    <span className="mb-3.5 block font-display text-xs font-semibold uppercase tracking-[0.22em] text-sea">
                        Kako radi
                    </span>
                    <h2 className="text-[clamp(1.75rem,3.4vw,2.375rem)] font-display tracking-tight text-balance">
                        Od prvog termina do punog kalendara.
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-10 sm:grid-cols-3">
                    {steps.map((s) => (
                        <div key={s.n}>
                            <span
                                aria-hidden="true"
                                className="mb-3.5 block font-display text-4xl leading-none text-transparent"
                                style={{ WebkitTextStroke: "1px var(--color-sea)" }}
                            >
                                {s.n}
                            </span>
                            <h3 className="mb-2 text-[17px] font-semibold">{s.title}</h3>
                            <p className="text-[14.5px] text-ink-soft">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Provenance() {
    return (
        <section id="porijeklo" className="pb-20 sm:pb-24">
            <div className="mx-auto max-w-[1080px] px-6 sm:px-8">
                <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-line bg-stone-panel p-8 sm:grid-cols-[auto_1fr] sm:gap-7 sm:p-11">
                    <span aria-hidden="true" className="font-display text-5xl leading-none text-smilje">
                        &rdquo;
                    </span>
                    <p className="max-w-[62ch] text-base text-ink-soft sm:text-[16px]">
                        <strong className="font-semibold text-ink">Apunta</strong> dolazi
                        od dalmatinskog <em>apuntamenat</em> — riječi za dogovoreni
                        susret, naslijeđene iz starog jadranskog govora. Isto značenje,
                        samo bez čekanja u redu za telefon.
                    </p>
                </div>
            </div>
        </section>
    );
}

function CtaBand() {
    return (
        <section id="pocni" className="pb-20 sm:pb-24">
            <div className="mx-auto max-w-[1080px] px-6 sm:px-8">
                <div className="rounded-2xl bg-sea-deep px-7 py-16 text-center text-stone sm:px-14 sm:py-16">
                    <h2 className="font-display text-[clamp(1.625rem,3.2vw,2.125rem)] text-balance">
                        Spreman posložiti svoj kalendar?
                    </h2>
                    <p className="mx-auto mt-3 mb-8 max-w-[50ch] text-stone/75">
                        Besplatno za isprobati. Bez kartice, bez obveze.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3.5">
                        <PrimaryButton to="/register">Isprobaj besplatno</PrimaryButton>
                        <PrimaryButtonGhostLink />
                    </div>
                </div>
            </div>
        </section>
    );
}

function PrimaryButtonGhostLink() {
    return (
        <Link
            to="/login"
            className="no-underline inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-stone/35 px-6 py-3 text-[15px] font-semibold text-stone transition-colors duration-200 hover:border-stone/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone"
        >
            Već imaš račun? Prijavi se
        </Link>
    );
}

function Footer() {
    return (
        <footer className="border-t border-line py-10 text-[13.5px] text-ink-soft">
            <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-6 sm:px-8">
                <Logo className="text-base text-ink" />
                <p>© 2026 Apunta. Rezervacije za salone, jednostavno.</p>
            </div>
        </footer>
    );
}

export default function Landing() {
    return (
        <div className="landing-page bg-stone">
            <Nav />
            <Hero />
            <main>
                <Features />
                <HowItWorks />
                <Provenance />
                <CtaBand />
            </main>
            <Footer />
        </div>
    );
}
