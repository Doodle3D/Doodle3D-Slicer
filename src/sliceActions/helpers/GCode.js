import { distanceTo } from './vector2.js';
import { VERSION } from '../../constants.js';

export const MOVE = 'G';
export const M_COMMAND = 'M';
export const FAN_SPEED = 'S';
export const SPEED = 'F';
export const EXTRUDER = 'E';
export const POSITION_X = 'X';
export const POSITION_Y = 'Y';
export const POSITION_Z = 'Z';

export default class GCode {
  constructor(settings) {
    this._nozzleToFilamentRatio = 1;
    this._gcode = [
      `; ${JSON.stringify(settings)}`,
      `; Generated with Doodle3D Slicer V${VERSION}`
    ];
    this._currentValues = {};
    this._nozzlePosition = { x: 0, y: 0 };
    this._extruder = 0.0;
    this._duration = 0.0;
    this._isRetracted = false;
    this._isFanOn = false;
  }

  _addGCode(command) {
    this._gcode.push(command);
  }

  updateLayerHeight(layerHeight, nozzleDiameter, filamentThickness) {
    const filamentSurfaceArea = Math.pow((filamentThickness / 2), 2) * Math.PI;
    const lineSurfaceArea = nozzleDiameter * layerHeight;
    this._nozzleToFilamentRatio = lineSurfaceArea / filamentSurfaceArea;
  }

  turnFanOn(fanSpeed) {
    this._isFanOn = true;

    const gcode = { [M_COMMAND]: 106 };
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
    const newNozzlePosition = { x, y };
    const lineLength = distanceTo(this._nozzlePosition, newNozzlePosition);

    this._duration += lineLength / speed;

    this._addGCode({
      [MOVE]: 0,
      [POSITION_X]: newNozzlePosition.x,
      [POSITION_Y]: newNozzlePosition.y,
      [POSITION_Z]: z,
      [SPEED]: speed * 60
    });

    this._nozzlePosition = newNozzlePosition;

    return this;
  }

  lineTo(x, y, z, { speed, flowRate }) {
    const newNozzlePosition = { x, y };
    const lineLength = distanceTo(this._nozzlePosition, newNozzlePosition);

    this._extruder += this._nozzleToFilamentRatio * lineLength * flowRate;
    this._duration += lineLength / speed;

    this._addGCode({
      [MOVE]: 1,
      [POSITION_X]: newNozzlePosition.x,
      [POSITION_Y]: newNozzlePosition.y,
      [POSITION_Z]: z,
      [SPEED]: speed * 60,
      [EXTRUDER]: this._extruder
    });

    this._nozzlePosition = newNozzlePosition;

    return this;
  }

  unRetract({ enabled, speed, minDistance, amount }) {
    if (this._isRetracted && enabled) {
      this._isRetracted = false;

      if (this._extruder > minDistance) {
        this._duration += amount / speed;

        this._addGCode({
          [MOVE]: 0,
          [EXTRUDER]: this._extruder,
          [SPEED]: speed * 60
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
          [EXTRUDER]: this._extruder - amount,
          [SPEED]: speed * 60
        });
      }
    }

    return this;
  }

  addGCode(gcode, { temperature, bedTemperature, heatedBed }) {
    gcode = gcode
      .replace(/{temperature}/g, temperature)
      .replace(/{if heatedBed}.*?\n/g, str => heatedBed ? str.replace(/{if heatedBed}/g, '') : '')
      .replace(/{bedTemperature}/g, bedTemperature);

    this._addGCode(gcode);
  }

  getGCode() {
    return {
      gcode: this._gcode,
      duration: this._duration,
      filament: this._extruder
    };
  }
}
