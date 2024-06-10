import React, { useState, useEffect, useContext,useCallback } from 'react';
import axios from 'axios';
import { UserContext } from './userContext';


const ChatComponent = () => {
    const { user } = useContext(UserContext);
    const userId = user?.userId; 
    const [chatId, setChatId] = useState(null);
    const [turnId, setTurnId] = useState(0);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false); 
    const [welcomeMessage, setWelcomeMessage] = useState('');
    // Fetch initial message when component mounts
    useEffect(() => {
            const fetchWelcomeMessage = async () => {
                if (!userId) return;
                setIsLoading(true);
                try {
                const response = await fetch(`/api/ai/mental_health/welcome/${userId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                const data = await response.json();
                console.log(data);
                if (response.ok) {
                    setWelcomeMessage(data.message);
                    setChatId(data.chat_id);
                    console.log(data.chat_id);
                } else {
                    console.error('Failed to fetch welcome message:', data);
                    setWelcomeMessage('Error fetching welcome message.');
                }
            } catch (error) {
                console.error('Network or server error:', error);
            }finally {
                setIsLoading(false);
            }
            };
                fetchWelcomeMessage(); 
        }, [userId]);

        const finalizeChat = useCallback(async () => {
            if (chatId === null) return;
            setIsLoading(true);
            try {
                const response = await fetch(`/api/ai/mental_health/finalize/${userId}/${chatId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
    
                const data = await response.json();
        if (response.ok) {
            console.log('Chat finalized successfully:', data.message);
        } else {
            console.error('Failed to finalize chat:', data.error);
        }
    } catch (error) {
        console.error('Error finalizing chat:', error);
    } finally {
        setIsLoading(false);
    }
}, [userId, chatId]);
    
        const sendMessage = useCallback(async () => {
            if (!input.trim() || chatId === undefined) return;
            console.log(chatId);
            setIsLoading(true);
            
            try {
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
            console.log(data);    
            if (response.ok) {
                setMessages(prev => [...prev, { message: input, sender: 'user' }, { message: data, sender: 'agent' }]);
                setTurnId(prev => prev + 1);
                setInput('');
            } else {
                console.error('Failed to send message:', data);
            } 
            }catch (error) {
                console.error('Failed to send message:', error);
            } finally {
                setIsLoading(false);
            }
        }, [input, userId, chatId, turnId]);
    
        // Handle input changes
        const handleInputChange = useCallback((event) => {
            setInput(event.target.value);
        }, []);

        return (
            <div>
                <h1>Welcome to Mental Health Companion</h1>
                <p>{welcomeMessage}</p>
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
                disabled={isLoading}
            />
            <button onClick={sendMessage}disabled={isLoading || !input.trim()}>Send</button>
            <button onClick={finalizeChat} disabled={isLoading}>End Chat</button>
        </div>
    );
}
    
export default ChatComponent;
