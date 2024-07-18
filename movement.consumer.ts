import * as amqp from "amqplib/callback_api";
const socketIoClient = require("socket.io-client");
import { Socket } from "socket.io-client";

const USERNAME = "username";
const PASSWORD = encodeURIComponent("password");
const HOSTNAME = "hostname";
const PORT = 5672;
const RABBITMQ_QUEUE_DATA = "queue_name";
const WEBSOCKET_SERVER_URL = "ws_server_url";

let socketIO: Socket;

async function connect() {
  try {
    amqp.connect(
      `amqp://${USERNAME}:${PASSWORD}@${HOSTNAME}:${PORT}`,
      (err: any, conn: amqp.Connection) => {
        if (err) throw new Error(err);
        conn.createChannel((errChannel: any, channel: amqp.Channel) => {
          if (errChannel) throw new Error(errChannel);
          channel.assertQueue(RABBITMQ_QUEUE_DATA, {
            durable: true,
            arguments: { "x-queue-type": "quorum" },
          });
          channel.consume(RABBITMQ_QUEUE_DATA, (data: amqp.Message | null) => {
            if (data?.content !== undefined) {
              const parsedContent = JSON.parse(data.content.toString());
              console.log(`Datos de ${RABBITMQ_QUEUE_DATA}`, parsedContent);
              socketIO.emit("newMovement", parsedContent);
              channel.ack(data);
            }
          });
          socketIO = socketIoClient(WEBSOCKET_SERVER_URL);
        });
      }
    );
  } catch (err: any) {
    console.error("Conection error", err);
  }
}

connect();
