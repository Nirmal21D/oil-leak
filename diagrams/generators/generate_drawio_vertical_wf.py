"""
Generates an editable vertical .drawio XML file for the AegisSea workflow flowchart.
Can be directly opened in draw.io / diagrams.net.
"""

def generate_drawio_vertical_xml() -> str:
    xml = []
    xml.append('<mxfile host="app.diagrams.net" modified="2026-09-24T20:38:00.000Z" agent="AegisSea" version="21.0.0" type="device">')
    xml.append('  <diagram id="aegissea-vertical-wf" name="AegisSea Vertical Workflow">')
    xml.append('    <mxGraphModel dx="1200" dy="2800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="960" pageHeight="2720" background="#FFFFFF" math="0" shadow="0">')
    xml.append('      <root>')
    xml.append('        <mxCell id="0" />')
    xml.append('        <mxCell id="1" parent="0" />')

    # Header
    xml.append('        <mxCell id="v_header" value="&lt;b&gt;AEGISSEA // OPERATIONAL FORENSIC WORKFLOW PIPELINE&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 11px;&quot;&gt;Technical Flowchart • Smart India Hackathon 2026 • Team DevAlly&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=15;align=center;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="40" y="20" width="880" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    CX = 480

    # 1. Start Node
    xml.append(f'        <mxCell id="v_start" value="&lt;b&gt;START&lt;/b&gt;&lt;br&gt;Satellite Pass / Ingest" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=12;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 120}" y="100" width="240" height="40" as="geometry" />')
    xml.append('        </mxCell>')

    # 2. Input S1
    xml.append(f'        <mxCell id="v_s1" value="&lt;b&gt;Level-1 Sentinel-1 SAR IW GRD Swath&lt;/b&gt;&lt;br&gt;ESA Copernicus C-Band • 10m GSD GeoTIFF" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#F0F9FF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="170" width="360" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 3. Parse Tags
    xml.append(f'        <mxCell id="v_tags" value="&lt;b&gt;Parse GeoTIFF Metadata Tags&lt;/b&gt;&lt;br&gt;ModelTiepointTag &amp;amp; Scale • Acquisition Time" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="250" width="360" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 4. Decision WGS84
    xml.append(f'        <mxCell id="v_dec_geo" value="&lt;b&gt;WGS-84&lt;br&gt;Valid?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 75}" y="335" width="150" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="v_unref" value="&lt;b&gt;Unreferenced Mode&lt;/b&gt;&lt;br&gt;Pixel-space raster fallback" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FEF2F2;strokeColor=#DC2626;fontColor=#DC2626;fontSize=10;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="670" y="347" width="200" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 5. Tiler
    xml.append(f'        <mxCell id="v_tiler" value="&lt;b&gt;Sliding-Window Patch Generator&lt;/b&gt;&lt;br&gt;512×512 Tiles • 20% Overlap • dB Normalization" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="445" width="380" height="60" as="geometry" />')
    xml.append('        </mxCell>')

    # 6. AI Inference
    xml.append(f'        <mxCell id="v_ai" value="&lt;b&gt;PyTorch ResNet-34 U-Net Inference&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626;&quot;&gt;NVIDIA CUDA FP16 • 0.826 IoU Benchmark&lt;/font&gt;&lt;br&gt;Multi-class Probabilities: Sea / Oil / Lookalike" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 200}" y="540" width="400" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # 7. Stitcher
    xml.append(f'        <mxCell id="v_stitch" value="&lt;b&gt;Mosaic Stitcher &amp;amp; Boundary Blender&lt;/b&gt;&lt;br&gt;Distance-weighted patch blending ➔ Binary Mask" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="645" width="360" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 8. Decision Spill
    xml.append(f'        <mxCell id="v_dec_spill" value="&lt;b&gt;Oil Pixels &gt; 500 &amp;amp;&lt;br&gt;Conf &gt; 50%?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 85}" y="730" width="170" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="v_clean" value="&lt;b&gt;Clean Sea Verified&lt;/b&gt;&lt;br&gt;Zero discharge • Log &amp;amp; End" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F0FDF4;strokeColor=#059669;fontColor=#059669;fontSize=10;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="670" y="747" width="200" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 9. Morphology
    xml.append(f'        <mxCell id="v_morph" value="&lt;b&gt;Slick Contours &amp;amp; Morphology&lt;/b&gt;&lt;br&gt;OpenCV MultiPolygons • Centroid (Lat₀, Lon₀) • Metric Area (km²)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="845" width="380" height="60" as="geometry" />')
    xml.append('        </mxCell>')

    # 10. Volume
    xml.append(f'        <mxCell id="v_vol" value="&lt;b&gt;Bonn Thickness &amp;amp; Volume Model&lt;/b&gt;&lt;br&gt;Code 1–5 Appearance Classification ➔ Spill Volume (m³)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="930" width="360" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 11. Metocean Input
    xml.append(f'        <mxCell id="v_met" value="&lt;b&gt;CMEMS Ocean Currents &amp;amp; NOAA GFS Winds&lt;/b&gt;&lt;br&gt;Hourly Surface Velocity Vectors (u, v) &amp;amp; 10m Wind Fields" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#FFFBEB;strokeColor=#D97706;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="1010" width="360" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 12. Lagrangian RK4
    xml.append(f'        <mxCell id="v_rk4" value="&lt;b&gt;Lagrangian 4th-Order Runge-Kutta (RK4) Solver&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #D97706;&quot;&gt;Hydrodynamic Drift: u_net = u_current + 0.03·u_wind&lt;/font&gt;&lt;br&gt;Reverse Numerical Integration: T0 Observation ➔ T - 6.5h Origin" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 200}" y="1090" width="400" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # 13. Origin Locus
    xml.append(f'        <mxCell id="v_locus" value="&lt;b&gt;Reconstructed Release Locus &amp;amp; Uncertainty R(t)&lt;/b&gt;&lt;br&gt;Pinpoints release origin at T - 6.5h with dynamic uncertainty radius" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="1195" width="380" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 14. Dark Target
    xml.append(f'        <mxCell id="v_dark" value="&lt;b&gt;Dark Target Cross-Match (SAR Radar vs AIS)&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #7C3AED;&quot;&gt;Non-Cooperative Vessel Detection&lt;/font&gt;&lt;br&gt;Flags dark polluters operating with AIS transponders turned off" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="1275" width="380" height="65" as="geometry" />')
    xml.append('        </mxCell>')

    # 15. AIS Ingest
    xml.append(f'        <mxCell id="v_ais_in" value="&lt;b&gt;NOAA MarineCadastre AIS Historical Stream&lt;/b&gt;&lt;br&gt;MMSI, position, speed over ground, course, true heading" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#ECFDF5;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="1365" width="360" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 16. Spatio-temporal filter
    xml.append(f'        <mxCell id="v_filter" value="&lt;b&gt;Spatio-Temporal Candidate Query Filter&lt;/b&gt;&lt;br&gt;Queries bounding envelope [Locus ± 0.35°] within [T_origin ± 2h]" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="1440" width="360" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 17. CPA Correlator
    xml.append(f'        <mxCell id="v_cpa" value="&lt;b&gt;Kinematic Track Correlator &amp;amp; Spline Matcher&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #059669;&quot;&gt;Haversine Distance &amp;amp; Temporal Delta (Δt)&lt;/font&gt;&lt;br&gt;Computes Closest Point of Approach (CPA) &amp;amp; speed anomaly" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 200}" y="1520" width="400" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # 18. Decision Suspect
    xml.append(f'        <mxCell id="v_dec_suspect" value="&lt;b&gt;Suspect Correlated?&lt;/b&gt;&lt;br&gt;(CPA &lt; 5km &amp;amp; Δt &lt; 1h)" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 85}" y="1620" width="170" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    # 19. Plain-English Verdict
    xml.append(f'        <mxCell id="v_verdict" value="&lt;b&gt;Plain-English \'Why Flagged\' Evidence Verdict&lt;/b&gt;&lt;br&gt;Transparent kinematic justification &amp;amp; rank-ordered candidate card" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="1735" width="380" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 20. Response Routing
    xml.append(f'        <mxCell id="v_route" value="&lt;b&gt;NGA World Port Index Response Routing&lt;/b&gt;&lt;br&gt;Nearest salvage base, geodesic intercept vector, &amp;amp; fleet transit ETA" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="1820" width="360" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 21. Tactical C2
    xml.append(f'        <mxCell id="v_c2" value="&lt;b&gt;Tactical C2 Interface &amp;amp; 4-Step Replay Simulator&lt;/b&gt;&lt;br&gt;Next.js 14 + Leaflet GIS: Real-time slick polygons &amp;amp; drift cones" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 190}" y="1905" width="380" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # 22. Legal Dossier
    xml.append(f'        <mxCell id="v_dossier" value="&lt;b&gt;Automated 7-Page Legal Evidence Dossier&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626;&quot;&gt;Court-Admissible Legal Artifact (PDF Export)&lt;/font&gt;&lt;br&gt;Satellite provenance, RK4 hindcast, vessel records, &amp;amp; SHA-256 hash" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 200}" y="1990" width="400" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # 23. Emergency Alert
    xml.append(f'        <mxCell id="v_alert" value="&lt;b&gt;Emergency Agency Dispatch Alert&lt;/b&gt;&lt;br&gt;Real-time broadcast to Indian Coast Guard (ICG) Ops &amp;amp; DG Shipping" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 180}" y="2095" width="360" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 24. End
    xml.append(f'        <mxCell id="v_end" value="&lt;b&gt;END: INTERCEPTION LOGGED&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=12;" vertex="1" parent="1">')
    xml.append(f'          <mxGeometry x="{CX - 120}" y="2175" width="240" height="40" as="geometry" />')
    xml.append('        </mxCell>')

    # Connectors
    conns = [
        ("v_start", "v_s1"),
        ("v_s1", "v_tags"),
        ("v_tags", "v_dec_geo"),
        ("v_dec_geo", "v_tiler"),
        ("v_tiler", "v_ai"),
        ("v_ai", "v_stitch"),
        ("v_stitch", "v_dec_spill"),
        ("v_dec_spill", "v_morph"),
        ("v_morph", "v_vol"),
        ("v_vol", "v_met"),
        ("v_met", "v_rk4"),
        ("v_rk4", "v_locus"),
        ("v_locus", "v_dark"),
        ("v_dark", "v_ais_in"),
        ("v_ais_in", "v_filter"),
        ("v_filter", "v_cpa"),
        ("v_cpa", "v_dec_suspect"),
        ("v_dec_suspect", "v_verdict"),
        ("v_verdict", "v_route"),
        ("v_route", "v_c2"),
        ("v_c2", "v_dossier"),
        ("v_dossier", "v_alert"),
        ("v_alert", "v_end"),
    ]

    for idx, (src, dst) in enumerate(conns):
        xml.append(f'        <mxCell id="ve_{idx}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.5;" edge="1" parent="1" source="{src}" target="{dst}">')
        xml.append('          <mxGeometry relative="1" as="geometry" />')
        xml.append('        </mxCell>')

    xml.append('      </root>')
    xml.append('    </mxGraphModel>')
    xml.append('  </diagram>')
    xml.append('</mxfile>')
    return '\n'.join(xml)

if __name__ == '__main__':
    content = generate_drawio_vertical_xml()
    with open('c:/Nirmal/oil-leak/workflow_diagram_vertical.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram_vertical.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Vertical Workflow Draw.io XML successfully saved!")
