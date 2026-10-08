"use client";

import {
    ArrowRight, CalendarDays, Camera, Check, ChevronDown, Clock3, Droplets,
    Flame, Flower2, Heart, Leaf, MapPin, Menu, MessageCircle, Send, Sparkles,
    Upload, Waves, Wind, X, Zap,
} from "lucide-react";
import Image from "next/image";
import { type ChangeEvent, type FormEvent, useEffect, useRef, useState } from "react";

type Service = { name: string; pokemon: string; type: string; description: string; duration: string; price: number; icon: typeof Waves; color: string };
type Appointment = { id: string; name: string; email: string; service: string; date: string; time: string; createdAt: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

const services: Service[] = [
    { name: "Tidal Reset Facial", pokemon: "Vaporeon", type: "Water", description: "Mineral-rich hydration for a dewy, unhurried glow.", duration: "60 min", price: 148, icon: Droplets, color: "sea" },
    { name: "Static-Free Blowout", pokemon: "Jolteon", type: "Electric", description: "Sleek, touchable movement with a little extra charge.", duration: "45 min", price: 92, icon: Zap, color: "lemon" },
    { name: "Emberglass Manicure", pokemon: "Rapidash", type: "Fire", description: "A warm soak, precise shaping, and a radiant sheer finish.", duration: "50 min", price: 86, icon: Flame, color: "rose" },
    { name: "Forest Canopy Scalp Spa", pokemon: "Leafeon", type: "Grass", description: "Botanical scalp cleanse with a slow, grounding massage.", duration: "55 min", price: 118, icon: Leaf, color: "sage" },
    { name: "Moonmilk Gloss", pokemon: "Sylveon", type: "Fairy", description: "Light-catching gloss and soft shape, finished by hand.", duration: "40 min", price: 78, icon: Sparkles, color: "lilac" },
    { name: "Glacier Eye Veil", pokemon: "Glaceon", type: "Ice", description: "Cooling eye ritual to soothe, brighten, and soften.", duration: "30 min", price: 68, icon: Wind, color: "ice" },
];
const types = ["All rituals", "Water", "Electric", "Fire", "Grass", "Fairy", "Ice"];
const times = ["9:30 AM", "11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM", "5:00 PM"];
const storageKey = "salon-spheal-appointments";

function readAppointments(): Appointment[] {
    try { return JSON.parse(localStorage.getItem(storageKey) || "[]") as Appointment[]; } catch { return []; }
}
function formatDate(value: string) {
    if (!value) return "Choose a date";
    return new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Home() {
    const [activeType, setActiveType] = useState("All rituals");
    const [bookingOpen, setBookingOpen] = useState(false);
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [selected, setSelected] = useState(services[0].name);
    const [date, setDate] = useState("");
    const [minDate, setMinDate] = useState("");
    const [time, setTime] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [bookingMessage, setBookingMessage] = useState("");
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Hi, lovely. Tell me what your skin or hair is asking for today, and I’ll find a ritual to match." }]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);
    const [photoUrl, setPhotoUrl] = useState("");
    const [styleResult, setStyleResult] = useState("");
    const [photoNote, setPhotoNote] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chosenService = services.find((service) => service.name === selected) ?? services[0];
    const shownServices = activeType === "All rituals" ? services : services.filter((service) => service.type === activeType);
    useEffect(() => {
        const frame = requestAnimationFrame(() => setAppointments(readAppointments()));
        return () => cancelAnimationFrame(frame);
    }, []);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
    useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);
    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") { setBookingOpen(false); setDashboardOpen(false); }
        }
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    function openBooking(serviceName?: string) {
        if (serviceName) setSelected(serviceName);
        const today = new Date();
        today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
        setMinDate(today.toISOString().slice(0, 10));
        setStep(1); setBookingMessage(""); setBookingOpen(true); setDashboardOpen(false);
    }
    function cancelAppointment(id: string) {
        const remaining = readAppointments().filter((appointment) => appointment.id !== id);
        localStorage.setItem(storageKey, JSON.stringify(remaining));
        setAppointments(remaining);
    }
    async function submitBooking(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); setBookingMessage("Saving your ritual...");
        try {
            const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), email: email.trim(), service: selected, date, time }) });
            const result = await response.json() as { appointment?: Appointment; error?: string };
            if (!response.ok || !result.appointment) { setBookingMessage(result.error || "We couldn’t save that appointment. Please try again."); return; }
            const next = [result.appointment, ...readAppointments()];
            localStorage.setItem(storageKey, JSON.stringify(next)); setAppointments(next); setStep(4); setBookingMessage("");
        } catch { setBookingMessage("We couldn’t reach the salon just now. Please try again."); }
    }
    async function sendChat(event: FormEvent<HTMLFormElement>) {
        event.preventDefault(); const prompt = chatInput.trim();
        if (!prompt || chatLoading) return;
        const next = [...messages, { role: "user" as const, content: prompt }];
        setMessages(next); setChatInput(""); setChatLoading(true);
        try {
            const response = await fetch("/api/consult", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next }) });
            const result = await response.json() as { reply?: string };
            setMessages([...next, { role: "assistant", content: result.reply || "I’m having a quiet moment. Try asking me again in a little bit." }]);
        } catch {
            setMessages([...next, { role: "assistant", content: "I’m having trouble connecting. Our Water and Grass rituals are a lovely place to begin for sensitive skin." }]);
        } finally { setChatLoading(false); }
    }
    function analyzePhoto(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0]; setStyleResult(""); setPhotoNote("");
        if (!file) return;
        if (!file.type.startsWith("image/")) { setPhotoNote("Choose an image file to start your palette reading."); return; }
        if (photoUrl) URL.revokeObjectURL(photoUrl);
        const preview = URL.createObjectURL(file); setPhotoUrl(preview);
        const image = document.createElement("img");
        image.onload = () => {
            const canvas = document.createElement("canvas"); canvas.width = 1; canvas.height = 1;
            const context = canvas.getContext("2d", { willReadFrequently: true }); if (!context) return;
            context.drawImage(image, 0, 0, 1, 1);
            const [red, , blue] = context.getImageData(0, 0, 1, 1).data;
            const undertone = red > blue * 1.1 ? "warm" : blue > red * 1.1 ? "cool" : "balanced";
            const palettes: Record<string, string> = {
                warm: "Warm undertones detected. Try honey-rose gloss, soft coral, and Vaporeon’s mineral veil for a fresh, sunlit finish.",
                cool: "Cool undertones detected. Try petal pink, blue-red accents, and Glaceon’s sheer pearl finish for a clear, luminous look.",
                balanced: "A balanced undertone gives you room to play. Try soft berry, sea-glass shimmer, and Sylveon’s moonmilk gloss.",
            };
            setStyleResult(palettes[undertone]); setPhotoNote("A private, on-device color estimate. Your photo stays in this browser.");
        };
        image.onerror = () => setPhotoNote("That image couldn’t be previewed. Please try another photo."); image.src = preview;
    }

    return <main>
        <header className="site-header">
            <a className="wordmark" href="#home" aria-label="Salon and Spheal home"><span className="wordmark-mark"><Waves size={19} strokeWidth={1.7} /></span><span>salon <i>&</i> spheal</span></a>
            <nav className="desktop-nav" aria-label="Main navigation"><a href="#rituals">The rituals</a><a href="#studio">Our studio</a><a href="#consult">Beauty desk</a></nav>
            <div className="header-actions"><button className="text-button dashboard-link" onClick={() => setDashboardOpen(true)}>My appointments{appointments.length > 0 && <span className="appointment-count">{appointments.length}</span>}</button><button className="mobile-dashboard" aria-label="My appointments" onClick={() => setDashboardOpen(true)}><CalendarDays size={18} />{appointments.length > 0 && <span className="appointment-count">{appointments.length}</span>}</button><button className="button button-dark header-book" onClick={() => openBooking()}><CalendarDays size={15} /> Book a visit</button><a className="mobile-menu" href="#rituals" aria-label="Browse rituals"><Menu size={21} /></a></div>
        </header>

        <section className="hero" id="home"><div className="hero-photo" role="img" aria-label="A tranquil, sunlit spa treatment room"><div className="hero-image-label"><span /> A softer kind of self-care</div></div><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" /> KANTO’S LITTLE HIDEAWAY · EST. 1998</p><h1>Care that feels<br />a little <em>magical.</em></h1><p className="hero-description">A thoughtful beauty studio where beloved Pokémon elements meet the art of slowing down.</p><div className="hero-actions"><button className="button button-dark" onClick={() => openBooking()}>Find your ritual <ArrowRight size={16} /></button><a className="underlined-link" href="#rituals">Explore the menu <ChevronDown size={14} /></a></div><div className="hero-note"><span className="note-star">✳</span><span>Gentle by nature.<br /><b>Extraordinary by design.</b></span></div></div><div className="hero-index"><span>01</span><span className="index-rule" /><span>04</span></div></section>

        <section className="trust-strip" aria-label="Salon highlights"><span><Sparkles size={15} /> Thoughtful ingredients</span><span><Heart size={15} /> All textures welcome</span><span><MapPin size={15} /> Celadon City, Kanto</span><span className="trust-hours"><Clock3 size={15} /> Tue–Sun, 9am–6pm</span></section>

        <section className="ritual-section section-wrap" id="rituals"><div className="section-heading"><div><p className="eyebrow">A MENU WITH A LITTLE MORE HEART</p><h2>Choose your <em>element.</em></h2></div><p className="section-aside">Every ritual is made to meet you where you are. Pick a feeling; we’ll take it from there.</p></div>
            <div className="filter-row" role="group" aria-label="Filter rituals by Pokémon type">{types.map((type) => <button key={type} className={`filter-chip ${activeType === type ? "active" : ""}`} aria-pressed={activeType === type} onClick={() => setActiveType(type)}>{type}</button>)}<span className="filter-count">{shownServices.length} rituals</span></div>
            <div className="service-grid">{shownServices.map((service) => { const Icon = service.icon; return <article className={`service-card ${service.color}`} key={service.name}><div className="service-topline"><span className="type-label">{service.type} type</span><Icon size={21} strokeWidth={1.6} /></div><p className="pokemon-name">A little like {service.pokemon}</p><h3>{service.name}</h3><p className="service-description">{service.description}</p><div className="service-bottom"><span>{service.duration} <i>·</i> ${service.price}</span><button className="round-arrow" aria-label={`Book ${service.name}`} onClick={() => openBooking(service.name)}><ArrowRight size={17} /></button></div></article>; })}</div>
            <div className="menu-footnote"><span>✳</span> A quiet cup of herbal tea is always on us.</div>
        </section>

        <section className="studio-band" id="studio"><div className="studio-image" role="img" aria-label="Natural botanical ingredients at the salon"><div className="image-caption">Small rituals. Lasting glow.</div></div><div className="studio-copy"><p className="eyebrow">A SALON THAT BELIEVES IN SOFTNESS</p><h2>Not a transformation.<br /><em>A return to yourself.</em></h2><p>Our artists pair elemental rituals with real listening. No rushing, no one-size-fits-all. Just careful hands, considered ingredients, and the kind of care that lingers after you leave.</p><a className="underlined-link" href="#consult">Meet your beauty desk <ArrowRight size={15} /></a><div className="studio-signature"><span>✳</span><span>Made with care in Celadon City<br /><b>One appointment at a time</b></span></div></div></section>

        <section className="consult-section section-wrap" id="consult"><div className="section-heading consult-heading"><div><p className="eyebrow">YOUR VERY OWN NURSE JOY-BOT</p><h2>Good advice, <em>good energy.</em></h2></div><p className="section-aside">A little expert guidance, with a little Pokémon magic. Always kind, never complicated.</p></div>
            <div className="consult-grid"><section className="chat-panel" aria-label="Nurse Joy-Bot beauty consultant"><div className="panel-heading"><span className="bot-avatar"><Sparkles size={19} /></span><span><b>Nurse Joy-Bot</b><small><span className="online-dot" /> Here to help</small></span><span className="panel-sparkle">✳</span></div><div className="chat-log" aria-live="polite">{messages.map((message, index) => <div className={`chat-bubble ${message.role}`} key={`${index}-${message.role}`}><p>{message.content}</p></div>)}{chatLoading && <div className="chat-bubble assistant"><p className="typing-dots">Thinking softly <span>•••</span></p></div>}<div ref={chatEndRef} /></div><div className="prompt-suggestions"><button onClick={() => setChatInput("My skin feels dry and sensitive")}>Dry, sensitive skin</button><button onClick={() => setChatInput("I want softer waves without frizz")}>Softer, smoother hair</button></div><form className="chat-form" onSubmit={sendChat}><input aria-label="Ask Nurse Joy-Bot" placeholder="Ask me anything..." value={chatInput} onChange={(event) => setChatInput(event.target.value)} /><button aria-label="Send message" disabled={chatLoading || !chatInput.trim()}><Send size={16} /></button></form><p className="privacy-note"><MessageCircle size={12} /> A friendly guide, not medical advice.</p></section>
                <section className="style-panel" aria-label="Personal style palette tool"><div className="style-heading"><span className="camera-mark"><Camera size={19} /></span><span><p className="eyebrow">THE LITTLE STYLE STUDY</p><h3>Your colors, your way.</h3></span></div><p className="style-description">Add a photo for a playful, on-device color read and a palette picked just for you.</p><label className={`upload-zone ${photoUrl ? "has-photo" : ""}`}>{photoUrl ? <Image src={photoUrl} alt="Your uploaded style reference" fill unoptimized sizes="(max-width: 620px) 90vw, 40vw" /> : <span className="upload-content"><Upload size={19} /><b>Choose a photo</b><small>JPG or PNG · stays on this device</small></span>}<input type="file" accept="image/*" onChange={analyzePhoto} aria-label="Upload a photo for a style suggestion" /></label>{styleResult ? <div className="style-result"><div className="palette-swatches"><span /><span /><span /><span /></div><p>{styleResult}</p></div> : <div className="style-placeholder"><Sparkles size={15} /><span>Your personalized palette will appear here.</span></div>}{photoNote && <p className="photo-note">{photoNote}</p>}</section>
            </div>
        </section>

        <section className="booking-cta"><div className="cta-copy"><p className="eyebrow">A LITTLE SPACE FOR YOU</p><h2>Your next good<br /><em>thing starts here.</em></h2></div><button className="button button-light" onClick={() => openBooking()}>Save me a little time <ArrowRight size={16} /></button><span className="cta-flower"><Flower2 size={102} strokeWidth={0.7} /></span></section>
        <footer className="site-footer"><a className="wordmark footer-mark" href="#home"><span className="wordmark-mark"><Waves size={17} /></span><span>salon <i>&</i> spheal</span></a><span>Celadon City, Kanto</span><span>Soft care for every kind of you.</span><a href="#home" className="footer-top">Back to top ↑</a></footer>

        {(bookingOpen || dashboardOpen) && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setBookingOpen(false); setDashboardOpen(false); } }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="modal-close" aria-label="Close dialog" onClick={() => { setBookingOpen(false); setDashboardOpen(false); }}><X size={19} /></button>
            {bookingOpen && <>{step < 4 && <div className="modal-progress"><span style={{ width: `${step * 33.333}%` }} /></div>}{step === 4 ? <div className="booking-success"><span className="success-mark"><Check size={23} /></span><p className="eyebrow">IT’S A DATE</p><h2 id="modal-title">Your time is <em>yours.</em></h2><p>We’ve saved {chosenService.name} for {formatDate(date)} at {time}. A note is on its way to {email}.</p><button className="button button-dark" onClick={() => { setBookingOpen(false); setDashboardOpen(true); }}>View my appointments <ArrowRight size={15} /></button></div> : <><p className="eyebrow">A LITTLE TIME, JUST FOR YOU · STEP {step} OF 3</p><h2 id="modal-title">{step === 1 ? <>Choose your <em>ritual.</em></> : step === 2 ? <>Find your <em>moment.</em></> : <>Make it <em>official.</em></>}</h2>
                {step === 1 && <div className="booking-service-list">{services.map((service) => <button key={service.name} className={`booking-service ${selected === service.name ? "selected" : ""}`} onClick={() => setSelected(service.name)}><span><b>{service.name}</b><small>{service.pokemon} · {service.duration}</small></span><strong>${service.price}</strong>{selected === service.name && <Check size={16} />}</button>)}</div>}
                {step === 2 && <div className="booking-date-step"><label className="field-label">A day that works<input type="date" min={minDate} value={date} onChange={(event) => setDate(event.target.value)} required /></label><p className="field-label">Pick a time</p><div className="time-grid">{times.map((slot) => <button type="button" key={slot} className={`time-option ${time === slot ? "selected" : ""}`} onClick={() => setTime(slot)}>{slot}</button>)}</div></div>}
                {step === 3 && <form id="guest-details" onSubmit={submitBooking} className="guest-form"><label className="field-label">Your name<input autoComplete="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="The name we should know" /></label><label className="field-label">Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><div className="booking-summary"><span>{chosenService.name}<small>{formatDate(date)} · {time}</small></span><b>${chosenService.price}</b></div></form>}
                {bookingMessage && <p className="booking-message" role="status">{bookingMessage}</p>}<div className="modal-actions">{step > 1 && <button className="text-button" onClick={() => { setStep(step - 1); setBookingMessage(""); }}>Back</button>}{step < 3 ? <button className="button button-dark" disabled={step === 2 && (!date || !time)} onClick={() => setStep(step + 1)}>Continue <ArrowRight size={15} /></button> : <button className="button button-dark" form="guest-details" type="submit">Confirm ritual <Check size={15} /></button>}</div></>}</>}
            {dashboardOpen && <><p className="eyebrow">YOUR LITTLE CORNER</p><h2 id="modal-title">My <em>appointments.</em></h2>{appointments.length === 0 ? <div className="empty-appointments"><CalendarDays size={23} /><p>Nothing on the calendar just yet.</p><button className="underlined-link" onClick={() => openBooking()}>Find a ritual <ArrowRight size={15} /></button></div> : <div className="appointment-list">{appointments.map((appointment) => <article className="appointment-row" key={appointment.id}><span className="appointment-date"><b>{new Date(`${appointment.date}T12:00:00`).getDate()}</b><small>{new Date(`${appointment.date}T12:00:00`).toLocaleDateString("en-US", { month: "short" })}</small></span><span className="appointment-details"><b>{appointment.service}</b><small>{formatDate(appointment.date)} · {appointment.time}</small><small>{appointment.name}</small></span><button className="cancel-appointment" aria-label={`Cancel ${appointment.service}`} onClick={() => cancelAppointment(appointment.id)}><X size={15} /></button></article>)}</div>}<div className="modal-actions"><button className="button button-dark" onClick={() => openBooking()}>Book another visit <ArrowRight size={15} /></button></div></>}
        </section></div>}
    </main>;
}