import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import baseSettings from '../settings/default.yml';
import printerSettings from '../settings/printer.yml';
import materialSettings from '../settings/material.yml';
import qualitySettings from '../settings/quality.yml';
import { Tabs, Tab } from 'material-ui/Tabs';
import MenuItem from 'material-ui/MenuItem';
import injectSheet from 'react-jss';
import { SettingsGroup, SelectField, TextField, Checkbox } from './FormComponents.js';
import { grey500 } from 'material-ui/styles/colors';

const styles = {
  textFieldRow: {
    display: 'flex'
  },
  content: {
    maxHeight: '300px',
    overflowY: 'scroll'
  }
};

const DEFAULT_PRINTER = 'ultimaker2';
const DEFAULT_MATERIAL = 'pla';
const DEFAULT_QUALITY = 'medium';

const DEFAULT_SETTINGS = {
  'printer': printerSettings,
  'quality': qualitySettings,
  'material': materialSettings
};

class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      settings: {
        ...baseSettings,
        ...printerSettings[DEFAULT_PRINTER],
        ...qualitySettings[DEFAULT_MATERIAL],
        ...materialSettings[DEFAULT_MATERIAL],
        title: null
      },
      printer: DEFAULT_PRINTER,
      quality: DEFAULT_QUALITY,
      material: DEFAULT_MATERIAL
    };
  }

  changeSettings = (fieldName, value) => {
    switch (fieldName) {
      case 'printer':
      case 'quality':
      case 'material':
        this.setState({
          [fieldName]: value,
          settings: {
            ...this.state.settings,
            ...DEFAULT_SETTINGS[fieldName][value],
            title: null
          }
        });
        break;

      default:
        this.setState(_.set(this.state, fieldName, value));
        break;
    }
  };

  getChildContext() {
    return { state: this.state };
  }

  render() {
    const { classes } = this.props;

    return (
      <Tabs>
        <Tab label="basic settings">
          <div className={classes.content}>
            <SelectField name="printer" floatingLabelText="Printer" fullWidth onChange={this.changeSettings}>
              {Object.entries(printerSettings).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
            <SelectField name="quality" floatingLabelText="Quality" fullWidth onChange={this.changeSettings}>
              {Object.entries(qualitySettings).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
            <SelectField name="material" floatingLabelText="Material" fullWidth onChange={this.changeSettings}>
              {Object.entries(materialSettings).map(([value, { title }]) => (
                <MenuItem key={value} value={value} primaryText={title} />
              ))}
            </SelectField>
          </div>
        </Tab>
        <Tab label="advanced settings">
          <div className={classes.content}>
            <SettingsGroup name="Printer dimensions">
              <div className={classes.textFieldRow}>
                <TextField name="settings.dimensions.x" fullWidth floatingLabelText="X" type="number" onChange={this.changeSettings} />
                <TextField name="settings.dimensions.y" fullWidth floatingLabelText="Y" type="number" onChange={this.changeSettings} />
                <TextField name="settings.dimensions.z" fullWidth floatingLabelText="Z" type="number" onChange={this.changeSettings} />
              </div>
            </SettingsGroup>
            <SettingsGroup name="Nozzle">
              <TextField name="settings.nozzleDiameter" fullWidth floatingLabelText="Diameter" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Bed">
              <TextField name="settings.bedTemperature" fullWidth floatingLabelText="Temperature" type="number" onChange={this.changeSettings} />
              <Checkbox name="settings.heatedBed" label="Heated" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Material">
              <TextField name="settings.filamentThickness" fullWidth floatingLabelText="Thickness" type="number" onChange={this.changeSettings} />
              <TextField name="settings.temperature" fullWidth floatingLabelText="Temperature" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Thickness">
              <TextField name="settings.thickness.top" fullWidth floatingLabelText="top" type="number" onChange={this.changeSettings} />
              <TextField name="settings.thickness.bottom" fullWidth floatingLabelText="bottom" type="number" onChange={this.changeSettings} />
              <TextField name="settings.thickness.shell" fullWidth floatingLabelText="shell" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Retraction">
              <Checkbox name="settings.retraction.enabled" label="Enabled" onChange={this.changeSettings} />
              <TextField name="settings.retraction.amount" fullWidth floatingLabelText="Amount" type="number" onChange={this.changeSettings} />
              <TextField name="settings.retraction.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.retraction.minDistance" fullWidth floatingLabelText="Min distance" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Travel">
              <TextField name="settings.travel.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <Checkbox name="settings.combing" label="Combing" />
            </SettingsGroup>
            <SettingsGroup name="Inner shell">
              <TextField name="settings.innerShell.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.innerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Outer shell">
              <TextField name="settings.outerShell.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.outerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Inner infill">
              <TextField name="settings.innerInfill.gridSize" fullWidth floatingLabelText="Grid size" type="number" onChange={this.changeSettings} />
              <TextField name="settings.innerInfill.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.innerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Outer infill">
              <TextField name="settings.outerInfill.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.outerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="Brim">
              <TextField name="settings.brim.offset" fullWidth floatingLabelText="Offset" type="number" onChange={this.changeSettings} />
              <TextField name="settings.brim.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.brim.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
            <SettingsGroup name="First layer">
              <TextField name="settings.firstLayer.speed" fullWidth floatingLabelText="Speed" type="number" onChange={this.changeSettings} />
              <TextField name="settings.firstLayer.flowRate" fullWidth floatingLabelText="Flow rate" type="number" onChange={this.changeSettings} />
            </SettingsGroup>
          </div>
        </Tab>
      </Tabs>
    );
  }
}
Settings.childContextTypes = {
  state: PropTypes.object
};
Settings.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  onChange: PropTypes.func
};

export default injectSheet(styles)(Settings);
