import mqtt from 'mqtt';
import { io, Socket } from 'socket.io-client';

const USERNAME = "protectify";
const PASSWORD = "adminadmin"; 
const HOSTNAME = "rabbit_host";
const PORT = 1883;
const MQTT_TOPIC = "topic_name";
const WEBSOCKET_SERVER_URL = "http://ws_url:port";

let socketIO: Socket;

async function sendDatatoWebSocket(data: any) {
  try {
    if (socketIO) {
      console.log('Sending data to WebSocket:', data);
      socketIO.emit('event_name', data); 
    } else {
      console.error('WebSocket client is not initialized');
    }
  } catch (error: any) {
    console.error('Error sending data to WebSocket:', error.message);
  }
}

async function connect() {
  try {
    const client = mqtt.connect(`mqtt://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}`);

    client.on('connect', () => {
      console.log('Connected to MQTT broker');
      client.subscribe(MQTT_TOPIC, (err) => {
        if (err) {
          console.error('Error subscribing to topic:', err.message);
        }
      });
    });

    client.on('message', async (topic, message) => {
      if (topic === MQTT_TOPIC) {
        try {
          const parsedContent = JSON.parse(message.toString());
          console.log('Received data from MQTT:', parsedContent);
          await sendDatatoWebSocket(parsedContent);
        } catch (error: any) {
          console.error('Error parsing MQTT message:', error.message);
        }
      }
    });

    socketIO = io(WEBSOCKET_SERVER_URL, {
      transports: ['websocket'],
      path: '/socket.io'
    });

    socketIO.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketIO.on('connect_error', (err: any) => {
      console.error('WebSocket connection error:', err.message);
    });

    socketIO.on('disconnect', (reason) => {
      console.error('WebSocket disconnected:', reason);
    });

  } catch (err: any) {
    console.error('Error during connection setup:', err.message);
  }
}

connect();
