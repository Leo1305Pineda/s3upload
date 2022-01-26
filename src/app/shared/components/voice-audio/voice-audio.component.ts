import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Platform } from '@ionic/angular';
import { MediaObject } from '@ionic-native/media/ngx';
import { File } from '@ionic-native/file/ngx';
import { FileTransfer, FileTransferObject } from '@ionic-native/file-transfer/ngx';
import { FileUploadOptions } from '@ionic-native/file-transfer/ngx';
import * as fs from 'fs-web';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GlobalService } from 'src/app/core/services/global/global.service';
const file_path = 'voice-storage';

@Component({
  selector: 'voice-audio',
  templateUrl: './voice-audio.component.html',
  styleUrls: ['./voice-audio.component.scss'],
})
export class VoiceAudioComponent implements OnInit, OnChanges, OnDestroy {

  filename: any = 'Audio';
  audioURL: string;
  metadata: any;
  curr_playing_file: MediaObject;

  fileNative: string = null;
  file_name: string = null;
  id_notification: number;

  is_playing: boolean;
  is_in_play: boolean;
  is_ready: boolean;

  message: any;

  duration: any = -1;
  duration_string: string;
  position: any = 0;

  isDownload: boolean;
  isUploading: boolean;
  failDownload: boolean;

  percent = 0;
  @Input() fileAudio: string;
  @Input() status = 1;
  @Input() senderId: any;
  @Output() UploadVoiceEvent: EventEmitter<string> = new EventEmitter<string>(null);

  onStatusUpdateSub: Subscription;

  constructor(
    public platform: Platform,
    private file: File,
    // tslint:disable-next-line: deprecation
    private transfer: FileTransfer,
    private http: HttpClient,
    private globals: GlobalService) {
  }

  get apiHost(): string {
    return 'host';
  }

  get storageDirectory(): any {
    return this.platform.is('ios') ? this.file.documentsDirectory : this.file.externalDataDirectory;
  }

  ngOnChanges(changes: SimpleChanges) {
    this.platform.ready().then(() => {
      if (changes.status.currentValue !== 0) {
        if (changes.status.currentValue !== 3) {
          this.fileNative = this.fileAudio.substring(this.fileAudio.lastIndexOf('/') + 1);
          this.isUploading = false;
          this.prepareAudioFile();
        } else if (this.globals.isMobil) {
          this.file_name = this.fileAudio.substring(this.fileAudio.lastIndexOf('/') + 1);
          this.isUploading = true;
          this.uploadFile();
        } else {
          const fileName = `${this.fileAudio.split('/').reverse()[0]}`;
          fs.readString(`${file_path}/${fileName}`).then((blob) => {
            const api_endpoint = `${this.apiHost}/api/message/upload_voice`;
            const formData: FormData = new FormData();
            formData.append('ionicfile', blob, fileName);
            this.http.post(api_endpoint, formData, {
              observe: 'events',
              reportProgress: true
            }).subscribe(async (response: any) => {
              if (!!response && response.type === 4 && !!response.body && !!response.body.data) {
                this.UploadVoiceEvent.emit(response.body.data);
              }
            }, (err) => {
              console.error(err);
            });
          }).catch(() => { });
        }
      }
    });
  }

  ngOnInit(): void {
    this.platform.ready().then(async () => {
      if (!this.globals.isMobil) {
        const fileName = `${file_path}/${this.fileAudio.split('/').reverse()[0]}`;
        let blob: Blob;
        await fs.readString(fileName).then((_blob) => {
          blob = _blob;
        }).catch(() => { });
        if (!!blob) {
          if (blob.type === 'text/html' || blob.type === 'application/octet-stream') {
            fs.removeFile(fileName);
          } else {
            this.audioURL = window.URL.createObjectURL(blob);
          }
        } else {
          await fetch(this.fileAudio, {
            headers: {},
          }).then((response: any) => {
            return response.blob();
          }).then((_blob: Blob) => {
            blob = _blob;
            if (blob.type !== 'text/html' && blob.type !== 'application/octet-stream') {
              fs.writeFile(fileName, blob);
              this.isDownload = false;
              this.failDownload = false;
              this.metadata = blob;
              this.audioURL = window.URL.createObjectURL(blob);
            }
          }).catch(() => { });
        }
      }
    });
  }

  uploadFile(token = '') {
    if (!this.globals.isMobil) {
      return;
    }
    const options: FileUploadOptions = {
      fileKey: 'ionicfile',
      fileName: this.file_name,
      chunkedMode: false,
      mimeType: 'multipart/form-data',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    };
    const api_endpoint = `${this.apiHost}/api/message/upload_voice`;
    this.id_notification = Math.floor(Math.random() * 1000);
    const fileTransfer: FileTransferObject = this.transfer.create();
    fileTransfer.onProgress((progress_event) => {
      if (progress_event.lengthComputable) {
        this.percent = Math.round((progress_event.loaded / progress_event.total) * 100);
      } else {
        this.percent++;
      }
    });
    this.file.readAsArrayBuffer(this.storageDirectory, this.file_name).then((buffer: ArrayBuffer) => {
      const blob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);
      this.audioURL = window.URL.createObjectURL(blob);
    });
    fileTransfer.upload(this.fileAudio, api_endpoint, options).then((data) => {
      const response = JSON.parse(data.response);
      if (response.data != null) {
        this.UploadVoiceEvent.emit(response.data);
      }
    }, (err) => {
      console.error('transfer error', err);
    });
  }

  async prepareAudioFile() {
    if (!this.globals.isMobil) {
      return;
    }
    if (this.isDownload) {
      return;
    }
    this.file.resolveDirectoryUrl(this.storageDirectory).then((resolvedDirectory) => {
      this.file.checkFile(resolvedDirectory.nativeURL, this.fileNative).then((data) => {
        if (data == true) {
          this.file.readAsArrayBuffer(this.storageDirectory, this.fileNative).then((buffer: ArrayBuffer) => {
            const blob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);
            this.audioURL = window.URL.createObjectURL(blob);
          });
        } else {
          throw { code: 1, message: 'NOT_FOUND_ERR' };
        }
      }).catch(err => {
        if (err.code == 1) {
          const fileTransfer: FileTransferObject = this.transfer.create();
          fileTransfer.onProgress((progress_event) => {
            if (progress_event.lengthComputable) {
              this.percent = Math.round((progress_event.loaded / progress_event.total) * 100);
            } else {
              this.percent++;
            }
          });
          this.isDownload = true;
          fileTransfer.download(this.fileAudio, this.storageDirectory + this.fileNative).then((entry) => {
            this.file.readAsArrayBuffer(this.storageDirectory, this.fileNative).then((buffer: ArrayBuffer) => {
              const blob = new Blob([new Uint8Array(buffer, 0, buffer.byteLength)]);
              this.audioURL = window.URL.createObjectURL(blob);
            });
            this.isDownload = false;
            this.failDownload = false;
          }).catch(() => {
            this.failDownload = true;
            this.isDownload = false;
          });
        }
      });
    });
  }

  playRecording() {
    this.curr_playing_file.play();
  }

  pausePlayRecording() {
    this.curr_playing_file.pause();
  }

  stopPlayRecording() {
    this.curr_playing_file.stop();
    this.curr_playing_file.release();
  }

  /*** utility functions ***/
  // this is replaced by the angular DatePipe:
  // https://angular.io/api/common/DatePipe
  fmtMSS(s) {   // accepts seconds as Number or String. Returns m:ss
    return (s -         // take value s and subtract (will try to convert String to Number)
      (s %= 60) // the new value of s, now holding the remainder of s divided by 60
      // (will also try to convert String to Number)
    ) / 60 + (    // and divide the resulting Number by 60
        // (can never result in a fractional value = no need for rounding)
        // to which we concatenate a String (converts the Number to String)
        // who's reference is chosen by the conditional operator:
        9 < s       // if    seconds is larger than 9
          ? ':'       // then  we don't need to prepend a zero
          : ':0'      // else  we do need to prepend a zero
      ) + s;       // and we add Number s to the string (converting it to String as well)
  }

  ngOnDestroy(): void {
    if (this.onStatusUpdateSub) {
      this.onStatusUpdateSub.unsubscribe();
    }
  }

}
