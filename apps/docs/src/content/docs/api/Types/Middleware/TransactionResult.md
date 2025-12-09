---
version: "since v0.8.0"
editUrl: false
next: false
prev: false
title: "TransactionResult"
---

Result of a transaction execution.

## Properties

### actionTypes

> **actionTypes**: `ModelActionTypes`

All action types that were executed within the transaction.
Preserves the order in which commands were emitted.

#### Since

0.9.0

***

### commandsCount

> **commandsCount**: `number`

Number of commands emitted during the transaction

***

### results

> **results**: [`FlowStateUpdate`](/docs/api/types/middleware/flowstateupdate/)

Results of the transaction as a state update
