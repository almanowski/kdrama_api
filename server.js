const http = require('http'), // Imports the HTTP module and allows to use its function createServer()
      fs = require('fs'),
      url = require('url');

// This function will be called every time an HTTP request is made against the server
http.createServer((request, response) => {
    let addr = request.url,
        q = url.parse(addr, true),
        filePath = '';

    // Log server requests
    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
        if (err) {
            consoloe.log(err);
        }else {
            console.log('Added to log.');
        }
    });

    if (q.pathname.includes('documentation')) {
        filePath = (__dirname + '/documentation.html');
    } else {
        filePath = 'index.html';
    }

    fs.readFile(filePath, (err,data) => { // err = error object and data = content of the file
        if (err) {
            throw err;
        }
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.write(data);
            response.end();
    });
}).listen(8080); // Listens for a response on port 8080


console.log('My first Node test server is running on Port 8080.');
