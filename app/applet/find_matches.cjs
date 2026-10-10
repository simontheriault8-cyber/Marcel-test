const fs = require('fs');
const lines = fs.readFileSync('src/services/jobs-data.ts', 'utf8').split('\n');
let count = 0;
lines.forEach((line, i) => {
  if (/[A-Za-zÉéÀàÈèÙùÂâÊêÎîÔôÛû]\s+[0-9]+(?:,\s*[0-9]+)*\s+\(/.test(line)) {
    if (count < 30) console.log(i + 1 + ': ' + line.trim());
    count++;
  }
});