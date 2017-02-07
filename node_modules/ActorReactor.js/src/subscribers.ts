/**
 * Created by samva on 23/01/2017.
 */

import {SpiderLib, FarRef} from "spiders.js/src/spiders"

let spider:SpiderLib = require('spiders.js/src/spiders');

type SubscriberClass = { new(...args: any[]): Subscriber; };

export class Subscriber extends spider.Isolate {
    uuid: string;
    reference: FarRef;

    constructor(uuid: string, reference: FarRef) {
        super();
        this.uuid = uuid;
        this.reference = reference;
    }

    getReference() { return this.reference; }
    getUUID() { return this.uuid; }
}

export class SubscriberManager extends spider.Isolate {
    subscriberMap : Object;
    Subscriber : SubscriberClass;

    constructor() {
        super();
        this.subscriberMap = new spider.Isolate();
        this.Subscriber = Subscriber;
    }

    // From http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
    generateUUID() : string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,
            function (c) {
                let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            })
    }

    getSubscribers(key : string) : Subscriber[] {
        if (key in this.subscriberMap)
            return this.subscriberMap[key];
        else
            return [];
    }

    setSubscribers(key: string, subscribers: Subscriber[]) : void {
        this.subscriberMap[key] = subscribers;
    }

    addSubscriber(key : string, subscriberReference : FarRef) : string {
        let subscriptionIdentifier = this.generateUUID();
        let subscriber = new this.Subscriber(subscriptionIdentifier, subscriberReference);

        if (!(key in this.subscriberMap))
            this.subscriberMap[key] = [subscriber];
        else {
            let subscribers = this.getSubscribers(key);
            subscribers.push(subscriber);
        }

        return subscriptionIdentifier;
    }

    removeSubscriber(key: string, subscriptionIdentifier: string) : void {
        let subscribers = this.getSubscribers(key);
        let newSubscribers = subscribers.filter(x => x.uuid !== subscriptionIdentifier);
        this.setSubscribers(key, newSubscribers);
    }
}