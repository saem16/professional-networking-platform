export const setSession = (key, value) => {
  if (typeof value === 'string') {
    localStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const getSession = key => {
  const item = localStorage.getItem(key);
  try {
    return JSON.parse(item);
  } catch {
    return item;
  }
};

export const clearSession = () => {
  localStorage.clear();
};
