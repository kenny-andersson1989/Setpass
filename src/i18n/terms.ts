type Dict = Record<string, { sv: string; en: string }>;

export const muscles: Dict = {
  abdominals: { sv: 'Mage', en: 'Abdominals' }, abductors: { sv: 'Abduktorer', en: 'Abductors' },
  adductors: { sv: 'Adduktorer', en: 'Adductors' }, biceps: { sv: 'Biceps', en: 'Biceps' },
  calves: { sv: 'Vader', en: 'Calves' }, chest: { sv: 'Bröst', en: 'Chest' }, forearms: { sv: 'Underarmar', en: 'Forearms' },
  glutes: { sv: 'Säte', en: 'Glutes' }, hamstrings: { sv: 'Baksida lår', en: 'Hamstrings' }, lats: { sv: 'Latissimus', en: 'Lats' },
  'lower back': { sv: 'Ländrygg', en: 'Lower back' }, 'middle back': { sv: 'Övre rygg', en: 'Middle back' },
  neck: { sv: 'Nacke', en: 'Neck' }, quadriceps: { sv: 'Framsida lår', en: 'Quadriceps' }, shoulders: { sv: 'Axlar', en: 'Shoulders' },
  traps: { sv: 'Trapezius', en: 'Traps' }, triceps: { sv: 'Triceps', en: 'Triceps' }
};

export const equipment: Dict = {
  barbell: { sv: 'Skivstång', en: 'Barbell' }, dumbbell: { sv: 'Hantlar', en: 'Dumbbell' }, other: { sv: 'Övrigt', en: 'Other' },
  'body only': { sv: 'Kroppsvikt', en: 'Body only' }, cable: { sv: 'Kabel', en: 'Cable' }, machine: { sv: 'Maskin', en: 'Machine' },
  kettlebells: { sv: 'Kettlebell', en: 'Kettlebells' }, bands: { sv: 'Gummiband', en: 'Bands' },
  'medicine ball': { sv: 'Medicinboll', en: 'Medicine ball' }, 'exercise ball': { sv: 'Pilatesboll', en: 'Exercise ball' },
  'foam roll': { sv: 'Foamroller', en: 'Foam roll' }, 'e-z curl bar': { sv: 'EZ-stång', en: 'EZ curl bar' }
};

export const categories: Dict = {
  strength: { sv: 'Styrka', en: 'Strength' }, stretching: { sv: 'Stretching', en: 'Stretching' },
  plyometrics: { sv: 'Plyometri', en: 'Plyometrics' }, powerlifting: { sv: 'Styrkelyft', en: 'Powerlifting' },
  'olympic weightlifting': { sv: 'Tyngdlyftning', en: 'Olympic weightlifting' }, strongman: { sv: 'Strongman', en: 'Strongman' },
  cardio: { sv: 'Kondition', en: 'Cardio' }
};

export const levels: Dict = {
  beginner: { sv: 'Nybörjare', en: 'Beginner' }, intermediate: { sv: 'Medel', en: 'Intermediate' }, expert: { sv: 'Avancerad', en: 'Expert' }
};
