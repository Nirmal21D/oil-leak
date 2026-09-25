"""
Generates a Branched Vertical Workflow Diagram for AegisSea.
Flows from top to bottom while branching into parallel engineering tracks:
- Top: Ingestion & Preprocessing
- Branch 1: AI Neural Segmentation (Left) vs Metocean & AIS Feeds (Right)
- Convergence 1: Lagrangian RK4 Drift Hindcasting (Center)
- Branch 2: Kinematic AIS Correlator (Left) vs Dark Target Radar Detector (Right)
- Convergence 2: Attribution Verdict & Evidence Reasoning (Center)
- Branch 3: Coast Guard Dispatch (Left) vs 7-Page Legal Dossier (Right)
- Bottom: End Terminal

Dimensions: 1400 x 1150 (Fits presentation slides cleanly without excessive vertical height).
100% Valid XML verified with xml.etree.ElementTree.
"""

import xml.etree.ElementTree as ET

def generate_branched_svg() -> str:
    svg = []
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 1150" width="1400" height="1150" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')

    svg.append('''<defs>
      <marker id="b-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
      </marker>
      <marker id="b-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284C7" />
      </marker>
      <marker id="b-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
      </marker>
      <marker id="b-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
      </marker>
      <marker id="b-arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
      </marker>
      <filter id="b-shadow" x="-4%" y="-4%" width="108%" height="108%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.07" />
      </filter>
      <pattern id="b-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
      </pattern>
    </defs>''')

    # Canvas Background
    svg.append('<rect width="1400" height="1150" fill="#FFFFFF" />')
    svg.append('<rect width="1400" height="1150" fill="url(#b-grid)" opacity="0.6" />')

    # Top Header Banner
    svg.append('''<g id="b-header">
      <rect x="40" y="20" width="1320" height="52" rx="8" fill="#0F172A" />
      <text x="64" y="52" font-size="16" font-weight="800" fill="#FFFFFF" letter-spacing="1">AEGISSEA // OPERATIONAL FORENSIC WORKFLOW PIPELINE</text>
      <text x="960" y="52" font-size="12" font-weight="600" fill="#94A3B8" letter-spacing="0.5">BRANCHED TECHNICAL FLOWCHART • SIH 2026</text>
    </g>''')

    # Central reference
    CX = 700

    # =========================================================================
    # TIER 1: INGESTION & GEODETIC PREPROCESSING (Y: 90 to 225)
    # =========================================================================
    # Start Node
    svg.append(f'''<g filter="url(#b-shadow)">
      <rect x="{CX - 120}" y="90" width="240" height="34" rx="17" fill="#0F172A" />
      <text x="{CX}" y="112" font-size="11.5" font-weight="800" fill="#FFFFFF" text-anchor="middle">START: SATELLITE PASS / INGEST</text>
    </g>''')

    # Sensor Ingest Node
    svg.append(f'''<g filter="url(#b-shadow)">
      <polygon points="{CX - 190},140 {CX + 210},140 {CX + 180},180 {CX - 220},180" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX - 5}" y="158" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Level-1 Sentinel-1 SAR IW GRD (C-Band 10m GeoTIFF)</text>
      <text x="{CX - 5}" y="172" font-size="9" font-weight="500" fill="#64748B" text-anchor="middle">ESA Copernicus All-Weather Radar Acquisition</text>
    </g>''')

    # Preprocessing Box
    svg.append(f'''<g filter="url(#b-shadow)">
      <rect x="{CX - 210}" y="196" width="420" height="48" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX}" y="215" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">WGS-84 Tag Parsing &amp; 512×512 Sliding-Window Tiler</text>
      <text x="{CX}" y="232" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">ModelTiepointTag georeferencing • 20% patch overlap • dB radiometric normalization</text>
    </g>''')

    # =========================================================================
    # TIER 2: PARALLEL BRANCHES (AI ENGINE vs METOCEAN & AIS FEEDS) (Y: 270 to 450)
    # =========================================================================
    # LEFT BRANCH: AI Neural Segmentation Track
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="70" y="270" width="580" height="175" rx="8" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5" />
      <rect x="70" y="270" width="580" height="26" rx="8" fill="#DC2626" />
      <text x="360" y="288" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">TRACK A: NEURAL SAR SEGMENTATION &amp; MORPHOLOGY</text>
      
      <!-- Sub-step A1: U-Net -->
      <rect x="85" y="306" width="265" height="60" rx="5" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.2" />
      <text x="95" y="324" font-size="10.5" font-weight="800" fill="#0F172A">ResNet-34 U-Net (PyTorch CUDA)</text>
      <text x="95" y="339" font-size="9" font-weight="600" fill="#DC2626">0.826 IoU • 0.892 F1 Zenodo Benchmark</text>
      <text x="95" y="354" font-size="8.5" font-weight="500" fill="#475569">Classifies: Mineral Oil vs Lookalikes vs Sea</text>

      <!-- Sub-step A2: Decision -->
      <polygon points="415,306 480,336 415,366 350,336" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.2" />
      <text x="415" y="333" font-size="8.5" font-weight="800" fill="#0F172A" text-anchor="middle">Oil Pixels &gt; 500?</text>
      <text x="415" y="345" font-size="8.5" font-weight="800" fill="#0F172A" text-anchor="middle">Conf &gt; 50%?</text>

      <!-- Clean Sea side note -->
      <rect x="495" y="318" width="140" height="36" rx="4" fill="#F0FDF4" stroke="#059669" stroke-width="1" />
      <text x="565" y="334" font-size="8.5" font-weight="700" fill="#059669" text-anchor="middle">NO: Clean Sea Verified</text>
      <text x="565" y="346" font-size="7.5" font-weight="500" fill="#64748B" text-anchor="middle">Zero discharge logged</text>

      <!-- Sub-step A3: Morphology Vectorization -->
      <rect x="85" y="376" width="550" height="56" rx="5" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.2" />
      <text x="100" y="394" font-size="10.5" font-weight="800" fill="#0F172A">OpenCV Vector Contours, Centroid &amp; Bonn Volume Estimation</text>
      <text x="100" y="410" font-size="9" font-weight="500" fill="#475569">• Extracts geometric slick centroid (Lat₀, Lon₀) and metric surface area (km²)</text>
      <text x="100" y="423" font-size="9" font-weight="500" fill="#475569">• Applies Bonn Agreement appearance codes to derive estimated discharge volume in m³</text>
    </g>''')

    # RIGHT BRANCH: Metocean & AIS Telemetry Ingestion
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="750" y="270" width="580" height="175" rx="8" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" />
      <rect x="750" y="270" width="580" height="26" rx="8" fill="#D97706" />
      <text x="1040" y="288" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">TRACK B: METOCEAN &amp; MARITIME STREAM INGESTION</text>

      <!-- Sub-step B1: CMEMS Currents -->
      <rect x="765" y="306" width="265" height="58" rx="5" fill="#FFFFFF" stroke="#D97706" stroke-width="1.2" />
      <text x="775" y="324" font-size="10.5" font-weight="800" fill="#0F172A">Copernicus (CMEMS) Hydrodynamics</text>
      <text x="775" y="340" font-size="9" font-weight="600" fill="#D97706">Hourly Surface Velocity Vectors (u, v)</text>
      <text x="775" y="353" font-size="8.5" font-weight="500" fill="#475569">0.083° global ocean reanalysis grid</text>

      <!-- Sub-step B2: NOAA Wind -->
      <rect x="1045" y="306" width="270" height="58" rx="5" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.2" />
      <text x="1055" y="324" font-size="10.5" font-weight="800" fill="#0F172A">NOAA GFS Surface Winds</text>
      <text x="1055" y="340" font-size="9" font-weight="600" fill="#2563EB">10m Atmospheric Wind Vectors (Wx, Wy)</text>
      <text x="1055" y="353" font-size="8.5" font-weight="500" fill="#475569">Windage drift factor: 3.0% transfer</text>

      <!-- Sub-step B3: AIS Stream -->
      <rect x="765" y="374" width="550" height="58" rx="5" fill="#FFFFFF" stroke="#059669" stroke-width="1.2" />
      <text x="775" y="392" font-size="10.5" font-weight="800" fill="#0F172A">NOAA MarineCadastre Historical AIS Vessel Broadcasts</text>
      <text x="775" y="408" font-size="9" font-weight="500" fill="#475569">• Ingests MMSI, GPS coordinates, speed over ground (SOG), course, &amp; vessel dimensions</text>
      <text x="775" y="421" font-size="9" font-weight="500" fill="#475569">• NGA World Port Index (WPI) global facilities and salvage base database</text>
    </g>''')

    # =========================================================================
    # TIER 3: CONVERGENCE 1 - LAGRANGIAN RK4 HINDCAST (Y: 480 to 600)
    # =========================================================================
    svg.append(f'''<g filter="url(#b-shadow)">
      <rect x="180" y="480" width="1040" height="120" rx="8" fill="#FFFFFF" stroke="#D97706" stroke-width="2" />
      <rect x="180" y="480" width="10" height="120" rx="2" fill="#D97706" />
      <text x="{CX}" y="504" font-size="13" font-weight="800" fill="#0F172A" text-anchor="middle">CONVERGENCE 1: 4TH-ORDER RUNGE-KUTTA (RK4) LAGRANGIAN DRIFT SOLVER</text>
      <text x="{CX}" y="522" font-size="10" font-weight="700" fill="#D97706" text-anchor="middle">Merges Detected Slick Centroid + CMEMS Ocean Current Vectors + NOAA Windage</text>
      
      <!-- Sub-cards inside -->
      <rect x="205" y="534" width="480" height="52" rx="4" fill="#FFFBEB" stroke="#D97706" stroke-width="1" />
      <text x="215" y="552" font-size="10.5" font-weight="800" fill="#0F172A">Reverse Hindcast to Spill Origin Locus (T - 6.5h)</text>
      <text x="215" y="567" font-size="9" font-weight="500" fill="#475569">• Reconstructs exact discharge coordinates: (Lat_origin, Lon_origin)</text>
      <text x="215" y="579" font-size="9" font-weight="500" fill="#475569">• Computes dynamic spatial uncertainty envelope R(t) = σ_pos + k·t</text>

      <rect x="715" y="534" width="480" height="52" rx="4" fill="#F0F9FF" stroke="#0284C7" stroke-width="1" />
      <text x="725" y="552" font-size="10.5" font-weight="800" fill="#0F172A">48-Hour Forward Trajectory &amp; Shoreline Risk Cone</text>
      <text x="725" y="567" font-size="9" font-weight="500" fill="#475569">• Forward hydrodynamic dispersion cone for environmental mitigation</text>
      <text x="725" y="579" font-size="9" font-weight="500" fill="#475569">• Evaporation and weathering aging curves for response priority</text>
    </g>''')

    # =========================================================================
    # TIER 4: PARALLEL BRANCHES (AIS KINEMATICS vs DARK TARGETS) (Y: 635 to 780)
    # =========================================================================
    # LEFT SUB-TRACK: AIS Spatio-temporal match
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="70" y="635" width="580" height="145" rx="8" fill="#ECFDF5" stroke="#059669" stroke-width="1.5" />
      <rect x="70" y="635" width="580" height="26" rx="8" fill="#059669" />
      <text x="360" y="653" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">TRACK C: SPATIO-TEMPORAL AIS KINEMATIC ATTRIBUTION</text>

      <rect x="85" y="670" width="550" height="96" rx="5" fill="#FFFFFF" stroke="#059669" stroke-width="1.2" />
      <text x="100" y="689" font-size="11" font-weight="800" fill="#0F172A">CPA Distance, Track Intersection &amp; Speed Anomaly Correlation</text>
      <text x="100" y="707" font-size="9.5" font-weight="500" fill="#334155">• Queries spatial-temporal window: [Locus ± 0.35°, T_origin ± 2.0h]</text>
      <text x="100" y="723" font-size="9.5" font-weight="500" fill="#334155">• Cubic spline interpolation calculates Closest Point of Approach (CPA) distance</text>
      <text x="100" y="739" font-size="9.5" font-weight="500" fill="#334155">• Quantifies temporal delta (Δt) between vessel transit and hindcast release moment</text>
      <text x="100" y="754" font-size="9.5" font-weight="500" fill="#334155">• Flags behavioral anomalies (drastic speed drop, sharp course zigzag near locus)</text>
    </g>''')

    # RIGHT SUB-TRACK: Dark Vessel Radar Cross-Match
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="750" y="635" width="580" height="145" rx="8" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.5" />
      <rect x="750" y="635" width="580" height="26" rx="8" fill="#7C3AED" />
      <text x="1040" y="653" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle">TRACK D: DARK TARGET SAR RADAR CROSS-MATCH</text>

      <rect x="765" y="670" width="550" height="96" rx="5" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.2" />
      <text x="780" y="689" font-size="11" font-weight="800" fill="#0F172A">Non-Cooperative Vessel Detection &amp; Transponder Verification</text>
      <text x="780" y="707" font-size="9.5" font-weight="500" fill="#334155">• CFAR (Constant False Alarm Rate) algorithm detects ship radar reflectivity</text>
      <text x="780" y="723" font-size="9.5" font-weight="500" fill="#334155">• Cross-matches detected ship targets against active AIS transponder coordinates</text>
      <text x="780" y="739" font-size="9.5" font-weight="500" fill="#334155">• Detects "Dark Ships" deliberately turning off AIS during illicit discharge</text>
      <text x="780" y="754" font-size="9.5" font-weight="500" fill="#334155">• Flags unregistered polluters for naval / coast guard interception</text>
    </g>''')

    # =========================================================================
    # TIER 5: CONVERGENCE 2 - EVIDENCE VERDICT (Y: 810 to 890)
    # =========================================================================
    svg.append(f'''<g filter="url(#b-shadow)">
      <rect x="250" y="810" width="900" height="75" rx="8" fill="#FFFFFF" stroke="#059669" stroke-width="2" />
      <rect x="250" y="810" width="8" height="75" rx="2" fill="#059669" />
      <text x="{CX}" y="833" font-size="12.5" font-weight="800" fill="#0F172A" text-anchor="middle">CONVERGENCE 2: PLAIN-ENGLISH 'WHY FLAGGED' ATTRIBUTION REASONING</text>
      <text x="{CX}" y="851" font-size="10" font-weight="600" fill="#059669" text-anchor="middle">Replaces Black-Box Scores with Calibrated, Court-Defensible Kinematic Proof</text>
      <text x="{CX}" y="868" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">Ranks suspect vessels by CPA distance, temporal concurrence, and trajectory alignment with verified provenance</text>
    </g>''')

    # =========================================================================
    # TIER 6: DUAL DISPATCH & ACTION BRANCHES (Y: 915 to 1050)
    # =========================================================================
    # LEFT OUTPUT: Tactical Operations & Coast Guard Dispatch
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="70" y="915" width="580" height="135" rx="8" fill="#FFFFFF" stroke="#2563EB" stroke-width="1.5" />
      <rect x="70" y="915" width="6" height="135" rx="2" fill="#2563EB" />
      <text x="90" y="938" font-size="11.5" font-weight="800" fill="#0F172A">TACTICAL DISPATCH &amp; INTERCEPTION</text>
      <text x="90" y="955" font-size="9.5" font-weight="600" fill="#2563EB">Indian Coast Guard (ICG) Ops Room &amp; DG Shipping</text>
      <text x="90" y="974" font-size="9.5" font-weight="500" fill="#334155">• NGA World Port Index computes nearest response base &amp; geodesic intercept vector</text>
      <text x="90" y="990" font-size="9.5" font-weight="500" fill="#334155">• Vessel transit ETA calculation for rapid containment boom deployment</text>
      <text x="90" y="1006" font-size="9.5" font-weight="500" fill="#334155">• Emergency multi-channel dispatch broadcast (SMS, Webhooks, Tactical VHF)</text>
      <text x="90" y="1022" font-size="9.5" font-weight="500" fill="#334155">• Real-time suspect vessel tracking for maritime interception</text>
    </g>''')

    # RIGHT OUTPUT: C2 Interface & 7-Page Evidence Dossier
    svg.append('''<g filter="url(#b-shadow)">
      <rect x="750" y="915" width="580" height="135" rx="8" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <rect x="750" y="915" width="6" height="135" rx="2" fill="#DC2626" />
      <text x="770" y="938" font-size="11.5" font-weight="800" fill="#0F172A">TACTICAL C2 CONSOLE &amp; LEGAL EVIDENCE DOSSIER</text>
      <text x="770" y="955" font-size="9.5" font-weight="600" fill="#DC2626">Next.js 14 + Leaflet GIS &amp; Court-Admissible PDF Export</text>
      <text x="770" y="974" font-size="9.5" font-weight="500" fill="#334155">• Real-time tri-pane C2 dashboard with dynamic multi-layer GIS cartography</text>
      <text x="770" y="990" font-size="9.5" font-weight="500" fill="#334155">• Automated 4-step Investigation Replay simulator for commanders &amp; judges</text>
      <text x="770" y="1006" font-size="9.5" font-weight="500" fill="#334155">• 7-Page Legal Evidence Dossier: satellite provenance, CPA proof, suspect IMO records</text>
      <text x="770" y="1022" font-size="9.5" font-weight="500" fill="#334155">• Cryptographic SHA-256 custody hash for unalterable chain-of-custody</text>
    </g>''')

    # =========================================================================
    # TIER 7: TERMINAL END NODE (Y: 1080)
    # =========================================================================
    svg.append(f'''<g filter="url(#b-shadow)">
      <rect x="{CX - 150}" y="1075" width="300" height="38" rx="19" fill="#0F172A" />
      <text x="{CX}" y="1099" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">END: INTERCEPTION &amp; EVIDENCE LOGGED</text>
    </g>''')

    # =========================================================================
    # CONNECTORS (BRANCHED TREE)
    # =========================================================================
    svg.append('<g id="b-connectors">')
    # Top vertical spine
    svg.append(f'<line x1="{CX}" y1="124" x2="{CX}" y2="140" stroke="#334155" stroke-width="2" marker-end="url(#b-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="180" x2="{CX}" y2="196" stroke="#334155" stroke-width="2" marker-end="url(#b-arrow)" />')

    # Fork 1: Split to Left (AI) and Right (Metocean)
    svg.append(f'<path d="M {CX} 244 L {CX} 256 L 360 256 L 360 270" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#b-arrow-red)" />')
    svg.append(f'<path d="M {CX} 244 L {CX} 256 L 1040 256 L 1040 270" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#b-arrow-amber)" />')

    # Sub-connectors inside Left Track
    svg.append('<line x1="350" y1="336" x2="350" y2="336" stroke="#DC2626" stroke-width="1.5" />')
    svg.append('<line x1="480" y1="336" x2="495" y2="336" stroke="#059669" stroke-width="1.5" marker-end="url(#b-arrow-green)" />')
    svg.append('<path d="M 415 366 L 415 376" fill="none" stroke="#DC2626" stroke-width="1.5" marker-end="url(#b-arrow-red)" />')

    # Convergence 1: Left and Right track merge into Lagrangian Solver
    svg.append('<path d="M 360 445 L 360 465 L 500 465 L 500 480" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#b-arrow-red)" />')
    svg.append('<path d="M 1040 445 L 1040 465 L 900 465 L 900 480" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#b-arrow-amber)" />')

    # Fork 2: Split from Lagrangian Solver to AIS Match (Left) and Dark Target (Right)
    svg.append(f'<path d="M 500 600 L 500 620 L 360 620 L 360 635" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#b-arrow-green)" />')
    svg.append(f'<path d="M 900 600 L 900 620 L 1040 620 L 1040 635" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#b-arrow)" />')

    # Convergence 2: AIS Match and Dark Target merge into Attribution Verdict
    svg.append('<path d="M 360 780 L 360 798 L 550 798 L 550 810" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#b-arrow-green)" />')
    svg.append('<path d="M 1040 780 L 1040 798 L 850 798 L 850 810" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#b-arrow)" />')

    # Fork 3: Split from Verdict into Dispatch (Left) and Dossier/C2 (Right)
    svg.append(f'<path d="M 550 885 L 550 902 L 360 902 L 360 915" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#b-arrow-blue)" />')
    svg.append(f'<path d="M 850 885 L 850 902 L 1040 902 L 1040 915" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#b-arrow-red)" />')

    # Convergence 3: Dispatch and Dossier merge into Terminal End Node
    svg.append(f'<path d="M 360 1050 L 360 1065 L {CX - 60} 1065 L {CX - 60} 1075" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#b-arrow)" />')
    svg.append(f'<path d="M 1040 1050 L 1040 1065 L {CX + 60} 1065 L {CX + 60} 1075" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#b-arrow)" />')

    svg.append('</g>')
    svg.append('</svg>')

    full_svg = '\n'.join(svg)
    ET.fromstring(full_svg)
    print("Branched Vertical Workflow SVG Validated 100% OK!")
    return full_svg

if __name__ == '__main__':
    content = generate_branched_svg()
    # Save to standard workflow files
    with open('c:/Nirmal/oil-leak/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/workflow_diagram_branched.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram_branched.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Branched Workflow SVG files successfully saved!")
