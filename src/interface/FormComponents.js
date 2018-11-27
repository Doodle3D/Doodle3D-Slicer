import React from 'react';
import PropTypes from 'proptypes';
import _ from 'lodash';
import MaterialUISelectField from 'material-ui/SelectField';
import MaterialUICheckbox from 'material-ui/Checkbox';
import TextFieldIcon from 'material-ui-textfield-icon';
import RefreshIcon from 'material-ui-icons/Refresh';
import muiThemeable from 'material-ui/styles/muiThemeable';

export const contextTypes = {
  settings: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
  addPrinter: PropTypes.object.isRequired,
  managePrinter: PropTypes.object.isRequired,
  advancedFields: PropTypes.array.isRequired,
  activePrinter: PropTypes.string
};
const propTypes = {
  name: PropTypes.string.isRequired,
  muiTheme: PropTypes.object.isRequired
};

export const _SelectField = ({ name, muiTheme, ...props }, context) => (
  <MaterialUISelectField
    {...props}
    disabled={context.disabled}
    value={_.get(context, name)}
    onChange={(event, index, value) => context.onChange(name, value)}
  />
);
_SelectField.contextTypes = contextTypes;
_SelectField.propTypes = propTypes;
export const SelectField = muiThemeable()(_SelectField);

const _TextField = ({ name, muiTheme: { palette }, ...props }, context) => (
  <TextFieldIcon
    {...props}
    icon={context.advancedFields.includes(name) && <RefreshIcon
      style={{ fill: palette.textColor }}
      onClick={() => context.onChange(name, null)}
    />}
    floatingLabelStyle={{
      color: context.advancedFields.includes(name) ? palette.primary1Color : palette.primary3Color
    }}
    disabled={context.disabled}
    value={_.get(context, name)}
    onChange={(event, value) => context.onChange(name, value)}
  />
);
_TextField.contextTypes = contextTypes;
_TextField.propTypes = propTypes;
export const TextField = muiThemeable()(_TextField);

const _NumberField = ({ name, min, max, muiTheme: { palette }, ...props }, context) => (
  <TextFieldIcon
    {...props}
    type="number"
    icon={context.advancedFields.includes(name) && <RefreshIcon
      style={{ fill: palette.textColor }}
      onClick={() => context.onChange(name, null)}
    />}
    floatingLabelStyle={{
      color: context.advancedFields.includes(name) ? palette.primary1Color : palette.primary3Color
    }}
    disabled={context.disabled}
    value={_.get(context, name.toString())}
    onChange={(event, value) => {
      value = parseFloat(value);
      context.onChange(name, value);
    }}
    onBlur={() => {
      const value = _.get(context, name.toString());
      let newValue = value;
      if (typeof min === 'number') newValue = Math.max(newValue, min);
      if (typeof max === 'number') newValue = Math.min(newValue, max);
      if (newValue !== value) context.onChange(name, newValue);
    }}
  />
);
_NumberField.contextTypes = contextTypes;
_NumberField.propTypes = propTypes;
export const NumberField = muiThemeable()(_NumberField);

const _Checkbox = ({ name, muiTheme: { palette }, ...props }, context) => (
  <span style={{ display: 'flex', position: 'relative' }}>
    <MaterialUICheckbox
      {...props}
      style={{ display: 'block' }}
      iconStyle={{
        fill: context.advancedFields.includes(name) ? palette.primary1Color : palette.primary3Color
      }}
      disabled={context.disabled}
      checked={_.get(context, name)}
      onCheck={(event, value) => context.onChange(name, value)}
    />
    {context.advancedFields.includes(name) && <RefreshIcon
      onClick={() => context.onChange(name, null)}
    />}
  </span>
);
_Checkbox.contextTypes = contextTypes;
_Checkbox.propTypes = propTypes;
export const Checkbox = muiThemeable()(_Checkbox);
