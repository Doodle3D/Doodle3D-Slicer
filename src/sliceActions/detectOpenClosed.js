export default function detectOpenClosed(geometry) {
  console.log('detecting open and closed lines');

  const pools = getPools(geometry);
  const openVertices = getOpenVertices(geometry);

  const openFaces = [];
  for (let i = 0; i < pools.length; i ++) {
    const pool = pools[i];

    const isOpen = pool.some(face => openVertices[face.a] || openVertices[face.b] || openVertices[face.c]);

    if (isOpen) openFaces.splice(openFaces.length, 0, ...pool);
  }

  return geometry.faces.map(face => openFaces.includes(face));
}

function findPool(pools, faceA) {
  for (let i = 0; i < pools.length; i ++) {
    const pool = pools[i];

    if (pool.find(faceB => faceA.a === faceB.a || faceA.a === faceB.b || faceA.a === faceB.c)) {
      return pool;
    }
  }

  const pool = [];
  pools.push(pool);
  return pool;
}

function getPools(geometry) {
  const pools = [];

  for (let i = 0; i < geometry.faces.length; i ++) {
    const face = geometry.faces[i];
    const pool = findPool(pools, face);
    pool.push(face);
  }

  for (let i = 0; i < pools.length; i ++) {
    const poolA = pools[i];

    for (let j = i + 1; j < pools.length; j ++) {
      const poolB = pools[j];

      for (let k = 0; k < poolA.length; k ++) {
        const faceA = poolA[k];
        if (poolB.find(faceB => faceA.a === faceB.a || faceA.a === faceB.b || faceA.a === faceB.c)) {
          poolA.splice(poolA.length, 0, ...poolB);
          poolB.splice(0, poolB.length);
        }
      }
    }
  }

  return pools.filter(pool => pool.length > 0);
}

function getOpenVertices(geometry) {
  const vertices = Array(geometry.vertices.length).fill(0);
  for (let i = 0; i < geometry.faces.length; i ++) {
    const face = geometry.faces[i];
    vertices[face.a] ++;
    vertices[face.b] ++;
    vertices[face.c] ++;
  }

  return vertices.map(numFaces => numFaces < 4);
}
