"""
Generates an editable .drawio XML file for the AegisSea operational workflow flowchart.
Can be directly opened in draw.io / diagrams.net.
"""

def generate_drawio_workflow_xml() -> str:
    xml = []
    xml.append('<mxfile host="app.diagrams.net" modified="2026-09-24T20:30:00.000Z" agent="AegisSea" version="21.0.0" type="device">')
    xml.append('  <diagram id="aegissea-wf" name="AegisSea Technical Workflow">')
    xml.append('    <mxGraphModel dx="1800" dy="1000" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1800" pageHeight="1000" background="#FFFFFF" math="0" shadow="0">')
    xml.append('      <root>')
    xml.append('        <mxCell id="0" />')
    xml.append('        <mxCell id="1" parent="0" />')

    # Header
    xml.append('        <mxCell id="wf_header" value="&lt;b&gt;AEGISSEA // OPERATIONAL FORENSIC WORKFLOW &amp;amp; ALGORITHMIC PIPELINE&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;font-size: 11px;&quot;&gt;Technical Flowchart • Smart India Hackathon 2026 • Team DevAlly&lt;/font&gt;" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=16;align=left;spacingLeft=20;" vertex="1" parent="1">')
    xml.append('          <mxGeometry x="40" y="20" width="1720" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    # 5 Phase Lanes
    lanes = [
        ("p1", 40, "PHASE 1: INGESTION &amp; PREPROCESSING", "#0284C7", 320),
        ("p2", 380, "PHASE 2: AI SEGMENTATION &amp; MORPHOLOGY", "#DC2626", 330),
        ("p3", 730, "PHASE 3: METOCEAN HINDCAST SOLVER", "#D97706", 340),
        ("p4", 1090, "PHASE 4: AIS SPATIO-TEMPORAL MATCH", "#059669", 330),
        ("p5", 1440, "PHASE 5: DISPATCH &amp; EVIDENCE DOSSIER", "#7C3AED", 320),
    ]

    for lid, lx, ltitle, lcol, lw in lanes:
        xml.append(f'        <mxCell id="{lid}" value="&lt;b&gt;{ltitle}&lt;/b&gt;" style="swimlane;startSize=35;rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor={lcol};strokeWidth=1.5;fontColor={lcol};fontSize=12;align=center;" vertex="1" parent="1">')
        xml.append(f'          <mxGeometry x="{lx}" y="85" width="{lw}" height="800" as="geometry" />')
        xml.append('        </mxCell>')

    # Phase 1 Nodes
    xml.append('        <mxCell id="start" value="&lt;b&gt;START&lt;/b&gt;&lt;br&gt;Satellite Pass / Ingest" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=11;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="60" y="50" width="200" height="40" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="in_s1" value="&lt;b&gt;Sentinel-1 SAR IW GRD&lt;/b&gt;&lt;br&gt;C-Band 10m GSD GeoTIFF" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#F0F9FF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=10.5;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="40" y="115" width="240" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="pr_tags" value="&lt;b&gt;Parse GeoTIFF Metadata&lt;/b&gt;&lt;br&gt;ModelTiepointTag &amp;amp; Scale" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="40" y="190" width="240" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="dec_geo" value="&lt;b&gt;WGS-84&lt;br&gt;Valid?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="90" y="275" width="140" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="pr_tiler" value="&lt;b&gt;Sliding-Window Tiler&lt;/b&gt;&lt;br&gt;512×512 Tiles • 20% Overlap&lt;br&gt;dB Calibration &amp;amp; Normalization" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0284C7;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="40" y="380" width="240" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="buf_batch" value="&lt;b&gt;Tensor Batch Buffer&lt;/b&gt;&lt;br&gt;[B, 1, 512, 512] PyTorch Tensor" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#F8FAFC;strokeColor=#64748B;strokeDashArray=3 3;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p1">')
    xml.append('          <mxGeometry x="40" y="485" width="240" height="55" as="geometry" />')
    xml.append('        </mxCell>')

    # Phase 2 Nodes
    xml.append('        <mxCell id="ai_unet" value="&lt;b&gt;ResNet-34 U-Net Inference&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626; font-size: 10px;&quot;&gt;PyTorch • CUDA FP16 TensorRT&lt;/font&gt;&lt;br&gt;Multi-class Softmax Probability Logits&lt;br&gt;Oil vs Lookalike vs Sea Background" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p2">')
    xml.append('          <mxGeometry x="30" y="50" width="270" height="90" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="ai_blend" value="&lt;b&gt;Mosaic Stitcher &amp;amp; Blender&lt;/b&gt;&lt;br&gt;Distance-weighted tile merging&lt;br&gt;Binary Segmentation Mask" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p2">')
    xml.append('          <mxGeometry x="30" y="165" width="270" height="60" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="dec_spill" value="&lt;b&gt;Oil Pixels &gt; 500 &amp;amp;&lt;br&gt;Conf &gt; 50%?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p2">')
    xml.append('          <mxGeometry x="85" y="255" width="160" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="morph" value="&lt;b&gt;Morphology &amp;amp; Vectorization&lt;/b&gt;&lt;br&gt;• OpenCV MultiPolygon Contours&lt;br&gt;• Slick Centroid (Lat₀, Lon₀)&lt;br&gt;• Metric Surface Area (km²)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p2">')
    xml.append('          <mxGeometry x="30" y="375" width="270" height="80" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="vol_model" value="&lt;b&gt;Bonn Volume Model&lt;/b&gt;&lt;br&gt;Code 1-5 Thickness Classification&lt;br&gt;Estimated Spill Volume (m³)" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p2">')
    xml.append('          <mxGeometry x="30" y="485" width="270" height="60" as="geometry" />')
    xml.append('        </mxCell>')

    # Phase 3 Nodes
    xml.append('        <mxCell id="in_metocean" value="&lt;b&gt;CMEMS &amp;amp; NOAA Metocean&lt;/b&gt;&lt;br&gt;Hourly Surface Current + GFS Wind" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#FFFBEB;strokeColor=#D97706;fontColor=#0F172A;fontSize=10.5;" vertex="1" parent="p3">')
    xml.append('          <mxGeometry x="40" y="50" width="260" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="rk4_solve" value="&lt;b&gt;Lagrangian RK4 Hindcasting&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #D97706; font-size: 10px;&quot;&gt;4th-Order Numerical ODE Integrator&lt;/font&gt;&lt;br&gt;u_net = u_current + 0.03·u_wind&lt;br&gt;Backward step: T0 ➔ T - 6.5h" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p3">')
    xml.append('          <mxGeometry x="35" y="125" width="270" height="95" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="origin_locus" value="&lt;b&gt;Spill Origin Locus Derived&lt;/b&gt;&lt;br&gt;Coordinates: (Lat_rel, Lon_rel)&lt;br&gt;Uncertainty Radius: R(t)&lt;br&gt;Query Bounding Envelope" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p3">')
    xml.append('          <mxGeometry x="35" y="245" width="270" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="fwd_disp" value="&lt;b&gt;48h Forward Dispersion Model&lt;/b&gt;&lt;br&gt;Shoreline Threat Cone &amp;amp; Aging Curve" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#D97706;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p3">')
    xml.append('          <mxGeometry x="35" y="345" width="270" height="60" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="dark_tgt" value="&lt;b&gt;Dark Target Cross-Match&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #7C3AED; font-size: 10px;&quot;&gt;Non-Cooperative Vessel Detection&lt;/font&gt;&lt;br&gt;SAR CFAR Target vs AIS Transponder&lt;br&gt;Flags Dark Vessel Discharges" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;strokeWidth=1.5;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p3">')
    xml.append('          <mxGeometry x="35" y="430" width="270" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    # Phase 4 Nodes
    xml.append('        <mxCell id="in_ais" value="&lt;b&gt;NOAA MarineCadastre AIS&lt;/b&gt;&lt;br&gt;Historical AIS Vessel Breadcrumbs" style="shape=parallelogram;perimeter=parallelogramPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#ECFDF5;strokeColor=#059669;fontColor=#0F172A;fontSize=10.5;" vertex="1" parent="p4">')
    xml.append('          <mxGeometry x="35" y="50" width="260" height="50" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="spatio_filter" value="&lt;b&gt;Spatio-Temporal Candidate Query&lt;/b&gt;&lt;br&gt;Window: [T_origin ± 2h]&lt;br&gt;Bounding Box: Locus ± 0.35°" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p4">')
    xml.append('          <mxGeometry x="30" y="125" width="270" height="65" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="cpa_calc" value="&lt;b&gt;Kinematic CPA Correlation&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #059669; font-size: 10px;&quot;&gt;Closest Point of Approach &amp;amp; Spline&lt;/font&gt;&lt;br&gt;• CPA Distance to Reconstructed Locus&lt;br&gt;• Temporal Delta (Δt) at Intercept&lt;br&gt;• Speed &amp;amp; Course Anomaly Scoring" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p4">')
    xml.append('          <mxGeometry x="30" y="215" width="270" height="95" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="verdict_box" value="&lt;b&gt;Plain-English Attribution Scorer&lt;/b&gt;&lt;br&gt;• Proximity Match (&lt; 5.0 km CPA)&lt;br&gt;• Drift Trajectory Concurrence&lt;br&gt;• Court-Defensible \'Why Flagged\' Card" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p4">')
    xml.append('          <mxGeometry x="30" y="335" width="270" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="dec_suspect" value="&lt;b&gt;Suspect&lt;br&gt;Matched?&lt;/b&gt;" style="rhombus;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p4">')
    xml.append('          <mxGeometry x="95" y="445" width="140" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    # Phase 5 Nodes
    xml.append('        <mxCell id="resp_route" value="&lt;b&gt;NGA Port Response Routing&lt;/b&gt;&lt;br&gt;Nearest Salvage Base &amp;amp; ETA Intercept&lt;br&gt;Containment Boom Fleet Allocator" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#7C3AED;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p5">')
    xml.append('          <mxGeometry x="25" y="50" width="270" height="75" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="c2_console" value="&lt;b&gt;Tactical C2 Tri-Pane Interface&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #0284C7; font-size: 10px;&quot;&gt;Next.js 14 • Leaflet GIS • WebSockets&lt;/font&gt;&lt;br&gt;Multi-Layer Tactical Mapping&lt;br&gt;Investigation Replay Simulator" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#0F172A;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p5">')
    xml.append('          <mxGeometry x="25" y="150" width="270" height="85" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="dossier_pdf" value="&lt;b&gt;7-Page Evidence Dossier&lt;/b&gt;&lt;br&gt;&lt;font style=&quot;color: #DC2626; font-size: 10px;&quot;&gt;Court-Admissible Legal Artifact&lt;/font&gt;&lt;br&gt;• Geodetic Provenance &amp;amp; U-Net Masks&lt;br&gt;• RK4 Hindcast &amp;amp; Kinematic CPA Logs&lt;br&gt;• Cryptographic Chain-of-Custody" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#DC2626;strokeWidth=2;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p5">')
    xml.append('          <mxGeometry x="25" y="260" width="270" height="95" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="icg_alert" value="&lt;b&gt;Emergency Agency Dispatch&lt;/b&gt;&lt;br&gt;Indian Coast Guard (ICG) Ops Room&lt;br&gt;DG Shipping &amp;amp; Pollution Board Alert" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#FFFFFF;strokeColor=#059669;fontColor=#0F172A;fontSize=11;" vertex="1" parent="p5">')
    xml.append('          <mxGeometry x="25" y="380" width="270" height="70" as="geometry" />')
    xml.append('        </mxCell>')

    xml.append('        <mxCell id="end" value="&lt;b&gt;END: INTERCEPTION LOGGED&lt;/b&gt;" style="ellipse;whiteSpace=wrap;html=1;fillColor=#0F172A;strokeColor=#0F172A;fontColor=#FFFFFF;fontSize=11;" vertex="1" parent="p5">')
    xml.append('          <mxGeometry x="50" y="475" width="220" height="40" as="geometry" />')
    xml.append('        </mxCell>')

    # Connectors
    edges = [
        ("start", "in_s1"),
        ("in_s1", "pr_tags"),
        ("pr_tags", "dec_geo"),
        ("dec_geo", "pr_tiler"),
        ("pr_tiler", "buf_batch"),
        ("buf_batch", "ai_unet"),
        ("ai_unet", "ai_blend"),
        ("ai_blend", "dec_spill"),
        ("dec_spill", "morph"),
        ("morph", "vol_model"),
        ("morph", "rk4_solve"),
        ("in_metocean", "rk4_solve"),
        ("rk4_solve", "origin_locus"),
        ("origin_locus", "fwd_disp"),
        ("origin_locus", "dark_tgt"),
        ("origin_locus", "spatio_filter"),
        ("in_ais", "spatio_filter"),
        ("spatio_filter", "cpa_calc"),
        ("cpa_calc", "verdict_box"),
        ("verdict_box", "dec_suspect"),
        ("dec_suspect", "c2_console"),
        ("dec_suspect", "resp_route"),
        ("c2_console", "dossier_pdf"),
        ("dossier_pdf", "icg_alert"),
        ("icg_alert", "end")
    ]

    for idx, (s, d) in enumerate(edges):
        xml.append(f'        <mxCell id="wf_e_{idx}" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#334155;strokeWidth=1.5;" edge="1" parent="1" source="{s}" target="{d}">')
        xml.append('          <mxGeometry relative="1" as="geometry" />')
        xml.append('        </mxCell>')

    xml.append('      </root>')
    xml.append('    </mxGraphModel>')
    xml.append('  </diagram>')
    xml.append('</mxfile>')
    return '\n'.join(xml)

if __name__ == '__main__':
    content = generate_drawio_workflow_xml()
    with open('c:/Nirmal/oil-leak/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    with open('c:/Nirmal/oil-leak/frontend/public/workflow_diagram.drawio', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Workflow Draw.io XML saved successfully to c:/Nirmal/oil-leak/workflow_diagram.drawio")
