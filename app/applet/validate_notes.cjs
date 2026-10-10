const fs = require('fs');

const tsContent = fs.readFileSync('src/services/jobs-data.ts', 'utf8');
const dataStr = tsContent.replace('export const JOBS_DATA: Job[] = ', '').replace(/;\s*$/, '');

let JOBS_DATA;
try {
  eval('JOBS_DATA = ' + dataStr);
} catch (e) {
  console.error("Failed to parse", e);
  process.exit(1);
}

const embeddedRegex = /\b(NOC|NPC|QE|suivants|suivantes|libération|actuel|actuelle|précédent|précédente|précédentes|PM)\b([^\w\d]{1,4}?)((?:[1-9]|1[0-9]|20)(?:,\s*(?:[1-9]|1[0-9]|20))*)\b/gi;
const endRegex = /\s+((?:[1-9]|1[0-9]|20)(?:,\s*(?:[1-9]|1[0-9]|20))*)(?:\s*:)?$/g;

JOBS_DATA.forEach(job => {
  job.details.forEach(detail => {
    const numNotes = detail.notes ? detail.notes.length : 0;
    
    if (numNotes === 0) return;
    
    // We only care if there IS notes, but wait, if numNotes == 0 and there are note refs, that's also an error!
    detail.candidateGroups.forEach(cg => {
      const allStrings = [
        ...cg.candidates,
        ...cg.requirements.flatMap(r => [...r.education, ...r.experience])
      ];
      
      allStrings.forEach(str => {
        const checkNotes = (notesStr) => {
           const nums = notesStr.split(',').map(n => parseInt(n.trim(), 10));
           nums.forEach(n => {
              if (n > numNotes) {
                 console.log(`[Job ${job.id}] Invalid note ref ${n} (max ${numNotes}): "${str}"`);
              }
           });
        };

        const str1 = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        let m;
        const eReg = new RegExp(embeddedRegex);
        while ((m = eReg.exec(str1)) !== null) {
          checkNotes(m[3]);
        }
        
        const endReg = new RegExp(endRegex);
        while ((m = endReg.exec(str1)) !== null) {
           checkNotes(m[1]);
        }
      });
    });
  });
});
