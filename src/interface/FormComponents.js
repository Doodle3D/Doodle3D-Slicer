import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import injectSheet from 'react-jss';
import MaterialUISelectField from 'material-ui/SelectField'
import MaterialUICheckbox from 'material-ui/Checkbox';
import MaterialUITextField from 'material-ui/TextField';

const contextTypes = { state: PropTypes.object, onChange: PropTypes.func, disabled: PropTypes.bool };

export const SelectField = (props, context) => (
  <MaterialUISelectField
    { ...props }
    disabled={context.disabled}
    value={_.get(context.state, props.name)}
    onChange={(event, index, value) => context.onChange(props.name, value)}
  />
);
SelectField.contextTypes = contextTypes;

export const TextField = (props, context) => (
  <MaterialUITextField
    { ...props }
    disabled={context.disabled}
    value={_.get(context.state, props.name)}
    onChange={(event, value) => context.onChange(props.name, value)}
  />
);
TextField.contextTypes = contextTypes;

export const Checkbox = (props, context) => (
  <MaterialUICheckbox
    { ...props }
    disabled={context.disabled}
    checked={_.get(context.state, props.name)}
    onCheck={(event, value) => context.onChange(props.name, value)}
  />
);
Checkbox.contextTypes = contextTypes;
