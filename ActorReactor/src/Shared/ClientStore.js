/**
 * Created by sam on 07/02/2017.
 */

let actorreactor = require('ActorReactor.js/src/application');

class ClientStore extends actorreactor.Isolate {

    constructor() {
        super();

        this.names = [];
        this.references = [];
    }

    addClient(name, reference) {
        this[name] = reference;
        this.names.push(name);
        this.references.push(reference);
    }

    getClientReferences() {
        return this.references;
    }

    getClientNames() {
        return this.names;
    }
}

module.exports.ClientStore = ClientStore;