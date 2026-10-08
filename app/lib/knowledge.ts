export type KnowledgeChunk = {
  id: string;
  title: string;
  content: string;
  answer: string;
};

export const salonKnowledge: KnowledgeChunk[] = [
  {
    id: "water-facial",
    title: "Vaporeon Tidal Reset Facial",
    content: "Water type Vaporeon lore inspires our Tidal Reset Facial. The house blend pairs blue kelp extract, glycerin, and oat-derived ingredients for a comfortable, hydrated-feeling finish. Aftercare: keep the routine gentle that evening, avoid exfoliating acids for 24 hours, and wear broad-spectrum SPF during the day. Ask for a patch test if your skin is reactive.",
    answer: "For dry or easily unsettled skin, I’d start with the Vaporeon Tidal Reset Facial. Its blue-kelp and oat-inspired house blend is designed for a comfortable, hydrated-feeling finish. Keep your routine gentle that evening, skip exfoliating acids for 24 hours, and wear daytime SPF. If your skin is reactive, we can patch-test first.",
  },
  {
    id: "electric-blowout",
    title: "Jolteon Static-Free Blowout",
    content: "Jolteon's electric energy inspired this smooth blowout: a leave-in conditioner, heat protectant, and controlled airflow help keep flyaways in check without promising a permanent result. Aftercare: use a lower heat setting at home, detangle from ends upward, and try a satin pillowcase. Curly and coily textures can request a diffuser finish.",
    answer: "For flyaways, the Jolteon Static-Free Blowout pairs leave-in conditioner with heat protection and controlled airflow. Ask for a diffuser finish for curls or coils. At home, use lower heat, detangle from the ends upward, and try a satin pillowcase to help keep your style feeling smooth.",
  },
  {
    id: "fire-manicure",
    title: "Rapidash Emberglass Manicure",
    content: "Rapidash's warm, bright mane inspires the Emberglass Manicure: careful nail shaping, a warm soak, jojoba cuticle oil, and a sheer coral or ember-red finish. Aftercare: apply cuticle oil daily and use gloves for long periods in water. No heat is applied to the nails.",
    answer: "The Rapidash Emberglass Manicure brings a little warmth without actual flame: careful shaping, jojoba cuticle oil, and your choice of sheer coral or ember red. A drop of cuticle oil each day helps keep the finish looking cared for.",
  },
  {
    id: "grass-scalp",
    title: "Leafeon Forest Canopy Scalp Spa",
    content: "Leafeon's forest affinity guides the Forest Canopy Scalp Spa, with a gentle cleanse, a fragrance-light botanical rinse, and a slow scalp massage. Aftercare: avoid a second wash that day and keep water comfortably warm. Tell your stylist about scalp sensitivity, extensions, or recent color before we begin.",
    answer: "If your scalp needs a reset, the Leafeon Forest Canopy Scalp Spa combines a gentle cleanse with a slow massage and a fragrance-light botanical rinse. Let your stylist know about sensitivity, extensions, or recent color so we can tailor the ritual. Skip a second wash that day.",
  },
  {
    id: "fairy-gloss",
    title: "Sylveon Moonmilk Gloss",
    content: "Sylveon's soft ribbons inspire Moonmilk Gloss: a sheer, light-catching hair gloss and a shape refresh, customized to your starting color. Aftercare: wait 24 hours before shampooing, choose color-safe products, and limit hot tools when possible. Results vary by starting shade and are not a permanent color change.",
    answer: "For a subtle, light-catching refresh, Sylveon's Moonmilk Gloss adds sheer shine rather than a dramatic color change. Results depend on your starting shade. Wait 24 hours before shampooing, choose color-safe products, and go easy on hot tools.",
  },
  {
    id: "ice-eye-veil",
    title: "Glaceon Glacier Eye Veil",
    content: "Glaceon's cool composure inspires the Glacier Eye Veil, a brief cooling compress and fragrance-free moisturizing finish. It is a cosmetic comfort ritual, not a treatment for swelling or a medical condition. Aftercare: remove makeup gently and use your usual eye-area moisturizer. Tell us about allergies before the appointment.",
    answer: "The Glaceon Glacier Eye Veil is a gentle cosmetic pick-me-up: a cooling compress followed by a fragrance-free moisturizer. It isn’t a treatment for swelling or other medical concerns. Please share any allergies before we begin.",
  },
  {
    id: "sensitive-care",
    title: "Sensitive-skin and ingredient notes",
    content: "For sensitive skin, start with fragrance-light services, share known allergies, and request a patch test before a new product. Salon rituals are cosmetic services and cannot diagnose or treat a skin or scalp condition. Pause a service if stinging or discomfort occurs, and consult a qualified clinician for persistent symptoms.",
    answer: "Let’s keep it gentle. We can talk through fragrance-light options and arrange a patch test before using something new. Our rituals are cosmetic, not medical care, so if irritation is persistent or painful, a qualified clinician is the right person to ask.",
  },
];

const stopWords = new Set(["about", "after", "and", "are", "for", "from", "have", "help", "how", "into", "just", "like", "need", "that", "the", "this", "what", "with", "would", "you", "your"]);

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !stopWords.has(word)) ?? [];
}

function cosineSimilarity(left: number[], right: number[]) {
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  if (!leftMagnitude || !rightMagnitude) return 0;
  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

export function retrieveKnowledge(query: string, limit = 3) {
  const documents = salonKnowledge.map((chunk) => ({ chunk, terms: tokenize(`${chunk.title} ${chunk.content}`) }));
  const vocabulary = [...new Set([...tokenize(query), ...documents.flatMap((document) => document.terms)])];
  const queryTerms = tokenize(query);
  const queryVector = vocabulary.map((term) => queryTerms.filter((word) => word === term).length);

  return documents
    .map(({ chunk, terms }) => ({
      chunk,
      score: cosineSimilarity(queryVector, vocabulary.map((term) => terms.filter((word) => word === term).length)),
    }))
    .filter((result) => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((result) => result.chunk);
}