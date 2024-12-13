import express, {Request, Response, Application, NextFunction} from 'express';
import {AuthenticationError} from './authentication/authentication.service';
import {ErrorResponse} from './errorHandler/errorModel';
import {rateLimit} from 'express-rate-limit'
import {CacheService} from './cache/cache.service';

const proxy = require('express-http-proxy');
const bodyParser = require('body-parser')
const config = require('./config/service.address');

const authenticationService = require('./authentication/authentication.service');
const ContextPathMap: Map<string, string> = config.ContextPathMap;

const cacheService = new CacheService()
const applyingCacheUrls: Array<string> = ['/api/order/orders']
const middlewares = {
    requireAuthentication: async function (req: Request, res: Response, next) {
        console.log(`Authenticating...`);
        // skip authentication for some url
        if (req.url === '/api/id/login') {

        } else {
            const authenData = await authenticationService.authenticate(req, next)
            // set user information that  authenticated
            console.log(`Authenticating...`,authenData );
            req.headers["__user_info"] = JSON.stringify(authenData)
        }
        next()
    },
    logger: function (req: Request, res: Response, next) {
        // Logging request, user, body, request...

        console.log(`Original request : ${req.originalUrl}, method: ${req.method} , user-requesting2: ${req.header["__user-info"]}`);
        console.log(`Parameter: ${JSON.stringify(req.query)}`);
        console.log(`Body ${JSON.stringify(req.body)}`);

        // console.log(`Original request hit : ${req.originalUrl} , user: ${JSON.parse(req.header('__user-info')).username}`);
        next();
    },
    caching: function (req: Request, res: Response, next) {
        // console.log("Find cache ",req.url,req.method, cachedValue)
        if (!applyingCacheUrls.includes(req.url.split('?')[0])) {
            next()
        } else {
            const cachedValue = cacheService.getCache(req.url, req.method)
            if (cachedValue) {
                console.log("Found cache")
                res.json(cachedValue)
            } else {
                next();
            }
        }
    },
    errorHandler: function (err: any, req: Request, res: Response, next: any) {
        console.log('-- Going to handle exception --')
        console.log(err)

        if (err instanceof AuthenticationError) {
            res.status(401).json(err);
        } else {
            const errorBody: ErrorResponse = {error: true, code: 'INTERNAL_ERROR', message: 'Internal server error'};
            res.status(500).json(errorBody);
        }
        next();
    }

}

const app = express()

const PORT = process.env.PORT || 3000;

// config global limit
const commonLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    limit: 10, // Limit each IP to 100 requests per `window` (here, per 1 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disa
})
// Apply the rate limiting middleware to all requests.


app.use(commonLimiter)
// common config
app.use(express.json({limit: '10mb'}))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded


// config middleware
app.use(`/`, [middlewares.requireAuthentication, middlewares.logger, middlewares.caching, middlewares.errorHandler]);

function onProxyRes(proxyResponse, request, response) {
    console.log('proxyResponse', proxyResponse.body);
    console.log('response', response.headers);
    cacheService.addRouteCache(request.url, request.method, proxyResponse.body)
}

// config routing
console.log('Routing config: ', ContextPathMap)
for (let [key, value] of ContextPathMap.entries()) {
    app.use(`/api/${key}`, proxy(`${value}`, {

        userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
            console.log(userReq.originalUrl)
            if (applyingCacheUrls.includes(userReq.originalUrl.split('?')[0])) {
                const cacheValue = JSON.parse(proxyResData.toString('utf8'))
                console.log('cacheValue ', userReq.originalUrl, proxyResData)
                cacheService.addRouteCache(userReq.originalUrl, userReq.method, cacheValue)
            }
            return proxyResData;
        }
    }));
}



// app.use(handleError);
app.listen(PORT, (): void => {
    console.log(`API gateway server is running on port:${PORT}`);
});
