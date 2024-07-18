const socketIoClient = require("socket.io-client");
import { Socket } from "socket.io-client";
import mqtt from 'mqtt';

const USERNAME = "protectify";
const PASSWORD = "adminadmin";
const HOSTNAME = "54.144.149.49";
const PORT = 1883;
const MQTT_TOPIC = "movementData";
const WEBSOCKET_SERVER_URL = "ws://localhost:80";

let socketIO: Socket;
let isRoomJoined = false; 


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

    client.on('error', (err) => {
      console.error('MQTT connection error:', err.message);
    });

    client.on('message', (topic, message) => {
      if (topic === MQTT_TOPIC) {
        const parsedContent = JSON.parse(message.toString());
        console.log('Datos MovimientoData:', parsedContent);

        const userId = parsedContent.id;
        
        if (!isRoomJoined) {
          socketIO.emit('joinRoom', userId);
          isRoomJoined = true;
        }
        
        socketIO.emit('newMovement', parsedContent);
      }
    });

    socketIO = socketIoClient(WEBSOCKET_SERVER_URL, {
      transports: ['websocket'],
      path: '/socket.io'
    });

    socketIO.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketIO.on('connect_error', (err: any) => {
      console.error('WebSocket connection error:', err.message);
    });

    socketIO.on('disconnect', (reason: any) => {
      console.error('WebSocket disconnected:', reason);
      isRoomJoined = false; 
    });

  } catch (err: any) {
    console.error('Error during connection setup:', err.message);
    throw new Error(err);
  }
}

connect();
