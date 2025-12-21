/**
 * Fun Facts about Facebook and Instagram for loading screens
 */

export const funFacts = [
  "📱 Instagram wurde in nur 8 Wochen entwickelt und für 1 Milliarde Dollar verkauft",
  "💙 Die Facebook-Farbe Blau wurde gewählt, weil Mark Zuckerberg rot-grün-blind ist",
  "🎂 Jeden Tag werden auf Facebook über 300 Millionen Fotos hochgeladen",
  "⏰ Der durchschnittliche Nutzer verbringt täglich 33 Minuten auf Instagram",
  "🌍 Facebook ist in über 100 Sprachen verfügbar",
  "📸 Instagram Stories erreichen täglich über 500 Millionen aktive Nutzer",
  "👥 Über 200 Millionen Unternehmen nutzen Facebook-Tools",
  "💬 Jeden Tag werden über 100 Milliarden Nachrichten auf Facebook verschickt",
  "🎯 Instagram-Anzeigen erreichen über 1,4 Milliarden Menschen weltweit",
  "⚡ Die ersten Instagram-Filter hießen X-Pro II, Lomo-fi, Earlybird, Apollo und Poprocket",
  "🔥 Videos auf Facebook generieren 8 Milliarden Views pro Tag",
  "📊 Posts mit Bildern erhalten 2,3x mehr Engagement als solche ohne",
  "🎨 Der 'Like'-Button sollte ursprünglich 'Awesome' heißen",
  "🌟 Instagram Reels haben die höchste Reichweite aller Content-Formate",
  "💰 Meta erwirtschaftet über 90% seines Umsatzes durch Werbung",
  "📱 Über 98% der Facebook-Nutzer greifen über mobile Geräte zu",
  "🎬 Instagram Stories wurden von Snapchat inspiriert",
  "👍 Der Like-Button wird täglich über 6 Milliarden Mal geklickt",
  "🌈 Instagram hat über 2 Milliarden aktive Nutzer pro Monat",
  "⏱️ Die beste Zeit für Posts ist zwischen 11-13 Uhr und 19-21 Uhr",
  "🎯 Carousel-Ads haben eine 10x höhere Click-Through-Rate als normale Ads",
  "📈 Video-Content wird 12x häufiger geteilt als Text und Bilder zusammen",
  "🔔 Push-Benachrichtigungen erhöhen die App-Nutzung um 88%",
  "🎪 Instagram Shopping ermöglicht direkten Verkauf an 130 Millionen Nutzer",
  "💡 Hashtags erhöhen das Engagement um durchschnittlich 12,6%",
];

/**
 * Get a random fun fact
 */
export function getRandomFunFact(): string {
  return funFacts[Math.floor(Math.random() * funFacts.length)];
}

/**
 * Get multiple unique random fun facts
 */
export function getRandomFunFacts(count: number): string[] {
  const shuffled = [...funFacts].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, funFacts.length));
}
