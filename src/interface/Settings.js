import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import MenuItem from 'material-ui/MenuItem';
import injectSheet from 'react-jss';
import { SelectField, TextField, NumberField, Checkbox } from './FormComponents.js';
import { grey800, red500 } from 'material-ui/styles/colors';
import Divider from 'material-ui/Divider';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import { LOCAL_STORAGE_KEY } from '../constants.js';
import shortid from 'shortid';
import defaultSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import update from 'react-addons-update';
import SettingsIcon from 'material-ui-icons/Settings';

const styles = {
  textFieldRow: {
    display: 'flex',
    alignItems: 'center'
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
    managePrinter: PropTypes.object.isRequired,
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
    },
    managePrinter: {
      open: false
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
      case 'managePrinter.printer':
      case 'managePrinter.name':
        state = _.set(state, fieldName, value);
        break;

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
      case 'settings.innerInfill.density':
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
    const { localStorage, addPrinter, managePrinter } = this.state;

    return {
      addPrinter,
      managePrinter,
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
  };

  editPrinter = () => {
    const { localStorage: { active, printers }, managePrinter: { printer, name } } = this.state;
    const localStorage = update(this.state.localStorage, {
      printers: {
        [active]: {
          name: { $set: name },
          settings: {
            printer: { $set: printer }
          }
        }
      }
    });
    this.closeManagePrinterDialog();
    this.setState({ localStorage });
    updateLocalStorage(localStorage);

    const { onChange } = this.props;
    if (onChange) onChange(this.constructSettings(localStorage));
  };

  removeActivePrinter = () => {
    let { localStorage: { active, printers } } = this.state;
    if (!active) return;

    printers = { ...printers };
    delete printers[active];
    active = Object.keys(printers)[0] || null;
    const localStorage = { active, printers };

    this.closeManagePrinterDialog();
    this.setState({ localStorage });
    updateLocalStorage(localStorage);

    const { onChange } = this.props;
    if (onChange) onChange(this.constructSettings(localStorage));
  };

  closeAddPrinterDialog = () => this.setAddPrinterDialog(false);
  openAddPrinterDialog = () => this.setAddPrinterDialog(true);
  setAddPrinterDialog = (open) => this.setState({ addPrinter: { name: '', printer: '', error: null, open } });

  closeManagePrinterDialog = () => this.setManagePrinterDialog(false);
  openManagePrinterDialog = () => this.setManagePrinterDialog(true);
  setManagePrinterDialog = (open) => {
    const { localStorage: { active, printers } } = this.state;
    if (!active) return this.setState({ managePrinter: { open: false } });
    this.setState({
      managePrinter: {
        open,
        name: printers[active].name,
        printer: printers[active].settings.printer
      }
    });
  }

  render() {
    const { addPrinter, managePrinter, localStorage } = this.state;
    const { classes, disabled } = this.props;

    return (
      <div className={classes.container}>
        <div className={classes.textFieldRow}>
          <SelectField name="activePrinter" floatingLabelText="Printer" fullWidth>
            {Object.entries(localStorage.printers).map(([id, { name }]) => (
              <MenuItem key={id} value={id} primaryText={name} />
            ))}
            <Divider />
            <MenuItem onTouchTap={this.openAddPrinterDialog} value="add_printer" primaryText="Add Printer" />
          </SelectField>
          {localStorage.active && <SettingsIcon
            onTouchTap={this.openManagePrinterDialog}
            style={{ fill: grey800, marginLeft: '10px', cursor: 'pointer' }}
          />}
        </div>
        <SelectField name="settings.material" floatingLabelText="Material" fullWidth>
          {Object.entries(materialSettings).map(([value, { title }]) => (
            <MenuItem key={value} value={value} primaryText={title} />
          ))}
        </SelectField>
        <h3>Printer Setup</h3>
        <Tabs>
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
              <NumberField name="settings.layerHeight" min={0.05} max={3} fullWidth floatingLabelText="Height" />
              <p>Thickness</p>
              <NumberField name="settings.thickness.top" min={0} fullWidth floatingLabelText="top" />
              <NumberField name="settings.thickness.bottom" min={0} fullWidth floatingLabelText="bottom" />
              <NumberField name="settings.thickness.shell" min={0} fullWidth floatingLabelText="shell" />
              <p>Material</p>
              <NumberField name="settings.filamentThickness" min={0.1} max={10} fullWidth floatingLabelText="Thickness" />
              <NumberField name="settings.temperature" min={100} max={400} fullWidth floatingLabelText="Temperature" />
              <p>Bed</p>
              <NumberField name="settings.bedTemperature" min={30} max={150} fullWidth floatingLabelText="Temperature" />
              <Checkbox name="settings.heatedBed" label="Heated" />
              <p>Brim</p>
              <NumberField name="settings.brim.size" min={0} max={20} fullWidth floatingLabelText="Size" />
              <NumberField name="settings.brim.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.brim.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>First layer</p>
              <NumberField name="settings.firstLayer.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.firstLayer.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>Inner shell</p>
              <NumberField name="settings.innerShell.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.innerShell.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>Outer shell</p>
              <NumberField name="settings.outerShell.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.outerShell.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>Inner infill</p>
              <NumberField name="settings.innerInfill.density" min={0} max={100} fullWidth floatingLabelText="Density" />
              <NumberField name="settings.innerInfill.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.innerInfill.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>Outer infill</p>
              <NumberField name="settings.outerInfill.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.outerInfill.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
              <p>Travel</p>
              <NumberField name="settings.travel.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <Checkbox name="settings.combing" label="Combing" />
              <p>Retraction</p>
              <Checkbox name="settings.retraction.enabled" label="Enabled" />
              <NumberField name="settings.retraction.amount" min={0} max={10} fullWidth floatingLabelText="Amount" />
              <NumberField name="settings.retraction.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
              <NumberField name="settings.retraction.minDistance" min={0} fullWidth floatingLabelText="Min distance" />
              <p>Printer dimensions</p>
              <div className={classes.textFieldRow}>
                <NumberField name="settings.dimensions.x" min={1} fullWidth floatingLabelText="X" />
                <NumberField name="settings.dimensions.y" min={1} fullWidth floatingLabelText="Y" />
                <NumberField name="settings.dimensions.z" min={1} fullWidth floatingLabelText="Z" />
              </div>
              <p>Nozzle</p>
              <NumberField name="settings.nozzleDiameter" min={0.1} max={5} fullWidth floatingLabelText="Diameter" />
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
            <RaisedButton
              label="Add"
              primary
              onTouchTap={this.addPrinter}
            />
          ]}
        >
          <SelectField name="addPrinter.printer" floatingLabelText="Printer" fullWidth>
            {Object.entries(printerSettings).map(([value, { title }]) => (
              <MenuItem key={value} value={value} primaryText={title} />
            ))}
          </SelectField>
          <TextField name="addPrinter.name" floatingLabelText="Name" fullWidth />
          {addPrinter.error && <p className={classes.error}>{addPrinter.error}</p>}
        </Dialog>
        <Dialog
          title="Manage Printer"
          open={managePrinter.open}
          onRequestClose={this.closeManagePrinterDialog}
          contentStyle={{ maxWidth: '400px' }}
          actions={[
            <FlatButton
              label="Cancel"
              onTouchTap={this.closeManagePrinterDialog}
            />,
            <FlatButton
              label="Remove Printer"
              onTouchTap={this.removeActivePrinter}
            />,
            <RaisedButton
              label="Save"
              primary
              onTouchTap={this.editPrinter}
            />
          ]}
        >
          <SelectField name="managePrinter.printer" floatingLabelText="Printer" fullWidth>
            {Object.entries(printerSettings).map(([value, { title }]) => (
              <MenuItem key={value} value={value} primaryText={title} />
            ))}
          </SelectField>
          <TextField name="managePrinter.name" floatingLabelText="Name" fullWidth />
        </Dialog>
      </div>
    );
  }
}

export default injectSheet(styles)(Settings);
