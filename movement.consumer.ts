import amqp from 'amqplib';
import { io, Socket } from 'socket.io-client';

const RABBITMQ_URL = "amqp://protectify:adminadmin@54.144.149.49:5672";
const QUEUE_NAME = "movement";
const WEBSOCKET_SERVER_URL = "http://localhost:4000";

let socketIO: Socket;

async function sendDatatoWebSocket(data: any) {
  try {
    if (socketIO) {
      console.log('Sending data to WebSocket:', data);
      socketIO.emit('data', data);
    } else {
      console.error('WebSocket client is not initialized');
    }
  } catch (error: any) {
    console.error('Error sending data to WebSocket:', error.message);
  }
}

async function connect() {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE_NAME, {
      durable: true
    });

    console.log('Connected to RabbitMQ and subscribed to queue:', QUEUE_NAME);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        try {
          const parsedContent = JSON.parse(msg.content.toString());
          console.log('Received data from RabbitMQ:', parsedContent);
          await sendDatatoWebSocket(parsedContent);
          channel.ack(msg);
        } catch (error: any) {
          console.error('Error parsing RabbitMQ message:', error.message);
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