import express, {Request, Response, Application, NextFunction} from 'express';

const bodyParser = require('body-parser')
const app = express()
const { handleError } = require('./errorHandler/errorHandler');
const PORT = process.env.PORT || 3002;

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded
app.use(function timeLog (req, res, next) {
    console.log(`Request Time: ${ new Date().toLocaleString()}, from user : ${ req.headers['__user_info'] }`,);
    next();
});
app.use(handleError);


app.post("/orders", async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({result: 'list-order'})
    } catch (error) {
        next(error);
    }
});

app.listen(PORT, (): void => {
    console.log(`Order server is running on port:${PORT}`);
});
