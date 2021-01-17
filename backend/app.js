const express = require('express');
const cors = require('cors');
const app = express();

const NodeCache = require("node-cache");
const cache = new NodeCache({stdTTL:300, checkperiod:300});

const port = process.env.PORT || 3000;
const APIURL = "https://bad-api-assignment.reaktor.com";

// A simple express API to get around CORS errors.

app.use(cors())

app.get('/', (req, res) => res.send('Hello World!'));
app.get("/*", cors(), (req,res) => {

        const url = `${APIURL}/v2${req.url}`;

        // Check for cached instances
        if(cache.has(req.url)){
            let content;
            try{
                content = cache.get(req.url);
            }
            catch(error){
                content = {data: "Not Found"};
            }
            res.json(content);
            return;
        }

        const request = require('request');
        const response = request(url, function(error, response, body){
            if(!error){

                let content;

                try{
                    content = JSON.parse(body);

                    // Cache it, if it's not a failure case.
                    if(content.response != '[]'){
                        cache.set(req.url,content);
                    }
                }
                
                catch(error){
                    content = {data: "Not Found"};
                }

                res.json(content);
            } else{
                res.send({ data :"Error!"});
            }
        });
})


app.listen(port, () => console.log(`API listening on port ${port}!`));