const EMAIL_REGEX = /^[^\s@]+@ua\.edu\.lb$/i;
const PHONE_REGEX = /^(03|7[0-9]|81)\d{6}$/;

export const UA_ID_LENGTH = 9;
const UA_ID_DIGITS = new RegExp(`^\\d{${UA_ID_LENGTH}}$`);
export const cleanUaId = (value) => value.replace(/\D/g, '').slice(0, UA_ID_LENGTH);

const isUaEmail = (email) => EMAIL_REGEX.test(email.trim());

// Preserve the existing email shorthand behavior for legacy IDs.
const isLegacyUaIdInput = (value) => /^\d{8}$/.test(value);
export const findAccount = (users, identifier) => {
  const value = identifier.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === value);
};

// Each validator returns an object of field -> error message (empty object = valid)
export const validateLogin = ({ email, password }, users) => {
  const errors = {};
  if (!isUaEmail(email)) errors.email = 'Use your university email (name@ua.edu.lb)';
  if (password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (Object.keys(errors).length) return errors;

  const account = findAccount(users, email);
  if (!account) errors.email = 'No account with this email';
  else if (account.password !== password) errors.password = 'Wrong password';
  return errors;
};

export const validateSignUp = (form, users) => {
  const errors = {};
  if (form.name.trim().length < 3) errors.name = 'Full name must be at least 3 characters';
  if (!UA_ID_DIGITS.test(form.studentId)) {
    errors.studentId = 'Student/staff ID must be exactly ' + UA_ID_LENGTH + ' digits';
  } else if (users.some((user) => user.studentId === form.studentId)) {
    errors.studentId = 'An account already exists for this ID';
  }
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

export const positiveWholeNumber = (value) => {
  const number = Number(value);
  return /^\d+$/.test(String(value)) && Number.isSafeInteger(number) && number > 0 ? number : 0;
};

export const validatePrintJob = ({ file, pages, copies }, maxPages = 200) => {
  const errors = {};
  const pageCount = positiveWholeNumber(pages);
  const copyCount = positiveWholeNumber(copies);
  if (!file?.name?.trim()) errors.file = 'Choose a document to print.';
  if (!pageCount) errors.pages = 'Enter a positive whole number of pages.';
  if (!copyCount) errors.copies = 'Select at least one copy.';
  if (pageCount && copyCount && pageCount * copyCount > maxPages) {
    errors.limit = `Reduce pages or copies to stay within ${maxPages} printed pages per job.`;
  }
  return errors;
};

export const isValidRoom = (room) => /^[a-zA-Z0-9]{1,5}$/.test(room.trim());

export const isRoomForBuilding = (building, room) => {
  if (!building || typeof room !== 'string' || !room.trim()) return false;
  // Earlier versions saved free-text room numbers. Keep those places usable.
  if (isValidRoom(room)) return true;
  const [code, floor, roomNumber, ...extra] = room.trim().toUpperCase().split('.');
  return extra.length === 0 && code === building.code.toUpperCase()
    && /^-?\d+$/.test(floor) && building.floors.includes(Number(floor))
    && /^\d{1,2}$/.test(roomNumber) && Number(roomNumber) >= 1;
};

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
  if (!value || isLegacyUaIdInput(value)) return value;
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
