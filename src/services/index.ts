import { auth } from "./dbservices/auth"
import { mail } from "./dbservices/mail";
import { user } from "./dbservices/user";
import { documents } from "./dbservices/document";
import { set } from "./dbservices/sets";
import { indegators } from "./dbservices/indegators";





const services = {
    auth,
    mail,
    user,
    documents,
    set,
    indegators
}

export default services;