/**
 * Created by samva on 23/01/2017.
 */
const actor_1 = require("./actor");
const reactor_1 = require("./reactor");
const subscribers_1 = require("./subscribers");
let spider = require('spiders.js/src/spiders');
class ActorReactorApplication extends spider.Application {
    constructor() {
        super();
        this.subscriberManager = new subscribers_1.SubscriberManager();
        this.subscriptionManager = new actor_1.SubscriptionManager();
    }
    // Do not provide a type signature for reactorClass. If we say the type is "Reactor", then it will complain that we cannot create an instance of an abstract class
    // In reality the passed class will be a non-abstract extension of the Reactor class
    spawnReactor(reactorClass, sources, port) {
        return this.spawnActor(reactorClass, sources, port);
    }
    //
    // ALL CODE BELOW IS <<ALMOST>> IDENTICAL TO THE CODE OF ACTOR
    //
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
    static isBrowser() {
        return !((typeof process === 'object') && (typeof process.versions === 'object') && (typeof process.versions.node !== 'undefined'));
    }
}
class ActorReactorClientApplication extends ActorReactorApplication {
    constructor() {
        super();
        let actorThis = this;
        Rx.Observable.prototype.broadcastAs = function (exportReference) {
            this.subscribe((value) => { actorThis.broadcast(exportReference, value); });
            return this; // return observable for further chaining
        };
    }
}
if (ActorReactorApplication.isBrowser())
    exports.Application = ActorReactorClientApplication;
else
    exports.Application = ActorReactorApplication;
exports.Actor = actor_1.Actor;
exports.Reactor = reactor_1.Reactor;
exports.Isolate = spider.Isolate;
//# sourceMappingURL=application.js.map