import express from "express";
import bodyParser from "body-parser";
import { SimDataResource } from "../dst/models";

const port = 3000;
const app = express();
app.use(bodyParser.text());

app.get('/binary-file', (req, res) => {
  const buffer = Buffer.from(req.body, 'base64');
  res.writeHead(200, {
    'Content-Type': 'application/octet-stream',
    'Content-disposition': 'attachment;filename=response.simdata',
    'Content-Length': buffer.byteLength
  });
  res.end(buffer);
});

app.get('/simdata-binary', (req, res) => {
  try {
    const simdata = SimDataResource.fromXml(req.body);
    const result = simdata.buffer; // just to let it throw if needed
    res.status(200).send(result.toString("base64"));
  } catch (err) {
    res.status(400).send(`XML could not be parsed as SimData\n\n${err}`);
  }
});

app.get('/simdata-xml', (req, res) => {
  try {
    const buffer = Buffer.from(req.body, 'base64');
    const simdata = SimDataResource.from(buffer);
    const xml = simdata.toXmlDocument().toXml();
    res.status(200).send(xml);
  } catch (err) {
    res.status(400).send(`Buffer could not be parsed as SimData\n\n${err}`);
  }
});

app.listen(port, () => {
  console.log(`@s4tk/models dev server listenting on port ${port}`);
});
