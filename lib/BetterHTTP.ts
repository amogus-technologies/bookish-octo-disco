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
        this.parseRequest = this.parseRequest.bind(this);
    }
    public parseRequest: (request: Buffer) => Request;
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
}