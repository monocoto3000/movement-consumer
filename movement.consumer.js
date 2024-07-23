"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const amqplib_1 = __importDefault(require("amqplib"));
const socket_io_client_1 = require("socket.io-client");
const RABBITMQ_URL = "amqp://protectify:adminadmin@54.144.149.49:5672";
const QUEUE_NAME = "movement";
const WEBSOCKET_SERVER_URL = "http://localhost:4000";
let socketIO;
function sendDatatoWebSocket(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (socketIO) {
                console.log('Sending data to WebSocket:', data);
                socketIO.emit('newMovement', data);
            }
            else {
                console.error('WebSocket client is not initialized');
            }
        }
        catch (error) {
            console.error('Error sending data to WebSocket:', error.message);
        }
    });
}
function connect() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Connect to RabbitMQ
            const connection = yield amqplib_1.default.connect(RABBITMQ_URL);
            const channel = yield connection.createChannel();
            yield channel.assertQueue(QUEUE_NAME, {
                durable: true
            });
            console.log('Connected to RabbitMQ and subscribed to queue:', QUEUE_NAME);
            channel.consume(QUEUE_NAME, (msg) => __awaiter(this, void 0, void 0, function* () {
                if (msg !== null) {
                    try {
                        const parsedContent = JSON.parse(msg.content.toString());
                        console.log('Received data from RabbitMQ:', parsedContent);
                        yield sendDatatoWebSocket(parsedContent);
                        channel.ack(msg);
                    }
                    catch (error) {
                        console.error('Error parsing RabbitMQ message:', error.message);
                    }
                }
            }));
            socketIO = (0, socket_io_client_1.io)(WEBSOCKET_SERVER_URL, {
                transports: ['websocket'],
                path: '/socket.io'
            });
            socketIO.on('connect', () => {
                console.log('Connected to WebSocket server');
            });
            socketIO.on('connect_error', (err) => {
                console.error('WebSocket connection error:', err.message);
            });
            socketIO.on('disconnect', (reason) => {
                console.error('WebSocket disconnected:', reason);
            });
        }
        catch (err) {
            console.error('Error during connection setup:', err.message);
        }
    });
}
connect();
