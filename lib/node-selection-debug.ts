// Утилита для отладки выбора нод

export function debugNodeSelection(nodes: any[], requirements: any) {
  console.log('=== Node Selection Debug ===');
  console.log('Requirements:', requirements);
  console.log('Available nodes:', nodes.length);
  
  nodes.forEach((node, index) => {
    console.log(`\nNode ${index + 1}:`, {
      id: node.id,
      name: node.name,
      available: node.available,
      cpu: `${node.usedCpu}/${node.totalCpu}`,
      memory: `${node.usedMemory}/${node.totalMemory}`,
      disk: `${node.usedDisk}/${node.totalDisk}`,
    });
  });
}

export function calculateNodeScore(node: any, requirements: any): number {
  const cpuScore = (node.totalCpu - node.usedCpu) / node.totalCpu;
  const memoryScore = (node.totalMemory - node.usedMemory) / node.totalMemory;
  const diskScore = (node.totalDisk - node.usedDisk) / node.totalDisk;

  return (cpuScore + memoryScore + diskScore) / 3;
}
