---
editUrl: false
next: false
prev: false
title: "NgDiagramMath"
---

> **NgDiagramMath** = `object`

## Properties

### angleBetweenPoints()

> **angleBetweenPoints**: (`from`, `to`) => `number`

#### Parameters

##### from

[`Point`](/api/types/point/)

##### to

[`Point`](/api/types/point/)

#### Returns

`number`

***

### clamp()

> **clamp**: (`__namedParameters`) => `number`

#### Parameters

##### \_\_namedParameters

###### max

`number`

###### min

`number`

###### value

`number`

#### Returns

`number`

***

### detectContainerEdge()

> **detectContainerEdge**: (`containerBox`, `clientPosition`, `detectionThreshold`) => `ContainerEdge`

#### Parameters

##### containerBox

`Rect`

##### clientPosition

[`Point`](/api/types/point/)

##### detectionThreshold

`number`

#### Returns

`ContainerEdge`

***

### distanceBetweenPoints()

> **distanceBetweenPoints**: (`a`, `b`) => `number`

#### Parameters

##### a

[`Point`](/api/types/point/)

##### b

[`Point`](/api/types/point/)

#### Returns

`number`

***

### normalizeAngle()

> **normalizeAngle**: (`angle`) => `number`

#### Parameters

##### angle

`number`

#### Returns

`number`

***

### snapAngle()

> **snapAngle**: (`angle`, `step`) => `number`

Applies snapping and step logic to a rotation angle.

#### Parameters

##### angle

`number`

The raw angle after initial transformation (can be positive or negative, in degrees)

##### step

`number`

The snapping step (e.g., 5 for 5-degree increments)

#### Returns

`number`

The snapped angle (in degrees)

***

### snapNumber()

> **snapNumber**: (`value`, `step`) => `number`

#### Parameters

##### value

`number`

##### step

`number`

#### Returns

`number`

***

### snapPoint()

> **snapPoint**: (`point`, `step`) => `object`

#### Parameters

##### point

[`Point`](/api/types/point/)

##### step

[`Point`](/api/types/point/)

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`
