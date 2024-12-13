
import axios from "axios";
const URL = 'http://localhost:3000/api/id/login';
// const URL = 'http://localhost:3001/login';

const testRateLimit = async function (timeToCall){

    for(let i=0;i<timeToCall; i++){

        const response = await axios.post(URL, {  "username":"user1@sunteco.vn",
            "password":"fakePassword1"},{validateStatus:function (status) {
                return status < 500; // Resolve only if the status code is less than 500
            }});
        console.log( `Request number: ${i}, Result : ${response.status}`)
        console.log( `Data ${JSON.stringify(response.data)}`)

    }
}
 testRateLimit(15)
