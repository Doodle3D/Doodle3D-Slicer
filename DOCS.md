# Doodle3D Slicer
This document explains how the slice process works.

In this slicer Z is the "up" vector.

Requisites
 - 2D Vector math
 - 3D Vector math
 - 2D Boolean operations (union, difference)
 - 2D Path offsetting

### Step 0: Preparation
The first step is to prepare the data for slicing. Most of the model data is mapped into `typed arrays`. This way they can be send to the worker very efficiently (due to the transferable nature of typed arrays).
```
Vertices: Float32Array
Faces: Uint32Array
ObjectIndexes: UInt8Array
OpenObjectIndexes: [...Int]
Settings:
  startCode: String
  endcode: String
  dimensions:
    x: Number
    y: Number
    z: Number
  heatedBed: Bool
  nozzleDiameter: Number
  filamentThickness: Number
  temperature: Number
  bedTemperature: Number
  layerHeight: Number
  combing: Bool
  thickness:
    top: Number
    bottom: Number
    shell: Number
  retraction:
    enabled: Bool
    amount: Number
    speed: Number
    minDistance: Number
  travel:
    speed: Number
  support:
    enabled: Bool
    minArea: Number
    distanceY: Number
    density: Number
    margin: Number
    flowRate: Number
    speed: Number
  innerShell:
    flowRate: Number
    speed: Number
  outerShell:
    flowRate: Number
    speed: Number
  innerInfill:
    flowRate: Number
    speed: Number
    density: Number
  outerInfill:
    flowRate: Number
    speed: Number
  brim:
    size: Number
    flowRate: Number
    speed: Number
  firstLayer:
    flowRate: Number
    speed: Number
```
 - Vertices: List of points in 3d
 - Faces: Indexes refering to points in the vertices list that make a triangular surface
 - ObjectIndexes: Describes of what object each face is part of (important for the generating of 2d shapes)
 - OpenObjectIndexes: Determines weather a object is open or closed (important for the generating of 2d shapes)
 - Settings: object containing all the settings for slicing. We go in depth in this object when it's needed

### Step 1: Creating lines
In this we take the 3d model and look at each surface to extract all individual lines. Note some lines are part of multiple surfaces. In addition we also add some additional data to each line, like the surfaces it is part of we'll also store the 2d normal.

```
function calculateNormal(vertices, a, b, c) {
  a = getVertex(vertices, a);
  b = getVertex(vertices, b);
  c = getVertex(vertices, c);

  const cb = vector3.subtract(c, b);
  const ab = vector3.subtract(a, b);
  const normal = vector3.normalize(vector3.cross(cb, ab));

  return normal;
}
```

In order to extract all unique lines from the model we'll loop through each face of the model.

### Step 2: Calculate Layers Intersections
This is a fairly straight forward step. We take the lines and calculate on what layers that line will be intersecting. Additinally we calculate the coordinates where the line intersects each layer.

### Step 3: Intersections To Shapes
### Step 4: Shapes To Slices
### Step 5: Generate Inner Lines
### Step 6: Generate Outlines
### Step 7: Generate Infills
### Step 8: Generate Support
### Step 9: AddBrim

```
let {
  brim: { size: brimSize },
  nozzleDiameter
} = settings;

nozzleDiameter /= PRECISION;
brimSize /= PRECISION;
const nozzleRadius = nozzleDiameter / 2;

const [firstLayer] = slices;

const brim = firstLayer.parts.reduce((brim, { shape }) => (
  brim.join(shape.offset(nozzleRadius, {
    endType: shape.closed ? 'etClosedPolygon' : 'etOpenRound'
  }))
), new Shape([], true)).simplify('pftNonZero');

firstLayer.brim = new Shape([], true);

for (let offset = 0; offset < brimSize; offset += nozzleDiameter) {
  const brimPart = brim.offset(offset, OFFSET_OPTIONS);
  firstLayer.brim = firstLayer.brim.join(brimPart);
}
```

### Step 10: Optimize Paths
### Step 11: Slices To GCode
