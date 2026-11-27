// Guide content for /sponsorships/guide — Part A of the GRS Sponsorship Campaign Guide.
// "Campaign" is used in friendly headings here; use "sponsorship case" in app UI labels.

export interface GuideSection {
  id: string;
  title: string;
  body: string; // plain text paragraphs separated by \n\n; bullet items start with •
}

export const HOW_IT_WORKS_STEPS = [
  "Create your sponsorship case — the parent/guardian (or the player if 18+) or the team writes the story and what's needed.",
  "Get vouched — your coach confirms on GRS that the player or team is real and in their squad.",
  "Pass the short money-skills quiz — everyone receiving support completes it once.",
  "GRS review — our team checks the case, then it goes live.",
  "Supporters Ask to Connect — they send a request; you accept or decline, and GRS makes the introduction.",
  "Agree the details — what the sponsor provides and what they get back, confirmed by both sides on GRS.",
];

export const FIVE_TIPS = [
  { icon: "📸", tip: "A strong cover photo — players in action or the whole squad together." },
  { icon: "⏰", tip: "A clear deadline — supporters act when they know the window closes." },
  { icon: "📖", tip: "A real story — who the team is, what they've achieved, and what this campaign unlocks." },
  { icon: "🙏", tip: "A thank-you plan — something supporters receive when it's done." },
  { icon: "🔔", tip: "Regular updates — results, photos and progress, so supporters feel part of the journey." },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "cover-photo",
    title: "1. Choose your cover photo",
    body: `The photo is the first thing a supporter sees, and it decides whether they keep reading.\n\n` +
      `• Use a sharp, well-lit photo. Not blurry, not dark.\n` +
      `• Go for action (a tackle, a shot, a celebration) or unity (the full squad in kit).\n` +
      `• For players under 18, only use photos covered by a signed GRS parent consent form.\n` +
      `• Tip: you can take a clean still from your match video in Arena.`,
  },
  {
    id: "title",
    title: "2. Write your title",
    body: `Supporters read the title next and decide in seconds. Keep it Clear, Short and Memorable.\n\n` +
      `• Clear — name the real goal, such as a tournament, kit or boots. Not "support our team."\n` +
      `• Short — someone should be able to repeat it on WhatsApp in one sentence.\n` +
      `• Memorable — give it some energy.\n\n` +
      `Invite people in. Words like join, back, be part of and follow work better than help, donate or charity.\n\n` +
      `Examples:\n` +
      `• Get Mbare Stars to the Harare U15 Finals\n` +
      `• Boots for Every Player at Chitungwiza Juniors\n` +
      `• Kit Up Gokwe's First Girls' Team`,
  },
  {
    id: "story",
    title: "3. Tell your story",
    body: `A short phone video makes a big difference — it doesn't need to be professional.\n\n` +
      `• The coach speaks to camera: who you are, how long the team has been running, your best results.\n` +
      `• Explain why you're raising support and exactly what it will pay for.\n` +
      `• Show real training or match footage from Arena. Keep it to 2–3 minutes.\n` +
      `• Shona, Ndebele or English are all fine.\n\n` +
      `Your written story must stand on its own:\n\n` +
      `• Make people care: where the team comes from, what the players are up against, why football matters.\n` +
      `• Show progress: results, players improving, Talent Passport scores.\n` +
      `• Be specific: list exactly what's needed (e.g. 18 jerseys, 2 match balls, transport to the tournament).\n` +
      `• Explain the thank-you: what supporters will get back.\n` +
      `• End with a clear call to action.`,
  },
  {
    id: "timing",
    title: "4. Pick your timing",
    body: `Campaigns of 30–45 days tend to perform best.\n\n` +
      `• Momentum — long enough to spread, short enough that people don't forget.\n` +
      `• Urgency — a near deadline makes people act today.\n` +
      `• Focus — a short window keeps your attention on coaching, not chasing.\n\n` +
      `Plan backwards from when you need the items. Leave time for purchase and delivery before your tournament or season starts.`,
  },
  {
    id: "target",
    title: "5. Set a realistic target",
    body: `A target that looks achievable gets more support than one that looks impossible.\n\n` +
      `How to set it:\n\n` +
      `• List every cost: kit, balls, boots, transport, entry fees, and thank-you items.\n` +
      `• Aim to secure about 30% in the first week from your closest circle. If you can't see that happening, lower the target.\n` +
      `• List items, not just a money total — supporters trust "18 jerseys, 2 match balls, bus fare" more than "$480".\n\n` +
      `GRS never holds or handles money. Sponsors provide items directly or pay the supplier named in your agreement.\n\n` +
      `If the total feels too big, split it into stages: Stage 1: Kit, then Stage 2: Tournament travel.`,
  },
  {
    id: "thank-yous",
    title: "6. Thank your supporters",
    body: `Cases that offer thank-you rewards usually attract more support. A good thank-you makes supporters feel valued and gives them something to share.\n\n` +
      `Ideas that work for a grassroots team:\n\n` +
      `• Shout-out on the team's WhatsApp status or GRS page.\n` +
      `• Voice note or video — the squad saying thank you by name.\n` +
      `• Signed team photo (printed or digital).\n` +
      `• Highlight mention in the Match Eye highlight reel.\n` +
      `• Match-day experience — an invite to watch a home match.\n` +
      `• The team's logo on the match banner or warm-up bibs (for businesses).\n\n` +
      `Offer a ladder of amounts: small ($1–$5) so local supporters can join; mid ($10–$25) where most people land; bigger ($50+) for diaspora and businesses.\n\n` +
      `Safeguarding: never offer a thank-you that puts a supporter in private, unsupervised contact with a player under 18. All contact goes through the coach, in group settings.`,
  },
  {
    id: "sponsors",
    title: "7. Show off your sponsors",
    body: `Local businesses want to be seen backing their community.\n\n` +
      `• Already have a sponsor? Add their name and logo to your case page.\n` +
      `• Who to ask: the local sports shop, supermarket, transport operator, clinic, or businesses your players' families run.\n` +
      `• Not allowed for youth teams: alcohol, betting, tobacco or vaping brands.\n\n` +
      `Sponsor packages:\n\n` +
      `• Community Supporter ($25–$50) — name on the page and a thank-you post.\n` +
      `• Team Partner ($100–$250) — logo on the banner and in Match Eye videos.\n` +
      `• Kit Sponsor ($500+) — logo on kit or warm-up bibs for the season.\n\n` +
      `Go in person if you can, with a coach and a parent rather than the players alone. Bring your campaign page on your phone.`,
  },
  {
    id: "first-week",
    title: "8. Plan your first week before you launch",
    body: `Cases that succeed usually secure about a third of their target in the first few days.\n\n` +
      `Before you go live:\n\n` +
      `• Put in your own contribution first — it shows you're invested too.\n` +
      `• List your top 5 to 10 supporters and talk to them before launch day.\n` +
      `• Meet people face to face where you can: at the ground, at church, at the market.\n` +
      `• Tease it: post a short clip from training saying "something big is coming on Monday."\n` +
      `• Pick a hashtag and use it everywhere, e.g. #KitUpMbareStars.\n\n` +
      `A WhatsApp video call works for the diaspora. Personal asks work far better than group messages.`,
  },
  {
    id: "launch",
    title: "9. Launch day",
    body: `• Send the link to your first circle (parents, family and close friends) and ask them to give and share.\n` +
      `• Follow up personally — a call, a voice note, or a word at training.\n` +
      `• Every message should include one line on the goal, one line on the thank-you, and the link.`,
  },
  {
    id: "spread",
    title: "10. Spread the word in circles",
    body: `Think of your supporters in rings:\n\n` +
      `• First circle (players' families, close friends): message each one personally. They give first and forward the link.\n` +
      `• Second circle (former players, church, school community): WhatsApp groups and Facebook. Lead with your best video and early progress.\n` +
      `• Third circle (wider public, businesses, media): reach them once you have momentum.\n\n` +
      `Older relatives and diaspora family are often your best route to new supporters. Not everyone can give, but everyone can share.`,
  },
  {
    id: "updates",
    title: "11. Keep supporters updated",
    body: `Post an update at least once a week: results, training photos, progress towards the target.\n\n` +
      `When the items arrive, post photos of the players with their new kit. That's the update supporters remember, and it's why they'll back your next campaign.\n\n` +
      `Celebrate milestones: "We hit 30% today, thank you!" or "We won 3–1 on Saturday and we're halfway to our kit!"\n\n` +
      `Photo safety: only post photos of players whose parents have signed the GRS consent form. Never post a child's full name together with their school or home area.`,
  },
];
