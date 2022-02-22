import { Component } from '@angular/core';
import { Camera } from '@capacitor/camera';
import { ModalController, Platform, PopoverController } from '@ionic/angular';
import * as S3 from "aws-sdk/clients/s3";
import { environment } from 'src/environments/environment';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { GlobalService } from 'src/app/core/services/global/global.service';
import { ModalVideoComponent, VoicePopoverComponent } from 'src/app/shared/components';
declare const navigator;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  config: any = {
    region: environment.AWSregion,
    accessKeyId: environment.AWSaccessKeyId,
    secretAccessKey: environment.AWSsecretAccessKey,
    bucketName: environment.AWSbucketName
  };

  s3: any = new S3({
    accessKeyId: this.config.accessKeyId,
    secretAccessKey: this.config.secretAccessKey
  });

  list: any[] = [];

  isPresentPopover: boolean;
  isModal: boolean;

  constructor(
    private androidPermissions: AndroidPermissions,
    private platform: Platform,
    private popoverCtrl: PopoverController,
    private globals: GlobalService,
    private modalCtrl: ModalController
  ) { }

  ngOnInit() {
  }

  /** Converts picture content to blob format to uplad it to S3. */
  public dataURItoBlob(dataURI, type = 'image/jpg') {
    var binary = atob(dataURI.split(',')[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {
      type
    });
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto(this.globals.image_options);

      const keyFile = Math.random().toString(36).substring(2);

      this.s3.upload({
        Key: `${keyFile}.jpg`,
        Bucket: this.config.bucketName,
        Body: this.dataURItoBlob('data:image/jpg;base64,' + image.base64String),
        ACL: 'public-read',
        ContentType: 'image/jpeg'
      }, (err, data) => {
        if (err) {
          console.log(err, 'there was an error uploading your file');
        } else {
          this.list.push(data['Location']);
        }
      });
    } catch (error) {

    }
  }

  /**
   * @description present popover request the permission voice to platform android
   */
  async presentPopover() {
    if (!!this.isPresentPopover) {
      return;
    }
    const popover = await this.popoverCtrl.create({
      component: VoicePopoverComponent,
      cssClass: 'popover-custom'
    });
    popover.onDidDismiss().then((data: any) => {
      this.isPresentPopover = false;
      if (!!data && !!data.data) {
        if (data.data.filePath != null) {
          if (data.data.size > 0) {
            const value = data.data;
            const ext = value.filePath.split('.').reverse()[0]
          //  value.blob.type = `data:audio/${ext}`;
            const blob: Blob = value.blob;
            console.log(value);
            this.s3.upload({
              Key: value.filePath,
              Bucket: this.config.bucketName,
              Body: blob,
              ACL: 'public-read',
              ContentType: `audio/${ext}`
            }, (err, data) => {
              if (err) {
                console.log(err, 'there was an error uploading your file');
              } else {
                this.list.push(data['Location']);
              }
            });
          } else {
            if (this.platform.is('android')) {
              console.warn(`To aggregate in ten manisfest attribute android:requestLegacyExternalStorage="true" `)
            }
            this.globals.errorToast('Hubo un error al procesar la nota de voz', 'top', 5000);
          }
        }
      }
      /*switch (data) {
        case 'finish':
          break;
        case 'cancel':
          break;
      }*/
    });
    if (this.platform.is('android') && !this.platform.is('mobileweb')) {
      this.androidPermissions.requestPermissions([
        this.androidPermissions.PERMISSION.RECORD_AUDIO,
        this.androidPermissions.PERMISSION.MODIFY_AUDIO_SETTINGS
      ]).then((res: any) => {
        if (res.hasPermission) {
          popover.present();
          this.isPresentPopover = true;
        }
      }, (err) => {
        console.warn('err requestPermissions', err);
      });
    } else if (this.platform.is('ios') && !this.platform.is('mobileweb')) {
      popover.present();
      this.isPresentPopover = true;
    } else {
      navigator.getUserMedia = (navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia || 
        (navigator.mediaDevices? navigator.mediaDevices.getUserMedia : undefined));
      const stateRecord = (permissionStatus) => {
        if (permissionStatus.state === 'granted' || permissionStatus.state === 'prompt') {
          if (!this.isPresentPopover) {
            this.isPresentPopover = true;
            popover.present();
          }
        } else if (permissionStatus.state === 'denied') {
          this.globals.warningToast('Activa el permiso del microfono.');
          window.open("https://jobseekers.workable.com/hc/es/articles/360030520234-Permitir-acceso-a-la-c%C3%A1mara-y-el-micr%C3%B3fono", "_blank")
        }
      };
      if (navigator.permissions) {
          navigator.permissions.query(
            // { name: 'camera' }
            { name: 'microphone' }
            // { name: 'geolocation' }
            // { name: 'notifications' }
            // { name: 'midi', sysex: false }
            // { name: 'midi', sysex: true }
            // { name: 'push', userVisibleOnly: true }
            // { name: 'push' } // without userVisibleOnly isn't supported in chrome M45, yet
          ).then((permissionStatus) => {
            stateRecord(permissionStatus);
            permissionStatus.onchange = () => {
              stateRecord(permissionStatus);
            };
        });
      }
      if (navigator.getUserMedia) {
        try {
          await navigator.getUserMedia({ audio: true, video: false }, () => { }, () => { });
        } catch (error) {
          this.globals.errorToast('Por favor activa los permisos de grabación de audio en la aplicación')
        }
      } else {
        console.warn('we cannot detected a valid record voice function')
      }
    }
  }

  async modalVideo() {
    if (this.isModal) {
      return;
    }
    const modal = await this.modalCtrl.create({component: ModalVideoComponent});
    modal.onDidDismiss().then(() => {
      this.isModal = false;
    });
    return await modal.present();
  }

}
