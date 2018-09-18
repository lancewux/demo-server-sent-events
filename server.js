const express = require('express');
const chalk = require('chalk');

const app = express();

const webpackHotMiddleware = require('./middleware');
const eventStream = require('./eventStream');

app.use(express.static('client'));

// app.use(webpackHotMiddleware());

app.use(eventStream());

app.get('/', (req, res) => {
  const html = `
    <html>
      <head>
        <title>server-sent</title>
        <meta charset="utf-8" />
        <link rel="shortcut icon" href="https://avatars3.githubusercontent.com/u/29563510?s=40&v=4" />
      </head>
      <body>
        <div>hello world</div>
        <script src="./client.js"></script>
      </body>
    </html>
    `;
  res.send(html);
});


const port = process.env.PORT || 3008;
const host = process.env.IP || 'localhost';

app.listen(port, host, () => {
  console.info(chalk.red('==> ✅  Server is listening on %s:%d'), host, port);
});