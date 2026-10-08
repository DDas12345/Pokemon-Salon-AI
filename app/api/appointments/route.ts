import { randomUUID } from "node:crypto";
import { salonKnowledge } from "@/app/lib/knowledge";

const serviceNames: Record<string, string> = {
  "water-facial": "Tidal Reset Facial",
  "electric-blowout": "Static-Free Blowout",
  "fire-manicure": "Emberglass Manicure",
  "grass-scalp": "Forest Canopy Scalp Spa",
  "fairy-gloss": "Moonmilk Gloss",
  "ice-eye-veil": "Glacier Eye Veil",
};
const availableServices = new Set(salonKnowledge.slice(0, 6).map((chunk) => serviceNames[chunk.id]));

const availableTimes = new Set(["9:30 AM", "11:00 AM", "12:30 PM", "2:00 PM", "3:30 PM", "5:00 PM"]);

type BookingRequest = {
  name?: unknown;
  email?: unknown;
  service?: unknown;
  date?: unknown;
  time?: unknown;
};

export async function POST(request: Request) {
  let booking: BookingRequest;
  try {
    booking = await request.json() as BookingRequest;
  } catch {
    return Response.json({ error: "Please check your booking details and try again." }, { status: 400 });
  }

  const name = typeof booking.name === "string" ? booking.name.trim() : "";
  const email = typeof booking.email === "string" ? booking.email.trim() : "";
  const service = typeof booking.service === "string" ? booking.service : "";
  const date = typeof booking.date === "string" ? booking.date : "";
  const time = typeof booking.time === "string" ? booking.time : "";
  const dateValue = new Date(`${date}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (name.length < 2 || name.length > 100) {
    return Response.json({ error: "Please enter a name between 2 and 100 characters." }, { status: 400 });
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!availableServices.has(service)) {
    return Response.json({ error: "Choose one of the listed salon rituals." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateValue.getTime()) || dateValue < today) {
    return Response.json({ error: "Choose a valid date today or later." }, { status: 400 });
  }
  if (!availableTimes.has(time)) {
    return Response.json({ error: "Choose one of the available appointment times." }, { status: 400 });
  }

  return Response.json({
    appointment: {
      id: randomUUID(),
      name,
      email,
      service,
      date,
      time,
      createdAt: new Date().toISOString(),
    },
  }, { status: 201 });
}