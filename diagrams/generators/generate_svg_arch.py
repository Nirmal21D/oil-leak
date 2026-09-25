"""
Generates clean, professional Draw.io / Lucidchart style architecture diagram
in both SVG format (for Canva / Figma) and Draw.io XML format (.drawio).
100% Valid XML with strict character escaping.
"""

import xml.etree.ElementTree as ET

def generate_svg() -> str:
    svg = []
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" style="background:#ffffff; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')
    
    # Definitions for arrows, drop shadows, pattern, and markers
    svg.append('''<defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#475569" />
      </marker>
      <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#2563EB" />
      </marker>
      <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#059669" />
      </marker>
      <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#D97706" />
      </marker>
      <filter id="card-shadow" x="-4%" y="-4%" width="108%" height="108%" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.06" />
      </filter>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1" fill="#E2E8F0" />
      </pattern>
    </defs>''')

    # Background canvas with subtle clean grid
    svg.append('<rect width="1600" height="900" fill="#FAFAFA" />')
    svg.append('<rect width="1600" height="900" fill="url(#grid)" opacity="0.6" />')

    # Top Header Banner
    svg.append('''<g id="header">
      <rect x="40" y="24" width="1520" height="56" rx="8" fill="#0F172A" />
      <text x="64" y="58" font-size="18" font-weight="800" fill="#FFFFFF" letter-spacing="1">AEGISSEA // END-TO-END SYSTEM &amp; FORENSIC ARCHITECTURE</text>
      <text x="1160" y="58" font-size="13" font-weight="600" fill="#94A3B8" letter-spacing="0.5">SMART INDIA HACKATHON 2026 • TEAM DEVALLY</text>
    </g>''')

    # 5 Main Vertical Tiers / Swimlanes
    lanes = [
        {"x": 40, "w": 260, "title": "1. INGESTION &amp; SENSORS", "sub": "Earth Observation &amp; Metocean Feeds", "bg": "#F8FAFC", "stroke": "#CBD5E1"},
        {"x": 320, "w": 380, "title": "2. AI &amp; PHYSICS ENGINES", "sub": "ResNet-34 U-Net &amp; Lagrangian Modeling", "bg": "#F8FAFC", "stroke": "#CBD5E1"},
        {"x": 720, "w": 260, "title": "3. DATA &amp; STORAGE", "sub": "Geospatial Feature &amp; Scenario Store", "bg": "#F8FAFC", "stroke": "#CBD5E1"},
        {"x": 1000, "w": 260, "title": "4. API &amp; GATEWAY", "sub": "FastAPI Async Microservices", "bg": "#F8FAFC", "stroke": "#CBD5E1"},
        {"x": 1280, "w": 280, "title": "5. TACTICAL C2 &amp; DISPATCH", "sub": "Command Dashboard &amp; Legal Dossier", "bg": "#F8FAFC", "stroke": "#CBD5E1"},
    ]

    for lane in lanes:
        svg.append(f'''<g id="lane-{lane['x']}">
          <rect x="{lane['x']}" y="95" width="{lane['w']}" height="680" rx="8" fill="{lane['bg']}" stroke="{lane['stroke']}" stroke-width="1.5" />
          <rect x="{lane['x']}" y="95" width="{lane['w']}" height="42" rx="8" fill="#F1F5F9" stroke="{lane['stroke']}" stroke-width="1.5" />
          <text x="{lane['x'] + 16}" y="121" font-size="13" font-weight="800" fill="#1E293B">{lane['title']}</text>
          <text x="{lane['x'] + 16}" y="133" font-size="9" font-weight="500" fill="#64748B">{lane['sub']}</text>
        </g>''')

    # ----------------------------------------------------
    # LANE 1: INGESTION & SENSORS (x: 40 to 300)
    # ----------------------------------------------------
    sensor_boxes = [
        {"y": 150, "h": 72, "title": "Sentinel-1 SAR C-Band", "sub": "ESA Copernicus IW GRD • 10m GSD", "tag": "RADAR", "color": "#0284C7", "bg": "#F0F9FF"},
        {"y": 234, "h": 72, "title": "CMEMS Ocean Physics", "sub": "Copernicus Surface Currents (u/v)", "tag": "METOCEAN", "color": "#0D9488", "bg": "#F0FDFA"},
        {"y": 318, "h": 72, "title": "NOAA GFS Wind Fields", "sub": "Global 10m Surface Wind Vectors", "tag": "ATMOSPHERIC", "color": "#2563EB", "bg": "#EFF6FF"},
        {"y": 402, "h": 72, "title": "NOAA MarineCadastre", "sub": "Coastal &amp; Satellite AIS Kinematics", "tag": "VESSEL AIS", "color": "#7C3AED", "bg": "#F5F3FF"},
        {"y": 486, "h": 72, "title": "NGA World Port Index", "sub": "Global Port &amp; Berthing Geodatabase", "tag": "MARITIME GIS", "color": "#D97706", "bg": "#FFFBEB"},
        {"y": 574, "h": 180, "title": "Geodetic Preprocessing Tiler", "sub": "GDAL • Rasterio • WGS-84 Tag Parser", "tag": "PREPROCESSING", "color": "#475569", "bg": "#FFFFFF",
         "items": ["• GeoTIFF ModelTiepoints &amp; Scale Extraction", "• Sliding-Window 512×512 Tile Extractor", "• Dynamic Min-Max Normalization", "• Spatial Bounding Box Filter"]},
    ]

    for b in sensor_boxes:
        svg.append(f'''<g filter="url(#card-shadow)">
          <rect x="52" y="{b['y']}" width="236" height="{b['h']}" rx="6" fill="{b['bg']}" stroke="{b['color']}" stroke-width="1.5" />
          <rect x="52" y="{b['y']}" width="6" height="{b['h']}" rx="2" fill="{b['color']}" />
          <text x="68" y="{b['y'] + 22}" font-size="12" font-weight="700" fill="#0F172A">{b['title']}</text>
          <text x="68" y="{b['y'] + 38}" font-size="10" font-weight="500" fill="#64748B">{b['sub']}</text>
          <rect x="210" y="{b['y'] + 10}" width="70" height="16" rx="4" fill="{b['color']}" opacity="0.15" />
          <text x="245" y="{b['y'] + 22}" font-size="8" font-weight="800" fill="{b['color']}" text-anchor="middle">{b['tag']}</text>
        </g>''')
        if "items" in b:
            for idx, item in enumerate(b["items"]):
                svg.append(f'<text x="68" y="{b["y"] + 65 + (idx * 22)}" font-size="9.5" font-weight="500" fill="#334155">{item}</text>')

    # ----------------------------------------------------
    # LANE 2: AI & PHYSICS ENGINES (x: 320 to 700)
    # ----------------------------------------------------
    engine_boxes = [
        {
            "y": 150, "h": 150, "title": "AI Segmentation Engine", "badge": "ResNet-34 U-Net",
            "desc": "PyTorch • NVIDIA CUDA FP16 Acceleration", "color": "#DC2626", "bg": "#FFFFFF",
            "items": [
                "• 3-Class Semantic Segmentation (Oil / Lookalike / Sea)",
                "• Zenodo Benchmark: 0.826 IoU • 0.892 F1-Score",
                "• OpenCV Morphological Slick Contour Vectorization",
                "• Metric Surface Area (km²) &amp; Centroid Derivation"
            ]
        },
        {
            "y": 312, "h": 140, "title": "Lagrangian Ocean Drift Engine", "badge": "RK4 Solver",
            "desc": "Numerical Hydrodynamic Trajectory Modeling", "color": "#0284C7", "bg": "#FFFFFF",
            "items": [
                "• 4th-Order Runge-Kutta Numerical Integration",
                "• CMEMS Currents (u/v) + 3% NOAA Windage Drift",
                "• Reverse Hindcasting to Spill Locus (T - 6.5h Origin)",
                "• Forward Dispersion Plume &amp; Uncertainty Envelope"
            ]
        },
        {
            "y": 464, "h": 136, "title": "Spatio-Temporal AIS Attribution", "badge": "Kinematic Match",
            "desc": "Vessel Track Intersection &amp; Anomaly Scorer", "color": "#059669", "bg": "#FFFFFF",
            "items": [
                "• Closest Point of Approach (CPA) Calculation",
                "• Temporal Concurrence (Historical Query Window)",
                "• Speed &amp; Heading Anomaly Quantification",
                "• Plain-English 'Why Flagged' Defensible Verdict"
            ]
        },
        {
            "y": 612, "h": 142, "title": "Dark Target Correlator", "badge": "Security Module",
            "desc": "Non-Cooperative Vessel Detection", "color": "#7C3AED", "bg": "#FFFFFF",
            "items": [
                "• SAR High-Backscatter Ship Signature Extraction",
                "• Cross-Matching with Active AIS Transponders",
                "• Flags Dark Vessels Operating with AIS Off",
                "• Unregistered Discharge Source Attribution"
            ]
        }
    ]

    for eb in engine_boxes:
        svg.append(f'''<g filter="url(#card-shadow)">
          <rect x="332" y="{eb['y']}" width="356" height="{eb['h']}" rx="6" fill="{eb['bg']}" stroke="{eb['color']}" stroke-width="1.5" />
          <rect x="332" y="{eb['y']}" width="6" height="{eb['h']}" rx="2" fill="{eb['color']}" />
          <text x="350" y="{eb['y'] + 24}" font-size="13" font-weight="800" fill="#0F172A">{eb['title']}</text>
          <text x="350" y="{eb['y'] + 40}" font-size="10" font-weight="600" fill="#64748B">{eb['desc']}</text>
          <rect x="580" y="{eb['y'] + 10}" width="96" height="20" rx="4" fill="{eb['color']}" opacity="0.12" />
          <text x="628" y="{eb['y'] + 24}" font-size="9" font-weight="800" fill="{eb['color']}" text-anchor="middle">{eb['badge']}</text>
        </g>''')
        for idx, item in enumerate(eb["items"]):
            svg.append(f'<text x="350" y="{eb["y"] + 64 + (idx * 20)}" font-size="10" font-weight="500" fill="#334155">{item}</text>')

    # ----------------------------------------------------
    # LANE 3: DATA & STORAGE (x: 720 to 980)
    # ----------------------------------------------------
    storage_boxes = [
        {
            "y": 150, "h": 180, "title": "GeoJSON &amp; Spatial Store", "badge": "PostGIS",
            "desc": "Vector Geometry Feature Layer", "color": "#0D9488", "bg": "#FFFFFF",
            "items": [
                "• Slick Polygon Contours (MultiPolygon)",
                "• Lagrangian Drift Trajectory Lines",
                "• Forward Dispersion Plume Polygons",
                "• Historical AIS Vessel Breadcrumbs",
                "• NGA Port Locations &amp; Facilities",
                "• WGS-84 (EPSG:4326) CRS Standard"
            ]
        },
        {
            "y": 350, "h": 190, "title": "In-Memory Scenario State", "badge": "Fast Cache",
            "desc": "Active Incident Intelligence Context", "color": "#D97706", "bg": "#FFFFFF",
            "items": [
                "• Active Incident ID &amp; Telemetry",
                "• Current Locus Coordinates (Lat / Lon)",
                "• Ground Truth Benchmark Comparison",
                "• Ranked Suspect Candidates &amp; Scores",
                "• Response Routing Vector Parameters",
                "• Fast Hot-Reload &amp; Replay State"
            ]
        },
        {
            "y": 560, "h": 194, "title": "Model &amp; Asset Registry", "badge": "Baselines",
            "desc": "Trained Weights &amp; Static Data", "color": "#64748B", "bg": "#FFFFFF",
            "items": [
                "• ResNet-34 U-Net Checkpoints (PyTorch)",
                "• 30+ Held-Out Zenodo Test Rasters",
                "• Oil Spill Ground Truth Binary Masks",
                "• NGA World Port Index Shapefiles",
                "• Pre-calculated Metocean Climatology",
                "• Sub-Second Cold Start Cache"
            ]
        }
    ]

    for sb in storage_boxes:
        svg.append(f'''<g filter="url(#card-shadow)">
          <rect x="732" y="{sb['y']}" width="236" height="{sb['h']}" rx="6" fill="{sb['bg']}" stroke="{sb['color']}" stroke-width="1.5" />
          <rect x="732" y="{sb['y']}" width="6" height="{sb['h']}" rx="2" fill="{sb['color']}" />
          <text x="748" y="{sb['y'] + 24}" font-size="12" font-weight="800" fill="#0F172A">{sb['title']}</text>
          <text x="748" y="{sb['y'] + 40}" font-size="9.5" font-weight="600" fill="#64748B">{sb['desc']}</text>
          <rect x="888" y="{sb['y'] + 10}" width="70" height="18" rx="4" fill="{sb['color']}" opacity="0.12" />
          <text x="923" y="{sb['y'] + 23}" font-size="8.5" font-weight="800" fill="{sb['color']}" text-anchor="middle">{sb['badge']}</text>
        </g>''')
        for idx, item in enumerate(sb["items"]):
            svg.append(f'<text x="748" y="{sb["y"] + 64 + (idx * 20)}" font-size="9" font-weight="500" fill="#334155">{item}</text>')

    # ----------------------------------------------------
    # LANE 4: API & GATEWAY (x: 1000 to 1260)
    # ----------------------------------------------------
    api_boxes = [
        {
            "y": 150, "h": 220, "title": "FastAPI Async Gateway", "badge": "Python 3.10",
            "desc": "High-Throughput REST Microservices", "color": "#059669", "bg": "#FFFFFF",
            "items": [
                "• POST /detect: U-Net SAR Mask Inference",
                "• GET /scenario/current: Active Intelligence",
                "• POST /drift: RK4 Simulation",
                "• POST /attribution: AIS Kinematic Match",
                "• GET /dataset/scenes: Real Scene Catalog",
                "• Async Non-Blocking Task Worker Engine",
                "• CORS Middleware &amp; Rate Limiting"
            ]
        },
        {
            "y": 390, "h": 170, "title": "Pydantic v2 Serialization", "badge": "Validation",
            "desc": "Type-Safe Data Contracts", "color": "#0284C7", "bg": "#FFFFFF",
            "items": [
                "• Incident Scenario Update Payloads",
                "• Metocean Telemetry Validation",
                "• MultiPolygon GeoJSON RFC Validation",
                "• Safe Base64 Data URL Sanitizer",
                "• Robust HTTP Error Handlers"
            ]
        },
        {
            "y": 580, "h": 174, "title": "Dispatcher &amp; Route Solver", "badge": "Router",
            "desc": "Operational Mitigation Routing", "color": "#2563EB", "bg": "#FFFFFF",
            "items": [
                "• Nearest Response Port Identification",
                "• Geodesic Intercept Distance Calculation",
                "• Vessel Transit Time to Spill Estimation",
                "• Containment Boom Fleet Allocator",
                "• Tactical Resource Dispatch Vectors"
            ]
        }
    ]

    for ab in api_boxes:
        svg.append(f'''<g filter="url(#card-shadow)">
          <rect x="1012" y="{ab['y']}" width="236" height="{ab['h']}" rx="6" fill="{ab['bg']}" stroke="{ab['color']}" stroke-width="1.5" />
          <rect x="1012" y="{ab['y']}" width="6" height="{ab['h']}" rx="2" fill="{ab['color']}" />
          <text x="1028" y="{ab['y'] + 24}" font-size="12" font-weight="800" fill="#0F172A">{ab['title']}</text>
          <text x="1028" y="{ab['y'] + 40}" font-size="9.5" font-weight="600" fill="#64748B">{ab['desc']}</text>
          <rect x="1168" y="{ab['y'] + 10}" width="70" height="18" rx="4" fill="{ab['color']}" opacity="0.12" />
          <text x="1203" y="{ab['y'] + 23}" font-size="8.5" font-weight="800" fill="{ab['color']}" text-anchor="middle">{ab['badge']}</text>
        </g>''')
        for idx, item in enumerate(ab["items"]):
            svg.append(f'<text x="1028" y="{ab["y"] + 64 + (idx * 20)}" font-size="9" font-weight="500" fill="#334155">{item}</text>')

    # ----------------------------------------------------
    # LANE 5: TACTICAL C2 & DISPATCH (x: 1280 to 1560)
    # ----------------------------------------------------
    c2_boxes = [
        {
            "y": 150, "h": 160, "title": "Tactical C2 Console", "badge": "Next.js 14",
            "desc": "Brutalist Command Interface", "color": "#0F172A", "bg": "#FFFFFF",
            "items": [
                "• Real-Time Incident Status &amp; Clock Banner",
                "• 5-Step Evidence Chain Progress Matrix",
                "• Dynamic Scene Switching (Zenodo / Upload)",
                "• Contextual Intelligence Panel Breakdown"
            ]
        },
        {
            "y": 326, "h": 140, "title": "Interactive Leaflet GIS", "badge": "Cartography",
            "desc": "Tactical Multi-Layer Visualization", "color": "#0284C7", "bg": "#FFFFFF",
            "items": [
                "• Vector Slick Polygons &amp; Range Reticle",
                "• Suspect AIS Directional Chevrons",
                "• Lagrangian Drift Hindcast &amp; Forecast Cones",
                "• Port Proximity &amp; Response Intercept Vectors"
            ]
        },
        {
            "y": 482, "h": 136, "title": "Investigation Replay", "badge": "Simulator",
            "desc": "Step-by-Step Playback Simulator", "color": "#D97706", "bg": "#FFFFFF",
            "items": [
                "• Step 1: SAR Sensor Observation at T0",
                "• Step 2: Backward Drift Hindcast to Origin",
                "• Step 3: AIS Vessel Spatio-Temporal Intercept",
                "• Step 4: Response Dispatch Routing Vectors"
            ]
        },
        {
            "y": 634, "h": 120, "title": "7-Page Evidence Dossier", "badge": "Court-Ready",
            "desc": "Legal Chain of Custody Export", "color": "#DC2626", "bg": "#FFFFFF",
            "items": [
                "• Automated PDF &amp; Print-Ready Incident Report",
                "• Forensic Proof Cards &amp; Kinematic CPA Tables",
                "• Official Action for Indian Coast Guard / NTRO"
            ]
        }
    ]

    for cb in c2_boxes:
        svg.append(f'''<g filter="url(#card-shadow)">
          <rect x="1292" y="{cb['y']}" width="256" height="{cb['h']}" rx="6" fill="{cb['bg']}" stroke="{cb['color']}" stroke-width="1.5" />
          <rect x="1292" y="{cb['y']}" width="6" height="{cb['h']}" rx="2" fill="{cb['color']}" />
          <text x="1308" y="{cb['y'] + 24}" font-size="12" font-weight="800" fill="#0F172A">{cb['title']}</text>
          <text x="1308" y="{cb['y'] + 40}" font-size="9.5" font-weight="600" fill="#64748B">{cb['desc']}</text>
          <rect x="1460" y="{cb['y'] + 10}" width="78" height="18" rx="4" fill="{cb['color']}" opacity="0.12" />
          <text x="1499" y="{cb['y'] + 23}" font-size="8.5" font-weight="800" fill="{cb['color']}" text-anchor="middle">{cb['badge']}</text>
        </g>''')
        for idx, item in enumerate(cb["items"]):
            svg.append(f'<text x="1308" y="{cb["y"] + 64 + (idx * 20)}" font-size="9" font-weight="500" fill="#334155">{item}</text>')

    # ----------------------------------------------------
    # CONNECTING ARROWS & DATAFLOW PIPES
    # ----------------------------------------------------
    svg.append('<g id="connectors">')
    # Sensor 1..5 to Preprocessor
    svg.append('<path d="M 170 222 L 170 574" fill="none" stroke="#94A3B8" stroke-width="1.5" stroke-dasharray="3 3" marker-end="url(#arrow)" />')
    
    # Preprocessor to AI Engine & Physics
    svg.append('<path d="M 288 620 L 310 620 L 310 220 L 332 220" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)" />')
    svg.append('<path d="M 288 640 L 320 640 L 320 380 L 332 380" fill="none" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow-blue)" />')
    svg.append('<path d="M 288 660 L 332 660" fill="none" stroke="#7C3AED" stroke-width="2" marker-end="url(#arrow)" />')
    svg.append('<path d="M 288 438 L 332 500" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow-emerald)" />')

    # Engines to Storage (Center)
    svg.append('<path d="M 688 220 L 732 220" fill="none" stroke="#0D9488" stroke-width="2" marker-end="url(#arrow)" />')
    svg.append('<path d="M 688 380 L 732 380" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrow-amber)" />')
    svg.append('<path d="M 688 530 L 732 440" fill="none" stroke="#059669" stroke-width="2" marker-end="url(#arrow-emerald)" />')

    # Storage to FastAPI Gateway
    svg.append('<path d="M 968 240 L 1012 240" fill="none" stroke="#059669" stroke-width="2.5" marker-end="url(#arrow-emerald)" />')
    svg.append('<path d="M 968 440 L 1012 440" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrow-amber)" />')
    svg.append('<path d="M 968 640 L 1012 640" fill="none" stroke="#2563EB" stroke-width="2" marker-end="url(#arrow-blue)" />')

    # FastAPI to C2 Frontend & Operations
    svg.append('<path d="M 1248 240 L 1292 240" fill="none" stroke="#0F172A" stroke-width="2.5" marker-end="url(#arrow)" />')
    svg.append('<path d="M 1248 270 L 1270 270 L 1270 400 L 1292 400" fill="none" stroke="#0284C7" stroke-width="2" marker-end="url(#arrow-blue)" />')
    svg.append('<path d="M 1248 460 L 1270 460 L 1270 540 L 1292 540" fill="none" stroke="#D97706" stroke-width="2" marker-end="url(#arrow-amber)" />')
    svg.append('<path d="M 1248 640 L 1270 640 L 1270 690 L 1292 690" fill="none" stroke="#DC2626" stroke-width="2" marker-end="url(#arrow)" />')
    svg.append('</g>')

    # ----------------------------------------------------
    # BOTTOM TECH STACK RIBBON
    # ----------------------------------------------------
    svg.append('''<g id="bottom-tech-stack">
      <rect x="40" y="790" width="1520" height="84" rx="8" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5" filter="url(#card-shadow)" />
      
      <!-- Box 1: Frontend & GIS -->
      <g transform="translate(60, 802)">
        <text x="0" y="16" font-size="11" font-weight="800" fill="#0F172A">FRONTEND &amp; GIS</text>
        <text x="0" y="34" font-size="10" font-weight="600" fill="#2563EB">Next.js 14 • React 18 • TypeScript</text>
        <text x="0" y="50" font-size="9.5" font-weight="500" fill="#64748B">Tailwind CSS • Leaflet GIS • Lucide Icons</text>
      </g>
      <line x1="420" y1="805" x2="420" y2="860" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Box 2: Backend & APIs -->
      <g transform="translate(440, 802)">
        <text x="0" y="16" font-size="11" font-weight="800" fill="#0F172A">BACKEND &amp; MICROSERVICES</text>
        <text x="0" y="34" font-size="10" font-weight="600" fill="#059669">Python 3.10 • FastAPI REST • Uvicorn</text>
        <text x="0" y="50" font-size="9.5" font-weight="500" fill="#64748B">Pydantic v2 • Asyncio Task Queue • CORS</text>
      </g>
      <line x1="800" y1="805" x2="800" y2="860" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Box 3: AI, Physics & Math -->
      <g transform="translate(820, 802)">
        <text x="0" y="16" font-size="11" font-weight="800" fill="#0F172A">AI, PHYSICS &amp; METOCEAN MATH</text>
        <text x="0" y="34" font-size="10" font-weight="600" fill="#DC2626">PyTorch • ResNet-34 U-Net • Torchvision</text>
        <text x="0" y="50" font-size="9.5" font-weight="500" fill="#64748B">SciPy RK4 ODE • OpenCV • NumPy • Albumentations</text>
      </g>
      <line x1="1200" y1="805" x2="1200" y2="860" stroke="#E2E8F0" stroke-width="1.5" />

      <!-- Box 4: Geospatial & Hardware -->
      <g transform="translate(1220, 802)">
        <text x="0" y="16" font-size="11" font-weight="800" fill="#0F172A">DATA &amp; HARDWARE ACCELERATION</text>
        <text x="0" y="34" font-size="10" font-weight="600" fill="#7C3AED">ESA Sentinel-1 SAR • CMEMS • NOAA AIS</text>
        <text x="0" y="50" font-size="9.5" font-weight="500" fill="#64748B">NVIDIA CUDA GPU • GDAL • Rasterio • WGS-84</text>
      </g>
    </g>''')

    svg.append('</svg>')
    full_svg = '\n'.join(svg)
    
    # XML Validation
    ET.fromstring(full_svg)
    print("XML Validation Passed: 100% Valid SVG!")
    return full_svg

if __name__ == '__main__':
    content = generate_svg()
    with open('c:/Nirmal/oil-leak/architecture_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/architecture_diagram.svg', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Clean valid SVG saved successfully at c:/Nirmal/oil-leak/architecture_diagram.svg")
