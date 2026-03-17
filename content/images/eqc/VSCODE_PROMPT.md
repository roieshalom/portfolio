# Prompt for Claude VS Code Extension: Rebuild the EQ Capture portfolio page

## Context
I'm rebuilding the EQ Capture project page on my portfolio site (roiesh.com). The site is plain HTML/CSS/JS hosted on Hostinger via GitHub. The existing page is `eqc-r2-9k4m.html` and currently shows a basic text description with an embedded PDF. I want to replace it with a rich, visual case study page.

## What to do
Replace the content of `eqc-r2-9k4m.html` with a visually rich case study page. Keep the same file name. The page must:
- Use the existing `styles.css`, `nav.js`, `theme.js`, and the same nav bar structure as other pages
- Use Albert Sans font (already loaded site-wide)
- Support both light and dark mode using the existing CSS variable system
- Add any new CSS needed either inline in a `<style>` block or as additions to `styles.css` (your choice, but keep it clean)
- Images will be stored in `content/images/eqc/` (I'll place them there manually)

## Site architecture reference
- Font: Albert Sans (Google Fonts, already in all pages)
- Max width: `--max-width: 840px` (but this page can go wider for full-bleed images)
- Colors: `--color-link: #F21783`, `--color-bg: #fafafa`, `--color-text: #555`, `--color-text-main: #404040`
- Dark mode: `html[data-theme="dark"]` overrides all CSS variables
- Nav: sticky top bar with "Roie Shalom" brand left, links right, hamburger on mobile
- Project body class: `.project-body` for text content
- Section labels: `.section-label` for uppercase pink labels
- Images have `border-radius: 12px` globally

## Page structure and copy

The page should flow as a scrolling case study with alternating text sections and full-width (or near-full-width) image sections. Here's the exact content and layout:

### 1. HERO SECTION
Full-width dark background section (use `--color-text-main` or a dark navy like `#1B2D45`). Should feel bold and confident.

- Small uppercase label: "Case Study"
- Headline: "Cutting building survey time in half by replacing clipboards with a mobile app"
- Meta row: Role: Sole Designer | Company: BuildingMinds | Team: 7 people | Duration: ~1.5 years | Platform: iOS
- Background: subtle use of `hero_surveyor.jpg` on the right side, with low opacity

### 2. ROLE BAR
A light tinted strip with three columns:
- What I did: Field Research, UX/UI Design, Usability Testing, Design System, Product Strategy
- The team: 1 Product Manager, 1 Tech Lead, 4 Developers, and me as the sole designer
- Outcome: Shipped to iOS App Store. Survey time cut by ~50%

### 3. CONTEXT (text section, narrow width)
"BuildingMinds is a Berlin-based proptech company digitizing property management. I co-founded their internal "App Factory," a small team tasked with building complementary mobile products. EQ Capture was our first: an iOS app that lets building surveyors digitize equipment data on the spot, instead of relying on paper, cameras, and spreadsheets."

### 4. THE PROBLEM
Section label: "The Problem"
Heading: "Paper maps, digital cameras, and two backup batteries"

Text:
"To survey a building's equipment, a professional surveyor spends 3 to 4 days walking every floor carrying a paper map, a pen, a digital camera, and two backup batteries. For each item they find, they scribble on the map, photograph the equipment, and stick on a barcode label."

"To remember which room they're in, they take a photo of the paper map with the camera. A digital photo of an analog map. That's the system."

IMAGE: Two-column photo grid using `field_test_rooftop.jpg` and `field_test_tablet.jpg`
Caption: "Surveyors at work: capturing equipment data on rooftops and in technical rooms across Hamburg and Frankfurt."

Text continues:
"Back at the office, it gets worse. I invited Oliver, one of our surveyors, to our workspace and watched him sit at two screens, manually sorting hundreds of photos into rooms. Two days of focused, repetitive work. One mistake could mean traveling back to the building."

Pull quote (styled with a left border accent):
"Total time per building: 4 to 5 days. The end result? An Excel file."

IMAGE: Full-width `spreadsheet_to_platform.jpg`
Caption: "The old workflow ended in a spreadsheet. The new one feeds directly into BuildingMinds' platform."

### 5. DISCOVERY
Section label: "Discovery"
Heading: "Learning through the feet"

Text:
"I could have run this project from a desk in Berlin. Instead, I showed up at buildings with the surveyors. Over roughly 10 building scans, I carried the same floor plans, climbed the same stairs, and built direct relationships with the Westbridge team so they'd trust us with honest feedback."

IMAGE: Full-width `shadowing.jpg`
Caption: "Job shadowing: crawling through hatches, reviewing floor plans, observing the full capture workflow firsthand."

Text:
"My co-founders, Robert and Eddie, had never worked closely with a designer before. I pushed for direct user access not just to inform the design, but to demonstrate what design actually brings to a product team. Not by talking about it, but by bringing back insights that changed what we were building."

IMAGE: Full-width `process_map.jpg`
Caption: "The full 'as-is' process: preparation, on-site data collection, and post-survey consolidation mapped end to end."

### 6. KEY DECISIONS
Section label: "Key Decisions"
Heading: "Three decisions that shaped the product"

DECISION CARD 1 (styled as a card with light background):
Number: "01"
Title: "Killing my own assumption about location"
Text: "I assumed surveyors needed to see their current room on screen at all times. I explored persistent breadcrumbs, sidebars, and overlays. Testing revealed the opposite: surveyors always know where they are. They needed the app to keep up, not remind them."
"Location became a smart default inside the form. The app auto-populated the current room and carried it forward. Less clutter, fewer taps, and a product that felt aware of the workflow."

IMAGE: Full-width `wireframes_location.jpg`
Caption: "Three explored approaches: breadcrumb bar, room-centric overlay, and sidebar tree. None of them shipped."

DECISION CARD 2:
Number: "02"
Title: "Calming down the keyboard"
Text: "The first form copied the field order from the surveyors' Excel sheets. On mobile, this meant constant switching between camera, keyboard, and date picker."
"I regrouped fields by input method instead of data hierarchy. Camera fields together, pickers together, text together. The keyboard stopped bouncing. A small change that smoothed out the entire capture rhythm."

IMAGE: Full-width `form_reorder.jpg`
Caption: "Before and after: fields reordered by input method to reduce constant keyboard/camera switching."

DECISION CARD 3:
Number: "03"
Title: "Turning a meeting room into a building"
Text: "When budget blocked access to real sites, I printed 15 fake equipment sheets, taped them around a meeting room, and ran the capture flow. This scrappy simulation surfaced the keyboard problem and let us test with untrained colleagues, since the app needed to work beyond expert surveyors."

IMAGE: Full-width `usability_printouts.jpg`
Caption: "Printed equipment cards used for in-office usability testing. No building required."

### 7. THE PRODUCT
Section label: "The Product"
Heading: "EQ Capture"

Text: "The app shipped to the iOS App Store. I built a mobile component library adapting BuildingMinds' design language, and kept the core flow simple: pick your building, select a room, and start capturing. Photos, barcodes, and structured data all sync directly to the platform."

IMAGE: Full-width `app_ui.jpg`
Caption: "Final UI: project selection, building navigation, capture form, and BuildingMinds-themed variant."

IMAGE: Two-column grid with `design_system.jpg` and `classification_filter.jpg`
Caption: "Left: Mobile design library. Right: Four explored approaches to filtering 600+ equipment classifications."

### 8. IMPACT STRIP
Dark background section (same dark color as hero). Three columns with big numbers:
- "~50%" / "Reduction in survey time. From 4-5 days down to 2-3 days per building."
- "0 days" / "Of post-survey photo sorting. Images assigned to rooms the moment they're taken."
- "Direct" / "Data flow into BuildingMinds' platform, replacing manual Excel entry entirely."

### 9. REFLECTION
Light gray background section.
Section label: "Looking Back"
Heading: "What I'd carry forward, and what I'd change"

Text:
"The product was sunset due to a partnership change, a business decision outside our team's control. It's still one of the projects I'm proudest of."

"By the end, Robert and Eddie told me this was the first time they understood the value of having a designer on the team. That meant more to me than any metric."

"What I'd do differently: invest earlier in making design's impact visible to leadership. The work spoke for itself within the team, but I learned that great design also needs someone selling its value to the people who decide what lives and what doesn't."

### 10. BACK LINK
Centered link: "← Back to all projects" linking to `work.html`

## Images to place in content/images/eqc/
These are the image files that will exist in the folder. Reference them as `content/images/eqc/[filename]`:
- hero_surveyor.jpg (surveyor on a ladder)
- field_test_rooftop.jpg (surveyor with phone on rooftop)
- field_test_tablet.jpg (surveyor with tablet by red control panel)
- shadowing.jpg (collage of job shadowing photos)
- process_map.jpg (end-to-end journey map)
- spreadsheet_to_platform.jpg (Excel vs BuildingMinds platform)
- wireframes_location.jpg (three wireframe approaches for location)
- form_reorder.jpg (before/after form field order)
- usability_printouts.jpg (printed equipment cards)
- app_ui.jpg (four final app screens)
- design_system.jpg (mobile component library)
- classification_filter.jpg (four filter design explorations)

## Design notes
- The page should feel like a designed portfolio piece, not a blog post
- Use generous whitespace between sections
- Full-bleed (or near-full-bleed, breaking out of 840px) image sections create rhythm and visual variety
- Decision cards should have a subtle background to stand out from regular text
- The impact strip should feel bold (big numbers, dark background, accent color on the numbers)
- Pull quotes use a left border accent (use the pink `--color-link` color)
- Captions are small, muted, italic
- Everything must work in dark mode
- Mobile responsive (single column on small screens, stacked grids)
- Keep the same nav and footer pattern as all other pages on the site
