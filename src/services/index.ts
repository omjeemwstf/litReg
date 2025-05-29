import { auth } from "./dbservices/auth"
import { mail } from "./dbservices/mail";
import { user } from "./dbservices/user";
import { documents } from "./dbservices/document";
import { set } from "./dbservices/sets";





const services = {
    auth,
    mail,
    user,
    documents,
    set,
}

export default services;