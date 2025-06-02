import { auth } from "./controller/auth"
import { user } from "./controller/user"
import { documents } from "./controller/documents"
import { set } from "./controller/sets"
import { indegators } from "./controller/indegators"



const controllers = {
    auth,
    user,
    documents,
    set,
    indegators
}

export default controllers