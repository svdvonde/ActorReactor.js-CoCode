

let actorreactor = require('actorreactor.js/src/application');
let clientManager = require('../Shared/ClientStore');


class CodeHighlighter extends actorreactor.Reactor {
    imports() {
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.9.0/highlight.min.js");
    }
    react(rawCode) {
        rawCode.map(code => self.hljs.highlightAuto(code))
            .pluck("value")
            .broadcastAs("html");
    }
}



class CoCodeClientApplication extends actorreactor.Application {

    constructor(myName) {
        super();
        this.name = myName;
    }

    initialize(cocodeServer) {

        this.cocodeServer = cocodeServer;

        this.coders = new clientManager.ClientStore();

        this.commitButton = document.getElementById("CodeCommitButton");
        this.codeField = document.getElementById("codeField");

        this.publicChatSendButton = document.getElementById("publicSendButton");
        this.publicChatInputField = document.getElementById("publicMessageText");
        this.publicChatArea = document.getElementById("publicChat");


        this.privateChatCoderMenu = document.getElementById("codersMenu");
        this.privateChatSendButton = document.getElementById("privateSendButton");
        this.privateChatInputField = document.getElementById("privateMessageText");

        let highlighterService = this.spawnReactor(CodeHighlighter, [[cocodeServer, "RawCode"]], 8080);


        Rx.Observable.fromEvent(this.commitButton, "click")
            .map(_ => this.codeField.innerText)
            .broadcastAs("CodeCommit");

        let chatMessages = Rx.Observable.fromEvent(this.publicChatSendButton, "click")
            .map(_ => this.name + ": " + this.publicChatInputField.value);
        chatMessages.broadcastAs("ChatMessage");
        chatMessages.subscribe(chatMessage => {
            this.addChatMessage(chatMessage);
            this.publicChatInputField.value = "";
        });

        let privateChatMessages = Rx.Observable.fromEvent(this.privateChatSendButton, "click")
            .map(_ => this.name + ": " + this.privateChatInputField.value)
            .subscribe(privateMessage => {
                this.privateChatInputField.value = "";
                let recipientName = this.privateChatCoderMenu.options[this.privateChatCoderMenu.selectedIndex].value;
                this.sendPrivateMessage(recipientName, privateMessage);
            });

        this.reactTo([cocodeServer, "NewClient"], "addCoder");
        this.reactTo([highlighterService, "html"], "updateCode");
        this.cocodeServer.registerClient(this, this.name);
    }

    refreshCoders(coders) {
        console.log("Refreshing coders");

        this.coders = coders;
        let names = coders.getClientNames();
        let references = coders.getClientReferences();

        names.forEach((name, idx) => this.addCoder(name, references[idx]));

    }

    addCoder(name, coderReference) {
        if (this.name !== name) {
            console.log("Adding coder " + name);

            this.reactTo([coderReference, "ChatMessage"], "addChatMessage");
            this.coders.addClient(name, coderReference);
            this.privateChatCoderMenu.innerHTML += "<option value='"+ name + "'>" + name + "</option>";
        }
    }

    addChatMessage(message) {
        this.publicChatArea.value += message;
        this.publicChatArea.value += "\n";
    }

    sendPrivateMessage(recipient, message) {
        console.log("need to send private message to " + recipient);
        let receiverReference = this.coders[recipient];
        receiverReference.receivePrivateMessage(message);
    }

    receivePrivateMessage(message) {
        alert(message);
    }

    updateCode(rawHTML) {
        console.log("updating html " + rawHTML);
        this.codeField.innerHTML = rawHTML;
    }
}



$("#loginForm").submit(function (e) {
    // prevent submit event propagation
    e.preventDefault();

    let name = $("#coderNameField").val();
    startApplication(name);
});

function startApplication(name) {
    $('#loginArea').hide();
    $('#codeArea').show();
    $('#chatArea').show();

    let cocodeClient = new CoCodeClientApplication(name);

    cocodeClient.remote("127.0.0.1", 8000).then(cocodeServer => {
        cocodeClient.initialize(cocodeServer);
    });
}
