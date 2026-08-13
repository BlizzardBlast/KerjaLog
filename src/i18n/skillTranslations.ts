export const skillEn = {
  'skill.communication': 'Communication',
  'skill.collaboration': 'Collaboration',
  'skill.problemSolving': 'Problem-solving',
  'skill.execution': 'Execution',
  'skill.attentionToDetail': 'Attention to detail',
  'skill.customerOrientation': 'Customer orientation',
  'skill.ownership': 'Ownership',
  'skill.adaptability': 'Adaptability',
  'skill.leadership': 'Leadership',
  'skill.roleExpertise': 'Technical or role-specific expertise',
} as const;

export type SkillTranslationKey = keyof typeof skillEn;

export const skillId: Record<SkillTranslationKey, string> = {
  'skill.communication': 'Komunikasi',
  'skill.collaboration': 'Kolaborasi',
  'skill.problemSolving': 'Pemecahan masalah',
  'skill.execution': 'Eksekusi',
  'skill.attentionToDetail': 'Ketelitian',
  'skill.customerOrientation': 'Orientasi pelanggan',
  'skill.ownership': 'Tanggung jawab',
  'skill.adaptability': 'Adaptabilitas',
  'skill.leadership': 'Kepemimpinan',
  'skill.roleExpertise': 'Keahlian teknis atau spesifik peran',
};
