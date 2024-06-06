import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Components/Home';  // Ensure this path is correct
import SignUp from './Components/SignUp';

function App() {
    console.log("App rendering");
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signUp" element={<SignUp />} />
            </Routes>
        </Router>
    );
}

export default App;
