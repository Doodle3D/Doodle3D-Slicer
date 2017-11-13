import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import MenuItem from 'material-ui/MenuItem';
import injectSheet from 'react-jss';
import { SettingsGroup, SelectField, TextField, Checkbox } from './FormComponents.js';
import { grey500 } from 'material-ui/styles/colors';

const styles = {
  textFieldRow: {
    display: 'flex'
  }
};

class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: props.initialSettings,
      printers: props.defaultPrinter,
      quality: props.defaultQuality,
      material: props.defaultMaterial
    };
  }

  changeSettings = (fieldName, value) => {
    const { onChange } = this.props;

    let state;
    switch (fieldName) {
      case 'printer':
      case 'quality':
      case 'material':
        state = {
          [fieldName]: value,
          settings: _.merge({}, this.state.settings, this.props[fieldName][value])
        };
        break;

      default:
        state = _.set(_.cloneDeep(this.state), fieldName, value);
        break;
    }
    if (onChange) onChange(state);
    if (state) this.setState(state);
  };

  getChildContext() {
    return { state: this.state, onChange: this.changeSettings };
  }

  render() {
    const { classes, printers, quality, material } = this.props;

    return (
      <Tabs>
        <Tab label="basic">
          <div>
            <SelectField name="printer" floatingLabelText="Printer" fullWidth>
              {Object.entries(printers).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
            <SelectField name="quality" floatingLabelText="Quality" fullWidth>
              {Object.entries(quality).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
            <SelectField name="material" floatingLabelText="Material" fullWidth>
              {Object.entries(material).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
          </div>
        </Tab>
        <Tab label="advanced">
          <div>
            <SettingsGroup name="Printer dimensions">
              <div className={classes.textFieldRow}>
                <TextField name="settings.dimensions.x" fullWidth floatingLabelText="X" type="number" />
                <TextField name="settings.dimensions.y" fullWidth floatingLabelText="Y" type="number" />
                <TextField name="settings.dimensions.z" fullWidth floatingLabelText="Z" type="number" />
              </div>
            </SettingsGroup>
            <SettingsGroup name="Nozzle">
              <TextField name="settings.nozzleDiameter" fullWidth floatingLabelText="Diameter" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Bed">
              <TextField name="settings.bedTemperature" fullWidth floatingLabelText="Temperature" type="number" />
              <Checkbox name="settings.heatedBed" label="Heated" />
            </SettingsGroup>
            <SettingsGroup name="Material">
              <TextField name="settings.filamentThickness" fullWidth floatingLabelText="Thickness" type="number" />
              <TextField name="settings.temperature" fullWidth floatingLabelText="Temperature" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Thickness">
              <TextField name="settings.thickness.top" fullWidth floatingLabelText="top" type="number" />
              <TextField name="settings.thickness.bottom" fullWidth floatingLabelText="bottom" type="number" />
              <TextField name="settings.thickness.shell" fullWidth floatingLabelText="shell" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Retraction">
              <Checkbox name="settings.retraction.enabled" label="Enabled" />
              <TextField name="settings.retraction.amount" fullWidth floatingLabelText="Amount" type="number" />
              <TextField name="settings.retraction.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.retraction.minDistance" fullWidth floatingLabelText="Min distance" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Travel">
              <TextField name="settings.travel.speed" fullWidth floatingLabelText="Speed" type="number" />
              <Checkbox name="settings.combing" label="Combing" />
            </SettingsGroup>
            <SettingsGroup name="Inner shell">
              <TextField name="settings.innerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Outer shell">
              <TextField name="settings.outerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Inner infill">
              <TextField name="settings.innerInfill.gridSize" fullWidth floatingLabelText="Grid size" type="number" />
              <TextField name="settings.innerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Outer infill">
              <TextField name="settings.outerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
            <SettingsGroup name="Brim">
              <TextField name="settings.brim.offset" fullWidth floatingLabelText="Offset" type="number" />
              <TextField name="settings.brim.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.brim.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
            <SettingsGroup name="First layer">
              <TextField name="settings.firstLayer.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.firstLayer.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </SettingsGroup>
          </div>
        </Tab>
      </Tabs>
    );
  }
}
Settings.childContextTypes = { state: PropTypes.object, onChange: PropTypes.func };
Settings.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func,
  printers: PropTypes.object.isRequired,
  defaultPrinter: PropTypes.string.isRequired,
  quality: PropTypes.object.isRequired,
  defaultQuality: PropTypes.string.isRequired,
  material: PropTypes.object.isRequired,
  defaultMaterial: PropTypes.string.isRequired,
  initialSettings: PropTypes.object.isRequired
};

export default injectSheet(styles)(Settings);
