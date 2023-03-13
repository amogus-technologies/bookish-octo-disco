import { Duplex } from "stream";
import { EventEmitter } from "events";
import { Socket } from "net";

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

interface ClientEventMap {
    ready: () => void;
    response: (response: Response) => void;
    data: (data: Buffer) => void;
}

export class Client extends EventEmitter {
    private _socket: Socket;
    constructor() {
        super();
        this._socket = new Socket();
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
}

export class Server extends EventEmitter {
    
}