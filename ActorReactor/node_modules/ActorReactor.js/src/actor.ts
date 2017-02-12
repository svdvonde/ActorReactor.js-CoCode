/**
 * Created by samva on 23/01/2017.
 */

import {SignalReference, ExportReference} from "./application"
import {SubscriberManager} from "./subscribers";
import {SpiderLib, FarRef, Isolate} from "spiders.js/src/spiders"
let spider:SpiderLib = require('spiders.js/src/spiders');


export class SubscriptionManager extends spider.Isolate {
    subscriptionMap : Isolate;

    constructor() {
        super();
        this.subscriptionMap = new spider.Isolate();
    }


    getHandler(subscriptionIdentifier : string) : string {
        return this.subscriptionMap[subscriptionIdentifier];
    }

    addHandler(subscriptionIdentifier : string, handler : string) : void {
        this.subscriptionMap[subscriptionIdentifier] = handler;
    }

    removeHandler(subscriptionIdentifier : string) : void {
        delete this.subscriptionMap[subscriptionIdentifier];
    }
}

export abstract class Actor extends spider.Actor {
    subscriberManager : SubscriberManager;
    subscriptionManager : SubscriptionManager;

    constructor() {
        super();
        this.subscriberManager = new SubscriberManager();
        this.subscriptionManager = new SubscriptionManager();
    }

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
}