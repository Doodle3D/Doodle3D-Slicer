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
import infillSettings from '../settings/infill.yml';
import update from 'react-addons-update';
import SettingsIcon from 'material-ui-icons/Settings';
import ExitToAppIcon from 'material-ui-icons/ExitToApp';
import validateIp from 'validate-ip';
import Accordion from './Accordion.js';

const styles = {
  textFieldRow: {
    display: 'flex',
    alignItems: 'center'
  },
  container: {
    width: '100%',
    flexGrow: 1,
    overflowY: 'auto',
    '& p': {
      // fontWeight: 'bold',
      margin: '30px 0 0 0'
    },
    '& h3': {
      fontWeight: 'bold',
      marginTop: '20px',
      marginBottom: '20px'
    }
  },
  error: {
    color: red500
  }
};

const updateLocalStorage = (localStorage) => {
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localStorage));
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

class Settings extends React.Component {
  static propTypes = {
    selectedPrinter: PropTypes.string,
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
      ip: '',
      error: null
    },
    managePrinter: {
      open: false
    }
  };

  componentDidMount() {
    const { onChange, selectedPrinter } = this.props;
    const { localStorage } = this.state;

    if (selectedPrinter && localStorage.active) {
      const activePrinter = selectedPrinter && Object.values(localStorage.printers)
        .find(({ ip }) => ip === selectedPrinter);

      if (activePrinter) {
        const state = this.changeSettings('activePrinter', activePrinter.key);
        if (onChange) onChange(this.constructSettings(state.localStorage));
      } else {
        this.openAddPrinterDialog({ ip: selectedPrinter });
      }
    } else if (!selectedPrinter && localStorage.active) {
      if (onChange) onChange(this.constructSettings(localStorage));
    } else if (selectedPrinter && !localStorage.active) {
      this.openAddPrinterDialog({ ip: selectedPrinter });
    } else if (!selectedPrinter && !localStorage.active) {
      this.openAddPrinterDialog();
    }
  }

  changeSettings = (fieldName, value) => {
    const { onChange } = this.props;
    const { localStorage } = this.state;

    let state = _.cloneDeep(this.state);

    switch (fieldName) {
      case 'managePrinter.printer':
      case 'managePrinter.name':
      case 'managePrinter.ip':
        state = _.set(state, fieldName, value);
        state = update(state, { managePrinter: { error: { $set: null } } });
        break;

      case 'addPrinter.printer':
      case 'addPrinter.name':
      case 'addPrinter.ip':
        state = _.set(state, fieldName, value);
        if (fieldName === 'addPrinter.printer') {
          state = update(state, { addPrinter: { name: { $set: printerSettings[value].title } } });
        }
        state = update(state, { addPrinter: { error: { $set: null } } });
        break;

      case 'activePrinter':
        if (value !== 'add_printer') state = update(state, { localStorage: { active: { $set: value } } });
        break;

      case 'settings.infill':
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
      case 'settings.support.enabled':
      case 'settings.support.speed':
      case 'settings.support.distanceY':
      case 'settings.support.density':
      case 'settings.support.minArea':
      case 'settings.support.margin':
      case 'settings.support.flowRate':
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

    return state;
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

    const { ip, settings: { printer, material, quality, infill, advanced } } = localStorage.printers[localStorage.active];
    let settings = {
      ...defaultSettings,
      printer,
      material,
      quality,
      infill,
      ip
    };

    settings = _.merge({}, settings, printerSettings[printer]);
    settings = _.merge({}, settings, qualitySettings[quality]);
    settings = _.merge({}, settings, infillSettings[infill]);
    settings = _.merge({}, settings, materialSettings[material]);

    for (const key in advanced) {
      const value = advanced[key];
      settings = _.set(_.cloneDeep(settings), key.replace('settings.', ''), value);
    }

    return settings;
  }

  addPrinter = () => {
    const { name, printer, ip } = this.state.addPrinter;

    if (!name || !printer) {
      this.setState(update(this.state, { addPrinter: { error: { $set: 'Please enter a name and printer' } } }));
      return;
    }
    if (printer === 'doodle3d_printer' && ip !== '' && !validateIp(ip)) {
      this.setState(update(this.state, { addPrinter: { error: { $set: 'Please enter a valid IP adress' } } }));
      return;
    }

    const id = shortid.generate();
    const localStorage = {
      active: id,
      printers: {
        ...this.state.localStorage.printers,
        [id]: { name, ip, settings: { printer, material: 'pla', infill: '20pct', quality: 'medium', advanced: {} } }
      }
    };
    this.setState({ localStorage });
    updateLocalStorage(localStorage);

    this.closeAddPrinterDialog();

    const { onChange } = this.props;
    if (onChange) onChange(this.constructSettings(localStorage));
  };

  editPrinter = () => {
    const { localStorage: { active }, managePrinter: { printer, name, ip } } = this.state;

    if (!name) {
      this.setState(update(this.state, {
        managePrinter: {
          error: { $set: 'Please enter a name' }
        }
      }));
      return;
    }
    if (printer === 'doodle3d_printer' && !validateIp(ip)) {
      this.setState(update(this.state, {
        managePrinter: {
          error: { $set: 'Please enter a valid IP adress' }
        }
      }));
      return;
    }

    const localStorage = update(this.state.localStorage, {
      printers: {
        [active]: {
          name: { $set: name },
          ip: { $set: ip },
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

  closeAddPrinterDialog = (override) => this.setAddPrinterDialog(false, override);
  openAddPrinterDialog = (override) => this.setAddPrinterDialog(true, override);
  setAddPrinterDialog = (open, override = {}) => {
    this.setState({
      addPrinter: {
        ip: '',
        name: '',
        printer: '',
        error: null,
        open,
        ...override
      }
    });
  };

  closeManagePrinterDialog = () => this.setManagePrinterDialog(false);
  openManagePrinterDialog = () => this.setManagePrinterDialog(true);
  setManagePrinterDialog = (open) => {
    const { localStorage: { active, printers } } = this.state;

    this.setState({
      managePrinter: {
        open,
        name: printers[active].name,
        ip: printers[active].ip,
        printer: printers[active].settings.printer,
        error: null
      }
    });
  }

  render() {
    const { addPrinter, managePrinter, localStorage } = this.state;
    const { classes } = this.props;

    return (
      <div className={classes.container}>
        <div className={classes.textFieldRow}>
          <SelectField name="activePrinter" floatingLabelText="Printer" fullWidth>
            {Object.entries(localStorage.printers).map(([id, { name }]) => (
              <MenuItem key={id} value={id} primaryText={name} />
            ))}
            <Divider />
            <MenuItem onClick={this.openAddPrinterDialog} value="add_printer" primaryText="Add Printer" />
          </SelectField>
          {localStorage.active && <SettingsIcon
            onClick={this.openManagePrinterDialog}
            style={{ fill: grey800, marginLeft: '10px', cursor: 'pointer' }}
          />}
        </div>
        <SelectField name="settings.material" floatingLabelText="Material" fullWidth>
          {Object.entries(materialSettings).map(([value, { title }]) => (
            <MenuItem key={value} value={value} primaryText={title} />
          ))}
        </SelectField>
        <h3>Print Setup</h3>
        <Tabs>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Basic">
            <div>
              <SelectField name="settings.quality" floatingLabelText="Quality" fullWidth>
                {Object.entries(qualitySettings).map(([value, { title }]) => (
                  <MenuItem key={value} value={value} primaryText={title} />
                ))}
              </SelectField>
              <SelectField name="settings.infill" floatingLabelText="Infill" fullWidth>
                {Object.entries(infillSettings).map(([value, { title }]) => (
                  <MenuItem key={value} value={value} primaryText={title} />
                ))}
              </SelectField>
            </div>
          </Tab>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Advanced">
            <div>
              <Accordion elements={[{
                title: 'Layer',
                body: (<NumberField name="settings.layerHeight" min={0.05} max={3} fullWidth floatingLabelText="Height" />)
              }, {
                title: 'Thickness',
                body: (<span>
                  <NumberField name="settings.thickness.top" min={0} fullWidth floatingLabelText="top" />
                  <NumberField name="settings.thickness.bottom" min={0} fullWidth floatingLabelText="bottom" />
                  <NumberField name="settings.thickness.shell" min={0} fullWidth floatingLabelText="shell" />
                </span>)
              }, {
                title: 'Material',
                body: (<span>
                  <NumberField name="settings.filamentThickness" min={0.1} max={10} fullWidth floatingLabelText="Thickness" />
                  <NumberField name="settings.temperature" min={100} max={400} fullWidth floatingLabelText="Temperature" />
                </span>)
              }, {
                title: 'Bed',
                body: (<span>
                  <NumberField name="settings.bedTemperature" min={30} max={150} fullWidth floatingLabelText="Temperature" />
                  <Checkbox name="settings.heatedBed" label="Heated" />
                </span>)
              }, {
                title: 'Brim',
                body: (<span>
                  <NumberField name="settings.brim.size" min={0} max={20} fullWidth floatingLabelText="Size" />
                  <NumberField name="settings.brim.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.brim.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Support',
                body: (<span>
                  <Checkbox name="settings.support.enabled" label="Enabled" />
                  <NumberField name="settings.support.distanceY" min={0.1} fullWidth floatingLabelText="Distance Y" />
                  <NumberField name="settings.support.density" min={0} max={100} fullWidth floatingLabelText="Density" />
                  <NumberField name="settings.support.margin" min={0.1} fullWidth floatingLabelText="Margin" />
                  <NumberField name="settings.support.minArea" min={1} fullWidth floatingLabelText="Min Area" />
                  <NumberField name="settings.support.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.support.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'First layer',
                body: (<span>
                  <NumberField name="settings.firstLayer.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.firstLayer.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Inner shell',
                body: (<span>
                  <NumberField name="settings.innerShell.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.innerShell.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Outer shell',
                body: (<span>
                  <NumberField name="settings.outerShell.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.outerShell.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Inner infill',
                body: (<span>
                  <NumberField name="settings.innerInfill.density" min={0} max={100} fullWidth floatingLabelText="Density" />
                  <NumberField name="settings.innerInfill.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.innerInfill.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Outer infill',
                body: (<span>
                  <NumberField name="settings.outerInfill.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.outerInfill.flowRate" min={0.1} max={4} fullWidth floatingLabelText="Flow rate" />
                </span>)
              }, {
                title: 'Travel',
                body: (<span>
                  <NumberField name="settings.travel.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <Checkbox name="settings.combing" label="Combing" />
                </span>)
              }, {
                title: 'Retraction',
                body: (<span>
                  <Checkbox name="settings.retraction.enabled" label="Enabled" />
                  <NumberField name="settings.retraction.amount" min={0} max={10} fullWidth floatingLabelText="Amount" />
                  <NumberField name="settings.retraction.speed" min={10} max={200} fullWidth floatingLabelText="Speed" />
                  <NumberField name="settings.retraction.minDistance" min={0} fullWidth floatingLabelText="Min distance" />
                </span>)
              }, {
                title: 'Printer dimensions',
                body: (<span>
                  <div className={classes.textFieldRow}>
                  <NumberField name="settings.dimensions.x" min={1} fullWidth floatingLabelText="X" />
                  <NumberField name="settings.dimensions.y" min={1} fullWidth floatingLabelText="Y" />
                  <NumberField name="settings.dimensions.z" min={1} fullWidth floatingLabelText="Z" />
                </div>
                </span>)
              }, {
                title: 'Nozzle',
                body: (<span>
                  <NumberField name="settings.nozzleDiameter" min={0.1} max={5} fullWidth floatingLabelText="Diameter" />
                </span>)
              }]} />
            </div>
          </Tab>
        </Tabs>
        {printDialog(this.props, this.state, 'Add Printer', 'addPrinter', 'Add', addPrinter, localStorage.active && this.closeAddPrinterDialog, null, this.addPrinter)}
        {printDialog(this.props, this.state, 'Manage Printer', 'managePrinter', 'Save', managePrinter, this.closeManagePrinterDialog, this.removeActivePrinter, this.editPrinter)}
      </div>
    );
  }
}

function printDialog(props, state, title, form, submitText, data, closeDialog, removeActivePrinter, save) {
  const { classes } = props;

  return (
    <Dialog
      title={title}
      open={data.open}
      onRequestClose={closeDialog ? closeDialog : null}
      contentStyle={{ maxWidth: '400px' }}
      autoScrollBodyContent
      actions={[
        closeDialog && <FlatButton
          label="Close"
          onClick={closeDialog}
        />,
        removeActivePrinter && <FlatButton
          label="Remove Printer"
          onClick={removeActivePrinter}
        />,
        <RaisedButton
          label={submitText}
          primary
          onClick={save}
        />
      ]}
    >
      <SelectField name={`${form}.printer`} floatingLabelText="Printer" fullWidth>
        {Object.entries(printerSettings).map(([value, { title }]) => (
          <MenuItem key={value} value={value} primaryText={title} />
        ))}
      </SelectField>
      {data.error && <p className={classes.error}>{data.error}</p>}
    </Dialog>
  );
}
printDialog.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string)
};

export default injectSheet(styles)(Settings);
