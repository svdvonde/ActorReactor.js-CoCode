///<reference path="../../../ActorReactor/node_modules/@reactivex/rxjs/typings/globals/node/index.d.ts"/>
import {Socket} from "net";
/**
 * Created by flo on 13/02/2017.
 */
let work = require('webworkify')
let $ = require('./libs/jquery')

let commitButton = document.getElementById("CodeCommitButton");
let codeField = document.getElementById("codeField");
let publicChatSendButton = document.getElementById("publicSendButton");
let publicChatInputField = document.getElementById("publicMessageText");
let publicChatArea = document.getElementById("publicChat");
let privateChatCoderMenu = document.getElementById("codersMenu");
let privateChatSendButton = document.getElementById("privateSendButton");
let privateChatInputField = document.getElementById("privateMessageText");
var serverRef : Socket
var highlightRef
var myName

$("#loginForm").submit(function (e) {
    // prevent submit event propagation
    e.preventDefault();

    startApplication($("#coderNameField").val());
});

function serverMessageHandler(data){
    function addCoder(coderName){
        if (coderName !== myName) {
            privateChatCoderMenu.innerHTML += "<option value='" + coderName + "'>" + coderName + "</option>";
        }
    }
    function updateCode(code){
        highlightRef.postMessage(["highlightCode",code])
    }
    function newPublicChatMessage(message){
        (publicChatArea as any).value += message;
        (publicChatArea as any).value += "\n";
    }
    function newPrivateChatMessage(message){
        alert(message);
    }
    switch(data[0]){
        case "addCoder":
            addCoder(data[1])
            break
        case "updateCode":
            updateCode(data[1])
            break
        case "newPublicChatMessage":
            newPublicChatMessage(data[1])
            break
        case "newPrivateChatMessage":
            newPrivateChatMessage(data[1])
            break
        default:
            console.log("Client did not understand : " + data[0] + " from server")
    }
}

function highlighterMessageHandler(data){

    function highlightDone(highlighted){
        codeField.innerHTML = highlighted;
    }

    switch(data[0]){
        case "highlightDone":
            highlightDone(data[1])
            break
        default:
            console.log("Client did not understand : " + data[0] + " from highlighter")
    }
}

function startApplication(name) {
    $('#loginArea').hide();
    $('#codeArea').show();
    $('#chatArea').show();
    myName = name
    highlightRef = work(require('./highlighter'))
    highlightRef.addEventListener('message',(event)=>{
        highlighterMessageHandler(event.data)
    })
    serverRef  = require('socket.io-client')('http://127.0.0.1:8000')
    serverRef.on('message',serverMessageHandler)
    serverRef.emit('message',["registerClient",name])
}

$(commitButton).click(function () {
    let rawCode = codeField.innerText;
    serverRef.emit('message',["receiveCodeCommit",rawCode])
});
$(publicChatSendButton).click(function () {
    var field = publicChatInputField as any
    let message = myName + ": " + field.value;
    serverRef.emit('message',["newPublicChatMessage",message])
    field.value = "";
});
$(privateChatSendButton).click(function () {
    var field = privateChatInputField as any
    let selectedPeer = (privateChatCoderMenu as any).options[(privateChatCoderMenu as any).selectedIndex].value;
    let message = myName + ": " + field.value;
    serverRef.emit('message',["newPrivateChatMessage",selectedPeer,message])
    field.value = "";
});