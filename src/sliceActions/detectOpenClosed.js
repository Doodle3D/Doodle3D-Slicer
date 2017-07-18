export default function detectOpenClosed(lines) {
  console.log('detecting open and closed lines');

  const pools = getPools(lines);
  const openLines = lines.map(line => line.connects.length === 2);

  for (let i = 0; i < pools.length; i ++) {
    const pool = pools[i];

    const isOpen = pool.some(lineIndex => openLines[lineIndex]);

    for (let j = 0; j < pool.length; j ++) {
      const lineIndex = pool[j];
      const line = lines[lineIndex];
      line.open = isOpen;
    }
  }
}

function findPool(pools, lines, lineIndex) {
  const { connects } = lines[lineIndex];
  for (let i = 0; i < pools.length; i ++) {
    const pool = pools[i];

    if (pool.find(lineIndex => connects.includes(lineIndex))) {
      return pool;
    }
  }

  // no pool found
  // create new pool
  const pool = [];
  pools.push(pool);
  return pool;
}

function getPools(lines) {
  const pools = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex ++) {
    const pool = findPool(pools, lines, lineIndex);
    pool.push(lineIndex);
  }

  for (let i = 0; i < pools.length; i ++) {
    const poolA = pools[i];

    for (let j = i + 1; j < pools.length; j ++) {
      const poolB = pools[j];

      for (let k = 0; k < poolA.length; k ++) {
        const { connects } = lines[poolA[k]];

        if (poolB.find(lineIndex => connects.includes(lineIndex))) {
          poolA.splice(poolA.length, 0, ...poolB);
          poolB.splice(0, poolB.length);
        }
      }
    }
  }

  return pools.filter(pool => pool.length > 0);
}
