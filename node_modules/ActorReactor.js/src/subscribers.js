/**
 * Created by samva on 23/01/2017.
 */
let spider = require('spiders.js/src/spiders');
class Subscriber extends spider.Isolate {
    constructor(uuid, reference) {
        super();
        this.uuid = uuid;
        this.reference = reference;
    }
    getReference() { return this.reference; }
    getUUID() { return this.uuid; }
}
exports.Subscriber = Subscriber;
class SubscriberManager extends spider.Isolate {
    constructor() {
        super();
        this.subscriberMap = new spider.Isolate();
        this.Subscriber = Subscriber;
    }
    // From http://byronsalau.com/blog/how-to-create-a-guid-uuid-in-javascript/
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    getSubscribers(key) {
        if (key in this.subscriberMap)
            return this.subscriberMap[key];
        else
            return [];
    }
    setSubscribers(key, subscribers) {
        this.subscriberMap[key] = subscribers;
    }
    addSubscriber(key, subscriberReference) {
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
    removeSubscriber(key, subscriptionIdentifier) {
        let subscribers = this.getSubscribers(key);
        let newSubscribers = subscribers.filter(x => x.uuid !== subscriptionIdentifier);
        this.setSubscribers(key, newSubscribers);
    }
}
exports.SubscriberManager = SubscriberManager;
//# sourceMappingURL=subscribers.js.map