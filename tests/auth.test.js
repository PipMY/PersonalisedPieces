import auth0 from 'auth0-spa-js';
import { configureClient, login, logout, updateUI } from './your-file.js';

describe('Authentication', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <a id="login-link"></a>
      <div id="content"></div>
    `;
  });

  test('configureClient initializes Auth0 client', async () => {
    await configureClient();
    expect(auth0.createAuth0Client).toHaveBeenCalled();
  });

  test('login calls loginWithRedirect', async () => {
    await login();
    expect(auth0Client.loginWithRedirect).toHaveBeenCalled();
  });

  test('logout calls Auth0 logout', async () => {
    await logout();
    expect(auth0Client.logout).toHaveBeenCalled();
  });

  test('updateUI shows login for unauthenticated users', async () => {
    auth0Client.isAuthenticated.mockResolvedValue(false);
    await updateUI();
    expect(document.getElementById('login-link').textContent).toBe('Login');
  });

  test('updateUI shows logout for authenticated users', async () => {
    auth0Client.isAuthenticated.mockResolvedValue(true);
    auth0Client.getUser.mockResolvedValue({ 
      picture: 'test.jpg',
      'https://personalisedpieces.co.uk/roles': ['Admin']
    });
    await updateUI();
    expect(document.getElementById('login-link').textContent).toBe('Logout');
    expect(document.querySelector('.profile-picture')).toBeTruthy();
  });
});