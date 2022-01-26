import { Injectable } from '@angular/core';
import { CameraDirection, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';
import { Platform, ToastController, ToastOptions } from '@ionic/angular';
import { Subject } from 'rxjs';
import { MediaObject, MEDIA_STATUS } from '@ionic-native/media/ngx';

declare var MediaRecorder: any;

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  image_options: ImageOptions = {
    quality: 50,
    correctOrientation: true,
    preserveAspectRatio: true,
    allowEditing: false,
    width: 800,
    direction: CameraDirection.Rear,
    source: CameraSource.Camera,
    resultType: CameraResultType.Base64
  }

  audioBlob: Subject<Blob>;

  constructor(
    private toast: ToastController,
    private platform: Platform
  ) { }

  get isMobil(): boolean {
    return this.platform.is('cordova') && (this.platform.is('android') || this.platform.is('ios'));
  }

  /**
    * @description Toash of error
    * @param message The message to show
    * @param pos 'top' | 'bottom' | 'middle';
    * @returns {Promise<any>}
    */
  async errorToast(message: any, pos: any = 'top', duration = 3000) {
    const option: ToastOptions = {
      message,
      duration,
      position: pos,
      color: 'danger'
    };
    const toast = await this.toast.create(option);
    await toast.present();
    return toast;
  }

  /**
     * @description Toash of warning
     * @param message Menssage to show
     * @returns {Promise<any>}
     */
  async warningToast(message: any, duration = 3000) {
    const toast = await this.toast.create({
      message,
      duration,
      position: 'top',
      color: 'warning'
    });
    toast.present();
  }

  getMediaWeb(metadata: Blob = null): MediaObject {
    this.audioBlob = new Subject<Blob>();
    // Media states
    // tslint:disable-next-line: no-shadowed-variable
    const MEDIA_STATUS = {
        MEDIA_NONE: 0,
        MEDIA_STARTING: 1,
        MEDIA_RUNNING: 2,
        MEDIA_PAUSED: 3,
        MEDIA_STOPPED: 4
    };
    const objectInstance = metadata ? new Audio(window.URL.createObjectURL(metadata)) : new Audio();
    const media = new MediaObject(objectInstance);
    const onStatusUpdate = new Subject<MEDIA_STATUS>();
    media.onStatusUpdate = onStatusUpdate;
    onStatusUpdate.next(MEDIA_STATUS.MEDIA_NONE);
    media.setVolume = (volume) => {
        objectInstance.volume = volume;
    };

    media.play = () => {
        onStatusUpdate.next(MEDIA_STATUS.MEDIA_STARTING);
        objectInstance.play();
        onStatusUpdate.next(MEDIA_STATUS.MEDIA_RUNNING);
    };

    media.pause = () => {
        objectInstance.pause();
        onStatusUpdate.next(MEDIA_STATUS.MEDIA_PAUSED);
    };
    media.pauseRecord = media.pause;

    media.stop = () => {
        objectInstance.pause();
        onStatusUpdate.next(MEDIA_STATUS.MEDIA_PAUSED);
    };

    media.release = () => {
        objectInstance.currentTime = 0;
        objectInstance.pause();
        onStatusUpdate.next(MEDIA_STATUS.MEDIA_STOPPED);
    };
    media.resumeRecord = media.release;

    media.startRecord = () => {
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            const audioChunks = [];
            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                this.audioBlob.next(new Blob(audioChunks));
            });
            media.stopRecord = () => {
                media.stop();
                mediaRecorder.stop();
            };
        }).catch(() => {
            media.resumeRecord();
        });
    };

    media.seekTo = (milliseconds: number) => {
        objectInstance.currentTime = milliseconds;
    };

    media.getDuration = () => {
        return objectInstance.duration || -1;
    };
    media.getCurrentPosition = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            resolve(objectInstance.currentTime);
        });
    };
    return media;
}

}
