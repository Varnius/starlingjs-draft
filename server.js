const path = require('path');
const express = require('express');
const webpack = require('webpack');
const config = require('./webpack.config');
const chalk = require('chalk');

const app = express();
const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    publicPath: config.output.publicPath,
}));

app.use(express.static(path.join(__dirname, 'examples')));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/demo.html', (req, res) =>
{
    res.sendFile(path.join(__dirname, 'examples/demo/src/index.html'));
});

app.get('/quads.html', (req, res) =>
{
    res.sendFile(path.join(__dirname, 'examples/quads/index.html'));
});

app.listen(3333, 'localhost', (err) =>
{
    if (err)
    {
        console.log(chalk.red(err));
    }
    else
    {
        console.log(chalk.yellow('Listening at http://localhost:3333'));
    }
});
