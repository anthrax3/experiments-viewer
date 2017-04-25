import React from 'react';
import { connect } from 'react-redux';

import * as metricApi from '../../api/metric-api';
import * as urlApi from '../../api/url-api';
import * as datasetApi from '../../api/dataset-api';
import * as datasetActions from '../../actions/dataset-actions';
import store from '../../store';


/**
 * A container that does groundwork needed by several other components, like
 * processing URL parameters.
 */
class AppContainer extends React.Component {
  constructor(props) {
    super(props);
    this.currentDataset = {};
    this.populationsToShow = [];
  }

  componentWillMount() {
    urlApi.addMissingQueryParameters(this.props.location.query);
    metricApi.getMetricMetadata();
    datasetApi.getDatasets();
  }

  _isALL(qpKey) {
    return qpKey && qpKey === 'ALL';
  }

  _processProps(props) {
    this.datasetId = urlApi.getDatasetId(props.location);

    const showAllMetrics = this._isALL(props.location.query.metrics);
    const showAllPopulations = this._isALL(props.location.query.pop);

    this.allMetricIds = Object.keys(props.metricMetadata);
    if (showAllMetrics) {
      this.metricIdsToShow = this.allMetricIds;
    } else {
      this.metricIdsToShow = urlApi.getMetricIds(props.location);
    }

    if (showAllPopulations) {
      this.populationsToShow = this.currentDataset.populations;
    } else {
      this.populationsToShow = urlApi.getPopulationNames(props.location);
    }

    // Validate input
    switch (props.location.query.scale) {
      case 'linear':
      case 'log':
        this.scale = props.location.query.scale;
    }

    // Validate input and convert to boolean
    //
    // If the URL contains...  |  this.showOutliers is...
    // --------------------------------------------------
    // showOutliers=true       |  true
    // showOutliers=false      |  false
    // Anything else           |  false
    if (props.location.query && props.location.query.showOutliers) {
      this.showOutliers = props.location.query.showOutliers === 'true';
    }
  }

  componentWillUpdate(nextProps) {
    if (this.datasetId && nextProps.datasets.length > 0) {
      this.currentDataset = nextProps.datasets.find(ds => ds.id === this.datasetId) || {};
      store.dispatch(datasetActions.changeDataset(this.currentDataset));
    }
    this._processProps(nextProps);
  }

  render() {
    // If we don't have dataset metadata yet, we can't render any charts. We
    // could in theory temporarily show the "No data" message until the data
    // comes through, but that would look weird.
    if (this.props.datasets.length === 0) return null;

    // Pass some props to the child component
    return React.cloneElement(this.props.children, {
      datasetId: this.datasetId,
      currentDataset: this.currentDataset,

      scale: this.scale,
      showOutliers: this.showOutliers,
      metricMetadata: this.props.metricMetadata,

      populationsToShow: this.populationsToShow,
      metricIdsToShow: this.metricIdsToShow,
      allMetricIds: this.allMetricIds,
    });
  }
}

const mapStateToProps = function(store, ownProps) {
  return {
    datasets: store.datasetState.datasets,
    metricMetadata: store.metricMetadataState.metadata,
  };
};

export default connect(mapStateToProps)(AppContainer);
