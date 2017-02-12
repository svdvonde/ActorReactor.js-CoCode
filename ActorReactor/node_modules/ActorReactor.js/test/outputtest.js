
var actorreactor = require('../src/application');


class testApp extends actorreactor.Application {
    constructor() {
        super();
    }
}
var app = new testApp();

class OutputProducer extends actorreactor.Actor {
    produceOutput() {
        this.broadcast("exampleOutput", 1);
    }
}

class Printer extends actorreactor.Actor {
    print(value) {
        console.log("PRINT: " + value);
    }
}

class OutputEchoer extends actorreactor.Reactor {
    react(testInput) {
        let reactionCounter = testInput.scan(count => count + 1, 0);
        this.broadcast(reactionCounter, "testReactorBroadcast")
    }
}


let outputActor = app.spawnActor(OutputProducer);
let echoReactor = app.spawnReactor(OutputEchoer, [[outputActor, "exampleOutput"]], 8081);
let printActor  = app.spawnActor(Printer,[],8082);

printActor.reactTo([echoReactor, "testReactorBroadcast"], "print");


setTimeout(function (){
    outputActor.produceOutput();
    setTimeout(function (){
        outputActor.produceOutput();
        setTimeout(function (){
            outputActor.produceOutput();
        }, 1000);
    }, 1000);
}, 2000);