"use strict";
/**
 * Created by flo on 13/02/2017.
 */
var work = require('webworkify');
var $ = require('./libs/jquery');
var commitButton = document.getElementById("CodeCommitButton");
var codeField = document.getElementById("codeField");
var publicChatSendButton = document.getElementById("publicSendButton");
var publicChatInputField = document.getElementById("publicMessageText");
var publicChatArea = document.getElementById("publicChat");
var privateChatCoderMenu = document.getElementById("codersMenu");
var privateChatSendButton = document.getElementById("privateSendButton");
var privateChatInputField = document.getElementById("privateMessageText");
var serverRef;
var highlightRef;
var myName;
$("#loginForm").submit(function (e) {
    // prevent submit event propagation
    e.preventDefault();
    startApplication($("#coderNameField").val());
});
function serverMessageHandler(data) {
    function addCoder(coderName) {
        if (coderName !== myName) {
            privateChatCoderMenu.innerHTML += "<option value='" + coderName + "'>" + coderName + "</option>";
        }
    }
    function updateCode(code) {
        highlightRef.postMessage(["highlightCode", code]);
    }
    function newPublicChatMessage(message) {
        publicChatArea.value += message;
        publicChatArea.value += "\n";
    }
    function newPrivateChatMessage(message) {
        alert(message);
    }
    switch (data[0]) {
        case "addCoder":
            addCoder(data[1]);
            break;
        case "updateCode":
            updateCode(data[1]);
            break;
        case "newPublicChatMessage":
            newPublicChatMessage(data[1]);
            break;
        case "newPrivateChatMessage":
            newPrivateChatMessage(data[1]);
            break;
        default:
            console.log("Client did not understand : " + data[0] + " from server");
    }
}
function highlighterMessageHandler(data) {
    function highlightDone(highlighted) {
        codeField.innerHTML = highlighted;
    }
    switch (data[0]) {
        case "highlightDone":
            highlightDone(data[1]);
            break;
        default:
            console.log("Client did not understand : " + data[0] + " from highlighter");
    }
}
function startApplication(name) {
    $('#loginArea').hide();
    $('#codeArea').show();
    $('#chatArea').show();
    myName = name;
    highlightRef = work(require('./highlighter'));
    highlightRef.addEventListener('message', function (event) {
        highlighterMessageHandler(event.data);
    });
    serverRef = require('socket.io-client')('http://127.0.0.1:8000');
    serverRef.on('message', serverMessageHandler);
    serverRef.emit('message', ["registerClient", name]);
}
$(commitButton).click(function () {
    var rawCode = codeField.innerText;
    serverRef.emit('message', ["receiveCodeCommit", rawCode]);
});
$(publicChatSendButton).click(function () {
    var field = publicChatInputField;
    var message = myName + ": " + field.value;
    serverRef.emit('message', ["newPublicChatMessage", message]);
    field.value = "";
});
$(privateChatSendButton).click(function () {
    var field = privateChatInputField;
    var selectedPeer = privateChatCoderMenu.options[privateChatCoderMenu.selectedIndex].value;
    var message = myName + ": " + field.value;
    serverRef.emit('message', ["newPrivateChatMessage", selectedPeer, message]);
    field.value = "";
});
