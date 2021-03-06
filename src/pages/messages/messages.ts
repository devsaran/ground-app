import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, App } from 'ionic-angular';
import { Content } from 'ionic-angular';
import firebase from 'firebase';
import { GroundFirebaseStoreService } from '../../app/sources/services/ground-firebasestore.service';
import { GroundDatabaseStatusService } from '../../app/sources/status-service/ground-database-status.service';
import { UserDetails, GeoCordinate, Message } from '../../app/sources/model/userdetails';
import { DistanceService } from '../../app/sources/services/distance.service';
import { DisplayUserPage } from '../display-user/display-user';

@IonicPage()
@Component({
  selector: 'page-messages',
  templateUrl: 'messages.html',
})
export class MessagesPage {

  private fromId: string;
  user: any = {};
  messages: Message[] = [];
  private newMessage: string = '';
  editorMsg = '';
  private showEmojiPicker = false;
  private toUserDetails: UserDetails;
  distance: number;
  otherTimestamp: firebase.firestore.FieldValue;

  @ViewChild(Content) content: Content;
  @ViewChild('chat_input') messageInput: ElementRef;

  constructor(
    private _app: App,
    public _navParams: NavParams,
    public _navCtrl: NavController,
    private _distanceService: DistanceService,
    private _groundDatabaseStatusService: GroundDatabaseStatusService,
    private _groundFirebaseStoreService: GroundFirebaseStoreService) {

    this.toUserDetails = this._navParams.get('toUserDetails'); // other user
    this.fromId = this._navParams.get('user').uid; // this myself

    // this.user = this._navParams.get('user'); // my user

        this._groundFirebaseStoreService.getLatestGeoCordinidateByUsers(this.fromId).subscribe(mydata => {
          const point1: GeoCordinate = mydata[0];
          this._groundFirebaseStoreService.getLatestGeoCordinidateByUsers(this.toUserDetails.uid)
            .subscribe(otherdata => {
              let point2: GeoCordinate = otherdata[0];
              if (!point2) {
                point2 = new GeoCordinate();
              }
              this.otherTimestamp = this.toUserDetails.timestamp;
              this.distance = this._distanceService.getDistanceByGeoCordinate(point1, point2);
            });
        });
   
  }

  ionViewWillLoad() {
    this._groundFirebaseStoreService.getUserByid(this.fromId).subscribe(data => {
      this.user = data;
    });


    this._groundFirebaseStoreService.getMessages(this.fromId, this.toUserDetails.uid)
      .subscribe(res => {
        this.messages = res;
        this.scrollToBottom();
      });
  }

  sendMessage() {
    this._groundFirebaseStoreService.sendMessage(this.toUserDetails.uid, this.fromId, this.newMessage);
    this.newMessage = '';
    this.scrollToBottom();
  }

  removeItem(id: string) {
  }

  onFocus() {
    this.showEmojiPicker = false;
    this.contentResize();
    this.scrollToBottom();
  }

  switchEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
    if (!this.showEmojiPicker) {
      this.focus();
    } else {
      this.setTextareaScroll();
    }
    this.contentResize();
    this.scrollToBottom();
  }

  private focus() {
    if (this.messageInput && this.messageInput.nativeElement) {
      this.messageInput.nativeElement.focus();
    }
  }

  private setTextareaScroll() {
    const textarea = this.messageInput.nativeElement;
    textarea.scrollTop = textarea.scrollHeight;
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.content.scrollToBottom) {
        if (this.content) {
          if (this.content._scroll) { this.content.scrollToBottom(0); }
        }
      }
    }, 300)
  }
  private contentResize() {
    if (this.content) {
      this.content.resize();
    }
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad MessagesPage');
  }

  moveToOtherUserdetails() {
    this._app.getRootNav().push(DisplayUserPage, { userUID: this.toUserDetails.uid });
  }

}
