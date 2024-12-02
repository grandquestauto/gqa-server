"use client";
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { getAuth, getIdToken, GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from '@firebase/auth';
import { initializeApp } from '@firebase/app';

const firebaseConfig = {
    apiKey: "AIzaSyBUak_CiEoa_nR3M8cdLUtBCFYghJAlrEU",
    authDomain: "quest-th.firebaseapp.com",
    projectId: "quest-th",
    storageBucket: "quest-th.appspot.com",
    messagingSenderId: "371781335465",
    appId: "1:371781335465:web:dc02d3030dbf3a2ee2ecb8"
  };
  
const getFirebase = initializeApp(firebaseConfig);


const Chat = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [topic, setTopic] = useState('');
    const [socket, setSocket] = useState<Socket | undefined>(undefined);

    const auth = getAuth(getFirebase)

    useEffect(() => {
      onAuthStateChanged(auth, (user) => {
            if (user) {
                getIdToken(user).then((idToken) => {
                    console.log('ID Token:', idToken);
                    const newSocket = io('http://localhost:3000', {
                        auth: {
                            token: idToken
                        }
                    });

                    newSocket.on('connect', () => {
                        addMessage('Connected to server');
                    });

                    newSocket.on('disconnect', () => {
                        addMessage('Disconnected from server');
                    });

                    newSocket.on('connect_error', (err) => {
                        console.log(err);
                    });

                    newSocket.on('message', (msg) => {
                        addMessage(msg);
                    });

                    newSocket.on('announcement', (msg) => {
                        addMessage(`Announcement: ${msg}`);
                    });

                    setSocket(newSocket);
                }).catch((error) => {
                    console.error('Error getting ID Token:', error);
                });
            } else {
                console.log('No user is signed in.');
            }
        });
    }, []);

    const addMessage = (msg:string) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
    };

    const sendMessage = () => {
        if (!socket) return;
        let f: Promise<void> ;
        if(topic.trim() == "") setTopic("message");
        if(message.trim() == "") f = socket.emitWithAck(topic)
        else f = socket.emitWithAck(topic, message.trim())

        f.then((response) => {
            console.log('Response:', response);
            addMessage(`Server@${topic}: ` + JSON.stringify(response));
        });
        addMessage(`You@${topic}: ` + message);
        setMessage('');
    };

    const handleSignIn = () => {
        signInWithPopup(auth, new GoogleAuthProvider()).then((result) => {
            console.log('User signed in:', result.user);
        }).catch((error) => {
            console.error('Error during sign-in:', error);
        });
    };

    return (
        <div>
            <button id="google-signin-button" onClick={handleSignIn}>Sign in with Google</button>
            <div className="chat-container">
                <div ref={(el) => {
                    if (el) {
                        el.scrollTop = el.scrollHeight;
                    }
                }} className="message-area" id="messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.startsWith("Server") ? "!bg-green-200": "" }`}>{msg}</div>
                    ))}
                </div>
                <div className="input-container">
                    <input
                        type="text"
                        id="topic-input"
                        placeholder="Topic"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                    />
                    <input
                        type="text"
                        id="message-input"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
            <style jsx>{`
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 20px auto;
                    padding: 0 20px;
                }
                
                .chat-container {
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    padding: 20px;
                }
                
                .message-area {
                    margin-bottom: 20px;
                    height: 300px;
                    overflow-y: auto;
                    border: 1px solid #eee;
                    padding: 10px;
                }
                
                .input-container {
                    display: flex;
                    gap: 10px;
                }
                
                #message-input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                
                button {
                    padding: 8px 16px;
                    background-color: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                button:hover {
                    background-color: #0056b3;
                }

                .message {
                    margin: 5px 0;
                    padding: 5px;
                    background-color: #f8f9fa;
                    border-radius: 4px;
                }

                #google-signin-button {
                    padding: 10px 20px;
                    background-color: #4285F4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 16px;
                }

                #google-signin-button:hover {
                    background-color: #357ae8;
                }
            `}</style>
        </div>
    );
};

export default Chat;
