export const splitFullName = (value = '') => {
  const normalizedValue = String(value).trim().replace(/\s+/g, ' ');

  if (!normalizedValue) {
    return { firstName: '', lastName: '' };
  }

  const [firstName, ...lastNameParts] = normalizedValue.split(' ');

  return {
    firstName,
    lastName: lastNameParts.join(' ')
  };
};

export const getNameParts = (person = {}) => {
  const fallbackParts = splitFullName(person.fullName || person.name || '');

  return {
    firstName: (person.firstName || fallbackParts.firstName || '').trim(),
    lastName: (person.lastName || fallbackParts.lastName || '').trim()
  };
};

export const getDisplayName = (person = {}) => {
  const { firstName, lastName } = getNameParts(person);
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || (person.fullName || person.name || '').trim();
};
