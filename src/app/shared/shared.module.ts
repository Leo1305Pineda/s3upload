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
        SafePipe,
        VoiceAudioComponent,
        VoicePopoverComponent,
        TimerComponent,
        /** Directives */
    ],
    exports: [
        SafePipe,
        VoiceAudioComponent,
        VoicePopoverComponent,
        TimerComponent,
        // Module
    
        /** Directives */
      
    ],
    entryComponents: [
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
