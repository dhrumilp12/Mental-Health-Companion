import ReactDOM from 'react-dom/client'

import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom';

import { UserProvider } from './Components/userContext';
import './serviceWorker.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <UserProvider>
      <App />
    </UserProvider>
  </BrowserRouter>
);