self.addEventListener('push', event => {
  let data;
  try {
    // Try to parse the incoming push message data as JSON
    data = event.data.json();
    console.log('Push event data:', data);
  } catch (error) {
    // If JSON parsing fails, treat it as a plain text
    console.error('Error parsing push notification data as JSON:', error);
    data = { 
      title: 'Notification', // Default title if not parsing JSON
      body: event.data ? event.data.text() : 'No data received' // Use the plain text data or a default message
    };
  }

  console.log('Final data to display:', data);
  self.registration.showNotification(data.title, {
    body: data.user,
    icon: './Images/Aria.jpg'
  });

  // Broadcast update message to clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => client.postMessage({
      msg: 'updateCount',
      title: data.title,
      body: data.body
    }));
  });
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
  