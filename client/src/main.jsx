import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './Components/userContext';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function getToken() {
  // Implement a function to retrieve the JWT token
  return localStorage.getItem('token');
}

const VAPID_PUBLIC_KEY = "BJO2lvL7cXXdg0MqKdCtQyWOz3Nb1Ny-X8x_67MKdRtQOLLl3FRpAPJOUJEzjaQGNBcIOqwjeS165Rb3Pl0x2ZI";

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('../service-worker.js')
      .then(function(registration) {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Request notification permission
        return Notification.requestPermission().then(permission => {
          if (permission !== 'granted') {
            throw new Error('Permission not granted for Notification');
          }
        
        // Check for permission and subscribe for push notifications
        return registration.pushManager.getSubscription();
      }).then(function(subscription) {
            if (!subscription) {
              return registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              });
            }
            return subscription;

          })
          .then(function(subscription) {
            console.log('Subscription:', subscription);
            
            // Ensure the keys are properly encoded
          const keys = {
            p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
            auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth'))))
          };
          console.log('Subscription keys:', keys);

            if (!keys.p256dh || !keys.auth) {
            console.error('Subscription object:', subscription);
            throw new Error('Subscription keys are missing');
          }
            const subscriptionData = {
              endpoint: subscription.endpoint,
              keys: keys
            };
  
            const token = getToken();
  
            if (!token) {
              throw new Error('No token found');
            }
  
            return fetch('/api/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(subscriptionData),
            });
            })
            .then(response => response.json())
            .then(data => console.log('Subscription response:', data))
            .catch(err => console.error('Subscription failed:', err));
          
          
      })
      .catch(function(err) {
        console.error('Service Worker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <UserProvider>
    <App />
    </UserProvider>
    </BrowserRouter>
  </React.StrictMode>,
)