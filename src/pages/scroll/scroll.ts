import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { UserDetails } from '../../app/sources/model/userdetails';
import { Observable } from 'rxjs/Observable';
import { MovieService } from '../../app/sources/scroll/movie.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import * as _ from 'lodash'


/**
 * Generated class for the ScrollPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-scroll',
  templateUrl: 'scroll.html',

})
export class ScrollPage implements OnInit, OnDestroy {
  items$: Observable<UserDetails[]>;
  movies = new BehaviorSubject([]);

  private batch = 3        // size of each query
  private lastKey = ''      // key to offset next query from
  private finished = false  // boolean when end of database is reached

  constructor(public navCtrl: NavController, public navParams: NavParams, private movieService: MovieService) { }

  ngOnInit() {

    this.getMovies();
  }
  ngOnDestroy() {
    this.lastKey = '';
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ScrollPage ');
    this.items$ = this.movieService.getUsers1();
  }

  doInfinite(): Promise<any> {
    console.log('Begin async operation');
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Async operation has ended');
        resolve(this.getMovies());
      }, 500);
    })
  }

  private getMovies(key?) {
    if (this.finished) return
    this.movieService.getUsers(this.batch + 1, this.lastKey)
      .publishReplay()
      .refCount()
      .do(movies => {
        /// set the lastKey in preparation for next query
        this.lastKey = _.last(movies).uid;
        const newMovies = _.slice(movies, 0, this.batch)
        /// Get current movies in BehaviorSubject
        const currentMovies = this.movies.getValue();
        /// If data is identical, stop making queries
        if (this.lastKey == _.last(newMovies).uid) {
          this.finished = true
        }
        /// Concatenate new movies to current movies
        // this.movies.next(newMovies);
        this.movies.next(_.concat(currentMovies, newMovies));
      })
      .take(1)
      .subscribe();
  }
}


