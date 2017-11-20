const path = require('path');
const express = require('express');
const webpack = require('webpack');
const config = require('./webpack.config');
const chalk = require('chalk');

const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath,
}));

app.use(express.static(path.join(__dirname, 'static')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/index.html'));
});

app.listen(3000, 'localhost', (err) => {
    if (err) console.log(chalk.red(err));
    else {
        console.log(chalk.yellow('Listening at http://localhost:3000'));
    }
});
