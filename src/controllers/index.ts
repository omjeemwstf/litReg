import { auth } from "./controller/auth"
import { user } from "./controller/user"
import { documents } from "./controller/documents"
import { set } from "./controller/sets"



const controllers = {
    auth,
    user,
    documents,
    set
}

export default controllers