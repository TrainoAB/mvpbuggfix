import React from 'react';
import { getCookie } from '../functions/functions';
import popClickSound from '@/app/assets/sound/minimal-pop-click-ui-1-198301.mp3';
import plopClickSound from '@/app/assets/sound/minimal-pop-click-ui-2-198302.mp3';
import tickClickSound from '@/app/assets/sound/minimal-pop-click-ui-4-198304.mp3';
import selectSound from '@/app/assets/sound/menuselect4-36147.mp3';
import doneSound from '@/app/assets/sound/button_06-190439.mp3';
import doneSound2 from '@/app/assets/sound/marimba-bloop-2-188149.mp3';
import loadingSound from '@/app/assets/sound/le-sejour-des-voix-200627.mp3';
import swishSound from '@/app/assets/sound/swish-sound-94707.mp3';
import swishSound2 from '@/app/assets/sound/089048_woosh-slide-in-88642.mp3';
import alertSound from '@/app/assets/sound/a-sudden-appearance-143034.mp3';
import notificationSound from '@/app/assets/sound/notification-5-140376.mp3';
import successSound from '@/app/assets/sound/cute-level-up-3-189853.mp3';
import checkSound from '@/app/assets/sound/20170101-light-switch-on-80675.mp3';
import trickleSound from '@/app/assets/sound/080245_sfx-trickle-84935.mp3';
import successSound2 from '@/app/assets/sound/success-1-6297.mp3';
import successSound3 from '@/app/assets/sound/success-48018.mp3';
import canceledSound from '@/app/assets/sound/quotcancelledquot-175693.mp3';
import deleteSound from '@/app/assets/sound/mag-remove-92075.mp3';
import swipeSound from '@/app/assets/sound/swipe-236674.mp3';
import correctSound from '@/app/assets/sound/ui_correct_button2-103167.mp3';

export const defaultSoundFiles = {
  popclick: popClickSound,
  plopclick: plopClickSound,
  tickclick: tickClickSound,
  correct: correctSound,
  select: selectSound,
  done: doneSound,
  done2: doneSound2,
  loading: loadingSound,
  swish: swishSound,
  swish2: swishSound2,
  alert: alertSound,
  notification: notificationSound,
  success: successSound,
  success2: successSound2,
  success3: successSound3,
  check: checkSound,
  trickle: trickleSound,
  canceled: canceledSound,
  delete: deleteSound,
  swipe: swipeSound,
};

export function playSound(soundname, volume = 1) {
  const localValue = getCookie('settingsSound');
  const settingsSound = localValue !== null ? localValue === 'true' : false;
  // console.log("PlaySound: ", settingsSound);

  if (settingsSound) {
    const audio = new Audio(defaultSoundFiles[soundname]);
    audio.volume = soundname === 'tickclick' ? '0.1' : volume;
    audio.play().catch(() => {
      console.log('Autoplay failed, waiting for user interaction.');
    });
  }
}
