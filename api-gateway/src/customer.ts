import express, {Request, Response, Application, NextFunction} from 'express';
const bodyParser = require('body-parser')

const app = express()
const { handleError } = require('./errorHandler/errorHandler');
const PORT = process.env.PORT || 3003;

app.use(express.json({limit: '10mb'}))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded
// middleware that is specific to this router
app.use(function timeLog (req, res, next) {
    console.log('Time: ', new Date().toLocaleString());
    next();
});
app.use(handleError);


app.post("/customers", async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json({result: 'list-customer'})
    } catch (error) {
        next(error);
    }
});




app.listen(PORT, (): void => {
    console.log(`Customer server is running on port:${PORT}`);
});
