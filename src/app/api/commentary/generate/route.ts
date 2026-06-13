import { NextResponse } from "next/server";

export interface LiveMatchPacket {
  minute: string | number;
  playerName: string;
  teamName: string;
  eventType: "GOAL" | "DRIBBLE" | "TACKLE" | "OFFSIDE" | "FREEKICK" | "DANGEROUS_ATTACK";
  language: "en" | "shona" | "ndebele" | "zulu" | "tswana";
}

export async function POST(req: Request) {
  try {
    const body: LiveMatchPacket = await req.json();
    const { minute, playerName, teamName, eventType, language } = body;

    // 1. Configure System Rules tailored to keep DeepSeek aligned to the sports theme
    const systemPrompt = `
      You are an electric, hilarious, and wildly biased live match day stadium commentator for Grassroots Sports. 
      Your style is a dynamic mix of 60% English and 40% local street slang. You must use humor, hype up players, and SHOUT during massive moments.

      CRITICAL FORMATTING FOR VOICE EMOTION:
      - For massive or chaotic moments (GOAL, BAD TACKLE, DRIBBLE), you MUST use capitalized text, elongated words (e.g., GOOOOAL), and emotional tags like "[screaming]", "[laughing]", or "[gasp]" because the ElevenLabs Text-to-Speech engine uses these to physically yell, change pitch, and express high adrenaline.
      - Keep it punchy, funny, and full of local touchline banter. Keep core technical terms in English (overlap, offside, clean sheet).

      MATCH EVENT RULES:
      1. GOAL: Drop a massive, prolonged shout. (e.g., "[screaming] GOOOOAAAL!!! LADYUUUMA!!! Oh my goodness, defense yacho yakarara!! They are cooked!")
      2. DRIBBLE / SKILL: Hype up the player intensely with humor. (e.g., "Look at \${playerName} treating defenders like training cones! One shibobo, two shibobo! Pakaipa, he is dancing on the ball!")
      3. TACKLE: Make it sound aggressive or funny. (e.g., "Ouch! \${playerName} just went in with a textbook luggage-and-clearance tackle! Heavy machinery yabaya ipapo, clear out!")
      4. OFFSIDE: Use a funny, mocking tone. (e.g., "[laughing] Ah, flag is up! \${playerName} was basically camping in the keeper's box. My guy, check your mirrors next time, offside!")
      5. FREEKICK / DANGEROUS_ATTACK: Build extreme tension. (e.g., "[gasp] Danger zone! Set piece position cleanly won by \${teamName}. The wall is shaking, tension iri mberi!")
      
      SPECIFIC DIALECT MIXING DIRECTIONS:
      - 'shona': Blend English with modern urban ghetto Shona slang (zvakavhara, pakaipa, kuitisa, kurova gap, mamhepo).
      - 'ndebele' / 'zulu': Blend English with modern Kasi/Tsotsitaal street lingo (laduma, shibobo, isgubu, ba-presser, ku-rough, i-target).
      - 'tswana': Blend English with urban street Pitori slang expressions.
      - 'en': Energetic, funny, hype British/African-English football commentary style.
    `;

    const userPrompt = `
      Generate a short, single-paragraph live match comment using this telemetry data:
      - Current Match Minute: ${minute}
      - Active Player/Action Focus: ${playerName}
      - Active Team: ${teamName}
      - Event Type: ${eventType}
      
      Target Slang Dialect: ${language}
      Make it match accurate live action, highly entertaining, funny, and incredibly hype!
    `;

    // 2. Swapped endpoint directly to DeepSeek API Integration Layout
    const textResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // DeepSeek-V3 Engine
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 150
      }),
    });

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      throw new Error(`DeepSeek API error status ${textResponse.status}: ${errorText}`);
    }

    const textData = await textResponse.json();
    const generatedScript = textData.choices[0].message.content;

    // 3. Send DeepSeek script into ElevenLabs' high-expressive v3 engine
    const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "pNInz6obpgmo5CgYgMDI"; 
    
    const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: generatedScript,
        model_id: "eleven_v3", 
        voice_settings: {
          stability: 0.38,       // Low stability values allow voice breaking and screaming options
          similarity_boost: 0.85,
          style: 0.25,            // Higher expressive stylization
          use_speaker_boost: true
        }
      })
    });

    if (!ttsResponse.ok) {
      throw new Error(`ElevenLabs audio generation error: ${ttsResponse.status}`);
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      success: true,
      script: generatedScript,
      audio: `data:audio/mpeg;base64,${base64Audio}`
    });

  } catch (error) {
    console.error("Slang match day broadcast engine failure:", error);
    return NextResponse.json({ error: "Broadcaster system offline" }, { status: 500 });
  }
}