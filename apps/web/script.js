const fs = require('fs');

const numPoints = 16;
const outerRadius = 12;
const innerRadius = 9.5;
const center = { x: 12, y: 12 };

let points = [];
for (let i = 0; i < numPoints * 2; i++) {
  const angle = (i * Math.PI) / numPoints;
  const radius = i % 2 === 0 ? outerRadius : innerRadius;
  const x = center.x + radius * Math.sin(angle);
  const y = center.y - radius * Math.cos(angle);
  points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
}

console.log(points.join(' '));
