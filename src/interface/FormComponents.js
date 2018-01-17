import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import injectSheet from 'react-jss';
import MaterialUISelectField from 'material-ui/SelectField'
import MaterialUICheckbox from 'material-ui/Checkbox';
import { blue500, grey500 } from 'material-ui/styles/colors';
import TextFieldIcon from 'material-ui-textfield-icon';
import RefreshIcon from 'material-ui-icons/Refresh';

const contextTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  addPrinter: PropTypes.object.isRequired,
  managePrinter: PropTypes.object.isRequired,
  advancedFields: PropTypes.array.isRequired,
  activePrinter: PropTypes.string
};
const propTypes = {
  name: PropTypes.string.isRequired
};

export const SelectField = (props, context) => (
  <MaterialUISelectField
    {...props}
    disabled={context.disabled}
    value={_.get(context, props.name)}
    onChange={(event, index, value) => context.onChange(props.name, value)}
  />
);
SelectField.contextTypes = contextTypes;
SelectField.propTypes = propTypes;

export const TextField = (props, context) => (
  <TextFieldIcon
    {...props}
    icon={context.advancedFields.includes(props.name) && <RefreshIcon onTouchTap={() => context.onChange(props.name, null)} />}
    floatingLabelStyle={{ color: context.advancedFields.includes(props.name) ? blue500 : grey500 }}
    disabled={context.disabled}
    value={_.get(context, props.name)}
    onChange={(event, value) => context.onChange(props.name, props.type === 'number' ? parseFloat(value) : value)}
  />
);
TextField.contextTypes = contextTypes;
TextField.propTypes = propTypes;

export const Checkbox = (props, context) => (
  <span style={{ display: 'flex', position: 'relative' }}>
    <MaterialUICheckbox
      {...props}
      style={{ display: 'block' }}
      iconStyle={{ fill: context.advancedFields.includes(props.name) ? blue500 : grey500 }}
      disabled={context.disabled}
      checked={_.get(context, props.name)}
      onCheck={(event, value) => context.onChange(props.name, value)}
    />
    {context.advancedFields.includes(props.name) && <RefreshIcon onTouchTap={() => context.onChange(props.name, null)} />}
  </span>
);
Checkbox.contextTypes = contextTypes;
Checkbox.propTypes = propTypes;
