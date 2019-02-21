import React from 'react';
import PropTypes from 'proptypes';
import injectSheet from 'react-jss';
import ExpandIcon from 'material-ui-icons/ExpandMore';

const styles = {
  button: {
    cursor: 'pointer'
  },
  body: {
    overflow: 'hidden'
  },
  closed: {
    maxHeight: '0px'
  },
  title: {
    userSelect: 'none',
    display: 'flex',
    alignItems: 'flex-end'
  }
};

class Accordion extends React.Component {
  static propTypes = {
    elements: PropTypes.arrayOf(PropTypes.shape({ body: PropTypes.node, title: PropTypes.string })),
    classes: PropTypes.objectOf(PropTypes.string)
  };
  static defaultProps: {
    elements: []
  };

  state = {
    openAccordion: null
  };

  changeAccordion = (name) => {
    const { openAccordion } = this.state;
    if (openAccordion === name) {
      this.setState({ openAccordion: null });
    } else {
      this.setState({ openAccordion: name });
    }
  };

  render() {
    const { openAccordion } = this.state;
    const { elements, classes } = this.props;

    return elements.map(({ body, title }, i) => (
      <span key={i}>
        <span onClick={() => this.changeAccordion(title)} className={classes.title}>
          <ExpandIcon />
          <p style={{
            fontWeight: openAccordion === title ? 'bold' : 'normal'
          }} className={classes.button}>{title}</p>
        </span>
        <div className={`${classes.body} ${openAccordion === title ? '' : classes.closed}`}>
          {body}
        </div>
      </span>
    ));
  }
}

export default injectSheet(styles)(Accordion);
