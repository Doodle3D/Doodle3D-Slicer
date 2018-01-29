import React from 'react';
import PropTypes from 'proptypes';
import muiThemeable from 'material-ui/styles/muiThemeable';
import injectSheet from 'react-jss';
import FlatButton from 'material-ui/FlatButton';
import { sleep, getMalyanStatus } from './utils.js';
import { Doodle3DBox } from 'doodle3d-api';

const styles = {

};

class WifiBoxControl extends React.Component {
  static propTypes = {
    ip: PropTypes.string.isRequired
  };

  state = {
    box: null,
    status: null
  };

  componentDidMount = async () => {
    const { ip } = this.props;

    const box = new Doodle3DBox(ip);
    window.d3dbox = box;
    box.addEventListener('update', ({ state }) => this.setState({ status: state }));
    box.setAutoUpdate(true, 5000);

    this.setState({ box });

    const alive = await box.checkAlive();
  };

  stop = async () => {
    const { box } = this.state;
    const result = await box.printer.stop();
    console.log('result: ', result);
  };

  componentWillUnmount() {
    const { box } = this.state;
    if (box) box.setAutoUpdate(false);

    this.setState({ mounted: false });
  }

  render() {
    const { status } = this.state;

    return (
      <div>
        <FlatButton label="Stop" onTouchTap={this.stop} />
      </div>
    );
  }
}

export default muiThemeable()(injectSheet(styles)(WifiBoxControl));
