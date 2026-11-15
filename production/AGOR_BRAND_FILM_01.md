# AGOR Brand Film 01 — Production Brief

Status: ready for source-footage intake; not yet rendered.
Target runtime: 100–120 seconds.
Format: 16:9, 1920x1080, 25 fps, Hebrew voiceover and Hebrew subtitles.
Working title: "הטכנולוגיה שנעלמת. האיכות שנשארת."

## Production rules
- Use authentic AGOR footage for every shot that demonstrates the real moving floor, hydraulic system, structure, operation, or service work.
- AI-generated imagery may be used only for architectural mood, establishing shots, abstract transitions, and non-technical atmosphere.
- Never generate or alter engineering details in a way that could be mistaken for actual product operation.
- Use only source videos the user owns or is authorized to reuse.
- Do not call paid generation, voice, or stock APIs without explicit approval. Prefer local/free options where quality is acceptable.
- Verify factual marketing claims (patents, 26 years, load rating, exclusivity, service coverage) before final publication.

## Story and edit map

| Time | Scene | Visual source | Voiceover / on-screen message |
|---|---|---|---|
| 00:00–00:12 | Architectural hook | AI mood shot or licensed pool architecture; no mechanism shown | "יש רגע שבו אדריכלות, מים וטכנולוגיה נפגשים — והטכנולוגיה כמעט נעלמת." |
| 00:12–00:30 | The transformation | REAL AGOR footage: floor moving between positions, wide and close shots | "רצפת הבריכה של AGOR משנה את החלל לפי הצורך. כשהרצפה יורדת אל תוך המים, המנגנון נשאר מוסתר." |
| 00:30–00:45 | Clean waterline | REAL footage: pool after floor descends; show water with no visible cables/arms/accessories if true in source | "בלי כבלים, זרועות או אביזרים גלויים בתוך הבריכה." |
| 00:45–01:02 | Engineering | REAL installation/structure footage, steel posts/anchoring only if clearly shown | "מאחורי המראה הנקי עומדת הנדסה שתוכננה להשתלב במבנה ולשאת את המערכת ביציבות." |
| 01:02–01:15 | Hydraulic system | REAL equipment footage and verified details | "המערכת ההידראולית של AGOR מבוססת מים, ללא שמן הידראולי." |
| 01:15–01:32 | Israeli expertise | REAL factory, manufacturing, team footage; archive only with permission | "פיתוח וייצור בישראל, ניסיון של שנים וידע שנצבר בעבודה בשטח." |
| 01:32–01:48 | Service | REAL service teams, parts, maintenance footage | "ומאחורי המוצר עומדת מעטפת שירות מקומית, עם צוותים מקצועיים וחלקים זמינים בארץ." |
| 01:48–02:00 | Hero close | REAL final pool beauty shot; logo supplied by user | "AGOR. הטכנולוגיה שנעלמת. האיכות שנשארת." |

## Voiceover draft (Hebrew)
יש רגע שבו אדריכלות, מים וטכנולוגיה נפגשים — והטכנולוגיה כמעט נעלמת.

רצפת הבריכה של AGOR משנה את החלל לפי הצורך. כשהרצפה יורדת אל תוך המים, המנגנון נשאר מוסתר.

בלי כבלים, זרועות או אביזרים גלויים בתוך הבריכה.

מאחורי המראה הנקי עומדת הנדסה שתוכננה להשתלב במבנה ולפעול ביציבות.

המערכת ההידראולית של AGOR מבוססת מים, ללא שמן הידראולי.

פיתוח וייצור בישראל, ניסיון של שנים וידע שנצבר בעבודה בשטח.

ומאחורי המוצר עומדת מעטפת שירות מקומית, עם צוותים מקצועיים וחלקים זמינים בארץ.

AGOR. הטכנולוגיה שנעלמת. האיכות שנשארת.

## Required source assets
1. Best full operating sequence: floor up → floor descending → floor fully submerged.
2. Close-up and wide shots showing the pool interior after the floor descends.
3. Engineering/install footage showing supports/anchoring, if available.
4. Hydraulic equipment footage and any substantiation for water-only hydraulic fluid.
5. Factory/manufacturing footage in Israel.
6. Service team, service vehicle, parts inventory, or maintenance footage.
7. Best luxury finished-pool shots.
8. Transparent AGOR logo (SVG or PNG) and any approved brand fonts/colors.

## Toolchain decision
- AGOR Video Studio: project library, source intake, timeline, approvals, final handoff.
- OpenMontage: candidate agent-led production planner and asset/pipeline orchestrator; integrate only after checking its actual tool requirements, provider configuration, license, and local run.
- FFmpeg: deterministic cutting, audio mix, subtitle burn-in, and final MP4 render.
- ComfyUI: optional locally hosted AI mood assets; never for fabricating product mechanics.
- VoiceStudio: evaluate Hebrew TTS quality and local hardware requirements before adoption. Keep voice generation replaceable.
- OpenCut: optional editing UI experiment; not a required dependency for the first film.

## First delivery gates
1. User supplies source assets and confirms reuse rights for any linked YouTube videos.
2. Create a source-footage contact sheet and map clips to the scenes above.
3. Confirm the factual claims and approved logo.
4. Generate/record Hebrew voiceover and approve a short sample.
5. Assemble a rough cut with temporary music and subtitles.
6. Review factual accuracy, audio levels, subtitle readability, and 1080p export before final delivery.
