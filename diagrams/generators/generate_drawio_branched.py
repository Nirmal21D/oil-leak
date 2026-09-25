"""
Generates an editable .drawio XML file for the branched vertical workflow flowchart.
Can be directly opened in draw.io / diagrams.net.
"""

def generate_drawio_branched_xml() -> str:
    xml = []
    xml.append('<mxfile host="app.diagrams.net" modified="2026-09-24T20:40:00.000Z" agent="AegisSea" version="21.0.0" type="device">')
    xml.append('  <diagram id="aegissea-branched-wf" name="AegisSea Branched Workflow">')
    xml.append('    <mxGraphModel dx="1400" dy="1150" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1400" pageHeight="1150" background="#FFFFFF" math="0" shadow="0">')
    xml.append('      <root>')
    xml.append('        <mxCell id="0" />')
    xml.append('        <mxCell id="1" parent="0" />')

    # Header
    xml.append('        <mxCell id="b_header" value="&lt;b&gt;AEGISSEA // OPERATIONAL FORENSIC WORKFLOW PIPELINE&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 11px;&quot;&gt;Branched Technical Flowchart • Smart India Hackathon 2026 • Team DevAlly&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=15;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="40" y="20" width="1320" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    CX = 700

    # Start
    xml.append(f'        <mxCell id="b_start" value="&lt;b&gt;START&lt;/b&gt;&lt;br&gt;Satellite Pass / Ingest" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 120}" y="90" width="240" height="35" as="geometry" />')
    xml.append('        </mxCell>')

    # S1 Ingest
    xml.append(f'        <mxCell id="b_s1" value="&lt;b&gt;Level-1 Sentinel-1 SAR IW GRD (C-Band 10m GeoTIFF)&lt;/b&gt;&lt;br&gt;ESA Copernicus All-Weather Radar Acquisition" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#F0F9FF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=10.5;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 200}" y="140" width="400" height="42" as="geometry" />')
    xml.append('        </mxCell>')

    # Preprocessing
    xml.append(f'        <mxCell id="b_tiler" value="&lt;b&gt;WGS-84 Tag Parsing &amp;amp; 512×512 Sliding-Window Tiler&lt;/b&gt;&lt;br&gt;ModelTiepointTag georeferencing • 20% patch overlap • dB normalization" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=10.5;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 210}" y="196" width="420" height="48" as="geometry" />')
    xml.append('        </mxCell>')

    # Track A Group (Left)
    xml.append('        <mxCell id="grp_a" value="&lt;b&gt;TRACK A: NEURAL SAR SEGMENTATION &amp;amp; MORPHOLOGY&lt;/b&gt;" style="swimlane;startSize=26;rounded=1;whiteSpace=wrap;html=1;fillColor=#FEF2F2;strokeColor=#DC2626;fontColor=#DC2626;fontSize=11;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="70" y="270" width="580" height="175" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="a_unet" value="&lt;b&gt;ResNet-34 U-Net (PyTorch CUDA)&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626; font-size: 9px;&quot;&gt;0.826 IoU • 0.892 F1 Benchmark&lt;/font&gt;&lt;br&gt;Multi-class: Oil vs Lookalikes vs Sea" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=10;" vertex="1" parent="grp_a">')
    xml.append('          <mxGeometry x="15" y="36" width="265" height="58" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="a_dec" value="&lt;b&gt;Oil Pixels &gt; 500?&lt;/b&gt;&lt;br&gt;Conf &gt; 50%?" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=9.5;" vertex="1" parent="grp_a">')
    xml.append('          <mxGeometry x="295" y="32" width="120" height="65" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="a_clean" value="&lt;b&gt;Clean Sea Verified&lt;/b&gt;&lt;br&gt;Zero discharge logged" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F0FDF4;strokeColor=#059669;fontColor=#059669;fontSize=9;" vertex="1" parent="grp_a">')
    xml.append('          <mxGeometry x="430" y="44" width="135" height="42" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="a_morph" value="&lt;b&gt;OpenCV Vector Contours, Centroid &amp;amp; Bonn Volume Estimation&lt;/b&gt;&lt;br&gt;• Extracts slick centroid (Lat₀, Lon₀) and metric surface area (km²)&lt;br&gt;• Applies Bonn Agreement appearance codes to derive estimated volume (m³)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="grp_a">')
    xml.append('          <mxGeometry x="15" y="106" width="550" height="56" as="geometry" />')
    xml.append('        </mxCell>')

    # Track B Group (Right)
    xml.append('        <mxCell id="grp_b" value="&lt;b&gt;TRACK B: METOCEAN &amp;amp; MARITIME STREAM INGESTION&lt;/b&gt;" style="swimlane;startSize=26;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFBEB;strokeColor=#D97706;fontColor=#D97706;fontSize=11;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="750" y="270" width="580" height="175" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="b_cmems" value="&lt;b&gt;Copernicus (CMEMS) Hydrodynamics&lt;/b&gt;&lt;br&gt;Hourly Surface Velocity Vectors (u, v)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;fontColor=#0F172A;fontSize=10;" vertex="1" parent="grp_b">')
    xml.append('          <mxGeometry x="15" y="36" width="265" height="58" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="b_wind" value="&lt;b&gt;NOAA GFS Surface Winds&lt;/b&gt;&lt;br&gt;10m Atmospheric Wind Vectors (Wx, Wy)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#2563EB;fontColor=#0F172A;fontSize=10;" vertex="1" parent="grp_b">')
    xml.append('          <mxGeometry x="295" y="36" width="270" height="58" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="b_ais" value="&lt;b&gt;NOAA MarineCadastre Historical AIS Vessel Broadcasts&lt;/b&gt;&lt;br&gt;• Ingests MMSI, GPS coordinates, SOG, COG, heading, &amp;amp; dimensions&lt;br&gt;• NGA World Port Index (WPI) global facilities and salvage base database" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="grp_b">')
    xml.append('          <mxGeometry x="15" y="104" width="550" height="58" as="geometry" />')
    xml.append('        </mxCell>')

    # Convergence 1 (Lagrangian RK4)
    xml.append('        <mxCell id="c1_box" value="&lt;b&gt;CONVERGENCE 1: 4TH-ORDER RUNGE-KUTTA (RK4) LAGRANGIAN DRIFT SOLVER&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #D97706; font-size: 10px;&quot;&gt;Merges Detected Slick Centroid + CMEMS Ocean Current Vectors + NOAA Windage&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;strokeWidth=2;fontColor=#0F172A;fontSize=12;verticalAlign=top;spacingTop=6;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="180" y="480" width="1040" height="120" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="c1_sub1" value="&lt;b&gt;Reverse Hindcast to Spill Origin Locus (T - 6.5h)&lt;/b&gt;&lt;br&gt;• Reconstructs discharge locus: (Lat_origin, Lon_origin)&lt;br&gt;• Computes dynamic spatial uncertainty envelope R(t)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFBEB;strokeColor=#D97706;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="205" y="534" width="480" height="52" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="c1_sub2" value="&lt;b&gt;48-Hour Forward Trajectory &amp;amp; Shoreline Risk Cone&lt;/b&gt;&lt;br&gt;• Forward hydrodynamic dispersion cone for environmental mitigation&lt;br&gt;• Evaporation and weathering aging curves for response priority" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F0F9FF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="715" y="534" width="480" height="52" as="geometry" />')
    xml.append('        </mxCell>')

    # Track C (Left)
    xml.append('        <mxCell id="grp_c" value="&lt;b&gt;TRACK C: SPATIO-TEMPORAL AIS KINEMATIC ATTRIBUTION&lt;/b&gt;" style="swimlane;startSize=26;rounded=1;whiteSpace=wrap;html=1;fillColor=#ECFDF5;strokeColor=#059669;fontColor=#059669;fontSize=11;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="70" y="635" width="580" height="145" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="c_cpa" value="&lt;b&gt;CPA Distance, Track Intersection &amp;amp; Speed Anomaly Correlation&lt;/b&gt;&lt;br&gt;• Queries spatial-temporal window: [Locus ± 0.35°, T_origin ± 2.0h]&lt;br&gt;• Cubic spline interpolation calculates Closest Point of Approach (CPA) distance&lt;br&gt;• Quantifies temporal delta (Δt) between vessel transit and hindcast release moment&lt;br&gt;• Flags behavioral anomalies (drastic speed drop, sharp course zigzag near locus)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="grp_c">')
    xml.append('          <mxGeometry x="15" y="35" width="550" height="96" as="geometry" />')
    xml.append('        </mxCell>')

    # Track D (Right)
    xml.append('        <mxCell id="grp_d" value="&lt;b&gt;TRACK D: DARK TARGET SAR RADAR CROSS-MATCH&lt;/b&gt;" style="swimlane;startSize=26;rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F3FF;strokeColor=#7C3AED;fontColor=#7C3AED;fontSize=11;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="750" y="635" width="580" height="145" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="d_dark" value="&lt;b&gt;Non-Cooperative Vessel Detection &amp;amp; Transponder Verification&lt;/b&gt;&lt;br&gt;• CFAR algorithm detects ship radar reflectivity on SAR raster&lt;br&gt;• Cross-matches detected ship targets against active AIS transponders&lt;br&gt;• Detects \'Dark Ships\' deliberately turning off AIS during illicit discharge&lt;br&gt;• Flags unregistered polluters for naval / coast guard interception" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=8;" vertex="1" parent="grp_d">')
    xml.append('          <mxGeometry x="15" y="35" width="550" height="96" as="geometry" />')
    xml.append('        </mxCell>')

    # Convergence 2 (Verdict)
    xml.append('        <mxCell id="c2_box" value="&lt;b&gt;CONVERGENCE 2: PLAIN-ENGLISH \'WHY FLAGGED\' ATTRIBUTION REASONING&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #059669; font-size: 10px;&quot;&gt;Replaces Black-Box Scores with Calibrated, Court-Defensible Kinematic Proof&lt;/font&gt;&lt;br&gt;Ranks suspect vessels by CPA distance, temporal concurrence, and trajectory alignment with verified provenance" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;strokeWidth=2;fontColor=#0F172A;fontSize=11.5;verticalAlign=middle;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="250" y="810" width="900" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # Track E: Operations Dispatch (Left)
    xml.append('        <mxCell id="grp_e" value="&lt;b&gt;TACTICAL DISPATCH &amp;amp; INTERCEPTION&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #2563EB; font-size: 9.5px;&quot;&gt;Indian Coast Guard (ICG) Ops Room &amp;amp; DG Shipping&lt;/font&gt;&lt;br&gt;• NGA World Port Index computes nearest response base &amp;amp; intercept vector&lt;br&gt;• Vessel transit ETA calculation for rapid containment boom deployment&lt;br&gt;• Emergency multi-channel dispatch broadcast (SMS, Webhooks, Tactical VHF)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#2563EB;strokeWidth=1.5;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=10;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="70" y="915" width="580" height="135" as="geometry" />')
    xml.append('        </mxCell>')

    # Track F: C2 & Legal Dossier (Right)
    xml.append('        <mxCell id="grp_f" value="&lt;b&gt;TACTICAL C2 CONSOLE &amp;amp; LEGAL EVIDENCE DOSSIER&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626; font-size: 9.5px;&quot;&gt;Next.js 14 + Leaflet GIS &amp;amp; Court-Admissible PDF Export&lt;/font&gt;&lt;br&gt;• Real-time tri-pane C2 dashboard with dynamic multi-layer GIS cartography&lt;br&gt;• Automated 4-step Investigation Replay simulator for commanders &amp;amp; judges&lt;br&gt;• 7-Page Legal Evidence Dossier: satellite provenance, CPA proof, suspect IMO records&lt;br&gt;• Cryptographic SHA-256 custody hash for unalterable chain-of-custody" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;strokeWidth=1.5;fontColor=#0F172A;fontSize=9.5;align=left;spacingLeft=10;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="750" y="915" width="580" height="135" as="geometry" />')
    xml.append('        </mxCell>')

    # End
    xml.append(f'        <mxCell id="b_end" value="&lt;b&gt;END: INTERCEPTION &amp;amp; EVIDENCE LOGGED&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=11.5;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 150}" y="1075" width="300" height="38" as="geometry" />')
    xml.append('        </mxCell>')

    # Connectors
    edges = [
        ("b_start", "b_s1"),
        ("b_s1", "b_tiler"),
        ("b_tiler", "grp_a"),
        ("b_tiler", "grp_b"),
        ("grp_a", "c1_box"),
        ("grp_b", "c1_box"),
        ("c1_box", "grp_c"),
        ("c1_box", "grp_d"),
        ("grp_c", "c2_box"),
        ("grp_d", "c2_box"),
        ("c2_box", "grp_e"),
        ("c2_box", "grp_f"),
        ("grp_e", "b_end"),
        ("grp_f", "b_end"),
    ]

    for idx, (s, d) in enumerate(edges):
        xml.append(f'        <mxCell id="be_{idx}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.5;" edge="1" parent="1" source="{s}" target="{d}">')
        xml.append('          <mxGeometry relative="1" as="geometry" />')
        xml.append('        </mxCell>')

    xml.append('      </root>')
    xml.append('    </mxGraphModel>')
    xml.append('  </diagram>')
    xml.append('</mxfile>')
    return '\n'.join(xml)

if __name__ == '__main__':
    content = generate_drawio_branched_xml()
    with open('c:/Nirmal/oil-leak/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/workflow_diagram_branched.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram_branched.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Branched Draw.io XML successfully saved!")
