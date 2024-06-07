import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';  // Ensure this path is correct
import AuthComponent from './Components/authComponent';

function App() {
    console.log("App rendering");
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<AuthComponent />} />
            </Routes>
        </Router>
    );
}

export default App;
