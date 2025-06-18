const express = require('express');
const path = require('path');

const app = express()
const port = 3550

app.use(express.json());

app.get('/', (req, res)=>{
    res.status(200);
    res.send("Welcome to root URl of Server");
});

app.listen(port, (error) => {
        if (!error)
            console.log("Server is Successfully Running, and App is listening on port " + port)
        else
            console.log("Error Occurred, server can't start", error);
    }
);