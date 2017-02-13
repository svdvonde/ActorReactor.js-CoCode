///<reference path="../../../ActorReactor/node_modules/@reactivex/rxjs/typings/globals/node/index.d.ts"/>
import {Socket} from "net";
/**
 * Created by flo on 13/02/2017.
 */
var io = require('socket.io')
var socket : Socket = io(8000)
var clients : Map<string,Socket> = new Map()


function registerClient(clientSocket : Socket, clientName : string) {
    console.log("adding client " + clientName);
    clients.forEach((otherClientSocket : Socket,otherClientName : string)=>{
        otherClientSocket.emit('message',["addCoder",clientName])
        clientSocket.emit('message',["addCoder",otherClientName])
    })
    clients.set(clientName,clientSocket)
}

function receiveCodeCommit(rawCode) {
    console.log("server received code commit " + rawCode);
    clients.forEach((clientSocket : Socket)=>{
        clientSocket.emit('message',["updateCode",rawCode])
    })
}

function newPublicChatMessage(message){
    clients.forEach((clientSocket : Socket)=>{
        clientSocket.emit('message',["newPublicChatMessage",message])
    })
}

function newPrivateChatMessage(targetName,message){
    var target = clients.get(targetName)
    target.emit('message',["newPrivateChatMessage",message])
}

socket.on('connect',(client : Socket)=>{
    client.on('message',(data)=>{
        switch(data[0]){
            case "registerClient":
                registerClient(client,data[1])
                break
            case "receiveCodeCommit":
                receiveCodeCommit(data[1])
                break
            case "newPublicChatMessage":
                newPublicChatMessage(data[1])
                break
            case "newPrivateChatMessage":
                newPrivateChatMessage(data[1],data[2])
                break
            default:
                console.log("Server did not understand : " + data[0])
        }
    })
})

console.log("Native cocode server started")