"""
Generates a detailed, clean, vertical Technical Flowchart for AegisSea.
Follows standard engineering flowchart conventions:
- Top-to-bottom vertical spine
- Input parallelograms
- Process rectangles with technical metrics
- Decision diamonds with YES (down) and NO (side) branches
- Document output and terminal nodes
100% Valid XML verified with xml.etree.ElementTree.
"""

import xml.etree.ElementTree as ET

def generate_vertical_svg() -> str:
    # 960 x 2720 vertical canvas
    svg = []
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 2720" width="960" height="2720" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')

    svg.append('''<defs>
      <marker id="v-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#334155" />
      </marker>
      <marker id="v-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
      </marker>
      <marker id="v-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
      </marker>
      <filter id="v-shadow" x="-4%" y="-4%" width="108%" height="108%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.07" />
      </filter>
      <pattern id="v-grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
      </pattern>
    </defs>''')

    # Background
    svg.append('<rect width="960" height="2720" fill="#FFFFFF" />')
    svg.append('<rect width="960" height="2720" fill="url(#v-grid)" opacity="0.6" />')

    # Header
    svg.append('''<g id="v-header">
      <rect x="40" y="24" width="880" height="60" rx="8" fill="#0F172A" />
      <text x="64" y="52" font-size="16" font-weight="800" fill="#FFFFFF" letter-spacing="1">AEGISSEA // OPERATIONAL FORENSIC WORKFLOW PIPELINE</text>
      <text x="64" y="70" font-size="11" font-weight="500" fill="#94A3B8" letter-spacing="0.5">End-to-End Technical Flowchart • Smart India Hackathon 2026 • Team DevAlly</text>
    </g>''')

    # Central spine guideline (x = 480)
    CX = 480

    # =========================================================================
    # PHASE 1: SENSOR INGESTION & GEODETIC PREPROCESSING (Y: 105 to 580)
    # =========================================================================
    svg.append('''<g id="phase1-bg">
      <rect x="40" y="105" width="880" height="495" rx="8" fill="#F0F9FF" stroke="#0284C7" stroke-width="1.2" opacity="0.5" />
      <rect x="40" y="105" width="880" height="30" rx="8" fill="#0284C7" />
      <text x="480" y="125" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">PHASE 1: SENSOR INGESTION &amp; GEODETIC PREPROCESSING</text>
    </g>''')

    # 1. Start Node
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 120}" y="150" width="240" height="40" rx="20" fill="#0F172A" />
      <text x="{CX}" y="175" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">START: SATELLITE PASS / INGEST</text>
    </g>''')

    # 2. Data Input: Sentinel-1 SAR
    svg.append(f'''<g filter="url(#v-shadow)">
      <polygon points="{CX - 170},220 {CX + 190},220 {CX + 160},270 {CX - 200},270" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX - 5}" y="242" font-size="11.5" font-weight="800" fill="#0F172A" text-anchor="middle">Level-1 Sentinel-1 SAR IW GRD Swath</text>
      <text x="{CX - 5}" y="258" font-size="10" font-weight="500" fill="#64748B" text-anchor="middle">ESA Copernicus C-Band (5.405 GHz) • 10m Ground Sample Distance GeoTIFF</text>
    </g>''')

    # 3. Process: Parse Tags
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="295" width="360" height="60" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX}" y="318" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Parse GeoTIFF Geodetic Metadata Tags</text>
      <text x="{CX}" y="338" font-size="10" font-weight="500" fill="#475569" text-anchor="middle">Extract ModelTiepointTag, ModelPixelScaleTag, &amp; Acquisition Timestamp</text>
    </g>''')

    # 4. Decision: WGS-84 Valid?
    svg.append(f'''<g filter="url(#v-shadow)">
      <polygon points="{CX},380 {CX + 120},425 {CX},470 {CX - 120},425" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX}" y="420" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">WGS-84 Coordinates</text>
      <text x="{CX}" y="435" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Present?</text>
    </g>''')

    # 4b. Side branch: Unreferenced fallback
    svg.append('''<g filter="url(#v-shadow)">
      <rect x="670" y="400" width="220" height="50" rx="6" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.5" />
      <text x="780" y="422" font-size="10" font-weight="700" fill="#DC2626" text-anchor="middle">Unreferenced Scene Mode</text>
      <text x="780" y="438" font-size="9" font-weight="500" fill="#64748B" text-anchor="middle">Pixel-space raster analysis fallback</text>
    </g>''')

    # 5. Process: Tiling & Calibration
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="495" width="380" height="75" rx="6" fill="#FFFFFF" stroke="#0284C7" stroke-width="1.5" />
      <text x="{CX}" y="518" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Sliding-Window Patch Generator &amp; Normalizer</text>
      <text x="{CX}" y="538" font-size="10" font-weight="500" fill="#475569" text-anchor="middle">• Extracts 512×512 patches with 20% spatial overlap</text>
      <text x="{CX}" y="555" font-size="10" font-weight="500" fill="#475569" text-anchor="middle">• Decibel (dB) radiometric calibration &amp; dynamic min-max scaling</text>
    </g>''')

    # =========================================================================
    # PHASE 2: AI SEGMENTATION & MORPHOLOGY (Y: 620 to 1130)
    # =========================================================================
    svg.append('''<g id="phase2-bg">
      <rect x="40" y="620" width="880" height="510" rx="8" fill="#FEF2F2" stroke="#DC2626" stroke-width="1.2" opacity="0.5" />
      <rect x="40" y="620" width="880" height="30" rx="8" fill="#DC2626" />
      <text x="480" y="640" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">PHASE 2: AI SEGMENTATION &amp; MORPHOLOGY ENGINE</text>
    </g>''')

    # 6. AI Inference
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 200}" y="670" width="400" height="85" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="2" />
      <rect x="{CX - 200}" y="670" width="6" height="85" rx="2" fill="#DC2626" />
      <text x="{CX}" y="694" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">PyTorch ResNet-34 U-Net Inference</text>
      <text x="{CX}" y="712" font-size="10" font-weight="700" fill="#DC2626" text-anchor="middle">NVIDIA CUDA FP16 Acceleration • 0.826 IoU Benchmark</text>
      <text x="{CX}" y="730" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">Generates 3-Class Softmax Probability Maps: [0: Sea, 1: Mineral Oil, 2: Lookalike]</text>
      <text x="{CX}" y="745" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">Suppresses natural algal blooms, biogenic films, and low-wind calm zones</text>
    </g>''')

    # 7. Mosaic Blending
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="780" width="360" height="55" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="{CX}" y="802" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Mosaic Stitcher &amp; Boundary Blender</text>
      <text x="{CX}" y="820" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Distance-weighted Gaussian blending merges overlapping patch probabilities</text>
    </g>''')

    # 8. Decision: Oil Detected?
    svg.append(f'''<g filter="url(#wf-shadow)">
      <polygon points="{CX},860 {CX + 130},905 {CX},950 {CX - 130},905" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="{CX}" y="900" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Oil Pixels &gt; 500 &amp;</text>
      <text x="{CX}" y="915" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Confidence &gt; 50%?</text>
    </g>''')

    # 8b. Side branch: Clean Sea
    svg.append('''<g filter="url(#v-shadow)">
      <rect x="670" y="880" width="220" height="50" rx="6" fill="#F0FDF4" stroke="#059669" stroke-width="1.5" />
      <text x="780" y="902" font-size="10" font-weight="700" fill="#059669" text-anchor="middle">Clean Sea Verified</text>
      <text x="780" y="918" font-size="9" font-weight="500" fill="#64748B" text-anchor="middle">No discharge detected • Terminate log</text>
    </g>''')

    # 9. Morphology Vectorization
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="975" width="380" height="65" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="{CX}" y="997" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Slick Polygon Vectorization &amp; Morphology</text>
      <text x="{CX}" y="1015" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• OpenCV cv2.findContours converts raster masks into WGS-84 MultiPolygons</text>
      <text x="{CX}" y="1029" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• Computes geometric centroid (Lat₀, Lon₀) and metric surface area (km²)</text>
    </g>''')

    # 10. Bonn Volume Estimation
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="1060" width="360" height="50" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="1.5" />
      <text x="{CX}" y="1082" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">Bonn Agreement Thickness &amp; Volume Model</text>
      <text x="{CX}" y="1098" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Applies standard appearance thickness codes (1–5) to estimate volume in m³</text>
    </g>''')

    # =========================================================================
    # PHASE 3: HYDRODYNAMIC DRIFT HINDCASTING (Y: 1150 to 1640)
    # =========================================================================
    svg.append('''<g id="phase3-bg">
      <rect x="40" y="1150" width="880" height="490" rx="8" fill="#FFFBEB" stroke="#D97706" stroke-width="1.2" opacity="0.5" />
      <rect x="40" y="1150" width="880" height="30" rx="8" fill="#D97706" />
      <text x="480" y="1170" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">PHASE 3: METOCEAN HYDRODYNAMIC DRIFT HINDCASTING</text>
    </g>''')

    # 11. Data Input: Metocean
    svg.append(f'''<g filter="url(#v-shadow)">
      <polygon points="{CX - 170},1200 {CX + 190},1200 {CX + 160},1248 {CX - 200},1248" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="{CX - 5}" y="1222" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">CMEMS Global Ocean Physics &amp; NOAA GFS Wind Ingest</text>
      <text x="{CX - 5}" y="1238" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">Hourly surface currents (u, v) + 10m atmospheric wind velocity fields</text>
    </g>''')

    # 12. Lagrangian RK4 Solver
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 200}" y="1270" width="400" height="90" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="2" />
      <rect x="{CX - 200}" y="1270" width="6" height="90" rx="2" fill="#D97706" />
      <text x="{CX}" y="1294" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">Lagrangian 4th-Order Runge-Kutta (RK4) Solver</text>
      <text x="{CX}" y="1312" font-size="10" font-weight="700" fill="#D97706" text-anchor="middle">Reverse Numerical Integration (-Δt) to Spill Origin</text>
      <text x="{CX}" y="1330" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• Hydrodynamic drift velocity: u_net = u_current + 0.03·u_wind + Stokes drift</text>
      <text x="{CX}" y="1346" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• Steps backward in time: T0 observation ➔ T - 6.5h estimated release time</text>
    </g>''')

    # 13. Reconstructed Origin Locus
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="1380" width="380" height="65" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="{CX}" y="1402" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Reconstructed Discharge Locus &amp; Uncertainty Envelope</text>
      <text x="{CX}" y="1420" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• Pinpoints release coordinates (Lat_origin, Lon_origin) at T - 6.5h</text>
      <text x="{CX}" y="1435" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• Computes dynamic spatial uncertainty radius R(t) = σ_pos + k·t</text>
    </g>''')

    # 14. Forward Dispersion Cone
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="1465" width="360" height="55" rx="6" fill="#FFFFFF" stroke="#D97706" stroke-width="1.5" />
      <text x="{CX}" y="1487" font-size="11" font-weight="700" fill="#0F172A" text-anchor="middle">48-Hour Forward Trajectory &amp; Coastal Impact Cone</text>
      <text x="{CX}" y="1504" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Models forward dispersion plume for environmental shoreline threat warning</text>
    </g>''')

    # 15. Dark Target Cross-Match
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="1540" width="380" height="75" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.5" />
      <rect x="{CX - 190}" y="1540" width="6" height="75" rx="2" fill="#7C3AED" />
      <text x="{CX}" y="1562" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Dark Target Cross-Match (SAR Radar vs AIS Transponders)</text>
      <text x="{CX}" y="1580" font-size="9.5" font-weight="600" fill="#7C3AED" text-anchor="middle">Non-Cooperative Vessel Defense</text>
      <text x="{CX}" y="1598" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Extracts CFAR radar ship signatures and cross-references active AIS positions</text>
    </g>''')

    # =========================================================================
    # PHASE 4: SPATIO-TEMPORAL AIS ATTRIBUTION (Y: 1660 to 2160)
    # =========================================================================
    svg.append('''<g id="phase4-bg">
      <rect x="40" y="1660" width="880" height="500" rx="8" fill="#ECFDF5" stroke="#059669" stroke-width="1.2" opacity="0.5" />
      <rect x="40" y="1660" width="880" height="30" rx="8" fill="#059669" />
      <text x="480" y="1680" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">PHASE 4: SPATIO-TEMPORAL AIS ATTRIBUTION ENGINE</text>
    </g>''')

    # 16. Data Input: NOAA AIS
    svg.append(f'''<g filter="url(#v-shadow)">
      <polygon points="{CX - 170},1710 {CX + 190},1710 {CX + 160},1758 {CX - 200},1758" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="{CX - 5}" y="1732" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">NOAA MarineCadastre AIS Historical Vessel Stream</text>
      <text x="{CX - 5}" y="1748" font-size="9.5" font-weight="500" fill="#64748B" text-anchor="middle">MMSI, vessel dimensions, coordinates, SOG, COG, true heading</text>
    </g>''')

    # 17. Candidate Filter
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="1780" width="360" height="55" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="{CX}" y="1802" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Spatio-Temporal Candidate Query Filter</text>
      <text x="{CX}" y="1820" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Queries bounding box [Locus ± 0.35°] within window [T_origin - 2h, T_origin + 2h]</text>
    </g>''')

    # 18. Kinematic Correlation
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 200}" y="1855" width="400" height="85" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="2" />
      <rect x="{CX - 200}" y="1855" width="6" height="85" rx="2" fill="#059669" />
      <text x="{CX}" y="1878" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">Kinematic Track Correlator &amp; Spline Interpolator</text>
      <text x="{CX}" y="1896" font-size="10" font-weight="700" fill="#059669" text-anchor="middle">Haversine Great-Circle Distance &amp; Time Delta Calculation</text>
      <text x="{CX}" y="1914" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• Computes Closest Point of Approach (CPA) distance to reconstructed origin</text>
      <text x="{CX}" y="1928" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• Evaluates temporal delta (Δt), speed anomalies, and course deviations</text>
    </g>''')

    # 19. Decision: Suspect Correlated?
    svg.append(f'''<g filter="url(#wf-shadow)">
      <polygon points="{CX},1960 {CX + 130},2005 {CX},2050 {CX - 130},2005" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="{CX}" y="2000" font-size="11" font-weight="800" fill="#0F172A" text-anchor="middle">Suspect Correlated?</text>
      <text x="{CX}" y="2015" font-size="10" font-weight="600" fill="#64748B" text-anchor="middle">(CPA &lt; 5km &amp; Δt &lt; 1h)</text>
    </g>''')

    # 19b. Side branch: Dark/Unresolved
    svg.append('''<g filter="url(#v-shadow)">
      <rect x="670" y="1980" width="220" height="50" rx="6" fill="#FFFBEB" stroke="#D97706" stroke-width="1.5" />
      <text x="780" y="2002" font-size="10" font-weight="700" fill="#D97706" text-anchor="middle">Unresolved / Dark Source</text>
      <text x="780" y="2018" font-size="9" font-weight="500" fill="#64748B" text-anchor="middle">Trigger satellite optical re-tasking</text>
    </g>''')

    # 20. Plain-English Attribution
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="2075" width="380" height="65" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="{CX}" y="2097" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Plain-English 'Why Flagged' Evidence Verdict</text>
      <text x="{CX}" y="2115" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• Replaces abstract math scores with transparent kinematic evidence</text>
      <text x="{CX}" y="2129" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">• Ranks candidate vessels and compiles audited track intersection history</text>
    </g>''')

    # =========================================================================
    # PHASE 5: DISPATCH, C2 & LEGAL DOSSIER (Y: 2185 to 2680)
    # =========================================================================
    svg.append('''<g id="phase5-bg">
      <rect x="40" y="2185" width="880" height="490" rx="8" fill="#F5F3FF" stroke="#7C3AED" stroke-width="1.2" opacity="0.5" />
      <rect x="40" y="2185" width="880" height="30" rx="8" fill="#7C3AED" />
      <text x="480" y="2205" font-size="11" font-weight="800" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">PHASE 5: TACTICAL C2, DISPATCH &amp; LEGAL EVIDENCE DOSSIER</text>
    </g>''')

    # 21. Response Routing
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="2235" width="360" height="55" rx="6" fill="#FFFFFF" stroke="#7C3AED" stroke-width="1.5" />
      <text x="{CX}" y="2257" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">NGA World Port Index Response Routing</text>
      <text x="{CX}" y="2275" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Calculates nearest salvage base, geodesic intercept vector, and containment ETA</text>
    </g>''')

    # 22. Tactical C2 Interface
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 190}" y="2310" width="380" height="60" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" />
      <rect x="{CX - 190}" y="2310" width="6" height="60" rx="2" fill="#0F172A" />
      <text x="{CX}" y="2333" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">Tactical C2 Tri-Pane Interface &amp; Replay Simulator</text>
      <text x="{CX}" y="2352" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Next.js 14 + Leaflet GIS: Real-time slick contours, range rings, and 4-step replay</text>
    </g>''')

    # 23. 7-Page Dossier Export
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 200}" y="2390" width="400" height="85" rx="6" fill="#FFFFFF" stroke="#DC2626" stroke-width="2" />
      <rect x="{CX - 200}" y="2390" width="6" height="85" rx="2" fill="#DC2626" />
      <text x="{CX}" y="2413" font-size="12" font-weight="800" fill="#0F172A" text-anchor="middle">Automated 7-Page Legal Evidence Dossier Export</text>
      <text x="{CX}" y="2431" font-size="10" font-weight="700" fill="#DC2626" text-anchor="middle">Court-Admissible Forensic Intelligence Artifact</text>
      <text x="{CX}" y="2449" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• Sentinel-1 geodetic provenance, U-Net masks, and IoU validation metrics</text>
      <text x="{CX}" y="2463" font-size="9.5" font-weight="500" fill="#334155" text-anchor="middle">• RK4 drift trajectory logs, suspect vessel registry, and SHA-256 custody hash</text>
    </g>''')

    # 24. Agency Dispatch
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 180}" y="2495" width="360" height="55" rx="6" fill="#FFFFFF" stroke="#059669" stroke-width="1.5" />
      <text x="{CX}" y="2517" font-size="11.5" font-weight="700" fill="#0F172A" text-anchor="middle">Multi-Channel Agency Alert Broadcast</text>
      <text x="{CX}" y="2535" font-size="9.5" font-weight="500" fill="#475569" text-anchor="middle">Dispatches real-time alerts to Indian Coast Guard (ICG) Ops &amp; DG Shipping</text>
    </g>''')

    # 25. Terminal End
    svg.append(f'''<g filter="url(#v-shadow)">
      <rect x="{CX - 120}" y="2570" width="240" height="40" rx="20" fill="#0F172A" />
      <text x="{CX}" y="2595" font-size="12" font-weight="800" fill="#FFFFFF" text-anchor="middle">END: INTERCEPTION LOGGED</text>
    </g>''')

    # =========================================================================
    # VERTICAL SPINE CONNECTORS
    # =========================================================================
    svg.append('<g id="v-connectors">')
    # Phase 1
    svg.append(f'<line x1="{CX}" y1="190" x2="{CX}" y2="220" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="270" x2="{CX}" y2="295" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="355" x2="{CX}" y2="380" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    
    # Decision 1
    svg.append(f'<line x1="{CX}" y1="470" x2="{CX}" y2="495" stroke="#059669" stroke-width="2" marker-end="url(#v-arrow-green)" />')
    svg.append(f'<text x="{CX + 8}" y="485" font-size="10" font-weight="800" fill="#059669">YES</text>')

    svg.append(f'<line x1="{CX + 120}" y1="425" x2="670" y2="425" stroke="#DC2626" stroke-width="2" marker-end="url(#v-arrow-red)" />')
    svg.append(f'<text x="{CX + 130}" y="420" font-size="10" font-weight="800" fill="#DC2626">NO</text>')

    # Phase 1 to Phase 2
    svg.append(f'<line x1="{CX}" y1="570" x2="{CX}" y2="670" stroke="#DC2626" stroke-width="2.5" marker-end="url(#v-arrow-red)" />')

    # Phase 2
    svg.append(f'<line x1="{CX}" y1="755" x2="{CX}" y2="780" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="835" x2="{CX}" y2="860" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')

    # Decision 2
    svg.append(f'<line x1="{CX}" y1="950" x2="{CX}" y2="975" stroke="#DC2626" stroke-width="2" marker-end="url(#v-arrow-red)" />')
    svg.append(f'<text x="{CX + 8}" y="965" font-size="10" font-weight="800" fill="#DC2626">YES</text>')

    svg.append(f'<line x1="{CX + 130}" y1="905" x2="670" y2="905" stroke="#059669" stroke-width="2" marker-end="url(#v-arrow-green)" />')
    svg.append(f'<text x="{CX + 140}" y="900" font-size="10" font-weight="800" fill="#059669">NO</text>')

    svg.append(f'<line x1="{CX}" y1="1040" x2="{CX}" y2="1060" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')

    # Phase 2 to Phase 3
    svg.append(f'<line x1="{CX}" y1="1110" x2="{CX}" y2="1200" stroke="#D97706" stroke-width="2.5" marker-end="url(#v-arrow)" />')

    # Phase 3
    svg.append(f'<line x1="{CX}" y1="1248" x2="{CX}" y2="1270" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="1360" x2="{CX}" y2="1380" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="1445" x2="{CX}" y2="1465" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="1520" x2="{CX}" y2="1540" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')

    # Phase 3 to Phase 4
    svg.append(f'<line x1="{CX}" y1="1615" x2="{CX}" y2="1710" stroke="#059669" stroke-width="2.5" marker-end="url(#v-arrow-green)" />')

    # Phase 4
    svg.append(f'<line x1="{CX}" y1="1758" x2="{CX}" y2="1780" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="1835" x2="{CX}" y2="1855" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="1940" x2="{CX}" y2="1960" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')

    # Decision 3
    svg.append(f'<line x1="{CX}" y1="2050" x2="{CX}" y2="2075" stroke="#059669" stroke-width="2" marker-end="url(#v-arrow-green)" />')
    svg.append(f'<text x="{CX + 8}" y="2065" font-size="10" font-weight="800" fill="#059669">YES</text>')

    svg.append(f'<line x1="{CX + 130}" y1="2005" x2="670" y2="2005" stroke="#D97706" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<text x="{CX + 140}" y="2000" font-size="10" font-weight="800" fill="#D97706">NO</text>')

    # Phase 4 to Phase 5
    svg.append(f'<line x1="{CX}" y1="2140" x2="{CX}" y2="2235" stroke="#7C3AED" stroke-width="2.5" marker-end="url(#v-arrow)" />')

    # Phase 5
    svg.append(f'<line x1="{CX}" y1="2290" x2="{CX}" y2="2310" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="2370" x2="{CX}" y2="2390" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="2475" x2="{CX}" y2="2495" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')
    svg.append(f'<line x1="{CX}" y1="2550" x2="{CX}" y2="2570" stroke="#334155" stroke-width="2" marker-end="url(#v-arrow)" />')

    svg.append('</g>')
    svg.append('</svg>')

    full_svg = '\n'.join(svg)
    ET.fromstring(full_svg)
    print("Vertical Workflow SVG Validated 100% OK!")
    return full_svg

if __name__ == '__main__':
    content = generate_vertical_svg()
    # Save to both standard names and vertical names
    with open('c:/Nirmal/oil-leak/workflow_diagram_vertical.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram_vertical.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Vertical Workflow SVG successfully saved!")
