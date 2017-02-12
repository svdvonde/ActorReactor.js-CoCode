
var actorreactor = require('../src/application');

class testApp extends actorreactor.Application {

    initialize() {
        this.inputField = window.document.getElementById('example');
        this.textRelayField = window.document.getElementById('typed_text');
        this.textLengthField = window.document.getElementById('text_length');

        const example = Rx.Observable.fromEvent(this.inputField, 'keyup')
            .map(i => i.currentTarget.value)
            //.debounceTime(500) //wait .5s between keyups to emit current value and throw away all other values
            .broadcastAs("textInput");
    }

    displayText(text) { this.textRelayField.innerHTML = text; }

    displayLength(length) { this.textLengthField.innerHTML = length; }
}

class CharacterCounter extends actorreactor.Reactor {
    react(input) {
        input.map(str => str.length).broadcastAs("length");
    }
}

class Printer extends actorreactor.Actor {

    print(value) {
        console.log("PRINT: " + value);
    }
}

let application = new testApp();
let characterCounter = application.spawnReactor(CharacterCounter, [[application, "textInput"]]);
let printer  = application.spawnActor(Printer, [], 8081);

printer.reactTo([application, "textInput"], "print");
printer.reactTo([characterCounter, "length"], "print");

application.reactTo([application, "textInput"], "displayText");
application.reactTo([characterCounter, "length"], "displayLength");

application.initialize();