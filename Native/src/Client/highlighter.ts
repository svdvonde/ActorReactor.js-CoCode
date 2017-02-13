///<reference path="../../../ActorReactor/node_modules/@reactivex/rxjs/typings/globals/node/index.d.ts"/>
/**
 * Created by flo on 13/02/2017.
 */
var highlight = require('highlightjs')

function highlightCode(code,client){
    var highlighted = highlight.highlightAuto(code)
    client.postMessage(["highlightDone",highlighted.value])
}
module.exports = function (self) {
    self.addEventListener('message',function (event){
        switch(event.data[0]){
            case "highlightCode":
                highlightCode(event.data[1],self)
                break
            default:
                console.log("Highlighter did not understand : " + event.data[0])
        }
    })
}