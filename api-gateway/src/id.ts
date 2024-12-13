import express, {Request, Response, Application, NextFunction} from 'express';
import {AuthenticationError} from "./authentication/authentication.service";

const bodyParser = require('body-parser')
const app = express()
const {handleError} = require('./errorHandler/errorHandler');
const PORT = process.env.PORT || 3001;

app.use(express.json({limit: '10mb'}))
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})) // for parsing application/x-www-form-urlencoded
// middleware that is specific to this router
app.use(function timeLog(req, res, next) {
    console.log('Time: ', new Date().toLocaleString());
    next();
});

const simulateUser = {
    'user1@sunteco.vn': {
        username: 'user1@sunteco.vn',
        password: 'fakePassword1',
        fullName: 'User 1',
    },
    'user2@sunteco.vn': {
        username: 'user2@sunteco.vn',
        password: 'fakePassword2',
        fullName: 'User 2',
    }
}
const simulateValidToken: any = {
    'b2i34hi234k3n4k324njkn234kuser1': 'user1@sunteco.vn',
    'ewfffefweeiofweojfjwejfje2user2': 'user2@sunteco.vn'
}
const simulateGenerateToken = function (username) {
    for (let token of Object.keys(simulateValidToken)) {
        if (simulateValidToken[token] === username) return token
    }
    return null
}
const validateToken = function (token) {
    if (simulateValidToken[token]) {
        return getUserInfo(simulateValidToken[token])
    }
    throw new AuthenticationError(`CANNOT_VALIDATE_TOKEN`, `Cannot verify token: ${token}`)
}
const login = function (username, password) {
    // console.log('1 ',simulateUser[username])
    console.log('login result ', simulateUser[username] && simulateUser[username].password === password)
    if (simulateUser[username] && simulateUser[username].password === password) {
        let authenticationResponse = deepClone({
            userInfo: getUserInfo(username),
            jwtToken: simulateGenerateToken(username)
        })
        delete authenticationResponse.userInfo.password
        return authenticationResponse

    } else {
        throw new AuthenticationError('ACCOUNT_NOT_FOUND', "Account not found or password incorrect")
    }
}
const deepClone = function (object) {
    return JSON.parse(JSON.stringify(object));
}
const getUserInfo = function (username) {
    return deepClone(simulateUser[username])
}
app.post("/login", async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("body ", JSON.stringify(req.body));

        res.json({result: login(req.body.username, req.body.password)})
    } catch (error) {
        next(error);
    }
});
app.post("/authenticate", async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("body ", JSON.stringify(req.body));

        const jwtToken = req.body.jwtToken
        const userInfo = validateToken(jwtToken)
        delete userInfo.password
        res.json({
            result: userInfo
        })

    } catch (error) {
        next(error);
    }
});

app.use(handleError);
app.listen(PORT, (): void => {
    console.log(`Identification server is running on port:${PORT}`);
});
