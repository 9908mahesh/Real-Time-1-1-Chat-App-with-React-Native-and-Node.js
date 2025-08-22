// mobile/screens/ChatScreen.js
import React, { useEffect, useState } from 'react';
import { FlatList, TextInput, Button, View, Text } from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';

const ChatScreen = ({ route }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const userId = route.params.userId;
  const recipientId = route.params.recipientId;
  const socket = io('http://YOUR_SERVER_IP:3000');

  useEffect(() => {
    socket.emit('login', userId);
    socket.on('message:new', msg => setMessages(prev => [...prev, msg]));
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    axios.get(`http://YOUR_SERVER_IP:3000/conversations/${recipientId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setMessages(res.data));
  }, []);

  const sendMessage = () => {
    socket.emit('message:send', { from: userId, to: recipientId, text: message });
    setMessage('');
  };

  return (
    <View>
      <FlatList data={messages} renderItem={({item}) => <Text>{item.text}</Text>} />
      <TextInput value={message} onChangeText={setMessage} />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
};

export default ChatScreen;
