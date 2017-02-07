
var actorreactor = require('../src/application');


class testApp extends actorreactor.Application {

}

class testActorClass extends actorreactor.Actor {
    init() {
        console.log("init called");
    }
}

var app = new testApp();
let testActor = app.spawnActor(testActorClass);
