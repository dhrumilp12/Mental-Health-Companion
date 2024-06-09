import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { UserContext } from './userContext';

const ChatComponent = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId;
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [turnId, setTurnId] = useState(0);
    // Fetch initial message when component mounts
    useEffect(() => {
        if (userId) {
            axios.post(`/api/ai/mental_health/welcome/${userId}`)
                .then(response => {
                    const initialMessage = response.data.message;
                    setMessages(prevMessages => [...prevMessages, { sender: 'AI', text: initialMessage }]);
                    console.log('Data:', response.data);
                    setChatId(response.data.chatId);
                })
                .catch(error => {
                    console.error('Error fetching initial message:', error);
                    setMessages(prevMessages => [...prevMessages, { sender: 'AI', text: "Sorry, there was a problem starting the chat. Please try again later." }]);
                });
        }
    }, [userId]);
    

    const sendMessage = () => {
        if (!userId || !chatId) {
            console.error("User ID or Chat ID is undefined.");
            return;
        }
    
        if (inputText.trim()) {
            console.log("Sending message with UserID:", userId, " and ChatID:", chatId, " and TurnID:", turnId);
            axios.post(`/api/ai/mental_health/${userId}/${chatId}`, { prompt: inputText })
                .then(response => {
                    const aiMessage = response.data.message;
                    setMessages(prevMessages => [...prevMessages, { sender: 'User', text: inputText }, { sender: 'AI', text: aiMessage }]);
                setInputText('');
                setTurnId(prevTurnId => prevTurnId + 1);  // Increment turnId for the next message
                })
                .catch(error => console.error('Error sending message:', error));
        }
    };
    
    const handleFinalizeChat = () => {
        if (!userId || !chatId) {
            console.error("User ID or Chat ID is undefined.");
            return;
        }
    
        axios.post(`/api/ai/mental_health/finalize/${userId}/${chatId}`)
            .then(() => console.log('Chat finalized successfully'))
            .catch(error => console.error('Error finalizing chat:', error));
    };
    

    return (
        <div>
            <div className="chat-box">
                {messages.map((message, index) => (
                    <p key={index} className={message.sender === 'AI' ? 'ai-message' : 'user-message'}>
                        {message.text}
                    </p>
                ))}
            </div>
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
            <button onClick={handleFinalizeChat}>End Chat</button>
        </div>
    );
};

export default ChatComponent;
