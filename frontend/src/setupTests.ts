import '@testing-library/jest-dom';

// Мокаем window методы для тестов
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Мокаем window.prompt и alert
global.prompt = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn();
