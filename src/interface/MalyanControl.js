import React from 'react';
import PropTypes from 'proptypes';
import muiThemeable from 'material-ui/styles/muiThemeable';
import injectSheet from 'react-jss';
import FlatButton from 'material-ui/FlatButton';
import { sleep, getMalyanStatus } from './utils.js';

const styles = {

};

class MalyanControl extends React.Component {
  static propTypes = {
    ip: PropTypes.string.isRequired
  };

  state = {
    status: null,
    mounted: true
  };

  componentDidMount = async () => {
    const { ip } = this.props;
    while (this.state.mounted) {
      const status = await getMalyanStatus(ip).catch(() => null);
      this.setState({ status });
      await sleep(1000);
    }
  };

  home = () => {
    const { ip } = this.props;
    fetch(`http://${ip}/set?code=G28`, { method: 'GET' });
  };

  stop = () => {
    const { ip } = this.props;
    fetch(`http://${ip}/set?cmd={P:X}`, { method: 'GET' });
  };

  componentWillUnmount() {
    this.setState({ mounted: false });
  }

  render() {
    const { status } = this.state;
    return (
      <div>
        {status && <span>
          <p>Nozzle temperature: {status.nozzleTemperature}/{status.nozzleTargetTemperature}</p>
          <p>Bed temperature: {status.bedTemperature}/{status.bedTargetTemperature}</p>
          {status.state === 'printing' && <p>Progress: {status.progress}%</p>}
        </span>}
        <FlatButton label="Stop" onTouchTap={this.stop} />
        <FlatButton label="Home" onTouchTap={this.home} />
      </div>
    );
  }
}

export default muiThemeable()(injectSheet(styles)(MalyanControl));
