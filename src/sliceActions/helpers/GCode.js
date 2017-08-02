import * as THREE from 'three';

const MOVE = 'G';
const M_COMMAND = 'M';
const FAN_SPEED = 'S';
const SPEED = 'F';
const EXTRUDER = 'E';
const POSITION_X = 'X';
const POSITION_Y = 'Y';
const POSITION_Z = 'Z';

export default class {
  constructor(nozzleToFilamentRatio) {
    this._nozzleToFilamentRatio = nozzleToFilamentRatio;

    this._gcode = '';
    this._currentValues = {};
    this._nozzlePosition = new THREE.Vector2(0, 0);
    this._extruder = 0.0;
    this._duration = 0.0;
    this._isRetracted = false;
    this._isFanOn = false;
  }

  _addGCode(command) {
    let str = '';

    let first = true;
    for (const action in command) {
      const value = command[action];
      const currentValue = this._currentValues[action];
      if (first) {
        str = action + value;

        first = false;
      } else if (currentValue !== value) {
        str += ` ${action}${value}`;

        this._currentValues[action] = value;
      }
    }

    this._gcode += `${str}\n`;
  }

  turnFanOn(fanSpeed) {
    this._isFanOn = true;

    const gcode = { [M_COMMAND]: 106 }
    if (typeof fanSpeed !== 'undefined') gcode[FAN_SPEED] = fanSpeed;

    this._addGCode(gcode);

    return this;
  }

  turnFanOff() {
    this._isFanOn = false;

    this._addGCode({ [M_COMMAND]: 107 });

    return this;
  }

  moveTo(x, y, z, { speed }) {
    const newNozzlePosition = new THREE.Vector2(x, y);
    const lineLength = this._nozzlePosition.distanceTo(newNozzlePosition);

    this._duration += lineLength / speed;

    this._addGCode({
      [MOVE]: 0,
      [POSITION_X]: x.toFixed(3),
      [POSITION_Y]: y.toFixed(3),
      [POSITION_Z]: z.toFixed(3),
      [SPEED]: (speed * 60).toFixed(3)
    });

    this._nozzlePosition.copy(newNozzlePosition);

    return this;
  }

  lineTo(x, y, z, { speed, flowRate }) {
    const newNozzlePosition = new THREE.Vector2(x, y);
    const lineLength = this._nozzlePosition.distanceTo(newNozzlePosition);

    this._extruder += this._nozzleToFilamentRatio * lineLength * flowRate;
    this._duration += lineLength / speed;

    this._addGCode({
      [MOVE]: 1,
      [POSITION_X]: x.toFixed(3),
      [POSITION_Y]: y.toFixed(3),
      [POSITION_Z]: z.toFixed(3),
      [SPEED]: (speed * 60).toFixed(3),
      [EXTRUDER]: this._extruder.toFixed(3)
    });

    this._nozzlePosition.copy(newNozzlePosition);

    return this;
  }

  unRetract({ enabled, speed, minDistance, amount }) {
    if (this._isRetracted && enabled) {
      this._isRetracted = false;

      if (this._extruder > minDistance) {
        this._duration += amount / speed;

        this._addGCode({
          [MOVE]: 0,
          [EXTRUDER]: this._extruder.toFixed(3),
          [SPEED]: (speed * 60).toFixed(3)
        });
      }
    }

    return this;
  }

  retract({ enabled, speed, minDistance, amount }) {
    if (!this._isRetracted && enabled) {
      this._isRetracted = true;

      if (this._extruder > minDistance) {
        this._duration += amount / speed;

        this._addGCode({
          [MOVE]: 0,
          [EXTRUDER]: (this._extruder - amount).toFixed(3),
          [SPEED]: (speed * 60).toFixed(3)
        });
      }
    }

    return this;
  }

  getGCode() {
    return {
      gcode: this._gcode,
      duration: this._duration,
      filament: this._extruder
    };
  }
}
