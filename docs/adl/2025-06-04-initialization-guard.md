# Initialization Guard

## Overview

Normally when some change is being registered on the diagram it is being passed through whole flow so we are calling command which then pass the change through middlewares chain. It happens for example on situations like calculating size of the div when it depends on the content it has. The problem here is that when we initialize the diagram with a lot of nodes and edges it will call many commands at once when recalculating sizes or positions for nodes, ports or labels. We decided to create the Initialization Guard which takes care of first render since it waits for all calculations to be made before it calls first command and first middlewares chain.

## Architecture

### Internal Updater

Internal Updater is a class which takes care of internal updates and decides on whether some change should be applied through Initialization Guard so directly on the state or it can be updated through command. The approach Internal Updater takes to decide what to call depends on the fact if Initialization Guard has already initialized.

### Initialization Guard

Initialization Guard at first takes the initial model and nodes and edges which are there. It stores them in maps and check if their sizes or positions are already calculated. If no it will wait for proper calls to apply these sizes. As long as all elements will be calculated it will not initialize the whole diagram.
