let actorreactor = require('actorreactor.js/src/application');
let clientManager = require('../Shared/ClientStore');

let name = "undefined";

let commitButton = document.getElementById("CodeCommitButton");
let codeField = document.getElementById("codeField");

let publicChatSendButton = document.getElementById("publicSendButton");
let publicChatInputField = document.getElementById("publicMessageText");
let publicChatArea = document.getElementById("publicChat");


let privateChatCoderMenu = document.getElementById("codersMenu");
let privateChatSendButton = document.getElementById("privateSendButton");
let privateChatInputField = document.getElementById("privateMessageText");


let codeCommits = Rx.Observable.fromEvent(commitButton, "click")
    .map(_ => codeField.innerText);

let publicChatMessages = Rx.Observable.fromEvent(publicChatSendButton, "click")
    .map(_ => name + ": " + publicChatInputField.value);

let privateChatMessageReceivers = Rx.Observable.fromEvent(privateChatCoderMenu, "change")
    .map(_ => privateChatCoderMenu.options[privateChatCoderMenu.selectedIndex].value);

let privateChatMessageText = Rx.Observable.fromEvent(privateChatSendButton, "click")
    .map(_ => name + ": " + privateChatInputField.value);

let privateChatMessages = privateChatMessageText.withLatestFrom(privateChatMessageReceivers,
    function (message, receiver) { return {"receiverName": receiver, "messageText": message }; });


class CodeHighlighter extends actorreactor.Reactor {
    imports() {
        importScripts("https://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.9.0/highlight.min.js");
    }

    react(localCode, serverCode) {
        localCode.merge(serverCode)
            .map(code => self.hljs.highlightAuto(code))
            .pluck("value")
            .broadcastAs("html");
    }
}


class CoCodeClientApplication extends actorreactor.Application {

    constructor(myName) {
        super();
        this.name = myName;
    }

    initialize() {

        this.coders = new clientManager.ClientStore();

        codeCommits.broadcastAs("CodeCommit");
        publicChatMessages.broadcastAs("ChatMessage")
            .subscribe(chatMessage => {
                this.addChatMessage(chatMessage);
                publicChatInputField.value = ""; });
        privateChatMessages.subscribe(message => {
            this.sendPrivateMessage(message);
            privateChatInputField.value = "";
        });
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
            this.reactTo([coderReference, "ChatMessage"], "addChatMessage");
            this.coders.addClient(name, coderReference);
            privateChatCoderMenu.innerHTML += "<option value='" + name + "'>" + name + "</option>";
        }
    }

    addChatMessage(message) {
        publicChatArea.value += message;
        publicChatArea.value += "\n";
    }

    sendPrivateMessage(message) {
        privateChatInputField.value = "";
        let receiverReference = this.coders[message["receiverName"]];
        receiverReference.receivePrivateMessage(message["messageText"]);
    }

    receivePrivateMessage(message) {
        alert(message);
    }

    updateCode(rawHTML) {
        console.log("updating html " + rawHTML);
        codeField.innerHTML = rawHTML;
    }
}


$("#loginForm").submit(function (e) {
    // prevent submit event propagation
    e.preventDefault();

    name = $("#coderNameField").val();
    startApplication(name);
});

function startApplication(name) {
    $('#loginArea').hide();
    $('#codeArea').show();
    $('#chatArea').show();

    let cocodeClient = new CoCodeClientApplication(name);

    cocodeClient.remote("127.0.0.1", 8000).then(cocodeServer => {
        cocodeClient.initialize();
        cocodeServer.registerClient(cocodeClient, name);

        cocodeClient.reactTo([cocodeServer, "NewClient"], "addCoder");

        let codeSources = [[cocodeClient, "CodeCommit"], [cocodeServer, "CodeUpdate"]];
        let highlighterService = cocodeClient.spawnReactor(CodeHighlighter, codeSources, 8080);
        cocodeClient.reactTo([highlighterService, "html"], "updateCode");
    });
}
