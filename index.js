import cluster from 'node:cluster';
import http from 'node:http';
import os from 'node:os';
import process from 'node:process';

const numCPUs = os.cpus().length;


if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Keep track of http requests
  let numReqs = 0;
  setInterval(() => {
    console.log(`numReqs = ${numReqs}`);
  }, 1000);

  // Count requests
  function messageHandler(msg) {
    if (msg.cmd && msg.cmd === 'notifyRequest') {
      numReqs += 1;
    }
  }

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  for (const id in cluster.workers) {
    cluster.workers[id].on('message', messageHandler);
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Workers can share any TCP connection
  // In this case it is an HTTP server
  const server = http.createServer((req, res) => {
    console.log("Req URL: ", req.url, "-> Worker: ", process.pid)
    res.writeHead(200);
    res.end('Hello World\n');

    process.send({ cmd: 'notifyRequest' });
  })
  server.listen(3000);

  console.log(`Worker ${process.pid} started`);
}
