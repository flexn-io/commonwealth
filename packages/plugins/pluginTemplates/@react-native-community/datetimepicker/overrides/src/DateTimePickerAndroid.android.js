/**
 * @format
 * @flow strict-local
 */
import invariant from 'invariant';
import {
    ANDROID_DISPLAY,
    ANDROID_MODE, DATE_SET_ACTION, DISMISS_ACTION,
    NEUTRAL_BUTTON_ACTION, TIME_SET_ACTION
} from './constants';

import { processColor } from 'react-native';
import {
    getOpenPicker,
    timeZoneOffsetDateSetter,
    validateAndroidProps
} from './androidUtils';
import {
    createDateTimeSetEvtParams,
    createDismissEvtParams,
    createNeutralEvtParams
} from './eventCreators';
import pickers from './picker';
import type { AndroidNativeProps } from './types';

function open(props: AndroidNativeProps) {
  const {
    mode = ANDROID_MODE.date,
    display,
    value: originalValue,
    is24Hour,
    minimumDate,
    maximumDate,
    minuteInterval,
    timeZoneOffsetInMinutes,
    onChange,
    onError,
    positiveButton,
    negativeButton,
    neutralButton,
    neutralButtonLabel,
    positiveButtonLabel,
    negativeButtonLabel,
  } = props;
  validateAndroidProps(props);
  invariant(originalValue, 'A date or time must be specified as `value` prop.');

  const valueTimestamp = originalValue.getTime();
  const openPicker = getOpenPicker(mode);

  const presentPicker = async () => {
    try {
      const dialogButtons = {
        positive: {
          label: positiveButtonLabel,
          ...positiveButton,
          textColor: processColor(positiveButton?.textColor),
        },
        neutral: {
          label: neutralButtonLabel,
          ...neutralButton,
          textColor: processColor(neutralButton?.textColor),
        },
        negative: {
          label: negativeButtonLabel,
          ...negativeButton,
          textColor: processColor(negativeButton?.textColor),
        },
      };

      const displayOverride =
        display === ANDROID_DISPLAY.spinner
          ? ANDROID_DISPLAY.spinner
          : ANDROID_DISPLAY.default;
      const {action, day, month, year, minute, hour} = await openPicker({
        value: valueTimestamp,
        display: displayOverride,
        is24Hour,
        minimumDate,
        maximumDate,
        minuteInterval,
        timeZoneOffsetInMinutes,
        dialogButtons,
      });

      switch (action) {
        case DATE_SET_ACTION: {
          let date = new Date(valueTimestamp);
          date.setFullYear(year, month, day);
          date = timeZoneOffsetDateSetter(date, timeZoneOffsetInMinutes);
          const [event] = createDateTimeSetEvtParams(date);
          onChange?.(event, date);
          break;
        }

        case TIME_SET_ACTION: {
          let date = new Date(valueTimestamp);
          date.setHours(hour, minute);
          date = timeZoneOffsetDateSetter(date, timeZoneOffsetInMinutes);
          const [event] = createDateTimeSetEvtParams(date);
          onChange?.(event, date);
          break;
        }

        case NEUTRAL_BUTTON_ACTION: {
          const [event] = createNeutralEvtParams(originalValue);
          onChange?.(event, originalValue);
          break;
        }
        case DISMISS_ACTION:
        default: {
          const [event] = createDismissEvtParams(originalValue);
          onChange?.(event, originalValue);
          break;
        }
      }
    } catch (error) {
      onError && onError(error);
    }
  };
  presentPicker();
}

function dismiss(mode) {
  // $FlowFixMe - `AbstractComponent` [1] is not an instance type.
  return pickers[mode]?.dismiss();
}

export const DateTimePickerAndroid = {open, dismiss};
