---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "EnvironmentInfo"
---

Interface representing environment information

## Properties

### browser

> **browser**: `LooseAutocomplete`\<`"Chrome"` \| `"Firefox"` \| `"Safari"` \| `"Edge"` \| `"Opera"` \| `"IE"` \| `"Other"`\> \| `null`

User Browser name (when applicable)

***

### generateId

> **generateId**: () => `string`

Generates a unique ID

#### Returns

`string`

***

### now

> **now**: () => `number`

Current timestamp in ms

#### Returns

`number`

***

### os

> **os**: `LooseAutocomplete`\<`"MacOS"` \| `"Windows"` \| `"Linux"` \| `"iOS"` \| `"Android"` \| `"Unknown"`\> \| `null`

User Operating system name

***

### runtime

> **runtime**: `LooseAutocomplete`\<`"node"` \| `"web"` \| `"other"`\> \| `null`

Platform identity for high-level adapter routing
