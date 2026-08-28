---
name: Kinetic Command
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363941'
  surface-container-lowest: '#0b0e15'
  surface-container-low: '#191b23'
  surface-container: '#1d2027'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2ec'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#e1e2ec'
  inverse-on-surface: '#2e3038'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#ffb786'
  on-tertiary: '#502400'
  tertiary-container: '#df7412'
  on-tertiary-container: '#461f00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb786'
  on-tertiary-fixed: '#311400'
  on-tertiary-fixed-variant: '#723600'
  background: '#10131a'
  on-background: '#e1e2ec'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-base:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-page: 24px
  panel-padding: 20px
  kpi-height: 80px
---

## Brand & Style
This design system establishes a high-stakes, "Command Center" aesthetic tailored for railway operations and real-time logistics monitoring. The personality is authoritative, precise, and anticipatory, designed to reduce cognitive load during high-pressure decision-making.

The visual style blends **Modern Corporate** structure with **Glassmorphism** and **Tactile** accents. By utilizing deep-layered backgrounds and luminous data points, the UI mimics a physical control deck. High-density information is organized through clear visual hierarchies, ensuring that critical safety data is immediately distinguishable from routine operational telemetry.

## Colors
The palette is engineered for low-light environments to prevent operator fatigue. 
- **Primary (Railway Blue):** Used for navigation, active selections, and standard transit paths.
- **Secondary (AI Pulse):** Reserved exclusively for machine-learning insights and automated routing recommendations.
- **Functional States:** Success, Warning, and Critical colors use high-saturation tones to pierce through the dark background. 
- **Surfaces:** Backgrounds use deep navies to maintain a sense of depth, while containers utilize a slightly lighter charcoal for separation.

## Typography
The system utilizes **Inter** for all UI controls and prose to ensure maximum legibility at varying scales. **JetBrains Mono** is introduced for tabular data, coordinates, and timestamps to prevent character jumping during real-time updates and to emphasize the technical nature of the data. 

Headlines should be used sparingly for major section headers. Most interaction occurs via "Label-caps" for metadata and "Data-mono" for the live telemetry feed.

## Layout & Spacing
The layout follows a **Modular Grid** optimized for 24-inch or larger control monitors. 
- **KPI Strip:** A persistent horizontal bar at the top (80px height) displays vital system health.
- **Main Stage:** A fluid central area for interactive maps or yard diagrams.
- **Side Panels:** Fixed-width (320px-400px) collapsible drawers for manifests and AI recommendations.
- **Density:** High-density spacing (4px/8px increments) allows for maximum information visibility without clutter, utilizing thin 1px dividers to delineate data cells.

## Elevation & Depth
Depth is achieved through **Glassmorphism** rather than traditional shadows. 
- **Base Level:** Deep navy background (#0B0F1A).
- **Surface Level:** Semi-transparent charcoal (#161B2B at 80% opacity) with a 1px inner border of #FFFFFF (10% opacity).
- **Active Overlay:** Use a background blur (12px to 20px) for modals and dropdowns to maintain context of the map underneath.
- **Glow Effects:** Active status indicators and AI recommendations feature a subtle outer glow (4px-8px blur) in their respective functional color to simulate a luminous display.

## Shapes
The shape language is **Soft (0.25rem)**, leaning toward a technical, utilitarian feel. Larger radii are avoided to maximize screen real estate and maintain a professional "instrument cluster" appearance. Buttons and input fields use the standard 4px radius, while larger modular panels may use 8px (rounded-lg) for clear containment.

## Components
- **Buttons:** Primary buttons use solid Railway Blue. AI-driven actions use a gradient stroke (Primary to Secondary) with a subtle pulse animation.
- **Data Tables:** Zebra-striping is avoided; instead, use 1px dividers. Monospaced text is mandatory for all numerical columns. 
- **Status Chips:** High-contrast background with white text. For "Critical" states, the chip should feature a slow-pulse opacity animation (1.0 to 0.7).
- **Interactive Maps:** Custom-styled vector maps with charcoal landmasses and blue/cyan rail lines.
- **KPI Cards:** Large monospaced values with a small sparkline showing the 60-minute trend.
- **Input Fields:** Darker than the panel surface with a high-contrast focus ring (Railway Blue).