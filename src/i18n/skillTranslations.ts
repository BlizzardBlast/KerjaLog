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
  'entry.skills.eyebrow': 'Career evidence',
  'entry.skills.title': 'What does this demonstrate?',
  'entry.skills.description':
    'KerjaLog can suggest broad skills from the facts you recorded. Confirm only what feels accurate.',
  'entry.skills.suggested': 'Suggested from this entry',
  'entry.skills.continue': 'Review my impact',
  'entry.skills.none': 'No skills confirmed yet',
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
  'entry.skills.eyebrow': 'Bukti karier',
  'entry.skills.title': 'Apa yang ditunjukkan oleh pekerjaan ini?',
  'entry.skills.description':
    'KerjaLog dapat menyarankan keterampilan umum dari fakta yang Anda catat. Konfirmasi hanya yang menurut Anda akurat.',
  'entry.skills.suggested': 'Disarankan dari catatan ini',
  'entry.skills.continue': 'Tinjau dampak saya',
  'entry.skills.none': 'Belum ada keterampilan yang dikonfirmasi',
};
