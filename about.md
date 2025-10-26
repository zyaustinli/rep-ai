# About Rep

## The Inspiration

Sales is one of the highest-paid professions, yet most sales reps get minimal practice before jumping on real calls with prospects. Athletes practice thousands of hours before game day—why shouldn't salespeople?

We were inspired by a simple realization: **the best way to get better at sales is to practice, but practice partners are expensive, inconsistent, and hard to schedule.** What if AI could be your perfect practice partner—available 24/7, infinitely patient, and able to simulate any buyer persona?

The idea crystallized when we saw the convergence of three technologies:
- Claude's advanced reasoning for realistic role-play
- Real-time voice AI with sub-500ms latency
- LLM-powered performance analysis

We realized we could build something that doesn't just record calls—it **actively makes salespeople better**.

## How We Built It

### Architecture Overview

We built a full-stack platform with three distinct AI pipeline stages:

```
Setup → Practice → Analysis
  ↓        ↓         ↓
Claude   Vapi    Claude
```

**Frontend Stack:**
- **Next.js 14** with React 18 for the web app
- **Tailwind CSS + shadcn/ui** for beautiful, responsive design
- **Vapi Web SDK** for crystal-clear voice conversations
- **Zustand** for lightweight state management

**Backend Stack:**
- **FastAPI (Python)** for async API endpoints
- **Supabase (PostgreSQL)** for data persistence with RLS
- **ChromaDB** for RAG-based hint system
- **Vapi** for voice AI orchestration

### The Three-Stage Pipeline

#### Stage 1: Scenario Generation (Claude)
When users input their product details and target persona, we use **Claude 3.5 Sonnet** to generate hyper-realistic buyer scenarios:

```python
scenario = await claude.messages.create(
    model="claude-3-5-sonnet-20241022",
    messages=[{
        "role": "user",
        "content": f"Generate realistic buyer persona for {product}..."
    }]
)
```

The AI creates:
- Full persona backstory (role, company, pain points)
- 3-5 realistic objections they'll raise
- Hidden information (budget, timeline, competitors)
- Personality traits and communication style

#### Stage 2: Real-Time Conversation (Vapi)
We integrated **Vapi** to handle the entire voice pipeline:
- Speech-to-text (Deepgram Nova-2)
- LLM orchestration (Claude as the buyer)
- Text-to-speech (Azure/ElevenLabs)
- Sub-500ms latency for natural dialogue

```javascript
const vapi = new Vapi(apiKey);
vapi.start(assistantId);

vapi.on('message', (message) => {
    if (message.type === 'transcript') {
        // Real-time transcript updates
        displayTranscript(message);
    }
});
```

#### Stage 3: Performance Analysis (Claude + RAG)
After the call, we run comprehensive analysis:

**Core Analysis:** Claude evaluates 7 skill categories (Discovery, Objection Handling, Rapport Building, etc.) with specific examples and timestamps.

**RAG-Powered Hints:** We built a hint system using ChromaDB that retrieves relevant sales techniques during the call:

```python
# Embed sales best practices
vector_store = chromadb.PersistentClient(path="./chroma_data")
hints_collection = vector_store.get_or_create_collection("sales_hints")

# Retrieve context-aware hints
results = collection.query(
    query_texts=[user_message],
    n_results=3
)
```

The system scores performance on a 0-100 scale per category:

$$\text{Overall Score} = \frac{1}{7}\sum_{i=1}^{7} S_i$$

where $S_i$ represents each skill category score.

## What We Learned

### Technical Breakthroughs

1. **Voice AI is Production-Ready**: Vapi's infrastructure gave us sub-500ms latency without building complex audio pipelines. This was game-changing—natural conversation requires instant responses.

2. **LLMs as Actors**: Claude is shockingly good at roleplay when given detailed personas. The key is in the prompt engineering—we spent days iterating on the system prompt to make buyers feel authentic.

3. **RAG for Real-Time Coaching**: Embedding sales best practices in ChromaDB and retrieving relevant hints during calls was more effective than we expected. The context-aware suggestions feel like having a sales coach in your ear.

4. **WebSocket State Management**: Coordinating real-time transcript updates, audio streaming, and UI state required careful architecture. We learned to separate concerns and use React's concurrent features.

### Product Insights

- **Feedback Must Be Specific**: Generic feedback like "good job" doesn't help. We had to timestamp exact moments and quote conversations to make insights actionable.

- **Difficulty Calibration Is Hard**: Making scenarios progressively harder while keeping them realistic required extensive prompt engineering and testing.

- **Users Want Progress Tracking**: The analytics dashboard became as important as the practice itself. Seeing improvement over time drives engagement.

## Challenges We Faced

### Challenge 1: Audio Latency Battle
**Problem:** Initial experiments with custom WebRTC + OpenAI Realtime API had 1-2 second delays, killing conversation flow.

**Solution:** Switched to Vapi, which handles the entire audio pipeline with optimized edge infrastructure. Latency dropped to <500ms, making conversations feel natural.

### Challenge 2: Transcript Synchronization
**Problem:** Real-time transcripts from Vapi arrived out-of-order, causing UI jumps and confusion.

**Solution:** Implemented event sequencing with timestamps and a reconciliation algorithm:

```python
def reconcile_transcript(events):
    sorted_events = sorted(events, key=lambda x: x['timestamp'])
    deduplicated = remove_duplicates(sorted_events)
    return merge_partial_transcripts(deduplicated)
```

### Challenge 3: Cost Optimization
**Problem:** Running three Claude API calls per session (scenario, conversation, analysis) was expensive (~$2-3 per session).

**Solution:**
- Caching common scenarios (reduced scenario costs by 70%)
- Using Claude Haiku for simple tasks
- Batching analysis requests
- Implementing strict session duration limits

Final cost: **~$1.00-1.85 per 15-min session**

### Challenge 4: Realistic AI Buyers
**Problem:** Early AI buyers were too agreeable and predictable—more like chatbots than real prospects.

**Solution:** Prompt engineering breakthrough—we added:
- Personality constraints ("be skeptical, busy, analytical")
- Objection triggers tied to conversation flow
- Hidden agenda (AI has goals beyond what user sees)
- Natural conversation enders

This made buyers feel genuinely challenging to convince.

### Challenge 5: Actionable Feedback
**Problem:** Initial analysis was too vague: "You did well on discovery."

**Solution:** Structured output with:
- Timestamped examples from transcript
- Specific quote + feedback pairs
- Side-by-side comparison of what was said vs. what could've been said
- Quantified metrics (talk time ratio, questions asked, objections handled)

## What's Next

We're just getting started. Future plans include:
- **Multi-persona calls** (practice with buying committees)
- **Voice cloning** (practice with recordings of real buyers)
- **Team features** (manager dashboards, shared scenario libraries)
- **CRM integration** (import real prospect data)
- **Mobile app** (practice anywhere)

## The Big Lesson

Building AI products is less about the models and more about the **orchestration**. The magic isn't in one API call—it's in chaining multiple AI services together with great UX to create something that feels seamless.

**Rep proves that with the right architecture, AI can be more than a chatbot—it can be a coach, a practice partner, and a path to mastery.**

---

*Built with love and lots of prompt engineering*
