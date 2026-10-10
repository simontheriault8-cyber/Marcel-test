import { Injectable, signal } from '@angular/core';

export interface MelLimitation {
  id: string;
  category: 'Geographic' | 'Occupational';
  text: string;
  textFr?: string;
}

export const MEL_LIMITATIONS: MelLimitation[] = [
  { id: 'geo_1', category: 'Geographic', text: 'Requires periodic medical follow-up no more frequently than every six months', textFr: 'Nécessite un suivi médical périodique pas plus fréquemment que tous les six mois' },
  { id: 'geo_2', category: 'Geographic', text: 'Requires annual specialist follow-up', textFr: 'Nécessite un suivi annuel par un spécialiste' },
  { id: 'geo_3', category: 'Geographic', text: 'Requires regular access to (select from: laboratory services, diagnostic imaging) every 6 months', textFr: 'Nécessite un accès régulier à des services de laboratoire ou d’imagerie diagnostique tous les 6 mois' },
  { id: 'geo_4', category: 'Geographic', text: 'Requires screening with a medical officer before selection for an operational environment or tasking to a remote location to confirm deployability', textFr: 'Exige un contrôle par un médecin militaire avant la sélection pour un environnement opérationnel ou une affectation dans un endroit éloigné afin de confirmer la déployabilité' },
  { id: 'geo_5', category: 'Geographic', text: 'Requires screening with a medical specialist before selection for an operational environment or tasking to a remote location to confirm deployability', textFr: 'Exige un contrôle par un médecin spécialiste militaire avant la sélection pour un environnement opérationnel ou une affectation dans un endroit éloigné afin de confirmer la déployabilité' },
  { id: 'geo_6', category: 'Geographic', text: 'Member has a chronic medical condition with a <10% risk of recurrence over 10 years. In the event of a recurrence, the member will require Level 1 medical care within 24 hours.', textFr: 'Affection médicale chronique avec un risque de récidive < 10 % sur 10 ans. En cas de récidive, nécessite des soins médicaux de niveau 1 dans les 24 heures.' },
  
  { id: 'occ_1', category: 'Occupational', text: 'Required to carry self-administered medication at all times', textFr: 'Doit porter sur soi des médicaments à auto-administrer en tout temps' },
  { id: 'occ_2', category: 'Occupational', text: 'May require use of medication prior to physical activities, in cold weather or in high altitude environments', textFr: 'Peut nécessiter l’utilisation de médicaments avant des activités physiques, par temps froid ou en haute altitude' },
  { id: 'occ_3', category: 'Occupational', text: 'Should avoid routinely handling material weighing more than 20 Kg (lifting, pushing, pulling, holding)', textFr: 'Doit éviter de manipuler de façon routinière du matériel pesant plus de 20 kg' },
  { id: 'occ_4', category: 'Occupational', text: 'Should avoid rucksack marching beyond what is required to comply with basic training requirements', textFr: 'Doit éviter les marches avec sac à dos au-delà des exigences de l’instruction de base' },
  { id: 'occ_5', category: 'Occupational', text: 'Unable to perform drill and parades for longer than 40 minutes', textFr: 'Incapable d’exécuter l’exercice militaire et les rassemblements pendant plus de 40 minutes' },
  { id: 'occ_6', category: 'Occupational', text: 'Medically unable to tolerate sea environment (ship\'s motion at sea)', textFr: 'Incapable médicalement de tolérer l’environnement maritime (mouvement du navire en mer)' },
  { id: 'occ_7', category: 'Occupational', text: 'Unable to tolerate shaving (to follow CAF standards for beard trimming and to shave only when training/operationally required)', textFr: 'Incapable de tolérer le rasage (doit respecter les normes des FAC pour la taille de la barbe)' },
  { id: 'occ_8', category: 'Occupational', text: 'Should use specialized electrical equipment during sleep (AC/DC)', textFr: 'Doit utiliser un équipement électrique spécialisé pendant le sommeil (CA/CC)' },
  { id: 'occ_9', category: 'Occupational', text: 'Should avoid dehydration as this may exacerbate a chronic medical condition', textFr: 'Doit éviter la déshydratation car cela peut exacerber une affection médicale chronique' }
];

export interface MelOccupation {
  id: string;
  displayId?: string;
  abbreviation: string;
  type: 'Officers' | 'NCMs';
  isHighlighted?: boolean;
}

export const ARMY_OCCUPATIONS: MelOccupation[] = [
  { id: '00178', abbreviation: 'ARMD', type: 'Officers' },
  { id: '00179', abbreviation: 'ARTY', type: 'Officers' },
  { id: '00180', abbreviation: 'INF', type: 'Officers' },
  { id: '00181', abbreviation: 'ENGR', type: 'Officers' },
  { id: '00187', abbreviation: 'EME', type: 'Officers' },
  { id: '00341', abbreviation: 'SIGS', type: 'Officers' },
  { id: '00005', abbreviation: 'Arm NCM', type: 'NCMs' },
  { id: '00010', abbreviation: 'Inftr', type: 'NCMs' },
  { id: '00129', abbreviation: 'Veh Tech', type: 'NCMs' },
  { id: '00130', abbreviation: 'W Tech L', type: 'NCMs' },
  { id: '00134', abbreviation: 'Mat Tech', type: 'NCMs' },
  { id: '00327', abbreviation: 'EO Tech (L)', type: 'NCMs' },
  { id: '00388', abbreviation: 'LEET', type: 'NCMs' },
  { id: '00238', abbreviation: 'Geo Tech', type: 'NCMs' },
  { id: '00339', abbreviation: 'Cbt Engr', type: 'NCMs' },
  { id: '00368', abbreviation: 'Gnr', type: 'NCMs' },
  { id: '00383', abbreviation: 'Sig Op', type: 'NCMs' },
  { id: '00384', abbreviation: 'Line Tech', type: 'NCMs' },
  { id: '00385', abbreviation: 'Sig Tech', type: 'NCMs' },
  { id: '00394', abbreviation: 'IS Tech', type: 'NCMs' }
];

export const RCN_OCCUPATIONS: MelOccupation[] = [
  { id: '00345', abbreviation: 'MSENG', type: 'Officers' },
  { id: '00207', abbreviation: 'NWO', type: 'Officers' },
  { id: '00344', abbreviation: 'NCS Eng', type: 'Officers' },
  { id: '00299', abbreviation: 'Nav Comm', type: 'NCMs' },
  { id: '00114', abbreviation: 'NCI OP', type: 'NCMs' },
  { id: '00324', abbreviation: 'SONAR OP', type: 'NCMs' },
  { id: '00366', abbreviation: 'WENG TECH', type: 'NCMs' },
  { id: '00105', abbreviation: 'BOSN', type: 'NCMs' },
  { id: '00342', abbreviation: 'Clr Dv *', type: 'NCMs', isHighlighted: true },
  { id: '00379', abbreviation: 'MAR Tech', type: 'NCMs' },
  { id: '00404', abbreviation: 'TESM', type: 'NCMs' },
  { id: '00405', abbreviation: 'TMSM', type: 'NCMs' },
  { id: '00115', abbreviation: 'NES Op', type: 'NCMs' }
];

export const RCAF_OCCUPATIONS: MelOccupation[] = [
  { id: '00182', abbreviation: 'ACSO', type: 'Officers' },
  { id: '00183', abbreviation: 'Plt', type: 'Officers' },
  { id: '00184', abbreviation: 'AEC', type: 'Officers' },
  { id: '00185', abbreviation: 'AERE', type: 'Officers' },
  { id: '00189', abbreviation: 'Const Eng', type: 'Officers' },
  { id: '00340', abbreviation: 'CELE', type: 'Officers' },
  { id: '00389', abbreviation: 'Air Ops O', type: 'Officers' },
  { id: '00019', abbreviation: 'AES Op', type: 'NCMs' },
  { id: '00021', abbreviation: 'Flt Engr *', type: 'NCMs', isHighlighted: true },
  { id: '00101', abbreviation: 'SAR Tech *', type: 'NCMs', isHighlighted: true },
  { id: '00109', abbreviation: 'ATIS Tech', type: 'NCMs' },
  { id: '00135', abbreviation: 'AVN Tech', type: 'NCMs' },
  { id: '00136', abbreviation: 'AVS Tech', type: 'NCMs' },
  { id: '00138', abbreviation: 'ACS Tech', type: 'NCMs' },
  { id: '00149', abbreviation: 'Fire Ftr', type: 'NCMs' },
  { id: '00261', abbreviation: 'AWS Tech', type: 'NCMs' },
  { id: '00301', abbreviation: 'RM Tech', type: 'NCMs' },
  { id: '00302', abbreviation: 'ED Tech', type: 'NCMs' },
  { id: '00303', abbreviation: 'EGS Tech', type: 'NCMs' },
  { id: '00304', abbreviation: 'PH Tech', type: 'NCMs' },
  { id: '00305', abbreviation: 'WFE Tech', type: 'NCMs' },
  { id: '00306', abbreviation: 'Const Tech', type: 'NCMs' },
  { id: '00307', abbreviation: 'CE Supt *', type: 'NCMs', isHighlighted: true },
  { id: '00337', abbreviation: 'AC Op', type: 'NCMs' },
  { id: '00363', abbreviation: 'Air Maint Supt', type: 'NCMs' },
  { id: '00343', abbreviation: 'NDT Tech', type: 'NCMs' },
  { id: '00370', abbreviation: 'DS Tech', type: 'NCMs' },
  { id: '00373', abbreviation: 'Av Phys Tech *', type: 'NCMs', isHighlighted: true },
  { id: '00386', abbreviation: 'AOS Tech', type: 'NCMs' },
  { id: '00387', abbreviation: 'Air Drop Syst Tech *', type: 'NCMs', isHighlighted: true },
  { id: '00099', abbreviation: 'Int Op', type: 'NCMs' }
];

export const CMP_OCCUPATIONS: MelOccupation[] = [
  // Officers
  { id: '00211', abbreviation: 'TRG Dev', type: 'Officers' },
  { id: '00214', abbreviation: 'MPO', type: 'Officers' },
  { id: '00203', abbreviation: 'PAO', type: 'Officers' },
  { id: '00208', abbreviation: 'PSEL', type: 'Officers' },
  { id: '00328-02', abbreviation: 'LOG Air', type: 'Officers' },
  { id: '00328-03', abbreviation: 'LOG Land', type: 'Officers' },
  { id: '00328-04', abbreviation: 'LOG Sea', type: 'Officers' },
  { id: '00204', abbreviation: 'Leq', type: 'Officers' },
  { id: '00349', abbreviation: 'Chap', type: 'Officers' },
  { id: '00210', abbreviation: 'MUSC', type: 'Officers' },
  { id: '00190', abbreviation: 'Physio', type: 'Officers' },
  { id: '00191', abbreviation: 'Dent', type: 'Officers' },
  { id: '00194', abbreviation: 'Pharm', type: 'Officers' },
  { id: '00195', abbreviation: 'Nur', type: 'Officers' },
  { id: '00197', abbreviation: 'BIO', type: 'Officers' },
  { id: '00198', abbreviation: 'SOCW', type: 'Officers' },
  { id: '00374', abbreviation: 'PA', type: 'Officers' },
  { id: '00390', abbreviation: 'Med Spec', type: 'Officers' },
  { id: '00393', abbreviation: 'Med', type: 'Officers' },
  { id: '00398', abbreviation: 'HSM', type: 'Officers' },
  { id: '00213-02', abbreviation: 'Int Land', type: 'Officers' },
  { id: '00213-01', abbreviation: 'Int Sea', type: 'Officers' },
  { id: '00213-04', abbreviation: 'Int Air', type: 'Officers' },
  { id: '00378', abbreviation: 'Cyber Op', type: 'Officers' },
  { id: '00120', abbreviation: 'SIGINT', type: 'Officers' },
  // NCMs
  { id: '00166', abbreviation: 'MUSCN', type: 'NCMs' },
  { id: '00377', abbreviation: 'P&D', type: 'NCMs' },
  { id: '00150', abbreviation: 'Med A', type: 'NCMs' },
  { id: '00152', abbreviation: 'Lab Tech', type: 'NCMs' },
  { id: '00153', abbreviation: 'Rad Tech', type: 'NCMs' },
  { id: '00155', abbreviation: 'BE Tech', type: 'NCMs' },
  { id: '00334', abbreviation: 'Med Tech', type: 'NCMs' },
  { id: '00335', abbreviation: 'Dent Tech', type: 'NCMs' },
  { id: '00371', abbreviation: 'Pmed Tech', type: 'NCMs' },
  { id: '00372', abbreviation: 'OR Tech', type: 'NCMs' },
  { id: '00406', abbreviation: 'Para Med', type: 'NCMs' },
  { id: '00407', abbreviation: 'Combat Med', type: 'NCMs' },
  { id: '00099-03', abbreviation: 'Int Op Land', type: 'NCMs' },
  { id: '00099-02', abbreviation: 'Int Op Sea', type: 'NCMs' },
  { id: '00099-04', abbreviation: 'Int Op Air', type: 'NCMs' },
  { id: '00100-IntLand', displayId: '00100', abbreviation: 'Int Tech Land', type: 'NCMs' },
  { id: '00100-IntSea', displayId: '00100', abbreviation: 'Int Tech Sea', type: 'NCMs' },
  { id: '00100-IntAir', displayId: '00100', abbreviation: 'Int Tech Air', type: 'NCMs' },
  { id: '00164', abbreviation: 'Cook', type: 'NCMs' },
  { id: '00167', abbreviation: 'Post Clk', type: 'NCMs' },
  { id: '00168', abbreviation: 'Mat Mq Tech', type: 'NCMs' },
  { id: '00169', abbreviation: 'MMO Tech', type: 'NCMs' },
  { id: '00170', abbreviation: 'Tfc Tech', type: 'NCMs' },
  { id: '00171', abbreviation: 'MES Op', type: 'NCMs' },
  { id: '00375', abbreviation: 'HRA', type: 'NCMs' },
  { id: '00376', abbreviation: 'FSA', type: 'NCMs' },
  { id: '00137', abbreviation: 'MAGE Tech', type: 'NCMs' },
  { id: '00161', abbreviation: 'MP', type: 'NCMs' },
  { id: '00100-MetAir', displayId: '00100', abbreviation: 'MET Tech - Air', type: 'NCMs' },
  { id: '00100-MetLand', displayId: '00100', abbreviation: 'MET Tech - Land', type: 'NCMs' },
  { id: '00100-MetSea', displayId: '00100', abbreviation: 'MET Tech - Sea', type: 'NCMs' }
];

export const MEL_OCCUPATIONS: MelOccupation[] = [
  ...ARMY_OCCUPATIONS,
  ...RCN_OCCUPATIONS,
  ...RCAF_OCCUPATIONS,
  ...CMP_OCCUPATIONS
];

type AcceptabilityMatrix = Record<string, Record<string, boolean>>;

// Function to set the initial values based on the images
function getInitialMatrix(): AcceptabilityMatrix {
  const matrix: AcceptabilityMatrix = {};
  
  for (const mel of MEL_LIMITATIONS) {
    matrix[mel.id] = {};
    for (const occ of MEL_OCCUPATIONS) {
      // Default to true, we will set the false ones based on the matrices
      matrix[mel.id][occ.id] = true;
    }
  }

  // --- ARMY MATRIX CONFIGURATION ---
  // Row 3: geo_3 - all Army No
  for (const occ of ARMY_OCCUPATIONS) matrix['geo_3'][occ.id] = false;

  // Row 8: occ_2 - No for: 00178, 00179, 00180, 00181, 00005, 00010, 00339, 00368
  ['00178', '00179', '00180', '00181', '00005', '00010', '00339', '00368'].forEach(id => {
    if (matrix['occ_2'][id] !== undefined) matrix['occ_2'][id] = false;
  });

  // Row 9: occ_3 - No for all Army except 00388 and 00238
  ARMY_OCCUPATIONS.forEach(occ => {
    if (occ.id !== '00388' && occ.id !== '00238') matrix['occ_3'][occ.id] = false;
  });

  // Row 10: occ_4 - No for all Army except 00388
  ARMY_OCCUPATIONS.forEach(occ => {
    if (occ.id !== '00388') matrix['occ_4'][occ.id] = false;
  });

  // Row 15: occ_9 - No for: 00178, 00180, 00005, 00010
  ['00178', '00180', '00005', '00010'].forEach(id => {
    if (matrix['occ_9'][id] !== undefined) matrix['occ_9'][id] = false;
  });

  // --- RCN MATRIX CONFIGURATION ---
  // Row 3: geo_3 - all RCN No
  for (const occ of RCN_OCCUPATIONS) matrix['geo_3'][occ.id] = false;

  // Row 7: occ_1 - No for 00342 (Clr Dv *)
  if (matrix['occ_1']['00342'] !== undefined) matrix['occ_1']['00342'] = false;

  // Row 8: occ_2 - No for 00342 (Clr Dv *)
  if (matrix['occ_2']['00342'] !== undefined) matrix['occ_2']['00342'] = false;

  // Row 9: occ_3 - all RCN No
  for (const occ of RCN_OCCUPATIONS) matrix['occ_3'][occ.id] = false;

  // Row 12: occ_6 - all RCN No (sea environment)
  for (const occ of RCN_OCCUPATIONS) matrix['occ_6'][occ.id] = false;

  // Row 14: occ_8 - No for 00342 (Clr Dv *)
  if (matrix['occ_8']['00342'] !== undefined) matrix['occ_8']['00342'] = false;

  // Row 15: occ_9 - No for 00342 (Clr Dv *)
  if (matrix['occ_9']['00342'] !== undefined) matrix['occ_9']['00342'] = false;

  // --- RCAF MATRIX CONFIGURATION ---
  // Row 1: geo_1 - No for 00101
  if (matrix['geo_1']['00101'] !== undefined) matrix['geo_1']['00101'] = false;

  // Row 2: geo_2 - No for 00101
  if (matrix['geo_2']['00101'] !== undefined) matrix['geo_2']['00101'] = false;

  // Row 3: geo_3 - No for all RCAF EXCEPT 00185
  RCAF_OCCUPATIONS.forEach(occ => {
    if (occ.id !== '00185' && matrix['geo_3'][occ.id] !== undefined) matrix['geo_3'][occ.id] = false;
  });

  // Row 4: geo_4 - Yes for 00184, 00185, 00340, 00389, 00109, 00135, 00136, 00138, 00261, 00307, 00337, 00363, 00343, 00386
  const geo4RcafYes = new Set(['00184', '00185', '00340', '00389', '00109', '00135', '00136', '00138', '00261', '00307', '00337', '00363', '00343', '00386']);
  RCAF_OCCUPATIONS.forEach(occ => {
    if (!geo4RcafYes.has(occ.id) && matrix['geo_4'][occ.id] !== undefined) matrix['geo_4'][occ.id] = false;
  });

  // Row 5: geo_5 - No for all RCAF EXCEPT 00185
  RCAF_OCCUPATIONS.forEach(occ => {
    if (occ.id !== '00185' && matrix['geo_5'][occ.id] !== undefined) matrix['geo_5'][occ.id] = false;
  });

  // Row 6: occ_1 - All Yes (no changes)

  // Row 7 & 8: occ_1 and occ_2 - No for 00182, 00183, 00019, 00149
  ['00182', '00183', '00019', '00149'].forEach(id => {
    if (matrix['occ_1']?.[id] !== undefined) matrix['occ_1'][id] = false;
    if (matrix['occ_2']?.[id] !== undefined) matrix['occ_2'][id] = false;
  });

  // Row 9: occ_3 - Yes ONLY for 00184, 00185, 00340, 00389, 00109, 00337
  const occ3RcafYes = new Set(['00184', '00185', '00340', '00389', '00109', '00337']);
  RCAF_OCCUPATIONS.forEach(occ => {
    if (!occ3RcafYes.has(occ.id) && matrix['occ_3']?.[occ.id] !== undefined) matrix['occ_3'][occ.id] = false;
  });

  // Row 10: occ_4 - Yes ONLY for 00184, 00185, 00340, 00389, 00109, 00337, 00363
  const occ4RcafYes = new Set(['00184', '00185', '00340', '00389', '00109', '00337', '00363']);
  RCAF_OCCUPATIONS.forEach(occ => {
    if (!occ4RcafYes.has(occ.id) && matrix['occ_4']?.[occ.id] !== undefined) matrix['occ_4'][occ.id] = false;
  });

  // Row 11: occ_5 - No for 00101
  if (matrix['occ_5']?.['00101'] !== undefined) matrix['occ_5']['00101'] = false;

  // Row 12: occ_6 - No for 00182, 00183, 00019, 00021, 00101, 00135, 00136, 00138, 00261, 00363
  ['00182', '00183', '00019', '00021', '00101', '00135', '00136', '00138', '00261', '00363'].forEach(id => {
    if (matrix['occ_6']?.[id] !== undefined) matrix['occ_6'][id] = false;
  });

  // Row 13: occ_7 - No for 00138, 00149
  ['00138', '00149'].forEach(id => {
    if (matrix['occ_7']?.[id] !== undefined) matrix['occ_7'][id] = false;
  });

  // Row 14: occ_8 - No for 00182, 00183, 00019, 00021, 00101
  ['00182', '00183', '00019', '00021', '00101'].forEach(id => {
    if (matrix['occ_8']?.[id] !== undefined) matrix['occ_8'][id] = false;
  });

  // Row 15: occ_9 - No for 00183, 00101, 00149
  ['00183', '00101', '00149'].forEach(id => {
    if (matrix['occ_9']?.[id] !== undefined) matrix['occ_9'][id] = false;
  });

  // --- CMP MATRIX CONFIGURATION ---
  // Row 3: geo_3 - No for: 00208, 00328-02, 00328-03, 00328-04, 00204, 00349, 00190, 00191, 00194, 00195, 00197, 00198, 00374, 00390, 00393, 00398, 00213-02, 00150, 00152, 00153, 00155, 00334, 00335, 00371, 00372, 00406, 00407, 00099-03, 00100-IntLand, 00100-MetLand
  const geo3CmpNos = new Set([
    '00208', '00328-02', '00328-03', '00328-04', '00204', '00349', '00190', '00191', '00194', '00195', '00197', '00198', '00374', '00390', '00393', '00398', '00213-02',
    '00150', '00152', '00153', '00155', '00334', '00335', '00371', '00372', '00406', '00407', '00099-03', '00100-IntLand', '00100-MetLand'
  ]);
  geo3CmpNos.forEach(id => {
    if (matrix['geo_3']?.[id] !== undefined) matrix['geo_3'][id] = false;
  });

  // Row 6: geo_6 - No for 00328-04 (LOG Sea)
  if (matrix['geo_6']?.['00328-04'] !== undefined) matrix['geo_6']['00328-04'] = false;

  // Row 7: occ_1 - No for 00208 (PSEL)
  if (matrix['occ_1']?.['00208'] !== undefined) matrix['occ_1']['00208'] = false;

  // Row 8: occ_2 - No for 00214 (MPO), 00208 (PSEL)
  ['00214', '00208'].forEach(id => {
    if (matrix['occ_2']?.[id] !== undefined) matrix['occ_2'][id] = false;
  });

  // Row 9: occ_3 - Yes ONLY for: 00211, 00208, 00204, 00210, 00198, 00390, 00378, 00120, 00377, 00171, 00100-MetAir, 00100-MetSea
  const occ3CmpYes = new Set([
    '00211', '00208', '00204', '00210', '00198', '00390', '00378', '00120', '00377', '00171', '00100-MetAir', '00100-MetSea'
  ]);
  CMP_OCCUPATIONS.forEach(occ => {
    if (!occ3CmpYes.has(occ.id) && matrix['occ_3']?.[occ.id] !== undefined) matrix['occ_3'][occ.id] = false;
  });

  // Row 10: occ_4 - No for: 00328-03, 00191, 00213-02, 00150, 00334, 00406, 00407, 00099-03, 00100-IntLand
  ['00328-03', '00191', '00213-02', '00150', '00334', '00406', '00407', '00099-03', '00100-IntLand'].forEach(id => {
    if (matrix['occ_4']?.[id] !== undefined) matrix['occ_4'][id] = false;
  });

  // Row 11: occ_5 - No for 00210 (MUSC), 00377 (P&D)
  ['00210', '00377'].forEach(id => {
    if (matrix['occ_5']?.[id] !== undefined) matrix['occ_5'][id] = false;
  });

  // Row 12: occ_6 - No for 00328-04 (LOG Sea)
  if (matrix['occ_6']?.['00328-04'] !== undefined) matrix['occ_6']['00328-04'] = false;

  // Row 15: occ_9 - No for: 00190, 00194, 00198, 00374, 00390, 00377, 00155, 00334, 00371, 00372, 00406
  ['00190', '00194', '00198', '00374', '00390', '00377', '00155', '00334', '00371', '00372', '00406'].forEach(id => {
    if (matrix['occ_9']?.[id] !== undefined) matrix['occ_9'][id] = false;
  });

  return matrix;
}

@Injectable({
  providedIn: 'root'
})
export class MelService {
  // State of the applicant's limitations (which ones they checked)
  applicantLimitations = signal<Record<string, boolean>>({});

  // Configuration matrix
  acceptabilityMatrix = signal<AcceptabilityMatrix>(getInitialMatrix());

  toggleApplicantLimitation(melId: string) {
    this.applicantLimitations.update(state => ({
      ...state,
      [melId]: !state[melId]
    }));
  }

  resetApplicantLimitations() {
    this.applicantLimitations.set({});
  }

  setAcceptability(melId: string, occId: string, value: boolean) {
    this.acceptabilityMatrix.update(matrix => {
      const newMatrix = { ...matrix };
      newMatrix[melId] = { ...newMatrix[melId], [occId]: value };
      return newMatrix;
    });
  }
}
