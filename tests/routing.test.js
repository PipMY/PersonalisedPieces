describe('Routing', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="content"></div>
        <a id="home-link"></a>
        <a id="admin-link"></a>
      `;
    });
  
    test('navigate to home loads home content', async () => {
      await navigate('home');
      expect(fetch).toHaveBeenCalledWith('home.html');
    });
  
    test('admin route checks authentication and roles', async () => {
      auth0Client.isAuthenticated.mockResolvedValue(true);
      auth0Client.getUser.mockResolvedValue({
        'https://personalisedpieces.co.uk/roles': ['Admin']
      });
      
      await navigate('admin');
      expect(fetch).toHaveBeenCalledWith('admin.html');
    });
  
    test('unauthenticated user cannot access admin', async () => {
      auth0Client.isAuthenticated.mockResolvedValue(false);
      const alertSpy = jest.spyOn(window, 'alert');
      await navigate('admin');
      expect(alertSpy).toHaveBeenCalledWith("You must be logged in...");
    });
  });