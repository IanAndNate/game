import { io } from "socket.io-client";
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';

function Messages({ socket }) {
    const [messages, setMessages] = useState({});

    useEffect(() => {
        const messageListener = (message) => {
            setMessages((prevMessages) => {
                const newMessages = {...prevMessages};
                newMessages[message.id] = message;
                return newMessages;
            });
        };

        const deleteMessageListener = (messageID) => {
            setMessages((prevMessages) => {
                const newMessages = {...prevMessages};
                delete newMessages[messageID];
                return newMessages;
            });
        };

        socket.on('message', messageListener);
        socket.on('deleteMessage', deleteMessageListener);
        socket.emit('getMessages');

        return () => {
            socket.off('message', messageListener);
            socket.off('deleteMessage', deleteMessageListener);
        };
    }, [socket]);

    return (
        <div className="message-list">
            {[...Object.values(messages)]
                .sort((a, b) => a.time - b.time)
                .map((message) => (
                    <div
                        key={message.id}
                        className="message-container"
                        title={`Sent at ${new Date(message.time).toLocaleTimeString()}`}
                    >
                        <span className="user">{message.user.name}:</span>
                        <span className="message">{message.value}</span>
                        <span className="date">{new Date(message.time).toLocaleTimeString()}</span>
                    </div>
                ))
            }
        </div>
    );
}

export default Messages;

function App() {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const newSocket = io();
        setSocket(newSocket);
        return () => newSocket.close();
    }, [setSocket]);

    return (
        <div className="App">
            <header className="app-header">
                React Chat
            </header>
            { socket ? (
                <div className="chat-container">
                    <Messages socket={socket} />
                </div>
            ) : (
                <div>Not Connected</div>
            )}
        </div>
    );
}


ReactDOM.render(<App />, document.getElementById('root'));

