/**
 * Created by samva on 23/01/2017.
 */

import {Actor, SubscriptionManager} from "./actor";
import {Reactor} from "./reactor";
import {Observable} from "@reactivex/rxjs"
import {SpiderLib, FarRef} from "spiders.js/src/spiders"
import {SubscriberManager} from "./subscribers";

let spider:SpiderLib = require('spiders.js/src/spiders');

export type SignalReference = [ FarRef, ExportReference ];
export type ExportReference = string;

abstract class ActorReactorApplication extends spider.Application {

    subscriberManager : SubscriberManager;
    subscriptionManager : SubscriptionManager;

    constructor () {
        super();

        this.subscriberManager = new SubscriberManager();
        this.subscriptionManager = new SubscriptionManager();

    }
    // Do not provide a type signature for reactorClass. If we say the type is "Reactor", then it will complain that we cannot create an instance of an abstract class
    // In reality the passed class will be a non-abstract extension of the Reactor class
    spawnReactor(reactorClass, sources : SignalReference[], port? : number) : FarRef {
        return this.spawnActor(reactorClass, sources, port);
    }


    //
    // ALL CODE BELOW IS <<ALMOST>> IDENTICAL TO THE CODE OF ACTOR
    //

    addSubscriber(exportReference : ExportReference, subscriber: FarRef) : string {
        return this.subscriberManager.addSubscriber(exportReference, subscriber);
    }

    reactTo(signalReference : SignalReference, handler: string) : void {
        let source = signalReference[0];
        let output = signalReference[1];

        if (source === this) {
            let subscriptionIdentifier = this.addSubscriber(output, this);
            this.subscriptionManager.addHandler(subscriptionIdentifier, handler);
        }
        else {
            source.addSubscriber(output, this).then(
                (subscriptionIdentifier) => {
                    this.subscriptionManager.addHandler(subscriptionIdentifier, handler);
                });
        }
    }

    broadcast(key: string, ... values: any[]) : void {
        let subscriptions = this.subscriberManager.getSubscribers(key);
        subscriptions.forEach(
            (subscription) => {
                let subscriber = subscription.getReference();
                let subscriptionIdentifier = subscription.getUUID();
                subscriber.receiveBroadcast(this, subscriptionIdentifier, values);
            }
        );
    }

    receiveBroadcast(source: FarRef, subscriptionIdentifier: string, values: any[]) : void {
        let strHandler = this.subscriptionManager.getHandler(subscriptionIdentifier);
        if (strHandler in this)
            this[strHandler].apply(this, values);
        else
            throw new Error("Actor cannot react to received value, because the method " + strHandler + " does not exist on the receiving actor");
    }

    static isBrowser() : boolean {
        return !((typeof process === 'object') && (typeof process.versions === 'object') && (typeof process.versions.node !== 'undefined'));
    }
}

abstract class ActorReactorClientApplication extends ActorReactorApplication {


    constructor() {
        super();

        let actorThis = this;
        Rx.Observable.prototype.broadcastAs = function(exportReference : ExportReference) {
            this.subscribe((value : any) => { actorThis.broadcast(exportReference, value); });
            return this; // return observable for further chaining
        }
    }
}

if (ActorReactorApplication.isBrowser())
    exports.Application = ActorReactorClientApplication;
else
    exports.Application = ActorReactorApplication;

exports.Actor = Actor;
exports.Reactor = Reactor;
exports.Isolate = spider.Isolate;