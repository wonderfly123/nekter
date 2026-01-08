# Nekter Marketing Website Design

**Date**: 2026-01-07
**Status**: Approved

## Overview

Single-page marketing landing site for Nekter, deployed to `nekter.io`. Separate from the dashboard codebase, same tech stack.

## Goals

1. **Lead generation** - Drive signups via demo.nekter.io
2. **Product showcase** - Explain what Nekter does clearly
3. **Credibility** - Build trust with clear value proposition

## Design Decisions

- **Format**: Single-page landing (no multi-page navigation)
- **CTA**: All buttons link to `demo.nekter.io`
- **Tone**: Friendly, approachable, conversational
- **Visual**: Evolved brand - orange/amber but more polished, more whitespace
- **Imagery**: Abstract/gradient hero, icons for features (no screenshots)

---

## Page Sections

### 1. Sticky Header

- Left: Nekter logo (droplet icon + wordmark)
- Right: "Try Demo" button (secondary style)
- Transparent at top, white background on scroll

### 2. Hero

**Background**: Gradient mesh from amber-500 to orange-600 with subtle animated elements

**Content** (centered):
- Logo + "Nekter" wordmark
- Headline: "Customer Success That Actually Succeeds"
- Subheadline: "Stop guessing which accounts need attention. Nekter watches the signals you can't—sentiment shifts, engagement drops, expansion moments—and tells you exactly where to focus."
- Primary CTA: "Try the Demo" → demo.nekter.io
- Small text: "No credit card required"

### 3. Problem/Pain

**Background**: Light gray (gray-50)

**Header**: "Sound familiar?"

**Three pain points**:
1. AlertTriangle icon: "You find out a customer is unhappy... after they've already churned."
2. Search icon: "You're buried in dashboards but still don't know which accounts actually need you."
3. Clock icon: "By the time you spot a problem, it's too late to fix it."

**Transition**: "What if you could see it coming?"

### 4. Features

**Background**: White

**Header**: "Everything you need to protect and grow your accounts"

**Four feature cards** (2x2 grid):

1. **Portfolio Health Dashboard**
   - Icon: LayoutDashboard (blue)
   - "See your entire portfolio at a glance"
   - "Health scores combine engagement, sentiment, support metrics, and activity into one clear view. Know instantly which accounts are thriving and which need attention."

2. **Churn Risk Detection**
   - Icon: ShieldAlert (red)
   - "Catch warning signs before it's too late"
   - "AI analyzes call transcripts, emails, and tickets to surface churn signals—sentiment drops, competitor mentions, frustration patterns—so you can act fast."

3. **Expansion Opportunities**
   - Icon: TrendingUp (green)
   - "Spot growth moments automatically"
   - "Know when customers mention needing more seats, new features, or additional services. Never miss an upsell because it was buried in a call."

4. **Barry, Your AI Assistant**
   - Icon: Sparkles (purple)
   - "Ask anything about any account"
   - "Need to know what Acme said about pricing last month? Just ask Barry. Get instant, evidence-backed answers from all your customer interactions."

### 5. How It Works

**Background**: Light gray (gray-50)

**Header**: "Up and running in minutes"

**Three steps** (horizontal with connecting line):

1. **Connect your tools** (Link icon)
   "Sync your CRM, call recordings, support tickets, and email. We pull in the data you already have."

2. **AI does the work** (Cpu icon)
   "Nekter analyzes every interaction, scores account health, and surfaces what matters—automatically."

3. **Focus where it counts** (Target icon)
   "Start each day knowing exactly which accounts need attention and why. No more guessing."

### 6. FAQ

**Background**: White

**Header**: "Questions? We've got answers."

**Questions** (accordion style):

1. **What is Nekter?**
   "Nekter is a customer success intelligence platform that helps you retain and grow accounts. It analyzes your customer interactions—calls, emails, tickets—to surface health risks and expansion opportunities before you'd otherwise notice them."

2. **Who is Nekter for?**
   "Customer success teams, account managers, and revenue leaders at B2B SaaS companies who want to be proactive instead of reactive."

3. **How does the AI work?**
   "We use AI to analyze sentiment, detect churn signals, and identify expansion mentions in your call transcripts and communications. Barry, our AI assistant, lets you ask natural questions about any account."

4. **What integrations do you support?**
   "We currently integrate with Salesforce, call recording platforms, and support tools. More integrations coming soon."

5. **Is there a free trial?**
   "Yes! You can explore the demo environment to see how Nekter works before committing."

6. **How much does it cost?**
   "We offer flexible pricing based on your team size and needs. Reach out for a custom quote."

### 7. Final CTA

**Background**: Orange/amber gradient (bookend with hero)

**Content** (centered):
- Headline: "Ready to stop guessing?"
- Subheadline: "See which accounts need you—before it's too late."
- Primary CTA: "Try the Demo" (white button, inverted colors)

### 8. Footer

**Background**: Dark gray (gray-900)

**Content** (single row):
- Left: Nekter logo + "© 2025 Nekter"
- Right: Link to demo, contact email

---

## Technical Architecture

### Project Location

`/Users/jordan/nekter/website` (sibling to `dashboard`)

### Tech Stack

- Next.js 16 with App Router
- TypeScript
- Tailwind CSS 4 with @tailwindcss/postcss
- Lucide React for icons

### File Structure

```
website/
├── app/
│   ├── layout.tsx      # Root layout with fonts, metadata
│   ├── page.tsx        # Single landing page with all sections
│   └── globals.css     # Tailwind imports + brand colors
├── components/
│   ├── Header.tsx      # Sticky nav
│   ├── Hero.tsx
│   ├── Problem.tsx
│   ├── Features.tsx
│   ├── HowItWorks.tsx
│   ├── FAQ.tsx
│   └── Footer.tsx      # Includes final CTA
├── public/
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── next.config.ts
```

### Dependencies

```json
{
  "dependencies": {
    "next": "16.1.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "lucide-react": "^0.562.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Deployment

Separate Vercel project pointing to `website/` folder, deployed to `nekter.io`.

---

## Implementation Notes

- All CTA buttons link to `demo.nekter.io`
- Mobile-responsive (sections stack vertically)
- Smooth scroll between sections
- Sticky header appears on scroll
- FAQ can be simple expanded view (no accordion needed for v1)
