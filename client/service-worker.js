self.addEventListener('push', event => {
  try {
    const data = event.data.json();  // Tries to parse JSON data
    self.registration.showNotification(data.title, {
        body: data.body,
        icon: './Images/Aria.jpg'
    });
} catch (error) {
    console.error('Error parsing push notification data:', error);
    self.registration.showNotification('Notification', {
      body: event.data.text(),
      icon: './Images/Aria.jpg'
    });
}
});
  
  self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(
      self.clients.matchAll({type: 'window'}).then(clientList => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  });
  