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

### generateId()

> **generateId**: () => `string`

Generates a unique ID

#### Returns

`string`

***

### now()

> **now**: () => `number`

Current timestamp in ms

#### Returns

`number`

***

### os

> **os**: `null` \| `LooseAutocomplete`\<`"MacOS"` \| `"Windows"` \| `"Linux"` \| `"iOS"` \| `"Android"` \| `"Unknown"`\>

User Operating system name

***

### runtime

> **runtime**: `null` \| `LooseAutocomplete`\<`"node"` \| `"web"` \| `"other"`\>

Platform identity for high-level adapter routing
