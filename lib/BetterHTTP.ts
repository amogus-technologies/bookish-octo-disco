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

export class Client extends Duplex {
    private _socket: Socket;
}

export class Server extends EventEmitter {
    
}