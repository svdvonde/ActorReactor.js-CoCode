/**
 * Created by samva on 23/01/2017.
 */
const subscribers_1 = require("./subscribers");
let spider = require('spiders.js/src/spiders');
class SubscriptionManager extends spider.Isolate {
    constructor() {
        super();
        this.subscriptionMap = new spider.Isolate();
    }
    getHandler(subscriptionIdentifier) {
        return this.subscriptionMap[subscriptionIdentifier];
    }
    addHandler(subscriptionIdentifier, handler) {
        this.subscriptionMap[subscriptionIdentifier] = handler;
    }
    removeHandler(subscriptionIdentifier) {
        delete this.subscriptionMap[subscriptionIdentifier];
    }
}
exports.SubscriptionManager = SubscriptionManager;
class Actor extends spider.Actor {
    constructor() {
        super();
        this.subscriberManager = new subscribers_1.SubscriberManager();
        this.subscriptionManager = new SubscriptionManager();
    }
    addSubscriber(exportReference, subscriber) {
        return this.subscriberManager.addSubscriber(exportReference, subscriber);
    }
    reactTo(signalReference, handler) {
        let source = signalReference[0];
        let output = signalReference[1];
        if (source === this) {
            let subscriptionIdentifier = this.addSubscriber(output, this);
            this.subscriptionManager.addHandler(subscriptionIdentifier, handler);
        }
        else {
            source.addSubscriber(output, this).then((subscriptionIdentifier) => {
                this.subscriptionManager.addHandler(subscriptionIdentifier, handler);
            });
        }
    }
    broadcast(key, ...values) {
        let subscriptions = this.subscriberManager.getSubscribers(key);
        subscriptions.forEach((subscription) => {
            let subscriber = subscription.getReference();
            let subscriptionIdentifier = subscription.getUUID();
            subscriber.receiveBroadcast(this, subscriptionIdentifier, values);
        });
    }
    receiveBroadcast(source, subscriptionIdentifier, values) {
        let strHandler = this.subscriptionManager.getHandler(subscriptionIdentifier);
        if (strHandler in this)
            this[strHandler].apply(this, values);
        else
            throw new Error("Actor cannot react to received value, because the method " + strHandler + " does not exist on the receiving actor");
    }
}
exports.Actor = Actor;
//# sourceMappingURL=actor.js.map