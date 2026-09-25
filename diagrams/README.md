# AegisSea Diagrams & Visual Assets Repository

This directory contains all the visual, architectural, procedural, and presentation diagrams for **AegisSea** (Smart India Hackathon 2026 - Team DevAlly).

---

## Directory Structure

```
diagrams/
├── architecture/          # Multi-tier system architecture diagrams
│   ├── system_architecture_diagram.jpg   (Primary presentation diagram - 5-tier)
│   ├── complete_system_architecture.jpg (Detailed multi-subsystem view)
│   ├── architecture_diagram.svg         (Scalable vector format for web / print)
│   └── architecture_diagram.drawio      (Editable XML for Draw.io / diagrams.net)
│
├── flowcharts/            # Algorithmic and forensic procedural workflows
│   ├── flowchart_diagram.jpg            (Primary technical flowchart with decision diamonds)
│   ├── workflow_diagram_branched.svg    (Clean vector branched forensic pipeline)
│   ├── workflow_diagram_branched.drawio (Editable branched workflow in Draw.io)
│   └── workflow_flowchart.svg           (Process flowchart vector)
│
├── presentation_slides/   # SIH Slide Mockups and Pitch Deck Layout Guides
│   └── sih_slide3_layout_guide.jpg      (Complete Slide 3 blueprint with all 4 zones)
│
└── generators/            # Python automated diagram generator scripts
    ├── generate_svg_arch.py             (Generates architecture SVG)
    ├── generate_drawio_arch.py          (Generates architecture .drawio XML)
    ├── generate_workflow_diagram.py     (Generates workflow SVG)
    ├── generate_drawio_workflow.py      (Generates workflow .drawio XML)
    ├── generate_vertical_workflow.py    (Generates vertical flow diagram)
    ├── generate_drawio_vertical_wf.py   (Generates vertical .drawio XML)
    ├── generate_branched_workflow.py    (Generates branched logic SVG)
    └── generate_drawio_branched.py      (Generates branched .drawio XML)
```

---

## Diagram Index & Usage Guide

| Diagram File | Type / Format | Best Used For | How to Open / Edit |
| :--- | :--- | :--- | :--- |
| **`architecture/system_architecture_diagram.jpg`** | High-Res Raster | **Slide 3 Pitch Deck** (Technical Approach right-side diagram) | Direct drag-and-drop into Canva or PPT |
| **`architecture/architecture_diagram.drawio`** | Draw.io XML | Customizing node text, adding cloud logos, changing colors | Open in [app.diagrams.net](https://app.diagrams.net) or VS Code Draw.io extension |
| **`architecture/architecture_diagram.svg`** | Scalable Vector | High-DPI documentation, web dashboards, PDF reports | Any modern browser or Adobe Illustrator / Inkscape |
| **`flowcharts/flowchart_diagram.jpg`** | High-Res Raster | Technical deep-dive / algorithmic verification slide | Direct drag-and-drop into Canva or PPT |
| **`flowcharts/workflow_diagram_branched.drawio`** | Draw.io XML | Customizing conditional logic and forensic decision diamonds | Open in [app.diagrams.net](https://app.diagrams.net) |
| **`presentation_slides/sih_slide3_layout_guide.jpg`** | 16:9 Presentation Blueprint | Exact reference for arranging Slide 3 in Canva | View side-by-side while editing your Canva deck |

---

## Web Application Public Assets
A copy of key presentation assets is also maintained in `frontend/public/` so that the Next.js Tactical C2 web console can serve them directly via HTTP:
* `/system_architecture_diagram.jpg`
* `/flowchart_diagram.jpg`
* `/sih_slide3_layout_guide.jpg`
