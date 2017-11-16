import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import injectSheet from 'react-jss';
import MaterialUISelectField from 'material-ui/SelectField'
import MaterialUICheckbox from 'material-ui/Checkbox';
import MaterialUITextField from 'material-ui/TextField';
import { grey100, grey300, grey500 } from 'material-ui/styles/colors';

const styles = {
  fieldSet: {
    border: 'none',
    backgroundColor: grey100,
    marginTop: '20px',
    '& legend': {
      fontFamily: 'sans-serif',
      border: `1px solid ${grey300}`,
      backgroundColor: 'white',
      padding: '3px 13px',
      color: grey500
    }
  }
};
export const SettingsGroup = injectSheet(styles)(({ name, classes, children }) => (
  <fieldset className={classes.fieldSet}>
    <legend>{name}</legend>
    {children}
  </fieldset>
));
SettingsGroup.propTypes = {
  classes: PropTypes.objectOf(PropTypes.string),
  name: PropTypes.string.isRequired,
  children: PropTypes.node
};

export const SelectField = (props, context) => (
  <MaterialUISelectField
    { ...props }
    value={_.get(context.state, props.name)}
    onChange={(event, index, value) => context.onChange(props.name, value)}
  />
);
SelectField.contextTypes = { state: PropTypes.object, onChange: PropTypes.func };

export const TextField = (props, context) => (
  <MaterialUITextField
    { ...props }
    value={_.get(context.state, props.name)}
    onChange={(event, value) => context.onChange(props.name, value)}
  />
);
TextField.contextTypes = { state: PropTypes.object, onChange: PropTypes.func };

export const Checkbox = (props, context) => (
  <MaterialUICheckbox
    { ...props }
    checked={_.get(context.state, props.name)}
    onCheck={(event, value) => context.onChange(props.name, value)}
  />
);
Checkbox.contextTypes = { state: PropTypes.object, onChange: PropTypes.func };
