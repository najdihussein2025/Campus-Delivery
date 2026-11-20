const EMAIL_REGEX = /^[^\s@]+@ua\.edu\.lb$/i;
const PHONE_REGEX = /^(03|7[0-9]|81)\d{6}$/;

// UA student/staff ID: 8 digits, first 4 = year of enrolment (1996 → current year). Change here if UA's format differs.
export const UA_ID_REGEX = /^(199[6-9]|20\d{2})\d{4}$/;

// UA records are mock data (campus.json → uaRegistry): the app cannot reach UA's real student system
export const lookupUaId = (registry, id) => (registry || []).find((r) => r.id === id) || null;

// Titles (Dr., Pr.) are ignored: the first name must match, case-insensitive
const firstName = (name) => name.trim().toLowerCase().replace(/^(dr|pr|prof)\.?\s+/, '').split(/\s+/)[0] || '';

// '' when the ID is fine, otherwise the message to show under the field
export const checkUaId = (id, name, registry, users, currentYear = new Date().getFullYear()) => {
  if (!/^\d{8}$/.test(id)) return 'Student/staff ID must be exactly 8 digits';
  if (!UA_ID_REGEX.test(id) || Number(id.slice(0, 4)) > currentYear) {
    return `UA IDs start with the year you joined (1996–${currentYear}), e.g. 20231234`;
  }
  if (users.some((u) => u.studentId === id)) return 'An account already exists for this ID';
  const record = lookupUaId(registry, id);
  if (!record) return "This ID isn't in Antonine University's records. Check your student card.";
  if (name.trim() && firstName(name) !== firstName(record.name)) return "Name doesn't match the UA record for this ID";
  return '';
};

const isUaEmail = (email) => EMAIL_REGEX.test(email.trim());

// The login field takes the university email or the 8-digit UA ID
export const isUaIdInput = (value) => /^\d{8}$/.test(value.trim());
export const findAccount = (users, identifier) => {
  const value = identifier.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === value || (isUaIdInput(value) && u.studentId === value));
};

// Each validator returns an object of field -> error message (empty object = valid)
export const validateLogin = ({ email, password }, users) => {
  const errors = {};
  if (!isUaEmail(email) && !isUaIdInput(email)) errors.email = 'Use your university email (name@ua.edu.lb) or your 8-digit UA ID';
  if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length) return errors;

  const account = findAccount(users, email);
  if (!account) errors.email = isUaIdInput(email) ? 'No account for this UA ID' : 'No account with this email';
  else if (account.password !== password) errors.password = 'Wrong password';
  return errors;
};

export const validateSignUp = (form, users, registry = [], currentYear = new Date().getFullYear()) => {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Full name must be at least 3 characters';
  const idError = checkUaId(form.studentId, form.name, registry, users, currentYear);
  if (idError) errors.studentId = idError;
  if (!form.faculty) errors.faculty = 'Choose your faculty';
  if (!PHONE_REGEX.test(form.phone)) errors.phone = 'Enter a Lebanese number, e.g. 71123456';
  if (!isUaEmail(form.email)) errors.email = 'Use your university email (name@ua.edu.lb)';
  else if (users.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
    errors.email = 'An account with this email already exists';
  }
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (form.confirm !== form.password || !form.confirm) errors.confirm = 'Passwords do not match';
  return errors;
};

export const validatePrintJob = ({ docName, pages, copies }, maxPages = 200) => {
  const errors = {};
  if (!docName.trim()) errors.docName = 'Document name is required';
  if (!/^\d+$/.test(pages) || parseInt(pages, 10) < 1) errors.pages = 'Pages must be a whole number ≥ 1';
  if (!/^\d+$/.test(copies) || parseInt(copies, 10) < 1) errors.copies = 'Copies must be a whole number ≥ 1';
  if (!errors.pages && !errors.copies && parseInt(pages, 10) * parseInt(copies, 10) > maxPages) {
    errors.pages = `Pages × copies cannot exceed ${maxPages}`;
  }
  return errors;
};

export const isValidRoom = (room) => /^[a-zA-Z0-9]{1,5}$/.test(room.trim());

export const validateCheckout = ({ buildingId, room, slotId, payment }) => {
  const errors = {};
  if (!buildingId) errors.building = 'Choose a building';
  if (!isValidRoom(room)) errors.room = 'Room must be 1–5 letters or digits';
  if (!slotId) errors.slot = 'Choose a delivery break';
  if (!payment) errors.payment = 'Choose a payment method';
  return errors;
};

// If the user typed only the username, append the university domain
export const normalizeEmail = (input) => {
  const value = input.trim().toLowerCase();
  if (!value || isUaIdInput(value)) return value; // a UA ID stays as typed
  return value.includes('@') ? value : `${value}@ua.edu.lb`;
};

// Returns { score: 0-4, label } for the sign-up strength bar
export const passwordStrength = (password) => {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  else if (/\d/.test(password) && score > 0) score += 0.5;
  const rounded = Math.min(4, Math.floor(score));
  return { score: rounded, label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][rounded] };
};

// Real UA room format Building.Floor.Room, e.g. G.2.15
export const makeRoomCode = (buildingCode, floor, roomNumber) => `${buildingCode}.${floor}.${parseInt(roomNumber, 10)}`;

export const validateRoomParts = ({ buildingId, floor, roomNumber }) => {
  const errors = {};
  if (!buildingId) errors.building = 'Choose a building';
  if (floor === null || floor === undefined) errors.floor = 'Choose a floor';
  const n = parseInt(roomNumber, 10);
  if (!/^\d{1,2}$/.test(roomNumber || '') || n < 1 || n > 99) errors.room = 'Room number must be 1–99';
  return errors;
};

export const validateCheckoutSteps = ({ buildingId, floor, roomNumber, room, slotId, payment }) => {
  const errors = room ? (buildingId ? {} : { building: 'Choose a building' }) : validateRoomParts({ buildingId, floor, roomNumber });
  if (!slotId) errors.slot = 'Choose a delivery break';
  if (!payment) errors.payment = 'Choose a payment method';
  return errors;
};
