import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import MenuItem from 'material-ui/MenuItem';
import injectSheet from 'react-jss';
import { SelectField, TextField, Checkbox } from './FormComponents.js';
import { grey800, cyan500, red500 } from 'material-ui/styles/colors';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { LOCAL_STORAGE_KEY } from '../constants.js';
import shortid from 'shortid';
import defaultSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import update from 'react-addons-update';

const styles = {
  textFieldRow: {
    display: 'flex'
  },
  container: {
    width: '100%',
    flexGrow: 1,
    overflowY: 'auto',
    '& p, h3': {
      fontWeight: 'bold',
      margin: '30px 0 0 0'
    }
  },
  error: {
    color: red500
  }
};

const getLocalStorage = () => {
  let localStorage = window.localStorage.getItem(LOCAL_STORAGE_KEY);

  if (!localStorage) {
    localStorage = { printers: {}, active: null };
    updateLocalStorage(localStorage);
  } else {
    localStorage = JSON.parse(localStorage);
  }
  return localStorage;
};

const updateLocalStorage = (localStorage) => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localStorage));
};

class Settings extends React.Component {
  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string),
    onChange: PropTypes.func,
    disabled: PropTypes.bool.isRequired
  };
  static defaultProps: {
    disabled: false
  };
  static childContextTypes = {
    settings: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool.isRequired,
    addPrinter: PropTypes.object.isRequired,
    activePrinter: PropTypes.string,
    advancedFields: PropTypes.array.isRequired
  };

  state = {
    localStorage: getLocalStorage(),
    addPrinter: {
      open: false,
      name: '',
      printer: '',
      error: null
    }
  };

  componentDidMount() {
    const { onChange } = this.props;
    const { localStorage } = this.state;
    if (localStorage.active) {
      if (onChange) onChange(this.constructSettings(localStorage));
    } else {
      this.openAddPrinterDialog();
    }
  }

  changeSettings = (fieldName, value) => {
    const { onChange } = this.props;
    const { localStorage } = this.state;

    let state = _.cloneDeep(this.state);

    const removeAddPrinterError = () => {
      state = update(state, { addPrinter: { error: { $set: null } } });
    };

    switch (fieldName) {
      case 'addPrinter.printer':
        state = update(state, { addPrinter: { printer: { $set: value } } });
        state = update(state, { addPrinter: { name: { $set: printerSettings[value].title } } });
        removeAddPrinterError();
        break;

      case 'addPrinter.name':
        state = update(state, { addPrinter: { name: { $set: value } } });
        removeAddPrinterError();
        break;

      case 'activePrinter':
        if (value !== 'add_printer') state = update(state, { localStorage: { active: { $set: value } } });
        break;

      case 'settings.quality':
      case 'settings.material':
        if (!localStorage.active) return this.openAddPrinterDialog();

        state = _.set(state, `localStorage.printers[${localStorage.active}].${fieldName}`, value);
        break;

      case 'settings.layerHeight':
      case 'settings.dimensions.x':
      case 'settings.dimensions.y':
      case 'settings.dimensions.z':
      case 'settings.nozzleDiameter':
      case 'settings.bedTemperature':
      case 'settings.heatedBed':
      case 'settings.filamentThickness':
      case 'settings.temperature':
      case 'settings.thickness.top':
      case 'settings.thickness.bottom':
      case 'settings.thickness.shell':
      case 'settings.retraction.enabled':
      case 'settings.retraction.amount':
      case 'settings.retraction.speed':
      case 'settings.retraction.minDistance':
      case 'settings.travel.speed':
      case 'settings.combing':
      case 'settings.innerShell.speed':
      case 'settings.innerShell.flowRate':
      case 'settings.outerShell.speed':
      case 'settings.outerShell.flowRate':
      case 'settings.innerInfill.gridSize':
      case 'settings.innerInfill.speed':
      case 'settings.innerInfill.flowRate':
      case 'settings.outerInfill.speed':
      case 'settings.outerInfill.flowRate':
      case 'settings.brim.size':
      case 'settings.brim.speed':
      case 'settings.brim.flowRate':
      case 'settings.firstLayer.speed':
      case 'settings.firstLayer.flowRate':
        if (!localStorage.active) return this.openAddPrinterDialog();

        if (value === null) {
          const advanced = { ...state.localStorage.printers[localStorage.active].settings.advanced };
          delete advanced[fieldName];
          state = update(state, { localStorage: { printers: { [localStorage.active]: { settings: { advanced: { $set: advanced } } } } } });
        } else {
          state = _.set(state, `localStorage.printers[${localStorage.active}].settings.advanced[${JSON.stringify(fieldName)}]`, value);
        }
        break;

      default:
        break;
    }
    this.setState(state);
    if (localStorage.active) {
      if (onChange) onChange(this.constructSettings(state.localStorage));
      updateLocalStorage(state.localStorage);
    }
  }

  getChildContext() {
    const { localStorage, addPrinter } = this.state;

    return {
      addPrinter,
      activePrinter: localStorage.active,
      advancedFields: localStorage.active ? Object.keys(localStorage.printers[localStorage.active].settings.advanced) : [],
      settings: this.constructSettings(localStorage),
      onChange: this.changeSettings,
      disabled: this.props.disabled
    };
  }

  constructSettings(localStorage) {
    if (!localStorage.active) return defaultSettings;

    const { printer, material, quality, advanced } = localStorage.printers[localStorage.active].settings;
    let settings = {
      ...defaultSettings,
      printer,
      material,
      quality
    };

    settings = _.merge({}, settings, printerSettings[printer]);
    settings = _.merge({}, settings, qualitySettings[quality]);
    settings = _.merge({}, settings, materialSettings[material]);

    for (const key in advanced) {
      const value = advanced[key];
      settings = _.set(_.cloneDeep(settings), key.replace('settings.', ''), value);
    }

    return settings;
  }

  addPrinter = () => {
    const { name, printer } = this.state.addPrinter;

    if (!name || !printer) {
      this.setState({ addPrinter: { ...this.state.addPrinter, error: 'Please enter a name and printer' } });
      return;
    }

    const id = shortid.generate();
    const localStorage = {
      active: id,
      printers: {
        ...this.state.localStorage.printers,
        [id]: { name, settings: { printer, material: 'pla', quality: 'medium', advanced: {} } }
      }
    };
    this.setState({ localStorage });
    updateLocalStorage(localStorage);

    this.closeAddPrinterDialog();

    const { onChange } = this.props;
    if (onChange) onChange(this.constructSettings(localStorage));
  }

  closeAddPrinterDialog = () => this.setAddPrinterDialog(false);
  openAddPrinterDialog = () => this.setAddPrinterDialog(true);
  setAddPrinterDialog = (open) => this.setState({ addPrinter: { name: '', printer: '', error: null, open } });

  render() {
    const { addPrinter, localStorage } = this.state;
    const { classes, disabled } = this.props;

    return (
      <div className={classes.container}>
        <SelectField name="activePrinter" floatingLabelText="Printer" fullWidth>
          {Object.entries(localStorage.printers).map(([id, { name }]) => (
            <MenuItem key={id} value={id} primaryText={name} />
          ))}
          <Divider />
          <MenuItem onTouchTap={this.openAddPrinterDialog} value="add_printer" primaryText="Add Printer" />
        </SelectField>
        <SelectField name="settings.material" floatingLabelText="Material" fullWidth>
          {Object.entries(materialSettings).map(([value, { title }]) => (
            <MenuItem key={value} value={value} primaryText={title} />
          ))}
        </SelectField>
        <h3>Printer Setup</h3>
        <Tabs inkBarStyle={{ backgroundColor: cyan500 }}>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Basic">
            <div>
              <SelectField name="settings.quality" floatingLabelText="Quality" fullWidth>
                {Object.entries(qualitySettings).map(([value, { title }]) => (
                  <MenuItem key={value} value={value} primaryText={title} />
                ))}
              </SelectField>
            </div>
          </Tab>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Advanced">
            <div>
              <p>Layer</p>
              <TextField name="settings.layerHeight" fullWidth floatingLabelText="Height" type="number" />
              <p>Printer dimensions</p>
              <div className={classes.textFieldRow}>
                <TextField name="settings.dimensions.x" fullWidth floatingLabelText="X" type="number" />
                <TextField name="settings.dimensions.y" fullWidth floatingLabelText="Y" type="number" />
                <TextField name="settings.dimensions.z" fullWidth floatingLabelText="Z" type="number" />
              </div>
              <p>Nozzle</p>
              <TextField name="settings.nozzleDiameter" fullWidth floatingLabelText="Diameter" type="number" />
              <p>Bed</p>
              <TextField name="settings.bedTemperature" fullWidth floatingLabelText="Temperature" type="number" />
              <Checkbox name="settings.heatedBed" label="Heated" />
              <p>Material</p>
              <TextField name="settings.filamentThickness" fullWidth floatingLabelText="Thickness" type="number" />
              <TextField name="settings.temperature" fullWidth floatingLabelText="Temperature" type="number" />
              <p>Thickness</p>
              <TextField name="settings.thickness.top" fullWidth floatingLabelText="top" type="number" />
              <TextField name="settings.thickness.bottom" fullWidth floatingLabelText="bottom" type="number" />
              <TextField name="settings.thickness.shell" fullWidth floatingLabelText="shell" type="number" />
              <p>Retraction</p>
              <Checkbox name="settings.retraction.enabled" label="Enabled" />
              <TextField name="settings.retraction.amount" fullWidth floatingLabelText="Amount" type="number" />
              <TextField name="settings.retraction.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.retraction.minDistance" fullWidth floatingLabelText="Min distance" type="number" />
              <p>Travel</p>
              <TextField name="settings.travel.speed" fullWidth floatingLabelText="Speed" type="number" />
              <Checkbox name="settings.combing" label="Combing" />
              <p>Inner shell</p>
              <TextField name="settings.innerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p>Outer shell</p>
              <TextField name="settings.outerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p>Inner infill</p>
              <TextField name="settings.innerInfill.gridSize" fullWidth floatingLabelText="Grid size" type="number" />
              <TextField name="settings.innerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p>Outer infill</p>
              <TextField name="settings.outerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p>Brim</p>
              <TextField name="settings.brim.size" fullWidth floatingLabelText="Size" type="number" />
              <TextField name="settings.brim.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.brim.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p>First layer</p>
              <TextField name="settings.firstLayer.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.firstLayer.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </div>
          </Tab>
        </Tabs>
        <Dialog
          title="Add Printer"
          open={addPrinter.open}
          onRequestClose={this.closeAddPrinterDialog}
          contentStyle={{ maxWidth: '400px' }}
          actions={[
            <FlatButton
              label="Cancel"
              onTouchTap={this.closeAddPrinterDialog}
            />,
            <FlatButton
              label="Add"
              primary
              onTouchTap={this.addPrinter}
            />
          ]}
        >
          <SelectField name="addPrinter.printer" floatingLabelText="Printer" fullWidth>
            {Object.entries(printerSettings).map(([value, { title }]) => (
              <MenuItem key={value} value={value} primaryText={title} /> ))}
          </SelectField>
          <TextField name="addPrinter.name" floatingLabelText="Name" fullWidth />
          {addPrinter.error && <p className={classes.error}>{addPrinter.error}</p>}
        </Dialog>
      </div>
    );
  }
}

export default injectSheet(styles)(Settings);
