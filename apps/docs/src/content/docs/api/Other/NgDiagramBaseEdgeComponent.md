---
editUrl: false
next: false
prev: false
title: "NgDiagramBaseEdgeComponent"
---

Base edge component that handles edge rendering.

Path can be determined in several ways (in order of priority):
1. If edge has staticPath with svgPath - use that directly
2. If routing prop is provided or edge has routing property - use RoutingManager to generate path
3. Otherwise - middleware will calculate path based on default routing
