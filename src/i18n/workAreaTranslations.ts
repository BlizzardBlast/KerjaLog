export const workAreaEn = {
  'workArea.eyebrow': 'Work areas',
  'workArea.title': 'Organize work without managing projects',
  'workArea.description':
    'Use lightweight labels for projects, recurring responsibilities, or areas of work. They stay private on this device.',
  'workArea.selector.label': 'Work area (optional)',
  'workArea.selector.description':
    'Add a lightweight label so this entry is easier to find and group later.',
  'workArea.selector.accessibilityLabel': 'Choose a work area',
  'workArea.none': 'No work area',
  'workArea.loading': 'Loading work areas…',
  'workArea.loadError': 'Work areas could not be loaded.',
  'workArea.retry': 'Try again',
  'workArea.manage': 'Manage work areas',
  'workArea.createFirst': 'Create a work area',
  'workArea.createTitle': 'New work area',
  'workArea.renameTitle': 'Rename work area',
  'workArea.nameLabel': 'Work area name',
  'workArea.namePlaceholder': 'Example: Mobile App Revamp',
  'workArea.createAction': 'Create',
  'workArea.renameAction': 'Rename',
  'workArea.cancel': 'Cancel',
  'workArea.mutationError':
    'KerjaLog could not save this work area. Check the name and try again.',
  'workArea.activeTitle': 'Active',
  'workArea.activeEmpty':
    'No work areas yet. Create one when a project or recurring responsibility is useful for grouping entries.',
  'workArea.archivedTitle': 'Archived',
  'workArea.archivedName': '{{name}} · Archived',
  'workArea.archive.title': 'Archive this work area?',
  'workArea.archive.description':
    'It will disappear from new-entry choices but stay attached to existing work history.',
  'workArea.archive.action': 'Archive',
  'workArea.done': 'Done',
  'workArea.savedLabel': 'Work area',
} as const;

export const workAreaId: Record<keyof typeof workAreaEn, string> = {
  'workArea.eyebrow': 'Area kerja',
  'workArea.title': 'Atur pekerjaan tanpa mengelola proyek',
  'workArea.description':
    'Gunakan label ringan untuk proyek, tanggung jawab rutin, atau area pekerjaan. Data tetap privat di perangkat ini.',
  'workArea.selector.label': 'Area kerja (opsional)',
  'workArea.selector.description':
    'Tambahkan label ringan agar entri ini lebih mudah ditemukan dan dikelompokkan nanti.',
  'workArea.selector.accessibilityLabel': 'Pilih area kerja',
  'workArea.none': 'Tanpa area kerja',
  'workArea.loading': 'Memuat area kerja…',
  'workArea.loadError': 'Area kerja tidak dapat dimuat.',
  'workArea.retry': 'Coba lagi',
  'workArea.manage': 'Kelola area kerja',
  'workArea.createFirst': 'Buat area kerja',
  'workArea.createTitle': 'Area kerja baru',
  'workArea.renameTitle': 'Ubah nama area kerja',
  'workArea.nameLabel': 'Nama area kerja',
  'workArea.namePlaceholder': 'Contoh: Pembaruan Aplikasi Mobile',
  'workArea.createAction': 'Buat',
  'workArea.renameAction': 'Ubah nama',
  'workArea.cancel': 'Batal',
  'workArea.mutationError':
    'KerjaLog tidak dapat menyimpan area kerja ini. Periksa nama lalu coba lagi.',
  'workArea.activeTitle': 'Aktif',
  'workArea.activeEmpty':
    'Belum ada area kerja. Buat satu saat proyek atau tanggung jawab rutin berguna untuk mengelompokkan entri.',
  'workArea.archivedTitle': 'Diarsipkan',
  'workArea.archivedName': '{{name}} · Diarsipkan',
  'workArea.archive.title': 'Arsipkan area kerja ini?',
  'workArea.archive.description':
    'Area ini tidak lagi muncul untuk entri baru, tetapi tetap terhubung ke riwayat kerja yang sudah ada.',
  'workArea.archive.action': 'Arsipkan',
  'workArea.done': 'Selesai',
  'workArea.savedLabel': 'Area kerja',
};
