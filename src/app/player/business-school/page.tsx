"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { BookOpen, ChevronDown, ChevronUp, CheckCircle, XCircle, Trophy, Clock } from "lucide-react";

interface Quiz {
  question: string;
  options: string[];
  answer: number;
}

interface Lesson {
  id: string;
  title: string;
  intro: string;
  facts: string[];
  warnings: string[];
  tips: string[];
  shona: string;
  quiz: Quiz;
}

interface Track {
  id: number;
  emoji: string;
  title: string;
  subtitle: string;
  intro: string;
  color: string;
  lessons: Lesson[];
}

const TRACKS: Track[] = [
  {
    id: 1,
    emoji: "⏳",
    title: "The Footballer Life Cycle",
    subtitle: "Know your career stages before it's too late",
    intro: "Every footballer's career follows a predictable pattern. The players who succeed are the ones who understand which stage they are in — and plan accordingly. This track gives you the full picture.",
    color: "from-blue-700 to-indigo-800",
    lessons: [
      {
        id: "1.1",
        title: "Your Career Has Stages — Know Them",
        intro: "A football career is short. The average professional career lasts just 8 years. Understanding the stages means you can make the right decisions at the right time — not after it's too late.",
        facts: [
          "The average professional footballer retires at 35, but the average grassroots career ends much earlier — often at 28.",
          "Most earning potential happens between ages 22-30. Everything before that is preparation.",
          "Players who plan their career earn 3× more over their lifetime than those who just 'play and see'.",
        ],
        warnings: [
          "Don't assume you have time. Every year without a contract is a year of earning potential gone.",
          "Injuries can end a career overnight. Never rely on your body alone — always have a financial and educational backup plan.",
        ],
        tips: [
          "Write down where you want to be at age 22, 25, and 30. Work backwards from those goals.",
          "Talk to older players who have retired. Learn from their regrets before they become yours.",
          "Start saving money from your first professional payment, no matter how small.",
        ],
        shona: "Ziva nguva yako — Know your time. Every stage of the footballer life cycle requires a different mindset.",
        quiz: {
          question: "What is the average length of a professional football career?",
          options: ["A) 15 years", "B) 8 years", "C) 20 years"],
          answer: 1,
        },
      },
      {
        id: "1.2",
        title: "The Youth Academy Phase (Age 8–16)",
        intro: "This is the foundation stage. What you build here — technically, physically, mentally — determines everything that follows. But youth football is also where most dreams get crushed. Here is how to make it through.",
        facts: [
          "Less than 1% of academy players make it to professional football. But 100% of those who do were outstanding technically at youth level.",
          "Elite academies in England sign players as young as 8. In Zimbabwe, the equivalent is being picked up by a Division 1 club academy by 14.",
          "Coaches at academy level are looking for trainability — the ability to learn and improve quickly — not just raw talent.",
        ],
        warnings: [
          "Specialising in one position too early can limit your development. Play multiple positions under age 12.",
          "Burnout at youth level is real. If football stops being fun, speak up — not just play through it.",
        ],
        tips: [
          "Practise technical skills daily — at least 30 minutes of ball work outside of team training.",
          "Watch football analytically. Study your position. Ask 'why did that player make that run?'",
          "Maintain your education. A degree or diploma is your backup that no injury can take away.",
        ],
        shona: "Dzidza paucheche — Learn when you are young. Skills built before 16 last a lifetime.",
        quiz: {
          question: "What quality do academy coaches look for most in young players?",
          options: ["A) Raw speed", "B) Trainability — the ability to learn fast", "C) Physical size"],
          answer: 1,
        },
      },
      {
        id: "1.3",
        title: "The Development Phase (Age 16–21)",
        intro: "This is your make-or-break window. By 21, most professional paths are decided. This phase is about earning your first contract, surviving the brutal competition, and building the physical and mental toughness of a pro.",
        facts: [
          "Most players who make it sign their first professional contract between 17 and 19.",
          "In Zimbabwe, the pathway often goes: school team → Division 3 club → Division 2 club → Division 1. Each step requires a standout season.",
          "Mental toughness is 40% of what separates professional players from talented amateurs at this stage.",
        ],
        warnings: [
          "Avoid agents who promise big moves abroad during this phase. Most are scammers targeting young players.",
          "Do not drop out of school or college without a signed contract in hand. A verbal promise is worth nothing.",
        ],
        tips: [
          "Get as many competitive matches as possible, even if it means playing for free temporarily.",
          "Record your own performances and review them. Self-awareness accelerates development faster than any coach.",
          "Build relationships with coaches, administrators, and senior players. Your network will open more doors than your talent alone.",
        ],
        shona: "Shandira nesimba — Work with strength. The development phase demands everything you have.",
        quiz: {
          question: "What is the biggest mistake players make in the development phase?",
          options: ["A) Training too hard", "B) Dropping out of education without a signed contract", "C) Playing too many positions"],
          answer: 1,
        },
      },
      {
        id: "1.4",
        title: "Your Peak Years (Age 22–30)",
        intro: "This is when the money, the recognition, and the biggest opportunities come. Most players waste this window on poor financial decisions and lack of planning. Don't be that player.",
        facts: [
          "Peak earning years for a professional footballer are 24–28. This is when wages are highest relative to performance output.",
          "Players who invest 20% of their income during peak years can retire financially secure. Most players spend 110% of what they earn.",
          "Peak years are also when scouts look most seriously for transfers — your form in this window determines your ceiling.",
        ],
        warnings: [
          "Lifestyle inflation is the number one killer of footballer wealth. As income rises, keep spending at development-phase levels.",
          "Injuries peak between 25-29 due to accumulated physical load. Invest in recovery — physiotherapy, nutrition, sleep.",
        ],
        tips: [
          "Open a savings account or investment fund from your first professional payment. Automate it so you never 'decide' to skip it.",
          "Hire a certified financial advisor — not your uncle or friend — to manage your money.",
          "Stay humble during peak years. Consistency, not brilliance, keeps coaches picking you.",
        ],
        shona: "Shandisa nguva yako zvakanaka — Use your time well. Peak years only come once.",
        quiz: {
          question: "What percentage of income should a professional footballer try to save during peak years?",
          options: ["A) At least 20%", "B) 5% is enough", "C) Save nothing — spend and enjoy it"],
          answer: 0,
        },
      },
      {
        id: "1.5",
        title: "The Decline Phase and How to Slow It",
        intro: "After 30, the body changes. Recovery takes longer, speed drops, and injuries linger. But the smartest players extend their careers by 3-5 years through adaptation. Here is how.",
        facts: [
          "Physical speed peaks at 23 and declines by 1-2% per year after 27. Intelligence and positioning can compensate for this for years.",
          "Players who transition from speed-based to intelligence-based roles (e.g., holding midfielder, sweeper) last 4 years longer on average.",
          "Ryan Giggs played until 40, Paolo Maldini until 41 — both by adapting their game radically after 32.",
        ],
        warnings: [
          "Ignoring recovery and body maintenance in your 20s accelerates decline in your 30s. The bill always arrives.",
          "Chasing money at smaller clubs abroad when your physical peak is gone often ends in isolation and early retirement.",
        ],
        tips: [
          "Start working with a sports physiotherapist from age 28 — not when you're injured, but preventively.",
          "Develop your football intelligence actively. Watch more, analyse more, talk to coaches more.",
          "Consider a coaching or sports administration qualification from age 28. Plant seeds before you need them.",
        ],
        shona: "Ramba uchishanda — Keep working. Intelligence outlasts speed in football.",
        quiz: {
          question: "How do the smartest players extend their careers past 30?",
          options: ["A) By running harder and training more", "B) By adapting their game from speed-based to intelligence-based", "C) By taking supplements"],
          answer: 1,
        },
      },
      {
        id: "1.6",
        title: "Life After Football — Planning Your Exit",
        intro: "Retirement hits most footballers like a wall. One day the dressing room, the matches, the structure — all gone. Players who plan their exit thrive. Players who don't often spiral. Here is how to plan.",
        facts: [
          "The average footballer faces 30+ years of post-career life. Most enter retirement with no savings, no qualifications, and no plan.",
          "Former players who prepared while still playing earn 60% more in post-career than those who didn't.",
          "Coaching, sports media, sports business, and player management are all viable careers that use your football knowledge.",
        ],
        warnings: [
          "The 'I'll deal with it when it happens' mindset is the most common cause of post-career financial collapse.",
          "Beware of bad business deals offered to you because of your name. Many retired players lose everything to bad investments.",
        ],
        tips: [
          "Start your post-career qualification while still playing. Online degrees and coaching badges can be done part-time.",
          "Build relationships outside football — in business, education, media — while you still have access and recognition.",
          "Create a retirement fund that you do not touch until you stop playing. Even $50/month from age 20 compounds significantly.",
        ],
        shona: "Gadzirira mangwana — Prepare for tomorrow. The best day to plan retirement was yesterday. The second best day is today.",
        quiz: {
          question: "When should a footballer start planning for retirement?",
          options: ["A) At age 35 when it gets close", "B) Never — worry about it when it happens", "C) From the start of your career, even age 18"],
          answer: 2,
        },
      },
    ],
  },
  {
    id: 2,
    emoji: "📄",
    title: "Contracts and Your Rights",
    subtitle: "Never sign what you don't understand",
    intro: "Contracts are the language of professional football. Every transfer, every loan, every boot deal — it all comes down to what is written on paper. This track teaches you to read that paper and protect yourself.",
    color: "from-emerald-700 to-teal-800",
    lessons: [
      {
        id: "2.1",
        title: "What Is a Football Contract?",
        intro: "A football contract is a legal agreement between you and a club. It defines what they owe you, what you owe them, and what happens if either side breaks the agreement. Understanding the basics is non-negotiable.",
        facts: [
          "A football contract is a legally binding document. Once signed, you are legally committed to its terms.",
          "Key elements: duration, wages, bonuses, image rights, release clause, termination conditions.",
          "In Zimbabwe, ZIFA registers all professional contracts. Unregistered contracts offer you fewer legal protections.",
        ],
        warnings: [
          "Never sign a contract without reading every line. 'The agent will explain it later' is not good enough.",
          "Verbal agreements have almost no legal standing. If it's not in writing and signed, it doesn't legally exist.",
        ],
        tips: [
          "Always ask for 48 hours to review a contract before signing. Any club that won't give you this is a red flag.",
          "Find a lawyer who understands sports law before you sign your first professional contract. It may cost $50-$100 but could save you thousands.",
          "Keep copies of every contract you sign. Store them somewhere safe — not just on your phone.",
        ],
        shona: "Verenga zvawanosaina — Read what you sign. Ignorance of a contract does not protect you from it.",
        quiz: {
          question: "What should you do before signing any football contract?",
          options: ["A) Sign quickly so the club doesn't change their mind", "B) Ask for 48 hours to review it, ideally with a lawyer", "C) Trust your agent to handle it"],
          answer: 1,
        },
      },
      {
        id: "2.2",
        title: "Reading the Fine Print",
        intro: "The clauses buried in the middle of contracts are where players get caught. Image rights, social media restrictions, loyalty bonuses that only pay out after 4 years — these details matter enormously.",
        facts: [
          "Image rights clauses can mean a club owns the right to use your face and name commercially without paying you additionally.",
          "Loyalty bonuses often require you to stay 4-5 years to receive them. If you transfer, you lose them.",
          "Performance bonuses sound great but are often written with conditions nearly impossible to trigger.",
        ],
        warnings: [
          "A clause saying the club can unilaterally extend your contract by one year is common and heavily favours the club. Negotiate it out.",
          "Clauses about social media conduct can result in wage deductions if you post something the club dislikes.",
        ],
        tips: [
          "Ask your agent or lawyer to highlight every clause that limits what you can do or say. Understand each one.",
          "Negotiate bonuses to be triggered by realistic targets — goals, appearances, form — not impossible ones.",
          "Ask specifically: 'What happens to my wages if I am injured?' The answer should be in the contract.",
        ],
        shona: "Tarisa zviri mukati — Look at what is inside. The important things are always in the small print.",
        quiz: {
          question: "What is an image rights clause?",
          options: ["A) A clause about your right to wear any boots", "B) A clause where the club can use your face and name commercially", "C) A clause about playing in front of cameras"],
          answer: 1,
        },
      },
      {
        id: "2.3",
        title: "Transfer Fees and How They Work",
        intro: "Transfer fees are one of the most misunderstood parts of football. Many players think they receive the transfer fee. They don't. Here is exactly how transfer money flows — and how you can benefit.",
        facts: [
          "A transfer fee is paid by the buying club to the selling club — not to the player. The player negotiates a new salary separately.",
          "Sell-on clauses: if your old club included a sell-on clause (e.g., 20%), they receive 20% of any future transfer fee.",
          "Signing-on bonuses and loyalty fees are separate payments negotiated directly between player and new club.",
        ],
        warnings: [
          "Some clubs register you at a lower wage than agreed verbally. Always verify the registered contract matches what you were promised.",
          "Do not agree to a transfer and then hope your salary negotiation works out. Lock in the salary before agreeing to move.",
        ],
        tips: [
          "When negotiating a new contract, consider asking for a lower base salary with higher performance bonuses. This can result in higher total earnings.",
          "Understand your release clause — the price at which any club can buy you out. Set it high enough to protect you but not so high that no club will ever trigger it.",
          "If you are sold against your will, you have the right to negotiate your new contract independently. Use it.",
        ],
        shona: "Mari yekushinya inopinda kukirabhu — Transfer money goes to the club. Your power is in your contract negotiation.",
        quiz: {
          question: "Who receives the transfer fee when a player is transferred?",
          options: ["A) The player receives it directly", "B) Split equally between player and selling club", "C) The selling club receives it — the player negotiates a new salary separately"],
          answer: 2,
        },
      },
      {
        id: "2.4",
        title: "Agent Agreements — Know What You're Signing",
        intro: "Agents can open incredible doors. They can also take more than their share and leave you with bad deals. This lesson teaches you exactly what a legitimate agent relationship looks like — and what it doesn't.",
        facts: [
          "FIFA rules cap agent commissions at 3% of a player's salary (5% if the agent also represents the club). Any more is not FIFA-compliant.",
          "A licensed agent must be registered with FIFA or their national federation. Always verify the registration.",
          "Agent contracts should be no longer than 2 years with a clear termination clause.",
        ],
        warnings: [
          "An agent who asks for payment upfront before getting you a contract is a scam. Legitimate agents earn only after you sign.",
          "If an agent says 'I have a guaranteed deal in Europe' without you having had a trial — walk away immediately.",
          "Agents who want exclusive rights over your entire career (all sports, all territories, forever) should be refused.",
        ],
        tips: [
          "Ask any potential agent for their FIFA registration number and verify it on the FIFA website.",
          "A good agent will happily let you have a lawyer review the agent agreement. A bad one will resist this.",
          "Build your own network alongside your agent's. Never depend 100% on one person for your career opportunities.",
        ],
        shona: "Ziva mumiririri wako chaiye — Know your true representative. A real agent builds your career, not their commission.",
        quiz: {
          question: "What is the FIFA-compliant maximum agent commission from a player's salary?",
          options: ["A) 10%", "B) 15%", "C) 3%"],
          answer: 2,
        },
      },
      {
        id: "2.5",
        title: "Termination and Release Clauses",
        intro: "What happens when a club wants to release you, or you want to leave? Termination and release clauses determine whether you walk away with compensation or nothing. Here is how they work.",
        facts: [
          "A release clause sets the price at which you can be bought by another club. If a club pays it, you MUST be allowed to go.",
          "Mutual termination means both sides agree to end the contract. This usually happens with a compensation payment.",
          "If a club terminates your contract without cause, they typically owe you the remaining contracted wages.",
        ],
        warnings: [
          "Clubs sometimes pressure players to 'mutually terminate' to avoid paying remaining wages. This is a tactic. Get legal advice.",
          "If you unilaterally breach your contract (leave without club agreement), you may be banned from playing for 6 months under FIFA rules.",
        ],
        tips: [
          "Always negotiate a termination-for-cause clause: if the club does not pay your wages on time for 2+ months, you can terminate legally.",
          "If a club relegates or materially changes your contract conditions, you may have grounds for unilateral termination.",
          "Keep records of every wage payment. Bank statements are evidence. Non-payment strengthens any contract dispute.",
        ],
        shona: "Ziva nzira yekubuda — Know the way out. Every contract should have a clear exit path for both sides.",
        quiz: {
          question: "What does a release clause do?",
          options: ["A) Lets a club terminate you without paying wages", "B) Sets a fixed price at which another club can buy you out", "C) Releases you from training duties when injured"],
          answer: 1,
        },
      },
      {
        id: "2.6",
        title: "Your Rights Under ZIFA Rules",
        intro: "ZIFA (Zimbabwe Football Association) has rules that protect players at every level. Most players in Zimbabwe have never read them. This lesson gives you the key protections you need to know.",
        facts: [
          "ZIFA rules require all professional clubs to pay wages on time. Consistent non-payment gives you grounds for contract termination.",
          "You have the right to a copy of your registered contract within 7 days of signing.",
          "ZIFA has a Players' Status Committee that hears disputes between players and clubs. It is free to use.",
        ],
        warnings: [
          "Many grassroots clubs in Zimbabwe operate outside ZIFA registration. If you're not registered, you have fewer protections.",
          "Never play for a club that refuses to register your contract with ZIFA. You gain nothing and can lose everything.",
        ],
        tips: [
          "Request a ZIFA registration number for your contract. This proves your contract is officially recognised.",
          "If your club violates your contract, file a complaint with the ZIFA Players' Status Committee before doing anything else.",
          "Join the Zimbabwe Professional Footballers Association (ZPFA) if eligible. They provide legal support and advocacy.",
        ],
        shona: "Unazvo kodzero — You have rights. Knowing ZIFA rules protects your career and your income.",
        quiz: {
          question: "What is the ZIFA Players' Status Committee?",
          options: ["A) A committee that selects national team players", "B) A body that hears contract disputes between players and clubs", "C) A coaching certification board"],
          answer: 1,
        },
      },
    ],
  },
  {
    id: 3,
    emoji: "🥗",
    title: "Nutrition and the Physical Business",
    subtitle: "Your body is your most important asset",
    intro: "No salary, no contract, no agent matters if your body breaks down. Nutrition is the fuel that determines how long and how hard you can perform. This track gives you a practical, Zimbabwe-specific nutrition playbook.",
    color: "from-green-700 to-emerald-800",
    lessons: [
      {
        id: "3.1",
        title: "Food Is Fuel — The Basics",
        intro: "Elite footballers understand one thing that amateur players miss: food is not enjoyment, it is engineering. What you eat determines how you train, how you recover, and how long your career lasts.",
        facts: [
          "Footballers need approximately 55-65% of calories from carbohydrates, 20-25% from protein, and 15-20% from healthy fats.",
          "Sadza (maize meal) is an excellent complex carbohydrate for footballers — it provides sustained energy for a full match.",
          "Protein repairs muscle. A player needs approximately 1.4-1.7g of protein per kilogram of bodyweight daily.",
        ],
        warnings: [
          "Processed and fried foods cause inflammation that slows recovery and increases injury risk. Limit them severely.",
          "Skipping meals, especially breakfast, leads to energy crashes during training — when habits are being formed.",
        ],
        tips: [
          "Build every main meal around a protein source (eggs, beans, chicken, beef, fish) + a complex carb (sadza, sweet potato, brown rice) + vegetables.",
          "Cook your own food whenever possible. Restaurant and takeaway food is typically high in oils that slow recovery.",
          "Eat your biggest meal 3-4 hours before training or matches, and a small protein-rich snack 1 hour before.",
        ],
        shona: "Kudya ndiwo mafuta — Food is the fuel. What you put in determines what comes out on the pitch.",
        quiz: {
          question: "Approximately what percentage of a footballer's diet should be carbohydrates?",
          options: ["A) 20-30%", "B) 55-65%", "C) 80-90%"],
          answer: 1,
        },
      },
      {
        id: "3.2",
        title: "Pre-Match Nutrition",
        intro: "What you eat in the 24 hours before a match determines your energy levels during it. Get this wrong and you feel it in the second half. Get it right and you have more energy than the opposition.",
        facts: [
          "The evening before a match: high-carbohydrate meal to fill glycogen stores (sadza, pasta, rice + lean protein).",
          "Match-day breakfast (3-4 hours before kick-off): familiar food, high-carb, low-fat, low-fibre — to avoid stomach issues.",
          "1 hour before the match: a small, easily digestible snack — banana, white bread, or a sports drink.",
        ],
        warnings: [
          "Never try new foods on match day. Your digestive system needs familiar food to perform well.",
          "High-fat or high-fibre foods before a match (e.g., fatty meat, raw vegetables, beans) cause sluggishness and stomach cramps.",
        ],
        tips: [
          "Develop a pre-match meal routine and stick to it every game. Consistency reduces variables and builds mental confidence.",
          "Avoid caffeine before morning matches if you are not used to it — it can cause anxiety and shakiness.",
          "If you train or play in afternoon heat, a cold drink before the match helps maintain core body temperature.",
        ],
        shona: "Gadzirira kutamba — Prepare to play. Pre-match nutrition starts the night before, not on the day.",
        quiz: {
          question: "What is the best pre-match snack to eat 1 hour before kick-off?",
          options: ["A) A large sadza meal with beef stew", "B) Fried chicken and chips", "C) A banana or slice of white bread"],
          answer: 2,
        },
      },
      {
        id: "3.3",
        title: "Recovery Nutrition",
        intro: "The 30-minute window after training or a match is the most important nutritional moment of your day. Most players miss it completely. Here is why it matters and what to do.",
        facts: [
          "In the 30 minutes after intense exercise, your muscles are 2-3× more effective at absorbing nutrients for repair.",
          "Recovery requires: protein (to repair muscle) + carbohydrates (to refuel glycogen) + fluids (to rehydrate).",
          "Missing the recovery window means more muscle soreness, slower injury healing, and worse performance in the next session.",
        ],
        warnings: [
          "Alcohol after matches dramatically slows recovery — it blocks protein synthesis for hours. This is why professional clubs ban alcohol 48 hours post-match.",
          "Relying on recovery drinks alone (without real food) is less effective than a proper recovery meal.",
        ],
        tips: [
          "Pack a recovery snack in your kit bag: boiled eggs, a protein shake, milk, or leftover cooked chicken. Eat it immediately after the final whistle.",
          "Follow with a full recovery meal within 2 hours: sadza with vegetables and chicken or eggs covers all bases.",
          "Prioritise sleep after hard training. Growth hormone (which repairs muscle) is mainly released during deep sleep.",
        ],
        shona: "Zorora zvakanaka — Rest properly. Recovery nutrition is where your next performance is built.",
        quiz: {
          question: "How long after exercise is the optimal window for recovery nutrition?",
          options: ["A) 3-4 hours later", "B) The next morning", "C) Within 30 minutes"],
          answer: 2,
        },
      },
      {
        id: "3.4",
        title: "Hydration in Zimbabwean Heat",
        intro: "Zimbabwe's climate is one of the most challenging environments to play football in. Heat and humidity accelerate dehydration faster than most players realise. Hydration is a performance weapon — use it.",
        facts: [
          "A player can lose 2-3 litres of sweat in a single match in Zimbabwe's dry season. Losing just 2% bodyweight in sweat reduces performance by up to 10%.",
          "Thirst is a late signal of dehydration. By the time you feel thirsty, performance has already dropped.",
          "Water alone is not sufficient for sessions longer than 60 minutes. You also need electrolytes (salt, potassium) lost in sweat.",
        ],
        warnings: [
          "Energy drinks (Red Bull, Monster) are NOT sports drinks. They cause dehydration and heart rate issues during exercise.",
          "Drinking large amounts of water immediately before a match causes bloating and discomfort. Sip consistently through the day.",
        ],
        tips: [
          "Drink 500ml of water 2 hours before training, then 200ml every 20 minutes during training.",
          "A simple homemade electrolyte drink: 500ml water + 1 pinch salt + 1 teaspoon sugar + squeeze of lemon. More effective than most commercial drinks.",
          "Check your urine colour. Pale yellow = well hydrated. Dark yellow = drink more immediately.",
        ],
        shona: "Nwa mvura nguva dzose — Drink water always. In Zimbabwe's heat, hydration is a tactical advantage.",
        quiz: {
          question: "What does losing 2% of bodyweight through sweat do to performance?",
          options: ["A) Nothing — the body adapts automatically", "B) Reduces performance by up to 10%", "C) Only affects performance after 5% loss"],
          answer: 1,
        },
      },
      {
        id: "3.5",
        title: "Supplements — What's Legal, What's Not",
        intro: "The supplement industry is full of promises, scams, and — dangerously — banned substances. One wrong supplement can end your career through a failed drug test, even if you didn't know it was banned.",
        facts: [
          "Creatine monohydrate and protein powder are the only two supplements with strong scientific evidence for performance benefits, and both are legal.",
          "WADA (World Anti-Doping Agency) bans many substances found in 'performance' supplements. Ignorance is not a defence — a positive test is a positive test.",
          "Contaminated supplements (where banned substances are not listed on the label) account for many inadvertent failed tests.",
        ],
        warnings: [
          "Never take a supplement recommended by a teammate without checking it against the WADA prohibited list yourself.",
          "Any supplement promising extreme results (lose 10kg in 2 weeks, add 20kg of muscle in a month) is almost certainly dangerous or illegal.",
        ],
        tips: [
          "Before taking any supplement, check it on the WADA Global DRO website (globaldro.com) — it's free and takes 2 minutes.",
          "The best supplements are still food: eggs, milk, lean meat, bananas, sweet potato. These are cheaper, safer, and often more effective.",
          "If a club doctor prescribes medication or supplements, ask for written confirmation that they are WADA-compliant.",
        ],
        shona: "Zvizivise — Know what you take. One banned supplement can erase everything you have worked for.",
        quiz: {
          question: "What should you check before taking any supplement?",
          options: ["A) Ask a teammate if it's good", "B) Check it against the WADA prohibited list on globaldro.com", "C) Only buy from pharmacies — all pharmacy supplements are safe"],
          answer: 1,
        },
      },
      {
        id: "3.6",
        title: "Sleep and Recovery",
        intro: "Sleep is the most powerful performance tool available to every athlete — and it costs nothing. Yet most footballers in Zimbabwe sleep badly and wonder why they feel sluggish in training. Here is what world-class athletes know about sleep.",
        facts: [
          "Professional athletes need 8-10 hours of sleep per night — not the 6-7 most people manage.",
          "During deep sleep, the body releases growth hormone which repairs muscle, consolidates skills learned in training, and strengthens the immune system.",
          "Roger Federer reportedly slept 12 hours per night during competition. LeBron James sleeps 8-10 hours and naps daily.",
        ],
        warnings: [
          "Screens (phone, TV) in the hour before sleep suppress melatonin by up to 50%, making it harder to fall into deep sleep.",
          "Training too close to bedtime (within 2 hours) raises cortisol and adrenaline, making it harder to sleep.",
        ],
        tips: [
          "Create a consistent sleep schedule — sleep and wake at the same time every day, including weekends.",
          "Make your bedroom as dark and cool as possible. These are the two most important environmental factors for sleep quality.",
          "If you must train in the evening, eat your recovery meal, shower, and dim your phone screen for 30 minutes before sleeping.",
        ],
        shona: "Hope ndiyo mushonga — Sleep is the medicine. No supplement, no training method replaces quality sleep.",
        quiz: {
          question: "How many hours of sleep do professional athletes typically need per night?",
          options: ["A) 5-6 hours is enough", "B) 8-10 hours", "C) Sleep doesn't significantly affect performance"],
          answer: 1,
        },
      },
    ],
  },
  {
    id: 4,
    emoji: "💰",
    title: "The Business of Football",
    subtitle: "Understand the industry you work in",
    intro: "Football is a multi-billion dollar business. Even at grassroots level in Zimbabwe, understanding how the money flows helps you negotiate better, find more opportunities, and build a sustainable career. This track pulls back the curtain.",
    color: "from-amber-600 to-orange-700",
    lessons: [
      {
        id: "4.1",
        title: "How Clubs Make Money",
        intro: "Clubs are businesses. Understanding where their money comes from tells you how much they can pay, when they are under financial pressure, and where opportunities for sponsorship and investment exist.",
        facts: [
          "Professional clubs earn revenue from: match day (gate receipts), broadcasting rights, sponsorship, merchandise, and player transfers.",
          "In Zimbabwe's Premier League, the biggest revenue source is match day gate fees and broadcasting from DSTV/ZBC.",
          "Transfer fees are a major income source for clubs that develop young players. This is why academies are profitable long-term investments.",
        ],
        warnings: [
          "Clubs that consistently fail to pay wages are usually in financial trouble. Unpaid wages are the first sign of a club in crisis.",
          "Do not join a club offering unusually high wages if they have a history of non-payment. The promise is worth nothing without track record.",
        ],
        tips: [
          "Research any club's financial history before signing. Ask players who already play there about payment reliability.",
          "Understanding club finances lets you negotiate better. A club just before a big gate-receipt match day has more negotiating flexibility.",
          "If you develop enough to be transferred, your contract's sell-on clause negotiation directly affects your value to the selling club.",
        ],
        shona: "Ziva bhizinesi rako — Know your business. Understanding club finances makes you a smarter negotiator.",
        quiz: {
          question: "What is typically the biggest revenue source for Zimbabwean Premier League clubs?",
          options: ["A) Merchandise and shirt sales", "B) Match day gate receipts and broadcasting", "C) Government grants"],
          answer: 1,
        },
      },
      {
        id: "4.2",
        title: "Revenue Streams in Zimbabwean Football",
        intro: "Zimbabwean football has unique revenue dynamics compared to European leagues. Understanding these local realities is essential for players, coaches, and administrators working in this market.",
        facts: [
          "DSTV SuperSport pays ZIFA a broadcasting rights fee for Zimbabwe Premier League matches — this is distributed to clubs.",
          "Corporate sponsorship from companies like NetOne, Delta, and CBZ is a major funding source for Zimbabwe's top clubs.",
          "Diaspora supporters — Zimbabweans living abroad — represent an untapped revenue opportunity for clubs that engage them digitally.",
        ],
        warnings: [
          "Many Zimbabwe clubs depend on a single main sponsor. If that sponsor withdraws, the club can collapse. Diversification matters.",
          "Political connections are sometimes used to fund clubs in Zimbabwe. This creates instability when political winds change.",
        ],
        tips: [
          "As a player, your marketability helps your club attract sponsors. A player with social media presence and a clean reputation is a commercial asset.",
          "If you ever move into club management, prioritise building multiple revenue streams over relying on one big sponsor.",
          "Digital content — match highlights, player interviews, behind-the-scenes footage — is a low-cost way to attract diaspora engagement and new sponsors.",
        ],
        shona: "Zvigove zvemari — Revenue streams. The more income sources a club has, the more secure your wages are.",
        quiz: {
          question: "Which of these represents an untapped revenue opportunity for Zimbabwe clubs?",
          options: ["A) Diaspora supporters engaged digitally", "B) Selling players to amateur clubs", "C) Charging more for water at matches"],
          answer: 0,
        },
      },
      {
        id: "4.3",
        title: "Sponsorship and How It Works",
        intro: "Sponsorship is money given by a company in exchange for exposure to your audience. Understanding how sponsorship deals work at club and personal level can significantly increase your earnings beyond your basic wage.",
        facts: [
          "Personal sponsorship deals (boot deals, clothing deals, energy drink endorsements) are separate from your club wage.",
          "Companies want association with winners, positive characters, and people with audiences. Your social media following is a factor in sponsorship value.",
          "Boot deals can range from free boots (grassroots level) to tens of thousands of dollars annually at professional level.",
        ],
        warnings: [
          "Exclusivity clauses in sponsorship deals mean you cannot wear or promote competing brands. Read them carefully.",
          "Be selective about what brands you associate yourself with. A sponsorship from a brand with a bad reputation can damage yours.",
        ],
        tips: [
          "Even at grassroots level, approach local businesses for small sponsorship deals — boot money, transport costs, kit donations.",
          "Build a media kit: a one-page document with your photo, statistics, social media following, and why partnering with you benefits a brand.",
          "Your agent should handle large sponsorship negotiations. For smaller local deals, learn to negotiate directly.",
        ],
        shona: "Wana vatsigiri — Get supporters. Sponsorship rewards players who build an audience and maintain a good image.",
        quiz: {
          question: "What do companies primarily look for when offering a player a personal sponsorship?",
          options: ["A) Only the player's goals and assists", "B) Winners with positive images and audiences", "C) Players from wealthy families"],
          answer: 1,
        },
      },
      {
        id: "4.4",
        title: "Prize Money and Bonus Structures",
        intro: "Prize money and performance bonuses can double or triple your football income — but only if you understand how they are structured and negotiate them properly from the start.",
        facts: [
          "ZIFA distributes prize money to clubs that win competitions. This money should be shared with players per the club's agreed bonus structure.",
          "Individual performance bonuses (goals, assists, clean sheets, appearances) are negotiated in your contract, not assumed.",
          "Sign-on bonuses are typically paid in instalments (e.g., 50% on signing, 50% after 6 months) to retain players.",
        ],
        warnings: [
          "If your contract does not explicitly mention how prize money is shared, the club has no legal obligation to give you any.",
          "Group bonus structures ('everyone gets the same') can work against high-performing players. Individual bonuses reward merit.",
        ],
        tips: [
          "Before signing, ask specifically: 'How is ZIFA competition prize money distributed to players?' Get the answer in writing.",
          "Negotiate your bonus triggers to be achievable but meaningful. A striker should negotiate per-goal bonuses; a goalkeeper per-clean-sheet.",
          "Track your own performance stats. When bonus disputes arise, documented personal stats are your strongest evidence.",
        ],
        shona: "Iwe unokodza mari yako — You earn your own money. Bonuses must be negotiated and documented, not assumed.",
        quiz: {
          question: "What must be in your contract for you to have legal right to prize money?",
          options: ["A) Nothing — ZIFA ensures all players get a share automatically", "B) An explicit clause about how competition prize money is distributed to players", "C) You just need to ask the chairman nicely"],
          answer: 1,
        },
      },
      {
        id: "4.5",
        title: "Financial Literacy for Footballers",
        intro: "Most footballers earn more than the average person in their country — and retire with less. Financial illiteracy is the reason. This lesson gives you the foundational financial knowledge every player needs.",
        facts: [
          "The 50/30/20 rule: 50% of income on needs (rent, food, transport), 30% on wants (lifestyle), 20% saved and invested.",
          "Compound interest means money invested early grows exponentially. $100 saved monthly from age 20 becomes $120,000+ by age 50 at 8% annual returns.",
          "Tax obligations in Zimbabwe apply to footballers just as to any other worker. Understanding tax avoids legal problems.",
        ],
        warnings: [
          "Lending money to family and friends is one of the most common causes of financial ruin for African footballers. Learn to say no with a system.",
          "Flashy purchases (cars, expensive phones, designer clothing) depreciate rapidly. They make you look wealthy while making you poorer.",
        ],
        tips: [
          "Open a savings account that is difficult to access (e.g., a fixed deposit or savings account without a debit card). Pay yourself first.",
          "Create a simple monthly budget. Every dollar should be assigned a purpose before you spend it.",
          "When family asks for money, have a fixed amount you give and stick to it. 'I can give you $X this month — that is my fixed support amount.'",
        ],
        shona: "Chengetedza mari yako — Protect your money. Financial literacy is as important as technical skill for a long career.",
        quiz: {
          question: "In the 50/30/20 rule, what percentage should be saved and invested?",
          options: ["A) 5%", "B) 50%", "C) 20%"],
          answer: 2,
        },
      },
      {
        id: "4.6",
        title: "Building Wealth on a Football Salary",
        intro: "Even a modest football salary, managed correctly, can build lasting wealth. This lesson shows you how to turn short career earnings into long-term financial security — with practical Zimbabwe-specific examples.",
        facts: [
          "Real estate (property) has historically been one of the safest investments for footballers in Zimbabwe. Buying land or a house early is a common wealth-building strategy.",
          "A small business (butchery, bottle store, transport) funded by football savings can replace football income after retirement.",
          "Unit trusts and government bonds are lower-risk investment options available in Zimbabwe through CBZ, FBC, and other banks.",
        ],
        warnings: [
          "Avoid cryptocurrency investments until you have solid foundational assets. High potential returns come with extremely high risk of total loss.",
          "Never invest money you cannot afford to lose in a business you do not understand. If a friend says 'trust me, it's a gold mine' — don't.",
        ],
        tips: [
          "Start with the simplest investments first: savings account, then unit trust, then property. Each step builds understanding for the next.",
          "Visit a financial advisor at a Zimbabwean bank (CBZ, Stanbic, FBC). A first consultation is usually free.",
          "Your first investment goal should be to buy land. Even a small plot purchased during your career provides security and appreciates over time.",
        ],
        shona: "Simba chivakwa — Build strength. Wealth built during football years gives you freedom after it.",
        quiz: {
          question: "What is typically considered one of the safest first investments for footballers in Zimbabwe?",
          options: ["A) Cryptocurrency", "B) Lending money to friends at interest", "C) Real estate — buying land or property"],
          answer: 2,
        },
      },
    ],
  },
  {
    id: 5,
    emoji: "📱",
    title: "Personal Branding and Marketing Your Talent",
    subtitle: "You are a brand. Act like one.",
    intro: "In 2026, a footballer with no digital presence is invisible to scouts, sponsors, and opportunities. Personal branding is not vanity — it is career strategy. This track shows you how to build and protect your brand.",
    color: "from-purple-700 to-violet-800",
    lessons: [
      {
        id: "5.1",
        title: "You Are a Brand",
        intro: "Whether you think about it or not, you already have a brand. It is what people say about you when you're not in the room — on and off the pitch. The question is whether you are building it deliberately or letting it happen by accident.",
        facts: [
          "A personal brand is the combination of your talent, personality, values, and reputation — packaged and communicated consistently.",
          "Scouts increasingly Google players and check social media before making decisions. Your digital footprint is part of your scouting report.",
          "Players with strong personal brands attract more opportunities: endorsements, media, coaching roles, and business partnerships after retirement.",
        ],
        warnings: [
          "A brand is damaged much faster than it is built. One controversial social media post can undo years of positive image-building.",
          "A brand built on false claims (fake achievements, inflated stats, fabricated interest from clubs) will collapse and destroy your credibility.",
        ],
        tips: [
          "Define your brand in three words. Example: 'Disciplined. Creative. Zimbabwean.' Every content and action should reflect these words.",
          "Be consistent. The same person on social media should be the same person on the pitch and in interviews.",
          "Start building your brand now — do not wait until you are famous. The platforms reward early, consistent builders.",
        ],
        shona: "Iwe ndibhizinesi — You are the business. Build your brand deliberately or someone else will build it for you.",
        quiz: {
          question: "What is a personal brand made of?",
          options: ["A) Only your performance statistics", "B) Your talent, personality, values, and reputation — communicated consistently", "C) How expensive your clothes are"],
          answer: 1,
        },
      },
      {
        id: "5.2",
        title: "Social Media for Footballers",
        intro: "Social media is the most powerful free tool available to any athlete. Used correctly, it puts your talent in front of scouts worldwide. Used carelessly, it ends careers. This lesson gives you the exact rules to follow.",
        facts: [
          "Instagram and TikTok are the most important platforms for footballers in 2026. Video content consistently outperforms text and photos.",
          "A highlight reel posted on social media has directly led to professional contracts at multiple levels — including in Zimbabwe.",
          "Posting consistently (3-4 times per week) tells the algorithm you are active and rewards you with more reach.",
        ],
        warnings: [
          "Never post: political opinions, inflammatory comments, alcohol or drug references, or complaints about coaches or teammates. Each of these has ended careers.",
          "Never post your exact location in real time. This is a security risk, especially when travelling for away games.",
        ],
        tips: [
          "Create a content calendar: 2× training clips/week, 1× motivational post, 1× personal post showing your character. Consistency beats virality.",
          "Tag your club, sponsors, and Zimbabwe football accounts when posting — this increases reach to people who matter to your career.",
          "Respond to comments professionally. How you interact with followers reflects your character to every scout or sponsor watching.",
        ],
        shona: "Ratidza hunyanzvi hwako — Show your skill. Social media puts your talent in front of people who can change your life.",
        quiz: {
          question: "Which social media platforms are most important for footballers in 2026?",
          options: ["A) Facebook and Twitter only", "B) Instagram and TikTok — especially video content", "C) LinkedIn is the main platform for footballer growth"],
          answer: 1,
        },
      },
      {
        id: "5.3",
        title: "Building Your Online Presence",
        intro: "An online presence is more than social media. It is a searchable, shareable record of your talent and character. Building it correctly means scouts and sponsors can find you and verify who you are.",
        facts: [
          "A GrassRoots Sports profile page (grassrootssports.live) functions as your digital athlete CV — viewable by any scout with internet access.",
          "Highlight videos on YouTube, Grassroots, or TikTok have been the deciding factor in multiple international transfers.",
          "Google yourself regularly. The results are what scouts see first. You want to see positive, career-relevant content.",
        ],
        warnings: [
          "Old embarrassing photos and posts remain on the internet permanently. Search for them and remove what you can, now.",
          "Creating fake accounts or fake engagement (buying followers) destroys credibility when discovered. All credible scouts check engagement ratios.",
        ],
        tips: [
          "Film your training and matches regularly. You do not need professional equipment — a smartphone on a tripod works.",
          "Create highlight reels every 3 months. Short (2-3 minute) videos showing your best moments per position.",
          "Ask coaches and senior players to give you written testimonials. Post them with their permission.",
        ],
        shona: "Gadzira nhau yako — Create your story. Your online presence is the first thing scouts see before they see you play.",
        quiz: {
          question: "How long should a footballer highlight reel ideally be?",
          options: ["A) 30-45 minutes — show everything", "B) 2-3 minutes of your best moments", "C) Length doesn't matter"],
          answer: 1,
        },
      },
      {
        id: "5.4",
        title: "Working With Media",
        intro: "Media — journalists, broadcasters, podcasters — can amplify your brand or damage it. Knowing how to handle media interactions is a professional skill that most footballers never develop. Until now.",
        facts: [
          "Zimbabwean sports media has grown significantly. H-Metro, NewsDay Sports, and multiple YouTube channels regularly cover Division 1 and Premier League football.",
          "Media training is standard at European academies from age 16. Most Zimbabwean players receive none.",
          "A good quote from a confident interview can generate more attention than a good game. Both matter.",
        ],
        warnings: [
          "Anything you say to a journalist is on the record unless you explicitly say 'this is off the record' BEFORE saying it.",
          "Never criticise teammates, coaches, or opposition players in interviews. Even if true, it damages your professional reputation.",
        ],
        tips: [
          "Prepare 2-3 key messages before any interview: something about the team's performance, something about your personal development, something positive about the season.",
          "If asked a question you don't want to answer, it is acceptable to say: 'I'd rather not comment on that — what I will say is...' and redirect.",
          "Practice media interviews with a teammate. Simulate a journalist asking difficult questions. Confidence is built through practice.",
        ],
        shona: "Taura zvine musoro — Speak with wisdom. Media interactions shape your reputation for thousands of people at once.",
        quiz: {
          question: "What is the correct approach when a journalist asks you a question you don't want to answer?",
          options: ["A) Say nothing and walk away", "B) Answer honestly even if it criticises teammates", "C) Politely decline and redirect to a message you want to share"],
          answer: 2,
        },
      },
      {
        id: "5.5",
        title: "Endorsements and Commercial Deals",
        intro: "Endorsements are commercial partnerships where a brand pays you to promote their products. At professional level, these can match or exceed your club salary. Even at lower levels, local endorsements provide meaningful extra income.",
        facts: [
          "Endorsement income for top African footballers regularly exceeds basic club wages. Khama Billiat and Knowledge Musona both had significant commercial deals.",
          "Brands look for: reach (audience size), relevance (does the product fit the footballer's image), resonance (does the audience trust and engage with the player).",
          "Local endorsements in Zimbabwe — boot deals from sports shops, energy drink partnerships, financial services promotions — are achievable for Division 1 players with a social media presence.",
        ],
        warnings: [
          "Endorsing products you don't believe in or have never used damages your audience's trust — which is your most valuable commercial asset.",
          "Understand exclusivity: if you endorse a cola brand, you may be contractually prevented from drinking competitor brands in public.",
        ],
        tips: [
          "Approach brands with a proposal, not just a request. Show: your audience size and engagement rate, why your audience matches their customers, what you are offering (posts, appearances, photos).",
          "Start with brands you genuinely use and can authentically promote. Authentic endorsements convert better and feel better.",
          "All endorsement deals should have written agreements covering: duration, deliverables, payment schedule, exclusivity terms, and termination conditions.",
        ],
        shona: "Bata vatsigiri vanoenderana newe — Partner with brands that match you. Authentic endorsements build wealth and reputation simultaneously.",
        quiz: {
          question: "What three things do brands look for when choosing a player to endorse?",
          options: ["A) Height, weight, and speed", "B) Reach, relevance, and resonance", "C) Number of international caps"],
          answer: 1,
        },
      },
      {
        id: "5.6",
        title: "Protecting Your Reputation",
        intro: "Your reputation is your career. It determines who signs you, who sponsors you, and how people treat you after football. In the social media era, reputation can be built in years and destroyed in minutes. This lesson shows you how to protect it.",
        facts: [
          "Clubs conduct background checks on players' social media and public behaviour before signing them, especially at higher levels.",
          "A player known for being professional, coachable, and positive will always find a club. A talented player with a difficult reputation often won't.",
          "Off-pitch conduct matters as much as on-pitch performance for commercial opportunities. Sponsors want association with positive role models.",
        ],
        warnings: [
          "Gambling publicly is a red flag for clubs and sponsors. Even if legal, visible gambling addiction destroys commercial value.",
          "Public relationship drama — fights, controversies involving family — harms sponsorship and contract renewal negotiations.",
        ],
        tips: [
          "Before posting anything on social media, ask: 'Would I be comfortable if my coach, my sponsor, and my future club all saw this?' If no — don't post it.",
          "Handle mistakes publicly and quickly. An immediate, genuine apology is always less damaging than a delayed or defensive one.",
          "Surround yourself with people who share your values. The company you keep is part of your reputation, whether fair or not.",
        ],
        shona: "Chengeta zita rako — Protect your name. Reputation is the one asset that cannot be bought back once lost.",
        quiz: {
          question: "What question should you ask before posting anything on social media?",
          options: ["A) Will this get lots of likes?", "B) Would I be comfortable if my coach, sponsor, and future club all saw this?", "C) Is this trending today?"],
          answer: 1,
        },
      },
    ],
  },
  {
    id: 6,
    emoji: "🏆",
    title: "Going Professional — The Pathway",
    subtitle: "From grassroots to professional football",
    intro: "Going professional requires more than talent. It requires the right strategy, the right timing, the right people around you, and the right mindset. This final track gives you the complete roadmap from where you are now to a professional contract.",
    color: "from-yellow-600 to-amber-700",
    lessons: [
      {
        id: "6.1",
        title: "The Pathway to Professional Football",
        intro: "There is no single path to professional football. But there are well-worn routes that work, and common mistakes that block progress. This lesson maps the main pathways available to Zimbabwean players.",
        facts: [
          "The most common pathway in Zimbabwe: school team → district selection → provincial team → Division 2 club → Division 1 club → Premier League.",
          "The academy pathway (signing with a Premier League club academy at 14-17) has produced most of Zimbabwe's professional exports.",
          "Direct European pathway: strong social media presence + GrassRoots Sports profile + trial arranged by licensed agent. This route is increasingly viable.",
        ],
        warnings: [
          "Be wary of 'agents' who guarantee European trials for payment. The legitimate pathway involves registered agents who earn only after you sign.",
          "Skipping steps (jumping from Division 3 to a top European club without development stages) almost never works and often sets careers back.",
        ],
        tips: [
          "Make yourself undeniable at every level before moving up. A standout season at Division 2 attracts Division 1 interest. Consistency compounds.",
          "Build relationships at every step. Coaches move clubs. A coach who believes in you is worth more than any agent.",
          "Register with ZIFA as a player and maintain your registration. Unregistered players cannot be officially transferred.",
        ],
        shona: "Famba nhanho nenhanho — Walk step by step. The pathway to professional football rewards patience and consistency.",
        quiz: {
          question: "What is the most common football pathway in Zimbabwe?",
          options: ["A) School team → direct European trial", "B) School team → district → province → Division 2 → Division 1 → Premier League", "C) ZIFA academy → immediate professional contract"],
          answer: 1,
        },
      },
      {
        id: "6.2",
        title: "Trials and How to Prepare",
        intro: "A trial is a job interview for your career. Most players arrive underprepared and underperform. This lesson tells you exactly what clubs are looking for in a trial and how to maximise your chances.",
        facts: [
          "Trial coaches observe: technical quality, physical readiness, mental attitude, communication, and coachability — not just goals and assists.",
          "A player who is fit, communicates, and works hard in a trial is remembered. A talented player who is unfit or difficult to coach is usually not signed.",
          "Most trials last 2-4 weeks. Coaches are typically decided by the end of week 1 — first impressions are decisive.",
        ],
        warnings: [
          "Arrive physically ready. Clubs will not wait for you to get fit during a trial. Arrive in the best shape of your life.",
          "Do not arrive on your own if going abroad. Always travel with a registered agent or a trusted adult. Isolated young players are vulnerable to exploitation.",
        ],
        tips: [
          "Research the club thoroughly before arriving: their system, their squad needs, their style of play. Show you know who they are.",
          "In the first training session, show your strengths clearly but also show your willingness to defend and press — this signals character.",
          "Write a follow-up message to the coach after a trial regardless of outcome. This professionalism is noticed and remembered.",
        ],
        shona: "Gadzirira nguva yomuedzo — Prepare for your trial. Readiness is the difference between a contract and a 'we'll keep in touch.'",
        quiz: {
          question: "By when do trial coaches typically form their main impression of a player?",
          options: ["A) End of the 4-week trial period", "B) End of week 1 — first impressions are decisive", "C) Only after watching match performance"],
          answer: 1,
        },
      },
      {
        id: "6.3",
        title: "Playing Abroad — Opportunities and Risks",
        intro: "Playing abroad is the dream of most Zimbabwean footballers. The reality is more complex — with genuine opportunities but also serious risks. This lesson helps you evaluate foreign opportunities correctly.",
        facts: [
          "South Africa, Zambia, Rwanda, and Tanzania have active professional leagues that regularly sign Zimbabwean players.",
          "COSAFA region transfers (within Southern Africa) are administratively simpler than transfers outside Africa.",
          "European markets most receptive to Zimbabwean players historically: Portugal, Malta, Cyprus, and lower divisions of English football (Zimbabwe passport holders qualify as non-EU but some have dual citizenship).",
        ],
        warnings: [
          "Many 'Europe opportunities' offered to Zimbabwean players are fraudulent. No legitimate European opportunity requires you to pay anything upfront.",
          "Language, culture shock, and isolation derail many players who move abroad unprepared. Mental preparation is as important as technical preparation.",
        ],
        tips: [
          "Research any foreign club's standing in their league before agreeing. Playing in a lower division abroad is not automatically better than Premier League in Zimbabwe.",
          "Consult with players who have been to that specific country or club. Their first-hand experience is invaluable.",
          "Ensure your passport and travel documents are valid and up to date at all times. A missed opportunity due to expired documents is entirely avoidable.",
        ],
        shona: "Enda wakagadzirira — Go prepared. Playing abroad is an opportunity, but only for those who approach it with knowledge.",
        quiz: {
          question: "Which payment should you NEVER make for a foreign football opportunity?",
          options: ["A) Paying for your own passport or visa", "B) Any upfront payment to an agent promising a European trial", "C) Paying for your own flights when a club confirms interest in writing"],
          answer: 1,
        },
      },
      {
        id: "6.4",
        title: "Understanding FIFA Transfer Rules",
        intro: "International transfers are governed by FIFA regulations that protect players, clubs, and agents. Knowing these rules prevents exploitation and ensures your transfers happen correctly.",
        facts: [
          "FIFA's Regulations on the Status and Transfer of Players (RSTP) govern all international transfers.",
          "International Transfer Certificate (ITC): for any player moving between football associations (e.g., Zimbabwe to South Africa), an ITC must be issued by ZIFA before the player can play.",
          "Under FIFA rules, players under 18 can only be transferred internationally in very limited circumstances (family relocation, or within the EU/EEA for EU citizens).",
        ],
        warnings: [
          "Playing for a foreign club without an ITC can result in bans for both the player and the club. Always confirm the ITC before playing.",
          "Clubs that tell you to 'start training and we'll sort the paperwork later' are exposing you to risk. No ITC = you cannot legally play.",
        ],
        tips: [
          "Before signing any international contract, verify with ZIFA that an ITC has been requested from the destination federation.",
          "Keep copies of all transfer documentation. Your transfer history is part of your permanent football record.",
          "Use the FIFA Transfer Matching System (TMS) reference number as proof that your transfer is registered. Any legitimate international transfer has one.",
        ],
        shona: "Chengeta mazwi akanyorwa — Keep written records. FIFA transfer rules protect you, but only if you follow them correctly.",
        quiz: {
          question: "What is an International Transfer Certificate (ITC)?",
          options: ["A) A coaching qualification from FIFA", "B) A document ZIFA must issue before a player can legally play for a foreign club", "C) A FIFA financial grant for developing players"],
          answer: 1,
        },
      },
      {
        id: "6.5",
        title: "Building a Network That Opens Doors",
        intro: "In football, who you know is almost as important as how you play. A strong professional network of coaches, administrators, scouts, and fellow players creates opportunities that talent alone cannot.",
        facts: [
          "Research shows that 70% of professional opportunities come through networks, not open applications or trials.",
          "ZIFA administrators, national team coaching staff, and Premier League coaches are approachable at football events. They remember players who make professional impressions.",
          "Former teammates who progress ahead of you can become the most valuable network connections — they open doors from inside.",
        ],
        warnings: [
          "Networking is not begging. Do not approach coaches and administrators by asking for favours. Offer value, build genuine relationships, then opportunities emerge.",
          "Network broadly. Limiting relationships to people in the same club or province dramatically narrows your opportunities.",
        ],
        tips: [
          "Attend ZIFA workshops, coaching conferences, and football business events even when not required. These spaces are where relationships form.",
          "Follow up with every meaningful contact within 24 hours. A message saying 'it was great to meet you and learn about X' is powerful and rare.",
          "Keep a simple contact list: name, club, role, how you met, last contact date. Review it monthly and stay in touch.",
        ],
        shona: "Vaka hukama — Build relationships. Your network is your net worth in football.",
        quiz: {
          question: "What percentage of professional opportunities in football come through networks?",
          options: ["A) About 15%", "B) Approximately 70%", "C) Under 10% — talent always wins"],
          answer: 1,
        },
      },
      {
        id: "6.6",
        title: "Your First Professional Season",
        intro: "Getting your first professional contract is an achievement. Surviving your first season is the real test. Most players who fail do so not from lack of talent but from failure to adapt to the professional environment. Here is how to thrive.",
        facts: [
          "The step up from amateur to professional football is the biggest adjustment most players ever face — technically, physically, and psychologically.",
          "Professional coaches have zero patience for lack of professionalism: lateness, poor diet, failure to prepare. These are career-ending habits at professional level.",
          "Players who outlast their first contract and earn a second one are statistically far more likely to have long professional careers.",
        ],
        warnings: [
          "Do not assume your performance in your first club carries automatically to a new club. You must re-earn respect at every new place.",
          "Complacency after signing the contract is the most common reason players fail their first professional season. The fight starts again the day after you sign.",
        ],
        tips: [
          "Arrive early to everything — training, meetings, medical appointments. Early is on time. On time is late.",
          "Observe senior players. How do they prepare? How do they behave after a bad game? What do they do differently to the amateurs you played with before?",
          "Set a 90-day performance goal for yourself in your first professional season. Review it honestly at 30, 60, and 90 days.",
        ],
        shona: "Tanga nemoyo wose — Start with your whole heart. The first professional season sets the tone for everything that follows.",
        quiz: {
          question: "What is the most common reason players fail their first professional season?",
          options: ["A) Lack of technical ability", "B) Complacency after signing — forgetting the fight starts again each day", "C) Injuries caused by playing too much"],
          answer: 1,
        },
      },
    ],
  },
];

const LS_KEY = "gs_business_school_progress";

export default function FootballBusinessSchool() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeTrack, setActiveTrack] = useState<number>(0);
  const [openLesson, setOpenLesson] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCompleted(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const markComplete = (lessonId: string) => {
    const next = completed.includes(lessonId)
      ? completed
      : [...completed, lessonId];
    setCompleted(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  };

  const handleQuiz = (lessonId: string, chosen: number, correct: number) => {
    setQuizAnswers((prev) => ({ ...prev, [lessonId]: chosen }));
    if (chosen === correct) {
      markComplete(lessonId);
    }
  };

  const totalLessons = TRACKS.reduce((s, t) => s + t.lessons.length, 0);
  const pct = Math.round((completed.length / totalLessons) * 100);

  const track = TRACKS[activeTrack];

  return (
    <div className="flex min-h-screen bg-[#1a5c2a]">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#f0b429] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#1a3a1a]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Football Business School</h1>
              <p className="text-sm text-green-300">The business education every Zimbabwean footballer needs</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 bg-white/10 rounded-full h-3">
            <div
              className="bg-[#f0b429] h-3 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-green-300">
            <span>{completed.length} of {totalLessons} lessons completed</span>
            <span>{pct}%</span>
          </div>
        </div>

        {/* Track selector */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          {TRACKS.map((t, idx) => {
            const trackDone = t.lessons.filter((l) => completed.includes(l.id)).length;
            const isActive = activeTrack === idx;
            return (
              <button
                key={t.id}
                onClick={() => { setActiveTrack(idx); setOpenLesson(null); }}
                className={`relative rounded-xl p-3 text-left transition-all border-2 ${
                  isActive
                    ? "border-[#f0b429] bg-white/15"
                    : "border-[#f0b429]/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="text-2xl mb-1">{t.emoji}</div>
                <div className="text-white text-xs font-semibold leading-tight">{t.title}</div>
                <div className="text-green-300 text-[10px] mt-1">
                  {trackDone}/{t.lessons.length} done
                </div>
                {trackDone === t.lessons.length && (
                  <Trophy className="absolute top-2 right-2 w-4 h-4 text-[#f0b429]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active track */}
        <div className={`rounded-2xl bg-gradient-to-br ${track.color} p-5 mb-4`}>
          <div className="text-4xl mb-2">{track.emoji}</div>
          <h2 className="text-xl font-bold text-white">{track.title}</h2>
          <p className="text-white/70 text-sm mt-1">{track.subtitle}</p>
          <p className="text-white/90 text-sm mt-3 leading-relaxed">{track.intro}</p>
        </div>

        {/* Lessons accordion */}
        <div className="space-y-2">
          {track.lessons.map((lesson) => {
            const isDone = completed.includes(lesson.id);
            const isOpen = openLesson === lesson.id;
            const quizPicked = quizAnswers[lesson.id];
            const quizCorrect = quizPicked === lesson.quiz.answer;

            return (
              <div
                key={lesson.id}
                className={`rounded-xl border transition-all ${
                  isDone
                    ? "border-green-500/40 bg-green-900/20"
                    : "border-[#f0b429]/10 bg-white/5"
                }`}
              >
                {/* Lesson header */}
                <button
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setOpenLesson(isOpen ? null : lesson.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-xs font-mono bg-white/10 px-2 py-0.5 rounded">
                      {lesson.id}
                    </span>
                    <span className="text-white text-sm font-medium">{lesson.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {isDone && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-green-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-green-300" />
                    )}
                  </div>
                </button>

                {/* Lesson body */}
                {isOpen && (
                  <div className="px-4 pb-5 space-y-4 border-t border-[#f0b429]/10 pt-4">
                    {/* Intro */}
                    <p className="text-white/90 text-sm leading-relaxed">{lesson.intro}</p>

                    {/* Facts */}
                    <div>
                      <h4 className="text-[#f0b429] text-xs font-bold uppercase tracking-wide mb-2">
                        ⚡ Key Facts
                      </h4>
                      <ul className="space-y-1.5">
                        {lesson.facts.map((f, i) => (
                          <li key={i} className="flex gap-2 text-sm text-white/80">
                            <span className="text-[#f0b429] mt-0.5 shrink-0">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Warnings */}
                    <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
                      <h4 className="text-red-400 text-xs font-bold uppercase tracking-wide mb-2">
                        ⚠️ Watch Out
                      </h4>
                      <ul className="space-y-1.5">
                        {lesson.warnings.map((w, i) => (
                          <li key={i} className="text-sm text-red-200/80 flex gap-2">
                            <span className="shrink-0">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3">
                      <h4 className="text-blue-300 text-xs font-bold uppercase tracking-wide mb-2">
                        💡 Action Tips
                      </h4>
                      <ul className="space-y-1.5">
                        {lesson.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-blue-200/80 flex gap-2">
                            <span className="shrink-0">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Shona */}
                    <div className="bg-[#f0b429]/10 border border-[#f0b429]/30 rounded-lg p-3">
                      <span className="text-[#f0b429] text-xs font-bold">🇿🇼 Shona Wisdom</span>
                      <p className="text-white/90 text-sm mt-1 italic">{lesson.shona}</p>
                    </div>

                    {/* Quiz */}
                    <div className="bg-white/5 border border-[#f0b429]/10 rounded-lg p-4">
                      <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#f0b429]" />
                        Quick Check
                      </h4>
                      <p className="text-white/90 text-sm mb-3">{lesson.quiz.question}</p>
                      <div className="space-y-2">
                        {lesson.quiz.options.map((opt, idx) => {
                          const isPicked = quizPicked === idx;
                          const isCorrectOpt = idx === lesson.quiz.answer;
                          let cls =
                            "w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ";
                          if (quizPicked !== undefined) {
                            if (isCorrectOpt) {
                              cls += "border-green-500 bg-green-900/30 text-green-300";
                            } else if (isPicked && !quizCorrect) {
                              cls += "border-red-500 bg-red-900/30 text-red-300";
                            } else {
                              cls += "border-[#f0b429]/10 text-white/50";
                            }
                          } else {
                            cls +=
                              "border-[#f0b429]/20 text-white/80 hover:border-[#f0b429]/60 hover:bg-white/5";
                          }
                          return (
                            <button
                              key={idx}
                              className={cls}
                              disabled={quizPicked !== undefined}
                              onClick={() =>
                                handleQuiz(lesson.id, idx, lesson.quiz.answer)
                              }
                            >
                              <div className="flex items-center gap-2">
                                {quizPicked !== undefined && isCorrectOpt && (
                                  <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                                )}
                                {quizPicked !== undefined && isPicked && !quizCorrect && (
                                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                )}
                                <span>{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {quizPicked !== undefined && (
                        <p
                          className={`mt-3 text-sm font-medium ${
                            quizCorrect ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {quizCorrect
                            ? "Correct! Lesson marked complete."
                            : "Not quite — review the lesson and the correct answer is highlighted above."}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion banner */}
        {completed.length === totalLessons && (
          <div className="mt-6 rounded-2xl bg-gradient-to-r from-[#f0b429] to-amber-500 p-5 text-center">
            <Trophy className="w-10 h-10 mx-auto mb-2 text-[#1a3a1a]" />
            <h3 className="text-[#1a3a1a] font-bold text-lg">
              Football Business School — Graduate!
            </h3>
            <p className="text-[#1a3a1a]/80 text-sm mt-1">
              You have completed all 36 lessons. You now know more about the business of football than 90% of players in Zimbabwe. Use this knowledge.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
