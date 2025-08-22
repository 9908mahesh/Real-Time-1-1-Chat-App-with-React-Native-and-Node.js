// mobile/screens/LoginScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text } from 'react-native';
import axios from 'axios';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async () => {
    const endpoint = isLogin ? 'login' : 'register';
    const res = await axios.post(`http://YOUR_SERVER_IP:3000/auth/${endpoint}`, { username, password });
    if (isLogin && res.data.token) {
      // Save token, navigate to Home
    }
  };

  return (
    <View>
      <TextInput placeholder="Username" onChangeText={setUsername} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title={isLogin ? "Login" : "Register"} onPress={handleAuth} />
      <Text onPress={() => setIsLogin(!isLogin)}>
        {isLogin ? "No account? Register" : "Login instead"}
      </Text>
    </View>
  );
};

export default LoginScreen;
