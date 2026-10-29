const fs = require('fs');

const teacherMap = {
  'Cô Đào Thị Mỹ Linh': 'a0000001-0000-0000-0000-000000000003',
  'Thầy Đỗ Anh Huy': 'a0000001-0000-0000-0000-000000000001',
  'Thầy Đỗ Anh Huy (Tổ Trưởng)': 'a0000001-0000-0000-0000-000000000001',
  'Thầy Đồng Nguyên Tuấn': 'a0000001-0000-0000-0000-000000000002',
  'Cô Phạm Thị Thanh Bình': 'a0000001-0000-0000-0000-000000000007',
  'Cô Trần Thị Phi Yến': 'a0000001-0000-0000-0000-000000000008',
  'Cô Nguyễn Thị Mỹ Tâm': 'a0000001-0000-0000-0000-000000000005',
  'Cô Lương Thị Ngọc Ánh': 'a0000001-0000-0000-0000-000000000004',
  'Cô Trịnh Thị Đăng': 'a0000001-0000-0000-0000-000000000006',
};

const labSheetMap = {
  'riverside_primary': 'CS1-TH',
  'riverside_secondary': 'CS1-TrH',
  'central': 'CS2',
  'global': 'CS3',
  'hill': 'CS4',
  'beach': 'CS5',
};

const teacherMeta = {
  'huy': { uuid: 'a0000001-0000-0000-0000-000000000001', code: 'HUY', campus: 'riverside', name: 'Thầy Đỗ Anh Huy' },
  'tuan': { uuid: 'a0000001-0000-0000-0000-000000000002', code: 'TUAN', campus: 'riverside', name: 'Thầy Đồng Nguyên Tuấn' },
  'linh': { uuid: 'a0000001-0000-0000-0000-000000000003', code: 'LINH', campus: 'riverside', name: 'Cô Đào Thị Mỹ Linh' },
  'anh': { uuid: 'a0000001-0000-0000-0000-000000000004', code: 'ANH', campus: 'hill', name: 'Cô Lương Thị Ngọc Ánh' },
  'tam': { uuid: 'a0000001-0000-0000-0000-000000000005', code: 'TAM', campus: 'international', name: 'Cô Nguyễn Thị Mỹ Tâm' },
  'dang': { uuid: 'a0000001-0000-0000-0000-000000000006', code: 'DANG', campus: 'beach', name: 'Cô Trịnh Thị Đăng' },
  'binh': { uuid: 'a0000001-0000-0000-0000-000000000007', code: 'BINH', campus: 'hill', name: 'Cô Phạm Thị Thanh Bình' },
  'yen': { uuid: 'a0000001-0000-0000-0000-000000000008', code: 'YEN', campus: 'central', name: 'Cô Trần Thị Phi Yến' },
};

const schoolYearId = '985ffcb7-73c6-4d33-89da-1102e2fb1699'; // 2026-2027

function escapeSql(str) {
  if (str === null || str === undefined) return "''";
  return "'" + str.replace(/'/g, "''") + "'";
}

// 1. Lab slots
const labContent = fs.readFileSync('./src/data/lab-timetables.ts', 'utf8');
const labSlotsMatch = labContent.match(/export const INITIAL_LAB_TIMETABLES: LabSlot\[\] = (\[[\s\S]*?\]);/);
const labSlots = eval(labSlotsMatch[1]);

const labInsertValues = labSlots.map(s => {
  const teacherId = teacherMap[s.teacher] ? `'${teacherMap[s.teacher]}'` : 'NULL';
  const sheetCode = labSheetMap[s.labId] || '';
  return `('${schoolYearId}', 'HK1', ${escapeSql(s.labId)}, ${escapeSql(s.labName)}, ${escapeSql(sheetCode)}, ${escapeSql(s.campusId)}, ${s.day}, ${s.period}, ${escapeSql(s.session)}, ${escapeSql(s.time)}, ${escapeSql(s.className)}, ${escapeSql(s.teacher)}, ${teacherId}, ${escapeSql(s.subject)}, ${escapeSql(s.room)})`;
});

// 2. Teacher slots
const teacherContent = fs.readFileSync('./src/data/teacher-timetables.ts', 'utf8');
const teacherProfilesMatch = teacherContent.match(/export const TEACHER_TIMETABLES: TeacherTimetableProfile\[\] = (\[[\s\S]*?\]);/);
const teacherProfiles = eval(teacherProfilesMatch[1]);

const teacherInsertValues = [];
teacherProfiles.forEach(p => {
  const meta = teacherMeta[p.id];
  p.slots.forEach(s => {
    teacherInsertValues.push(`('${schoolYearId}', 'HK1', '${meta.uuid}', ${escapeSql(meta.code)}, ${escapeSql(meta.name)}, ${escapeSql(meta.campus)}, ${s.day}, ${s.period}, ${escapeSql(s.session)}, ${escapeSql(s.time)}, ${escapeSql(s.className)}, ${escapeSql(s.subject)}, ${escapeSql(s.room)})`);
  });
});

// Chunk array helper
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const labBatches = chunkArray(labInsertValues, 50);
labBatches.forEach((batch, idx) => {
  fs.writeFileSync(`./scripts/seed_lab_batch_${idx + 1}.sql`, `INSERT INTO public.lab_timetables (
  school_year_id, semester, lab_id, lab_name, sheet_code, campus_id, day_of_week, period, session, time_slot, class_name, teacher_name, teacher_id, subject, room
) VALUES
${batch.join(',\n')}
ON CONFLICT (school_year_id, semester, lab_id, day_of_week, period) DO UPDATE
SET class_name = EXCLUDED.class_name,
    teacher_name = EXCLUDED.teacher_name,
    teacher_id = EXCLUDED.teacher_id,
    subject = EXCLUDED.subject,
    room = EXCLUDED.room,
    time_slot = EXCLUDED.time_slot,
    updated_at = TIMEZONE('utc'::text, NOW());
`);
});

const teacherBatches = chunkArray(teacherInsertValues, 50);
teacherBatches.forEach((batch, idx) => {
  fs.writeFileSync(`./scripts/seed_teacher_batch_${idx + 1}.sql`, `INSERT INTO public.teacher_timetables (
  school_year_id, semester, teacher_id, teacher_code, teacher_name, campus_id, day_of_week, period, session, time_slot, class_name, subject, room
) VALUES
${batch.join(',\n')}
ON CONFLICT (school_year_id, semester, teacher_id, day_of_week, period) DO UPDATE
SET class_name = EXCLUDED.class_name,
    subject = EXCLUDED.subject,
    room = EXCLUDED.room,
    time_slot = EXCLUDED.time_slot,
    updated_at = TIMEZONE('utc'::text, NOW());
`);
});

console.log('Generated lab batches:', labBatches.length);
console.log('Generated teacher batches:', teacherBatches.length);

