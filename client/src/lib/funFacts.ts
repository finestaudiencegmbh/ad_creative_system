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
  "🎯 Carousel-Ads haben 10x höhere Engagement-Rate als Single-Image-Ads",
  "💰 Der durchschnittliche CPM auf Instagram ist 40% niedriger als auf Facebook",
  "📱 85% der Instagram-Nutzer folgen mindestens einem Business-Account",
  "🔔 Push-Benachrichtigungen haben eine 50% höhere Open-Rate als E-Mails",
  "🎬 Video-Ads generieren 1200% mehr Shares als Text- und Bild-Content kombiniert",
  "👥 Facebook-Gruppen haben 1,8 Milliarden aktive Mitglieder weltweit",
  "⏰ Die beste Zeit für Instagram-Posts ist Mittwoch um 11 Uhr vormittags",
  "💡 Stories mit Umfragen erhalten 90% mehr Interaktionen als normale Stories",
  "📊 Instagram Reels erreichen 22% mehr Nutzer als reguläre Feed-Posts",
  "🎯 Retargeting-Ads haben eine 10x höhere Click-Through-Rate als Display-Ads",
  "💬 71% der Konsumenten empfehlen eine Marke weiter nach positiver Social-Media-Erfahrung",
  "📈 Facebook-Ads mit Emojis haben 47% höhere Interaktionsraten",
  "🌍 Instagram ist in über 25 Sprachen verfügbar",
  "💰 Der durchschnittliche ROI von Facebook-Ads liegt bei 250%",
  "🎨 Ads mit Gesichtern erhalten 38% mehr Likes als Ads ohne Gesichter",
  "📱 90% der Instagram-Nutzer folgen mindestens einem Business-Account",
  "⚡ Instagram-Stories werden von 500 Millionen Accounts täglich genutzt",
  "🎯 Lookalike Audiences haben 2-3x höhere Conversion-Raten als Cold Traffic",
  "💡 Facebook-Pixel trackt über 2 Milliarden Nutzer-Interaktionen pro Tag",
  "📊 Video-Ads haben eine 135% höhere organische Reichweite als Foto-Posts",
  "🔥 Instagram-Reels können bis zu 300% mehr Reichweite generieren als Feed-Posts",
  "💬 Kommentare auf Instagram-Posts erhöhen die Reichweite um durchschnittlich 40%",
  "🎬 Live-Videos auf Facebook generieren 6x mehr Interaktionen als normale Videos",
  "📈 A/B-Tests können die Ad-Performance um durchschnittlich 30% verbessern",
  "🌟 Instagram-Accounts mit 10.000+ Followern haben 1,7% Engagement-Rate",
  "💰 Cost-per-Click auf Facebook ist 50% günstiger als auf Google Ads",
  "🎯 Dynamic Product Ads haben 3x höhere Conversion-Rate als statische Ads",
  "📱 80% der Instagram-Zeit wird im Feed verbracht, 20% in Stories",
  "⏰ Posts zwischen 13-15 Uhr erhalten die meisten Kommentare",
  "💡 User-Generated Content hat 4,5x höhere Conversion-Rate als Brand Content",
  "🔔 Instagram-Benachrichtigungen haben 80% Open-Rate innerhalb von 1 Stunde",
  "🎨 Farbige Ads performen 42% besser als Schwarz-Weiß-Ads",
  "📊 Influencer-Marketing hat einen durchschnittlichen ROI von 520%",
  "💬 Instagram-DMs haben 10x höhere Response-Rate als E-Mails",
  "🎯 Retargeting-Kampagnen haben 70% höhere Conversion-Rate als Cold Traffic",
  "📈 Facebook-Events erreichen 3x mehr Personen als normale Posts",
  "🌍 Über 200 Millionen Unternehmen nutzen Instagram Business-Tools",
  "💰 Der durchschnittliche Warenkorbwert bei Instagram Shopping liegt bei 65€",
  "📱 95% der B2B-Marketer nutzen LinkedIn für Content-Marketing",
  "🎬 Stories mit Musik erhalten 25% mehr Views als Stories ohne Musik",
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
