# Lettercape brand kit

User selected Lettercape on 2026-10-01. Repository stays `PrabalParihar/mailtrain`. `lettercape.com` was researched as available by the naming task; it is not purchased or configured. Domain ownership and appropriate brand clearance remain launch evidence.

Positioning: an editorial workspace for thoughtful, permission-based email. The complete product tagline is **On-brand emails, from draft to send.** Until delivery gates pass, the UI descriptor is **On-brand emails, ready for review.**

## Identity

Selectable Inter Semibold wordmark; −0.02em Latin letter spacing. Folded letter geometric mark on a 32-unit grid. No checkmark, sparkle mascot, envelope notification badge or claim of successful sending in the mark. Minimum symbol 20px; favicon uses a simplified 32px tile. Clear space is ¼ symbol height. Do not stretch, rotate, bevel or put the lockup over a busy email canvas.

Assets: `public/brand/lettercape-mark.svg`, `lettercape-mark-reverse.svg`, `lettercape-wordmark.svg`, `lettercape-wordmark-reverse.svg`; favicon `src/app/icon.svg`. UI identity is centralized in `src/config/product.ts`; CSS tokens are in `src/app/globals.css`.

## Design tokens

| Role | Value | Usage |
|---|---|---|
| Canvas | #F7F6F2 | Warm off-white app surface |
| Ink | #162B30 | Dark navy/teal text and mark |
| Primary | #0B625D | Teal action with white label; 7.19:1 contrast |
| Primary hover | #084E4A | Pressed/hover action |
| Secondary | #52656A | Supporting text; 5.66:1 on canvas |
| Selection | #E5F3EF | Outline plus fill for selected state |
| Accent | #ECA785 | Warm clay decoration; ink label only |
| Control | #7B8C90 | Essential boundaries |
| Focus | #2457D6 | 3px ring with 2px offset |
| Surface | #FFFFFF | Cards and inspector |

Typography: Inter 400/500/600 for UI, system/script appropriate fallbacks. Page 28/36, section 20/28, body 16/24, UI 14/20, supporting metadata 12/18. Latin display serif is an editorial accent for public headings, not customer email typography. Licensed local Inter distribution (SIL OFL) and Lucide (ISC) are recorded in `docs/LICENSES.md`.

Spacing scale: 2,4,8,12,16,20,24,32,40,48,64px. Desktop padding 32, tablet 24, phone 16. Controls 44px; compact desktop toolbar 36px. Radii: 4 badge,8 control,12 card,16 dialog. No customer email recoloring to match Lettercape chrome.

Keyboard Outline controls replace drag-only interactions. Status always includes a label and never relies on color alone. Reduced motion removes transform transitions. Phone reflows forms and navigation; complex source editing remains a larger-screen task. Full WCAG 2.2 AA certification requires process and manual assistive-technology evidence beyond this token palette.

## Voice

Calm, concrete, candid. “Saved v8”, “Exported draft”, “Checks incomplete”, “Accepted by provider”, “Outcome unknown”. Do not say “Delivered” for provider acceptance. No invented customer logos, testimonials, uptime, success rates, subscriber counts, SOC 2 claims or guaranteed inbox placement.

Dark/reverse assets are for dark branding surfaces. App dark mode remains a separate unimplemented verified theme; email dark-mode real-client evidence remains required.
