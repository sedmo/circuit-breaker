import { Request, Response } from "express";

const express = require("express");
const app = express();

const port = 3000;

app.get("/api/call", (req: Request, res: Response) => {
  if (Date.now() % 2 == 0) {
    res.status(200).send("Success!");
  } else {
    res.status(500).send("Failed!");
  }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
