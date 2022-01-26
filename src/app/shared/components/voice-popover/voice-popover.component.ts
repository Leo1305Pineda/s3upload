import { Component, OnInit } from '@angular/core';
import { Platform, PopoverController } from '@ionic/angular';
import { Media, MediaObject } from '@ionic-native/media/ngx';
import { File, FileEntry } from '@ionic-native/file/ngx';
import * as fs from 'fs-web';
import { GlobalService } from 'src/app/core/services/global/global.service';
const fileName = 'record' + new Date().getDate() + new Date().getMonth() + new Date().getFullYear() + new Date().getHours() + new Date().getMinutes() + new Date().getSeconds();

const file_path = 'voice-storage';

@Component({
  selector: 'voice-popover',
  templateUrl: './voice-popover.component.html',
  styleUrls: ['./voice-popover.component.scss'],
})
export class VoicePopoverComponent implements OnInit {

  stickers = {};
  recording = false;
  filePath: string;
  fileName: string;
  audio: MediaObject;
  audioList: any[] = [];
  constructor(
    public popOverCtrl: PopoverController,
    private media: Media,
    private file: File,
    private globals: GlobalService,
    public platform: Platform) {
  }
  ngOnInit() {
    this.fileName = '';
    this.filePath = '';
    this.audio = null;
    this.startRecord(true);
  }

  close() {
    this.popOverCtrl.dismiss('test');
  }

  get dirPath(): string {
    return this.platform.is('android') ? this.file.externalDataDirectory : this.file.documentsDirectory;
  }

  async receiveTimer(event) {
    let audio: any = null;
    switch (event.state) {
      case 'finish':
        event.el.pauseTimer();
        audio = this.stopRecord();
        if (this.globals.isMobil) {
          const filePath = `${this.dirPath}${this.fileName}`;
          const fileEntry = await this.file.resolveLocalFilesystemUrl(filePath) as FileEntry;
          await fileEntry.getMetadata(async (metadata) => {
            if (metadata.size === 0) {
              this.deleteFile(this.fileName);
            }
            await setTimeout(async () => {
              await this.popOverCtrl.dismiss(Object.assign(audio, { size: metadata.size, filePath, blob: null })); // buscar la forma de generar el blob en plataforma android y ios
            }, 500);
          }, (e) => console.error(e));
        }
        break;
      case 'cancel': {
        this.cancelRecord();
        this.popOverCtrl.dismiss(null);
        break;
      }
    }
  }
  startRecord(forceWeb = false) {
    const isPlatform = (platform) => {
      return this.platform.is('cordova') && this.platform.is(platform);
    };
    if (isPlatform('ios') && !forceWeb) {
      this.fileName = `${fileName}.m4a`;
      this.filePath = this.dirPath.replace(/^file:\/\//, '') + this.fileName;
      this.audio = this.media.create(this.filePath);
      this.audio.release();
      this.audio.startRecord();
      this.recording = true;
    } else if (isPlatform('android') && !forceWeb) {
      this.fileName = `${fileName}.3gp`;
      this.filePath = this.dirPath.replace(/^file:\/\//g, '') + this.fileName;
      this.audio = this.media.create(this.filePath);
      this.audio.release();
      this.audio.startRecord();
      this.recording = true;
    } else {
      this.fileName = `${file_path}/${fileName}.m4a`;
      this.filePath = `${this.fileName}`;
      this.audio = this.globals.getMediaWeb();
      this.globals.audioBlob.subscribe(async (blob: any) => {
        fs.writeFile(this.fileName, blob).then(async () => {
          await setTimeout(async () => {
            await this.popOverCtrl.dismiss({ size: blob.size, filePath: this.filePath, blob });
          }, 500);
        });
      });
      this.audio.release();
      this.audio.startRecord();
      this.recording = true;
    }
  }
  cancelRecord() {
    this.audio.stopRecord();
    this.deleteFile(this.fileName);
    this.recording = false;
  }
  stopRecord(): any {
    this.audio.stopRecord();
    const audio: any = this.audio;
    const data = { filename: this.fileName, filePath: this.filePath, audio };
    this.recording = false;
    return data;
  }
  deleteFile(file) {
    if (this.globals.isMobil) {
      if (this.platform.is('ios')) {
        this.filePath = this.file.documentsDirectory;
      } else if (this.platform.is('android')) {
        this.filePath = this.file.externalDataDirectory;
      }
      this.file.removeFile(this.filePath, file).then();
    }
  }
  playAudio(file, idx) {
    if (this.platform.is('ios')) {
      this.filePath = this.file.documentsDirectory.replace(/file:\/\//g, '') + file;
      this.audio = this.media.create(this.filePath);
    } else {
      this.filePath = this.file.externalDataDirectory.replace(/file:\/\//g, '') + file;
      this.audio = this.media.create(this.filePath);
    }
    this.audio.play();
    this.audio.setVolume(0.8);
  }

}
