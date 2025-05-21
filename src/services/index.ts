import { auth } from "./dbservices/auth"
import { mail } from "./dbservices/mail";
import { user } from "./dbservices/user";
import { documents } from "./dbservices/document";



const services = {
    auth,
    mail,
    user,
    documents
}

export default services;