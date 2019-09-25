const express = require('express');
const { resolve } = require('path');
const app = express();
const port = 8000;

app.get('/', (req, res) => {
    res.sendFile(resolve(__dirname, 'index.html'));
});

app.listen(port, () => console.log(`App listening on port ${port}!`));
