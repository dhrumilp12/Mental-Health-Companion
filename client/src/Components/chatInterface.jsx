import React, { useState, useContext, useCallback } from 'react';
import { UserContext } from './userContext';

const ChatInterface = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId;
    const [chatId, setChatId] = useState(0);
    const [turnId, setTurnId] = useState(0);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    
    const sendMessage = async () => {
        if (!input.trim()) return;

        const body = JSON.stringify({
            prompt: input,
            turn_id: turnId
        });

        const response = await fetch(`/api/ai/mental_health/${userId}/${chatId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        const data = await response.json();

        if (response.ok) {
            setMessages([...messages, { message: input, sender: 'user' }, { message: data.message, sender: 'agent' }]);
            setTurnId(prev => prev + 1);
            setInput('');
        } else {
            console.error('Failed to send message:', data);
        }
    };

    // Handle input changes
    const handleInputChange = useCallback((event) => {
        setInput(event.target.value);
    }, []);

    return (
        <div>
            <h1>Welcome to Mental Health Companion</h1>
            <div className="chat-container">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender}`}>
                        {msg.message}
                    </div>
                ))}
            </div>
            <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message here..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
}

export default ChatInterface;
