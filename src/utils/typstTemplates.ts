import { CartridgeSpec, ReamerSpec } from '../types/cartridge';

/**
 * Generates Typst source code for an industrial Chamber Reamer Order Requisition Sheet,
 * formatted for tooling manufacturers such as Pacific Tool & Gauge (PTG), Manson Precision, and JGS Precision.
 */
export function generateReamerTypst(cartridge: CartridgeSpec, reamer: ReamerSpec, manufacturer: string = 'General Toolmaker'): string {
  const designer = cartridge.designer || 'Custom Wildcatting Dept.';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
#set page(
  paper: "us-letter",
  flipped: false,
  margin: (x: 1.5cm, y: 1.5cm),
  header: align(right)[
    #text(size: 8pt, fill: rgb("#64748b"))[Wildcat Studio Tooling Requisition | ${cartridge.name}]
  ],
  footer: locate(loc => {
    let page_number = counter(page).at(loc).first()
    let total_pages = counter(page).final(loc).first()
    align(center)[
      #text(size: 8pt, fill: rgb("#64748b"))[Page #page_number of #total_pages — Wildcat Studio Engineering Suite]
    ]
  })
)

#set text(font: "Helvetica", size: 9pt, fill: rgb("#0f172a"))

// Title Header Block
#rect(
  width: 100%,
  stroke: rgb("#cbd5e1"),
  radius: 4pt,
  fill: rgb("#f8fafc"),
  inset: 12pt
)[
  #grid(
    columns: (1fr, auto),
    [
      #text(size: 16pt, weight: "bold", fill: rgb("#1e3a8a"))[CHAMBER REAMER SPECIFICATION & ORDER]
      #v(2pt)
      #text(size: 10pt, weight: "medium", fill: rgb("#475569"))[Toolmaker Requisition Sheet | ${manufacturer}]
    ],
    [
      #text(size: 9pt, weight: "bold")[Date:] #text(size: 9pt)[${dateStr}] \\
      #text(size: 9pt, weight: "bold")[Standard:] #text(size: 9pt)[${cartridge.standard}]
    ]
  )
]

#v(10pt)

// Cartridge & Toolmaker Metadata
#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  [
    #block(stroke: rgb("#e2e8f0"), inset: 8pt, radius: 4pt, width: 100%)[
      #text(weight: "bold", size: 10pt, fill: rgb("#1e293b"))[Cartridge Identification]
      #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
      #v(4pt)
      *Name:* ${cartridge.name} \\
      *Category:* ${cartridge.category} \\
      *Parent Case:* ${cartridge.parent_case || "Proprietary / Scratch"} \\
      *Designer:* ${designer} \\
      *Max Pressure:* ${cartridge.max_pressure_bar} bar (${Math.round(cartridge.max_pressure_bar * 14.5038)} PSI)
    ]
  ],
  [
    #block(stroke: rgb("#e2e8f0"), inset: 8pt, radius: 4pt, width: 100%)[
      #text(weight: "bold", size: 10pt, fill: rgb("#1e293b"))[Tooling Order Preferences]
      #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
      #v(4pt)
      *Reamer Type:* Finisher Reamer (Standard HSS / Carbide Option) \\
      *Pilot Type:* Live Bushing Pilot (Precision Ground) \\
      *Drive Shank:* Standard Toolroom 7/16"-24 / Weldon Flat \\
      *Tolerance Class:* Class AAA Toolroom Precision Ground \\
      *Target Manufacturer:* ${manufacturer}
    ]
  ]
)

#v(12pt)

== Toolroom Reamer Dimensions (Imperial & Metric)

#table(
  columns: (2.2fr, 1fr, 1fr, 1fr, 2.5fr),
  stroke: (x, y) => if y == 0 { (bottom: 1.5pt + rgb("#1e3a8a")) } else { 0.5pt + rgb("#e2e8f0") },
  fill: (col, row) => if row == 0 { rgb("#eff6ff") } else if calc.even(row) { rgb("#f8fafc") } else { none },
  inset: (x: 6pt, y: 6pt),
  [*Chamber / Reamer Station*], [*Symbol*], [*Inches (in)*], [*Metric (mm)*], [*Toolmaker Notes*],
  
  [Pilot Diameter (Live Bushing)], [D_pilot], [${reamer.pilot_diameter.toFixed(4)}"], [${(reamer.pilot_diameter * 25.4).toFixed(3)} mm], [Nominal bore bore/groove ride],
  [Chamber Rim Diameter], [R1_ch], [${reamer.chamber_rim_dia.toFixed(4)}"], [${(reamer.chamber_rim_dia * 25.4).toFixed(3)} mm], [Clearance fit over cartridge rim],
  [Rim / Belt Recess Depth], [t_ch], [${reamer.chamber_rim_depth.toFixed(4)}"], [${(reamer.chamber_rim_depth * 25.4).toFixed(3)} mm], [Nominal headspace depth control],
  [Chamber Base Diameter], [P1_ch], [${reamer.chamber_base_dia.toFixed(4)}"], [${(reamer.chamber_base_dia * 25.4).toFixed(3)} mm], [0.200" forward of breech face],
  [Chamber Shoulder Diameter], [P2_ch], [${reamer.chamber_shoulder_dia.toFixed(4)}"], [${(reamer.chamber_shoulder_dia * 25.4).toFixed(3)} mm], [Shoulder body junction],
  [Chamber Neck Diameter], [H1/H2_ch], [${reamer.chamber_neck_dia.toFixed(4)}"], [${(reamer.chamber_neck_dia * 25.4).toFixed(3)} mm], [Radial case release clearance],
  [Chamber Body Length], [L1_ch], [${cartridge.body_length.toFixed(4)}"], [${(cartridge.body_length * 25.4).toFixed(3)} mm], [Breech to shoulder datum junction],
  [Chamber Total Case Length], [L3_ch], [${reamer.chamber_length.toFixed(4)}"], [${(reamer.chamber_length * 25.4).toFixed(3)} mm], [Breech to chamber case mouth stop],
  [Freebore (Throat) Diameter], [G1_throat], [${reamer.freebore_dia.toFixed(4)}"], [${(reamer.freebore_dia * 25.4).toFixed(3)} mm], [Bullet diameter + 0.0005" ride],
  [Freebore (Throat) Length], [L_freebore], [${reamer.freebore_length.toFixed(4)}"], [${(reamer.freebore_length * 25.4).toFixed(3)} mm], [Parallel cylindrical bullet throat],
  [Leade / Forcing Cone Angle], [beta_leade], [${reamer.leade_angle_deg.toFixed(2)} deg], [${reamer.leade_angle_deg.toFixed(2)} deg], [Half-angle transition to rifling]
)

#v(12pt)

== Cartridge Comparison Reference
#table(
  columns: (1.5fr, 1.2fr, 1.2fr, 1.2fr),
  stroke: 0.5pt + rgb("#e2e8f0"),
  fill: (col, row) => if row == 0 { rgb("#f1f5f9") } else { none },
  inset: 6pt,
  [*Critical Feature*], [*Cartridge Max*], [*Chamber Reamer*], [*Total Diametral Clearance*],
  [Base (P1)], [${cartridge.base_diameter.toFixed(4)}"], [${reamer.chamber_base_dia.toFixed(4)}"], [${((reamer.chamber_base_dia - cartridge.base_diameter) * 1000).toFixed(1)} thou],
  [Shoulder (P2)], [${cartridge.shoulder_start_diameter.toFixed(4)}"], [${reamer.chamber_shoulder_dia.toFixed(4)}"], [${((reamer.chamber_shoulder_dia - cartridge.shoulder_start_diameter) * 1000).toFixed(1)} thou],
  [Neck Mouth (H2)], [${cartridge.neck_diameter_mouth.toFixed(4)}"], [${reamer.chamber_neck_dia.toFixed(4)}"], [${((reamer.chamber_neck_dia - cartridge.neck_diameter_mouth) * 1000).toFixed(1)} thou],
  [Case Length (L3)], [${cartridge.case_length.toFixed(4)}"], [${reamer.chamber_length.toFixed(4)}"], [${((reamer.chamber_length - cartridge.case_length) * 1000).toFixed(1)} thou trim buffer]
)

#v(14pt)

#block(
  fill: rgb("#fefce8"),
  stroke: rgb("#fde047"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  #text(weight: "bold", fill: rgb("#854d0e"))[Machining & Gunsmithing Instructions:] \\
  #text(size: 8.5pt, fill: rgb("#713f12"))[
    1. Grind all reamer cutting flutes with spiral relief to ensure chip evacuation during barrel chambering. \\
    2. Pilot must accept interchangeable floating bushings sized in 0.0002" increments. \\
    3. Chamber depth must be headspaced using Go / No-Go gauges referenced to datum diameter: ${cartridge.shoulder_start_diameter.toFixed(3)}".
  ]
]
`;
}

/**
 * Generates Typst source code for a Case Forming & Fireforming Engineering Report.
 */
export function generateFormingTypst(cartridge: CartridgeSpec, parentCase: CartridgeSpec, steps: string[]): string {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `
#set page(
  paper: "us-letter",
  margin: (x: 1.5cm, y: 1.5cm),
  header: align(right)[
    #text(size: 8pt, fill: rgb("#64748b"))[Case Forming Schedule | ${cartridge.name}]
  ],
  footer: locate(loc => {
    let page_number = counter(page).at(loc).first()
    let total_pages = counter(page).final(loc).first()
    align(center)[
      #text(size: 8pt, fill: rgb("#64748b"))[Page #page_number of #total_pages — Wildcat Studio Engineering Suite]
    ]
  })
)

#set text(font: "Helvetica", size: 9pt, fill: rgb("#0f172a"))

#rect(
  width: 100%,
  stroke: rgb("#cbd5e1"),
  radius: 4pt,
  fill: rgb("#f8fafc"),
  inset: 12pt
)[
  #grid(
    columns: (1fr, auto),
    [
      #text(size: 15pt, weight: "bold", fill: rgb("#065f46"))[CASE FORMING & FIREFORMING PROTOCOL]
      #v(2pt)
      #text(size: 10pt, weight: "medium", fill: rgb("#475569"))[Metallurgical Forming Schedule & Die Progression]
    ],
    [
      #text(size: 9pt, weight: "bold")[Date:] #text(size: 9pt)[${dateStr}]
    ]
  )
]

#v(10pt)

#grid(
  columns: (1fr, 1fr),
  gutter: 12pt,
  [
    #block(stroke: rgb("#e2e8f0"), inset: 8pt, radius: 4pt, width: 100%)[
      #text(weight: "bold", size: 10pt, fill: rgb("#1e293b"))[Target Wildcat Case]
      #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
      *Name:* ${cartridge.name} \\
      *Caliber / Bullet:* .${Math.round(cartridge.bullet_diameter * 1000)} (${cartridge.bullet_diameter.toFixed(4)}") \\
      *Case Length (L3):* ${cartridge.case_length.toFixed(4)}" \\
      *Shoulder Angle:* ${cartridge.shoulder_angle.toFixed(1)} deg
    ]
  ],
  [
    #block(stroke: rgb("#e2e8f0"), inset: 8pt, radius: 4pt, width: 100%)[
      #text(weight: "bold", size: 10pt, fill: rgb("#1e293b"))[Donor Parent Case]
      #line(length: 100%, stroke: 0.5pt + rgb("#cbd5e1"))
      *Parent:* ${parentCase.name} \\
      *Parent Caliber:* .${Math.round(parentCase.bullet_diameter * 1000)} (${parentCase.bullet_diameter.toFixed(4)}") \\
      *Parent Length:* ${parentCase.case_length.toFixed(4)}" \\
      *Parent Shoulder:* ${parentCase.shoulder_angle.toFixed(1)} deg
    ]
  ]
)

#v(12pt)

== Step-by-Step Forming & Sizing Dies
${steps.map((step, idx) => `
#block(
  fill: rgb("#f8fafc"),
  stroke: 0.5pt + rgb("#cbd5e1"),
  inset: 8pt,
  radius: 3pt,
  width: 100%
)[
  #text(weight: "bold", fill: rgb("#047857"))[Step ${idx + 1}:] ${step}
]
#v(4pt)
`).join('')}

#v(10pt)

== Metallurgical & Annealing Protocol
#block(
  fill: rgb("#fffbeb"),
  stroke: rgb("#fde68a"),
  inset: 10pt,
  radius: 4pt,
  width: 100%
)[
  #text(weight: "bold", fill: rgb("#92400e"))[Induction Annealing & Neck Doughnut Prevention:] \\
  #text(size: 8.5pt, fill: rgb("#78350f"))[
    - Anneal case brass before neck reductions exceeding 0.020" to avoid stress cracks or fold tears. \\
    - Whenever false-shoulder fireforming is performed, ensure light seating lubricant is wiped completely clean from the chamber before firing. \\
    - Check the neck-shoulder junction for internal brass doughnut formation after the initial fireforming shot. Inside neck reaming may be required.
  ]
]
`;
}
