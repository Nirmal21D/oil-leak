"""
Generates a detailed, professional Technical Workflow Diagram (Flowchart)
for AegisSea in both SVG format (for Canva) and Draw.io XML format.
Follows standard engineering flowchart conventions:
- Start/End terminals
- Input / Data blocks
- Process computation steps
- Decision diamonds with Yes/No branches
- Document / Output artifacts
Strict 100% valid XML formatting.
"""

import xml.etree.ElementTree as ET

def generate_workflow_svg() -> str:
    # 1800 x 1000 widescreen canvas for high detail
    svg = []
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1000" width="1800" height="1000" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')

    # Defs: arrow markers and drop shadows
    svg.append('''<defs>
      <marker id="wf-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
      </marker>
      <marker id="wf-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
      </marker>
      <marker id="wf-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
      </marker>
      <marker id="wf-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#0284C7" />
      </marker>
      <filter id="wf-shadow" x="-5%" y="-5%" width="110%" height="110%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.08" />
      </filter>
      <pattern id="wf-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
      </pattern>
    </defs>''')

    # Background
    svg.append('<rect width="1800" height="1000" fill="#FFFFFF" />')
    svg.append('<rect width="1800" height="1000" fill="url(#wf-grid)" opacity="0.6" />')

    # Top Header
    svg.append('''<g id="wf-header">
      <rect x="40" y="20" width="1720" height="54" rx="8" fill="#0F172A" />
      <text x="64" y="54" font-size="18" font-weight="800" fill="#FFFFFF" letter-spacing="1">AEGISSEA // OPERATIONAL FORENSIC WORKFLOW &amp; ALGORITHMIC PIPELINE</text>
      <text x="1360" y="54" font-size="13" font-weight="600" fill="#94A3B8" letter-spacing="0.5">TECHNICAL FLOWCHART • SIH 2026</text>
    </g>''')

    # Process Columns (Swimlanes / Phase Backgrounds)
    phases = [
        {"x": 40, "w": 320, "title": "PHASE 1: INGESTION &amp; PREPROCESSING", "color": "#0284C7", "bg": "#F0F9FF"},
        {"x": 380, "w": 330, "title": "PHASE 2: AI SEGMENTATION &amp; MORPHOLOGY", "color": "#DC2626", "bg": "#FEF2F2"},
        {"x": 730, "w": 340, "title": "PHASE 3: METOCEAN HINDCAST SOLVER", "color": "#D97706", "bg": "#FFFBEB"},
        {"x": 1090, "w": 330, "title": "PHASE 4: AIS SPATIO-TEMPORAL MATCH", "color": "#059669", "bg": "#ECFDF5"},
        {"x": 1440, "w": 320, "title": "PHASE 5: DISPATCH &amp; EVIDENCE DOSSIER", "color": "#7C3AED", "bg": "#F5F3FF"},
    ]

    for p in phases:
        svg.append(f'''<g id="phase-{p['x']}">
          <rect x="{p['x']}" y="88" width="{p['w']}" height="885" rx="8" fill="{p['bg']}" stroke="{p['color']}" stroke-width="1.2" opacity="0.4" />
          <rect x="{p['x']}" y="88" width="{p['w']}" height="36" rx="8" fill="{p['color']}" />
          <text x="{p['x'] + p['w']//2}" y="111" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.5">{p['title']}</text>
        </g>''')

    # =========================================================================
    # PHASE 1: INGESTION (X: 40 to 360)
    # =========================================================================
    # Start Node (Capsule)
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="100" y="140" width="200" height="42" rx="21" fill="#0F172A" stroke="#0F172A" />
      <text x="200" y="166" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">START: SATELLITE PASS / INGEST</text>
    </g>''')

    # Data Input Node: Sentinel-1 SAR
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="80,210 320,210 300,265 60,265" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="190" y="233" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Level-1 Sentinel-1 SAR IW GRD</text>
      <text x="190" y="249" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">C-Band (5.405 GHz) • 10m GSD GeoTIFF</text>
    </g>''')

    # Process: Tag Extraction
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="70" y="295" width="260" height="65" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="85" y="316" font-size="11" font-weight="700" fill="#0F172A">Parse GeoTIFF Metadata Tags</text>
      <text x="85" y="332" font-size="9.5" font-weight="500" fill="#475569">• ModelTiepointTag &amp; ModelPixelScale</text>
      <text x="85" y="347" font-size="9.5" font-weight="500" fill="#475569">• Timestamp &amp; Orbit Direction (ASC/DSC)</text>
    </g>''')

    # Decision Diamond 1: Georeferenced?
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="200,390 320,445 200,500 80,445" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="200" y="440" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">WGS-84 Coordinates</text>
      <text x="200" y="455" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">Valid?</text>
    </g>''')

    # Sub-branch: Unreferenced Fallback
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="70" y="535" width="130" height="55" rx="6" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5" />
      <text x="135" y="555" font-size="10" font-weight="700" fill="#DC2626" text-anchor="middle">Unreferenced Mode</text>
      <text x="135" y="572" font-size="8.5" font-weight="500" fill="#64748B" text-anchor="middle">Pixel-space raster ID</text>
    </g>''')

    # Process: Sliding-Window Tiling
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="70" y="625" width="260" height="85" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="85" y="647" font-size="11" font-weight="700" fill="#0F172A">Sliding-Window Patch Generator</text>
      <text x="85" y="664" font-size="9.5" font-weight="500" fill="#475569">• 512×512 Tile Extractor (20% overlap)</text>
      <text x="85" y="680" font-size="9.5" font-weight="500" fill="#475569">• Dynamic Radiometric Calibration (dB)</text>
      <text x="85" y="696" font-size="9.5" font-weight="500" fill="#475569">• Normalization: mean=0, std=1</text>
    </g>''')

    # Buffer Queue
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="70" y="745" width="260" height="60" rx="6" fill="#F8FAFC" stroke="#64748B" stroke-width="1.5" stroke-dasharray="3 3" />
      <text x="200" y="770" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Tensor Ingestion Batch Buffer</text>
      <text x="200" y="787" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">Batched Tensors [B, 1, 512, 512] on GPU</text>
    </g>''')

    # =========================================================================
    # PHASE 2: AI SEGMENTATION (X: 380 to 710)
    # =========================================================================
    # Neural Inference Box
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="405" y="140" width="280" height="95" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="2" />
      <rect x="405" y="140" width="6" height="95" rx="2" fill="#DC2626" />
      <text x="425" y="164" font-size="12" font-weight="800" fill="#0F172A">ResNet-34 U-Net Inference</text>
      <text x="425" y="180" font-size="10" font-weight="600" fill="#DC2626">PyTorch • CUDA FP16 TensorRT Core</text>
      <text x="425" y="198" font-size="9.5" font-weight="500" fill="#334155">• Multi-class Softmax Probability Logits</text>
      <text x="425" y="214" font-size="9.5" font-weight="500" fill="#334155">• Class 0: Sea • Class 1: Oil • Class 2: Lookalike</text>
    </g>''')

    # Tile Stitching
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="405" y="265" width="280" height="70" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="425" y="288" font-size="11" font-weight="700" fill="#0F172A">Mosaic Sticher &amp; Overlap Blender</text>
      <text x="425" y="306" font-size="9.5" font-weight="500" fill="#475569">• Distance-weighted boundary blending</text>
      <text x="425" y="322" font-size="9.5" font-weight="500" fill="#475569">• Global Scene Binary Segmentation Mask</text>
    </g>''')

    # Decision Diamond 2: Spill Verified?
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="545,365 675,420 545,475 415,420" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="545" y="415" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">Oil Pixels &gt; 500 &amp;</text>
      <text x="545" y="430" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">Confidence &gt; 50%?</text>
    </g>''')

    # No Spill Sub-branch
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="415" y="505" width="125" height="55" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="1.5" />
      <text x="477" y="526" font-size="10" font-weight="700" fill="#059669" text-anchor="middle">Clean Sea Verified</text>
      <text x="477" y="544" font-size="8.5" font-weight="500" fill="#64748B" text-anchor="middle">Log zero discharge</text>
    </g>''')

    # Morphological Feature Extraction
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="405" y="590" width="280" height="90" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="425" y="612" font-size="11" font-weight="700" fill="#0F172A">Morphology &amp; Vectorization</text>
      <text x="425" y="630" font-size="9.5" font-weight="500" fill="#475569">• OpenCV cv2.findContours (MultiPolygon)</text>
      <text x="425" y="646" font-size="9.5" font-weight="500" fill="#475569">• Geometric Centroid: (Lat₀, Lon₀)</text>
      <text x="425" y="662" font-size="9.5" font-weight="500" fill="#475569">• Metric Surface Area: A = Σ(pixels) × 100 m²</text>
    </g>''')

    # Thickness & Volume Estimation
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="405" y="710" width="280" height="75" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="425" y="732" font-size="11" font-weight="700" fill="#0F172A">Bonn Thickness &amp; Volume Model</text>
      <text x="425" y="750" font-size="9.5" font-weight="500" fill="#475569">• Code 1-5 Optical/SAR Slick Thickness</text>
      <text x="425" y="766" font-size="9.5" font-weight="500" fill="#475569">• Estimated Discharge Volume (m³ / metric tons)</text>
    </g>''')

    # =========================================================================
    # PHASE 3: METOCEAN HINDCAST (X: 730 to 1070)
    # =========================================================================
    # Metocean Data Query
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="775,140 1025,140 1005,195 755,195" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="890" y="162" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">CMEMS &amp; NOAA Metocean Ingest</text>
      <text x="890" y="178" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">Hourly Currents (u, v) + GFS 10m Winds</text>
    </g>''')

    # Numerical RK4 Hindcasting
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="755" y="225" width="290" height="110" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="2" />
      <rect x="755" y="225" width="6" height="110" rx="2" fill="#D97706" />
      <text x="775" y="249" font-size="12" font-weight="800" fill="#0F172A">Lagrangian 4th-Order Runge-Kutta</text>
      <text x="775" y="267" font-size="10" font-weight="600" fill="#D97706">Reverse Numerical Time-Stepping (-Δt)</text>
      <text x="775" y="285" font-size="9.5" font-weight="500" fill="#334155">• Hydrodynamic drift: u_net = u_current + 0.03·u_wind</text>
      <text x="775" y="301" font-size="9.5" font-weight="500" fill="#334155">• Stokes Drift correction + random-walk dispersion</text>
      <text x="775" y="317" font-size="9.5" font-weight="500" fill="#334155">• Backward step: T0 ➔ T - 6.5h</text>
    </g>''')

    # Spill Origin Locus Derived
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="755" y="365" width="290" height="80" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="775" y="388" font-size="11" font-weight="700" fill="#0F172A">Release Locus &amp; Uncertainty Envelope</text>
      <text x="775" y="406" font-size="9.5" font-weight="500" fill="#475569">• Reconstructed Spill Coordinates: (Lat_rel, Lon_rel)</text>
      <text x="775" y="422" font-size="9.5" font-weight="500" fill="#475569">• Spatial Uncertainty Radius: R(t) = σ_pos + k·t</text>
      <text x="775" y="438" font-size="9.5" font-weight="500" fill="#475569">• Spatio-Temporal Query Bounding Box</text>
    </g>''')

    # Forward Dispersion Plume
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="755" y="475" width="290" height="80" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="775" y="498" font-size="11" font-weight="700" fill="#0F172A">48-Hour Forward Trajectory Model</text>
      <text x="775" y="516" font-size="9.5" font-weight="500" fill="#475569">• Future shoreline impact &amp; coastal threat cone</text>
      <text x="775" y="532" font-size="9.5" font-weight="500" fill="#475569">• Oil evaporation &amp; emulsification aging curve</text>
      <text x="775" y="548" font-size="9.5" font-weight="500" fill="#475569">• Environmental sensitive zone alert trigger</text>
    </g>''')

    # Dark Target Verification Module
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="755" y="585" width="290" height="95" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.5" />
      <rect x="755" y="585" width="6" height="95" rx="2" fill="#7C3AED" />
      <text x="775" y="608" font-size="11" font-weight="700" fill="#0F172A">Dark Target Cross-Match (SAR vs AIS)</text>
      <text x="775" y="626" font-size="9.5" font-weight="600" fill="#7C3AED">Non-Reporting Vessel Defense</text>
      <text x="775" y="644" font-size="9.5" font-weight="500" fill="#334155">• CFAR Ship Target Detector on SAR Raster</text>
      <text x="775" y="660" font-size="9.5" font-weight="500" fill="#334155">• Cross-reference with broadcast AIS positions</text>
      <text x="775" y="674" font-size="9.5" font-weight="500" fill="#334155">• Flag non-cooperative dark polluters</text>
    </g>''')

    # =========================================================================
    # PHASE 4: AIS ATTRIBUTION (X: 1090 to 1420)
    # =========================================================================
    # AIS Data Ingest
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="1135,140 1385,140 1365,195 1115,195" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="1250" y="162" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">NOAA MarineCadastre AIS Feed</text>
      <text x="1250" y="178" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">MMSI, Coordinates, SOG, COG, Heading</text>
    </g>''')

    # Spatial-Temporal Filter
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1110" y="225" width="290" height="75" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="1130" y="248" font-size="11" font-weight="700" fill="#0F172A">Spatio-Temporal Candidate Filter</text>
      <text x="1130" y="266" font-size="9.5" font-weight="500" fill="#475569">• Query window: [T_origin - 2h, T_origin + 2h]</text>
      <text x="1130" y="282" font-size="9.5" font-weight="500" fill="#475569">• Spatial boundary: Locus Lat/Lon ± 0.35°</text>
    </g>''')

    # Kinematic CPA Calculation
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1110" y="330" width="290" height="110" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="2" />
      <rect x="1110" y="330" width="6" height="110" rx="2" fill="#059669" />
      <text x="1130" y="354" font-size="12" font-weight="800" fill="#0F172A">Kinematic Track Correlator</text>
      <text x="1130" y="372" font-size="10" font-weight="600" fill="#059669">Haversine &amp; Cubic Spline Interpolator</text>
      <text x="1130" y="390" font-size="9.5" font-weight="500" fill="#334155">• Closest Point of Approach (CPA) distance (km)</text>
      <text x="1130" y="406" font-size="9.5" font-weight="500" fill="#334155">• Temporal delta (Δt) at intercept point</text>
      <text x="1130" y="422" font-size="9.5" font-weight="500" fill="#334155">• Speed anomaly &amp; course zigzag detection</text>
    </g>''')

    # Plain-English Attribution Scorer
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1110" y="470" width="290" height="95" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="1130" y="493" font-size="11" font-weight="700" fill="#0F172A">Evidence Scoring &amp; Reasoning</text>
      <text x="1130" y="511" font-size="9.5" font-weight="500" fill="#475569">• Proximity Match: CPA &lt; 5.0 km</text>
      <text x="1130" y="527" font-size="9.5" font-weight="500" fill="#475569">• Drift Alignment: Track intersects hindcast vector</text>
      <text x="1130" y="543" font-size="9.5" font-weight="500" fill="#475569">• Plain-English 'Why Flagged' Justification</text>
      <text x="1130" y="558" font-size="9.5" font-weight="500" fill="#475569">• Rank-Ordered Suspect Table</text>
    </g>''')

    # Decision Diamond 3: Primary Suspect Identified?
    svg.append('''<g filter="url(#wf-shadow)">
      <polygon points="1255,595 1385,650 1255,705 1125,650" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="1255" y="645" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">Candidate Vessel</text>
      <text x="1255" y="660" font-size="10.5" font-weight="800" fill="#0F172A" text-anchor="middle">Correlated?</text>
    </g>''')

    # =========================================================================
    # PHASE 5: DISPATCH & DOSSIER (X: 1440 to 1760)
    # =========================================================================
    # Response Routing Module
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1460" y="140" width="280" height="100" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.5" />
      <text x="1480" y="164" font-size="12" font-weight="800" fill="#0F172A">Response Routing Solver</text>
      <text x="1480" y="180" font-size="10" font-weight="600" fill="#7C3AED">NGA World Port Index (WPI)</text>
      <text x="1480" y="198" font-size="9.5" font-weight="500" fill="#334155">• Nearest port identification &amp; salvage base</text>
      <text x="1480" y="214" font-size="9.5" font-weight="500" fill="#334155">• Geodesic intercept vector &amp; transit ETA</text>
      <text x="1480" y="230" font-size="9.5" font-weight="500" fill="#334155">• Containment boom deployment fleet allocation</text>
    </g>''')

    # Tactical C2 Console
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1460" y="265" width="280" height="100" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
      <rect x="1460" y="265" width="6" height="100" rx="2" fill="#0F172A" />
      <text x="1480" y="289" font-size="12" font-weight="800" fill="#0F172A">Tactical C2 Tri-Pane Interface</text>
      <text x="1480" y="307" font-size="10" font-weight="600" fill="#0284C7">Next.js 14 • Leaflet GIS • WebSocket</text>
      <text x="1480" y="325" font-size="9.5" font-weight="500" fill="#334155">• Dynamic multi-layer map visualization</text>
      <text x="1480" y="341" font-size="9.5" font-weight="500" fill="#334155">• 5-Phase Evidence Chain Banner</text>
      <text x="1480" y="357" font-size="9.5" font-weight="500" fill="#334155">• Automated 4-Step Investigation Replay</text>
    </g>''')

    # 7-Page Evidence Dossier
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1460" y="395" width="280" height="110" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="2" />
      <rect x="1460" y="395" width="6" height="110" rx="2" fill="#DC2626" />
      <text x="1480" y="419" font-size="12" font-weight="800" fill="#0F172A">7-Page Evidence Dossier Export</text>
      <text x="1480" y="437" font-size="10" font-weight="600" fill="#DC2626">Court-Admissible Legal Artifact</text>
      <text x="1480" y="455" font-size="9.5" font-weight="500" fill="#334155">• Sentinel-1 scene geodetic provenance</text>
      <text x="1480" y="471" font-size="9.5" font-weight="500" fill="#334155">• Lagrangian hindcast &amp; CPA kinematic logs</text>
      <text x="1480" y="487" font-size="9.5" font-weight="500" fill="#334155">• Suspect vessel owner, flag, &amp; IMO records</text>
      <text x="1480" y="501" font-size="9.5" font-weight="500" fill="#334155">• Cryptographic integrity hash &amp; custody log</text>
    </g>''')

    # Operational Dispatch Alert
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1460" y="535" width="280" height="90" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="1480" y="559" font-size="12" font-weight="800" fill="#0F172A">Emergency Agency Alerting</text>
      <text x="1480" y="577" font-size="10" font-weight="600" fill="#059669">Multi-Channel Immediate Broadcast</text>
      <text x="1480" y="595" font-size="9.5" font-weight="500" fill="#334155">• Indian Coast Guard (ICG) Operations Room</text>
      <text x="1480" y="611" font-size="9.5" font-weight="500" fill="#334155">• DG Shipping &amp; State Pollution Control Board</text>
    </g>''')

    # End Node
    svg.append('''<g filter="url(#wf-shadow)">
      <rect x="1500" y="665" width="200" height="42" rx="21" fill="#0F172A" stroke="#0F172A" />
      <text x="1600" y="691" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">END: INTERCEPTION LOGGED</text>
    </g>''')

    # =========================================================================
    # CONNECTOR PATHS & ARROWS
    # =========================================================================
    svg.append('<g id="wf-connectors">')
    # Phase 1 vertical flow
    svg.append('<line x1="200" y1="182" x2="200" y2="210" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="190" y1="265" x2="190" y2="295" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="200" y1="360" x2="200" y2="390" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    
    # Decision 1 branches
    svg.append('<line x1="140" y1="472" x2="140" y2="535" stroke="#DC2626" stroke-width="2" marker-end="url(#wf-arrow-red)" />')
    svg.append('<text x="148" y="515" font-size="10" font-weight="800" fill="#DC2626">NO</text>')

    svg.append('<line x1="200" y1="500" x2="200" y2="625" stroke="#059669" stroke-width="2" marker-end="url(#wf-arrow-green)" />')
    svg.append('<text x="210" y="565" font-size="10" font-weight="800" fill="#059669">YES</text>')

    svg.append('<line x1="200" y1="710" x2="200" y2="745" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')

    # Phase 1 to Phase 2
    svg.append('<path d="M 330 775 L 360 775 L 360 185 L 405 185" fill="none" stroke="#DC2626" stroke-width="2.5" marker-end="url(#wf-arrow-red)" />')

    # Phase 2 vertical flow
    svg.append('<line x1="545" y1="235" x2="545" y2="265" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="545" y1="335" x2="545" y2="365" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    
    # Decision 2 branches
    svg.append('<line x1="480" y1="447" x2="480" y2="505" stroke="#059669" stroke-width="2" marker-end="url(#wf-arrow-green)" />')
    svg.append('<text x="490" y="485" font-size="10" font-weight="800" fill="#059669">NO</text>')

    svg.append('<line x1="545" y1="475" x2="545" y2="590" stroke="#DC2626" stroke-width="2" marker-end="url(#wf-arrow-red)" />')
    svg.append('<text x="555" y="535" font-size="10" font-weight="800" fill="#DC2626">YES</text>')

    svg.append('<line x1="545" y1="680" x2="545" y2="710" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')

    # Phase 2 to Phase 3
    svg.append('<path d="M 685 635 L 720 635 L 720 280 L 755 280" fill="none" stroke="#D97706" stroke-width="2.5" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="890" y1="195" x2="890" y2="225" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="900" y1="335" x2="900" y2="365" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="900" y1="445" x2="900" y2="475" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="900" y1="555" x2="900" y2="585" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')

    # Phase 3 to Phase 4
    svg.append('<path d="M 1045 405 L 1075 405 L 1075 262 L 1110 262" fill="none" stroke="#059669" stroke-width="2.5" marker-end="url(#wf-arrow-green)" />')
    svg.append('<line x1="1250" y1="195" x2="1250" y2="225" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="1255" y1="300" x2="1255" y2="330" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="1255" y1="440" x2="1255" y2="470" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="1255" y1="565" x2="1255" y2="595" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')

    # Phase 4 to Phase 5
    svg.append('<path d="M 1385 650 L 1425 650 L 1425 315 L 1460 315" fill="none" stroke="#0F172A" stroke-width="2.5" marker-end="url(#wf-arrow)" />')
    svg.append('<path d="M 1255 705 L 1255 745 L 1435 745 L 1435 190 L 1460 190" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#wf-arrow)" />')

    # Phase 5 vertical flow
    svg.append('<line x1="1600" y1="365" x2="1600" y2="395" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="1600" y1="505" x2="1600" y2="535" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('<line x1="1600" y1="625" x2="1600" y2="665" stroke="#334155" stroke-width="2" marker-end="url(#wf-arrow)" />')
    svg.append('</g>')

    # Bottom Legend / Metrics Strip
    svg.append('''<g id="wf-legend">
      <rect x="40" y="900" width="1720" height="75" rx="8" fill="#0F172A" />
      <g transform="translate(60, 915)">
        <circle cx="10" cy="20" r="7" fill="#0284C7" />
        <text x="25" y="24" font-size="12" font-weight="700" fill="#FFFFFF">Level-1 SAR (10m)</text>
        <text x="25" y="38" font-size="9.5" font-weight="500" fill="#94A3B8">ESA Copernicus IW GRD</text>
      </g>
      <g transform="translate(380, 915)">
        <circle cx="10" cy="20" r="7" fill="#DC2626" />
        <text x="25" y="24" font-size="12" font-weight="700" fill="#FFFFFF">ResNet-34 U-Net (PyTorch)</text>
        <text x="25" y="38" font-size="9.5" font-weight="500" fill="#94A3B8">0.826 IoU Benchmark • FP16 CUDA</text>
      </g>
      <g transform="translate(730, 915)">
        <circle cx="10" cy="20" r="7" fill="#D97706" />
        <text x="25" y="24" font-size="12" font-weight="700" fill="#FFFFFF">Lagrangian RK4 Hindcast</text>
        <text x="25" y="38" font-size="9.5" font-weight="500" fill="#94A3B8">CMEMS Currents + 3% Windage (T-6.5h)</text>
      </g>
      <g transform="translate(1090, 915)">
        <circle cx="10" cy="20" r="7" fill="#059669" />
        <text x="25" y="24" font-size="12" font-weight="700" fill="#FFFFFF">Kinematic CPA Attribution</text>
        <text x="25" y="38" font-size="9.5" font-weight="500" fill="#94A3B8">NOAA AIS Historical Trajectory</text>
      </g>
      <g transform="translate(1440, 915)">
        <circle cx="10" cy="20" r="7" fill="#7C3AED" />
        <text x="25" y="24" font-size="12" font-weight="700" fill="#FFFFFF">7-Page Evidence Dossier</text>
        <text x="25" y="38" font-size="9.5" font-weight="500" fill="#94A3B8">Court-Admissible Legal Export</text>
      </g>
    </g>''')

    svg.append('</svg>')
    full_svg = '\n'.join(svg)
    ET.fromstring(full_svg)
    print("Workflow SVG Validated 100% OK!")
    return full_svg

if __name__ == '__main__':
    content = generate_workflow_svg()
    with open('c:/Nirmal/oil-leak/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Workflow SVG saved to c:/Nirmal/oil-leak/workflow_diagram.svg")
