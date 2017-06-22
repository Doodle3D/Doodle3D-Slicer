import * as THREE from 'three.js';

const MOVE = 'G';
const M_COMMAND = 'M';
const FAN_SPEED = 'S';
const SPEED = 'F';
const EXTRUDER = 'E';
const POSITION_X = 'X';
const POSITION_Y = 'Y';
const POSITION_Z = 'Z';

export default class {
  constructor(settings) {
    this._gcode = '';
    this._currentValues = {};
    this._settings = settings;

    this.extruder = 0.0;
    this.bottom = true;
    this.isRetracted = false;
    this.isFanOn = false;
    this._nozzlePosition = new THREE.Vector2(0, 0);

    if (typeof settings !== 'undefined') this.setSettings(settings);
  }

  _addGCode(command) {
    let str = '';

    let first = true;
    for (const action in command) {
      const value = command[action];
      const currentValue = this._currentAValues[action];
      if (first) {
        str = action + value;

        first = false;
      } else if (currentValue !== value) {
        str += ` ${action}${value}`;

        this._currentAcValues[action] = value;
      }
    }

    this._gcode += `${str}\n`;
  }

  turnFanOn(fanSpeed) {
    this.isFanOn = true;

    const gcode = { [M_COMMAND]: 106 }
    if (typeof fanSpeed !== 'undefined') gcode[FAN_SPEED] = fanSpeed;

    this._addGCode(gcode);

    return this;
  }

  turnFanOff() {
    this.isFanOn = false;

    this._addGCode({ [M_COMMAND]: 107 });

    return this;
  }

  moveTo(x, y, layer) {
    const {
      layerHeight,
      travelSpeed
    } = this._settings.config;

    const z = layer * layerHeight + 0.2;
    const speed = travelSpeed * 60;

    this._addGCode({
      [MOVE]: 0,
      [POSITION_X]: x.toFixed(3),
      [POSITION_Y]: y.toFixed(3),
      [POSITION_Z]: z.toFixed(3),
      [SPEED]: speed.toFixed(3)
    });

    this._nozzlePosition.set(x, y);

    return this;
  }

  lineTo(x, y, layer, type) {
    const newNozzlePosition = new THREE.Vector2(x, y);

    const {
      layerHeight,
      nozzleDiameter,
      filamentThickness,
      travelSpeed
    } = this._settings.config;

    const profile = this._settings.config[(this.bottom ? 'bottom' : type)];

    let {
      speed,
      flowRate
    } = profile;

    speed *= 60;
    const z = layer * layerHeight + 0.2;

    const lineLength = this._nozzlePosition.distanceTo(newNozzlePosition);

    const filamentSurfaceArea = Math.pow((filamentThickness / 2), 2) * Math.PI;
    this.extruder += lineLength * nozzleDiameter * layerHeight / filamentSurfaceArea * flowRate;

    this._addGCode({
      [MOVE]: 1,
      [POSITION_X]: x.toFixed(3),
      [POSITION_Y]: y.toFixed(3),
      [POSITION_Z]: z.toFixed(3),
      [SPEED]: speed.toFixed(3),
      [EXTRUDER]: this.extruder.toFixed(3)
    });

    this._nozzlePosition.copy(newNozzlePosition);

    return this;
  }

  unRetract() {
    const {
      retractionEnabled,
      retractionMinDistance,
      retractionSpeed
    } = this._settings.config;

    if (this.isRetracted && retractionEnabled) {
      this.isRetracted = false;

      const speed = retractionSpeed * 60;

      if (this.extruder > retractionMinDistance) {
        this._addGCode({
          [MOVE]: 0,
          [EXTRUDER]: this.extruder.toFixed(3),
          [SPEED]: speed.toFixed(3)
        });
      }
    }

    return this;
  }

  retract() {
    const {
      retractionAmount,
      retractionEnabled,
      retractionMinDistance,
      retractionSpeed
    } = this._settings.config;

    if (!this.isRetracted && retractionEnabled) {
      this.isRetracted = true;

      const speed = retractionSpeed * 60;

      if (this.extruder > retractionMinDistance && retractionEnabled) {
        this._addGCode({
          [MOVE]: 0,
          [EXTRUDER]: (this.extruder - retractionAmount).toFixed(3),
          [SPEED]: speed.toFixed(3)
        });
      }
    }

    return this;
  }

  getGCode() {
    return this._settings.startCode() + this._gcode + this._settings.endCode();
  }
}
