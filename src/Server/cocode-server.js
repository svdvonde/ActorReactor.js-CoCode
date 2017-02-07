let actorreactor = require('ActorReactor.js/src/application');
let clientManager = require('../Shared/ClientStore');

class CoCodeServerApplication extends actorreactor.Application {

    constructor() {
        super();
        this.clientStore = new clientManager.ClientStore();
    }

    registerClient(newClientReference, newClientName) {
        console.log("adding client " + newClientName);

        newClientReference.refreshCoders(this.clientStore);
        this.clientStore.addClient(newClientName, newClientReference);
        this.broadcast("NewClient", newClientName, newClientReference);
        this.reactTo([newClientReference, "CodeCommit"], "receiveCodeCommit");

        console.log("done adding clients");
    }

    receiveCodeCommit(rawCode) {
        console.log("server received code commit " + rawCode);
        this.broadcast("RawCode", rawCode);
    }
}

let cocodeServer = new CoCodeServerApplication();