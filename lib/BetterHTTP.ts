/**
 * @file BetterHTTP.ts
 * @description I am making a HTTP library from scratch because I am bored. This is not meant to be used in production. This is just for fun. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this, I am still alive. I am not responsible for any damage caused by this library. Use at your own risk. If you never hear from me again, it means the W3C ninjas have found me and I am now a vegetable. If you are reading this--
 */

import { Duplex } from "stream";
import { EventEmitter } from "events";
import { Socket, Server as nativeServer } from "net";

export interface Response {
    statusCode: number;
    statusMessage: string;
    headers: Record<string, string>;
    body: Buffer;
}

export interface Request {
    path: string;
    method: string;
    headers: Record<string, string>;
    body: Buffer;
}

export class HTTP {
    constructor() {
        this.parseRequest = HTTP.parseRequest;
        this.parseResponse = HTTP.parseResponse;
        this.serializeRequest = HTTP.serializeRequest;
        this.serializeResponse = HTTP.serializeResponse;
    }
    public parseRequest: (request: Buffer) => Request;
    public parseResponse: (response: Buffer) => Response;
    public serializeRequest: (request: Request) => Buffer;
    public serializeResponse: (response: Response) => Buffer;
    public static parseRequest(request: Buffer): Request {
        let requestStr = request.toString('binary');
        let [firstLine, ...head] = requestStr.split('\r\n\r\n')[0].split('\r\n');
        let headersArr = head.map(header => {
            let entry = header.split(': ');
            return { [entry[0]]: entry[1] };
        });
        let bodyStart = requestStr.indexOf('\r\n\r\n') + 4;
        let body = request.subarray(bodyStart);
        let [method, path] = firstLine.split(' ');
        let headers = {};
        for(let header of headersArr) {
            headers = { ...headers, ...header };
        }
        return { body, method, path, headers }
    }
    public static parseResponse(response: Buffer): Response {
        let responseStr = response.toString('binary');
        let [firstLine, ...head] = responseStr.split('\r\n\r\n')[0].split('\r\n');
        let headersArr = head.map(header => {
            let entry = header.split(': ');
            return { [entry[0]]: entry[1] };
        });
        let bodyStart = responseStr.indexOf('\r\n\r\n') + 4;
        let body = response.subarray(bodyStart);
        let [_protocol, statusCode, statusMessage] = firstLine.split(' ');
        let headers = {};
        for(let header of headersArr) {
            headers = { ...headers, ...header };
        }
        return { body, statusCode: parseInt(statusCode), statusMessage, headers }
    }
    public static serializeRequest(request: Request): Buffer {
        let headers = Object.entries(request.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n');
        let requestStr = `${request.method} ${request.path} HTTP/1.1\r\n${headers}\r\n\r\n`;
        var requestBuf = Buffer.from(requestStr, 'binary');
        return Buffer.concat([requestBuf, request.body]);
    }
    public static serializeResponse(response: Response): Buffer {
        let headers = Object.entries(response.headers).map(([key, value]) => `${key}: ${value}`).join('\r\n');
        let responseStr = `HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n${headers}\r\n\r\n`;
        var responseBuf = Buffer.from(responseStr, 'binary');
        return Buffer.concat([responseBuf, response.body]);
    }
}

interface ClientEventMap { // not exporting this you little -
    ready: () => void;
    response: (response: Response) => void;
    request: (request: Request) => void;
    data: (data: Buffer) => void;
    close: () => void;
}

export class Client extends EventEmitter {
    private _socket: Socket;
    constructor() {
        super();
        this._socket = new Socket();
        this._socket.on('close', () => {
            this.emit('close');
        });
    }
    public on: <K extends keyof ClientEventMap>(event: K, cb: ClientEventMap[K]) => this;
    public once: <K extends keyof ClientEventMap>(event: K, cb: ClientEventMap[K]) => this;
    public addListener: <K extends keyof ClientEventMap>(event: K, cb: ClientEventMap[K]) => this;
    public connect(port: number, host?: string): this {
        this._socket.connect({ port, host });
        this._socket.once('connect', () => {
            this.emit('ready');
            this._socket.once('data', (data: Buffer) => {
                let response = HTTP.parseResponse(data);
                this._socket.on('data', (data: Buffer) => {
                    this.emit('data', data);
                    
                });
                this.emit('response', response);
            });
        });
        return this;
    }
    public close(): this {
        this._socket.destroy();
        return this;
    }
    public request(request: Request): this {
        this._socket.write(HTTP.serializeRequest(request));
        return this;
    }
    public response(response: Response): this {
        this._socket.write(HTTP.serializeResponse(response));
        return this;
    }
    public send(data: Buffer): this {
        this._socket.write(data);
        return this;
    }
    /**
     * do not use this if you are a bot
     * do not use this if you are a human
     * do not use this if you are a cat
     * do not use this if you are a dog
     * do not use this if you are a fish
     * do not use this if you are a bird
     * do not use this if you are a snake
     * do not use this if you are a frog
     * do not use this if you are a turtle
     * do not use this if you are a rabbit
     * do not use this if you are a mouse
     * do not use this if you are a hamster
     * do not use this if you are a guinea pig
     * do not use this if you are a squirrel
     * do not use this if you are a rat
     * do not use this if you are a bat
     * do not use this if you are a spider
     * do not use this if you are a scorpion
     * do not use this if you are a crab
     * do not use this if you are a lobster
     * do not use this if you are a shrimp
     * do not use this if you are a snail
     * do not use this if you are a slug
     * do not use this if you are a worm
     * do not use this if you are a beetle
     * do not use this if you are a ant (an*)
     * do not use this if you are a fly
     * do not use this if you are a mosquito
     * do not use this if you are a bee
     * do not use this if you are a wasp
     * do not use this if you are a butterfly
     * do not use this if you are a moth
     * do not use this if you are a dragonfly
     * do not use this if you are a grasshopper
     * do not use this if you are a cricket
     * do not use this if you are a cockroach
     * do not use this if you are a mantis
     * do not use this if you are a centipede
     * do not use this if you are a millipede
     * do not use this if you are a snail
     * do not use this if you are a slug
     * do not use this if you are a worm
     * do not use this if you are a beetle
     * do not use this if you are a ant (wait im repeating myself)
     * do not use this if you are a pet animal
     * do not use this if you are a wild animal
     * do not use this if you are a domestic animal
     * do not use this if you are a farm animal
     * do not use this if you are a zoo animal
     * do not use this if you are a circus animal
     * do not use this if you are a circus animal
     * do not use this if you are a circus animal
     * do not use this if you are a circus animal (github copilot is running out of ideas)
     * do not use this if you are a circus animal
     * do not use this if you are a circus animal (ok i stop now)
     * do not use this if you are a circus animal (i lied about stopping)
     * do not use this if you are a circus animal (i lied about lying)
     * do not use this if you are a circus animal (i lied about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying about lying about lying about lying about lying)
     * do not use this if you are a circus animal (i lied about lying about lying about lying about lying about lying about lying about lying about lying about lying)
     * do not use this if you are a sentient robot
     */
    public _setSocket(socket: Socket): this {
        this._socket = socket;
        return this;
    }
}

/* export */ interface ServerEventMap {
    connect: (client: Client) => void;
}

export class Server extends EventEmitter {
    private _server: nativeServer;
    public on: <K extends keyof ServerEventMap>(event: K, cb: ServerEventMap[K]) => this;
    public once: <K extends keyof ServerEventMap>(event: K, cb: ServerEventMap[K]) => this;
    public addListener: <K extends keyof ServerEventMap>(event: K, cb: ServerEventMap[K]) => this;
    constructor() {
        super();
        this._server = new nativeServer();
    }
    public listen(port: number, host?: string): this {
        this._server.listen({ port, host });
        this._server.on('connection', (socket: Socket) => {
            let client = new Client();
            socket.once('data', (data: Buffer) => {
                let request = HTTP.parseRequest(data);
                client.emit('request', request);
                socket.on('data', (data: Buffer) => {
                    client.emit('data', data);
                });
            });
            client._setSocket(socket);
            this.emit('connect', client);
        });
        return this;
    }
}