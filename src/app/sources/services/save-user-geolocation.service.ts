import { Injectable, NgZone } from '@angular/core';
import { UserDetails, AddressUser } from '../model/userdetails';
import { AngularFirestore } from 'angularfire2/firestore';
import 'firebase/firestore';
import * as firebase from 'firebase';
import { Geolocation, Geoposition } from '@ionic-native/geolocation';
import { GMapsService } from '../google/gmap.service';


@Injectable()
export class SaveUserGeolocationService {
    private watch: any;
    constructor(private _angularFirestore: AngularFirestore,
        private geolocation: Geolocation,
        private __zone: NgZone,
        private __gMapsService: GMapsService

    ) { }
    private stop: number = 0;

    setGeoCoordinate(userId: string) {
        let options = { frequency: 3000, enableHighAccuracy: true };

        this.watch = this.geolocation.watchPosition(options)
            .filter((p: any) => p.code === undefined)
            .subscribe((position: Geoposition) => {
                this.__zone.run(() => {
                    if (this.stop === 0) {
                        this.stop = position.coords.latitude;
                        let timestamp = firebase.firestore.FieldValue.serverTimestamp();
                        this._angularFirestore.collection<UserDetails>('users')
                            .doc(userId).collection('geolocation')
                            .add({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                timestamp: timestamp
                            });
                        this.getAddress(userId, position);
                    }
                }
                );
            });
        setTimeout(() => { this.watch.unsubscribe(); }, 30000);
        if (this.stop !== 0) { this.watch.unsubscribe(); }
    }


   private getAddress(userId: string,  position: Geoposition) {
        this.__gMapsService.geocodeAddress(position).subscribe((result: AddressUser) => {
            this.__zone.run(() => {
                console.log('dil', result);
                if (result) {
                    this._angularFirestore.collection<UserDetails>('users')
                        .doc(userId).set(result, { merge: true })
                } else {
                    console.log('Not Available');
                }
            })
        },
            error => console.log(error),
            () => console.log('Geocoding completed!')
        );
    }
}