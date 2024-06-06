import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { signUpUser } from '../Actions/userAction';
import '../Assets/Styles/signUp.css';

function SignUp() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const dispatch = useDispatch();

    const handleSignUp = (e) => {
        e.preventDefault();
        dispatch(signUpUser({ username, email, password }));
    };

    return (
        <div className="signup-form">
            <h1>Sign Up</h1>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
}

export default SignUp;
