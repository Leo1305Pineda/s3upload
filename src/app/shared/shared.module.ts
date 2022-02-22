import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
/* Pipes */
import { 
    SafePipe 
} from '../pipes/safe/safe.pipe';
/* Components */
import {
    ModalVideoComponent,
    TimerComponent,
    VoiceAudioComponent, 
    VoicePopoverComponent 
} from './components';
/** Directives */

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
    ],
    declarations: [
        ModalVideoComponent,
        VoiceAudioComponent,
        VoicePopoverComponent,
        TimerComponent,
        /** Directives */

        /** Pipe */
        SafePipe,
    ],
    exports: [
        ModalVideoComponent,
        VoiceAudioComponent,
        VoicePopoverComponent,
        TimerComponent,    
        /** Directives */

        /** Pipe */
        SafePipe,
    ],
    entryComponents: [
        ModalVideoComponent,
        VoicePopoverComponent,
    ],
    providers: [
       // FileTransferObject,
      //  Media,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class SharedModule {
}
