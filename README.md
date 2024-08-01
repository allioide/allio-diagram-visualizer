# AllIO Diagram Visualizer

A CLI and library for visualizing the AllIO diagram

# Install

Using npm: 

```
npm install @allioide/diagram-visualizer
```

To use the `allio-visualize` command globally add the `-g` flag

```
npm install -g @allioide/diagram-visualizer
```

# Usage

The following command can be used to generate the diagram image. For additional options, run `allio-visualize -h`.

```
$ allio-visualize -i diagram.alliodiagram -o diagram.svg
```

To use as a library

```js
// For ESM/TypeScript (recommend)
import diagramVisualizer from '@allioide/diagram-visualizer';
// or 
// import { loadDiagram, getNodeCanvas, renderSvg } from '@allioide/diagram-visualizer';

// For CommonJS
// const diagramVisualizer = require('@allioide/diagram-visualizer');

const file = /* diagram content as string e.g. fs.readFileSync('diagram.alliodiagram', 'utf8') */;
const diagram = diagramVisualizer.loadDiagram(file);
const canvas = diagramVisualizer.getNodeCanvas();
const svg = diagramVisualizer.renderSvg(diagram, canvas);
console.log(svg); 
// <svg xmlns="http://www.w3.org/2000/svg" version="1.1" ...
//   ...
// </svg>
```