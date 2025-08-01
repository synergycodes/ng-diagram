# Model Lookup in AngularFlow

## Overview

The Model Lookup system provides a way to access and query the flow model's data. It maintains optimized data structures for accessing model data, particularly for node hierarchies and relationships. It can act as main source of queries.

## Architecture

### Model Lookup

Model Lookup maintains several data structures to access model data:

- **Nodes Map**: Access to nodes by their IDs
- **Edges Map**: Access to edges by their IDs
- **Direct Children Map**: Lookup of direct parent-child relationships
- **Descendants Cache**: Computation of all descendants for a given node

### Key Features

#### Hierarchical Data Access

- **Direct Children**: Access to immediate children of any node
- **All Descendants**: Computation of all descendants
- **Parent-Child Validation**: Validation of parent-child relationships

#### Selection State

- **Selected Nodes**: Access to currently selected nodes
- **Selected Edges**: Access to currently selected edges
- **Selection with Hierarchy**: Access to selected nodes including their children/descendants

#### Data Structures

- **Map-based Lookups**: Access to nodes and edges by ID
- **Cached Computations**: Descendant relationships are cached
- **State Updates**: Structures are updated when model changes

## Implementation Details

### Key Methods

- **getNodeById**: Lookup of nodes by ID
- **getEdgeById**: Lookup of edges by ID
- **getChildrenIds**: Lookup of direct children
- **hasDescendants**: Check for descendants
- **getSelectedNodes**: Access to selected nodes
- **getSelectedEdges**: Access to selected edges

## Important Notes

1. **Cache Management**
   - The descendants cache is cleared when the model state changes
   - Cache entries are computed only when required

2. **State Updates**
   - The lookup system updates all its internal structures when the model changes
   - Updates maintain consistency across all data structures
   - Cache is cleared on model updates
