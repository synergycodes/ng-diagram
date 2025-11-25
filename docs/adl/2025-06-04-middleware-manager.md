# Middleware Manager and Executor

## Overview

The Middleware Manager and Executor system provides a powerful way to transform and process flow state changes before they will get to the model so this is the best place to add some custom logic which reacts on proper changes.

## Architecture

### Middleware Manager

Middleware Manager takes care of managing what middlewares are registered, it enables registering and unregistering any middlewares and takes care of executing whole chain.

### Middleware Executor

Middleware executor is a class which takes care of executing whole chain of middlewares and properly processing all of the data.

#### Key responsibilities

- **async middlewares** - every middleware can be written in asynchronous way which enables awaiting some data, for example if there is a need to wait for layout to calculate itself. As long as middleware won't call `next()` it will wait with calling next middleware. Middlewares as well can be aborted by calling `cancel()`
- **pre-preparing data** - when middlewares chain is being called the executor prepares and modifies current state to e.g. map nodes array to a map to have faster access to modify or read proper nodes
- **processing updates** - Middleware Executor has specified interface of updates which are passed through `next()` method or if there is no need to update, `next()` can be called without any arguments. Depending on what middleware has just updated the Middleware Executor properly process these changes and store them
- **exposing helpers** - thanks to the way of processing every update the Middleware Executor can easily determine what has been updated and expose helping method to every user by passed context
- **storing history** - every update which every middleware in queue applied is stored in history so other middlewares can check on them. If some middleware decided to call `next()` without any update it is being skipped and not added to history

## Important notes

Middlewares are very crucial part of the application and it is really important to keep them as performant as possible since they run on every change. That's why the Middleware Executor is doing a lot of processing to prepare quick helpers methods which allow user to quickly determinate if the middleware should run it's logic or they can just skip itself.
