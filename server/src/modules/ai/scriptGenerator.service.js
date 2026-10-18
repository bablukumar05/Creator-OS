import { LLMGateway } from './llm.gateway.js';

export async function generateScript({
  topic,
  platform = 'youtube',
  niche = 'tech',
  tone = 'high_energy',
  duration = '60s',
  brandSponsor = '',
  valueProps = '',
}) {
  const cleanTopic = topic?.trim() || 'How to 10x your creative output with modern systems';
  const cleanPlatform = platform.toLowerCase();

  const systemPrompt = `You are an elite YouTube and Short-Form content strategist and viral scriptwriter for top creators.
Generate a structured JSON response with high-retention hooks, visual pacing, and compelling storytelling.
Format JSON:
{
  "titleVariations": [ { "title": "...", "score": 94, "strategy": "..." } ],
  "viralHooks": [ { "hookNumber": 1, "visualCue": "...", "spokenAudio": "...", "retentionScore": 96 } ],
  "fullScript": [
    {
      "sectionName": "...",
      "timestamp": "00:00 - 00:15",
      "visualDirection": "...",
      "spokenAudio": "..."
    }
  ],
  "seoMetadata": {
    "description": "...",
    "hashtags": ["...", "..."],
    "targetAudience": "..."
  }
}`;

  const userPrompt = `Topic: ${cleanTopic}
Platform: ${cleanPlatform}
Niche: ${niche}
Tone: ${tone}
Duration: ${duration}
Brand Sponsor: ${brandSponsor || 'None'}
Value Props: ${valueProps || 'Key creator benefits'}`;

  const liveResult = await LLMGateway.complete({
    systemPrompt,
    userPrompt,
    temperature: 0.3,
    jsonMode: true,
  });

  if (liveResult && Array.isArray(liveResult.fullScript) && liveResult.fullScript.length > 0) {
    return liveResult;
  }

  const isShortForm = duration === '30s' || duration === '60s' || cleanPlatform === 'instagram' || cleanPlatform === 'tiktok';

  const defaultTitles = [
    {
      title: `Why 99% of People Fail at ${cleanTopic} (And How to Fix It)`,
      score: 95,
      strategy: 'Negativity bias + clear promise of a solution',
    },
    {
      title: `I Tested ${cleanTopic} for 30 Days — Here Is What Happened`,
      score: 92,
      strategy: 'High curiosity loop + authentic experiment format',
    },
    {
      title: `The 3-Step Formula to Master ${cleanTopic} in 2026`,
      score: 88,
      strategy: 'Direct actionable framework + timeliness',
    },
  ];

  const defaultHooks = [
    {
      hookNumber: 1,
      visualCue: 'Fast push-in camera move, text overlay popping with audio sfx, creator holding up a visual artifact.',
      spokenAudio: `Stop doing ${cleanTopic.toLowerCase()} the old way. In the next 60 seconds, I will show you the exact system that changed everything.`,
      retentionScore: 96,
    },
    {
      hookNumber: 2,
      visualCue: 'Split screen showing the disastrous mistake on left vs clean modern solution on right.',
      spokenAudio: `If you are still struggling with ${cleanTopic.toLowerCase()}, you are making this one critical mistake without even knowing it.`,
      retentionScore: 93,
    },
    {
      hookNumber: 3,
      visualCue: 'Immediate B-roll action cut with bold contrast subtitles centered on screen.',
      spokenAudio: `Nobody talks about this, but the difference between average creators and the top 1% comes down to this single rule.`,
      retentionScore: 91,
    },
  ];

  const defaultSections = isShortForm
    ? [
        {
          sectionName: 'Hook & Pattern Interrupt',
          timestamp: '00:00 - 00:06',
          visualDirection: 'Direct to camera, high energy, kinetic typography highlighting key pain point.',
          spokenAudio: `If you are still doing ${cleanTopic.toLowerCase()} manually, you are wasting at least 10 hours every single week.`,
        },
        {
          sectionName: 'The Problem & Stakes',
          timestamp: '00:06 - 00:20',
          visualDirection: 'Screen recording showing bloated messy workflow, red X overlay.',
          spokenAudio: 'Most people think you need more tools or more hustle. But all it really does is burn you out and hurt your quality.',
        },
        ...(brandSponsor
          ? [
              {
                sectionName: 'Integrated Sponsor Solution',
                timestamp: '00:20 - 00:35',
                visualDirection: `Seamless cut showing ${brandSponsor} dashboard in action with fast smooth cursor interaction.`,
                spokenAudio: `That is why I switched to ${brandSponsor}. It handles the heavy lifting automatically, so you can focus purely on creating.`,
              },
            ]
          : [
              {
                sectionName: 'The Core Insight',
                timestamp: '00:20 - 00:38',
                visualDirection: 'Clean diagram illustration showing the 3-pillar breakdown step by step.',
                spokenAudio: 'Here is the rule: automate repetitive inputs, streamline feedback into one place, and execute in focused sprints.',
              },
            ]),
        {
          sectionName: 'Actionable Takeaway & CTA',
          timestamp: isShortForm ? '00:38 - 00:58' : '00:35 - 00:55',
          visualDirection: 'Creator back on camera, animated arrow pointing down to link in caption or bio.',
          spokenAudio: `Save this post right now so you don't lose it, and drop a comment below with your biggest bottleneck!`,
        },
      ]
    : [
        {
          sectionName: 'Hook & The Big Promise',
          timestamp: '00:00 - 00:45',
          visualDirection: 'High production cinematic B-roll, fast-paced montage setting up the premise, dramatic background score.',
          spokenAudio: `Over the past year, I completely overhauled how I approach ${cleanTopic.toLowerCase()}. The result? Tripled output and half the stress. Here is the entire playbook.`,
        },
        {
          sectionName: 'Chapter 1: The Trap of Complexity',
          timestamp: '00:45 - 03:00',
          visualDirection: 'Case study breakdown on tablet, highlighted graphs showing inefficiency vs clean growth.',
          spokenAudio: 'When I first started, I thought adding more layers would make me better. Instead, it created bottlenecks at every stage of production.',
        },
        ...(brandSponsor
          ? [
              {
                sectionName: `Sponsor Integration: ${brandSponsor}`,
                timestamp: '03:00 - 04:30',
                visualDirection: `Natural contextual transition: creator opens ${brandSponsor} on desktop, walks through 2 genuine favorite features.`,
                spokenAudio: `Big shoutout to ${brandSponsor} for making today's video possible. If you need a reliable platform for ${valueProps || 'streamlining your workflow'}, check the link below for a special discount.`,
              },
            ]
          : []),
        {
          sectionName: 'Chapter 2: The Step-by-Step Execution',
          timestamp: brandSponsor ? '04:30 - 07:45' : '03:00 - 06:30',
          visualDirection: 'Over-the-shoulder practical tutorial with numbered title cards on screen.',
          spokenAudio: 'Step one: audit your current hours. Step two: eliminate low-leverage tasks. Step three: lock in repeatable templates.',
        },
        {
          sectionName: 'Conclusion & Next Action',
          timestamp: brandSponsor ? '07:45 - 09:15' : '06:30 - 08:00',
          visualDirection: 'End screen graphic with card for next video recommendation and subscriber button.',
          spokenAudio: 'If this helped you out, hit subscribe and check out this next video where I break down the exact rate card formula I use.',
        },
      ];

  return {
    titleVariations: defaultTitles,
    viralHooks: defaultHooks,
    fullScript: defaultSections,
    seoMetadata: {
      description: `In this video, we break down the definitive blueprint for ${cleanTopic}. From core frameworks to daily workflows, learn how top creators maximize results.\n\n🔗 Links & Resources mentioned:\n${brandSponsor ? `Special offer from ${brandSponsor}: https://creatoros.me/deals/${brandSponsor.toLowerCase()}\n` : ''}Subscribe for more weekly in-depth creative strategies!`,
      hashtags: [`#${niche}`, `#${cleanPlatform}`, `#creatorguide`, `#productivity`, `#${cleanTopic.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15)}`],
      targetAudience: `Independent creators, digital entrepreneurs, and video editors looking to level up their ${niche} content.`,
    },
  };
}
