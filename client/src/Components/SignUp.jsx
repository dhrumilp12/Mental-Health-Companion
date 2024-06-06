import React, { useState } from 'react';
import axios from 'axios';

function SignUp() {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: ''
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('/api/user/signup', userData);
            console.log('Server Response:', response.data);
            alert('Signup successful!');
        } catch (error) {
            console.error('Signup error:', error.response.data);
            alert(error.response.data.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                name="username"
                value={userData.username}
                onChange={handleInputChange}
                placeholder="Username"
                required
            />
            <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                placeholder="Email"
                required
            />
            <input
                type="password"
                name="password"
                value={userData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
            />
            <button type="submit">Sign Up</button>
        </form>
    );
}

export default SignUp;
