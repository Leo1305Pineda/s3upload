import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController, Platform } from '@ionic/angular';
import { MediaCapture, MediaFile, CaptureError, CaptureVideoOptions } from '@ionic-native/media-capture/ngx';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { Storage } from '@ionic/storage-angular';
import { environment } from '@env/environment';
import * as S3 from 'aws-sdk/clients/s3';

const MEDIA_FILES_KEY = 'mediaFiles';

@Component({
  selector: 'app-modal-video',
  templateUrl: './modal-video.component.html',
  styleUrls: ['./modal-video.component.scss'],
})
export class ModalVideoComponent implements OnInit {

  mediaFile: any;
  mediaFiles = [];
  createVideoPostForm: FormGroup;
  newTag: string = '';
  tags: string[] = [];
  newVideo: any;
  newFile: any;
  newFile2: any;
  blob: Blob
  filename: any;
  videoView: any;
  videoTest: any;
  srcTest: any;
  srcBlob: any;
  capturedFileTest: any;
  disableButton: boolean;
  private _storage: Storage | null = null;

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

  @Input() dream: string;

  @ViewChild('myvideo') myVideo: any;
  @ViewChild('videoPlayer') videoplayer: ElementRef;

  constructor(
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private modal: ModalController,
    private webview: WebView,
    private platform: Platform,
    private storage: Storage,
    private mediaCapture: MediaCapture) {
  }

  get isMobile(): boolean {
    return this.platform.is('cordova') && (this.platform.is('android') || this.platform.is('ios'));
  }

  async ngOnInit() {
    this.createVideoPostForm = this.formBuilder.group({
      description: ['', [Validators.required]],
    });
    const storage = await this.storage.create();
    this._storage = storage;
    this.captureVideo();
  }

  captureVideo() {
    let options: CaptureVideoOptions = {
      limit: 1,
      duration: 30
    }
    this.mediaCapture.captureVideo(options).then((res: MediaFile[]) => {
      this.mediaFile = res[0];
      this.srcTest = this.webview.convertFileSrc(this.mediaFile.fullPath)
      fetch(this.srcTest, {
        headers: {},
      }).then((response) => {
        return response.blob();
      }).then((blob) => {
        this.blob = blob;
        this.srcBlob = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(this.blob));
      }).catch((e) => console.log(e));
    }, (err: CaptureError) => {
      console.error(err)
    });
  }

  onCloseModal(data = null) {
    this.modal.dismiss(data);
  }

  createVideoPost() {
    const data = {
      Key: this.mediaFile.name,
      Bucket: this.config.bucketName,
      Body: this.blob,
      ACL: 'public-read',
      ContentType: this.blob.type
    };
    console.log(this.blob, this.srcBlob, this.mediaFile, data, 'Fetch');
    this.disableButton = true;
    this.s3.upload(data, (err, data) => {
      if (err) {
        console.log(err, 'there was an error uploading your file');
      } else {
        console.info('<< EUREKA >>', data);
      }
      this.disableButton = false;
    });
  }

  onChangeNewTag(e) {
    const { value } = e.detail;
    if (value[0] === '#') {
      this.newTag = value.substring(1);
    } else {
      this.newTag = value;
    }
  }

  onEnterNewTag() {
    if (this.newTag) {
      const tags = [...this.tags];
      tags.push(this.newTag);
      const tagsFiltered = [...new Set(tags)];
      this.tags = tagsFiltered;
      this.newTag = '';
    }
  }

  storeMediaFiles(files) {
    this._storage.get(MEDIA_FILES_KEY).then(data => {
      if (data) {
        data = data.concat(files);
        this._storage.set(MEDIA_FILES_KEY, data);
      } else {
        this._storage.set(MEDIA_FILES_KEY, files)
      }
      this.mediaFiles = this.mediaFiles.concat(files);
      console.log("mes", this.mediaFiles)
    });
  }

}
