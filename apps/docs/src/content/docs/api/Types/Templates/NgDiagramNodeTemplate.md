---
editUrl: false
next: false
prev: false
title: "NgDiagramNodeTemplate"
---

Interface for custom node components.

## Extended by

- [`NgDiagramGroupNodeTemplate`](/docs/api/types/templates/ngdiagramgroupnodetemplate/)

## Type Parameters

### Data

`Data` *extends* `DataObject` = `DataObject`

The type of data associated with the node

### NodeType

`NodeType` *extends* [`Node`](/docs/api/types/model/node/)\<`Data`\> = [`SimpleNode`](/docs/api/types/model/simplenode/)\<`Data`\>

The type of node (SimpleNode or GroupNode)

## Properties

### node

> **node**: `InputSignal`\<`NodeType`\>

Input signal containing the node data and properties.
