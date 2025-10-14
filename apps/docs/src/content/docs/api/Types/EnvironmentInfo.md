---
editUrl: false
next: false
prev: false
title: "EnvironmentInfo"
---

Interface representing environment information

## Properties

### browser

> **browser**: `null` \| `LooseAutocomplete`\<`"Chrome"` \| `"Firefox"` \| `"Safari"` \| `"Edge"` \| `"Opera"` \| `"IE"` \| `"Other"`\>

User Browser name (when applicable)

***

### now()

> **now**: () => `number`

Primary modifier key semantics for shortcuts (meta on Mac, ctrl elsewhere)

#### Returns

`number`

***

### os

> **os**: `null` \| `LooseAutocomplete`\<`"MacOS"` \| `"Windows"` \| `"Linux"` \| `"iOS"` \| `"Android"` \| `"Unknown"`\>

User Operating system name

***

### runtime?

> `optional` **runtime**: `LooseAutocomplete`\<`"node"` \| `"web"` \| `"other"`\>

Platform identity for high-level adapter routing
