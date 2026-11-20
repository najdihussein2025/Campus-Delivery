// Copies src/data/uaCalendar.json into the "calendar" key of src/data/campus.json and db.json, so the three files stay identical.
// Usage: node scripts/sync-calendar.js   (run it after editing uaCalendar.json)
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const calendar = JSON.parse(fs.readFileSync(path.join(root, 'src/data/uaCalendar.json'), 'utf8'));
['src/data/campus.json', 'db.json'].forEach((file) => {
  const full = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(full, 'utf8'));
  data.calendar = calendar;
  fs.writeFileSync(full, `${JSON.stringify(data, null, 2)}\n`);
  console.log('updated', file);
});
