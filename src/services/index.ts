import { auth } from "./dbservices/auth"
import { mail } from "./dbservices/mail";
import { user } from "./dbservices/user";


const services = {
    auth,
    mail,
    user
}

export default services;