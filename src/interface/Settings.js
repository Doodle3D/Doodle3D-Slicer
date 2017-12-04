import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import { Tabs, Tab } from 'material-ui/Tabs';
import MenuItem from 'material-ui/MenuItem';
import injectSheet from 'react-jss';
import { SelectField, TextField, Checkbox } from './FormComponents.js';
import { grey800, cyan500 } from 'material-ui/styles/colors';

const styles = {
  textFieldRow: {
    display: 'flex'
  },
  text: {
    fontWeight: 'bold',
    color: grey800
  },
  container: {
    width: '100%',
    flexGrow: 1,
    overflowY: 'auto'
  }
};

class Settings extends React.Component {
  static childContextTypes = { state: PropTypes.object, onChange: PropTypes.func, disabled: PropTypes.bool };
  static defaultProps: {
    disabled: false
  };
  static propTypes = {
    classes: PropTypes.objectOf(PropTypes.string),
    onChange: PropTypes.func,
    printers: PropTypes.object.isRequired,
    defaultPrinter: PropTypes.string.isRequired,
    quality: PropTypes.object.isRequired,
    defaultQuality: PropTypes.string.isRequired,
    material: PropTypes.object.isRequired,
    defaultMaterial: PropTypes.string.isRequired,
    initialSettings: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired
  };
  constructor(props) {
    super();
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
      case 'printers':
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
    return { state: this.state, onChange: this.changeSettings, disabled: this.props.disabled };
  }

  render() {
    const { classes, printers, quality, material, disabled } = this.props;

    return (
      <div className={classes.container}>
        <SelectField name="printers" floatingLabelText="Printer" fullWidth>
          {Object.entries(printers).map(([value, { title }]) => (
            <MenuItem key={value} value={value} primaryText={title} />
          ))}
        </SelectField>
        <SelectField name="material" floatingLabelText="Material" fullWidth>
          {Object.entries(material).map(([value, { title }]) => (
            <MenuItem key={value} value={value} primaryText={title} />
          ))}
        </SelectField>
        <h3 className={classes.text}>Printer Setup</h3>
        <Tabs inkBarStyle={{ backgroundColor: cyan500 }}>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Basic">
            <div>
              <SelectField name="quality" floatingLabelText="Quality" fullWidth>
                {Object.entries(quality).map(([value, { title }]) => (
                  <MenuItem key={value} value={value} primaryText={title} />
                ))}
              </SelectField>
            </div>
          </Tab>
          <Tab buttonStyle={{ color: grey800, backgroundColor: 'white' }} label="Advanced">
            <div>
              <p className={classes.text}>Printer dimensions</p>
              <div className={classes.textFieldRow}>
                <TextField name="settings.dimensions.x" fullWidth floatingLabelText="X" type="number" />
                <TextField name="settings.dimensions.y" fullWidth floatingLabelText="Y" type="number" />
                <TextField name="settings.dimensions.z" fullWidth floatingLabelText="Z" type="number" />
              </div>
              <p className={classes.text}>Nozzle</p>
              <TextField name="settings.nozzleDiameter" fullWidth floatingLabelText="Diameter" type="number" />
              <p className={classes.text}>Bed</p>
              <TextField name="settings.bedTemperature" fullWidth floatingLabelText="Temperature" type="number" />
              <Checkbox name="settings.heatedBed" label="Heated" />
              <p className={classes.text}>Material</p>
              <TextField name="settings.filamentThickness" fullWidth floatingLabelText="Thickness" type="number" />
              <TextField name="settings.temperature" fullWidth floatingLabelText="Temperature" type="number" />
              <p className={classes.text}>Thickness</p>
              <TextField name="settings.thickness.top" fullWidth floatingLabelText="top" type="number" />
              <TextField name="settings.thickness.bottom" fullWidth floatingLabelText="bottom" type="number" />
              <TextField name="settings.thickness.shell" fullWidth floatingLabelText="shell" type="number" />
              <p className={classes.text}>Retraction</p>
              <Checkbox name="settings.retraction.enabled" label="Enabled" />
              <TextField name="settings.retraction.amount" fullWidth floatingLabelText="Amount" type="number" />
              <TextField name="settings.retraction.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.retraction.minDistance" fullWidth floatingLabelText="Min distance" type="number" />
              <p className={classes.text}>Travel</p>
              <TextField name="settings.travel.speed" fullWidth floatingLabelText="Speed" type="number" />
              <Checkbox name="settings.combing" label="Combing" />
              <p className={classes.text}>Inner shell</p>
              <TextField name="settings.innerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p className={classes.text}>Outer shell</p>
              <TextField name="settings.outerShell.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerShell.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p className={classes.text}>Inner infill</p>
              <TextField name="settings.innerInfill.gridSize" fullWidth floatingLabelText="Grid size" type="number" />
              <TextField name="settings.innerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.innerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p className={classes.text}>Outer infill</p>
              <TextField name="settings.outerInfill.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.outerInfill.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p className={classes.text}>Brim</p>
              <TextField name="settings.brim.offset" fullWidth floatingLabelText="Offset" type="number" />
              <TextField name="settings.brim.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.brim.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
              <p className={classes.text}>First layer</p>
              <TextField name="settings.firstLayer.speed" fullWidth floatingLabelText="Speed" type="number" />
              <TextField name="settings.firstLayer.flowRate" fullWidth floatingLabelText="Flow rate" type="number" />
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  }
}

export default injectSheet(styles)(Settings);
