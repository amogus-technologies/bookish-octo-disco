import { createServer } from '../lib/BetterHTTP';


export class App {
    public static main(args: string[]): void {
        createServer(client => {
            client.on('request', request => {
                var response = 'Your IP address is ' + (request.headers['x-forwarded-for'] || client.ip) + ', yay!';
                client.response({
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'text/html',
                        'Content-Length': Buffer.byteLength(response).toString()
                    },
                    body: Buffer.from(response),
                    statusMessage: 'OK'
                })
            });
        });
    }
}