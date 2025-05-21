import { auth } from "./controller/auth"
import { user } from "./controller/user"
import { documents } from "./controller/documents"



const controllers = {
    auth,
    user,
    documents
}

export default controllers