import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.localStorage = {
  store: {},
  getItem: function(key) { return this.store[key] || null; },
  setItem: function(key, value) { this.store[key] = value; },
  removeItem: function(key) { delete this.store[key]; },
  clear: function() { this.store = {}; }
};

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Mock Auth0 client
jest.mock('auth0-spa-js', () => ({
  createAuth0Client: jest.fn(() => ({
    isAuthenticated: jest.fn(),
    getUser: jest.fn(),
    loginWithRedirect: jest.fn(),
    logout: jest.fn(),
    handleRedirectCallback: jest.fn(),
  }))
}));