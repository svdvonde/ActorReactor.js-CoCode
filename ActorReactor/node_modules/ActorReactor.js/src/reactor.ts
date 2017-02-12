/**
 * Created by samva on 24/01/2017.
 */

/**
 * Created by samva on 23/01/2017.
 */

import {SubscriberManager} from "./subscribers";
import {SpiderLib, FarRef} from "spiders.js/src/spiders"
import {Observable} from "@reactivex/rxjs"
import {SignalReference, ExportReference} from "./application";

let spider:SpiderLib = require('spiders.js/src/spiders');

export abstract class Reactor extends spider.Actor {
    subscriberManager : SubscriberManager;
    signalSources : SignalReference[];

    RxJS; // no type signature because this is the entire library

    constructor(... inputSources : SignalReference[]) {
        super();

        this.subscriberManager = new SubscriberManager();
        this.signalSources = inputSources;
    }

    init() {
        let reactorThis = this;
        let observerBroadcastExtension = function(exportReference : ExportReference) {
            reactorThis.broadcast(this, exportReference);
            return this; // return the observable for further chaining
        };

        if (this.isBrowser()) {
            // TODO: importing from non-local source is extremely bad.
            importScripts("https://npmcdn.com/@reactivex/rxjs@5.0.0-beta.3/dist/global/Rx.umd.js");
            Rx.Observable.prototype.broadcastAs = observerBroadcastExtension;
        }
        else {
            this.RxJS = require('@reactivex/rxjs');
            this.RxJS.Observable.prototype.broadcastAs = observerBroadcastExtension;
        }

        let RxObservables = [];
        for(let signalReference of this.signalSources) {
            let source = signalReference[0];
            let output = signalReference[1];

            if (this.isBrowser())
                // Rx will be imported by the importScripts statement that loads the Rx library
                var rxSubject = new Rx.Subject();
            else
                var rxSubject = new this.RxJS.Subject();

            RxObservables.push(rxSubject);

            source.addSubscriber(output, this).then(
                (subscriptionIdentifier) => {
                    this[subscriptionIdentifier] = function (value: any) {
                        // an array of arguments is passed, but for a reactor there should only be one argument
                        // thus take the first argument of the argument list, and use it as the reactive value
                        rxSubject.next(value[0]);
                    };
                });
        }

        if ("react" in this)
            this["react"].apply(this, RxObservables);
        else
            throw new Error("Reactor will not do anything because the 'react' method is not implemented");

        if ("imports" in this)
            this["imports"]();
    }


    addSubscriber(exportReference : ExportReference, subscriber: FarRef) : string {
        return this.subscriberManager.addSubscriber(exportReference, subscriber);
    }


    broadcast(observable : Observable<any>, key: string) : void {
        observable.subscribe((value : any) => {
            let subscriptions = this.subscriberManager.getSubscribers(key);
            subscriptions.forEach(
                (subscription) => {
                    let subscriber = subscription.getReference();
                    let subscriptionIdentifier = subscription.getUUID();
                    subscriber.receiveBroadcast(this, subscriptionIdentifier, [value]);
                }
            );
        });
    }


    receiveBroadcast(source : FarRef, subscriptionIdentifier : string, values : any[]) : void {
        if (subscriptionIdentifier in this)
            this[subscriptionIdentifier](values);
        else
            throw new Error("Reactor received broadcasted value to which it has no subscription... Ignoring the broadcast.");
    }

    isBrowser() : boolean {
        return !((typeof process === 'object') && (typeof process.versions === 'object') && (typeof process.versions.node !== 'undefined'));
    }
}